import React, { useState } from 'react';
import {
  X,
  Star,
  ShoppingBag,
  Heart,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle,
  Play,
  Send,
  MessageSquare
} from 'lucide-react';
import { Product, ProductVariant, Review } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  reviews: Review[];
  isInWishlist: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, selectedVariant?: ProductVariant) => void;
  onBuyNow: (product: Product, quantity: number, selectedVariant?: ProductVariant) => void;
  onToggleWishlist: (product: Product) => void;
  onSubmitReview: (productId: string, rating: number, comment: string) => Promise<void>;
  userLoggedIn: boolean;
  onOpenAuth: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  reviews,
  isInWishlist,
  onClose,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  onSubmitReview,
  userLoggedIn,
  onOpenAuth
}) => {
  if (!product) return null;

  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'reviews'>('specs');

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const currentPrice = selectedVariant ? selectedVariant.price : (product.discountPrice || product.price);
  const discountPercent = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingReview(true);
    await onSubmitReview(product.id, newRating, newComment);
    setNewComment('');
    setSubmittingReview(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Header bar */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800 bg-slate-950/50">
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
            {product.category} &bull; {product.brand}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-8 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Gallery Column */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
                <img
                  src={product.images[activeImage] || product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onToggleWishlist(product)}
                  className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-all ${
                    isInWishlist ? 'bg-pink-500 text-white' : 'bg-slate-900/80 text-slate-300 hover:text-pink-400'
                  }`}
                >
                  <Heart className="w-5 h-5 fill-current" />
                </button>
              </div>

              {/* Thumbnail Gallery */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {product.images.map((img, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      activeImage === idx ? 'border-indigo-500 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
                {product.videoUrl && (
                  <a
                    href={product.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center text-xs text-indigo-400 hover:text-white flex-shrink-0"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>Video</span>
                  </a>
                )}
              </div>
            </div>

            {/* Product Details & Purchase Column */}
            <div className="space-y-6 flex flex-col justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {product.title}
                </h1>

                {/* Rating summary */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 rounded-lg text-amber-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{product.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-xs text-slate-400">{reviews.length} Verified Customer Reviews</span>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> In Stock ({product.stock} left)
                  </span>
                </div>

                {/* Pricing Box */}
                <div className="mt-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-baseline gap-3">
                  <span className="text-2xl font-extrabold text-white">
                    ₹{currentPrice.toLocaleString('en-IN')}
                  </span>
                  {product.discountPrice && !selectedVariant && (
                    <span className="text-sm text-slate-500 line-through">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                      Save {discountPercent}%
                    </span>
                  )}
                  <span className="ml-auto text-[11px] text-slate-400">Includes all GST & taxes</span>
                </div>

                {/* Variants Selector */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <label className="text-xs font-bold text-slate-300">Select Option / Variant:</label>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((variant) => (
                        <button
                          type="button"
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                            selectedVariant?.id === variant.id
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                              : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {variant.storage || variant.color || variant.size} - ₹{variant.price.toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <p className="mt-4 text-xs text-slate-300 leading-relaxed">
                  {product.description}
                </p>

                {/* Quantity Selector */}
                <div className="mt-4 flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-300">Quantity:</span>
                  <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1.5 text-slate-300 hover:bg-slate-700 font-bold"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-xs font-bold text-white">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-3 py-1.5 text-slate-300 hover:bg-slate-700 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => onAddToCart(product, quantity, selectedVariant)}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 text-xs transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 text-indigo-400" /> Add to Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => onBuyNow(product, quantity, selectedVariant)}
                    className="py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 text-xs transition-all"
                  >
                    Buy Now
                  </button>
                </div>

                {/* Value Badges */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-800">
                    <Truck className="w-4 h-4 text-indigo-400" />
                    <span>Fast Delivery</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>100% Authentic</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950/40 p-2 rounded-xl border border-slate-800">
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>7-Day Return</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Specifications & Reviews Tabs */}
          <div className="border-t border-slate-800 pt-6">
            <div className="flex gap-4 border-b border-slate-800 pb-3">
              <button
                onClick={() => setActiveTab('specs')}
                className={`text-xs font-bold pb-1 transition-colors border-b-2 ${
                  activeTab === 'specs' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Specifications
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`text-xs font-bold pb-1 transition-colors border-b-2 ${
                  activeTab === 'reviews' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Customer Reviews ({reviews.length})
              </button>
            </div>

            {activeTab === 'specs' ? (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.specifications?.map((spec, idx) => (
                  <div key={idx} className="flex justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs">
                    <span className="text-slate-400 font-medium">{spec.key}</span>
                    <span className="text-slate-100 font-semibold">{spec.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 space-y-6">
                
                {/* Submit review form */}
                {userLoggedIn ? (
                  <form onSubmit={handleReviewSubmit} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-400" /> Write a Customer Review
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-300">Rating:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setNewRating(star)}
                            className="p-1"
                          >
                            <Star className={`w-4 h-4 ${star <= newRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Share your experience with this product..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" /> Submit Review
                    </button>
                  </form>
                ) : (
                  <div className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl text-center">
                    <p className="text-xs text-slate-400">Please log in to submit a review.</p>
                    <button
                      type="button"
                      onClick={onOpenAuth}
                      className="mt-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                    >
                      Log In
                    </button>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-3">
                  {reviews.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No reviews yet. Be the first to review this product!</p>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev.id} className="p-3 bg-slate-950/30 border border-slate-800/80 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img src={rev.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} alt={rev.userName} className="w-5 h-5 rounded-full" />
                            <span className="text-xs font-bold text-slate-200">{rev.userName}</span>
                            {rev.isVerifiedBuyer && (
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-semibold">
                                Verified Buyer
                              </span>
                            )}
                          </div>
                          <div className="flex text-amber-400">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-300">{rev.comment}</p>
                        <span className="text-[10px] text-slate-500">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
