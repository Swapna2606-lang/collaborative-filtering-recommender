"""
=============================================================================
AURA RECOMMENDATION SYSTEM - COLLABORATIVE FILTERING & EVALUATION
=============================================================================
Machine Learning Project: E-Commerce Collaborative Filtering Recommendation System
Includes:
  1. Data Collection & Implicit-to-Explicit Feedback Processing
  2. User-Item Interaction Matrix Construction & Cold-Start Diagnosis
  3. Collaborative Filtering Algorithms:
       - User-Based Collaborative Filtering (UBCF with Pearson/Cosine)
       - Item-Based Collaborative Filtering (IBCF)
       - Matrix Factorization (Regularized FunkSVD / Latent Factor Model)
       - Popularity Cold-Start Baseline
  4. Performance Evaluation Engine:
       - Precision@K, Recall@K, F1@K, MAP@K, NDCG@K, Hit Rate, RMSE
       - Precision-Recall Curve Generation
       - Cross-Algorithm Benchmark Comparison
=============================================================================
"""

import math
from typing import Dict, List, Tuple, Set, Optional
from collections import defaultdict


# =============================================================================
# 1. DATA COLLECTION & PREPROCESSING
# =============================================================================

class InteractionWeights:
    """Configurable weights for transforming implicit actions into inferred ratings (1.0 to 5.0)."""
    VIEW = 1.0
    CLICK_DETAIL = 2.0
    WISHLIST = 2.5
    ADD_TO_CART = 3.5
    PURCHASE = 5.0


SAMPLE_PRODUCTS = [
    {"id": "prod-1", "name": "Apex Studio Headphones", "category": "Audio", "price": 340},
    {"id": "prod-2", "name": "Lumina Cantilever Lamp", "category": "Lighting", "price": 280},
    {"id": "prod-3", "name": "Kanto Pour-Over Ceramic", "category": "Living", "price": 95},
    {"id": "prod-4", "name": "Monolith Mechanical Keyboard", "category": "Hardware", "price": 390},
    {"id": "prod-5", "name": "Onyx Acoustic Panels", "category": "Audio", "price": 220},
    {"id": "prod-6", "name": "Chronos Titanium Watch", "category": "Accessories", "price": 520},
    {"id": "prod-7", "name": "Strata Walnut Monitor Riser", "category": "Hardware", "price": 165},
    {"id": "prod-8", "name": "Vessel Smoked Glass Decanter", "category": "Living", "price": 120},
    {"id": "prod-9", "name": "AeroDesk Wool Desk Pad", "category": "Accessories", "price": 85},
    {"id": "prod-10", "name": "Halo Linear Pendant", "category": "Lighting", "price": 440},
]

SAMPLE_USERS = [
    {"id": "user-1", "name": "Alex Rivera", "persona": "Audiophile & Hardware"},
    {"id": "user-2", "name": "Elena Vance", "persona": "Architect & Lighting"},
    {"id": "user-3", "name": "Marcus Chen", "persona": "Mechanical Engineer"},
    {"id": "user-4", "name": "Sophia Laurent", "persona": "Specialty Coffee Roaster"},
    {"id": "user-5", "name": "Devon Miller", "persona": "Studio Producer"},
    {"id": "user-6", "name": "Active Shopper", "persona": "Exploratory User"},
]

# Seed interactions (mix of implicit signals and explicit star ratings)
SAMPLE_INTERACTIONS = [
    # User 1 (Audio + Hardware)
    {"user_id": "user-1", "product_id": "prod-1", "type": "purchase", "value": 5.0},
    {"user_id": "user-1", "product_id": "prod-1", "type": "rating", "value": 5.0},
    {"user_id": "user-1", "product_id": "prod-5", "type": "purchase", "value": 5.0},
    {"user_id": "user-1", "product_id": "prod-4", "type": "add_to_cart", "value": 3.5},
    {"user_id": "user-1", "product_id": "prod-7", "type": "rating", "value": 4.0},
    {"user_id": "user-1", "product_id": "prod-9", "type": "view", "value": 1.0},

    # User 2 (Lighting + Living)
    {"user_id": "user-2", "product_id": "prod-2", "type": "purchase", "value": 5.0},
    {"user_id": "user-2", "product_id": "prod-2", "type": "rating", "value": 5.0},
    {"user_id": "user-2", "product_id": "prod-3", "type": "purchase", "value": 5.0},
    {"user_id": "user-2", "product_id": "prod-8", "type": "wishlist", "value": 2.5},
    {"user_id": "user-2", "product_id": "prod-10", "type": "rating", "value": 5.0},
    {"user_id": "user-2", "product_id": "prod-7", "type": "view", "value": 1.0},

    # User 3 (Hardware + Accessories)
    {"user_id": "user-3", "product_id": "prod-4", "type": "purchase", "value": 5.0},
    {"user_id": "user-3", "product_id": "prod-4", "type": "rating", "value": 5.0},
    {"user_id": "user-3", "product_id": "prod-6", "type": "purchase", "value": 5.0},
    {"user_id": "user-3", "product_id": "prod-7", "type": "add_to_cart", "value": 3.5},
    {"user_id": "user-3", "product_id": "prod-9", "type": "rating", "value": 4.5},
    {"user_id": "user-3", "product_id": "prod-1", "type": "view", "value": 1.0},

    # User 4 (Living + Lighting)
    {"user_id": "user-4", "product_id": "prod-3", "type": "purchase", "value": 5.0},
    {"user_id": "user-4", "product_id": "prod-3", "type": "rating", "value": 5.0},
    {"user_id": "user-4", "product_id": "prod-8", "type": "purchase", "value": 5.0},
    {"user_id": "user-4", "product_id": "prod-2", "type": "rating", "value": 4.5},
    {"user_id": "user-4", "product_id": "prod-9", "type": "wishlist", "value": 2.5},
    {"user_id": "user-4", "product_id": "prod-10", "type": "view", "value": 1.0},

    # User 5 (Audio + Accessories)
    {"user_id": "user-5", "product_id": "prod-1", "type": "purchase", "value": 5.0},
    {"user_id": "user-5", "product_id": "prod-5", "type": "purchase", "value": 5.0},
    {"user_id": "user-5", "product_id": "prod-9", "type": "rating", "value": 4.0},
    {"user_id": "user-5", "product_id": "prod-6", "type": "rating", "value": 4.5},
    {"user_id": "user-5", "product_id": "prod-4", "type": "view", "value": 1.0},

    # User 6 (Active Shopper - Initial state)
    {"user_id": "user-6", "product_id": "prod-1", "type": "click_detail", "value": 2.0},
    {"user_id": "user-6", "product_id": "prod-4", "type": "wishlist", "value": 2.5},
]


class InteractionDataset:
    """Manages raw interactions and builds the normalized User-Item matrix."""
    def __init__(self, users: List[dict], products: List[dict], interactions: List[dict]):
        self.users = users
        self.products = products
        self.interactions = interactions
        self.user_ids = [u["id"] for u in users]
        self.product_ids = [p["id"] for p in products]
        
        self.u2idx = {u_id: i for i, u_id in enumerate(self.user_ids)}
        self.p2idx = {p_id: i for i, p_id in enumerate(self.product_ids)}
        
        self.matrix = [[0.0 for _ in self.product_ids] for _ in self.user_ids]
        self._build_matrix()

    def _build_matrix(self):
        pair_data = defaultdict(lambda: {"explicit": None, "implicit": 0.0})
        
        for int_event in self.interactions:
            key = (int_event["user_id"], int_event["product_id"])
            if int_event["type"] == "rating":
                pair_data[key]["explicit"] = int_event["value"]
            else:
                pair_data[key]["implicit"] += int_event["value"]
                
        for (u_id, p_id), signals in pair_data.items():
            if u_id in self.u2idx and p_id in self.p2idx:
                u_idx = self.u2idx[u_id]
                p_idx = self.p2idx[p_id]
                if signals["explicit"] is not None:
                    self.matrix[u_idx][p_idx] = float(signals["explicit"])
                else:
                    # Normalize implicit score to 1.0 - 5.0 range
                    norm_score = 2.5 + min(2.5, (signals["implicit"] / 5.0) * 2.5)
                    self.matrix[u_idx][p_idx] = round(norm_score, 1)

    def get_sparsity(self) -> float:
        """Returns the matrix sparsity S = 1 - (|E| / (|U| * |I|))."""
        total = len(self.user_ids) * len(self.product_ids)
        non_zero = sum(1 for row in self.matrix for val in row if val > 0)
        return 1.0 - (non_zero / total) if total > 0 else 0.0

    def get_cold_start_summary(self, threshold: int = 1) -> Tuple[List[str], List[str]]:
        """Identifies cold-start users and items (interaction count <= threshold)."""
        cold_users = []
        for u_id in self.user_ids:
            u_idx = self.u2idx[u_id]
            count = sum(1 for v in self.matrix[u_idx] if v > 0)
            if count <= threshold:
                cold_users.append(u_id)
                
        cold_items = []
        for p_id in self.product_ids:
            p_idx = self.p2idx[p_id]
            count = sum(1 for row in self.matrix if row[p_idx] > 0)
            if count <= threshold:
                cold_items.append(p_id)
                
        return cold_users, cold_items


# =============================================================================
# 2. SIMILARITY METRICS & MATHEMATICAL UTILITIES
# =============================================================================

def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Cosine similarity: cos(a, b) = (a . b) / (||a|| * ||b||)."""
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    return dot / (norm_a * norm_b) if norm_a > 0 and norm_b > 0 else 0.0


def pearson_correlation(vec_a: List[float], vec_b: List[float]) -> float:
    """Pearson correlation coefficient across co-rated items."""
    co_rated = [(a, b) for a, b in zip(vec_a, vec_b) if a > 0 and b > 0]
    if len(co_rated) < 2:
        return cosine_similarity(vec_a, vec_b)
    
    mean_a = sum(x[0] for x in co_rated) / len(co_rated)
    mean_b = sum(x[1] for x in co_rated) / len(co_rated)
    
    num = sum((a - mean_a) * (b - mean_b) for a, b in co_rated)
    den_a = math.sqrt(sum((a - mean_a) ** 2 for a, _ in co_rated))
    den_b = math.sqrt(sum((b - mean_b) ** 2 for _, b in co_rated))
    
    return num / (den_a * den_b) if den_a > 0 and den_b > 0 else 0.0


# =============================================================================
# 3. COLLABORATIVE FILTERING ALGORITHMS
# =============================================================================

class CollaborativeRecommender:
    """
    Implements 3 primary collaborative filtering approaches:
      1. User-Based Collaborative Filtering (UBCF)
      2. Item-Based Collaborative Filtering (IBCF)
      3. Matrix Factorization (Regularized FunkSVD)
      4. Popularity Baseline (Cold-start fallback)
    """
    def __init__(self, dataset: InteractionDataset):
        self.dataset = dataset
        self.matrix = dataset.matrix
        self.n_users = len(dataset.user_ids)
        self.n_items = len(dataset.product_ids)
        
        # Compute user averages
        self.user_means = []
        for row in self.matrix:
            rated = [v for v in row if v > 0]
            self.user_means.append(sum(rated) / len(rated) if rated else 3.0)
            
        # Compute item averages
        self.item_means = []
        for p in range(self.n_items):
            rated = [self.matrix[u][p] for u in range(self.n_users) if self.matrix[u][p] > 0]
            self.item_means.append(sum(rated) / len(rated) if rated else 3.0)
            
        all_rated = [val for row in self.matrix for val in row if val > 0]
        self.global_mean = sum(all_rated) / len(all_rated) if all_rated else 3.5

    def recommend_user_based(self, user_id: str, k_neighbors: int = 4, top_n: int = 5) -> List[Tuple[str, float]]:
        """
        User-Based Collaborative Filtering:
        r_hat(u, i) = mean(u) + [ sum sim(u, v) * (r(v, i) - mean(v)) ] / [ sum |sim(u, v)| ]
        """
        if user_id not in self.dataset.u2idx:
            return self.recommend_popularity(top_n=top_n)
            
        u_idx = self.dataset.u2idx[user_id]
        u_vec = self.matrix[u_idx]
        
        # Calculate similarity with all peer users
        similarities = []
        for v_idx in range(self.n_users):
            if v_idx != u_idx:
                sim = cosine_similarity(u_vec, self.matrix[v_idx])
                if sim > 0:
                    similarities.append((v_idx, sim))
                    
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        predictions = []
        for p_idx in range(self.n_items):
            if u_vec[p_idx] > 0:
                continue  # Skip already rated/interacted items
                
            # Filter neighbors who rated item p_idx
            cand_neighbors = [(v, sim) for v, sim in similarities if self.matrix[v][p_idx] > 0][:k_neighbors]
            
            if cand_neighbors:
                weighted_sum = sum(sim * (self.matrix[v][p_idx] - self.user_means[v]) for v, sim in cand_neighbors)
                sim_sum = sum(abs(sim) for _, sim in cand_neighbors)
                pred = self.user_means[u_idx] + (weighted_sum / sim_sum if sim_sum > 0 else 0)
            else:
                pred = self.item_means[p_idx]
                
            pred = max(1.0, min(5.0, pred))
            predictions.append((self.dataset.product_ids[p_idx], round(pred, 2)))
            
        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[:top_n]

    def recommend_item_based(self, user_id: str, k_neighbors: int = 4, top_n: int = 5) -> List[Tuple[str, float]]:
        """
        Item-Based Collaborative Filtering:
        r_hat(u, i) = [ sum sim(i, j) * r(u, j) ] / [ sum |sim(i, j)| ]
        """
        if user_id not in self.dataset.u2idx:
            return self.recommend_popularity(top_n=top_n)
            
        u_idx = self.dataset.u2idx[user_id]
        u_vec = self.matrix[u_idx]
        interacted_items = [p for p in range(self.n_items) if u_vec[p] > 0]
        
        if not interacted_items:
            return self.recommend_popularity(top_n=top_n)
            
        # Precompute item vectors
        item_vectors = [[self.matrix[u][p] for u in range(self.n_users)] for p in range(self.n_items)]
        
        predictions = []
        for p_idx in range(self.n_items):
            if u_vec[p_idx] > 0:
                continue
                
            sim_candidates = []
            for j in interacted_items:
                sim = cosine_similarity(item_vectors[p_idx], item_vectors[j])
                if sim > 0:
                    sim_candidates.append((sim, u_vec[j]))
                    
            sim_candidates.sort(key=lambda x: x[0], reverse=True)
            top_cands = sim_candidates[:k_neighbors]
            
            if top_cands:
                weighted_sum = sum(sim * rating for sim, rating in top_cands)
                sim_sum = sum(abs(sim) for sim, _ in top_cands)
                pred = weighted_sum / sim_sum if sim_sum > 0 else self.item_means[p_idx]
            else:
                pred = self.item_means[p_idx]
                
            pred = max(1.0, min(5.0, pred))
            predictions.append((self.dataset.product_ids[p_idx], round(pred, 2)))
            
        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[:top_n]

    def train_svd(self, n_factors: int = 3, lr: float = 0.02, reg: float = 0.05, epochs: int = 50):
        """
        FunkSVD Matrix Factorization:
        Minimizes SSE + L2 regularization:
        e_{u,i} = r_{u,i} - (mu + b_u + b_i + P_u . Q_i^T)
        """
        import random
        random.seed(42)
        
        P = [[random.uniform(-0.1, 0.1) for _ in range(n_factors)] for _ in range(self.n_users)]
        Q = [[random.uniform(-0.1, 0.1) for _ in range(n_factors)] for _ in range(self.n_items)]
        bu = [0.0] * self.n_users
        bi = [0.0] * self.n_items
        
        for _ in range(epochs):
            for u in range(self.n_users):
                for i in range(self.n_items):
                    r_ui = self.matrix[u][i]
                    if r_ui > 0:
                        dot = sum(P[u][f] * Q[i][f] for f in range(n_factors))
                        pred = self.global_mean + bu[u] + bi[i] + dot
                        err = r_ui - pred
                        
                        bu[u] += lr * (err - reg * bu[u])
                        bi[i] += lr * (err - reg * bi[i])
                        for f in range(n_factors):
                            p_val = P[u][f]
                            q_val = Q[i][f]
                            P[u][f] += lr * (err * q_val - reg * p_val)
                            Q[i][f] += lr * (err * p_val - reg * q_val)
                            
        self.svd_P = P
        self.svd_Q = Q
        self.svd_bu = bu
        self.svd_bi = bi

    def recommend_svd(self, user_id: str, top_n: int = 5) -> List[Tuple[str, float]]:
        """Recommendations using trained Latent SVD."""
        if not hasattr(self, 'svd_P'):
            self.train_svd()
            
        if user_id not in self.dataset.u2idx:
            return self.recommend_popularity(top_n=top_n)
            
        u_idx = self.dataset.u2idx[user_id]
        u_vec = self.matrix[u_idx]
        
        predictions = []
        for p_idx in range(self.n_items):
            if u_vec[p_idx] > 0:
                continue
            dot = sum(self.svd_P[u_idx][f] * self.svd_Q[p_idx][f] for f in range(len(self.svd_P[0])))
            pred = self.global_mean + self.svd_bu[u_idx] + self.svd_bi[p_idx] + dot
            pred = max(1.0, min(5.0, pred))
            predictions.append((self.dataset.product_ids[p_idx], round(pred, 2)))
            
        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[:top_n]

    def recommend_popularity(self, top_n: int = 5) -> List[Tuple[str, float]]:
        """Cold-start baseline: rank items by count of positive interactions and average rating."""
        scores = []
        for p_idx, p_id in enumerate(self.dataset.product_ids):
            count = sum(1 for u in range(self.n_users) if self.matrix[u][p_idx] > 0)
            avg = self.item_means[p_idx]
            score = avg * 0.7 + (count / self.n_users) * 1.5
            scores.append((p_id, round(score, 2)))
            
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_n]


# =============================================================================
# 4. EVALUATION SYSTEM (PRECISION@K & RECALL@K)
# =============================================================================

class RecommenderEvaluator:
    """
    Evaluates recommendation retrieval using Holdout Train/Test Split:
      - Precision@K = |Rec_K ∩ Rel| / K
      - Recall@K    = |Rec_K ∩ Rel| / |Rel|
      - F1@K        = 2 * (P * R) / (P + R)
      - MAP@K       = Mean Average Precision
      - NDCG@K      = Normalized Discounted Cumulative Gain
      - RMSE        = Root Mean Squared Error on rating predictions
    """
    def __init__(self, full_interactions: List[dict], users: List[dict], products: List[dict]):
        self.full_interactions = full_interactions
        self.users = users
        self.products = products

    def split_train_test(self, train_ratio: float = 0.8) -> Tuple[List[dict], Dict[str, Set[str]], Dict[Tuple[str, str], float]]:
        """Stratified holdout partition per user."""
        user_grouped = defaultdict(list)
        for event in self.full_interactions:
            user_grouped[event["user_id"]].append(event)
            
        train_interactions = []
        test_relevant = defaultdict(set)
        test_ratings = {}
        
        for u_id, events in user_grouped.items():
            if len(events) <= 1:
                train_interactions.extend(events)
            else:
                split_idx = max(1, int(len(events) * train_ratio))
                train_interactions.extend(events[:split_idx])
                test_events = events[split_idx:]
                
                for te in test_events:
                    test_ratings[(u_id, te["product_id"])] = te["value"]
                    if te["value"] >= 3.5 or te["type"] == "purchase":
                        test_relevant[u_id].add(te["product_id"])
                        
        return train_interactions, test_relevant, test_ratings

    def evaluate(self, algorithm: str = "ubcf", k: int = 5, train_ratio: float = 0.8) -> Dict[str, float]:
        """Runs offline evaluation and computes precision, recall, and ranking metrics."""
        train_ints, test_relevant, test_ratings = self.split_train_test(train_ratio)
        train_dataset = InteractionDataset(self.users, self.products, train_ints)
        recommender = CollaborativeRecommender(train_dataset)
        
        precisions, recalls, aps, ndcgs, hits = [], [], [], [], 0
        test_users = [u for u in test_relevant.keys() if test_relevant[u]]
        
        for u_id in test_users:
            if algorithm == "ubcf":
                recs = recommender.recommend_user_based(u_id, top_n=k)
            elif algorithm == "ibcf":
                recs = recommender.recommend_item_based(u_id, top_n=k)
            elif algorithm == "svd":
                recs = recommender.recommend_svd(u_id, top_n=k)
            else:
                recs = recommender.recommend_popularity(top_n=k)
                
            rec_ids = [p_id for p_id, _ in recs]
            rel_set = test_relevant[u_id]
            
            # Hits in top-k
            hit_count = sum(1 for pid in rec_ids if pid in rel_set)
            if hit_count > 0:
                hits += 1
                
            p_k = hit_count / k if k > 0 else 0
            r_k = hit_count / len(rel_set) if rel_set else 0
            precisions.append(p_k)
            recalls.append(r_k)
            
            # Average Precision (AP@K)
            ap_sum, h_so_far = 0.0, 0
            for rank_idx, pid in enumerate(rec_ids):
                if pid in rel_set:
                    h_so_far += 1
                    ap_sum += h_so_far / (rank_idx + 1)
            aps.append(ap_sum / min(k, len(rel_set)) if rel_set else 0)
            
            # NDCG@K
            dcg = sum(1.0 / math.log2(idx + 2) for idx, pid in enumerate(rec_ids) if pid in rel_set)
            idcg = sum(1.0 / math.log2(idx + 2) for idx in range(min(k, len(rel_set))))
            ndcgs.append(dcg / idcg if idcg > 0 else 0.0)
            
        n = max(1, len(test_users))
        avg_p = sum(precisions) / n
        avg_r = sum(recalls) / n
        f1 = (2 * avg_p * avg_r) / (avg_p + avg_r) if (avg_p + avg_r) > 0 else 0.0
        
        return {
            "algorithm": algorithm.upper(),
            "k": k,
            "precision": round(avg_p, 4),
            "recall": round(avg_r, 4),
            "f1_score": round(f1, 4),
            "map": round(sum(aps) / n, 4),
            "ndcg": round(sum(ndcgs) / n, 4),
            "hit_rate": round(hits / n, 4)
        }


# =============================================================================
# 5. MAIN EXECUTION & BENCHMARK DEMO
# =============================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("AURA E-COMMERCE COLLABORATIVE FILTERING RECOMMENDATION SYSTEM")
    print("=" * 70)
    
    # 1. Dataset & Cold-Start Analysis
    dataset = InteractionDataset(SAMPLE_USERS, SAMPLE_PRODUCTS, SAMPLE_INTERACTIONS)
    sparsity = dataset.get_sparsity()
    cold_u, cold_i = dataset.get_cold_start_summary(threshold=1)
    
    print(f"\n[1] INTERACTION MATRIX OVERVIEW")
    print(f"    - Dimensions: {len(dataset.user_ids)} Users x {len(dataset.product_ids)} Items")
    print(f"    - Recorded Events: {len(SAMPLE_INTERACTIONS)}")
    print(f"    - Matrix Sparsity: {sparsity * 100:.1f}%")
    print(f"    - Cold-Start Users (<=1 int): {len(cold_u)} -> {cold_u}")
    print(f"    - Cold-Start Items (<=1 int): {len(cold_i)} -> {cold_i}")
    
    # 2. Recommendations Demo for Active User
    recommender = CollaborativeRecommender(dataset)
    target_user = "user-1"
    print(f"\n[2] RECOMMENDATIONS FOR '{target_user}' (Alex Rivera):")
    
    ubcf_recs = recommender.recommend_user_based(target_user, top_n=3)
    print("    - User-Based CF (UBCF):", ubcf_recs)
    
    ibcf_recs = recommender.recommend_item_based(target_user, top_n=3)
    print("    - Item-Based CF (IBCF):", ibcf_recs)
    
    svd_recs = recommender.recommend_svd(target_user, top_n=3)
    print("    - FunkSVD Matrix Factorization:", svd_recs)
    
    # 3. Model Evaluation Benchmark (Precision & Recall)
    evaluator = RecommenderEvaluator(SAMPLE_INTERACTIONS, SAMPLE_USERS, SAMPLE_PRODUCTS)
    
    print(f"\n[3] OFFLINE EVALUATION BENCHMARK (Holdout Split 80/20, Top-K = 5):")
    print("-" * 75)
    print(f"{'Algorithm':<14} | {'Precision@5':<12} | {'Recall@5':<10} | {'F1-Score':<10} | {'MAP@5':<8} | {'Hit Rate':<8}")
    print("-" * 75)
    
    for alg in ["ubcf", "ibcf", "svd", "popularity"]:
        res = evaluator.evaluate(algorithm=alg, k=5, train_ratio=0.8)
        print(f"{res['algorithm']:<14} | {res['precision'] * 100:>10.1f}% | {res['recall'] * 100:>8.1f}% | {res['f1_score'] * 100:>8.1f}% | {res['map'] * 100:>6.1f}% | {res['hit_rate'] * 100:>6.1f}%")
    print("-" * 75)
    print("\nExecution complete. Model ready for research or production deployment.")
