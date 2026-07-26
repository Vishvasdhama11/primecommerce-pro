import React from 'react';
import { X, Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';
import { Order } from '../types';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 border rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col print:m-0 print:border-none print:shadow-none">
        
        {/* Header Control */}
        <div className="p-4 px-6 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold">Official Tax Invoice #{order.id}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-800">
          
          {/* Company Branding */}
          <div className="flex justify-between items-start border-b pb-6">
            <div>
              <h1 className="text-2xl font-black text-indigo-900 tracking-tight">NexusStore</h1>
              <p className="text-[11px] text-slate-500 font-medium">Nexus Tech Park, Indiranagar, Bengaluru - 560038</p>
              <p className="text-[11px] text-slate-500">GSTIN: 29AAAAA0000A1Z5 &bull; Support: support@nexusstore.com</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-600">TAX INVOICE</span>
              <p className="font-bold text-sm text-slate-900 mt-1">{order.id}</p>
              <p className="text-[11px] text-slate-500">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Billing & Shipping Details */}
          <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <p className="text-[10px] font-extrabold uppercase text-slate-400">Customer Details:</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{order.userName}</p>
              <p className="text-slate-600">{order.userEmail}</p>
              <p className="text-slate-600">{order.shippingAddress.phone}</p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase text-slate-400">Shipping Address:</p>
              <p className="text-slate-700 font-medium mt-0.5">{order.shippingAddress.street}</p>
              <p className="text-slate-700">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="border rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                <tr>
                  <th className="p-3">Item Description</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-3 font-semibold text-slate-900">{item.productTitle}</td>
                    <td className="p-3 text-center">{item.quantity}</td>
                    <td className="p-3 text-right">₹{item.price.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-1.5 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount ({order.couponCode || 'Promo'})</span>
                  <span>- ₹{order.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span>₹{order.gstAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span>{order.shippingFee === 0 ? 'FREE' : `₹${order.shippingFee}`}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-300">
                <span>Total Amount Paid</span>
                <span className="text-indigo-600">₹{order.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="pt-6 border-t text-[10px] text-slate-400 text-center space-y-1">
            <p className="font-semibold text-slate-600">Thank you for shopping with NexusStore!</p>
            <p>This is a computer generated tax invoice and does not require a physical signature.</p>
          </div>

        </div>

      </div>
    </div>
  );
};
