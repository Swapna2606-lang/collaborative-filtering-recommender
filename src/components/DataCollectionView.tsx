import React, { useState } from 'react';
import { Database, Filter, PlusCircle, RotateCcw, Activity, Flame, Table } from 'lucide-react';
import {
  UserInteraction,
  User,
  Product,
  InteractionWeightsConfig,
  InteractionType
} from '../types';
import { UserItemMatrix } from '../engine/collaborativeFiltering';
import { D3InteractionHeatmap } from './D3InteractionHeatmap';

interface DataCollectionViewProps {
  interactions: UserInteraction[];
  users: User[];
  products: Product[];
  weightsConfig: InteractionWeightsConfig;
  setWeightsConfig: React.Dispatch<React.SetStateAction<InteractionWeightsConfig>>;
  userItemMatrix: UserItemMatrix;
  onGenerateSyntheticInteractions: (count: number) => void;
  onResetInteractions: () => void;
  onAddManualInteraction: (
    userId: string,
    productId: string,
    type: InteractionType,
    value: number
  ) => void;
}

export const DataCollectionView: React.FC<DataCollectionViewProps> = ({
  interactions,
  users,
  products,
  weightsConfig,
  setWeightsConfig,
  userItemMatrix,
  onGenerateSyntheticInteractions,
  onResetInteractions,
  onAddManualInteraction
}) => {
  const [matrixViewMode, setMatrixViewMode] = useState<'d3_density' | 'numeric_table'>('d3_density');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedCell, setSelectedCell] = useState<{ uId: string; pId: string } | null>(null);

  // Manual event insertion state
  const [manualUser, setManualUser] = useState<string>(users[0]?.id || '');
  const [manualProduct, setManualProduct] = useState<string>(products[0]?.id || '');
  const [manualType, setManualType] = useState<InteractionType>('purchase');
  const [manualRating, setManualRating] = useState<number>(5.0);

  const filteredInteractions = [...interactions]
    .filter((int) => {
      const matchUser = selectedUserFilter === 'all' || int.userId === selectedUserFilter;
      const matchType = selectedTypeFilter === 'all' || int.type === selectedTypeFilter;
      return matchUser && matchType;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  const getUserName = (id: string) => users.find((u) => u.id === id)?.name || id;
  const getProductName = (id: string) => products.find((p) => p.id === id)?.name || id;

  const handleWeightChange = (key: keyof InteractionWeightsConfig, val: number) => {
    setWeightsConfig((prev) => ({
      ...prev,
      [key]: val
    }));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddManualInteraction(
      manualUser,
      manualProduct,
      manualType,
      manualType === 'rating' ? manualRating : weightsConfig[manualType as keyof InteractionWeightsConfig] || 1.0
    );
  };

  // Inspect selected cell interactions
  const cellInteractions = selectedCell
    ? interactions.filter(
        (i) => i.userId === selectedCell.uId && i.productId === selectedCell.pId
      )
    : [];

  return (
    <div className="space-y-8 pb-16">
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 font-mono mb-1">
          <Database className="w-4 h-4" />
          <span>DATA COLLECTION PIPELINE</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          User Interaction Logging & Matrix Ingestion
        </h1>
        <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
          Collaborative filtering requires rich user-item interaction signals. We capture both implicit
          telemetry (views, cart additions, purchases) and explicit feedback (1-5 star ratings) and map them
          into a normalized preference matrix $R$.
        </p>
      </div>

      {/* Top Controls: Implicit Conversion Weights & Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Implicit Weight Scoring Engine */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200">
              Implicit Signal Weighting Scheme
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Mapped to 1.0 - 5.0 scale</span>
          </div>
          <p className="text-xs text-slate-400">
            Define point weights for implicit actions. A higher weight signals stronger user affinity,
            converting interactions into inferred ratings.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div>
              <span className="text-xs text-slate-400 block mb-1">View</span>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="5.0"
                value={weightsConfig.view}
                onChange={(e) => handleWeightChange('view', parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">+1.0 baseline</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-1">Click Detail</span>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="5.0"
                value={weightsConfig.click_detail}
                onChange={(e) => handleWeightChange('click_detail', parseFloat(e.target.value) || 2)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Inspect specs</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-1">Wishlist</span>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="5.0"
                value={weightsConfig.wishlist}
                onChange={(e) => handleWeightChange('wishlist', parseFloat(e.target.value) || 2.5)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Saved intent</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-1">Add to Cart</span>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="5.0"
                value={weightsConfig.add_to_cart}
                onChange={(e) => handleWeightChange('add_to_cart', parseFloat(e.target.value) || 3.5)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">High intent</span>
            </div>

            <div>
              <span className="text-xs text-slate-400 block mb-1">Purchase</span>
              <input
                type="number"
                step="0.5"
                min="1.0"
                max="5.0"
                value={weightsConfig.purchase}
                onChange={(e) => handleWeightChange('purchase', parseFloat(e.target.value) || 5.0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Conversion</span>
            </div>
          </div>
        </div>

        {/* Synthetic Generator & Dataset Tools */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-sm font-semibold text-slate-200 block mb-1">
              Dataset Ingestion & Batch Simulation
            </span>
            <p className="text-xs text-slate-400 mb-3">
              Generate realistic user interaction bursts to test how collaborative filtering reacts to new data.
            </p>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onGenerateSyntheticInteractions(10)}
                className="py-2 px-3 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+10 Interactions</span>
              </button>
              <button
                onClick={() => onGenerateSyntheticInteractions(25)}
                className="py-2 px-3 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+25 Interactions</span>
              </button>
            </div>

            <button
              onClick={onResetInteractions}
              className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Seed Dataset</span>
            </button>
          </div>
        </div>
      </div>

      {/* User-Item Matrix & D3 Density Section */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                User-Item Interaction Matrix & Density Analysis
              </span>
              <span className="text-xs text-amber-400 font-mono">
                {userItemMatrix.userIds.length} Users × {userItemMatrix.productIds.length} Items
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualize matrix sparsity, co-occurrence clustering, and cold-start boundaries using D3.js.
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setMatrixViewMode('d3_density')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                matrixViewMode === 'd3_density'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>D3 Density Heatmap</span>
            </button>
            <button
              onClick={() => setMatrixViewMode('numeric_table')}
              className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
                matrixViewMode === 'numeric_table'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Numeric Table</span>
            </button>
          </div>
        </div>

        {/* Dynamic View: D3 Heatmap vs Numeric Table */}
        {matrixViewMode === 'd3_density' ? (
          <D3InteractionHeatmap
            interactions={interactions}
            users={users}
            products={products}
            onAddManualInteraction={onAddManualInteraction}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Entries show normalized ratings (1.0 to 5.0). Empty cells indicate unobserved candidate pairs.</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-950 border border-slate-800 inline-block" />
                  <span>Unobserved (0.0)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-900/60 inline-block" />
                  <span>Low (1-3)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
                  <span>High (4-5★)</span>
                </div>
              </div>
            </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                <th className="p-2.5 font-medium whitespace-nowrap min-w-[130px]">User \ Item</th>
                {products.map((p) => (
                  <th key={p.id} className="p-2 text-center font-medium min-w-[70px] max-w-[100px] truncate" title={p.name}>
                    {p.name.split(' ')[0]}
                  </th>
                ))}
                <th className="p-2 text-center font-medium bg-slate-950 min-w-[60px]">Avg r̄_u</th>
              </tr>
            </thead>
            <tbody>
              {userItemMatrix.userIds.map((uId, uIdx) => {
                const uObj = users.find((u) => u.id === uId);
                const avg = userItemMatrix.userAverages[uIdx];

                return (
                  <tr key={uId} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="p-2.5 font-sans font-medium text-slate-200 whitespace-nowrap flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-slate-800 text-[10px] font-mono flex items-center justify-center text-amber-300">
                        {uObj?.avatar || 'U'}
                      </span>
                      <span className="truncate">{uObj?.name || uId}</span>
                    </td>

                    {userItemMatrix.productIds.map((pId, pIdx) => {
                      const val = userItemMatrix.matrix[uIdx][pIdx];
                      const isSelected = selectedCell?.uId === uId && selectedCell?.pId === pId;

                      // Color interpolation based on rating
                      let bgClass = 'bg-slate-950/40 text-slate-600';
                      if (val >= 4.5) bgClass = 'bg-amber-500 text-slate-950 font-bold';
                      else if (val >= 3.8) bgClass = 'bg-amber-600/70 text-amber-100 font-bold';
                      else if (val >= 2.5) bgClass = 'bg-amber-800/50 text-amber-200';
                      else if (val > 0) bgClass = 'bg-amber-950/50 text-amber-400';

                      return (
                        <td key={pId} className="p-1 text-center">
                          <button
                            onClick={() => setSelectedCell({ uId, pId })}
                            className={`w-full py-1.5 rounded transition-all tabular-nums ${bgClass} ${
                              isSelected ? 'ring-2 ring-white scale-105' : 'hover:opacity-80'
                            }`}
                          >
                            {val > 0 ? val.toFixed(1) : '·'}
                          </button>
                        </td>
                      );
                    })}

                    <td className="p-2 text-center text-amber-300/80 bg-slate-950/50 font-bold tabular-nums">
                      {avg.toFixed(1)}
                    </td>
                  </tr>
                );
              })}

              {/* Item Averages Row */}
              <tr className="bg-slate-950/80 font-bold text-slate-300">
                <td className="p-2.5 font-sans">Avg Item r̄_i</td>
                {userItemMatrix.productIds.map((pId, pIdx) => (
                  <td key={pId} className="p-2 text-center text-amber-300/80 tabular-nums">
                    {userItemMatrix.itemAverages[pIdx].toFixed(1)}
                  </td>
                ))}
                <td className="p-2 text-center text-amber-400 font-mono">
                  {userItemMatrix.globalAverage.toFixed(1)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Selected Cell Audit Box */}
        {selectedCell && (
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-400">Inspecting Interaction: </span>
              <span className="text-white font-medium">{getUserName(selectedCell.uId)}</span>
              <span className="text-slate-500"> × </span>
              <span className="text-amber-400 font-medium">{getProductName(selectedCell.pId)}</span>
              <span className="text-slate-400 ml-3">
                ({cellInteractions.length} raw interaction events)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {cellInteractions.map((ci) => (
                <span
                  key={ci.id}
                  className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono"
                >
                  {ci.type} ({ci.value})
                </span>
              ))}
              <button
                onClick={() => setSelectedCell(null)}
                className="text-slate-500 hover:text-slate-300 ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        )}
          </div>
        )}
      </section>

      {/* Manual Signal Injection Form */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Activity className="w-4 h-4 text-amber-400" />
          <span>Manual Interaction Dispatcher</span>
        </div>
        <p className="text-xs text-slate-400">
          Simulate a specific user action on any product to verify immediate retraining of collaborative models.
        </p>

        <form onSubmit={handleManualSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <div>
            <label className="text-xs text-slate-400 block mb-1">User</label>
            <select
              value={manualUser}
              onChange={(e) => setManualUser(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Product</label>
            <select
              value={manualProduct}
              onChange={(e) => setManualProduct(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Action Type</label>
            <select
              value={manualType}
              onChange={(e) => setManualType(e.target.value as InteractionType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
            >
              <option value="view">View (+{weightsConfig.view})</option>
              <option value="click_detail">Click Detail (+{weightsConfig.click_detail})</option>
              <option value="wishlist">Wishlist (+{weightsConfig.wishlist})</option>
              <option value="add_to_cart">Add to Cart (+{weightsConfig.add_to_cart})</option>
              <option value="purchase">Purchase (+{weightsConfig.purchase})</option>
              <option value="rating">Explicit Star Rating</option>
            </select>
          </div>

          {manualType === 'rating' ? (
            <div>
              <label className="text-xs text-slate-400 block mb-1">Rating Value</label>
              <select
                value={manualRating}
                onChange={(e) => setManualRating(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
              >
                <option value="1">1 Star</option>
                <option value="2">2 Stars</option>
                <option value="3">3 Stars</option>
                <option value="4">4 Stars</option>
                <option value="5">5 Stars</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="text-xs text-slate-400 block mb-1">Signal Score</label>
              <input
                type="text"
                disabled
                value={`+${weightsConfig[manualType as keyof InteractionWeightsConfig] || 1.0}`}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-amber-400 font-mono"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
          >
            Dispatch Event
          </button>
        </form>
      </section>

      {/* Raw Interaction Event Stream Log */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-sm font-semibold text-white">Live Interaction Event Log</span>
            <span className="text-xs text-slate-400 ml-2 font-mono">
              ({filteredInteractions.length} recorded events)
            </span>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Actions</option>
              <option value="view">View</option>
              <option value="click_detail">Click Detail</option>
              <option value="wishlist">Wishlist</option>
              <option value="add_to_cart">Add to Cart</option>
              <option value="purchase">Purchase</option>
              <option value="rating">Rating</option>
            </select>
          </div>
        </div>

        {/* Log Table */}
        <div className="border border-slate-800 rounded-lg overflow-hidden max-h-72 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 sticky top-0 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="p-2.5 font-medium">Timestamp</th>
                <th className="p-2.5 font-medium">User</th>
                <th className="p-2.5 font-medium">Product</th>
                <th className="p-2.5 font-medium">Event Type</th>
                <th className="p-2.5 font-medium font-mono">Raw Signal</th>
                <th className="p-2.5 font-medium font-mono">Normalized (1-5)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredInteractions.map((int) => (
                <tr key={int.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                    {new Date(int.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>
                  <td className="p-2.5 text-slate-200 font-medium">{getUserName(int.userId)}</td>
                  <td className="p-2.5 text-slate-300">{getProductName(int.productId)}</td>
                  <td className="p-2.5">
                    <span className="font-mono text-xs text-slate-300">{int.type}</span>
                  </td>
                  <td className="p-2.5 font-mono text-amber-400">{int.value.toFixed(1)}</td>
                  <td className="p-2.5 font-mono font-bold text-slate-100">
                    {int.normalizedScore.toFixed(1)}★
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
