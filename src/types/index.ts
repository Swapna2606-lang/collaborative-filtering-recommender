export interface Product {
  id: string;
  name: string;
  category: 'Audio' | 'Lighting' | 'Living' | 'Hardware' | 'Accessories';
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
  description: string;
  features: string[];
  tags: string[];
  stockStatus: 'In Stock' | 'Low Stock' | 'Pre-order';
}

export type InteractionType = 'view' | 'click_detail' | 'wishlist' | 'add_to_cart' | 'purchase' | 'rating';

export interface UserInteraction {
  id: string;
  userId: string;
  productId: string;
  type: InteractionType;
  value: number; // Raw explicit rating (1-5) or implicit score
  normalizedScore: number; // 1-5 scale normalized
  timestamp: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: string;
  bio: string;
  preferredCategories: string[];
}

export interface InteractionWeightsConfig {
  view: number;
  click_detail: number;
  wishlist: number;
  add_to_cart: number;
  purchase: number;
}

export type RecommendationAlgorithm = 'ubcf' | 'ibcf' | 'svd' | 'popularity';

export interface AlgorithmConfig {
  neighborhoodK: number; // e.g. 3 to 10
  similarityMetric: 'cosine' | 'pearson';
  latentFactors: number; // for SVD
  regularization: number;
  iterations: number;
}

export interface RecommendationExplanation {
  similarUsers?: { userId: string; userName: string; similarity: number; rating: number }[];
  similarItems?: { productId: string; productName: string; similarity: number; score: number }[];
  methodSummary: string;
  scoreBreakdown: { label: string; value: number }[];
}

export interface RecommendationResult {
  product: Product;
  predictedScore: number;
  rank: number;
  explanation: RecommendationExplanation;
}

export interface UserEvaluationMetric {
  userId: string;
  userName: string;
  testItemCount: number;
  relevantCount: number;
  recommendedCount: number;
  hits: number;
  precision: number;
  recall: number;
  f1: number;
  averagePrecision: number;
}

export interface ConfusionMatrixData {
  truePositive: number;
  falsePositive: number;
  falseNegative: number;
  trueNegative: number;
}

export interface EvaluationResults {
  algorithm: RecommendationAlgorithm;
  topK: number;
  relevanceThreshold: number;
  trainRatio: number;
  precision: number; // Precision@K (0 to 1)
  recall: number; // Recall@K (0 to 1)
  f1Score: number;
  map: number; // Mean Average Precision@K
  ndcg: number; // Normalized Discounted Cumulative Gain@K
  hitRate: number; // Fraction of users with at least 1 hit
  catalogCoverage: number; // Percentage of items recommended
  rmse: number;
  mae: number;
  prCurve: { k: number; precision: number; recall: number; f1: number }[];
  confusionMatrix: ConfusionMatrixData;
  userBreakdown: UserEvaluationMetric[];
}

export interface BenchmarkComparison {
  algorithm: RecommendationAlgorithm;
  name: string;
  precision: number;
  recall: number;
  f1Score: number;
  map: number;
  ndcg: number;
  hitRate: number;
  rmse: number;
}
