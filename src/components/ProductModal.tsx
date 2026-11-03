import React, { useState } from 'react';
import { Star, Heart, ShoppingBag, X, Check, ArrowRight } from 'lucide-react';
import { Product } from '../types';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onPurchaseNow: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  onRateProduct: (product: Product, rating: number) => void;
  isWishlisted: boolean;
  similarProducts?: { product: Product; similarity: number }[];
  onSelectSimilarProduct?: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onPurchaseNow,
  onToggleWishlist,
  onRateProduct,
  isWishlisted,
  similarProducts = [],
  onSelectSimilarProduct
}) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!product) return null;

  const handleRate = (star: number) => {
    setSelectedRating(star);
    onRateProduct(product, star);
    setRatingSubmitted(true);
    setTimeout(() => setRatingSubmitted(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-slate-950/80 text-slate-400 hover:text-white hover:bg-slate-950 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Media Left Column */}
        <div className="md:w-1/2 bg-slate-950 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-900">
            {product.image && !imgError ? (
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <span className="text-amber-400 font-mono text-sm mb-2">{product.category}</span>
                <p className="text-slate-300 text-sm font-medium">{product.name}</p>
              </div>
            )}
          </div>

          {/* Similar Items (Item-Item CF) */}
          {similarProducts.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <span className="text-xs text-slate-400 font-medium block mb-2">
                Frequently Correlated in Catalog (IBCF):
              </span>
              <div className="grid grid-cols-2 gap-2">
                {similarProducts.slice(0, 2).map(({ product: sp, similarity }) => (
                  <button
                    key={sp.id}
                    onClick={() => onSelectSimilarProduct && onSelectSimilarProduct(sp)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-colors flex flex-col justify-between"
                  >
                    <span className="text-[11px] font-medium text-slate-200 truncate block">
                      {sp.name}
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono mt-1">
                      sim {(similarity * 100).toFixed(0)}% · ${sp.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Purchase Module Right Column */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2 font-medium">
              <span>{product.category}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400">{product.stockStatus}</span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">{product.name}</h2>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl font-bold text-slate-100 font-mono tabular-nums">
                ${product.price}
              </span>
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="font-mono">{product.rating}</span>
                <span className="text-slate-500">({product.reviewCount} reviews)</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {product.description}
            </p>

            {/* Specifications */}
            <div className="mb-5 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Engineering Highlights
              </span>
              {product.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Explicit Star Rating Widget */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-300">Your Explicit Rating:</span>
                {ratingSubmitted && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                    <Check className="w-3 h-3" /> Logged!
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleRate(s)}
                    className="p-1 text-slate-600 hover:text-amber-400 focus:outline-none transition-colors"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        (selectedRating !== null ? selectedRating >= s : false)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs text-slate-400 ml-2 font-mono">
                  {selectedRating ? `${selectedRating}.0 stars` : 'Tap to rate'}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAddToCart(product)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700/80 flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag (+3.5 Signal)</span>
              </button>

              <button
                onClick={() => onToggleWishlist(product)}
                title="Wishlist"
                className={`p-2.5 rounded-xl border transition-colors ${
                  isWishlisted
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700/80'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            <button
              onClick={() => {
                onPurchaseNow(product);
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-2 transition-colors whitespace-nowrap shadow-sm font-medium"
            >
              <span>Instant Checkout (+5.0 Signal)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
