import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  ShieldCheck, 
  ArrowRight, 
  Store, 
  Key, 
  CheckCircle2, 
  User, 
  Phone, 
  HelpCircle,
  Lock
} from 'lucide-react';
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
    const name = guestName.trim() || 'Guest Shopper';
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
    <div id="login-page-wrapper" className="bg-gradient-to-tr from-sky-50 via-slate-50 to-indigo-50 text-slate-800 min-h-screen flex flex-col justify-between selection:bg-sky-400 selection:text-white">
      
      {/* Header Banner Info */}
      <header className="w-full max-w-7xl mx-auto px-6 pt-6 flex flex-wrap justify-between items-center gap-4 text-xs font-medium tracking-wide text-slate-500">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-indigo-600 text-white font-extrabold flex items-center justify-center rounded-xl shadow-md font-brand text-lg">
            M2
          </div>
          <span className="font-bold text-slate-700 uppercase tracking-wider font-brand text-sm">
            M2 Shopping Mall
          </span>
        </div>
        <div className="flex items-center gap-4">
          {isOnline !== undefined && (
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-sky-100 shadow-xs">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`}></span>
              <span className="text-slate-600 font-medium">
                System: <span className={isOnline ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>{isOnline ? 'Online' : 'Offline Mode'}</span>
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-sky-100 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            <span className="text-slate-600 font-medium">
              Portal: <span className="text-sky-600 font-semibold">Wholesaler & Customer</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container Split Layout */}
      <main className="w-full max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-12 gap-12 items-center flex-grow">
        
        {/* Left Section: Info Panel */}
        <section className="md:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-100/60 border border-sky-200 rounded-full text-xs font-semibold text-sky-700 tracking-wide">
            ✨ Multi-Tenant Marketplace Ecosystem
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-900 font-brand leading-tight">
              Centralized <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 drop-shadow-xs">
                Merchant Hub.
              </span>
            </h1>
            <p className="text-slate-600 max-w-md text-base leading-relaxed">
              Access your digital storefront, manage inventory distributions, and connect directly with global wholesale partners instantly.
            </p>
          </div>

          {/* Marketplace Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-slate-900 font-brand">Verified</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Tenants</div>
            </div>
            <div className="space-y-1 border-l border-slate-200 pl-4">
              <div className="text-2xl font-bold text-slate-900 font-brand">Real-Time</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Invoicing</div>
            </div>
            <div className="space-y-1 border-l border-slate-200 pl-4">
              <div className="text-2xl font-bold text-slate-900 font-brand">Multi-Role</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Dashboard</div>
            </div>
          </div>
        </section>

        {/* Right Section: Form Panel */}
        <section className="md:col-span-6 bg-white/75 backdrop-blur-md border border-white rounded-2xl p-8 lg:p-10 shadow-xl shadow-sky-100/40 relative">
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-brand">Account Sign In</h2>
            <p className="text-sm text-slate-500 mt-1">Please select your role and enter credentials.</p>
          </div>

          {/* Role selector radio-style grid with 3 options */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('guest')}
              className={`border rounded-xl p-2.5 flex flex-col items-center gap-1.5 cursor-pointer bg-white hover:bg-slate-50/50 transition-all text-center select-none ${
                activeTab === 'guest'
                  ? 'border-sky-500 bg-sky-50/50 text-sky-800 ring-2 ring-sky-100'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              <ShoppingBag className={`w-4 h-4 ${activeTab === 'guest' ? 'text-sky-600' : 'text-slate-400'}`} />
              <span className="text-[11px] font-bold tracking-tight">Customer</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wholesaler')}
              className={`border rounded-xl p-2.5 flex flex-col items-center gap-1.5 cursor-pointer bg-white hover:bg-slate-50/50 transition-all text-center select-none ${
                activeTab === 'wholesaler'
                  ? 'border-sky-500 bg-sky-50/50 text-sky-800 ring-2 ring-sky-100'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              <Store className={`w-4 h-4 ${activeTab === 'wholesaler' ? 'text-sky-600' : 'text-slate-400'}`} />
              <span className="text-[11px] font-bold tracking-tight">Wholesaler</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`border rounded-xl p-2.5 flex flex-col items-center gap-1.5 cursor-pointer bg-white hover:bg-slate-50/50 transition-all text-center select-none ${
                activeTab === 'admin'
                  ? 'border-indigo-500 bg-indigo-50/50 text-indigo-800 ring-2 ring-indigo-100'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${activeTab === 'admin' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span className="text-[11px] font-bold tracking-tight">Admin</span>
            </button>
          </div>

          {/* Form Content - Customer (Guest) */}
          {activeTab === 'guest' && (
            <form onSubmit={handleGuestSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Your Full Name (Optional)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Amani Joseph" 
                    className="w-full bg-white border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number (Optional)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input 
                    type="tel" 
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="e.g. +234 812 345 6789" 
                    className="w-full bg-white border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all transform active:scale-[0.99] shadow-lg shadow-indigo-200/50 focus:outline-none focus:ring-4 focus:ring-sky-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Storefront as Guest</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Form Content - Wholesaler */}
          {activeTab === 'wholesaler' && (
            <form onSubmit={handleWholesalerSubmit} className="space-y-5">
              {wholesalerError && (
                <div className="p-3.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl font-medium">
                  {wholesalerError}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Wholesaler Access Code</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    required
                    value={wholesalerCodeInput}
                    onChange={(e) => setWholesalerCodeInput(e.target.value)}
                    placeholder="e.g. M2-WS-PREMIUM" 
                    className="w-full bg-white border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all shadow-inner font-mono tracking-wider"
                  />
                </div>
                
                {/* Realtime Resolved Brand Indicator */}
                {resolvedCompany ? (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Verified Brand: <strong>{resolvedCompany}</strong></span>
                  </div>
                ) : (
                  wholesalerCodeInput.trim() && (
                    <div className="mt-2 text-xs text-amber-500 font-medium">
                      Searching active system codes...
                    </div>
                  )
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Your Name (Representative)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    required
                    value={wholesalerName}
                    onChange={(e) => setWholesalerName(e.target.value)}
                    placeholder="e.g. John Doe" 
                    className="w-full bg-white border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all transform active:scale-[0.99] shadow-lg shadow-indigo-200/50 focus:outline-none focus:ring-4 focus:ring-sky-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Access Partner Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Form Content - Admin */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-5">
              {adminError && (
                <div className="p-3.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl font-medium">
                  {adminError}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Security Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input 
                    type="password" 
                    required
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-300 outline-none transition-all shadow-inner font-mono tracking-widest"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-600 to-slate-900 hover:from-indigo-500 hover:to-slate-800 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all transform active:scale-[0.99] shadow-lg shadow-indigo-200/50 focus:outline-none focus:ring-4 focus:ring-indigo-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Initialize Secure Admin Session</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Context Footer Inside Form Card */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
              <span>Need workspace assistance?</span>
            </span>
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Secure Environment
            </div>
          </div>
        </section>
      </main>

      {/* Footer Navigation */}
      <footer className="w-full text-center py-6 text-xs text-slate-400 border-t border-slate-200/60 mt-8">
        Not a registered partner? <a href="#" onClick={() => alert('Please contact the Platform Admin (m2-admin-001) for vendor activation.')} className="text-sky-600 hover:underline font-bold">Apply for Storefront Access</a>
      </footer>

    </div>
  );
}
