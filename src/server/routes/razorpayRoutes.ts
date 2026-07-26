import { Router } from 'express';
import { db } from '../db';
import { requireAuth, AuthRequest } from '../auth';

const router = Router();

// POST /api/razorpay/create-order
router.post('/create-order', requireAuth, (req: AuthRequest, res) => {
  const { amount, currency = 'INR', orderId } = req.body;

  if (!amount || !orderId) {
    return res.status(400).json({ success: false, message: 'Amount and Order ID are required.' });
  }

  // Simulate Razorpay official API response structure
  const rzpOrderId = `order_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;

  res.json({
    success: true,
    razorpayOrderId: rzpOrderId,
    amount: Math.round(amount * 100), // amount in paise
    currency,
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_NexusStore2026',
    notes: {
      nexusOrderId: orderId,
      userEmail: req.user!.email
    }
  });
});

// POST /api/razorpay/verify
router.post('/verify', requireAuth, (req: AuthRequest, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, nexusOrderId, paymentMethod = 'RAZORPAY' } = req.body;

  if (!razorpayPaymentId || !nexusOrderId) {
    return res.status(400).json({ success: false, message: 'Payment reference details missing.' });
  }

  const orders = db.get('orders');
  const index = orders.findIndex((o) => o.id === nexusOrderId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Associated order not found.' });
  }

  const order = orders[index];
  order.paymentStatus = 'PAID';
  order.paymentMethod = paymentMethod;
  order.paymentDetails = {
    razorpayOrderId: razorpayOrderId || `order_dummy_${Date.now()}`,
    razorpayPaymentId,
    razorpaySignature: razorpaySignature || `sig_${Math.random().toString(36).substring(2, 12)}`
  };
  order.orderStatus = 'PROCESSING';
  order.updatedAt = new Date().toISOString();

  orders[index] = order;
  db.set('orders', orders);

  // Restock / Reduce inventory
  const products = db.get('products');
  order.items.forEach((item) => {
    const prod = products.find((p) => p.id === item.productId);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - item.quantity);
    }
  });
  db.set('products', products);

  // Clear user's cart
  const carts = db.get('carts');
  carts[req.user!.id] = [];
  db.set('carts', carts);

  db.addLog(req.user!.id, req.user!.name, 'PAYMENT_SUCCESS', `Verified payment ${razorpayPaymentId} for Order ${nexusOrderId}`);

  res.json({
    success: true,
    message: 'Payment verified and order placed successfully!',
    order
  });
});

// GET /api/razorpay/upi-qr
router.get('/upi-qr', requireAuth, (req: AuthRequest, res) => {
  const { amount, nexusOrderId } = req.query;

  const upiId = 'nexusstore@razorpay';
  const name = 'NexusStore Official';
  const note = `Order Payment ${nexusOrderId}`;

  // Standardized UPI Payment Deep-Link URL string
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

  res.json({
    success: true,
    upiId,
    upiUrl,
    qrCodeData: upiUrl
  });
});

export default router;
