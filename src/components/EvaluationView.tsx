import React, { useState } from 'react';
import {
  BarChart3,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import {
  EvaluationResults,
  BenchmarkComparison,
  RecommendationAlgorithm,
  User,
  Product,
  InteractionWeightsConfig,
  AlgorithmConfig,
  UserInteraction
} from '../types';
import { evaluateRecommendationModel, runAlgorithmBenchmark } from '../engine/evaluation';

interface EvaluationViewProps {
  interactions: UserInteraction[];
  users: User[];
  products: Product[];
  weightsConfig: InteractionWeightsConfig;
  algorithmConfig: AlgorithmConfig;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({
  interactions,
  users,
  products,
  weightsConfig,
  algorithmConfig
}) => {
  const [evalAlgorithm, setEvalAlgorithm] = useState<RecommendationAlgorithm>('ubcf');
  const [topK, setTopK] = useState<number>(5);
  const [trainRatio, setTrainRatio] = useState<number>(0.8);
  const [relevanceThreshold, setRelevanceThreshold] = useState<number>(3.5);
  const [selectedUserDetail, setSelectedUserDetail] = useState<string | null>(null);

  // Compute evaluation results for active algorithm
  const results: EvaluationResults = evaluateRecommendationModel(
    evalAlgorithm,
    interactions,
    users,
    products,
    weightsConfig,
    algorithmConfig,
    topK,
    trainRatio,
    relevanceThreshold
  );

  // Compute benchmark comparisons across all 4 algorithms on identical split
  const benchmark: BenchmarkComparison[] = runAlgorithmBenchmark(
    interactions,
    users,
    products,
    weightsConfig,
    algorithmConfig,
    topK,
    trainRatio,
    relevanceThreshold
  );

  const getProductName = (id: string) => products.find((p) => p.id === id)?.name || id;

  // Selected user audit
  const detailedUser = selectedUserDetail
    ? results.userBreakdown.find((u) => u.userId === selectedUserDetail)
    : null;

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 font-mono mb-1">
          <BarChart3 className="w-4 h-4" />
          <span>OFFLINE MODEL EVALUATION BENCHMARK</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          System Performance: Precision & Recall Metrics
        </h1>
        <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
          Rigorous offline evaluation of collaborative filtering recommendations using holdout train/test splits.
          Measures retrieval accuracy, ranking order (MAP, NDCG), and catalog coverage.
        </p>
      </div>

      {/* Control Strip: Top-K, Relevance Threshold, Algorithm, Train/Test Split */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-white">Evaluation Parameters</span>
          </div>

          <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setEvalAlgorithm('ubcf')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                evalAlgorithm === 'ubcf'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              UBCF
            </button>
            <button
              onClick={() => setEvalAlgorithm('ibcf')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                evalAlgorithm === 'ibcf'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              IBCF
            </button>
            <button
              onClick={() => setEvalAlgorithm('svd')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                evalAlgorithm === 'svd'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              FunkSVD
            </button>
            <button
              onClick={() => setEvalAlgorithm('popularity')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                evalAlgorithm === 'popularity'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Baseline
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1 text-xs">
          {/* Top-K Slider */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Top-K Recommendation Cutoff:</span>
              <span className="text-amber-400 font-mono font-bold">K = {topK}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block mt-1">
              Evaluates top {topK} items retrieved for each user.
            </span>
          </div>

          {/* Relevance Threshold Slider */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Relevance Threshold:</span>
              <span className="text-amber-400 font-mono font-bold">≥ {relevanceThreshold.toFixed(1)}★</span>
            </div>
            <input
              type="range"
              min="2.5"
              max="4.5"
              step="0.5"
              value={relevanceThreshold}
              onChange={(e) => setRelevanceThreshold(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block mt-1">
              Test items rated at or above this score count as ground truth positives.
            </span>
          </div>

          {/* Train/Test Ratio Slider */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Train / Test Split:</span>
              <span className="text-amber-400 font-mono font-bold">
                {(trainRatio * 100).toFixed(0)}% / {((1 - trainRatio) * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.6"
              max="0.85"
              step="0.05"
              value={trainRatio}
              onChange={(e) => setTrainRatio(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block mt-1">
              User-stratified holdout partitioning ratio.
            </span>
          </div>
        </div>
      </section>

      {/* Primary KPI Cards (Precision@K & Recall@K as First-Class Citizens) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Precision@K Card */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-amber-300">Precision@{topK}</span>
            <span className="font-mono text-[10px] text-slate-500">Hits / K</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {(results.precision * 100).toFixed(1)}%
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Of {topK} recommended items, what fraction were relevant to the user?
          </p>
        </div>

        {/* Recall@K Card */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-amber-300">Recall@{topK}</span>
            <span className="font-mono text-[10px] text-slate-500">Hits / Relevant</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {(results.recall * 100).toFixed(1)}%
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Of all relevant items in holdout test set, what fraction did the model find?
          </p>
        </div>

        {/* F1-Score@K Card */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-slate-200">F1-Score@{topK}</span>
            <span className="font-mono text-[10px] text-slate-500">Harmonic Mean</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
            {(results.f1Score * 100).toFixed(1)}%
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Balanced composite measure of precision and recall.
          </p>
        </div>

        {/* MAP@K Card */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-medium text-slate-200">MAP@{topK}</span>
            <span className="font-mono text-[10px] text-slate-500">Mean Avg Prec</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
            {(results.map * 100).toFixed(1)}%
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Accounts for ranking position; rewards placing hits near the top.
          </p>
        </div>
      </div>

      {/* Secondary Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-slate-400 block">NDCG@{topK}</span>
            <span className="text-slate-200 font-mono font-bold text-sm">
              {(results.ndcg * 100).toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Discounted Gain</span>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-slate-400 block">Hit Rate@{topK}</span>
            <span className="text-slate-200 font-mono font-bold text-sm">
              {(results.hitRate * 100).toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-slate-500">≥1 hit in list</span>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-slate-400 block">Catalog Coverage</span>
            <span className="text-slate-200 font-mono font-bold text-sm">
              {(results.catalogCoverage * 100).toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Items covered</span>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-slate-400 block">Rating RMSE</span>
            <span className="text-amber-400 font-mono font-bold text-sm">
              {results.rmse.toFixed(3)}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">MAE: {results.mae.toFixed(3)}</span>
        </div>
      </div>

      {/* Interactive Precision-Recall Curve & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Precision-Recall Curve Chart (SVG) */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-white">
                Precision-Recall Trade-off Curve ($K = 1 \dots 10$)
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Shows the classic retrieval trade-off: As recommendation list size $K$ grows, Recall
                increases while Precision tends to decay.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-amber-400">● Precision</span>
              <span className="text-cyan-400">■ Recall</span>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="relative w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-4">
            <svg className="w-full h-full" viewBox="0 0 500 220">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((level) => {
                const y = 180 - level * 150;
                return (
                  <g key={level}>
                    <line x1="40" y1={y} x2="480" y2={y} stroke="#1e293b" strokeWidth="1" />
                    <text x="15" y={y + 3} fill="#64748b" fontSize="9" fontFamily="monospace">
                      {(level * 100).toFixed(0)}%
                    </text>
                  </g>
                );
              })}

              {/* X Axis labels K = 1 to 10 */}
              {results.prCurve.map((pt, idx) => {
                const x = 50 + (idx / 9) * 420;
                return (
                  <text key={pt.k} x={x} y="205" fill="#64748b" fontSize="9" fontFamily="monospace" textAnchor="middle">
                    K={pt.k}
                  </text>
                );
              })}

              {/* Precision Line (Amber) */}
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                points={results.prCurve
                  .map((pt, idx) => {
                    const x = 50 + (idx / 9) * 420;
                    const y = 180 - pt.precision * 150;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Recall Line (Cyan) */}
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeDasharray="4 2"
                points={results.prCurve
                  .map((pt, idx) => {
                    const x = 50 + (idx / 9) * 420;
                    const y = 180 - pt.recall * 150;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />

              {/* Active K highlight dot */}
              {results.prCurve.map((pt, idx) => {
                const x = 50 + (idx / 9) * 420;
                const py = 180 - pt.precision * 150;
                const ry = 180 - pt.recall * 150;
                const isActive = pt.k === topK;

                return (
                  <g key={pt.k}>
                    <circle
                      cx={x}
                      cy={py}
                      r={isActive ? 6 : 3.5}
                      fill="#f59e0b"
                      stroke={isActive ? '#ffffff' : '#78350f'}
                      strokeWidth={isActive ? 2 : 1}
                      className="cursor-pointer"
                      onClick={() => setTopK(pt.k)}
                    />
                    <circle
                      cx={x}
                      cy={ry}
                      r={isActive ? 6 : 3.5}
                      fill="#06b6d4"
                      stroke={isActive ? '#ffffff' : '#0e7490'}
                      strokeWidth={isActive ? 2 : 1}
                      className="cursor-pointer"
                      onClick={() => setTopK(pt.k)}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Confusion Matrix Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-sm font-semibold text-white block">Top-K Confusion Matrix</span>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown of recommendation outcomes across all evaluated user-product pairs.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {/* True Positive */}
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg">
              <div className="text-emerald-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> True Positives (TP)
              </div>
              <div className="text-xl font-bold text-white mt-1 tabular-nums">
                {results.confusionMatrix.truePositive}
              </div>
              <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                Recommended & Relevant
              </span>
            </div>

            {/* False Positive */}
            <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-lg">
              <div className="text-rose-400 text-[10px] uppercase font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> False Positives (FP)
              </div>
              <div className="text-xl font-bold text-white mt-1 tabular-nums">
                {results.confusionMatrix.falsePositive}
              </div>
              <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                Recommended, Not Relevant
              </span>
            </div>

            {/* False Negative */}
            <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg">
              <div className="text-amber-400 text-[10px] uppercase font-bold">False Negatives (FN)</div>
              <div className="text-xl font-bold text-white mt-1 tabular-nums">
                {results.confusionMatrix.falseNegative}
              </div>
              <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                Relevant, Not Recommended
              </span>
            </div>

            {/* True Negative */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
              <div className="text-slate-400 text-[10px] uppercase font-bold">True Negatives (TN)</div>
              <div className="text-xl font-bold text-slate-300 mt-1 tabular-nums">
                {results.confusionMatrix.trueNegative}
              </div>
              <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
                Catalog items omitted
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
            <span className="font-semibold text-slate-300">Formulas:</span>
            <div className="mt-0.5 font-mono text-[10px] text-amber-300/90">
              P@{topK} = TP / (TP + FP) · R@{topK} = TP / (TP + FN)
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Algorithm Benchmark Comparison Table */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">
                Cross-Algorithm Benchmark (Identical Train/Test Split)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct performance comparison across User-User CF, Item-Item CF, Matrix Factorization (SVD),
              and Popularity Baseline.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">Cutoff K={topK}</span>
        </div>

        <div className="border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="p-3 font-sans font-medium">Algorithm Technique</th>
                <th className="p-3 text-right">Precision@{topK}</th>
                <th className="p-3 text-right">Recall@{topK}</th>
                <th className="p-3 text-right">F1-Score</th>
                <th className="p-3 text-right">MAP@{topK}</th>
                <th className="p-3 text-right">NDCG@{topK}</th>
                <th className="p-3 text-right">Hit Rate</th>
                <th className="p-3 text-right">Rating RMSE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {benchmark.map((bench) => {
                const isSelected = bench.algorithm === evalAlgorithm;
                return (
                  <tr
                    key={bench.algorithm}
                    onClick={() => setEvalAlgorithm(bench.algorithm)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-amber-500/10 hover:bg-amber-500/15'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="p-3 font-sans font-medium text-slate-200 flex items-center gap-2">
                      {isSelected && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                      <span>{bench.name}</span>
                    </td>
                    <td className="p-3 text-right font-bold text-white tabular-nums">
                      {(bench.precision * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 text-right font-bold text-white tabular-nums">
                      {(bench.recall * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 text-right text-amber-300 tabular-nums">
                      {(bench.f1Score * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 text-right text-slate-300 tabular-nums">
                      {(bench.map * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 text-right text-slate-300 tabular-nums">
                      {(bench.ndcg * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 text-right text-slate-300 tabular-nums">
                      {(bench.hitRate * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 text-right text-slate-400 tabular-nums">
                      {bench.rmse.toFixed(3)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Per-User Diagnostic Breakdown Table */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-white">Per-User Diagnostic Evaluation</span>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect how precision and recall distribute across individual users in the test set.
            </p>
          </div>
        </div>

        <div className="border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="p-2.5 font-sans font-medium">User Profile</th>
                <th className="p-2.5 text-center">Relevant Test Items</th>
                <th className="p-2.5 text-center">Top-{topK} Hits</th>
                <th className="p-2.5 text-right">User Precision@{topK}</th>
                <th className="p-2.5 text-right">User Recall@{topK}</th>
                <th className="p-2.5 text-right">User AP@{topK}</th>
                <th className="p-2.5 text-center font-sans">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {results.userBreakdown.map((row) => (
                <tr key={row.userId} className="hover:bg-slate-800/30">
                  <td className="p-2.5 font-sans font-medium text-slate-200">{row.userName}</td>
                  <td className="p-2.5 text-center text-slate-300">{row.relevantCount}</td>
                  <td className="p-2.5 text-center text-amber-400 font-bold">{row.hits}</td>
                  <td className="p-2.5 text-right text-white tabular-nums">
                    {(row.precision * 100).toFixed(1)}%
                  </td>
                  <td className="p-2.5 text-right text-white tabular-nums">
                    {(row.recall * 100).toFixed(1)}%
                  </td>
                  <td className="p-2.5 text-right text-slate-400 tabular-nums">
                    {(row.averagePrecision * 100).toFixed(1)}%
                  </td>
                  <td className="p-2.5 text-center font-sans">
                    <button
                      onClick={() =>
                        setSelectedUserDetail(
                          selectedUserDetail === row.userId ? null : row.userId
                        )
                      }
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      {selectedUserDetail === row.userId ? 'Close' : 'Details'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* User Detail Inspection Card */}
        {detailedUser && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-semibold text-white">
                Detailed Test Profile for {detailedUser.userName}
              </span>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="text-slate-500 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <span className="text-slate-500 block mb-1">Precision@{topK}:</span>
                <span className="text-amber-400 font-mono font-bold text-sm">
                  {detailedUser.hits} / {topK} ({(detailedUser.precision * 100).toFixed(1)}%)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Recall@{topK}:</span>
                <span className="text-amber-400 font-mono font-bold text-sm">
                  {detailedUser.hits} / {detailedUser.relevantCount} ({(detailedUser.recall * 100).toFixed(1)}%)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Average Precision:</span>
                <span className="text-slate-200 font-mono font-bold text-sm">
                  {(detailedUser.averagePrecision * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
