import React, { useState, useEffect } from 'react';
import { ShoppingBag, ShieldCheck, UserCheck, ArrowRight, HelpCircle, Store, Key, CheckCircle2 } from 'lucide-react';
import { UserRole, WholesalerSession, WholesalerCode } from '../types';

interface LoginConsoleProps {
  onLogin: (role: UserRole, wholesalerData?: WholesalerSession) => void;
  wholesalerCodes: WholesalerCode[];
  isOnline?: boolean;
}

export default function LoginConsole({ onLogin, wholesalerCodes, isOnline }: LoginConsoleProps) {
  const [activeTab, setActiveTab] = useState<UserRole>('guest');
  
  // Wholesaler Inputs
  const [wholesalerCodeInput, setWholesalerCodeInput] = useState('');
  const [wholesalerName, setWholesalerName] = useState('');
  const [resolvedCompany, setResolvedCompany] = useState<string | null>(null);
  const [wholesalerError, setWholesalerError] = useState('');

  // Auto-resolve company name based on active code input
  useEffect(() => {
    const trimmed = wholesalerCodeInput.trim().toUpperCase();
    if (!trimmed) {
      setResolvedCompany(null);
      return;
    }
    const match = wholesalerCodes.find(
      (c) => c.code.toUpperCase() === trimmed && c.isActive
    );
    if (match) {
      setResolvedCompany(match.companyName);
      setWholesalerError('');
    } else {
      setResolvedCompany(null);
    }
  }, [wholesalerCodeInput, wholesalerCodes]);

  // Admin Inputs
  const [adminCode, setAdminCode] = useState('');
  const [adminError, setAdminError] = useState('');

  // Guest Inputs
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Allow custom guest name or default to "Guest Shopper"
    const name = guestName.trim() || 'Guest Shopper';
    // Store guest details in session for billing
    sessionStorage.setItem('guest_name', name);
    sessionStorage.setItem('guest_phone', guestPhone.trim() || 'N/A');
    onLogin('guest');
  };

  const handleWholesalerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wholesalerCodeInput.trim() || !wholesalerName.trim()) {
      setWholesalerError('Please fill in your access code and representative name.');
      return;
    }

    const trimmedCode = wholesalerCodeInput.trim().toUpperCase();
    const match = wholesalerCodes.find(
      (c) => c.code.toUpperCase() === trimmedCode && c.isActive
    );

    if (!match) {
      setWholesalerError('Invalid or inactive Wholesaler Access Code. Request a code from the super admin.');
      return;
    }

    setWholesalerError('');
    const id = 'ws-' + trimmedCode.toLowerCase();
    onLogin('wholesaler', {
      id,
      name: wholesalerName.trim(),
      companyName: match.companyName,
      loginCode: trimmedCode
    });
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCode.trim() !== 'm2-admin-001') {
      setAdminError('Invalid security access code. Unauthorized access is recorded.');
      return;
    }
    setAdminError('');
    onLogin('admin');
  };

  return (
    <div id="login-console-container" className="min-h-[85vh] flex items-center justify-center p-4">
      <div id="login-card" className="w-full max-w-4xl bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 grid md:grid-cols-12">
        
        {/* Left Side: Branding and Hero */}
        <div id="login-brand-sidebar" className="md:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 text-white flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-8">
              <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                <Store className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-mono font-semibold tracking-wider uppercase">M2-MARKET</span>
              </div>
              
              {isOnline !== undefined && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md ${isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
              )}
            </div>
            
            <h1 className="text-3xl font-bold tracking-tight mb-4">
              M2-Shopping-Mall Market
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              An all-in-one digital ecosystem. Browse live products, list wholesale supplies for admin valuation, or supervise operations as site administrator.
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800/60">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Flexible Roles</h4>
                  <p className="text-xs text-slate-400">Instantly switch between Guest, Wholesaler, and Admin environments.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold">Strict Price Valuations</h4>
                  <p className="text-xs text-slate-400">Admin reviews and modifies wholesaler prices before approving products live.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tabbed Form */}
        <div id="login-form-area" className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center">
          
          {/* Tabs Selector */}
          <div id="login-tabs" className="grid grid-cols-3 gap-1 bg-slate-100 p-1.5 rounded-xl mb-8">
            <button
              id="tab-guest-btn"
              type="button"
              onClick={() => { setActiveTab('guest'); }}
              className={`py-2 px-3 text-xs md:text-sm font-medium rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                activeTab === 'guest'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Guest</span>
            </button>
            <button
              id="tab-wholesaler-btn"
              type="button"
              onClick={() => { setActiveTab('wholesaler'); }}
              className={`py-2 px-3 text-xs md:text-sm font-medium rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                activeTab === 'wholesaler'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Wholesaler</span>
            </button>
            <button
              id="tab-admin-btn"
              type="button"
              onClick={() => { setActiveTab('admin'); }}
              className={`py-2 px-3 text-xs md:text-sm font-medium rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </button>
          </div>

          {/* Form Contexts */}
          {activeTab === 'guest' && (
            <form id="guest-login-form" onSubmit={handleGuestSubmit} className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">Enter Market Storefront</h3>
                <p className="text-sm text-slate-500">Log in as a guest shopper to view live products and place test orders.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="guest-name" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Your Full Name (Optional)
                  </label>
                  <input
                    id="guest-name"
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Amani Joseph"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-slate-50/50"
                  />
                </div>

                <div>
                  <label htmlFor="guest-phone" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    id="guest-phone"
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="e.g. +234 812 345 6789"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-slate-50/50"
                  />
                </div>
              </div>

              <button
                id="submit-guest-login"
                type="submit"
                className="w-full py-3.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <span>Enter Storefront as Guest</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {activeTab === 'wholesaler' && (
            <form id="wholesaler-login-form" onSubmit={handleWholesalerSubmit} className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">Wholesaler Partner Portal</h3>
                <p className="text-sm text-slate-500">Sign in with the access code generated by the Super Admin to access your shop console.</p>
              </div>

              {wholesalerError && (
                <div id="wholesaler-error-msg" className="p-3.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl font-medium">
                  {wholesalerError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="wholesaler-access-code" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Wholesaler Access Code
                  </label>
                  <div className="relative">
                    <input
                      id="wholesaler-access-code"
                      type="text"
                      required
                      value={wholesalerCodeInput}
                      onChange={(e) => setWholesalerCodeInput(e.target.value)}
                      placeholder="e.g. M2-WS-PREMIUM"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-slate-50/50 font-mono tracking-wider"
                    />
                  </div>
                  
                  {/* Realtime Resolved Brand Indicator */}
                  {resolvedCompany ? (
                    <div id="code-success-indicator" className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Verified Brand: <strong>{resolvedCompany}</strong></span>
                    </div>
                  ) : (
                    wholesalerCodeInput.trim() && (
                      <div id="code-searching-indicator" className="mt-2 text-xs text-amber-500 font-medium">
                        Searching active system codes...
                      </div>
                    )
                  )}
                </div>

                <div>
                  <label htmlFor="wholesaler-name" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Your Name (Representative)
                  </label>
                  <input
                    id="wholesaler-name"
                    type="text"
                    required
                    value={wholesalerName}
                    onChange={(e) => setWholesalerName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-slate-50/50"
                  />
                </div>
              </div>

              <button
                id="submit-wholesaler-login"
                type="submit"
                className="w-full py-3.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <span>Access Partner Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {activeTab === 'admin' && (
            <form id="admin-login-form" onSubmit={handleAdminSubmit} className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">System Administration</h3>
                <p className="text-sm text-slate-500">Restricted zone. Sign in using the designated management code.</p>
              </div>

              {adminError && (
                <div id="admin-error-msg" className="p-3.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl font-medium">
                  {adminError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="admin-code" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                    Authorization Code
                  </label>
                  <input
                    id="admin-code"
                    type="password"
                    required
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="Enter authorization code..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm bg-slate-50/50 font-mono tracking-widest"
                  />
                </div>
              </div>

              <button
                id="submit-admin-login"
                type="submit"
                className="w-full py-3.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <span>Initialize Secure Admin Session</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
