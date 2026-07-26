import { Router } from 'express';
import { db } from '../db';
import { requireAuth, AuthRequest } from '../auth';
import { Order, OrderItem, Address, OrderStatus } from '../../types';

const router = Router();

// POST /api/orders/create
router.post('/create', requireAuth, (req: AuthRequest, res) => {
  const { items, shippingAddress, paymentMethod, couponCode } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart items are required to place an order.' });
  }

  if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
    return res.status(400).json({ success: false, message: 'Valid shipping address is required.' });
  }

  const products = db.get('products');
  const orderItems: OrderItem[] = [];
  let subtotal = 0;

  // Validate inventory & calculate subtotal
  for (const item of items) {
    const prod = products.find((p) => p.id === item.productId);
    if (!prod) {
      return res.status(400).json({ success: false, message: `Product ${item.productId} no longer exists.` });
    }
    if (prod.stock < item.quantity) {
      return res.status(400).json({ success: false, message: `Insufficient stock for '${prod.title}'. Only ${prod.stock} left.` });
    }

    const price = item.selectedVariant ? item.selectedVariant.price : (prod.discountPrice || prod.price);
    subtotal += price * item.quantity;

    orderItems.push({
      productId: prod.id,
      productTitle: prod.title,
      productImage: prod.images[0] || '',
      price,
      quantity: item.quantity,
      selectedVariant: item.selectedVariant ? {
        size: item.selectedVariant.size,
        color: item.selectedVariant.color,
        storage: item.selectedVariant.storage
      } : undefined
    });
  }

  // Calculate discount
  let discount = 0;
  if (couponCode) {
    const coupons = db.get('coupons');
    const coupon = coupons.find((c) => c.code.toUpperCase() === String(couponCode).toUpperCase() && c.isActive);
    if (coupon && subtotal >= coupon.minOrderAmount) {
      if (coupon.discountType === 'PERCENTAGE') {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
      } else {
        discount = coupon.discountValue;
      }
    }
  }

  const settings = db.get('settings');
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const gstAmount = Math.round((discountedSubtotal * (settings.gstRatePercent || 18)) / 100);
  const shippingFee = discountedSubtotal >= (settings.freeShippingThreshold || 1000) ? 0 : (settings.flatShippingFee || 99);
  const totalAmount = Math.round(discountedSubtotal + gstAmount + shippingFee);

  const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  const isAutoPaid = paymentMethod === 'COD';

  const newOrder: Order = {
    id: orderId,
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: req.user!.name,
    items: orderItems,
    shippingAddress,
    subtotal,
    discount,
    couponCode: couponCode || undefined,
    gstAmount,
    shippingFee,
    totalAmount,
    paymentMethod: paymentMethod || 'COD',
    paymentStatus: isAutoPaid ? 'PENDING' : 'PENDING',
    orderStatus: 'PROCESSING',
    estimatedDelivery: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const orders = db.get('orders');
  orders.unshift(newOrder);
  db.set('orders', orders);

  // If COD, deduct stock & clear cart immediately
  if (paymentMethod === 'COD') {
    products.forEach((p) => {
      const match = orderItems.find((oi) => oi.productId === p.id);
      if (match) {
        p.stock = Math.max(0, p.stock - match.quantity);
      }
    });
    db.set('products', products);

    const carts = db.get('carts');
    carts[req.user!.id] = [];
    db.set('carts', carts);
  }

  db.addLog(req.user!.id, req.user!.name, 'ORDER_CREATE', `Created order ${newOrder.id} totaling ₹${totalAmount}`);

  res.status(201).json({
    success: true,
    message: 'Order created successfully!',
    order: newOrder
  });
});

// GET /api/orders/my
router.get('/my', requireAuth, (req: AuthRequest, res) => {
  const orders = db.get('orders').filter((o) => o.userId === req.user!.id);
  res.json({ success: true, orders });
});

// GET /api/orders/:id
router.get('/:id', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const orders = db.get('orders');
  const order = orders.find((o) => o.id === id && (o.userId === req.user!.id || req.user!.role === 'ADMIN'));

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  res.json({ success: true, order });
});

// POST /api/orders/:id/cancel
router.post('/:id/cancel', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const orders = db.get('orders');
  const index = orders.findIndex((o) => o.id === id && o.userId === req.user!.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  const order = orders[index];
  if (order.orderStatus === 'DELIVERED' || order.orderStatus === 'CANCELLED') {
    return res.status(400).json({ success: false, message: `Cannot cancel an order that is ${order.orderStatus}.` });
  }

  order.orderStatus = 'CANCELLED';
  order.updatedAt = new Date().toISOString();
  orders[index] = order;
  db.set('orders', orders);

  // Restock inventory
  const products = db.get('products');
  order.items.forEach((item) => {
    const prod = products.find((p) => p.id === item.productId);
    if (prod) {
      prod.stock += item.quantity;
    }
  });
  db.set('products', products);

  db.addLog(req.user!.id, req.user!.name, 'ORDER_CANCEL', `Cancelled order ${id}. Reason: ${reason || 'N/A'}`);

  res.json({ success: true, message: 'Order cancelled successfully and inventory restored.', order });
});

// POST /api/orders/:id/return
router.post('/:id/return', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ success: false, message: 'Reason for return is required.' });
  }

  const orders = db.get('orders');
  const index = orders.findIndex((o) => o.id === id && o.userId === req.user!.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  const order = orders[index];
  if (order.orderStatus !== 'DELIVERED') {
    return res.status(400).json({ success: false, message: 'Returns can only be requested for delivered orders.' });
  }

  order.orderStatus = 'RETURN_REQUESTED';
  order.returnReason = reason;
  order.returnStatus = 'PENDING';
  order.updatedAt = new Date().toISOString();

  orders[index] = order;
  db.set('orders', orders);

  db.addLog(req.user!.id, req.user!.name, 'RETURN_REQUEST', `Return requested for order ${id}. Reason: ${reason}`);

  res.json({ success: true, message: 'Return request submitted. Our team will review within 24 hours.', order });
});

export default router;
