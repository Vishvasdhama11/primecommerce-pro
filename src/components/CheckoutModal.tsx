import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Truck,
  CheckCircle2,
  ShieldCheck,
  Plus,
  MapPin,
  Sparkles,
  Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Address, CartItem, Order, PaymentMethod } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  addresses: Address[];
  appliedCouponCode?: string;
  discountAmount?: number;
  onSaveAddress: (address: Omit<Address, 'id' | 'userId'>) => Promise<Address>;
  onCreateOrder: (orderData: any) => Promise<Order | null>;
  onVerifyPayment: (paymentDetails: any) => Promise<boolean>;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  addresses,
  appliedCouponCode,
  discountAmount = 0,
  onSaveAddress,
  onCreateOrder,
  onVerifyPayment,
  onOrderSuccess
}) => {
  

  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id || addresses[0]?.id || ''
  );
  const [showAddAddress, setShowAddAddress] = useState(addresses.length === 0);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    isDefault: true
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('RAZORPAY');
  const [processing, setProcessing] = useState(false);
  const [qrData, setQrData] = useState<{ upiId: string; upiUrl: string } | null>(null);

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.selectedVariant ? item.selectedVariant.price : (item.product.discountPrice || item.product.price);
    return sum + price * item.quantity;
  }, 0);

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const gstAmount = Math.round(discountedSubtotal * 0.18);
  const shippingFee = discountedSubtotal >= 1000 || cartItems.length === 0 ? 0 : 99;
  const totalAmount = discountedSubtotal + gstAmount + shippingFee;

  useEffect(() => {
    if (paymentMethod === 'UPI') {
      setQrData({
        upiId: 'nexusstore@razorpay',
        upiUrl: `upi://pay?pa=nexusstore@razorpay&pn=NexusStore&am=${totalAmount}&cu=INR`
      });
    }
  }, [paymentMethod, totalAmount]);
  useEffect(() => {
  if (addresses.length > 0) {
    const defaultAddress =
      addresses.find((a) => a.isDefault)?.id || addresses[0].id;

    setSelectedAddressId(defaultAddress);
    setShowAddAddress(false);
  }
}, [addresses]);

  const handleAddNewAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   const saved = await onSaveAddress(newAddress);

if (saved) {
  setSelectedAddressId(saved.id);
  setShowAddAddress(false);
}
  };

  const handlePlaceOrder = async () => {
    const address = addresses.find((a) => a.id === selectedAddressId);
    if (!address && !showAddAddress) {
      alert('Please select or add a valid delivery address.');
      return;
    }

    setProcessing(true);

    try {
      // Create Order
      const order = await onCreateOrder({
        items: cartItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          selectedVariant: i.selectedVariant
        })),
        shippingAddress: address || newAddress,
        paymentMethod,
        couponCode: appliedCouponCode
      });

      if (!order) {
        setProcessing(false);
        return;
      }

     if (paymentMethod === 'COD') {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
  });

  setProcessing(false);
  onOrderSuccess(order);
  return;
}else {
        // Simulate official Razorpay verification loop or QR Code payment confirm
        setTimeout(async () => {
          const verified = await onVerifyPayment({
            razorpayOrderId: `order_rzp_${Date.now()}`,
            razorpayPaymentId: `pay_rzp_${Math.random().toString(36).substring(2, 10)}`,
            razorpaySignature: `sig_verified_${Date.now()}`,
            nexusOrderId: order.id,
            paymentMethod
          });

          if (verified) {
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            onOrderSuccess(order);
          } else {
            alert('Payment verification failed. Please try again.');
          }
          setProcessing(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Order checkout error:', err);
      alert('Something went wrong during checkout.');
      setProcessing(false);
    }
  };
if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 text-white flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-extrabold text-white">Secure Checkout</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Checkout Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Step 1: Delivery Address */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> 1. Select Delivery Address
              </h3>
              <button
                type="button"
                onClick={() => setShowAddAddress(!showAddAddress)}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Address
              </button>
            </div>

            {showAddAddress ? (
              <form onSubmit={handleAddNewAddressSubmit} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newAddress.fullName}
                  onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                  className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Mobile Phone"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                  className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Street Address / House No."
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  className="sm:col-span-2 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="City"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="State"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                  className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Pincode"
                  value={newAddress.pincode}
                  onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                  className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  required
                />
                <button
                  type="submit"
                  className="sm:col-span-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                >
                  Save & Use Address
                </button>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20'
                        : 'bg-slate-950/30 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{addr.fullName}</span>
                      <span className="text-[10px] text-slate-400">{addr.phone}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                      {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: Payment Options */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> 2. Select Payment Method
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('RAZORPAY')}
                className={`p-3 rounded-2xl border flex flex-col items-center text-center gap-1.5 transition-all ${
                  paymentMethod === 'RAZORPAY'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-bold">Razorpay / Cards</span>
                <span className="text-[9px] text-slate-400">Cards, Netbanking, Wallets</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-2xl border flex flex-col items-center text-center gap-1.5 transition-all ${
                  paymentMethod === 'UPI'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-bold">UPI / QR Code</span>
                <span className="text-[9px] text-slate-400">GPay, PhonePe, Paytm</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`p-3 rounded-2xl border flex flex-col items-center text-center gap-1.5 transition-all ${
                  paymentMethod === 'COD'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Truck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold">Cash On Delivery</span>
                <span className="text-[9px] text-slate-400">Pay at door</span>
              </button>
            </div>

            {/* UPI QR Display if chosen */}
            {paymentMethod === 'UPI' && qrData && (
              <div className="p-4 bg-slate-950 border border-purple-500/30 rounded-2xl flex flex-col items-center text-center space-y-2">
                <span className="text-xs font-bold text-purple-300">Scan QR Code or tap UPI Apps:</span>
                <div className="p-2 bg-white rounded-xl">
                  {/* QR Graphic */}
                  <div className="w-32 h-32 bg-slate-900 p-2 rounded-lg flex items-center justify-center text-white text-[10px] font-mono break-all text-center">
                    <Smartphone className="w-12 h-12 text-indigo-400" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">{qrData.upiId}</p>
              </div>
            )}
          </div>

          {/* Step 3: Order Summary */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Items Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Coupon Savings ({appliedCouponCode})</span>
                <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-300">
              <span>GST (18%)</span>
              <span>₹{gstAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Shipping Charge</span>
              <span>{shippingFee === 0 ? <strong className="text-emerald-400">FREE</strong> : `₹${shippingFee}`}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
              <span>Payable Amount</span>
              <span className="text-indigo-400 text-base">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

        </div>

        {/* Footer Button */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <button
          type="button"
            onClick={handlePlaceOrder}
            disabled={processing}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
          >
            {processing ? (
              <span>Processing Payment...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" /> Confirm & Pay ₹{totalAmount.toLocaleString('en-IN')}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
