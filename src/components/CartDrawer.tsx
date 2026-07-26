import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, Check, AlertCircle } from 'lucide-react';
import { CartItem } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  onRemoveItem: (productId: string, variantId?: string) => void;
  onProceedToCheckout: (appliedCouponCode?: string, discountAmount?: number) => void;
  onApplyCoupon: (code: string, cartAmount: number) => Promise<{ success: boolean; discountAmount?: number; message: string }>;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  onApplyCoupon
}) => {
  if (!isOpen) return null;

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [applying, setApplying] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = item.selectedVariant ? item.selectedVariant.price : (item.product.discountPrice || item.product.price);
    return sum + itemPrice * item.quantity;
  }, 0);

  const freeShippingThreshold = 1000;
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 99;
  const gstAmount = Math.round(((subtotal - discountAmount) * 0.18));
  const finalTotal = Math.max(0, subtotal - discountAmount) + gstAmount + shippingFee;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setApplying(true);
    setCouponMsg(null);
    const result = await onApplyCoupon(couponCode, subtotal);

    if (result.success && result.discountAmount !== undefined) {
      setAppliedCoupon(couponCode.toUpperCase().trim());
      setDiscountAmount(result.discountAmount);
      setCouponMsg({ type: 'success', text: result.message });
    } else {
      setCouponMsg({ type: 'error', text: result.message });
    }
    setApplying(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-white shadow-2xl flex flex-col">
          
          {/* Cart Header */}
          <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-extrabold text-white">Your Shopping Cart</h2>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full">
                {cartItems.length} items
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Your cart is empty</h3>
                  <p className="text-xs text-slate-400 mt-1">Explore our products and start shopping!</p>
                </div>
              </div>
            ) : (
              cartItems.map((item) => {
                const itemPrice = item.selectedVariant
                  ? item.selectedVariant.price
                  : (item.product.discountPrice || item.product.price);

                return (
                  <div
                    key={`${item.productId}_${item.selectedVariant?.id || 'default'}`}
                    className="p-3 bg-slate-950/50 border border-slate-800 rounded-2xl flex gap-3 items-center"
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-16 h-16 rounded-xl object-cover border border-slate-800"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-100 truncate">{item.product.title}</h4>
                      {item.selectedVariant && (
                        <p className="text-[10px] text-indigo-400 font-semibold">
                          {item.selectedVariant.storage || item.selectedVariant.color || item.selectedVariant.size}
                        </p>
                      )}
                      <p className="text-xs font-black text-white mt-1">
                        ₹{itemPrice.toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Quantity & Delete Controls */}
                    <div className="flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.productId, item.selectedVariant?.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-900">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1, item.selectedVariant?.id)}
                          className="px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-800"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1, item.selectedVariant?.id)}
                          className="px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-800"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Footer / Checkout Summary */}
          {cartItems.length > 0 && (
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
              
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Coupon Code (e.g. NEXUS10)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 uppercase"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={applying}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
                  >
                    Apply
                  </button>
                </div>

                {couponMsg && (
                  <p className={`text-[11px] flex items-center gap-1 ${couponMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {couponMsg.type === 'success' ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {couponMsg.text}
                  </p>
                )}
              </form>

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Coupon Discount ({appliedCoupon})</span>
                    <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span>₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  <span>{shippingFee === 0 ? <strong className="text-emerald-400">FREE</strong> : `₹${shippingFee}`}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                  <span>Total Amount</span>
                  <span className="text-indigo-400">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onProceedToCheckout(appliedCoupon || undefined, discountAmount);
                }}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 text-xs transition-all"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
