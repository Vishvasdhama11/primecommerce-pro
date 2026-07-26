import { Router } from 'express';
import { db } from '../db';
import { requireAuth, requireAdmin, AuthRequest } from '../auth';

const router = Router();

// All routes require Admin privileges
router.use(requireAuth, requireAdmin);

// GET /api/admin/dashboard - Stats & Analytics
router.get('/dashboard', (req, res) => {
  const orders = db.get('orders');
  const products = db.get('products');
  const users = db.get('users');

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'PAID' || o.paymentMethod === 'COD')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalOrders = orders.length;
  const totalCustomers = users.filter((u) => u.role === 'USER').length;
  const totalProducts = products.length;

  const lowStockProducts = products.filter((p) => p.stock <= 5);

  const pendingOrders = orders.filter((o) => o.orderStatus === 'PROCESSING').length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === 'DELIVERED').length;
  const returnRequestsCount = orders.filter((o) => o.orderStatus === 'RETURN_REQUESTED' || (o.returnReason && o.returnStatus === 'PENDING')).length;

  // Monthly revenue breakdown
  const revenueByMonth: Record<string, number> = {};
  orders.forEach((o) => {
    const month = new Date(o.createdAt).toLocaleString('default', { month: 'short' });
    revenueByMonth[month] = (revenueByMonth[month] || 0) + o.totalAmount;
  });

  const analyticsData = Object.keys(revenueByMonth).map((month) => ({
    name: month,
    revenue: revenueByMonth[month]
  }));

  res.json({
    success: true,
    stats: {
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      deliveredOrders,
      returnRequestsCount,
      lowStockCount: lowStockProducts.length
    },
    analyticsData,
    recentOrders: orders.slice(0, 5),
    lowStockProducts
  });
});

// GET /api/admin/orders
router.get('/orders', (req, res) => {
  const orders = db.get('orders');
  res.json({ success: true, orders });
});

// POST /api/admin/orders/:id/return-action
router.post('/orders/:id/return-action', (req: AuthRequest, res) => {
  const { id } = req.params;
  const { action, responseNote } = req.body;

  if (!['APPROVE', 'REJECT'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Invalid return action.' });
  }

  const orders = db.get('orders');
  const index = orders.findIndex((o) => o.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  const order = orders[index];

  if (action === 'APPROVE') {
    order.orderStatus = 'RETURNED';
    order.returnStatus = 'APPROVED';
    order.updatedAt = new Date().toISOString();

    // Restock returned products
    const products = db.get('products');
    order.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) prod.stock += item.quantity;
    });
    db.set('products', products);

    db.addLog(req.user!.id, req.user!.name, 'RETURN_APPROVED', `Approved return request for order ${id}. Note: ${responseNote || 'N/A'}`);
  } else {
    order.orderStatus = 'DELIVERED';
    order.returnStatus = 'REJECTED';
    order.updatedAt = new Date().toISOString();

    db.addLog(req.user!.id, req.user!.name, 'RETURN_REJECTED', `Rejected return request for order ${id}. Note: ${responseNote || 'N/A'}`);
  }

  orders[index] = order;
  db.set('orders', orders);

  res.json({
    success: true,
    message: action === 'APPROVE' ? 'Return request approved & inventory restocked!' : 'Return request rejected.',
    order
  });
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', (req: AuthRequest, res) => {
  const { id } = req.params;
  const { orderStatus, trackingNumber, carrier, paymentStatus } = req.body;

  const orders = db.get('orders');
  const index = orders.findIndex((o) => o.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  const order = orders[index];
  if (orderStatus) order.orderStatus = orderStatus;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (carrier) order.carrier = carrier;
  if (paymentStatus) order.paymentStatus = paymentStatus;
  order.updatedAt = new Date().toISOString();

  orders[index] = order;
  db.set('orders', orders);

  db.addLog(req.user!.id, req.user!.name, 'ORDER_UPDATE_STATUS', `Updated order ${id} status to ${orderStatus}`);

  res.json({ success: true, message: 'Order status updated successfully!', order });
});

// GET /api/admin/users
router.get('/users', (req, res) => {
  const users = db.get('users');
  res.json({ success: true, users });
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', (req: AuthRequest, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['USER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role specified.' });
  }

  const users = db.get('users');
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  users[index].role = role;
  db.set('users', users);

  db.addLog(req.user!.id, req.user!.name, 'USER_ROLE_CHANGE', `Changed user ${users[index].email} role to ${role}`);

  res.json({ success: true, message: 'User role updated successfully!', user: users[index] });
});

// GET /api/admin/coupons
router.get('/coupons', (req, res) => {
  const coupons = db.get('coupons');
  res.json({ success: true, coupons });
});

// POST /api/admin/coupons
router.post('/coupons', (req: AuthRequest, res) => {
  const { code, discountType, discountValue, minOrderAmount, maxDiscount, expiresAt } = req.body;

  if (!code || !discountValue || !expiresAt) {
    return res.status(400).json({ success: false, message: 'Code, discount value and expiration date required.' });
  }

  const coupons = db.get('coupons');
  const newCoupon = {
    id: `c_${Date.now()}`,
    code: String(code).toUpperCase().trim(),
    discountType: discountType || 'PERCENTAGE',
    discountValue: Number(discountValue),
    minOrderAmount: Number(minOrderAmount || 0),
    maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
    expiresAt,
    isActive: true
  };

  coupons.push(newCoupon);
  db.set('coupons', coupons);

  db.addLog(req.user!.id, req.user!.name, 'COUPON_CREATE', `Created coupon ${newCoupon.code}`);

  res.status(201).json({ success: true, coupon: newCoupon });
});

// DELETE /api/admin/coupons/:id
router.delete('/coupons/:id', (req, res) => {
  const { id } = req.params;
  let coupons = db.get('coupons');
  coupons = coupons.filter((c) => c.id !== id);
  db.set('coupons', coupons);
  res.json({ success: true, message: 'Coupon deleted.' });
});

// GET /api/admin/banners
router.get('/banners', (req, res) => {
  const banners = db.get('banners');
  res.json({ success: true, banners });
});

// POST /api/admin/banners
router.post('/banners', (req, res) => {
  const { title, subtitle, imageUrl, linkUrl, buttonText } = req.body;
  const banners = db.get('banners');

  const newBanner = {
    id: `b_${Date.now()}`,
    title: title || 'New Promotion Banner',
    subtitle: subtitle || '',
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600',
    linkUrl: linkUrl || '/products',
    buttonText: buttonText || 'Shop Now',
    isActive: true,
    order: banners.length + 1
  };

  banners.push(newBanner);
  db.set('banners', banners);
  res.status(201).json({ success: true, banner: newBanner });
});

// GET /api/admin/logs
router.get('/logs', (req, res) => {
  const logs = db.get('logs');
  res.json({ success: true, logs });
});

// GET /api/admin/backup
router.get('/backup', (req, res) => {
  const backup = db.exportBackup();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=nexus_backup.json');
  res.send(JSON.stringify(backup, null, 2));
});

export default router;
