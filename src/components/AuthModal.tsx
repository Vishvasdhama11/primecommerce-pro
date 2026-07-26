import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, ShieldCheck, Sparkles, KeyRound } from 'lucide-react';
import { User as UserType } from '../types';
import { signInWithPopup } from 'firebase/auth';
import {
  auth,
  googleProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; user?: UserType; message: string }>;
  onRegister: (data: { name: string; email: string; password: string; phone?: string }) => Promise<{ success: boolean; user?: UserType; message: string }>;
  onGoogleLogin: (data: { email: string; name: string }) => Promise<{ success: boolean; user?: UserType; message: string }>;
  onSendOTP: (phoneOrEmail: string) => Promise<{ success: boolean; demoOtp?: string; message: string }>;
  onVerifyOTP: (phoneOrEmail: string, otp: string) => Promise<{ success: boolean; user?: UserType; message: string }>;
  onForgotPassword: (phoneOrEmail: string) => Promise<{ success: boolean; message: string; demoOtp?: string; resetToken?: string }>;
  onResetPassword?: (phoneOrEmail: string, otp: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onLogin,
  onRegister,
  onGoogleLogin,
  onSendOTP,
  onVerifyOTP,
  onForgotPassword,
  onResetPassword
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'login' | 'register' | 'otp' | 'forgot' | 'google'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const resetAllStates = (newMode: 'login' | 'register' | 'otp' | 'forgot' | 'google') => {
    setMode(newMode);
    setErrorMsg('');
    setSuccessMsg('');
    setOtpSent(false);
    setResetOtpSent(false);
    setOtp('');
    setResetOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handleGoogleSignInDirect = async () => {
    if (window.location.hostname === '0.0.0.0') {
      setErrorMsg(
        'Google popup sign-in is not supported when accessing the app via 0.0.0.0. Please open the app using localhost or enter your Google email manually.'
      );
      setMode('google');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const gUser = result.user;
      if (gUser && gUser.email) {
        const res = await onGoogleLogin({
          email: gUser.email,
          name: gUser.displayName || gUser.email.split('@')[0]
        });
        if (res.success) {
          onClose();
        } else {
          setErrorMsg(res.message);
        }
      }
    } catch (error: any) {
      console.error('Firebase Google Sign-In error:', error);
      if (error?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Google Sign-In popup was closed.');
      } else if (error?.code === 'auth/popup-blocked') {
        setErrorMsg('Popup was blocked by your browser. Please allow popups or sign in with your email below.');
        setMode('google');
      } else {
        setMode('google');
        setErrorMsg('Direct popup unavailable. Please enter your Google email address below to sign in.');
      }
    } finally {
      setLoading(false);
    }
  };
 const sendFirebaseOTP = async (phone: string) => {
  try {
    setErrorMsg("");
    setSuccessMsg("");

    const formattedPhone = phone.replace(/\s+/g, "").startsWith("+91")
      ? phone.replace(/\s+/g, "")
      : `+91${phone.replace(/\s+/g, "")}`;

    console.log("PHONE:", phone);
    console.log("FORMATTED:", formattedPhone);

    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch {}

      (window as any).recaptchaVerifier = null;
    }

    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });

    await verifier.render();

    (window as any).recaptchaVerifier = verifier;

    const confirmation = await signInWithPhoneNumber(
      auth,
      formattedPhone,
      verifier
    );

    setConfirmationResult(confirmation);
    setOtpSent(true);
    setSuccessMsg("OTP sent successfully.");
  } catch (err: any) {
    console.error(err);

    switch (err.code) {
      case "auth/billing-not-enabled":
        setErrorMsg("Firebase Billing is not enabled.");
        break;

      case "auth/operation-not-allowed":
        setErrorMsg("Phone Authentication is disabled.");
        break;

      case "auth/invalid-phone-number":
        setErrorMsg("Invalid Mobile Number.");
        break;

      default:
        setErrorMsg(err.message || "Unable to send OTP.");
    }
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === "login") {
  const res = await onLogin(email, password);

  if (res.success) {
    onClose();
  } else {
    setErrorMsg(res.message);
  }
}else if (mode === 'register') {
        const contact = email.trim() || phone.trim();
        if (!name.trim()) {
          setErrorMsg('Please enter your Full Name.');
          setLoading(false);
          return;
        }
        if (!contact) {
          setErrorMsg('Please enter your Mobile Phone Number or Email Address.');
          setLoading(false);
          return;
        }
        if (!password) {
          setErrorMsg('Please enter a Password.');
          setLoading(false);
          return;
        }
        const res = await onRegister({
          name: name.trim(),
          email: contact,
          password,
          phone: phone.trim() || contact
        });
        if (res.success) {
          onClose();
        } else {
          setErrorMsg(res.message);
        }
      } else if (mode === 'google') {
        if (!googleEmail || !googleName) {
          setErrorMsg('Please enter your Google account email and name.');
          setLoading(false);
          return;
        }
        const res = await onGoogleLogin({ email: googleEmail, name: googleName });
        if (res.success) {
          onClose();
        } else {
          setErrorMsg(res.message);
        }
      } else if (mode === 'otp') {
        const targetContact = phone.trim();
       if (!targetContact) {
  setErrorMsg("Please enter a valid Mobile Number.");
  setLoading(false);
  return;
}

        if (!otpSent) {
         await sendFirebaseOTP(targetContact);
return;
        } else {
          if (!otp.trim()) {
            setErrorMsg('Please enter the 6-digit OTP code.');
            setLoading(false);
            return;
          }
         try {
 if (!confirmationResult) {
  setErrorMsg("OTP session expired.");
  return;
}

await confirmationResult.confirm(otp);
onClose();
  onClose();
  return;
} catch {
  setErrorMsg("Invalid OTP");
  return;
}
         
        }
      } else if (mode === 'forgot') {
        const targetContact = email || phone;
        if (!targetContact) {
          setErrorMsg('Please enter your registered Email Address or Mobile Number.');
          setLoading(false);
          return;
        }

        if (!resetOtpSent) {
          const res = await onForgotPassword(targetContact);
          if (res.success) {
            setResetOtpSent(true);
            setDemoOtp(res.demoOtp || res.resetToken || '654321');
            setSuccessMsg(res.message || `Reset OTP sent! Code: ${res.demoOtp || '654321'}`);
          } else {
            setErrorMsg(res.message);
          }
        } else {
          if (!resetOtp.trim()) {
            setErrorMsg('Please enter the 6-digit OTP code.');
            setLoading(false);
            return;
          }
          if (newPassword !== confirmNewPassword) {
            setErrorMsg('New passwords do not match.');
            setLoading(false);
            return;
          }
          if (newPassword.length < 6) {
            setErrorMsg('Password must be at least 6 characters.');
            setLoading(false);
            return;
          }
          if (onResetPassword) {
            const res = await onResetPassword(targetContact, resetOtp, newPassword);
            if (res.success) {
              setSuccessMsg('Password reset successfully! Log in with your new password.');
              resetAllStates('login');
              setPassword(newPassword);
            } else {
              setErrorMsg(res.message);
            }
          }
        }
      }
    } catch (err) {
      setErrorMsg('An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-white my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 px-5 sm:px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm sm:text-base font-extrabold text-white">
              {mode === 'login' && 'Sign In to NexusStore'}
              {mode === 'register' && 'Create Your Account'}
              {mode === 'google' && 'Sign In with Google'}
              {mode === 'otp' && 'Fast OTP Login'}
              {mode === 'forgot' && 'Reset Password'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            
            {mode === 'google' && (
              <div className="space-y-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"/>
                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                      <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9c-.3-.7-.5-1.5-.5-2.3z"/>
                      <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Google Identity Sign-In</h3>
                    <p className="text-[11px] text-slate-400">Enter your Google account details to proceed.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Google Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={googleName}
                      onChange={(e) => setGoogleName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Google Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      placeholder="user@gmail.com"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* MODE 1: FORGOT PASSWORD */}
            {mode === 'forgot' && (
              <div className="space-y-4">
                {!resetOtpSent ? (
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Registered Email Address or Mobile Number
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="user@gmail.com or 0987654321"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 text-xs"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      We will send a 6-digit OTP code to verify your identity and reset your password.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-indigo-300 uppercase font-extrabold tracking-wider block">Reset Code Sent To</span>
                        <span className="text-xs font-bold text-white">{email || phone}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setResetOtpSent(false);
                          setErrorMsg('');
                          setSuccessMsg('');
                        }}
                        className="text-[10px] text-indigo-400 font-bold hover:underline bg-slate-900 px-2 py-1 rounded-lg border border-indigo-500/30"
                      >
                        Change Detail
                      </button>
                    </div>

                    {/* Reset OTP Field */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-300 font-bold">6-Digit Reset OTP Code</label>
                        {demoOtp && (
                          <button
                            type="button"
                            onClick={() => setResetOtp(demoOtp)}
                            className="text-[10px] text-emerald-400 font-extrabold hover:underline bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 shadow-sm"
                          >
                            Auto-fill OTP ({demoOtp})
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder={demoOtp || '654321'}
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value)}
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-center tracking-widest text-lg focus:ring-1 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">New Password</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="password"
                          placeholder="At least 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:ring-1 focus:ring-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">Confirm New Password</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="password"
                          placeholder="Re-enter new password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:ring-1 focus:ring-indigo-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: REGISTER */}
            {mode === 'register' && (
              <div>
                <label className="block text-slate-300 font-bold mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Your Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
            )}

            {/* CONTACT INPUT (EMAIL OR MOBILE PHONE) FOR LOGIN, REGISTER, AND OTP */}
            {(mode === 'login' || mode === 'register' || (mode === 'otp' && !otpSent)) && (
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  {mode === 'otp' ? 'Mobile Phone (+91) or Gmail Address' : 'Mobile Phone Number or Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
  type="text"
  placeholder="user@gmail.com or 0987654321"
  value={mode === "otp" ? phone : email}
  onChange={(e) => {
    if (mode === "otp") {
      setPhone(e.target.value);
    } else {
      setEmail(e.target.value);
    }
  }}
  className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500"
  required
/>
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'register') && (
              <div>
                <label className="block text-slate-300 font-bold mb-1">Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
            )}

            {/* OTP STEP 2 */}
            {mode === 'otp' && otpSent && (
              <div className="space-y-3">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-indigo-300 uppercase font-extrabold tracking-wider block">OTP Code Sent To</span>
                    <span className="text-xs font-bold text-white">{email || phone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[10px] text-indigo-400 font-bold hover:underline bg-slate-900 px-2 py-1 rounded-lg border border-indigo-500/30"
                  >
                    Change Number
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-300 font-bold">Enter 6-Digit Mobile OTP</label>
                    {demoOtp && (
                      <button
                        type="button"
                        onClick={() => setOtp(demoOtp)}
                        className="text-[10px] text-emerald-400 font-extrabold hover:underline bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 shadow-sm"
                      >
                        Auto-fill OTP ({demoOtp})
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder={demoOtp || '123456'}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-center tracking-widest text-lg focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => resetAllStates('forgot')}
                  className="text-[11px] text-indigo-400 hover:underline font-semibold"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-xs"
            >
              {loading
                ? 'Processing...'
                : mode === 'login'
                ? 'Sign In'
                : mode === 'register'
                ? 'Create Account'
                : mode === 'google'
                ? 'Continue with Google'
                : mode === 'otp'
                ? (otpSent ? 'Verify OTP & Log In' : 'Send Mobile OTP Code')
                : (resetOtpSent ? 'Set New Password & Log In' : 'Send Reset OTP Code')}
            </button>
          </form>
          {/* Social / Alternative Logins */}
          {mode !== 'google' && mode !== 'forgot' && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={handleGoogleSignInDirect}
                disabled={loading}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.8s.7 5.1 1.9 7.5l3.7-2.9c-.3-.7-.5-1.5-.5-2.3z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                </svg>
                Sign in with Google
              </button>

              {mode === 'login' && (
  <button
    type="button"
    onClick={() => resetAllStates('otp')}
    className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-indigo-400 font-bold rounded-xl text-xs border border-slate-800 flex items-center justify-center gap-2"
  >
    <Phone className="w-3.5 h-3.5" />
    Login via Mobile Phone OTP
  </button>
)}
            </div>
          )}

          {/* Toggle Login/Register */}
          <div className="text-center text-xs text-slate-400 pt-2">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button type="button" onClick={() => resetAllStates('register')} className="text-indigo-400 font-bold hover:underline">
                  Sign up now
                </button>
              </p>
            ) : mode === 'register' ? (
              <p>
                Already registered?{' '}
                <button type="button" onClick={() => resetAllStates('login')} className="text-indigo-400 font-bold hover:underline">
                  Log in
                </button>
              </p>
            ) : (
              <p>
                Remember your password?{' '}
                <button type="button" onClick={() => resetAllStates('login')} className="text-indigo-400 font-bold hover:underline">
                  Back to Sign In
                </button>
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
