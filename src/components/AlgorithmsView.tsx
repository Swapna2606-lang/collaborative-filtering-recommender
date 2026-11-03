import React, { useState } from 'react';
import { Cpu, Users, Box, Network } from 'lucide-react';
import { User, Product, AlgorithmConfig } from '../types';
import {
  UserItemMatrix,
  computeUserSimilarityMatrix,
  computeItemSimilarityMatrix,
  trainSVD,
  SVDModel
} from '../engine/collaborativeFiltering';

interface AlgorithmsViewProps {
  userItemMatrix: UserItemMatrix;
  users: User[];
  products: Product[];
  algorithmConfig: AlgorithmConfig;
}

export const AlgorithmsView: React.FC<AlgorithmsViewProps> = ({
  userItemMatrix,
  users,
  products,
  algorithmConfig
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ubcf' | 'ibcf' | 'svd'>('ubcf');
  const [selectedUserForNeighbors, setSelectedUserForNeighbors] = useState<string>(users[0]?.id || '');
  const [selectedItemForSimilar, setSelectedItemForSimilar] = useState<string>(products[0]?.id || '');

  // Compute matrices on the fly
  const userSimMatrix = computeUserSimilarityMatrix(userItemMatrix, algorithmConfig.similarityMetric);
  const itemSimMatrix = computeItemSimilarityMatrix(userItemMatrix, algorithmConfig.similarityMetric);
  const svdModel: SVDModel = trainSVD(
    userItemMatrix,
    algorithmConfig.latentFactors,
    0.02,
    algorithmConfig.regularization,
    algorithmConfig.iterations
  );

  const uIdx = userItemMatrix.userIndexMap[selectedUserForNeighbors] ?? 0;
  const pIdx = userItemMatrix.productIndexMap[selectedItemForSimilar] ?? 0;

  // Neighbors of selected user
  const userNeighbors = userItemMatrix.userIds
    .map((id, idx) => ({
      userId: id,
      userObj: users.find((u) => u.id === id),
      similarity: userSimMatrix[uIdx][idx],
      coRatedCount: userItemMatrix.matrix[uIdx].filter(
        (r, p) => r > 0 && userItemMatrix.matrix[idx][p] > 0
      ).length
    }))
    .filter((n) => n.userId !== selectedUserForNeighbors)
    .sort((a, b) => b.similarity - a.similarity);

  // Similar items for selected item
  const similarItems = userItemMatrix.productIds
    .map((id, idx) => ({
      productId: id,
      productObj: products.find((p) => p.id === id),
      similarity: itemSimMatrix[pIdx][idx],
      coRatedCount: userItemMatrix.userIds.filter(
        (_, u) => userItemMatrix.matrix[u][pIdx] > 0 && userItemMatrix.matrix[u][idx] > 0
      ).length
    }))
    .filter((i) => i.productId !== selectedItemForSimilar)
    .sort((a, b) => b.similarity - a.similarity);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 font-mono mb-1">
          <Cpu className="w-4 h-4" />
          <span>COLLABORATIVE FILTERING ENGINE ARCHITECTURE</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Algorithms, Similarity Matrices & Latent Decompositions
        </h1>
        <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
          Deep-dive into the mathematical foundations of collaborative filtering: User-User $k$-NN, Item-Item
          similarity vectors, and Matrix Factorization via FunkSVD.
        </p>
      </div>

      {/* Segmented Sub-navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit text-xs font-medium">
        <button
          onClick={() => setActiveSubTab('ubcf')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'ubcf'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>01. User-Based CF (UBCF)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('ibcf')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'ibcf'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>02. Item-Based CF (IBCF)</span>
        </button>
        <button
          onClick={() => setActiveSubTab('svd')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'svd'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>03. Matrix Factorization (FunkSVD)</span>
        </button>
      </div>

      {/* Sub-Tab 1: UBCF */}
      {activeSubTab === 'ubcf' && (
        <div className="space-y-6">
          {/* Mathematical Formulation Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">
              User-Based Collaborative Filtering Formulation
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Finds peer users with similar interaction histories. Given an active user u and item i,
              the predicted rating r&#770;(u,i) is computed by adjusting the user's mean rating r&#772;(u)
              with the deviation of k-nearest neighbors v:
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-amber-400 overflow-x-auto">
              <code>
                {"r̂(u, i) = r̄(u) + [ ∑ sim(u, v) · (r(v, i) - r̄(v)) ] / [ ∑ |sim(u, v)| ]"}
              </code>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-4">
              <span>Metric: <strong className="text-slate-200">{algorithmConfig.similarityMetric.toUpperCase()}</strong></span>
              <span>·</span>
              <span>Neighborhood Size $k$: <strong className="text-amber-400 font-mono">{algorithmConfig.neighborhoodK}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User-User Similarity Matrix Heatmap */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  User-User Similarity Matrix ($S_U \in [-1, 1]$)
                </span>
                <span className="text-xs font-mono text-amber-400">Cosine/Pearson</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs font-mono border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800">
                      <th className="p-2 text-left font-sans">User</th>
                      {userItemMatrix.userIds.map((id) => (
                        <th key={id} className="p-2">
                          {users.find((u) => u.id === id)?.avatar || id.slice(-2)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {userItemMatrix.userIds.map((rowId, rIdx) => {
                      const rUser = users.find((u) => u.id === rowId);
                      return (
                        <tr key={rowId} className="border-b border-slate-800/50">
                          <td className="p-2 text-left font-sans text-slate-300 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded bg-slate-800 text-[10px] flex items-center justify-center text-amber-300">
                              {rUser?.avatar}
                            </span>
                            <span className="truncate max-w-[90px]">{rUser?.name.split(' ')[0]}</span>
                          </td>
                          {userItemMatrix.userIds.map((colId, cIdx) => {
                            const sim = userSimMatrix[rIdx][cIdx];
                            let cellBg = 'bg-slate-950/60 text-slate-500';
                            if (rIdx === cIdx) cellBg = 'bg-slate-800 text-slate-400';
                            else if (sim >= 0.7) cellBg = 'bg-amber-500 text-slate-950 font-bold';
                            else if (sim >= 0.4) cellBg = 'bg-amber-600/70 text-white font-semibold';
                            else if (sim > 0.1) cellBg = 'bg-amber-900/40 text-amber-300';

                            return (
                              <td key={colId} className="p-1">
                                <div className={`py-1 rounded tabular-nums ${cellBg}`}>
                                  {sim.toFixed(2)}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Neighborhood k-NN Inspector */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  k-NN Neighborhood Inspector
                </span>
                <select
                  value={selectedUserForNeighbors}
                  onChange={(e) => setSelectedUserForNeighbors(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-slate-400">
                Sorted list of peer users ranked by correlation score with the selected target user:
              </p>

              <div className="space-y-2">
                {userNeighbors.slice(0, 5).map((neighbor, rank) => (
                  <div
                    key={neighbor.userId}
                    className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-amber-400 font-bold">#{rank + 1}</span>
                      <div>
                        <span className="text-xs font-medium text-slate-200 block">
                          {neighbor.userObj?.name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {neighbor.userObj?.role} · {neighbor.coRatedCount} co-interacted items
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                        {(neighbor.similarity * 100).toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-slate-500 block">similarity</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: IBCF */}
      {activeSubTab === 'ibcf' && (
        <div className="space-y-6">
          {/* Mathematical Formulation Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">
              Item-Based Collaborative Filtering Formulation
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Computes pairwise similarity between products based on co-interaction patterns across all users.
              To predict user u rating on candidate product i, we take the weighted average of ratings on
              items j previously interacted with:
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-amber-400 overflow-x-auto">
              <code>
                {"r̂(u, i) = [ ∑ sim(i, j) · r(u, j) ] / [ ∑ |sim(i, j)| ]"}
              </code>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Item-Item Similarity Matrix Heatmap */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">
                  Item-Item Similarity Matrix S_I (|I| × |I|)
                </span>
                <span className="text-xs font-mono text-amber-400">Cosine Vectors</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center text-[11px] font-mono border-collapse">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800">
                      <th className="p-1.5 text-left font-sans">Item</th>
                      {userItemMatrix.productIds.map((pId) => (
                        <th key={pId} className="p-1" title={products.find((p) => p.id === pId)?.name}>
                          {pId.replace('prod-', 'P')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {userItemMatrix.productIds.map((rowId, rIdx) => {
                      const pObj = products.find((p) => p.id === rowId);
                      return (
                        <tr key={rowId} className="border-b border-slate-800/50">
                          <td className="p-1.5 text-left font-sans text-slate-300 truncate max-w-[100px]">
                            {rowId.replace('prod-', 'P')}: {pObj?.name.split(' ')[0]}
                          </td>
                          {userItemMatrix.productIds.map((colId, cIdx) => {
                            const sim = itemSimMatrix[rIdx][cIdx];
                            let cellBg = 'bg-slate-950/60 text-slate-500';
                            if (rIdx === cIdx) cellBg = 'bg-slate-800 text-slate-400';
                            else if (sim >= 0.7) cellBg = 'bg-amber-500 text-slate-950 font-bold';
                            else if (sim >= 0.4) cellBg = 'bg-amber-600/70 text-white font-semibold';
                            else if (sim > 0.1) cellBg = 'bg-amber-900/40 text-amber-300';

                            return (
                              <td key={colId} className="p-0.5">
                                <div className={`py-1 rounded tabular-nums ${cellBg}`}>
                                  {sim.toFixed(2)}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Item Affinity Ranking Inspector */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Item Affinity Inspector</span>
                <select
                  value={selectedItemForSimilar}
                  onChange={(e) => setSelectedItemForSimilar(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-xs text-slate-400">
                Products frequently bought/interacted alongside this product in the catalog:
              </p>

              <div className="space-y-2">
                {similarItems.slice(0, 5).map((item, rank) => (
                  <div
                    key={item.productId}
                    className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-amber-400 font-bold">#{rank + 1}</span>
                      <div>
                        <span className="text-xs font-medium text-slate-200 block">
                          {item.productObj?.name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {item.productObj?.category} · ${item.productObj?.price} · {item.coRatedCount} co-interactions
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
                        {(item.similarity * 100).toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-slate-500 block">affinity</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: SVD Matrix Factorization */}
      {activeSubTab === 'svd' && (
        <div className="space-y-6">
          {/* Formulation */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">
              Regularized Latent Factor SVD Decomposition
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Factorizes the sparse interaction matrix R into a user embedding matrix P (|U| × k)
              and item embedding matrix Q (|I| × k) in a shared low-dimensional latent space
              (Rank k = {algorithmConfig.latentFactors}), regularized to avoid overfitting:
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-amber-400 overflow-x-auto">
              <code>
                {"r̂(u, i) = μ + b(u) + b(i) + P(u) · Q(i)ᵀ  |  Loss = ∑ (r(u,i) - r̂(u,i))² + λ (||P||² + ||Q||²)"}
              </code>
            </div>
          </div>

          {/* 2D Latent Factor Projection Scatter Plot */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-sm font-semibold text-white">
                  2D Latent Factor Taste Space ($k_1$ vs $k_2$)
                </span>
                <p className="text-xs text-slate-400">
                  Visualizes users (triangles) and products (circles) mapped onto the two primary latent dimensions.
                  Closer points indicate stronger affinity.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  <span>Products (Q)</span>
                </div>
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2.5 h-2.5 rotate-45 bg-cyan-400 inline-block" />
                  <span>Users (P)</span>
                </div>
              </div>
            </div>

            {/* SVG Coordinate Space */}
            <div className="relative w-full h-80 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-4">
              <svg className="w-full h-full" viewBox="0 0 600 320">
                {/* Axes */}
                <line x1="50" y1="160" x2="550" y2="160" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="300" y1="20" x2="300" y2="300" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                <text x="540" y="150" fill="#64748b" fontSize="10" fontFamily="monospace">Dim 1</text>
                <text x="310" y="30" fill="#64748b" fontSize="10" fontFamily="monospace">Dim 2</text>

                {/* Items Q */}
                {userItemMatrix.productIds.map((pId, idx) => {
                  const factor1 = svdModel.itemFactors[idx]?.[0] || 0;
                  const factor2 = svdModel.itemFactors[idx]?.[1] || 0;
                  const cx = 300 + factor1 * 260;
                  const cy = 160 - factor2 * 240;
                  const prod = products.find((p) => p.id === pId);

                  return (
                    <g key={pId} className="cursor-pointer group">
                      <circle cx={cx} cy={cy} r="6" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
                      <text
                        x={cx + 8}
                        y={cy + 4}
                        fill="#cbd5e1"
                        fontSize="9"
                        fontFamily="monospace"
                        className="opacity-80 group-hover:opacity-100"
                      >
                        {prod?.name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}

                {/* Users P */}
                {userItemMatrix.userIds.map((uId, idx) => {
                  const factor1 = svdModel.userFactors[idx]?.[0] || 0;
                  const factor2 = svdModel.userFactors[idx]?.[1] || 0;
                  const cx = 300 + factor1 * 260;
                  const cy = 160 - factor2 * 240;
                  const uObj = users.find((u) => u.id === uId);

                  return (
                    <g key={uId} className="cursor-pointer group">
                      <polygon
                        points={`${cx},${cy - 7} ${cx - 6},${cy + 5} ${cx + 6},${cy + 5}`}
                        fill="#22d3ee"
                        stroke="#0891b2"
                        strokeWidth="1.5"
                      />
                      <text
                        x={cx + 8}
                        y={cy + 4}
                        fill="#38bdf8"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                        className="opacity-90 group-hover:opacity-100"
                      >
                        {uObj?.name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
