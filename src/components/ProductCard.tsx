import React from 'react';
import { Heart, ShoppingBag, Star, Zap } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  isInWishlist: boolean;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isInWishlist,
  onSelect,
  onAddToCart,
  onToggleWishlist
}) => {
  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-indigo-500/50 transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      {/* Product Image & Badges */}
      <div className="relative aspect-square overflow-hidden bg-slate-950">
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product, e);
          }}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all shadow-md ${
            isInWishlist
              ? 'bg-pink-500 text-white'
              : 'bg-slate-900/80 text-slate-300 hover:text-pink-400 hover:bg-slate-900'
          }`}
          title="Wishlist"
        >
          <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
        </button>

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] sm:text-[11px] font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg shadow-lg">
            {discountPercent}% OFF
          </div>
        )}

        {/* Trending/Featured Badge */}
        {product.isTrending && (
          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-amber-500/90 backdrop-blur-md text-slate-950 text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.5 sm:px-2 rounded flex items-center gap-1 shadow">
            <Zap className="w-3 h-3 fill-current" /> <span className="hidden xs:inline">TRENDING</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between gap-2 sm:gap-3">
        <div>
          <div className="flex items-center justify-between text-[11px] sm:text-xs text-indigo-400 font-semibold mb-1">
            <span className="truncate max-w-[80px] sm:max-w-none">{product.brand}</span>
            <div className="flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 sm:px-2 rounded text-slate-300 text-[10px] sm:text-[11px]">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
          </div>

          <h3 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2 leading-tight">
            {product.title}
          </h3>
        </div>

        {/* Pricing & Cart Action */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-auto gap-1">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-1">
              <span className="text-sm sm:text-lg font-extrabold text-white">
                ₹{(product.discountPrice || product.price).toLocaleString('en-IN')}
              </span>
              {product.discountPrice && (
                <span className="text-[10px] sm:text-xs text-slate-500 line-through">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <p className="text-[9px] sm:text-[10px] text-emerald-400 font-medium truncate">Free Shipping</p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product, e);
            }}
            className="p-2 sm:p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg sm:rounded-xl shadow-md shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center flex-shrink-0"
            title="Add to Cart"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
