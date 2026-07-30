'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Shield, Camera, Heart, Settings, Sliders, CheckCircle2, LogOut, Edit3, Save, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { ApiService } from '@/services/api';

export default function ProfilePage() {
  const { user, isAuthenticated, loading, logout, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Login / Register state for unauthenticated users
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const handleStartEdit = () => {
    if (user) {
      setEmail(user.email || '');
      setBio(user.profile?.bio || 'Spatial Computing Enthusiast & E-Commerce Shopper');
      setIsEditing(true);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await ApiService.updateProfile({ email, bio });
      await refreshUser();
      setIsEditing(false);
      setSaveMsg('Profile updated successfully!');
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (e) {
      console.warn('Profile update failed:', e);
      setSaveMsg('Failed to update profile');
      setTimeout(() => setSaveMsg(null), 3000);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        await ApiService.login(usernameInput, passwordInput);
      } else {
        await ApiService.register(usernameInput, passwordInput, emailInput);
      }
      await refreshUser();
    } catch (err: any) {
      setAuthError(err?.response?.data?.error || 'Authentication failed. Please check credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return <div className="p-28 text-center text-slate-400 font-semibold animate-pulse">Loading profile information...</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="px-6 md:px-20 max-w-xl mx-auto pt-28 pb-16">
        <div className="glass-card p-8 md:p-10 rounded-3xl space-y-6 border border-white/10">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-blue-500/10 text-cyan-400 mx-auto flex items-center justify-center border border-cyan-500/20 mb-2">
              <KeyRound className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">
              {authMode === 'login' ? 'Welcome Back to ARV' : 'Create an ARV Account'}
            </h2>
            <p className="text-xs text-slate-400">
              {authMode === 'login' ? 'Sign in to access your spatial captures and wishlist' : 'Register to synchronize session snapshots with Django cloud'}
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Username</label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter your username"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {authMode === 'register' && (
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Password</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all text-center"
            >
              {authLoading ? 'Processing...' : authMode === 'login' ? 'Sign In' : 'Register Account'}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-white/5">
            <button
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError(null);
              }}
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
            >
              {authMode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-20 max-w-7xl mx-auto pt-28 pb-16 space-y-10">
      {/* Profile Header */}
      <div className="glass-card p-8 md:p-10 rounded-3xl flex flex-col md:flex-row items-center gap-8 border border-white/10 relative overflow-hidden">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 via-cyan-400 to-purple-500 p-[2px] shadow-xl shadow-blue-500/20">
          <div className="w-full h-full rounded-full bg-[#07090e] flex items-center justify-center">
            <User className="w-10 h-10 text-cyan-400" />
          </div>
        </div>

        <div className="space-y-2 text-center md:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">{user.username}</h1>
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> {user.is_staff ? 'Admin User' : 'Verified Member'}
            </span>
          </div>

          <p className="text-slate-400 text-sm">{user.profile?.bio || 'Spatial Computing Enthusiast & E-Commerce Shopper'}</p>
          {user.email && <p className="text-xs text-cyan-400/80">{user.email}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleStartEdit}
            className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-semibold transition-all flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4 text-cyan-400" /> Edit Profile
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-semibold transition-all flex items-center gap-2"
          >
            <Camera className="w-4 h-4 text-cyan-400" /> My Gallery
          </Link>
          <Link
            href="/wishlist"
            className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25"
          >
            <Heart className="w-4 h-4" /> Wishlist
          </Link>
          <button
            onClick={() => logout()}
            className="px-4 py-2.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold transition-all flex items-center gap-2"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Edit Form Modal/Drawer */}
      {isEditing && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 rounded-3xl space-y-4 max-w-2xl border border-cyan-500/30">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-cyan-400" /> Update User Information
          </h3>

          <div className="grid grid-cols-1 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Bio / Preferences</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSaveProfile}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs rounded-xl flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-white/10 text-slate-300 text-xs rounded-xl"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {saveMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          {saveMsg}
        </div>
      )}

      {/* Preferences & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Spatial Renderer Preferences</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <div>
                <div className="font-bold text-white text-sm">60 FPS WebGL Engine</div>
                <div className="text-slate-400">Maintain smooth frame-rates during 3D model rotation</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <div>
                <div className="font-bold text-white text-sm">Auto Ground Normalization</div>
                <div className="text-slate-400">Scale 3D bounding boxes to match true real-world meters</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <div>
                <div className="font-bold text-white text-sm">Django REST Cloud Sync</div>
                <div className="text-slate-400">Automatically upload room snapshots to your gallery</div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="glass-card p-8 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Account Links</h3>
          </div>

          <ul className="space-y-3 text-xs font-semibold text-slate-300">
            <li>
              <Link href="/catalog" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 block transition-colors">
                Explore Furniture Catalogue
              </Link>
            </li>
            <li>
              <Link href="/simulator" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 block transition-colors">
                Launch 3D Room Simulator
              </Link>
            </li>
            {user.is_staff && (
              <li>
                <Link href="/admin" className="p-3 rounded-xl bg-blue-600/20 text-cyan-400 border border-cyan-500/30 block transition-colors">
                  Admin Product Management Portal
                </Link>
              </li>
            )}
            <li>
              <Link href="/about" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 block transition-colors">
                About ARV Spatial Platform
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

