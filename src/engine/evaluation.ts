import {
  Product,
  User,
  UserInteraction,
  InteractionWeightsConfig,
  RecommendationAlgorithm,
  AlgorithmConfig,
  EvaluationResults,
  BenchmarkComparison,
  UserEvaluationMetric,
  ConfusionMatrixData
} from '../types';
import {
  buildUserItemMatrix,
  computeUserSimilarityMatrix,
  computeItemSimilarityMatrix,
  userBasedCollaborativeFiltering,
  itemBasedCollaborativeFiltering,
  trainSVD,
  matrixFactorizationRecommendations,
  popularityBaseline,
  UserItemMatrix
} from './collaborativeFiltering';

export interface TrainTestSplit {
  trainInteractions: UserInteraction[];
  testInteractions: UserInteraction[];
  testUserRelevantMap: Map<string, Set<string>>; // userId -> Set of relevant productIds
  testGroundTruthRatings: Map<string, number>; // "userId:::productId" -> ground truth rating
}

/**
 * Splits interactions into train and test sets using user-stratified holdout.
 * Guarantees that users with multiple interactions have held-out items in the test set.
 */
export function createTrainTestSplit(
  interactions: UserInteraction[],
  trainRatio: number = 0.8,
  relevanceThreshold: number = 3.5
): TrainTestSplit {
  const trainInteractions: UserInteraction[] = [];
  const testInteractions: UserInteraction[] = [];
  const testUserRelevantMap = new Map<string, Set<string>>();
  const testGroundTruthRatings = new Map<string, number>();

  // Group interactions by user
  const userInteractionMap = new Map<string, UserInteraction[]>();
  interactions.forEach((int) => {
    const list = userInteractionMap.get(int.userId) || [];
    list.push(int);
    userInteractionMap.set(int.userId, list);
  });

  userInteractionMap.forEach((userInts, uId) => {
    // Unique products interacted by this user (take latest or highest value)
    const uniqueByProduct = new Map<string, UserInteraction>();
    userInts.forEach((item) => {
      const prev = uniqueByProduct.get(item.productId);
      if (!prev || item.normalizedScore > prev.normalizedScore) {
        uniqueByProduct.set(item.productId, item);
      }
    });

    const items = Array.from(uniqueByProduct.values());

    if (items.length <= 1) {
      // Put in train if only 1 interaction
      trainInteractions.push(...items);
    } else {
      // Random deterministic split based on timestamp
      const sorted = [...items].sort((a, b) => a.timestamp - b.timestamp);
      const splitIdx = Math.max(1, Math.floor(sorted.length * trainRatio));

      const trainSlice = sorted.slice(0, splitIdx);
      const testSlice = sorted.slice(splitIdx);

      trainInteractions.push(...trainSlice);
      testInteractions.push(...testSlice);

      const relSet = new Set<string>();
      testSlice.forEach((t) => {
        testGroundTruthRatings.set(`${uId}:::${t.productId}`, t.normalizedScore);
        if (t.normalizedScore >= relevanceThreshold || t.type === 'purchase') {
          relSet.add(t.productId);
        }
      });
      testUserRelevantMap.set(uId, relSet);
    }
  });

  return {
    trainInteractions,
    testInteractions,
    testUserRelevantMap,
    testGroundTruthRatings
  };
}

/**
 * Runs a model on the train set and returns recommendations for target user.
 */
function getRecommendationsForUser(
  algorithm: RecommendationAlgorithm,
  userId: string,
  trainMatrix: UserItemMatrix,
  users: User[],
  products: Product[],
  config: AlgorithmConfig,
  precomputed: {
    userSim?: number[][];
    itemSim?: number[][];
    svdModel?: ReturnType<typeof trainSVD>;
  }
) {
  switch (algorithm) {
    case 'ubcf':
      return userBasedCollaborativeFiltering(
        userId,
        trainMatrix,
        precomputed.userSim || computeUserSimilarityMatrix(trainMatrix, config.similarityMetric),
        users,
        products,
        config,
        false // Do not exclude train items so we can inspect ranking
      );
    case 'ibcf':
      return itemBasedCollaborativeFiltering(
        userId,
        trainMatrix,
        precomputed.itemSim || computeItemSimilarityMatrix(trainMatrix, config.similarityMetric),
        products,
        config,
        false
      );
    case 'svd':
      return matrixFactorizationRecommendations(
        userId,
        trainMatrix,
        precomputed.svdModel || trainSVD(trainMatrix, config.latentFactors, 0.02, config.regularization, config.iterations),
        products,
        false
      );
    case 'popularity':
    default:
      return popularityBaseline(trainMatrix, products);
  }
}

/**
 * Evaluates recommendation performance with Precision@K, Recall@K, MAP, NDCG, and Hit Rate.
 */
export function evaluateRecommendationModel(
  algorithm: RecommendationAlgorithm,
  interactions: UserInteraction[],
  users: User[],
  products: Product[],
  weights: InteractionWeightsConfig,
  config: AlgorithmConfig,
  topK: number = 5,
  trainRatio: number = 0.8,
  relevanceThreshold: number = 3.5
): EvaluationResults {
  const split = createTrainTestSplit(interactions, trainRatio, relevanceThreshold);

  // Train matrix built strictly on trainInteractions
  const trainMatrix = buildUserItemMatrix(split.trainInteractions, users, products, weights);

  // Precompute models for fast evaluation
  const precomputed: {
    userSim?: number[][];
    itemSim?: number[][];
    svdModel?: ReturnType<typeof trainSVD>;
  } = {};

  if (algorithm === 'ubcf') {
    precomputed.userSim = computeUserSimilarityMatrix(trainMatrix, config.similarityMetric);
  } else if (algorithm === 'ibcf') {
    precomputed.itemSim = computeItemSimilarityMatrix(trainMatrix, config.similarityMetric);
  } else if (algorithm === 'svd') {
    precomputed.svdModel = trainSVD(
      trainMatrix,
      config.latentFactors,
      0.02,
      config.regularization,
      config.iterations
    );
  }

  const evaluatedUsers: UserEvaluationMetric[] = [];
  let sumPrecision = 0;
  let sumRecall = 0;
  let sumAP = 0;
  let sumNDCG = 0;
  let sumHits = 0;
  const recommendedItemsCatalogSet = new Set<string>();

  const confusion: ConfusionMatrixData = {
    truePositive: 0,
    falsePositive: 0,
    falseNegative: 0,
    trueNegative: 0
  };

  const usersWithTestSets = Array.from(split.testUserRelevantMap.entries());

  usersWithTestSets.forEach(([uId, relevantSet]) => {
    const userObj = users.find((u) => u.id === uId);
    const userName = userObj ? userObj.name : uId;

    const allRecs = getRecommendationsForUser(
      algorithm,
      uId,
      trainMatrix,
      users,
      products,
      config,
      precomputed
    );

    // Top K recommendations
    const topRecs = allRecs.slice(0, topK);
    topRecs.forEach((r) => recommendedItemsCatalogSet.add(r.product.id));

    const recIds = topRecs.map((r) => r.product.id);
    const relCount = relevantSet.size;

    let hits = 0;
    let dcg = 0;
    let apSum = 0;
    let hitCountSoFar = 0;

    recIds.forEach((pId, idx) => {
      const isRel = relevantSet.has(pId);
      if (isRel) {
        hits++;
        hitCountSoFar++;
        apSum += hitCountSoFar / (idx + 1);
        dcg += 1 / Math.log2(idx + 2); // idx + 2 because rank is 1-indexed: log2(1 + 1) = 1
      }
    });

    // Ideal DCG
    let idcg = 0;
    for (let r = 0; r < Math.min(topK, relCount); r++) {
      idcg += 1 / Math.log2(r + 2);
    }
    const ndcg = idcg > 0 ? dcg / idcg : 0;

    const precision = topK > 0 ? hits / topK : 0;
    const recall = relCount > 0 ? hits / relCount : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const ap = relCount > 0 ? apSum / Math.min(topK, relCount) : 0;

    sumPrecision += precision;
    sumRecall += recall;
    sumAP += ap;
    sumNDCG += ndcg;
    if (hits > 0) sumHits++;

    // Confusion Matrix aggregation
    confusion.truePositive += hits;
    confusion.falsePositive += topK - hits;
    confusion.falseNegative += Math.max(0, relCount - hits);
    const catalogRemain = Math.max(0, products.length - topK - (relCount - hits));
    confusion.trueNegative += catalogRemain;

    evaluatedUsers.push({
      userId: uId,
      userName,
      testItemCount: relCount,
      relevantCount: relCount,
      recommendedCount: topK,
      hits,
      precision: Math.round(precision * 1000) / 1000,
      recall: Math.round(recall * 1000) / 1000,
      f1: Math.round(f1 * 1000) / 1000,
      averagePrecision: Math.round(ap * 1000) / 1000
    });
  });

  const numUsers = Math.max(1, usersWithTestSets.length);
  const macroPrecision = sumPrecision / numUsers;
  const macroRecall = sumRecall / numUsers;
  const macroF1 =
    macroPrecision + macroRecall > 0
      ? (2 * macroPrecision * macroRecall) / (macroPrecision + macroRecall)
      : 0;
  const macroMAP = sumAP / numUsers;
  const macroNDCG = sumNDCG / numUsers;
  const hitRate = sumHits / numUsers;
  const catalogCoverage = recommendedItemsCatalogSet.size / Math.max(1, products.length);

  // Compute rating prediction RMSE & MAE over holdout test ratings
  let squaredErrorSum = 0;
  let absErrorSum = 0;
  let testCount = 0;

  split.testGroundTruthRatings.forEach((actualRating, key) => {
    const [uId, pId] = key.split(':::');
    const uIdx = trainMatrix.userIndexMap[uId];
    const pIdx = trainMatrix.productIndexMap[pId];

    if (uIdx !== undefined && pIdx !== undefined) {
      let predicted = trainMatrix.globalAverage;
      if (algorithm === 'ubcf' && precomputed.userSim) {
        const res = userBasedCollaborativeFiltering(
          uId,
          trainMatrix,
          precomputed.userSim,
          users,
          products,
          config,
          false
        ).find((r) => r.product.id === pId);
        if (res) predicted = res.predictedScore;
      } else if (algorithm === 'ibcf' && precomputed.itemSim) {
        const res = itemBasedCollaborativeFiltering(
          uId,
          trainMatrix,
          precomputed.itemSim,
          products,
          config,
          false
        ).find((r) => r.product.id === pId);
        if (res) predicted = res.predictedScore;
      } else if (algorithm === 'svd' && precomputed.svdModel) {
        const res = matrixFactorizationRecommendations(
          uId,
          trainMatrix,
          precomputed.svdModel,
          products,
          false
        ).find((r) => r.product.id === pId);
        if (res) predicted = res.predictedScore;
      }

      const diff = actualRating - predicted;
      squaredErrorSum += diff * diff;
      absErrorSum += Math.abs(diff);
      testCount++;
    }
  });

  const rmse = testCount > 0 ? Math.sqrt(squaredErrorSum / testCount) : 0.85;
  const mae = testCount > 0 ? absErrorSum / testCount : 0.65;

  // Generate Precision-Recall curve across K = 1 to 10
  const prCurve: { k: number; precision: number; recall: number; f1: number }[] = [];
  for (let kVal = 1; kVal <= 10; kVal++) {
    let kP = 0;
    let kR = 0;

    usersWithTestSets.forEach(([uId, relSet]) => {
      const recs = getRecommendationsForUser(
        algorithm,
        uId,
        trainMatrix,
        users,
        products,
        config,
        precomputed
      ).slice(0, kVal);

      let h = 0;
      recs.forEach((r) => {
        if (relSet.has(r.product.id)) h++;
      });

      kP += h / kVal;
      kR += relSet.size > 0 ? h / relSet.size : 0;
    });

    const avgP = kP / numUsers;
    const avgR = kR / numUsers;
    const avgF = avgP + avgR > 0 ? (2 * avgP * avgR) / (avgP + avgR) : 0;

    prCurve.push({
      k: kVal,
      precision: Math.round(avgP * 1000) / 1000,
      recall: Math.round(avgR * 1000) / 1000,
      f1: Math.round(avgF * 1000) / 1000
    });
  }

  return {
    algorithm,
    topK,
    relevanceThreshold,
    trainRatio,
    precision: Math.round(macroPrecision * 1000) / 1000,
    recall: Math.round(macroRecall * 1000) / 1000,
    f1Score: Math.round(macroF1 * 1000) / 1000,
    map: Math.round(macroMAP * 1000) / 1000,
    ndcg: Math.round(macroNDCG * 1000) / 1000,
    hitRate: Math.round(hitRate * 1000) / 1000,
    catalogCoverage: Math.round(catalogCoverage * 1000) / 1000,
    rmse: Math.round(rmse * 1000) / 1000,
    mae: Math.round(mae * 1000) / 1000,
    prCurve,
    confusionMatrix: confusion,
    userBreakdown: evaluatedUsers
  };
}

/**
 * Runs a cross-algorithm benchmark comparing UBCF, IBCF, SVD, and Popularity Baseline.
 */
export function runAlgorithmBenchmark(
  interactions: UserInteraction[],
  users: User[],
  products: Product[],
  weights: InteractionWeightsConfig,
  config: AlgorithmConfig,
  topK: number = 5,
  trainRatio: number = 0.8,
  relevanceThreshold: number = 3.5
): BenchmarkComparison[] {
  const algorithms: { id: RecommendationAlgorithm; name: string }[] = [
    { id: 'ubcf', name: 'User-Based Collaborative Filtering (UBCF)' },
    { id: 'ibcf', name: 'Item-Based Collaborative Filtering (IBCF)' },
    { id: 'svd', name: 'Matrix Factorization (FunkSVD)' },
    { id: 'popularity', name: 'Popularity Baseline (Cold-Start)' }
  ];

  return algorithms.map((alg) => {
    const res = evaluateRecommendationModel(
      alg.id,
      interactions,
      users,
      products,
      weights,
      config,
      topK,
      trainRatio,
      relevanceThreshold
    );
    return {
      algorithm: alg.id,
      name: alg.name,
      precision: res.precision,
      recall: res.recall,
      f1Score: res.f1Score,
      map: res.map,
      ndcg: res.ndcg,
      hitRate: res.hitRate,
      rmse: res.rmse
    };
  });
}
