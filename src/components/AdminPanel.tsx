import React, { useState, useEffect } from 'react';
import {
  X,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Tag,
  ShieldAlert,
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  DollarSign,
  Download,
  Activity,
  Check
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Product, Order, User, Coupon, ActivityLog } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, onRefreshData }) => {
  

  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'users' | 'coupons' | 'logs'>('dashboard');
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'RETURNS' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'>('ALL');

  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Add Product Form state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProd, setNewProd] = useState({
    title: '',
    price: '',
    discountPrice: '',
    category: 'Smartphones & Mobile',
    brand: 'Apple',
    stock: '20',
    sku: '',
    description: '',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'
  });

  // Add Coupon Form state
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '10',
    minOrderAmount: '1000',
    expiresAt: '2026-12-31'
  });

  const token = localStorage.getItem('nexus_token');

  const fetchAdminData = async () => {
    if (!token) {
      console.warn('AdminPanel: skipping admin fetch because no auth token is available.');
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Stats
      const resStats = await fetch('/api/admin/dashboard', { headers }).then((r) => r.json());
      if (resStats.success) {
        setStats(resStats.stats);
        setAnalytics(resStats.analyticsData || []);
      }

      // Products
      const resProds = await fetch('/api/products?limit=100').then((r) => r.json());
      if (resProds.success) setProducts(resProds.products);

      // Orders
      const resOrders = await fetch('/api/admin/orders', { headers }).then((r) => r.json());
      if (resOrders.success) setOrders(resOrders.orders);

      // Users
      const resUsers = await fetch('/api/admin/users', { headers }).then((r) => r.json());
      if (resUsers.success) setUsers(resUsers.users);

      // Coupons
      const resCoupons = await fetch('/api/admin/coupons', { headers }).then((r) => r.json());
      if (resCoupons.success) setCoupons(resCoupons.coupons);

      // Logs
      const resLogs = await fetch('/api/admin/logs', { headers }).then((r) => r.json());
      if (resLogs.success) setLogs(resLogs.logs);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchAdminData();
  }, [activeTab, isOpen, token]);

  if (!isOpen) return null;
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newProd.title,
          price: Number(newProd.price),
          discountPrice: newProd.discountPrice ? Number(newProd.discountPrice) : undefined,
          category: newProd.category,
          brand: newProd.brand,
          stock: Number(newProd.stock),
          sku: newProd.sku || `SKU-${Date.now().toString().slice(-6)}`,
          description: newProd.description,
          images: [newProd.image]
        })
      }).then((r) => r.json());

      if (res.success) {
        setShowAddProduct(false);
        fetchAdminData();
        onRefreshData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('Failed to create product.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAdminData();
      onRefreshData();
    } catch (err) {
      alert('Failed to delete product.');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          orderStatus: status,
          trackingNumber: `TRACK-${Math.floor(100000 + Math.random() * 900000)}`,
          carrier: 'BlueDart Express'
        })
      });
      fetchAdminData();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const handleReturnAction = async (orderId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/return-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, responseNote: action === 'APPROVE' ? 'Approved by Admin' : 'Rejected by Admin' })
      }).then((r) => r.json());

      if (res.success) {
        alert(res.message);
        fetchAdminData();
        onRefreshData();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert('Failed to process return action.');
    }
  };

  const handleCreateCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newCoupon)
      }).then((r) => r.json());

      if (res.success) {
        setShowAddCoupon(false);
        fetchAdminData();
      }
    } catch (err) {
      alert('Failed to create coupon.');
    }
  };

  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: nextRole })
      });
      fetchAdminData();
    } catch (err) {
      alert('Failed to update user role.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white my-6 max-h-[92vh] flex flex-col">
        
        {/* Admin Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-base font-extrabold text-white">NexusStore Admin Operations</h2>
              <p className="text-[10px] text-slate-400">Full system control, real-time metrics & inventory management</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-2 bg-slate-950/50 border-b border-slate-800 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard & Sales
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'products' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all relative ${
              activeTab === 'orders' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" /> Orders ({orders.length})
            {orders.some((o) => o.orderStatus === 'RETURN_REQUESTED' || (o.returnReason && o.returnStatus === 'PENDING')) && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-1 right-1" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'coupons' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" /> Coupons
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'users' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'logs' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> System Logs
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Total Revenue</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xl font-black text-white mt-2">₹{stats.totalRevenue?.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Total Orders</span>
                    <Package className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-xl font-black text-white mt-2">{stats.totalOrders}</p>
                </div>
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Registered Customers</span>
                    <Users className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-xl font-black text-white mt-2">{stats.totalCustomers}</p>
                </div>
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Low Stock Items</span>
                    <TrendingUp className="w-4 h-4 text-rose-400" />
                  </div>
                  <p className="text-xl font-black text-rose-400 mt-2">{stats.lowStockCount}</p>
                </div>
              </div>

              {/* Chart */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Revenue Growth Trend</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.length > 0 ? analytics : [{ name: 'Jul', revenue: stats.totalRevenue }]}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Product Management Tab */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Catalog Items</h3>
                <button
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add New Product
                </button>
              </div>

              {showAddProduct && (
                <form onSubmit={handleCreateProductSubmit} className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="Product Title"
                    value={newProd.title}
                    onChange={(e) => setNewProd({ ...newProd, title: e.target.value })}
                    className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Regular Price (₹)"
                    value={newProd.price}
                    onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                    className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Discount Price (₹)"
                    value={newProd.discountPrice}
                    onChange={(e) => setNewProd({ ...newProd, discountPrice: e.target.value })}
                    className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                  <input
                    type="number"
                    placeholder="Stock Quantity"
                    value={newProd.stock}
                    onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })}
                    className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Brand"
                    value={newProd.brand}
                    onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })}
                    className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Image URL"
                    value={newProd.image}
                    onChange={(e) => setNewProd({ ...newProd, image: e.target.value })}
                    className="p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    required
                  />
                  <textarea
                    placeholder="Product description..."
                    value={newProd.description}
                    onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                    className="sm:col-span-2 p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    rows={2}
                  />
                  <button type="submit" className="sm:col-span-2 py-2.5 bg-amber-500 text-slate-950 font-black rounded-xl text-xs">
                    Save Product
                  </button>
                </form>
              )}

              <div className="space-y-2">
                {products.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt={p.title} className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <p className="font-bold text-white max-w-sm truncate">{p.title}</p>
                        <p className="text-[10px] text-slate-400">Stock: {p.stock} &bull; Price: ₹{p.price.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleDeleteProduct(p.id)} className="p-2 text-rose-400 hover:bg-slate-800 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Order Status Filters */}
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800 text-xs">
                <button
                  onClick={() => setOrderFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    orderFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  All Orders ({orders.length})
                </button>

                <button
                  onClick={() => setOrderFilter('RETURNS')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                    orderFilter === 'RETURNS'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                  }`}
                >
                  🔄 Return Requests ({orders.filter((o) => o.orderStatus === 'RETURN_REQUESTED' || o.returnReason).length})
                </button>

                <button
                  onClick={() => setOrderFilter('PROCESSING')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    orderFilter === 'PROCESSING' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Processing ({orders.filter((o) => o.orderStatus === 'PROCESSING').length})
                </button>

                <button
                  onClick={() => setOrderFilter('SHIPPED')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    orderFilter === 'SHIPPED' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Shipped ({orders.filter((o) => o.orderStatus === 'SHIPPED').length})
                </button>

                <button
                  onClick={() => setOrderFilter('DELIVERED')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    orderFilter === 'DELIVERED' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Delivered ({orders.filter((o) => o.orderStatus === 'DELIVERED').length})
                </button>

                <button
                  onClick={() => setOrderFilter('CANCELLED')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    orderFilter === 'CANCELLED' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Cancelled ({orders.filter((o) => o.orderStatus === 'CANCELLED').length})
                </button>
              </div>

              {/* Order Items */}
              {orders
                .filter((o) => {
                  if (orderFilter === 'RETURNS') return o.orderStatus === 'RETURN_REQUESTED' || Boolean(o.returnReason);
                  if (orderFilter === 'PROCESSING') return o.orderStatus === 'PROCESSING';
                  if (orderFilter === 'SHIPPED') return o.orderStatus === 'SHIPPED';
                  if (orderFilter === 'DELIVERED') return o.orderStatus === 'DELIVERED';
                  if (orderFilter === 'CANCELLED') return o.orderStatus === 'CANCELLED';
                  return true;
                })
                .map((o) => (
                  <div key={o.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-3 text-xs">
                    
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                      <div>
                        <span className="font-extrabold text-white text-sm">{o.id}</span>
                        <span className="text-slate-400 ml-2">&bull; {o.userName} ({o.userEmail})</span>
                        <p className="text-[11px] text-indigo-400 font-semibold mt-0.5">
                          Total Amount: ₹{o.totalAmount.toLocaleString('en-IN')} &bull; Payment Method: {o.paymentMethod} ({o.paymentStatus})
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={o.orderStatus}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white font-bold focus:ring-1 focus:ring-amber-500"
                        >
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="RETURN_REQUESTED">RETURN REQUESTED</option>
                          <option value="RETURNED">RETURNED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </div>
                    </div>

                    {/* Order Items List */}
                    <div className="space-y-1.5">
                      {o.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-slate-300">
                          {item.productImage && (
                            <img src={item.productImage} alt={item.productTitle} className="w-8 h-8 rounded object-cover" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-white truncate block">{item.productTitle}</span>
                            <span className="text-[10px] text-slate-400">Qty: {item.quantity} &bull; ₹{item.price.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* RETURN REQUEST ALERT BOX (If return requested or exists) */}
                    {(o.returnReason || o.orderStatus === 'RETURN_REQUESTED') && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded uppercase">
                              Return Request
                            </span>
                            <span className="text-[11px] font-bold text-amber-300">
                              Status: {o.returnStatus || 'PENDING'}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-200 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                          <strong className="text-amber-400">Customer Reason:</strong> "{o.returnReason || 'No reason specified'}"
                        </p>

                        {(o.returnStatus === 'PENDING' || o.orderStatus === 'RETURN_REQUESTED') && (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleReturnAction(o.id, 'APPROVE')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 shadow-md"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve Return & Restock
                            </button>
                            <button
                              onClick={() => handleReturnAction(o.id, 'REJECT')}
                              className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white font-bold rounded-lg text-xs transition-colors"
                            >
                              Reject Request
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                ))}

              {orders.filter((o) => {
                if (orderFilter === 'RETURNS') return o.orderStatus === 'RETURN_REQUESTED' || Boolean(o.returnReason);
                if (orderFilter === 'PROCESSING') return o.orderStatus === 'PROCESSING';
                if (orderFilter === 'SHIPPED') return o.orderStatus === 'SHIPPED';
                if (orderFilter === 'DELIVERED') return o.orderStatus === 'DELIVERED';
                if (orderFilter === 'CANCELLED') return o.orderStatus === 'CANCELLED';
                return true;
              }).length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No orders found matching the selected filter ({orderFilter}).
                </div>
              )}
            </div>
          )}

          {/* Coupons Tab */}
          {activeTab === 'coupons' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase text-slate-300">Discount Coupons</h3>
                <button
                  onClick={() => setShowAddCoupon(!showAddCoupon)}
                  className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Coupon
                </button>
              </div>

              {showAddCoupon && (
                <form onSubmit={handleCreateCouponSubmit} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl grid grid-cols-2 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="Coupon Code (e.g. FESTIVE20)"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                    className="p-2 bg-slate-900 border border-slate-700 rounded-xl text-white uppercase"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Discount Value"
                    value={newCoupon.discountValue}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: e.target.value })}
                    className="p-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                    required
                  />
                  <button type="submit" className="col-span-2 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl">Save Coupon</button>
                </form>
              )}

              <div className="space-y-2">
                {coupons.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-amber-400">{c.code}</span>
                      <span className="text-slate-400 ml-2">&bull; {c.discountValue}% OFF (Min ₹{c.minOrderAmount})</span>
                    </div>
                    <span className="text-emerald-400 font-bold">Active</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white">{u.name}</span>
                    <span className="text-slate-400 ml-2">({u.email})</span>
                  </div>
                  <button
                    onClick={() => handleToggleUserRole(u.id, u.role)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                      u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {u.role} (Click to toggle)
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-2 font-mono text-[11px]">
              {logs.map((l) => (
                <div key={l.id} className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-slate-300">
                  <span className="text-indigo-400 font-bold">{new Date(l.timestamp).toLocaleTimeString()}</span> &bull;{' '}
                  <span className="text-amber-400">{l.action}</span> &bull; {l.details}
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
