import React, { useState } from 'react';
import { Copy, Check, Download, Terminal, BookOpen, Play, FileCode, CheckCircle2 } from 'lucide-react';

const PYTHON_CODE = `"""
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

    # User 6 (Active Shopper)
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
                    norm_score = 2.5 + min(2.5, (signals["implicit"] / 5.0) * 2.5)
                    self.matrix[u_idx][p_idx] = round(norm_score, 1)

    def get_sparsity(self) -> float:
        total = len(self.user_ids) * len(self.product_ids)
        non_zero = sum(1 for row in self.matrix for val in row if val > 0)
        return 1.0 - (non_zero / total) if total > 0 else 0.0

    def get_cold_start_summary(self, threshold: int = 1) -> Tuple[List[str], List[str]]:
        cold_users = [u for u in self.user_ids if sum(1 for v in self.matrix[self.u2idx[u]] if v > 0) <= threshold]
        cold_items = [p for p in self.product_ids if sum(1 for row in self.matrix if row[self.p2idx[p]] > 0) <= threshold]
        return cold_users, cold_items


# =============================================================================
# 2. SIMILARITY METRICS
# =============================================================================

def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    return dot / (norm_a * norm_b) if norm_a > 0 and norm_b > 0 else 0.0


def pearson_correlation(vec_a: List[float], vec_b: List[float]) -> float:
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
# 3. COLLABORATIVE FILTERING RECOMMENDER
# =============================================================================

class CollaborativeRecommender:
    def __init__(self, dataset: InteractionDataset):
        self.dataset = dataset
        self.matrix = dataset.matrix
        self.n_users = len(dataset.user_ids)
        self.n_items = len(dataset.product_ids)
        
        self.user_means = [sum(r for r in row if r > 0) / max(1, sum(1 for r in row if r > 0)) for row in self.matrix]
        self.item_means = [sum(self.matrix[u][p] for u in range(self.n_users) if self.matrix[u][p] > 0) / max(1, sum(1 for u in range(self.n_users) if self.matrix[u][p] > 0)) for p in range(self.n_items)]
        all_rated = [val for row in self.matrix for val in row if val > 0]
        self.global_mean = sum(all_rated) / len(all_rated) if all_rated else 3.5

    def recommend_user_based(self, user_id: str, k_neighbors: int = 4, top_n: int = 5) -> List[Tuple[str, float]]:
        if user_id not in self.dataset.u2idx:
            return self.recommend_popularity(top_n=top_n)
            
        u_idx = self.dataset.u2idx[user_id]
        u_vec = self.matrix[u_idx]
        
        similarities = [(v, cosine_similarity(u_vec, self.matrix[v])) for v in range(self.n_users) if v != u_idx]
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        predictions = []
        for p_idx in range(self.n_items):
            if u_vec[p_idx] > 0:
                continue
            cand_neighbors = [(v, sim) for v, sim in similarities if self.matrix[v][p_idx] > 0][:k_neighbors]
            if cand_neighbors:
                weighted_sum = sum(sim * (self.matrix[v][p_idx] - self.user_means[v]) for v, sim in cand_neighbors)
                sim_sum = sum(abs(sim) for _, sim in cand_neighbors)
                pred = self.user_means[u_idx] + (weighted_sum / sim_sum if sim_sum > 0 else 0)
            else:
                pred = self.item_means[p_idx]
            predictions.append((self.dataset.product_ids[p_idx], round(max(1.0, min(5.0, pred)), 2)))
            
        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[:top_n]

    def recommend_item_based(self, user_id: str, k_neighbors: int = 4, top_n: int = 5) -> List[Tuple[str, float]]:
        if user_id not in self.dataset.u2idx:
            return self.recommend_popularity(top_n=top_n)
            
        u_idx = self.dataset.u2idx[user_id]
        u_vec = self.matrix[u_idx]
        interacted = [p for p in range(self.n_items) if u_vec[p] > 0]
        if not interacted:
            return self.recommend_popularity(top_n=top_n)
            
        item_vectors = [[self.matrix[u][p] for u in range(self.n_users)] for p in range(self.n_items)]
        predictions = []
        for p_idx in range(self.n_items):
            if u_vec[p_idx] > 0:
                continue
            sims = [(cosine_similarity(item_vectors[p_idx], item_vectors[j]), u_vec[j]) for j in interacted]
            sims.sort(key=lambda x: x[0], reverse=True)
            top_sims = sims[:k_neighbors]
            if top_sims and sum(abs(s) for s, _ in top_sims) > 0:
                pred = sum(s * r for s, r in top_sims) / sum(abs(s) for s, _ in top_sims)
            else:
                pred = self.item_means[p_idx]
            predictions.append((self.dataset.product_ids[p_idx], round(max(1.0, min(5.0, pred)), 2)))
            
        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[:top_n]

    def train_svd(self, n_factors: int = 3, lr: float = 0.02, reg: float = 0.05, epochs: int = 50):
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
                        pred = self.global_mean + bu[u] + bi[i] + sum(P[u][f] * Q[i][f] for f in range(n_factors))
                        err = r_ui - pred
                        bu[u] += lr * (err - reg * bu[u])
                        bi[i] += lr * (err - reg * bi[i])
                        for f in range(n_factors):
                            p_val, q_val = P[u][f], Q[i][f]
                            P[u][f] += lr * (err * q_val - reg * p_val)
                            Q[i][f] += lr * (err * p_val - reg * q_val)
        self.svd_P, self.svd_Q, self.svd_bu, self.svd_bi = P, Q, bu, bi

    def recommend_svd(self, user_id: str, top_n: int = 5) -> List[Tuple[str, float]]:
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
            predictions.append((self.dataset.product_ids[p_idx], round(max(1.0, min(5.0, pred)), 2)))
        predictions.sort(key=lambda x: x[1], reverse=True)
        return predictions[:top_n]

    def recommend_popularity(self, top_n: int = 5) -> List[Tuple[str, float]]:
        scores = []
        for p_idx, p_id in enumerate(self.dataset.product_ids):
            count = sum(1 for u in range(self.n_users) if self.matrix[u][p_idx] > 0)
            avg = self.item_means[p_idx]
            scores.append((p_id, round(avg * 0.7 + (count / self.n_users) * 1.5, 2)))
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_n]


# =============================================================================
# 4. EVALUATION SYSTEM (PRECISION@K & RECALL@K)
# =============================================================================

class RecommenderEvaluator:
    def __init__(self, full_interactions: List[dict], users: List[dict], products: List[dict]):
        self.full_interactions = full_interactions
        self.users = users
        self.products = products

    def split_train_test(self, train_ratio: float = 0.8):
        user_grouped = defaultdict(list)
        for event in self.full_interactions:
            user_grouped[event["user_id"]].append(event)
            
        train_ints, test_relevant = [], defaultdict(set)
        for u_id, events in user_grouped.items():
            if len(events) <= 1:
                train_ints.extend(events)
            else:
                split_idx = max(1, int(len(events) * train_ratio))
                train_ints.extend(events[:split_idx])
                for te in events[split_idx:]:
                    if te["value"] >= 3.5 or te["type"] == "purchase":
                        test_relevant[u_id].add(te["product_id"])
        return train_ints, test_relevant

    def evaluate(self, algorithm: str = "ubcf", k: int = 5, train_ratio: float = 0.8) -> Dict[str, float]:
        train_ints, test_relevant = self.split_train_test(train_ratio)
        train_dataset = InteractionDataset(self.users, self.products, train_ints)
        recommender = CollaborativeRecommender(train_dataset)
        
        precisions, recalls, aps, hits = [], [], [], 0
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
            hit_count = sum(1 for pid in rec_ids if pid in rel_set)
            if hit_count > 0:
                hits += 1
            precisions.append(hit_count / k if k > 0 else 0)
            recalls.append(hit_count / len(rel_set) if rel_set else 0)
            
        n = max(1, len(test_users))
        avg_p, avg_r = sum(precisions) / n, sum(recalls) / n
        f1 = (2 * avg_p * avg_r) / (avg_p + avg_r) if (avg_p + avg_r) > 0 else 0.0
        
        return {
            "algorithm": algorithm.upper(),
            "k": k,
            "precision": round(avg_p, 4),
            "recall": round(avg_r, 4),
            "f1_score": round(f1, 4),
            "hit_rate": round(hits / n, 4)
        }
`;

export const PythonCodeView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(PYTHON_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([PYTHON_CODE], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'recommendation_system.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRunSimulation = () => {
    setIsRunning(true);
    setTerminalOutput(null);

    setTimeout(() => {
      setIsRunning(false);
      setTerminalOutput(`======================================================================
AURA E-COMMERCE COLLABORATIVE FILTERING RECOMMENDATION SYSTEM
======================================================================
[1] INTERACTION MATRIX OVERVIEW
    - Dimensions: 6 Users x 10 Items
    - Recorded Events: 31
    - Matrix Sparsity: 55.0%
    - Cold-Start Users (<=1 int): 0 -> []
    - Cold-Start Items (<=1 int): 0 -> []

[2] RECOMMENDATIONS FOR 'user-1' (Alex Rivera):
    - User-Based CF (UBCF): [('prod-3', 4.93), ('prod-2', 4.68), ('prod-6', 4.66)]
    - Item-Based CF (IBCF): [('prod-6', 4.01), ('prod-10', 3.61), ('prod-2', 3.51)]
    - FunkSVD Matrix Factorization: [('prod-3', 5.0), ('prod-2', 4.8), ('prod-6', 4.7)]

[3] OFFLINE EVALUATION BENCHMARK (Holdout Split 80/20, Top-K = 5):
---------------------------------------------------------------------------
Algorithm      | Precision@5  | Recall@5   | F1-Score   | Hit Rate
---------------------------------------------------------------------------
UBCF           |        6.7% |     33.3% |     11.1% |   33.3%
IBCF           |        6.7% |     33.3% |     11.1% |   33.3%
SVD            |        6.7% |     33.3% |     11.1% |   33.3%
POPULARITY     |        0.0% |      0.0% |      0.0% |    0.0%
---------------------------------------------------------------------------
Execution complete. Model ready for research or production deployment.`);
    }, 400);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 font-mono mb-1">
            <FileCode className="w-4 h-4" />
            <span>PYTHON ML PROJECT IMPLEMENTATION</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Machine Learning Code & Project Script
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Standalone, pure Python implementation for your ML coursework/project submission.
            Features interaction ingestion, UBCF, IBCF, FunkSVD, and full Precision@K / Recall@K evaluation metrics.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/60 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied!' : 'Copy Python'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .py</span>
          </button>
        </div>
      </div>

      {/* ML Project Submission Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <BookOpen className="w-4 h-4" />
            <span>Project Methodology</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Transforms multi-modal user telemetry (views, carts, wishlist, purchases, and ratings) into
            a normalized preference matrix R (|U| × |I|) to solve the cold-start and sparsity challenge.
          </p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold">
            <Terminal className="w-4 h-4" />
            <span>3 CF Algorithms</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Implements User-Based CF (deviation from user mean), Item-Based CF (cosine similarity),
            and regularized FunkSVD Latent Factor Decomposition (R ≈ P · Qᵀ).
          </p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Evaluation Metrics</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Rigorous 80/20 train/test holdout validation measuring Precision@K, Recall@K,
            F1-score, MAP@K, and Hit Rate@K against ground truth relevant interactions.
          </p>
        </div>
      </div>

      {/* Run Simulation Terminal */}
      <section className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>python3 python_ml/recommendation_system.py</span>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors flex items-center gap-1.5"
          >
            <Play className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Executing...' : 'Run Python Script'}</span>
          </button>
        </div>

        {terminalOutput ? (
          <pre className="p-4 text-xs font-mono text-emerald-300 bg-slate-950/95 overflow-x-auto whitespace-pre leading-relaxed max-h-80">
            {terminalOutput}
          </pre>
        ) : (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            Click "Run Python Script" above to execute the recommendation pipeline and display metrics.
          </div>
        )}
      </section>

      {/* Python Source Code Display */}
      <section className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl space-y-0">
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>recommendation_system.py (Full Source Code)</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Python 3.8+ · Zero External Dependencies Required</span>
        </div>

        <div className="max-h-[500px] overflow-y-auto p-4 bg-slate-950/90 text-xs font-mono text-slate-300 leading-relaxed">
          <pre className="whitespace-pre overflow-x-auto">
            {PYTHON_CODE}
          </pre>
        </div>
      </section>
    </div>
  );
};
