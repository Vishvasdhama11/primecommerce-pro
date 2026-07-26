import React, { useState } from 'react';
import {
  X,
  Package,
  Truck,
  CheckCircle,
  FileText,
  Clock,
  RotateCcw,
  XCircle,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onCancelOrder: (orderId: string, reason: string) => Promise<void>;
  onRequestReturn: (orderId: string, reason: string) => Promise<void>;
  onViewInvoice: (order: Order) => void;
}

export const MyOrdersModal: React.FC<MyOrdersModalProps> = ({
  isOpen,
  onClose,
  orders,
  onCancelOrder,
  onRequestReturn,
  onViewInvoice
}) => {
  if (!isOpen) return null;

  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);
  const [returnModalOrderId, setReturnModalOrderId] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState('');

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Delivered</span>;
      case 'PROCESSING':
        return <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><Clock className="w-3 h-3 animate-spin" /> Processing</span>;
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><Truck className="w-3 h-3" /> In Transit</span>;
      case 'CANCELLED':
        return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelled</span>;
      case 'RETURN_REQUESTED':
      case 'RETURNED':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Return Requested</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{status}</span>;
    }
  };

  const handleConfirmCancel = async () => {
    if (cancelModalOrderId && actionReason.trim()) {
      await onCancelOrder(cancelModalOrderId, actionReason);
      setCancelModalOrderId(null);
      setActionReason('');
    }
  };

  const handleConfirmReturn = async () => {
    if (returnModalOrderId && actionReason.trim()) {
      await onRequestReturn(returnModalOrderId, actionReason);
      setReturnModalOrderId(null);
      setActionReason('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6 text-white flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-extrabold text-white">My Orders & Live Tracking</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {orders.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Package className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">You have no order history yet.</p>
              <p className="text-xs text-slate-500">Items you purchase will appear here for tracking & invoice downloads.</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                {/* Order Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80 text-xs">
                  <div>
                    <span className="font-extrabold text-white">{order.id}</span>
                    <span className="text-slate-400 ml-2">&bull; {new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.orderStatus)}
                    <span className="font-black text-indigo-400 text-sm">
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Items in Order */}
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <img src={item.productImage} alt={item.productTitle} className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-800" />
                      <div className="flex-1 min-w-0 text-xs">
                        <p className="font-bold text-slate-200 truncate">{item.productTitle}</p>
                        <p className="text-[10px] text-slate-400">Qty: {item.quantity} &bull; ₹{item.price.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tracking & Carrier Info */}
                {order.trackingNumber && (
                  <div className="p-2.5 bg-slate-900/80 rounded-xl text-xs flex items-center justify-between border border-slate-800">
                    <span className="text-slate-400 font-medium">
                      Courier: <strong className="text-white">{order.carrier || 'BlueDart'}</strong> ({order.trackingNumber})
                    </span>
                    <span className="text-emerald-400 text-[11px] font-semibold">Est. Delivery: {order.estimatedDelivery}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => onViewInvoice(order)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-400" /> Download Invoice
                  </button>

                  <div className="flex items-center gap-2">
                    {order.orderStatus === 'PROCESSING' && (
                      <button
                        onClick={() => setCancelModalOrderId(order.id)}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold border border-rose-500/30"
                      >
                        Cancel Order
                      </button>
                    )}

                    {order.orderStatus === 'DELIVERED' && !order.returnReason && (
                      <button
                        onClick={() => setReturnModalOrderId(order.id)}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl text-xs font-semibold border border-amber-500/30"
                      >
                        Return Request
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Cancel Confirmation Prompt */}
        {cancelModalOrderId && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-rose-400">Cancel Order #{cancelModalOrderId}</h4>
            <input
              type="text"
              placeholder="Reason for cancellation..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCancelModalOrderId(null)} className="px-3 py-1 bg-slate-800 text-xs rounded-lg">Close</button>
              <button type="button" onClick={handleConfirmCancel} className="px-3 py-1 bg-rose-600 text-xs text-white font-bold rounded-lg">Confirm Cancel</button>
            </div>
          </div>
        )}

        {/* Return Confirmation Prompt */}
        {returnModalOrderId && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-amber-400">Return Request for Order #{returnModalOrderId}</h4>
            <input
              type="text"
              placeholder="Reason for returning product..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setReturnModalOrderId(null)} className="px-3 py-1 bg-slate-800 text-xs rounded-lg">Close</button>
              <button type="button" onClick={handleConfirmReturn} className="px-3 py-1 bg-amber-600 text-xs text-white font-bold rounded-lg">Submit Return Request</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
