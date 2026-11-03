import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { User, Product, UserInteraction, InteractionType } from '../types';
import {
  ArrowUpDown,
  Filter,
  Snowflake,
  CheckCircle2,
  Plus,
  Star,
  Eye,
  Heart,
  ShoppingBag,
  Zap
} from 'lucide-react';

interface D3InteractionHeatmapProps {
  interactions: UserInteraction[];
  users: User[];
  products: Product[];
  onAddManualInteraction: (
    userId: string,
    productId: string,
    type: InteractionType,
    value: number
  ) => void;
}

interface CellClickTarget {
  user: User;
  product: Product;
  count: number;
  score: number;
  interactions: UserInteraction[];
  isCold: boolean;
}

export const D3InteractionHeatmap: React.FC<D3InteractionHeatmapProps> = ({
  interactions,
  users,
  products,
  onAddManualInteraction
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // View state
  const [sortMode, setSortMode] = useState<'default' | 'density'>('density');
  const [coldStartThreshold, setColdStartThreshold] = useState<number>(1);
  const [highlightColdOnly, setHighlightColdOnly] = useState<boolean>(false);
  const [activeCellModal, setActiveCellModal] = useState<CellClickTarget | null>(null);

  const [tooltipData, setTooltipData] = useState<{
    visible: boolean;
    x: number;
    y: number;
    user: User;
    product: Product;
    count: number;
    latestType?: InteractionType;
    score: number;
    isUserCold: boolean;
    isItemCold: boolean;
  } | null>(null);

  const [warmedNotification, setWarmedNotification] = useState<string | null>(null);

  // Compute interaction counts per user and per item
  const { userCounts, itemCounts, pairMap } = useMemo(() => {
    const uCounts = new Map<string, number>();
    const iCounts = new Map<string, number>();
    const pMap = new Map<
      string,
      { count: number; score: number; latestType?: InteractionType; interactions: UserInteraction[] }
    >();

    users.forEach((u) => uCounts.set(u.id, 0));
    products.forEach((p) => iCounts.set(p.id, 0));

    interactions.forEach((int) => {
      uCounts.set(int.userId, (uCounts.get(int.userId) || 0) + 1);
      iCounts.set(int.productId, (iCounts.get(int.productId) || 0) + 1);

      const key = `${int.userId}:::${int.productId}`;
      const existing = pMap.get(key) || { count: 0, score: 0, interactions: [] };
      existing.count += 1;
      existing.score = Math.max(existing.score, int.normalizedScore);
      existing.latestType = int.type;
      existing.interactions.push(int);
      pMap.set(key, existing);
    });

    return { userCounts: uCounts, itemCounts: iCounts, pairMap: pMap };
  }, [interactions, users, products]);

  // Determine cold-start users and items based on threshold
  const coldStartUserIds = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if ((userCounts.get(u.id) || 0) <= coldStartThreshold) {
        set.add(u.id);
      }
    });
    return set;
  }, [users, userCounts, coldStartThreshold]);

  const coldStartProductIds = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if ((itemCounts.get(p.id) || 0) <= coldStartThreshold) {
        set.add(p.id);
      }
    });
    return set;
  }, [products, itemCounts, coldStartThreshold]);

  // Matrix Sparsity Calculation
  const totalPossibleCells = users.length * products.length;
  const nonZeroCells = Array.from(pairMap.values()).filter((v) => v.count > 0).length;
  const sparsityPercent = totalPossibleCells > 0 ? (1 - nonZeroCells / totalPossibleCells) * 100 : 0;

  // Order of rows and columns (default vs sorted by interaction density)
  const orderedUsers = useMemo(() => {
    if (sortMode === 'density') {
      return [...users].sort((a, b) => (userCounts.get(b.id) || 0) - (userCounts.get(a.id) || 0));
    }
    return users;
  }, [users, sortMode, userCounts]);

  const orderedProducts = useMemo(() => {
    if (sortMode === 'density') {
      return [...products].sort((a, b) => (itemCounts.get(b.id) || 0) - (itemCounts.get(a.id) || 0));
    }
    return products;
  }, [products, sortMode, itemCounts]);

  // Render D3 Heatmap
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const width = 960;
    const height = 520;
    const margin = { top: 110, right: 120, bottom: 35, left: 175 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // D3 Scales
    const xScale = d3
      .scaleBand()
      .domain(orderedProducts.map((p) => p.id))
      .range([0, innerWidth])
      .padding(0.08);

    const yScale = d3
      .scaleBand()
      .domain(orderedUsers.map((u) => u.id))
      .range([0, innerHeight])
      .padding(0.08);

    // Color ramp for non-zero density (charcoal -> deep amber -> golden amber)
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, 1, 3, 5])
      .range(['#131720', '#78350f', '#d97706', '#f59e0b']);

    // Render Grid Background & Cells
    orderedUsers.forEach((user) => {
      const isUserCold = coldStartUserIds.has(user.id);

      orderedProducts.forEach((product) => {
        const isItemCold = coldStartProductIds.has(product.id);
        const pair = pairMap.get(`${user.id}:::${product.id}`);
        const count = pair?.count || 0;
        const score = pair?.score || 0;

        const x = xScale(product.id) || 0;
        const y = yScale(user.id) || 0;
        const w = xScale.bandwidth();
        const h = yScale.bandwidth();

        const isColdArea = isUserCold || isItemCold;
        const isDimmed = highlightColdOnly && !isColdArea;

        // Group container for cell
        const cellG = g
          .append('g')
          .attr('transform', `translate(${x},${y})`)
          .attr('class', 'heatmap-cell-group cursor-pointer')
          .style('opacity', isDimmed ? 0.2 : 1)
          .on('pointerenter pointermove', (event) => {
            if (containerRef.current) {
              const [px, py] = d3.pointer(event, containerRef.current);
              setTooltipData({
                visible: true,
                x: px,
                y: py,
                user,
                product,
                count,
                latestType: pair?.latestType,
                score,
                isUserCold,
                isItemCold
              });
            }
          })
          .on('pointerleave', () => {
            setTooltipData(null);
          })
          .on('click', () => {
            setActiveCellModal({
              user,
              product,
              count,
              score,
              interactions: pair?.interactions || [],
              isCold: isColdArea
            });
          });

        // Base rectangle
        let fillColor = '#0f131a';
        if (count > 0) {
          fillColor = colorScale(Math.min(5, count));
        }

        cellG
          .append('rect')
          .attr('width', w)
          .attr('height', h)
          .attr('rx', 4)
          .attr('fill', fillColor)
          .attr('stroke', count > 0 ? '#b45309' : '#1e2533')
          .attr('stroke-width', count > 0 ? 1 : 0.75)
          .attr('class', 'transition-all duration-150 hover:stroke-amber-300 hover:stroke-2');

        // Cold-Start visual overlay: Dashed cyan outline if this cell sits in cold start
        if (isColdArea && count === 0) {
          cellG
            .append('rect')
            .attr('width', w)
            .attr('height', h)
            .attr('rx', 4)
            .attr('fill', 'none')
            .attr('stroke', '#06b6d4')
            .attr('stroke-width', 1.25)
            .attr('stroke-dasharray', '3 2')
            .style('opacity', 0.9);

          // Snowflake dot indicator
          cellG
            .append('circle')
            .attr('cx', w - 5)
            .attr('cy', 5)
            .attr('r', 2)
            .attr('fill', '#06b6d4');
        }

        // Cell content label: show count or plus icon placeholder
        if (count > 0) {
          cellG
            .append('text')
            .attr('x', w / 2)
            .attr('y', h / 2 + 4)
            .attr('text-anchor', 'middle')
            .attr('fill', count >= 3 ? '#0f1115' : '#fed7aa')
            .attr('font-size', '10px')
            .attr('font-family', 'monospace')
            .attr('font-weight', 'bold')
            .text(`${count}`);
        }
      });
    });

    // Render X Axis (Products at Top)
    const xAxisG = g.append('g').attr('class', 'x-axis');

    orderedProducts.forEach((product) => {
      const x = (xScale(product.id) || 0) + xScale.bandwidth() / 2;
      const isCold = coldStartProductIds.has(product.id);
      const totalCount = itemCounts.get(product.id) || 0;

      const labelG = xAxisG
        .append('g')
        .attr('transform', `translate(${x},-14) rotate(-35)`)
        .attr('class', 'cursor-pointer');

      labelG
        .append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('text-anchor', 'start')
        .attr('fill', isCold ? '#38bdf8' : '#cbd5e1')
        .attr('font-size', '10px')
        .attr('font-weight', isCold ? 'bold' : 'normal')
        .attr('font-family', 'sans-serif')
        .text(product.name.split(' ').slice(0, 2).join(' '));

      if (isCold) {
        labelG
          .append('text')
          .attr('x', 0)
          .attr('y', 11)
          .attr('text-anchor', 'start')
          .attr('fill', '#06b6d4')
          .attr('font-size', '8px')
          .attr('font-family', 'monospace')
          .text(`[Cold: ${totalCount}]`);
      }
    });

    // Render Y Axis (Users at Left)
    const yAxisG = g.append('g').attr('class', 'y-axis');

    orderedUsers.forEach((user) => {
      const y = (yScale(user.id) || 0) + yScale.bandwidth() / 2;
      const isCold = coldStartUserIds.has(user.id);
      const totalCount = userCounts.get(user.id) || 0;

      const labelG = yAxisG
        .append('g')
        .attr('transform', `translate(-14,${y})`)
        .attr('class', 'cursor-pointer');

      labelG
        .append('text')
        .attr('x', 0)
        .attr('y', 3)
        .attr('text-anchor', 'end')
        .attr('fill', isCold ? '#38bdf8' : '#e2e8f0')
        .attr('font-size', '11px')
        .attr('font-weight', isCold ? 'bold' : '500')
        .attr('font-family', 'sans-serif')
        .text(user.name);

      if (isCold) {
        labelG
          .append('text')
          .attr('x', 0)
          .attr('y', 14)
          .attr('text-anchor', 'end')
          .attr('fill', '#06b6d4')
          .attr('font-size', '8px')
          .attr('font-family', 'monospace')
          .text(`[Cold: ${totalCount}]`);
      }
    });

    // Color Legend on the Right
    const legendG = svg.append('g').attr('transform', `translate(${width - 95}, ${margin.top + 25})`);

    legendG
      .append('text')
      .attr('x', 0)
      .attr('y', -10)
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .text('INTERACTIONS');

    const legendSteps = [0, 1, 2, 4];
    legendSteps.forEach((step, idx) => {
      const itemG = legendG.append('g').attr('transform', `translate(0, ${idx * 24})`);
      itemG
        .append('rect')
        .attr('width', 14)
        .attr('height', 14)
        .attr('rx', 3)
        .attr('fill', step === 0 ? '#0f131a' : colorScale(step))
        .attr('stroke', step === 0 ? '#1e2533' : '#b45309')
        .attr('stroke-width', 1);

      itemG
        .append('text')
        .attr('x', 22)
        .attr('y', 11)
        .attr('fill', '#cbd5e1')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .text(step === 0 ? '0' : `${step}+`);
    });

    // Cold-start legend entry
    const coldLegend = legendG.append('g').attr('transform', `translate(0, ${legendSteps.length * 24 + 14})`);
    coldLegend
      .append('rect')
      .attr('width', 14)
      .attr('height', 14)
      .attr('rx', 3)
      .attr('fill', '#0f131a')
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '2 2');

    coldLegend
      .append('text')
      .attr('x', 22)
      .attr('y', 11)
      .attr('fill', '#38bdf8')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .text('Cold Zone');

  }, [
    orderedUsers,
    orderedProducts,
    pairMap,
    coldStartUserIds,
    coldStartProductIds,
    highlightColdOnly,
    itemCounts,
    userCounts
  ]);

  const handleWarmAction = (type: InteractionType, val: number) => {
    if (!activeCellModal) return;
    onAddManualInteraction(activeCellModal.user.id, activeCellModal.product.id, type, val);
    setWarmedNotification(
      `Warmed cell: Added ${type} (${val}) for ${activeCellModal.user.name} on ${activeCellModal.product.name}`
    );
    setActiveCellModal(null);
    setTimeout(() => setWarmedNotification(null), 3000);
  };

  return (
    <div className="space-y-4">
      {/* HUD Cards Strip: Sparsity & Cold-Start Diagnostics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Sparsity Rate Card */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium">Matrix Sparsity</span>
            <span className="font-mono text-[10px] text-amber-400">1 - |E| / |U×I|</span>
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {sparsityPercent.toFixed(1)}%
          </div>
          <p className="text-[10px] text-slate-500">
            {nonZeroCells} active pairs / {totalPossibleCells} combinations
          </p>
        </div>

        {/* Cold-Start Users Card */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium flex items-center gap-1 text-cyan-400">
              <Snowflake className="w-3 h-3" /> Cold-Start Users
            </span>
            <span className="font-mono text-[10px] text-cyan-400">≤{coldStartThreshold} int</span>
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300 tabular-nums">
            {coldStartUserIds.size} <span className="text-xs text-slate-500 font-normal">/ {users.length}</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Users lacking sufficient neighbor co-overlap
          </p>
        </div>

        {/* Cold-Start Products Card */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium flex items-center gap-1 text-cyan-400">
              <Snowflake className="w-3 h-3" /> Cold-Start Items
            </span>
            <span className="font-mono text-[10px] text-cyan-400">≤{coldStartThreshold} int</span>
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300 tabular-nums">
            {coldStartProductIds.size} <span className="text-xs text-slate-500 font-normal">/ {products.length}</span>
          </div>
          <p className="text-[10px] text-slate-500">
            Items rarely co-rated with other products
          </p>
        </div>

        {/* Active Density Ratio */}
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-medium text-amber-300">Matrix Density</span>
            <span className="font-mono text-[10px] text-slate-500">|E| / |U×I|</span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 tabular-nums">
            {(100 - sparsityPercent).toFixed(1)}%
          </div>
          <p className="text-[10px] text-slate-500">
            Higher density yields higher Precision@K
          </p>
        </div>
      </div>

      {/* Heatmap Interactive Tool Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Sort By Density Toggle */}
          <button
            onClick={() => setSortMode(sortMode === 'density' ? 'default' : 'density')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              sortMode === 'density'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <ArrowUpDown className="w-3 h-3" />
            <span>{sortMode === 'density' ? 'Sorted by Density (Clustered)' : 'Default Axis Order'}</span>
          </button>

          {/* Highlight Cold Only Filter */}
          <button
            onClick={() => setHighlightColdOnly(!highlightColdOnly)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
              highlightColdOnly
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>{highlightColdOnly ? 'Cold-Start Focus (Active)' : 'Show All Areas'}</span>
          </button>
        </div>

        {/* Cold-Start Threshold Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] font-mono">Cold-Start Threshold:</span>
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setColdStartThreshold(1)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                coldStartThreshold === 1
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              ≤ 1 int
            </button>
            <button
              onClick={() => setColdStartThreshold(2)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                coldStartThreshold === 2
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              ≤ 2 int
            </button>
          </div>
        </div>
      </div>

      {/* Cold-Start Notification Alert */}
      {(coldStartUserIds.size > 0 || coldStartProductIds.size > 0) && (
        <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-xs text-cyan-200 flex items-start gap-2.5">
          <Snowflake className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-cyan-300">Cold-Start Advisory: </span>
            {coldStartUserIds.size} user(s) and {coldStartProductIds.size} item(s) are highlighted in cyan with dashed contours.
            Collaborative filtering relies on co-rated items; cold users/items receive popularity-backed fallback predictions until warmed up.
            <strong className="text-white ml-1">Click on any cell to open instant warm-up options!</strong>
          </div>
        </div>
      )}

      {/* Warmed Cell Feedback Notification */}
      {warmedNotification && (
        <div className="p-2.5 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{warmedNotification}</span>
        </div>
      )}

      {/* D3 Heatmap SVG Container with Horizontal Scroll Support */}
      <div
        ref={containerRef}
        className="relative w-full bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto shadow-inner p-2"
      >
        <svg
          ref={svgRef}
          viewBox="0 0 960 520"
          className="w-full min-w-[850px] h-auto block select-none"
        />

        {/* Interactive Floating Hover Tooltip */}
        {tooltipData && tooltipData.visible && !activeCellModal && (
          <div
            className="absolute pointer-events-none z-30 bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs text-slate-200 backdrop-blur-md max-w-xs animate-in fade-in duration-100"
            style={{
              left: `${Math.min(tooltipData.x + 15, (containerRef.current?.clientWidth || 700) - 220)}px`,
              top: `${Math.max(tooltipData.y - 80, 10)}px`
            }}
          >
            <div className="font-semibold text-white flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-1.5">
              <span>{tooltipData.user.name}</span>
              <span className="text-[10px] text-amber-400 font-mono">
                {tooltipData.count > 0 ? `${tooltipData.count} interactions` : 'Unobserved'}
              </span>
            </div>

            <div className="text-[11px] text-slate-300 font-medium truncate mb-1">
              {tooltipData.product.name}
            </div>

            <div className="text-[10px] text-slate-400 space-y-0.5 font-mono">
              <div>Category: {tooltipData.product.category} · ${tooltipData.product.price}</div>
              {tooltipData.latestType && (
                <div>Latest signal: <span className="text-amber-400">{tooltipData.latestType}</span></div>
              )}
              {tooltipData.score > 0 && (
                <div>Inferred Rating: <span className="text-amber-300 font-bold">{tooltipData.score.toFixed(1)}★</span></div>
              )}
            </div>

            {(tooltipData.isUserCold || tooltipData.isItemCold) && (
              <div className="mt-2 pt-1.5 border-t border-cyan-500/30 text-[10px] text-cyan-300 flex items-center gap-1 font-mono">
                <Snowflake className="w-3 h-3 text-cyan-400" />
                <span>
                  {tooltipData.isUserCold && tooltipData.isItemCold
                    ? 'Dual Cold-Start Zone'
                    : tooltipData.isUserCold
                    ? 'Cold-Start User'
                    : 'Cold-Start Item'}
                </span>
              </div>
            )}

            <div className="mt-2 pt-1 text-[9px] text-slate-500 text-center font-sans">
              Click cell to open interaction options
            </div>
          </div>
        )}
      </div>

      {/* Interactive Cell Click & Warm-Up Modal */}
      {activeCellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-amber-400 uppercase tracking-wider block">
                  Matrix Cell Action
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {activeCellModal.user.name} × {activeCellModal.product.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveCellModal(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Status overview */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-400 text-[10px] block">Current Interactions</span>
                <span className="text-sm font-bold text-amber-400">{activeCellModal.count} events</span>
              </div>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-slate-400 text-[10px] block">Inferred Rating</span>
                <span className="text-sm font-bold text-white">
                  {activeCellModal.score > 0 ? `${activeCellModal.score.toFixed(1)}★` : 'None (0.0)'}
                </span>
              </div>
            </div>

            {activeCellModal.isCold && (
              <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/40 rounded-lg text-xs text-cyan-300 flex items-center gap-2">
                <Snowflake className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>This cell is in a Cold-Start zone. Adding an interaction here will link preferences into the collaborative filtering graph!</span>
              </div>
            )}

            {/* Quick Warm Action Buttons */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">
                Warm this Cell with Simulated Feedback:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleWarmAction('view', 1.0)}
                  className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 flex items-center justify-center gap-1.5 transition-colors font-medium"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>View (+1.0)</span>
                </button>
                <button
                  onClick={() => handleWarmAction('wishlist', 2.5)}
                  className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 flex items-center justify-center gap-1.5 transition-colors font-medium"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Wishlist (+2.5)</span>
                </button>
                <button
                  onClick={() => handleWarmAction('add_to_cart', 3.5)}
                  className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 flex items-center justify-center gap-1.5 transition-colors font-medium"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Add to Bag (+3.5)</span>
                </button>
                <button
                  onClick={() => handleWarmAction('purchase', 5.0)}
                  className="p-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Purchase (+5.0)</span>
                </button>
              </div>

              {/* Star rating buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Explicit Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleWarmAction('rating', s)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 font-mono text-xs transition-colors flex items-center gap-1"
                    >
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
