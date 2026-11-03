import { Product, User, UserInteraction, InteractionWeightsConfig, RecommendationResult, AlgorithmConfig } from '../types';

export interface UserItemMatrix {
  userIds: string[];
  productIds: string[];
  matrix: number[][]; // [userIndex][productIndex]
  userIndexMap: Record<string, number>;
  productIndexMap: Record<string, number>;
  userAverages: number[];
  itemAverages: number[];
  globalAverage: number;
}

/**
 * Builds normalized User-Item rating matrix R from explicit and implicit feedback.
 * Implicit signals (views, cart, purchase, wishlist) are transformed into estimated interest
 * on a 1.0 - 5.0 scale using configured interaction weights.
 */
export function buildUserItemMatrix(
  interactions: UserInteraction[],
  users: User[],
  products: Product[],
  weights: InteractionWeightsConfig
): UserItemMatrix {
  const userIds = users.map((u) => u.id);
  const productIds = products.map((p) => p.id);

  const userIndexMap: Record<string, number> = {};
  userIds.forEach((id, idx) => {
    userIndexMap[id] = idx;
  });

  const productIndexMap: Record<string, number> = {};
  productIds.forEach((id, idx) => {
    productIndexMap[id] = idx;
  });

  const matrix: number[][] = Array.from({ length: userIds.length }, () =>
    Array(productIds.length).fill(0)
  );

  // Group interactions by (userId, productId)
  const pairInteractions = new Map<string, { explicitRating?: number; implicitScore: number; count: number }>();

  interactions.forEach((int) => {
    const key = `${int.userId}:::${int.productId}`;
    const curr = pairInteractions.get(key) || { implicitScore: 0, count: 0 };

    if (int.type === 'rating') {
      curr.explicitRating = int.value;
    } else {
      let signalWeight = 1.0;
      switch (int.type) {
        case 'view':
          signalWeight = weights.view;
          break;
        case 'click_detail':
          signalWeight = weights.click_detail;
          break;
        case 'wishlist':
          signalWeight = weights.wishlist;
          break;
        case 'add_to_cart':
          signalWeight = weights.add_to_cart;
          break;
        case 'purchase':
          signalWeight = weights.purchase;
          break;
      }
      curr.implicitScore += signalWeight;
      curr.count += 1;
    }
    pairInteractions.set(key, curr);
  });

  // Populate matrix entries normalized between 1.0 and 5.0
  pairInteractions.forEach((val, key) => {
    const [uId, pId] = key.split(':::');
    const uIdx = userIndexMap[uId];
    const pIdx = productIndexMap[pId];

    if (uIdx !== undefined && pIdx !== undefined) {
      if (val.explicitRating !== undefined) {
        matrix[uIdx][pIdx] = Math.min(5.0, Math.max(1.0, val.explicitRating));
      } else {
        // Map implicit cumulative score to 1.0 - 5.0 range
        // e.g. score >= 5.0 -> 5.0; score 3.5 -> 4.2; score 1.0 -> 3.0
        const calculated = 2.5 + Math.min(2.5, (val.implicitScore / 5.0) * 2.5);
        matrix[uIdx][pIdx] = Math.round(calculated * 10) / 10;
      }
    }
  });

  // Compute User & Item averages across observed ratings
  const userAverages: number[] = [];
  let totalSum = 0;
  let totalCount = 0;

  for (let u = 0; u < userIds.length; u++) {
    let uSum = 0;
    let uCount = 0;
    for (let p = 0; p < productIds.length; p++) {
      if (matrix[u][p] > 0) {
        uSum += matrix[u][p];
        uCount++;
        totalSum += matrix[u][p];
        totalCount++;
      }
    }
    userAverages.push(uCount > 0 ? uSum / uCount : 3.0);
  }

  const itemAverages: number[] = [];
  for (let p = 0; p < productIds.length; p++) {
    let pSum = 0;
    let pCount = 0;
    for (let u = 0; u < userIds.length; u++) {
      if (matrix[u][p] > 0) {
        pSum += matrix[u][p];
        pCount++;
      }
    }
    itemAverages.push(pCount > 0 ? pSum / pCount : 3.0);
  }

  const globalAverage = totalCount > 0 ? totalSum / totalCount : 3.5;

  return {
    userIds,
    productIds,
    matrix,
    userIndexMap,
    productIndexMap,
    userAverages,
    itemAverages,
    globalAverage
  };
}

/**
 * Computes Cosine Similarity between two numeric vectors.
 */
export function computeCosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dotProduct / denom;
}

/**
 * Computes Pearson Correlation Coefficient between two vectors over co-rated indices.
 */
export function computePearsonCorrelation(
  a: number[],
  b: number[],
  meanA: number,
  meanB: number
): number {
  let num = 0;
  let denomA = 0;
  let denomB = 0;
  let coRated = 0;

  for (let i = 0; i < a.length; i++) {
    if (a[i] > 0 && b[i] > 0) {
      coRated++;
      const diffA = a[i] - meanA;
      const diffB = b[i] - meanB;
      num += diffA * diffB;
      denomA += diffA * diffA;
      denomB += diffB * diffB;
    }
  }

  if (coRated < 2 || denomA === 0 || denomB === 0) {
    // Fall back to cosine similarity if insufficient overlap
    return computeCosineSimilarity(a, b);
  }

  return num / (Math.sqrt(denomA) * Math.sqrt(denomB));
}

/**
 * Computes the complete |U| x |U| User-User Similarity Matrix.
 */
export function computeUserSimilarityMatrix(
  data: UserItemMatrix,
  metric: 'cosine' | 'pearson' = 'cosine'
): number[][] {
  const n = data.userIds.length;
  const simMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    simMatrix[i][i] = 1.0;
    for (let j = i + 1; j < n; j++) {
      let sim = 0;
      if (metric === 'pearson') {
        sim = computePearsonCorrelation(
          data.matrix[i],
          data.matrix[j],
          data.userAverages[i],
          data.userAverages[j]
        );
      } else {
        sim = computeCosineSimilarity(data.matrix[i], data.matrix[j]);
      }
      simMatrix[i][j] = sim;
      simMatrix[j][i] = sim;
    }
  }

  return simMatrix;
}

/**
 * Computes the complete |I| x |I| Item-Item Similarity Matrix.
 */
export function computeItemSimilarityMatrix(
  data: UserItemMatrix,
  metric: 'cosine' | 'pearson' = 'cosine'
): number[][] {
  const numItems = data.productIds.length;
  const numUsers = data.userIds.length;
  const simMatrix: number[][] = Array.from({ length: numItems }, () => Array(numItems).fill(0));

  // Extract columns (item vectors)
  const itemVectors: number[][] = [];
  for (let p = 0; p < numItems; p++) {
    const col: number[] = [];
    for (let u = 0; u < numUsers; u++) {
      col.push(data.matrix[u][p]);
    }
    itemVectors.push(col);
  }

  for (let i = 0; i < numItems; i++) {
    simMatrix[i][i] = 1.0;
    for (let j = i + 1; j < numItems; j++) {
      let sim = 0;
      if (metric === 'pearson') {
        sim = computePearsonCorrelation(
          itemVectors[i],
          itemVectors[j],
          data.itemAverages[i],
          data.itemAverages[j]
        );
      } else {
        sim = computeCosineSimilarity(itemVectors[i], itemVectors[j]);
      }
      simMatrix[i][j] = sim;
      simMatrix[j][i] = sim;
    }
  }

  return simMatrix;
}

/**
 * User-Based Collaborative Filtering (UBCF)
 * Predicts ratings using k-Nearest Neighbors with deviation-from-mean formulation:
 * \hat{r}_{u,i} = \bar{r}_u + \frac{\sum_{v \in N_k(u)} sim(u, v) * (r_{v,i} - \bar{r}_v)}{\sum |sim(u, v)|}
 */
export function userBasedCollaborativeFiltering(
  userId: string,
  data: UserItemMatrix,
  userSimMatrix: number[][],
  users: User[],
  products: Product[],
  config: AlgorithmConfig,
  excludeInteracted: boolean = true
): RecommendationResult[] {
  const uIdx = data.userIndexMap[userId];
  if (uIdx === undefined) return popularityBaseline(data, products);

  const activeUserRatings = data.matrix[uIdx];
  const userAvg = data.userAverages[uIdx];
  const k = config.neighborhoodK;

  // Rank other users by similarity
  const neighbors: { userIndex: number; sim: number }[] = [];
  for (let v = 0; v < data.userIds.length; v++) {
    if (v !== uIdx) {
      const sim = userSimMatrix[uIdx][v];
      if (sim > 0.05) {
        neighbors.push({ userIndex: v, sim });
      }
    }
  }
  neighbors.sort((a, b) => b.sim - a.sim);

  const results: RecommendationResult[] = [];

  for (let p = 0; p < data.productIds.length; p++) {
    // If user already interacted and excludeInteracted is true, skip
    if (excludeInteracted && activeUserRatings[p] > 0) continue;

    const prod = products.find((prod) => prod.id === data.productIds[p]);
    if (!prod) continue;

    // Filter neighbors who rated product p
    const relevantNeighbors = neighbors.filter((n) => data.matrix[n.userIndex][p] > 0).slice(0, k);

    let predScore = userAvg;
    const similarUsersInfo: { userId: string; userName: string; similarity: number; rating: number }[] = [];

    if (relevantNeighbors.length > 0) {
      let weightedDiffSum = 0;
      let simSum = 0;

      relevantNeighbors.forEach((n) => {
        const rating = data.matrix[n.userIndex][p];
        const neighborAvg = data.userAverages[n.userIndex];
        weightedDiffSum += n.sim * (rating - neighborAvg);
        simSum += Math.abs(n.sim);

        const otherUser = users.find((u) => u.id === data.userIds[n.userIndex]);
        if (otherUser) {
          similarUsersInfo.push({
            userId: otherUser.id,
            userName: otherUser.name,
            similarity: Math.round(n.sim * 100) / 100,
            rating
          });
        }
      });

      if (simSum > 0) {
        predScore = userAvg + weightedDiffSum / simSum;
      }
    } else {
      // Fallback to item average
      predScore = data.itemAverages[p];
    }

    // Clamp predicted rating to [1.0, 5.0]
    predScore = Math.max(1.0, Math.min(5.0, predScore));

    results.push({
      product: prod,
      predictedScore: Math.round(predScore * 100) / 100,
      rank: 0,
      explanation: {
        similarUsers: similarUsersInfo,
        methodSummary: `Predicted via ${relevantNeighbors.length} nearest neighbors with ${config.similarityMetric} similarity.`,
        scoreBreakdown: [
          { label: 'Active User Baseline', value: Math.round(userAvg * 10) / 10 },
          { label: 'Neighbor Adjustments', value: Math.round((predScore - userAvg) * 10) / 10 },
          { label: 'Predicted Score', value: Math.round(predScore * 10) / 10 }
        ]
      }
    });
  }

  results.sort((a, b) => b.predictedScore - a.predictedScore);
  results.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return results;
}

/**
 * Item-Based Collaborative Filtering (IBCF)
 * Predicts ratings using item-item similarity weighted by the user's past actions:
 * \hat{r}_{u,i} = \frac{\sum_{j \in Rated(u)} sim(i, j) * r_{u,j}}{\sum |sim(i, j)|}
 */
export function itemBasedCollaborativeFiltering(
  userId: string,
  data: UserItemMatrix,
  itemSimMatrix: number[][],
  products: Product[],
  config: AlgorithmConfig,
  excludeInteracted: boolean = true
): RecommendationResult[] {
  const uIdx = data.userIndexMap[userId];
  if (uIdx === undefined) return popularityBaseline(data, products);

  const activeUserRatings = data.matrix[uIdx];
  const ratedIndices: number[] = [];
  for (let j = 0; j < data.productIds.length; j++) {
    if (activeUserRatings[j] > 0) {
      ratedIndices.push(j);
    }
  }

  // If active user has no history, fallback to popularity baseline
  if (ratedIndices.length === 0) {
    return popularityBaseline(data, products);
  }

  const results: RecommendationResult[] = [];

  for (let i = 0; i < data.productIds.length; i++) {
    if (excludeInteracted && activeUserRatings[i] > 0) continue;

    const prod = products.find((p) => p.id === data.productIds[i]);
    if (!prod) continue;

    // Gather candidate items that user has rated, sorted by similarity to item i
    const candidates = ratedIndices
      .map((j) => ({
        index: j,
        sim: itemSimMatrix[i][j],
        rating: activeUserRatings[j]
      }))
      .filter((c) => c.sim > 0.05)
      .sort((a, b) => b.sim - a.sim)
      .slice(0, config.neighborhoodK);

    let predScore = data.itemAverages[i];
    const similarItemsInfo: { productId: string; productName: string; similarity: number; score: number }[] = [];

    if (candidates.length > 0) {
      let weightedSum = 0;
      let simSum = 0;

      candidates.forEach((c) => {
        weightedSum += c.sim * c.rating;
        simSum += Math.abs(c.sim);

        const ratedProd = products.find((p) => p.id === data.productIds[c.index]);
        if (ratedProd) {
          similarItemsInfo.push({
            productId: ratedProd.id,
            productName: ratedProd.name,
            similarity: Math.round(c.sim * 100) / 100,
            score: c.rating
          });
        }
      });

      if (simSum > 0) {
        predScore = weightedSum / simSum;
      }
    }

    predScore = Math.max(1.0, Math.min(5.0, predScore));

    results.push({
      product: prod,
      predictedScore: Math.round(predScore * 100) / 100,
      rank: 0,
      explanation: {
        similarItems: similarItemsInfo,
        methodSummary: `Predicted based on similarity to ${candidates.length} item(s) you interacted with.`,
        scoreBreakdown: [
          { label: 'Catalog Prior', value: Math.round(data.itemAverages[i] * 10) / 10 },
          { label: 'Interaction Affinity', value: Math.round(predScore * 10) / 10 }
        ]
      }
    });
  }

  results.sort((a, b) => b.predictedScore - a.predictedScore);
  results.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return results;
}

/**
 * Matrix Factorization via FunkSVD
 * Learns user latent factors P and item latent factors Q such that R ~ mu + b_u + b_i + P_u * Q_i^T
 */
export interface SVDModel {
  userFactors: number[][]; // [U][factors]
  itemFactors: number[][]; // [I][factors]
  userBiases: number[];
  itemBiases: number[];
  globalMean: number;
}

export function trainSVD(
  data: UserItemMatrix,
  numFactors: number = 3,
  learningRate: number = 0.015,
  regularization: number = 0.05,
  epochs: number = 40
): SVDModel {
  const numUsers = data.userIds.length;
  const numItems = data.productIds.length;
  const mu = data.globalAverage;

  // Initialize latent factors with small random numbers
  const userFactors: number[][] = Array.from({ length: numUsers }, () =>
    Array.from({ length: numFactors }, () => (Math.random() - 0.5) * 0.1)
  );
  const itemFactors: number[][] = Array.from({ length: numItems }, () =>
    Array.from({ length: numFactors }, () => (Math.random() - 0.5) * 0.1)
  );

  const userBiases = Array(numUsers).fill(0);
  const itemBiases = Array(numItems).fill(0);

  // Gradient descent on observed ratings
  for (let epoch = 0; epoch < epochs; epoch++) {
    for (let u = 0; u < numUsers; u++) {
      for (let i = 0; i < numItems; i++) {
        const r_ui = data.matrix[u][i];
        if (r_ui > 0) {
          // Predict current rating
          let dot = 0;
          for (let f = 0; f < numFactors; f++) {
            dot += userFactors[u][f] * itemFactors[i][f];
          }
          const pred = mu + userBiases[u] + itemBiases[i] + dot;
          const err = r_ui - pred;

          // Update biases
          userBiases[u] += learningRate * (err - regularization * userBiases[u]);
          itemBiases[i] += learningRate * (err - regularization * itemBiases[i]);

          // Update factors
          for (let f = 0; f < numFactors; f++) {
            const p_uf = userFactors[u][f];
            const q_if = itemFactors[i][f];
            userFactors[u][f] += learningRate * (err * q_if - regularization * p_uf);
            itemFactors[i][f] += learningRate * (err * p_uf - regularization * q_if);
          }
        }
      }
    }
  }

  return {
    userFactors,
    itemFactors,
    userBiases,
    itemBiases,
    globalMean: mu
  };
}

/**
 * Predicts recommendations using trained SVD Model.
 */
export function matrixFactorizationRecommendations(
  userId: string,
  data: UserItemMatrix,
  svd: SVDModel,
  products: Product[],
  excludeInteracted: boolean = true
): RecommendationResult[] {
  const uIdx = data.userIndexMap[userId];
  if (uIdx === undefined) return popularityBaseline(data, products);

  const activeUserRatings = data.matrix[uIdx];
  const results: RecommendationResult[] = [];

  for (let i = 0; i < data.productIds.length; i++) {
    if (excludeInteracted && activeUserRatings[i] > 0) continue;

    const prod = products.find((p) => p.id === data.productIds[i]);
    if (!prod) continue;

    let dot = 0;
    for (let f = 0; f < svd.userFactors[uIdx].length; f++) {
      dot += svd.userFactors[uIdx][f] * svd.itemFactors[i][f];
    }

    let predScore = svd.globalMean + svd.userBiases[uIdx] + svd.itemBiases[i] + dot;
    predScore = Math.max(1.0, Math.min(5.0, predScore));

    results.push({
      product: prod,
      predictedScore: Math.round(predScore * 100) / 100,
      rank: 0,
      explanation: {
        methodSummary: `Computed via Latent Factor Decomposition (Rank-${svd.userFactors[0].length} Matrix SVD).`,
        scoreBreakdown: [
          { label: 'Global Mean (μ)', value: Math.round(svd.globalMean * 10) / 10 },
          { label: 'User Bias (b_u)', value: Math.round(svd.userBiases[uIdx] * 10) / 10 },
          { label: 'Item Bias (b_i)', value: Math.round(svd.itemBiases[i] * 10) / 10 },
          { label: 'Latent Dot (P·Q)', value: Math.round(dot * 10) / 10 }
        ]
      }
    });
  }

  results.sort((a, b) => b.predictedScore - a.predictedScore);
  results.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return results;
}

/**
 * Popularity Baseline: Ranks items by interaction frequency & average rating.
 */
export function popularityBaseline(
  data: UserItemMatrix,
  products: Product[],
  excludeInteractedUserId?: string
): RecommendationResult[] {
  const uIdx = excludeInteractedUserId ? data.userIndexMap[excludeInteractedUserId] : undefined;
  const userRatings = uIdx !== undefined ? data.matrix[uIdx] : [];

  const results: RecommendationResult[] = [];

  for (let i = 0; i < data.productIds.length; i++) {
    if (userRatings[i] > 0) continue;

    const prod = products.find((p) => p.id === data.productIds[i]);
    if (!prod) continue;

    let count = 0;
    for (let u = 0; u < data.userIds.length; u++) {
      if (data.matrix[u][i] > 0) count++;
    }

    const avg = data.itemAverages[i];
    // Baseline score blends item average and interaction count
    const blendedScore = Math.min(5.0, avg * 0.7 + (count / Math.max(1, data.userIds.length)) * 1.5);

    results.push({
      product: prod,
      predictedScore: Math.round(blendedScore * 100) / 100,
      rank: 0,
      explanation: {
        methodSummary: 'Non-personalized baseline ranking based on catalog popularity and average ratings.',
        scoreBreakdown: [
          { label: 'Item Average Rating', value: Math.round(avg * 10) / 10 },
          { label: 'Interaction Count', value: count }
        ]
      }
    });
  }

  results.sort((a, b) => b.predictedScore - a.predictedScore);
  results.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return results;
}
