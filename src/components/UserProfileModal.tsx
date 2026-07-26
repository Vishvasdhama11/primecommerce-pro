import React, { useState, useRef } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Shield,
  MapPin,
  KeyRound,
  CheckCircle2,
  Package,
  LogOut,
  Camera,
  Plus,
  Trash2,
  Lock,
  Sparkles,
  Edit2,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { User as UserType, Address } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  user: UserType | null;
  userAddresses: Address[];
  onClose: () => void;
  onUpdateProfile: (updated: { name?: string; phone?: string; avatar?: string }) => Promise<boolean>;
  onAddAddress: (addr: Partial<Address>) => Promise<boolean>;
  onDeleteAddress: (id: string) => Promise<boolean>;
  onOpenOrders: () => void;
  onLogout: () => void;
  showToast: (msg: string) => void;
  token: string | null;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  user,
  userAddresses,
  onClose,
  onUpdateProfile,
  onAddAddress,
  onDeleteAddress,
  onOpenOrders,
  onLogout,
  showToast,
  token
}) => {
  if (!isOpen || !user) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'security'>('profile');

  // Edit Profile States
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [avatar, setAvatar] = useState(user.avatar || AVATAR_PRESETS[0]);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image file size must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target.result as string);
          showToast('Profile photo uploaded! Click "Save Profile Changes" to apply.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Add Address Form
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [addrName, setAddrName] = useState(user.name || '');
  const [addrPhone, setAddrPhone] = useState(user.phone || '');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [savingAddr, setSavingAddr] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    const ok = await onUpdateProfile({ name, phone, avatar });
    setSavingProfile(false);
    if (ok) {
      showToast('Profile updated successfully!');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters.');
      return;
    }

    setChangingPass(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      }).then((r) => r.json());

      if (res.success) {
        setPassSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassError(res.message || 'Failed to change password.');
      }
    } catch (err) {
      setPassError('An unexpected error occurred.');
    } finally {
      setChangingPass(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street || !city || !stateName || !pincode) {
      showToast('Please fill all required address fields.');
      return;
    }
    setSavingAddr(true);
    const ok = await onAddAddress({
      fullName: addrName,
      phone: addrPhone,
      street,
      landmark,
      city,
      state: stateName,
      pincode,
      isDefault: userAddresses.length === 0
    });
    setSavingAddr(false);
    if (ok) {
      showToast('New shipping address added!');
      setShowAddAddr(false);
      setStreet('');
      setLandmark('');
      setCity('');
      setStateName('');
      setPincode('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                My Profile
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${user.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'}`}>
                  {user.role}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Manage your account settings, shipping address, and password</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card Summary Banner */}
        <div className="p-4 px-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className="relative group cursor-pointer"
              onClick={() => {
                setActiveTab('profile');
                setTimeout(() => fileInputRef.current?.click(), 100);
              }}
              title="Click to Upload Photo"
            >
              <img
                src={avatar}
                alt={user.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/40 shadow-lg group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-slate-950/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-full text-[10px] shadow">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {user.name}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" /> {user.email}
              </p>
              {user.phone && (
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" /> +91 {user.phone}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenOrders();
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Package className="w-3.5 h-3.5 text-indigo-400" />
              <span>Orders</span>
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-rose-500/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'profile' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <User className="w-4 h-4" /> Edit Profile
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'addresses' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <MapPin className="w-4 h-4" /> Saved Addresses ({userAddresses.length})
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'security' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Shield className="w-4 h-4" /> Password & Security
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: EDIT PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
              
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              {/* Profile Image Upload Section */}
              <div className="space-y-3">
                <label className="block text-slate-300 font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-400" /> Profile Picture & Avatar
                  </span>
                  <span className="text-[10px] text-indigo-400 font-semibold">Upload or Choose Preset</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  {/* Current Preview */}
                  <div className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                    <img
                      src={avatar}
                      alt="Avatar Preview"
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/40 shadow-md flex-shrink-0"
                    />
                    <div>
                      <p className="text-xs font-bold text-white">Current Photo</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Click upload to change</p>
                    </div>
                  </div>

                  {/* Upload Image Button */}
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 border border-indigo-500/40 rounded-2xl text-indigo-300 font-bold flex items-center justify-center gap-2 transition-all group shadow-sm"
                    >
                      <Upload className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                      <span>Upload Photo from Device</span>
                    </button>
                  </div>
                </div>

                {/* Preset Avatars */}
                <div>
                  <p className="text-[11px] text-slate-400 font-semibold mb-2">Or select a quick preset avatar:</p>
                  <div className="flex items-center gap-3 overflow-x-auto pb-1">
                    {AVATAR_PRESETS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatar(p)}
                        className={`relative w-11 h-11 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${avatar === p ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105' : 'border-slate-800 opacity-70 hover:opacity-100'}`}
                      >
                        <img src={p} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                        {avatar === p && (
                          <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Mobile Phone (+91)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Read-Only Email */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Email Address (Primary Login)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-slate-400 font-mono cursor-not-allowed text-xs"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Email is verified and locked to your account security credentials.</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                >
                  {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SAVED ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Your Shipping Addresses</h3>
                <button
                  onClick={() => setShowAddAddr(!showAddAddr)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Address
                </button>
              </div>

              {/* Add Address Form Drawer */}
              {showAddAddr && (
                <form onSubmit={handleCreateAddress} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 text-xs">
                  <h4 className="font-bold text-white text-xs border-b border-slate-800 pb-2">Enter New Address Details</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Recipient Name</label>
                      <input
                        type="text"
                        value={addrName}
                        onChange={(e) => setAddrName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        value={addrPhone}
                        onChange={(e) => setAddrPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Street Address / Building / Flat No.</label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 402, Sunshine Heights, Sector 62"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">City</label>
                      <input
                        type="text"
                        placeholder="e.g. Noida / New Delhi"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">State</label>
                      <input
                        type="text"
                        placeholder="e.g. Uttar Pradesh"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Pincode</label>
                      <input
                        type="text"
                        placeholder="e.g. 201301"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddAddr(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingAddr}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow"
                    >
                      {savingAddr ? 'Saving...' : 'Save Address'}
                    </button>
                  </div>
                </form>
              )}

              {/* Address List */}
              {userAddresses.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/50 border border-slate-800 rounded-2xl space-y-2">
                  <MapPin className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400 font-medium">No saved addresses found.</p>
                  <p className="text-[11px] text-slate-500">Add a shipping address for faster 1-click checkout.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {userAddresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 relative group hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          {addr.fullName}
                          {addr.isDefault && (
                            <span className="text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                              DEFAULT
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => onDeleteAddress(addr.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded"
                          title="Delete Address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-300 font-medium">{addr.street}</p>
                      <p className="text-[11px] text-slate-400">
                        {addr.city}, {addr.state} - <span className="font-mono text-slate-200">{addr.pincode}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" /> +91 {addr.phone}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PASSWORD & SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-5 text-xs">
              
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <Shield className="w-4 h-4" /> Account Protection
                </div>
                <p className="text-slate-400 text-[11px]">
                  Your account is protected with SHA-256 encrypted authentication tokens. You can change your password below at any time.
                </p>
              </div>

              {passError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold">
                  {passError}
                </div>
              )}

              {passSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold">
                  {passSuccess}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Current Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={changingPass}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-xl shadow-lg transition-all"
                  >
                    {changingPass ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
