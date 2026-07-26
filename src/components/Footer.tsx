import React from 'react';
import { ShieldCheck, Truck, RotateCcw, Headphones, Heart, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs mt-16">
      
      {/* Value Proposition Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b border-slate-800/80">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-100">Free Express Delivery</p>
              <p className="text-[11px] text-slate-500">On all orders over ₹1,000</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-100">100% Genuine Products</p>
              <p className="text-[11px] text-slate-500">Direct brand warranty</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-100">Easy 7-Day Returns</p>
              <p className="text-[11px] text-slate-500">Hassle-free instant refund</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-100">24/7 Dedicated Support</p>
              <p className="text-[11px] text-slate-500">Call or email anytime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-pink-500 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center font-black text-indigo-400">
                N
              </div>
            </div>
            <span className="text-base font-extrabold text-white">NexusStore</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Premium E-Commerce platform bringing you cutting-edge tech gadgets, flagship smartphones, audio equipment and wearable technology.
          </p>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-[11px]">
            <Lock className="w-3.5 h-3.5" /> 256-Bit SSL Secured Checkout
          </div>
        </div>

        <div>
          <h4 className="font-bold text-slate-200 mb-3">Popular Categories</h4>
          <ul className="space-y-2 text-[11px]">
            <li>Smartphones & Mobile</li>
            <li>Laptops & Workstations</li>
            <li>Noise Canceling Headphones</li>
            <li>Wearable Tech & Watches</li>
            <li>Smart Home & Audio</li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-slate-200 mb-3">Customer Care</h4>
          <ul className="space-y-2 text-[11px]">
            <li>Order Tracking</li>
            <li>Shipping Policies</li>
            <li>Returns & Cancellations</li>
            <li>Razorpay / UPI Payment Help</li>
            <li>Contact Support</li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-slate-200 mb-3">Accepted Payment Methods</h4>
          <p className="text-[11px] text-slate-400 mb-3">
            Secure payments processed via Razorpay API & UPI Deep Links.
          </p>
          <div className="flex flex-wrap gap-2 text-[10px] font-bold">
            <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300">GPay</span>
            <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300">PhonePe</span>
            <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300">Paytm</span>
            <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300">Visa</span>
            <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300">MasterCard</span>
            <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300">COD</span>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-slate-950 border-t border-slate-900 py-4 text-center text-[11px] text-slate-500">
        <p>© 2026 NexusStore E-Commerce Platform. All rights reserved.</p>
      </div>
    </footer>
  );
};
