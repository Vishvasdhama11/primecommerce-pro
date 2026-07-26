import { Router } from 'express';
import { db } from '../db';
import { requireAuth, AuthRequest } from '../auth';
import { Address, Review, Coupon } from '../../types';

const router = Router();

// GET /api/cart
router.get('/cart', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const carts = db.get('carts');
  const userCart = carts[userId] || [];
  const products = db.get('products');

  const cartItems = userCart
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      const selectedVariant = item.variantId && product.variants ? product.variants.find((v) => v.id === item.variantId) : undefined;
      return {
        productId: product.id,
        product,
        quantity: item.quantity,
        selectedVariant
      };
    })
    .filter(Boolean);

  res.json({ success: true, items: cartItems });
});

// POST /api/cart/add
router.post('/cart/add', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { productId, quantity = 1, variantId } = req.body;

  const products = db.get('products');
  const product = products.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const carts = db.get('carts');
  const userCart = carts[userId] || [];

  const existingIndex = userCart.findIndex((c) => c.productId === productId && c.variantId === variantId);
  if (existingIndex > -1) {
    userCart[existingIndex].quantity += Number(quantity);
  } else {
    userCart.push({ productId, quantity: Number(quantity), variantId });
  }

  carts[userId] = userCart;
  db.set('carts', carts);

  res.json({ success: true, message: 'Added to cart successfully!' });
});

// PUT /api/cart/update
router.put('/cart/update', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { productId, quantity, variantId } = req.body;

  const carts = db.get('carts');
  let userCart = carts[userId] || [];

  if (quantity <= 0) {
    userCart = userCart.filter((c) => !(c.productId === productId && c.variantId === variantId));
  } else {
    const item = userCart.find((c) => c.productId === productId && c.variantId === variantId);
    if (item) {
      item.quantity = Number(quantity);
    }
  }

  carts[userId] = userCart;
  db.set('carts', carts);

  res.json({ success: true, message: 'Cart updated.' });
});

// DELETE /api/cart/remove
router.delete('/cart/remove', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { productId, variantId } = req.body;

  const carts = db.get('carts');
  let userCart = carts[userId] || [];
  userCart = userCart.filter((c) => !(c.productId === productId && c.variantId === variantId));

  carts[userId] = userCart;
  db.set('carts', carts);

  res.json({ success: true, message: 'Item removed from cart.' });
});

// POST /api/cart/clear
router.post('/cart/clear', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const carts = db.get('carts');
  carts[userId] = [];
  db.set('carts', carts);
  res.json({ success: true, message: 'Cart cleared.' });
});

// GET /api/wishlist
router.get('/wishlist', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const wishlists = db.get('wishlists');
  const userWishlist = wishlists[userId] || [];
  const products = db.get('products');

  const items = products.filter((p) => userWishlist.includes(p.id));
  res.json({ success: true, wishlist: items });
});

// POST /api/wishlist/toggle
router.post('/wishlist/toggle', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { productId } = req.body;

  const wishlists = db.get('wishlists');
  let userWishlist = wishlists[userId] || [];

  const exists = userWishlist.includes(productId);
  if (exists) {
    userWishlist = userWishlist.filter((id) => id !== productId);
  } else {
    userWishlist.push(productId);
  }

  wishlists[userId] = userWishlist;
  db.set('wishlists', wishlists);

  res.json({
    success: true,
    added: !exists,
    message: !exists ? 'Added to Wishlist' : 'Removed from Wishlist'
  });
});

// GET /api/addresses
router.get('/addresses', requireAuth, (req: AuthRequest, res) => {
  const addresses = db.get('addresses').filter((a) => a.userId === req.user!.id);
  res.json({ success: true, addresses });
});

// POST /api/addresses
router.post('/addresses', requireAuth, (req: AuthRequest, res) => {
  const { fullName, phone, street, landmark, city, state, pincode, country, isDefault } = req.body;

  if (!fullName || !phone || !street || !city || !state || !pincode) {
    return res.status(400).json({ success: false, message: 'All address fields are required.' });
  }

  const addresses = db.get('addresses');

  if (isDefault) {
    addresses.forEach((a) => {
      if (a.userId === req.user!.id) a.isDefault = false;
    });
  }

  const newAddress: Address = {
    id: `addr_${Date.now()}`,
    userId: req.user!.id,
    fullName,
    phone,
    street,
    landmark,
    city,
    state,
    pincode,
    country: country || 'India',
    isDefault: Boolean(isDefault || addresses.filter((a) => a.userId === req.user!.id).length === 0)
  };

  addresses.push(newAddress);
  db.set('addresses', addresses);

  res.status(201).json({ success: true, message: 'Address saved successfully!', address: newAddress });
});

// DELETE /api/addresses/:id
router.delete('/addresses/:id', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  let addresses = db.get('addresses');
  addresses = addresses.filter((a) => !(a.id === id && a.userId === req.user!.id));
  db.set('addresses', addresses);
  res.json({ success: true, message: 'Address deleted.' });
});

// POST /api/coupons/verify
router.post('/coupons/verify', (req, res) => {
  const { code, cartAmount } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, message: 'Coupon code required.' });
  }

  const coupons = db.get('coupons');
  const coupon = coupons.find((c) => c.code.toUpperCase() === String(code).trim().toUpperCase() && c.isActive);

  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
  }

  if (new Date(coupon.expiresAt).getTime() < Date.now()) {
    return res.status(400).json({ success: false, message: 'Coupon has expired.' });
  }

  if (cartAmount < coupon.minOrderAmount) {
    return res.status(400).json({
      success: false,
      message: `Minimum order value of ₹${coupon.minOrderAmount} required for code ${coupon.code}.`
    });
  }

  let discount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    discount = (cartAmount * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.discountValue;
  }

  res.json({
    success: true,
    message: `Coupon '${coupon.code}' applied successfully!`,
    coupon,
    discountAmount: Math.round(discount)
  });
});

// POST /api/reviews
router.post('/reviews', requireAuth, (req: AuthRequest, res) => {
  const { productId, rating, comment } = req.body;
  if (!productId || !rating || !comment) {
    return res.status(400).json({ success: false, message: 'Product ID, rating and comment are required.' });
  }

  const reviews = db.get('reviews');
  const orders = db.get('orders').filter((o) => o.userId === req.user!.id);
  const isVerified = orders.some((o) => o.items.some((i) => i.productId === productId));

  const newReview: Review = {
    id: `rev_${Date.now()}`,
    productId,
    userId: req.user!.id,
    userName: req.user!.name,
    userAvatar: req.user!.avatar,
    rating: Number(rating),
    comment,
    isVerifiedBuyer: isVerified,
    createdAt: new Date().toISOString()
  };

  reviews.unshift(newReview);
  db.set('reviews', reviews);

  // Recalculate product rating
  const products = db.get('products');
  const prodIndex = products.findIndex((p) => p.id === productId);
  if (prodIndex > -1) {
    const prodReviews = reviews.filter((r) => r.productId === productId);
    const avgRating = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
    products[prodIndex].rating = Math.round(avgRating * 10) / 10;
    products[prodIndex].numReviews = prodReviews.length;
    db.set('products', products);
  }

  res.status(201).json({ success: true, message: 'Review submitted successfully!', review: newReview });
});

// PUT /api/user/profile
router.put('/profile', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { name, phone, avatar } = req.body;

  const users = db.get('users');
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  if (name) users[userIndex].name = name.trim();
  if (phone !== undefined) users[userIndex].phone = phone.trim();
  if (avatar) users[userIndex].avatar = avatar;

  db.set('users', users);
  db.addLog(userId, users[userIndex].name, 'PROFILE_UPDATE', 'Updated profile information');

  res.json({
    success: true,
    message: 'Profile updated successfully!',
    user: users[userIndex]
  });
});

// POST /api/user/change-password
router.post('/change-password', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
  }

  const passwords = db.get('userPasswords') || {};
  const storedHash = passwords[userId];

  // Hash check helper
  const crypto = require('crypto');
  const hashPass = (p: string) => crypto.createHash('sha256').update(p + 'nexus_salt_2026').digest('hex');

  if (storedHash && storedHash !== hashPass(currentPassword)) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
  }

  passwords[userId] = hashPass(newPassword);
  db.set('userPasswords', passwords);
  db.addLog(userId, req.user!.name, 'PASSWORD_CHANGE', 'Password changed successfully');

  res.json({ success: true, message: 'Password changed successfully!' });
});

export default router;
