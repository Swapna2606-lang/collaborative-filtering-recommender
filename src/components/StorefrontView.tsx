import React, { useState } from 'react';
import { Sparkles, SlidersHorizontal, Search, RefreshCw, Zap, Users, Box, Cpu } from 'lucide-react';
import {
  Product,
  User,
  RecommendationResult,
  RecommendationAlgorithm,
  AlgorithmConfig
} from '../types';
import { ProductCard } from './ProductCard';
import { HERO_IMAGE } from '../data/mockData';

interface StorefrontViewProps {
  products: Product[];
  recommendations: RecommendationResult[];
  activeUser: User;
  allUsers: User[];
  setActiveUserId: (id: string) => void;
  currentAlgorithm: RecommendationAlgorithm;
  setAlgorithm: (alg: RecommendationAlgorithm) => void;
  algorithmConfig: AlgorithmConfig;
  setAlgorithmConfig: React.Dispatch<React.SetStateAction<AlgorithmConfig>>;
  onViewProductDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  onRateProduct: (product: Product, rating: number) => void;
  wishlistIds: Set<string>;
  cartIds: Set<string>;
  onTriggerSimulation: () => void;
}

export const StorefrontView: React.FC<StorefrontViewProps> = ({
  products,
  recommendations,
  activeUser,
  allUsers,
  setActiveUserId,
  currentAlgorithm,
  setAlgorithm,
  algorithmConfig,
  setAlgorithmConfig,
  onViewProductDetails,
  onAddToCart,
  onToggleWishlist,
  onRateProduct,
  wishlistIds,
  cartIds,
  onTriggerSimulation
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const categories = ['All', 'Audio', 'Lighting', 'Living', 'Hardware', 'Accessories'];

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchSearch =
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Showcase */}
      <section className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
        <div className="relative aspect-[21/9] sm:aspect-[16/7] w-full min-h-[300px]">
          <img
            src={HERO_IMAGE}
            alt="Minimalist architectural workspace"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover brightness-[0.78]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />

          <div className="absolute bottom-6 left-6 sm:bottom-10 sm:left-10 max-w-xl z-10">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-2 font-mono">
              <span>EDITION 2026</span>
              <span aria-hidden="true">·</span>
              <span>KINETIC & FORM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight mb-3">
              Precision Workspace Tools & Ambient Living
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg mb-4">
              Real-time collaborative filtering engine trained on implicit behavior and explicit ratings.
              Every click, wishlist, and cart action dynamically restructures personalized recommendations.
            </p>

            {/* Persona Quick Switcher */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 mr-1 font-mono">Taste Persona:</span>
              {allUsers.map((u) => {
                const isActive = u.id === activeUser.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => setActiveUserId(u.id)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                        : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
                    }`}
                  >
                    {u.name.split(' ')[0]} {u.id === 'user-current' ? '(You)' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Recommendation Engine Control Strip */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mr-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Model:
          </span>

          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setAlgorithm('ubcf')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                currentAlgorithm === 'ubcf'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>User-User (UBCF)</span>
            </button>

            <button
              onClick={() => setAlgorithm('ibcf')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                currentAlgorithm === 'ibcf'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Box className="w-3 h-3" />
              <span>Item-Item (IBCF)</span>
            </button>

            <button
              onClick={() => setAlgorithm('svd')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                currentAlgorithm === 'svd'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3 h-3" />
              <span>Matrix SVD</span>
            </button>

            <button
              onClick={() => setAlgorithm('popularity')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                currentAlgorithm === 'popularity'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Popularity Baseline</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Hyperparameters</span>
          </button>

          <button
            onClick={onTriggerSimulation}
            title="Simulate 5 random user interactions to observe live recommendation changes"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Simulate Signals</span>
          </button>
        </div>
      </section>

      {/* Hyperparameter Settings Drawer */}
      {showConfig && (
        <section className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-semibold text-slate-200">Collaborative Filtering Configuration</span>
            <span className="text-slate-500 font-mono">Live tuning</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-400 block mb-1">
                Neighborhood Size ($k$-NN): <span className="text-amber-400 font-mono">{algorithmConfig.neighborhoodK}</span>
              </label>
              <input
                type="range"
                min="2"
                max="8"
                step="1"
                value={algorithmConfig.neighborhoodK}
                onChange={(e) =>
                  setAlgorithmConfig((prev) => ({ ...prev, neighborhoodK: Number(e.target.value) }))
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Top-k peer neighbors considered for rating prediction.</span>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Similarity Metric:</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAlgorithmConfig((prev) => ({ ...prev, similarityMetric: 'cosine' }))}
                  className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                    algorithmConfig.similarityMetric === 'cosine'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Cosine
                </button>
                <button
                  onClick={() => setAlgorithmConfig((prev) => ({ ...prev, similarityMetric: 'pearson' }))}
                  className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                    algorithmConfig.similarityMetric === 'pearson'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  Pearson
                </button>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Pearson centers ratings around user mean to compensate for rating leniency.
              </span>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">
                SVD Latent Factors: <span className="text-amber-400 font-mono">{algorithmConfig.latentFactors}</span>
              </label>
              <input
                type="range"
                min="2"
                max="5"
                step="1"
                value={algorithmConfig.latentFactors}
                onChange={(e) =>
                  setAlgorithmConfig((prev) => ({ ...prev, latentFactors: Number(e.target.value) }))
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Dimensionality of the low-rank latent representation.</span>
            </div>
          </div>
        </section>
      )}

      {/* Recommended For You Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>COLLABORATIVE ENGINE PREDICTIONS</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Recommended for {activeUser.name}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked via {currentAlgorithm.toUpperCase()} algorithm. Click the 'pred' badge on any card to view exact neighbor weights.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            Top {recommendations.length} Matches
          </div>
        </div>

        {recommendations.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/50 border border-slate-800 text-center text-slate-400 text-xs">
            No unseen items to recommend! Try switching active users or resetting interactions.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.slice(0, 3).map((rec) => (
              <ProductCard
                key={rec.product.id}
                product={rec.product}
                predictedScore={rec.predictedScore}
                recommendationExplanation={rec.explanation}
                onViewDetails={onViewProductDetails}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                onRateProduct={onRateProduct}
                isWishlisted={wishlistIds.has(rec.product.id)}
                isInCart={cartIds.has(rec.product.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Full Catalog Section with Filter & Search */}
      <section className="space-y-6 pt-6 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Full Catalog Collection</h2>
            <p className="text-xs text-slate-400">
              Browse products, rate items, or add them to your cart to generate interaction logs.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors"
            />
          </div>
        </div>

        {/* Category Filter Tabs (Single-line buttons) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={onViewProductDetails}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              onRateProduct={onRateProduct}
              isWishlisted={wishlistIds.has(product.id)}
              isInCart={cartIds.has(product.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
