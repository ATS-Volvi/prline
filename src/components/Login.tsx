import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';

export const Login: React.FC = () => {
  const { login } = useApp();
  const [viewMode, setViewMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') ? 'reset' : 'login';
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('Production Supervisor');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setViewMode('reset');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (viewMode === 'signup') {
        let userType = 'reviewer';
        if (selectedRole === 'Plant Admin') userType = 'pri_admin';
        else if (selectedRole === 'HR / Training Coordinator') userType = 'sec_admin';
        else if (selectedRole === 'Plant Manager') userType = 'manager';

        const res = await fetch('/api/v1/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, userType }),
        });

        const data = await res.json();
        if (!res.ok || data.status === false) {
          throw new Error(data.message || 'Registration failed');
        }

        setSuccessMsg('Account created successfully! Verify link sent to email.');
        setViewMode('login');
        setPassword('');
      } else if (viewMode === 'forgot') {
        const res = await fetch('/api/v1/auth/forgetPassword', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        if (!res.ok || data.status === false) {
          throw new Error(data.message || 'Failed to request reset link');
        }

        setSuccessMsg('Password reset link sent to your email.');
        setEmail('');
      } else if (viewMode === 'reset') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const res = await fetch(`/api/v1/auth/updatePassword?token=${encodeURIComponent(resetToken || '')}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });

        const data = await res.json();
        if (!res.ok || data.status === false) {
          throw new Error(data.message || 'Password reset failed');
        }

        setSuccessMsg('Password updated successfully! You can now log in.');
        // Clean URL query params
        window.history.replaceState({}, document.title, window.location.pathname);
        setViewMode('login');
        setPassword('');
        setConfirmPassword('');
      } else {
        // Login flow — use window.fetch to bypass AppContext interceptor
        let res: Response;
        try {
          res = await window.fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
        } catch {
          throw new Error('Cannot reach server. Make sure the backend is running on port 5505.');
        }

        const data = await res.json();
        if (!res.ok || data.status === false) {
          throw new Error(data.message || 'Invalid email or password');
        }

        const token = data.content.accessToken;
        const userProfile = data.content.data;
        
        let role: UserRole = 'Production Supervisor';
        const type = userProfile ? (userProfile as any).userType : undefined;
        if (type === 'pri_admin') role = 'Plant Admin';
        else if (type === 'sec_admin') role = 'HR / Training Coordinator';
        else if (type === 'reviewer') role = 'Production Supervisor';
        else if (type === 'manager') role = 'Plant Manager';

        login(token, userProfile, role);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getHeaderTitle = () => {
    switch (viewMode) {
      case 'signup': return 'Register Portal';
      case 'forgot': return 'Reset Gateway Request';
      case 'reset': return 'Reset System Credentials';
      default: return 'Authorized Access';
    }
  };

  const getHeaderDesc = () => {
    switch (viewMode) {
      case 'signup': return 'Request credentials for the Kolkata Plant scheduling system';
      case 'forgot': return 'Submit email to receive an encrypted password reset link';
      case 'reset': return 'Provide a new secure password for system verification';
      default: return 'Enter encrypted credentials to retrieve active roster control';
    }
  };

  return (
    <div className="flex min-h-screen w-screen bg-[#0b1329] select-none font-sans overflow-y-auto">
      {/* LEFT PANEL: Branding & Plant Live Telemetry (Desktop Only) */}
      <div className="hidden lg:flex lg:w-7/12 xl:w-8/12 bg-gradient-to-br from-[#050b18] via-[#0b1329] to-[#182547] relative flex-col justify-between p-12 overflow-hidden border-r border-[#1e293b]/40">
        
        {/* Animated Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(20,184,166,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(20,184,166,0.025)_1px,transparent_1px)] bg-[size:3rem_3rem] animate-grid-move" />
        
        {/* Glowing Orbs */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#182c47]/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-[#14b8a6]/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Header */}
        <div className="relative flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-[#14b8a6] to-[#0f766e] shadow-lg shadow-[#14b8a6]/20 text-white">
            <span className="material-symbols-outlined text-white text-base">factory</span>
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-tight text-white font-mono leading-none">PEPSICO</h3>
            <p className="text-[7.5px] font-bold text-[#94a3b8] tracking-widest font-label-caps mt-0.5">OPERATIONAL CONTROLS</p>
          </div>
        </div>

        {/* Center Content: Interactive Hero */}
        <div className="relative my-auto space-y-6 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#14b8a6]/10 border border-[#14b8a6]/20 text-[9px] font-bold font-mono text-[#14b8a6] uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6] animate-ping" />
            Zone 4 Smart Gateway
          </span>
          
          <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight uppercase">
            Smarter Scheduling.<br />
            <span className="bg-gradient-to-r from-[#14b8a6] to-[#38bdf8] bg-clip-text text-transparent">Optimized Output.</span>
          </h1>
          
          <p className="text-xs text-[#94a3b8] leading-relaxed max-w-md">
            Welcome to the PepsiCo Kolkata Roster Board. This system automatically cross-references associate skills and availability against production lines to guarantee compliant shift staffing in real-time.
          </p>

          {/* Plant Telemetry Status Card */}
          <div className="bg-[#10192e]/60 border border-[#1e293b]/70 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-4 max-w-md">
            <div className="flex items-center justify-between border-b border-[#1e293b]/60 pb-3">
              <span className="text-[9px] font-bold font-mono text-[#94a3b8] tracking-widest uppercase">PLANT TELEMETRY</span>
              <span className="px-2 py-0.5 text-[8px] font-bold font-mono bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/20 rounded-md">NOMINAL</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[8.5px] font-bold font-mono text-[#64748b] tracking-wider uppercase">Active Shift</p>
                <p className="text-xs font-bold text-white font-sans mt-0.5">SHIFT A (06:00 - 14:00)</p>
              </div>
              <div>
                <p className="text-[8.5px] font-bold font-mono text-[#64748b] tracking-wider uppercase">Seeded Pool</p>
                <p className="text-xs font-bold text-white font-sans mt-0.5">32 Associates Indexed</p>
              </div>
              <div>
                <p className="text-[8.5px] font-bold font-mono text-[#64748b] tracking-wider uppercase">System Sync</p>
                <p className="text-xs font-bold text-white font-sans mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6] animate-pulse" />
                  Live SQL DB
                </p>
              </div>
              <div>
                <p className="text-[8.5px] font-bold font-mono text-[#64748b] tracking-wider uppercase">Location</p>
                <p className="text-xs font-bold text-white font-sans mt-0.5">Kolkata Snacks, IN</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="relative flex items-center justify-between border-t border-[#1e293b]/50 pt-6 text-[9px] font-mono text-[#64748b]">
          <span>© 2026 PepsiCo, Inc. All rights reserved.</span>
          <span>v2.1.0 • secure-mode</span>
        </div>
      </div>

      {/* RIGHT PANEL: The Authentication Form */}
      <div className="w-full lg:w-5/12 xl:w-4/12 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-[#070d19] border-l border-[#1e293b]/20 relative min-h-screen">
        {/* Mobile Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] lg:hidden opacity-30 pointer-events-none" />
        
        {/* Login Card */}
        <div className="relative bg-[#10192e]/85 border border-[#1e293b]/80 rounded-2xl overflow-hidden shadow-2xl z-15 flex flex-col transition-all duration-300 w-full max-w-[420px]">
          
          {/* Top Accent Strip */}
          <div className="h-1 w-full bg-gradient-to-r from-[#14b8a6] to-[#0f766e]" />
          
          {/* Header Block */}
          <div className="p-6 bg-[#10192e] text-white flex flex-col items-center border-b border-[#1e293b]/50">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="material-symbols-outlined text-[#14b8a6] text-xl animate-pulse">factory</span>
              <span className="font-label-caps text-[9px] tracking-widest text-[#94a3b8]">PEPSICO OPERATIONAL GATEWAY</span>
            </div>
            <h2 className="font-headline-md text-base font-bold tracking-tight text-white uppercase text-center">
              {getHeaderTitle()}
            </h2>
            <p className="font-body-md text-[10px] text-slate-400 text-center mt-1">
              {getHeaderDesc()}
            </p>
          </div>

          {/* Content Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
            {error && (
              <div className="p-3 bg-red-500/10 border-l-4 border-red-500 rounded text-[11px] font-semibold text-red-400 flex items-center gap-2 animate-shake">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border-l-4 border-emerald-500 rounded text-[11px] font-semibold text-emerald-400 flex items-center gap-2 animate-fade-in">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            {viewMode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] font-bold text-[#94a3b8] uppercase tracking-wider">FullName</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Sen"
                  className="w-full h-11 border border-[#1e293b] rounded-xl px-3 text-xs font-sans focus:outline-none focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6] transition-all bg-[#1a2b4c]/30 text-white placeholder-slate-500"
                />
              </div>
            )}

            {viewMode !== 'reset' && (
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] font-bold text-[#94a3b8] uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@pepsico.com"
                  className="w-full h-11 border border-[#1e293b] rounded-xl px-3 text-xs font-sans focus:outline-none focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6] transition-all bg-[#1a2b4c]/30 text-white placeholder-slate-500"
                />
              </div>
            )}

            {viewMode !== 'forgot' && (
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] font-bold text-[#94a3b8] uppercase tracking-wider">
                  {viewMode === 'reset' ? 'New Password' : 'Password'}
                </label>
                <div className="relative w-full">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 border border-[#1e293b] rounded-xl pl-3 pr-12 text-xs font-mono focus:outline-none focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6] transition-all bg-[#1a2b4c]/30 text-white placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#14b8a6] cursor-pointer text-[9px] font-mono font-bold"
                  >
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>
            )}

            {viewMode === 'reset' && (
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] font-bold text-[#94a3b8] uppercase tracking-wider">Confirm Password</label>
                <div className="relative w-full">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 border border-[#1e293b] rounded-xl pl-3 pr-12 text-xs font-mono focus:outline-none focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6] transition-all bg-[#1a2b4c]/30 text-white placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#14b8a6] cursor-pointer text-[9px] font-mono font-bold"
                  >
                    {showConfirmPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>
            )}

            {viewMode === 'signup' && (
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[9px] font-bold text-[#94a3b8] uppercase tracking-wider">Access Authorization Level</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full h-11 border border-[#1e293b] rounded-xl px-3 text-xs font-sans focus:outline-none bg-[#10192e] text-white cursor-pointer"
                >
                  <option value="Production Supervisor">Production Supervisor (Floor Manager)</option>
                  <option value="HR / Training Coordinator">HR / Training Coordinator</option>
                  <option value="Plant Admin">Plant Admin</option>
                  <option value="Plant Manager">Plant Manager</option>
                </select>
              </div>
            )}

            {viewMode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('forgot');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[10px] font-sans text-[#94a3b8] hover:text-[#14b8a6] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-[#14b8a6] to-[#0f766e] hover:from-[#119f8f] hover:to-[#0d645e] text-white font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-[#14b8a6]/10 flex items-center justify-center gap-1.5 uppercase tracking-wider disabled:opacity-50 mt-6"
            >
              {loading ? (
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">
                    {viewMode === 'forgot' ? 'mail_outline' : viewMode === 'reset' ? 'sync' : 'lock_open'}
                  </span>
                  {viewMode === 'signup' 
                    ? 'Create Account' 
                    : viewMode === 'forgot' 
                    ? 'Send Reset Link' 
                    : viewMode === 'reset' 
                    ? 'Reset Password' 
                    : 'Authenticate Credentials'}
                </>
              )}
            </button>
          </form>

          {/* Footer Toggle Block */}
          <div className="px-6 py-4 bg-[#0d1727]/90 border-t border-[#1e293b]/60 flex flex-col items-center gap-2 text-[10.5px] font-sans">
            {viewMode === 'login' && (
              <div className="flex justify-center w-full">
                <span className="text-[#94a3b8] mr-1">Need operational system access?</span>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('signup');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-bold text-[#14b8a6] hover:underline cursor-pointer"
                >
                  Register Here
                </button>
              </div>
            )}

            {viewMode !== 'login' && (
              <button
                type="button"
                onClick={() => {
                  setViewMode('login');
                  setError(null);
                  setSuccessMsg(null);
                  if (viewMode === 'reset') {
                    window.history.replaceState({}, document.title, window.location.pathname);
                  }
                }}
                className="font-bold text-[#14b8a6] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
