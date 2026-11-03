import React from 'react';
import { X, Trash2, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { Product } from '../types';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Your Shopping Bag</h2>
            <span className="text-xs text-slate-500 font-mono">
              ({items.reduce((s, i) => s + i.quantity, 0)} items)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Item List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <ShoppingBag className="w-10 h-10 mb-3 stroke-1 text-slate-600" />
              <p className="text-sm font-medium text-slate-400">Your bag is currently empty</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Explore recommended items or the catalog to add items and generate positive collaborative signals.
              </p>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center gap-3"
              >
                <div className="w-14 h-14 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-amber-400 font-mono">
                      {product.category.slice(0, 3)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-slate-500 block uppercase">{product.category}</span>
                  <h4 className="text-xs font-semibold text-slate-200 truncate">{product.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      ${product.price}
                    </span>
                    <span className="text-[10px] text-slate-500">× {quantity}</span>
                  </div>
                </div>

                {/* Stepper & Remove */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md text-xs">
                    <button
                      onClick={() => onUpdateQuantity(product.id, Math.max(1, quantity - 1))}
                      className="px-2 py-0.5 text-slate-400 hover:text-white"
                    >
                      -
                    </button>
                    <span className="px-1.5 font-mono text-slate-200">{quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                      className="px-2 py-0.5 text-slate-400 hover:text-white"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => onRemoveItem(product.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer with Purchase CTA */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-slate-200">${subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping</span>
                <span className="text-emerald-400 font-mono">Complimentary</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-1.5 border-t border-slate-800">
                <span>Total</span>
                <span className="font-mono text-amber-400">${subtotal}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onCheckout();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-2 transition-colors shadow-sm font-medium"
            >
              <span>Complete Purchase (Logs +5.0 Purchase Signal)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Simulated e-commerce purchase pipeline · Updates matrix instantly</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
