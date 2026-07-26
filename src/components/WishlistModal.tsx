import React from 'react';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Product } from '../types';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onMoveToCart: (product: Product) => void;
  onRemoveFromWishlist: (product: Product) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  products,
  onMoveToCart,
  onRemoveFromWishlist
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500 fill-current" />
            <h2 className="text-base font-extrabold text-white">My Wishlist</h2>
            <span className="text-xs bg-pink-500/20 text-pink-300 font-bold px-2 py-0.5 rounded-full">
              {products.length} saved
            </span>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wishlist Items Grid */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {products.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Heart className="w-12 h-12 text-slate-700 mx-auto" />
              <p className="text-sm font-bold text-slate-300">Your wishlist is currently empty.</p>
              <p className="text-xs text-slate-500">Tap the heart icon on any product to save it here for later.</p>
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="p-3 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center gap-4"
              >
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-16 h-16 rounded-xl object-cover bg-slate-900 border border-slate-800"
                />

                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase">{product.brand}</span>
                  <h4 className="text-xs font-bold text-white truncate">{product.title}</h4>
                  <p className="text-xs font-black text-white mt-1">
                    ₹{(product.discountPrice || product.price).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onMoveToCart(product)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-md shadow-indigo-600/30"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Move to Cart
                  </button>

                  <button
                    onClick={() => onRemoveFromWishlist(product)}
                    className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-slate-800"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
