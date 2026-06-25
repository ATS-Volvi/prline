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
        // Login flow
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

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
    <div className="flex items-center justify-center bg-[#fcf8fa] select-none p-6 relative font-sans" style={{ width: '100vw', height: '100vh', minHeight: '100vh', boxSizing: 'border-box' }}>
      {/* Background industrial overlay lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#eae7e9_1px,transparent_1px),linear-gradient(to_bottom,#eae7e9_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-35" />
      
      {/* Login Card */}
      <div className="relative bg-white border border-[#c6c6cd] rounded-xl overflow-hidden shadow-premium-lg z-15 flex flex-col transition-all duration-300" style={{ width: '448px', maxWidth: '100%', boxSizing: 'border-box' }}>
        
        {/* Top Accent Strip */}
        <div className="h-1.5 w-full bg-[#182c47]" />
        
        {/* Header Block */}
        <div className="p-6 bg-[#182c47] text-white flex flex-col items-center border-b border-[#c6c6cd]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="material-symbols-outlined text-[#14b8a6] text-2xl animate-pulse">factory</span>
            <span className="font-label-caps text-xs tracking-widest text-[#94a3b8]">PEPSICO OPERATIONAL GATEWAY</span>
          </div>
          <h2 className="font-headline-lg text-lg font-bold tracking-tight text-white uppercase text-center">
            {getHeaderTitle()}
          </h2>
          <p className="font-body-md text-[10px] text-slate-350 text-center mt-1">
            {getHeaderDesc()}
          </p>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded text-[11px] font-semibold text-red-700 flex items-center gap-2 animate-shake">
              <span className="material-symbols-outlined text-sm">error</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded text-[11px] font-semibold text-emerald-800 flex items-center gap-2 animate-fade-in">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {viewMode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold text-secondary uppercase tracking-wider">FullName</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rajesh Sen"
                className="w-full h-11 border border-[#c6c6cd] rounded px-3 text-xs font-sans focus:outline-none focus:border-[#182c47] focus:ring-1 focus:ring-[#182c47] transition-all bg-slate-50/50"
              />
            </div>
          )}

          {viewMode !== 'reset' && (
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold text-secondary uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@pepsico.com"
                className="w-full h-11 border border-[#c6c6cd] rounded px-3 text-xs font-sans focus:outline-none focus:border-[#182c47] focus:ring-1 focus:ring-[#182c47] transition-all bg-slate-50/50"
              />
            </div>
          )}

          {viewMode !== 'forgot' && (
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold text-secondary uppercase tracking-wider">
                {viewMode === 'reset' ? 'New Password' : 'Password'}
              </label>
              <div className="relative w-full">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 border border-[#c6c6cd] rounded pl-3 pr-12 text-xs font-mono focus:outline-none focus:border-[#182c47] focus:ring-1 focus:ring-[#182c47] transition-all bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-[#182c47] cursor-pointer text-[10px] font-mono font-bold"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>
          )}

          {viewMode === 'reset' && (
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold text-secondary uppercase tracking-wider">Confirm Password</label>
              <div className="relative w-full">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 border border-[#c6c6cd] rounded pl-3 pr-12 text-xs font-mono focus:outline-none focus:border-[#182c47] focus:ring-1 focus:ring-[#182c47] transition-all bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-[#182c47] cursor-pointer text-[10px] font-mono font-bold"
                >
                  {showConfirmPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>
          )}

          {viewMode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[9px] font-bold text-secondary uppercase tracking-wider">Access Authorization Level</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full h-11 border border-[#c6c6cd] rounded px-3 text-xs font-sans focus:outline-none bg-white cursor-pointer"
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
                className="text-[10px] font-sans text-secondary hover:text-[#182c47] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#182c47] hover:bg-[#223d61] text-white font-mono font-bold text-xs rounded transition-all cursor-pointer shadow-premium-sm flex items-center justify-center gap-1.5 uppercase tracking-wider disabled:opacity-50 mt-6"
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
        <div className="px-6 py-4 bg-[#f0edef] border-t border-[#c6c6cd] flex flex-col items-center gap-2 text-[10.5px] font-sans">
          {viewMode === 'login' && (
            <div className="flex justify-center w-full">
              <span className="text-secondary mr-1">Need operational system access?</span>
              <button
                type="button"
                onClick={() => {
                  setViewMode('signup');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="font-bold text-[#182c47] hover:underline cursor-pointer"
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
                // Clean URL query params if we were in reset mode
                if (viewMode === 'reset') {
                  window.history.replaceState({}, document.title, window.location.pathname);
                }
              }}
              className="font-bold text-[#182c47] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
