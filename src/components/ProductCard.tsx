import React, { useState } from 'react';
import { Star, Heart, ShoppingBag, Eye, Info } from 'lucide-react';
import { Product, RecommendationExplanation } from '../types';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  onRateProduct: (product: Product, rating: number) => void;
  isWishlisted: boolean;
  isInCart: boolean;
  recommendationExplanation?: RecommendationExplanation;
  predictedScore?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
  onAddToCart,
  onToggleWishlist,
  onRateProduct,
  isWishlisted,
  isInCart,
  recommendationExplanation,
  predictedScore
}) => {
  const [imgError, setImgError] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className="group relative bg-slate-900/60 border border-slate-800/80 rounded-xl overflow-hidden hover:border-slate-700 transition-all duration-200 flex flex-col justify-between">
      {/* Top Media Container */}
      <div className="relative aspect-[4/3] w-full bg-slate-950 overflow-hidden">
        {product.image && !imgError ? (
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 to-slate-950 border-b border-slate-800 text-center">
            <div className="w-12 h-12 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mb-3">
              <span className="text-amber-400 font-mono text-xs">{product.category.slice(0, 3).toUpperCase()}</span>
            </div>
            <p className="text-xs font-medium text-slate-300 line-clamp-2">{product.name}</p>
          </div>
        )}

        {/* Floating Quick Action Buttons */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product);
            }}
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist (+2.5 interest)'}
            className={`p-2 rounded-lg backdrop-blur-md transition-colors ${
              isWishlisted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-slate-950/70 text-slate-300 hover:text-white border border-slate-700/60'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
            title="Inspect Details"
            className="p-2 rounded-lg bg-slate-950/70 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Match Score Banner if this is a recommendation */}
        {predictedScore !== undefined && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md border border-amber-500/40 rounded-md px-2 py-0.5 text-xs">
            <span className="text-amber-400 font-mono font-medium tabular-nums">
              ★ {predictedScore.toFixed(1)}
            </span>
            <span className="text-slate-400 text-[10px]">pred</span>
            {recommendationExplanation && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowExplanation(!showExplanation);
                }}
                title="Why is this recommended?"
                className="text-slate-400 hover:text-amber-300 ml-0.5"
              >
                <Info className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Explanation Tooltip Drawer if triggered */}
      {showExplanation && recommendationExplanation && (
        <div className="bg-slate-950 border-b border-amber-500/30 p-3 text-xs text-slate-300 animate-in fade-in duration-150">
          <div className="flex items-center justify-between font-medium text-amber-400 mb-1">
            <span>Recommendation Math</span>
            <button
              onClick={() => setShowExplanation(false)}
              className="text-slate-500 hover:text-slate-200"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">{recommendationExplanation.methodSummary}</p>
          {recommendationExplanation.similarUsers && recommendationExplanation.similarUsers.length > 0 && (
            <div className="mb-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                Top Correlated Peers:
              </span>
              <div className="space-y-1">
                {recommendationExplanation.similarUsers.slice(0, 2).map((u) => (
                  <div key={u.userId} className="flex justify-between text-[11px]">
                    <span className="text-slate-300">{u.userName}</span>
                    <span className="text-amber-300/90 font-mono">
                      sim {(u.similarity * 100).toFixed(0)}% · rated {u.rating}★
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {recommendationExplanation.similarItems && recommendationExplanation.similarItems.length > 0 && (
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                Similar to items you liked:
              </span>
              <div className="space-y-1">
                {recommendationExplanation.similarItems.slice(0, 2).map((i) => (
                  <div key={i.productId} className="flex justify-between text-[11px]">
                    <span className="text-slate-300 truncate max-w-[130px]">{i.productName}</span>
                    <span className="text-amber-300/90 font-mono">
                      sim {(i.similarity * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Status: Clean unboxed metadata with bullet separator */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5 font-medium">
            <span>{product.category}</span>
            <span aria-hidden="true">·</span>
            <span>{product.stockStatus}</span>
          </div>

          <h3
            onClick={() => onViewDetails(product)}
            className="text-sm font-semibold text-slate-100 hover:text-amber-400 transition-colors line-clamp-1 cursor-pointer"
          >
            {product.name}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-3">
            {product.description}
          </p>
        </div>

        <div>
          {/* Price & Rating Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mb-3">
            <span className="text-base font-bold text-slate-100 font-mono tabular-nums">
              ${product.price}
            </span>

            {/* Interactive Quick Star Rating */}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => {
                const isLit = (hoverRating !== null ? hoverRating >= star : product.rating >= star);
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRateProduct(product, star);
                    }}
                    title={`Rate ${star} Stars (Logs explicit preference)`}
                    className="p-0.5 text-slate-600 hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-3 h-3 ${isLit ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
                    />
                  </button>
                );
              })}
              <span className="text-[10px] text-slate-500 ml-1 font-mono tabular-nums">
                ({product.reviewCount})
              </span>
            </div>
          </div>

          {/* Add to Cart CTA */}
          <button
            onClick={() => onAddToCart(product)}
            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
              isInCart
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/60'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{isInCart ? 'In Bag · Add Another' : 'Add to Bag (+3.5)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
