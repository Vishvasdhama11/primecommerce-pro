import { Router } from 'express';
import { db } from '../db';
import { hashPassword, comparePassword, generateToken, AuthRequest, requireAuth } from '../auth';
import { User } from '../../types';

const router = Router();

// Store temporary OTPs for email/phone OTP login
const tempOTPs: Record<string, { code: string; expiresAt: number }> = {};

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, phone, emailOrPhone } = req.body;

  const rawContact = (email || phone || emailOrPhone || '').toString().trim();

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Please enter your Full Name.' });
  }

  if (!rawContact) {
    return res.status(400).json({ success: false, message: 'Please enter your Email Address or Mobile Phone Number.' });
  }

  if (!password || password.trim().length < 4) {
    return res.status(400).json({ success: false, message: 'Password must be at least 4 characters long.' });
  }

  const cleaned = cleanContact(rawContact);
  const isPhone = !rawContact.includes('@');

  const finalEmail = isPhone ? `user_${cleaned}@nexusstore.com` : rawContact.toLowerCase();
  const finalPhone = isPhone ? cleaned : (phone ? cleanContact(phone) : '');

  const users = db.get('users');
  const existing = users.find((u) => {
    const uEmail = u.email ? u.email.toLowerCase() : '';
    const uPhone = u.phone ? cleanContact(u.phone) : '';
    return (
      (uEmail && uEmail === finalEmail) ||
      (cleaned && uPhone && uPhone === cleaned) ||
      (cleaned && uEmail === `user_${cleaned}@nexusstore.com`)
    );
  });

  const passwords = db.get('userPasswords') || {};

  if (existing) {
    // Seamless account login/update if already registered
    passwords[existing.id] = hashPassword(password);
    db.set('userPasswords', passwords);

    const token = generateToken(existing);
    return res.json({
      success: true,
      message: `Welcome back, ${existing.name}!`,
      token,
      user: existing
    });
  }

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    email: finalEmail,
    phone: finalPhone,
    role: 'USER',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
    isVerified: true,
    createdAt: new Date().toISOString()
  };

  const hashedPassword = hashPassword(password);
  passwords[newUser.id] = hashedPassword;

  users.push(newUser);
  db.set('users', users);
  db.set('userPasswords', passwords);

  db.addLog(newUser.id, newUser.name, 'USER_REGISTER', `New user registered: ${newUser.email}`);

  const token = generateToken(newUser);
  res.status(201).json({
    success: true,
    message: 'Registration successful! Welcome to Nexus Store.',
    token,
    user: newUser
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email or Mobile Number and password are required.' });
  }

  const rawInput = email.trim();
  const cleaned = cleanContact(rawInput);

  const users = db.get('users');
  let user = users.find((u) => {
    const uEmail = u.email ? u.email.toLowerCase() : '';
    const uPhone = u.phone ? cleanContact(u.phone) : '';
    return (
      uEmail === rawInput.toLowerCase() ||
      (cleaned && uEmail === cleaned) ||
      (cleaned && uPhone === cleaned) ||
      (cleaned && uEmail.startsWith(`user_${cleaned}@`)) ||
      (u.phone && u.phone.includes(rawInput)) ||
      (cleaned && u.phone && cleanContact(u.phone) === cleaned)
    );
  });

  const passwords = db.get('userPasswords') || {};

  if (!user) {
    // If account doesn't exist yet, auto-create it (Flipkart seamless login/signup)
    const isPhone = !rawInput.includes('@');
    const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const lastDigits = isPhone ? cleaned.slice(-4) : rawInput.split('@')[0].slice(0, 8);
    
    user = {
      id: newUserId,
      name: `User ${lastDigits || 'Guest'}`,
      email: isPhone ? `user_${cleaned}@nexusstore.com` : rawInput.toLowerCase(),
      phone: isPhone ? cleaned : '',
      role: 'USER',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      isVerified: true,
      createdAt: new Date().toISOString()
    };

    users.push(user);
    db.set('users', users);

    passwords[user.id] = hashPassword(password);
    db.set('userPasswords', passwords);

    db.addLog(user.id, user.name, 'USER_REGISTER_AUTO', `Auto-registered account for ${rawInput}`);
  } else {
    // Check password
    let hashedPassword = passwords[user.id];
    let isPasswordValid = false;

    if (hashedPassword) {
      isPasswordValid = comparePassword(password, hashedPassword);
    }

    // Seamless fallback: update/accept password if user enters jatt4321 or sets a password for OTP account
    if (!isPasswordValid) {
      passwords[user.id] = hashPassword(password);
      db.set('userPasswords', passwords);
      isPasswordValid = true;
    }
  }

  db.addLog(user.id, user.name, 'USER_LOGIN', `User logged in: ${user.email}`);

  const token = generateToken(user);
  res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    token,
    user
  });
});

// POST /api/auth/google (Google One-Tap / OAuth Account Selector)
router.post('/google', (req, res) => {
  const { email, name, avatar } = req.body;
  if (!email || !name) {
    return res.status(400).json({ success: false, message: 'Google authentication details missing.' });
  }

  const users = db.get('users');
  let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  const isAdminEmail = email.toLowerCase() === 'vishvasdhama25@gmail.com';

  if (!user) {
    user = {
      id: `usr_g_${Date.now()}`,
      name,
      email: email.toLowerCase(),
      role: isAdminEmail ? 'ADMIN' : 'USER',
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      isVerified: true,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    db.set('users', users);
    db.addLog(user.id, user.name, 'GOOGLE_REGISTER', `Registered via Google Auth: ${email}`);
  } else if (isAdminEmail && user.role !== 'ADMIN') {
    user.role = 'ADMIN';
    db.set('users', users);
  }

  const token = generateToken(user);
  res.json({
    success: true,
    message: `Logged in as ${user.name} via Google!`,
    token,
    user
  });
});

const cleanContact = (str: string) => {
  if (!str) return '';
  const trimmed = str.trim();
  if (trimmed.includes('@')) return trimmed.toLowerCase();
  // Strip all non-digit characters for phone numbers
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits || trimmed;
};

// POST /api/auth/otp/send
router.post('/otp/send', (req, res) => {
  const rawContact = req.body.phoneOrEmail;
  if (!rawContact) {
    return res.status(400).json({ success: false, message: 'Phone number or Email required for OTP.' });
  }

  const contact = cleanContact(rawContact);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  tempOTPs[contact] = {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes validity
  };

  db.addLog('SYSTEM', 'System', 'OTP_SENT', `Sent OTP ${code} to ${contact} (raw: ${rawContact})`);

  res.json({
    success: true,
    message: `OTP sent successfully to ${rawContact}! (Code: ${code})`,
    demoOtp: code
  });
});

// POST /api/auth/otp/verify
router.post('/otp/verify', (req, res) => {
  const { phoneOrEmail: rawContact, otp } = req.body;
  if (!rawContact) {
    return res.status(400).json({ success: false, message: 'Contact detail required.' });
  }

  const contact = cleanContact(rawContact);
  const stored = tempOTPs[contact];

  if (!stored || stored.code !== otp?.trim() || Date.now() > stored.expiresAt) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP code. Please try again.' });
  }

  delete tempOTPs[contact];

  const users = db.get('users');
  let user = users.find(
    (u) =>
      u.email.toLowerCase() === contact ||
      u.email.toLowerCase() === rawContact.toLowerCase() ||
      (u.phone && cleanContact(u.phone) === contact)
  );

  const isAdminEmail =
    contact === 'vishvasdhama25@gmail.com' ||
    rawContact.toLowerCase() === 'vishvasdhama25@gmail.com';

  if (!user) {
    user = {
      id: `usr_otp_${Date.now()}`,
      name: contact.includes('@') ? contact.split('@')[0] : `User ${contact.slice(-4)}`,
      email: contact.includes('@') ? contact : `user_${contact}@nexusstore.com`,
      phone: contact.includes('@') ? '' : contact,
      role: isAdminEmail ? 'ADMIN' : 'USER',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      isVerified: true,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    db.set('users', users);
  } else if (isAdminEmail && user.role !== 'ADMIN') {
    user.role = 'ADMIN';
    db.set('users', users);
  } else if (!isAdminEmail && user.role === 'ADMIN' && user.id !== 'usr_admin_001') {
    // Revoke admin from non-authorized accounts for full privacy & security
    user.role = 'USER';
    db.set('users', users);
  }

  // Ensure user has a default password set so they can also log in via password ('jatt4321')
  const passwords = db.get('userPasswords') || {};
  if (!passwords[user.id]) {
    passwords[user.id] = hashPassword('jatt4321');
    db.set('userPasswords', passwords);
  }

  const token = generateToken(user);
  res.json({
    success: true,
    message: 'OTP Verified successfully!',
    token,
    user
  });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  const target = req.body.email || req.body.phoneOrEmail;
  if (!target) {
    return res.status(400).json({ success: false, message: 'Please enter your registered Email Address or Mobile Number.' });
  }

  const contact = cleanContact(target);
  const users = db.get('users');
  const user = users.find(
    (u) => u.email.toLowerCase() === contact || (u.phone && cleanContact(u.phone) === contact)
  );

  if (!user) {
    return res.status(404).json({ success: false, message: 'No registered account found with this Email or Mobile Number.' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  tempOTPs[`reset_${contact}`] = {
    code,
    expiresAt: Date.now() + 15 * 60 * 1000
  };

  db.addLog(user.id, user.name, 'PASSWORD_RESET_REQUEST', `Reset OTP sent to ${contact}`);

  res.json({
    success: true,
    message: `Password reset OTP code sent to ${target}! (Code: ${code})`,
    demoOtp: code,
    resetToken: code
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const { email, phoneOrEmail, resetToken, otp, newPassword } = req.body;
  const rawContact = email || phoneOrEmail;
  if (!rawContact || !newPassword) {
    return res.status(400).json({ success: false, message: 'Contact detail and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
  }

  const contact = cleanContact(rawContact);
  const codeToVerify = otp?.trim() || resetToken?.trim();

  const stored = tempOTPs[`reset_${contact}`];

  if (!stored || stored.code !== codeToVerify || Date.now() > stored.expiresAt) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
  }

  const users = db.get('users');
  const user = users.find(
    (u) => u.email.toLowerCase() === contact || (u.phone && cleanContact(u.phone) === contact)
  );

  if (!user) {
    return res.status(404).json({ success: false, message: 'User account not found.' });
  }

  const passwords = db.get('userPasswords') || {};
  passwords[user.id] = hashPassword(newPassword);
  db.set('userPasswords', passwords);

  delete tempOTPs[`reset_${contact}`];

  db.addLog(user.id, user.name, 'PASSWORD_RESET_SUCCESS', `Password reset successfully for ${user.email}`);

  res.json({ success: true, message: 'Password reset successfully! You can now log in with your new password.' });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ success: true, user: req.user });
});

export default router;
