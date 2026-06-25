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

        const res = await window.fetch('/api/v1/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, userType }),
        });

        const data = await res.json();
        if (!res.ok || data.status === false) {
          throw new Error(data.message || 'Registration failed');
        }

        setSuccessMsg('Account created! You can now sign in.');
        setName('');
        setEmail('');
        setPassword('');
        setViewMode('login');
      } else if (viewMode === 'forgot') {
        const res = await window.fetch('/api/v1/auth/forgetPassword', {
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

        const res = await window.fetch(`/api/v1/auth/updatePassword?token=${encodeURIComponent(resetToken || '')}`, {
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
    <div
      className="login-root select-none font-sans"
      style={{
        display: 'flex',
        width: '100vw',
        minHeight: '100dvh',
        backgroundColor: '#0b1329',
        overflowY: 'auto',
      }}
    >
      {/* LEFT PANEL: Branding & Plant Live Telemetry (Desktop Only) */}
      <div
        className="login-left-panel"
        style={{
          width: '58%',
          flexShrink: 0,
          background: 'linear-gradient(135deg, #050b18 0%, #0b1329 50%, #182547 100%)',
          position: 'relative',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '3rem',
          overflow: 'hidden',
          borderRight: '1px solid rgba(30,41,59,0.4)',
          minHeight: '100dvh',
        }}
      >
        
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
        <div style={{ position: 'relative', marginTop: 'auto', marginBottom: 'auto', maxWidth: '520px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#14b8a6]/10 border border-[#14b8a6]/20 text-[9px] font-bold font-mono text-[#14b8a6] uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-[#14b8a6] animate-ping" />
            Zone 4 Smart Gateway
          </span>
          
          <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight uppercase">
            Smarter Scheduling.<br />
            <span className="bg-gradient-to-r from-[#14b8a6] to-[#38bdf8] bg-clip-text text-transparent">Optimized Output.</span>
          </h1>
          
          <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.75', maxWidth: '440px' }}>
            Welcome to the PepsiCo Kolkata Roster Board. This system automatically cross-references associate skills and availability against production lines to guarantee compliant shift staffing in real-time.
          </p>

          {/* Plant Telemetry Status Card */}
          <div style={{ backgroundColor: 'rgba(16,25,46,0.6)', border: '1px solid rgba(30,41,59,0.7)', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', backdropFilter: 'blur(12px)', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#070d19',
          borderLeft: '1px solid rgba(30,41,59,0.2)',
          position: 'relative',
          minHeight: '100dvh',
          padding: '2.5rem 1.5rem',
        }}
      >
        {/* Mobile Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] lg:hidden opacity-30 pointer-events-none" />
        
        {/* Login Card */}
        <div style={{
          position: 'relative',
          backgroundColor: '#10192e',
          border: '1px solid #1e293b',
          borderRadius: '1rem',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '420px',
        }}>

          {/* Top Accent Strip */}
          <div style={{ height: '4px', width: '100%', background: 'linear-gradient(to right, #14b8a6, #0f766e)' }} />

          {/* Header Block */}
          <div style={{ padding: '1.5rem', backgroundColor: '#10192e', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid rgba(30,41,59,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
              <span className="material-symbols-outlined" style={{ color: '#14b8a6', fontSize: '20px' }}>factory</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase' }}>PEPSICO OPERATIONAL GATEWAY</span>
            </div>
            <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em', color: 'white', textTransform: 'uppercase', textAlign: 'center', margin: 0 }}>
              {getHeaderTitle()}
            </h2>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#94a3b8', textAlign: 'center', marginTop: '0.25rem', marginBottom: 0 }}>
              {getHeaderDesc()}
            </p>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>

            {error && (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239,68,68,0.08)', borderLeft: '4px solid #ef4444', borderRadius: '0.375rem', fontSize: '11px', fontWeight: 600, color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(16,185,129,0.08)', borderLeft: '4px solid #10b981', borderRadius: '0.375rem', fontSize: '11px', fontWeight: 600, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            {viewMode === 'signup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Full Name</label>
                <input
                  type="text" required value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Sen"
                  className="login-input"
                  style={{ width: '100%', height: '44px', border: '1px solid #1e293b', borderRadius: '0.75rem', padding: '0 0.75rem', fontSize: '12px', backgroundColor: 'rgba(26,43,76,0.3)', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}

            {viewMode !== 'reset' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email Address</label>
                <input
                  type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@pepsico.com"
                  className="login-input"
                  style={{ width: '100%', height: '44px', border: '1px solid #1e293b', borderRadius: '0.75rem', padding: '0 0.75rem', fontSize: '12px', backgroundColor: 'rgba(26,43,76,0.3)', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}

            {viewMode !== 'forgot' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {viewMode === 'reset' ? 'New Password' : 'Password'}
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="login-input"
                    style={{ width: '100%', height: '44px', border: '1px solid #1e293b', borderRadius: '0.75rem', padding: '0 3rem 0 0.75rem', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', backgroundColor: 'rgba(26,43,76,0.3)', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                    {showPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>
            )}

            {viewMode === 'reset' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Confirm Password</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'} required value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="login-input"
                    style={{ width: '100%', height: '44px', border: '1px solid #1e293b', borderRadius: '0.75rem', padding: '0 3rem 0 0.75rem', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', backgroundColor: 'rgba(26,43,76,0.3)', color: 'white', outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                    {showConfirmPassword ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
              </div>
            )}

            {viewMode === 'signup' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Access Level</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  style={{ width: '100%', height: '44px', border: '1px solid #1e293b', borderRadius: '0.75rem', padding: '0 0.75rem', fontSize: '12px', backgroundColor: '#0d1727', color: 'white', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
                >
                  <option value="Production Supervisor">Production Supervisor</option>
                  <option value="HR / Training Coordinator">HR / Training Coordinator</option>
                  <option value="Plant Admin">Plant Admin</option>
                  <option value="Plant Manager">Plant Manager</option>
                </select>
              </div>
            )}

            {viewMode === 'login' && (
              <div style={{ textAlign: 'right' }}>
                <button type="button"
                  onClick={() => { setViewMode('forgot'); setError(null); setSuccessMsg(null); }}
                  style={{ background: 'none', border: 'none', fontSize: '10px', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>
                  Forgot Password?
                </button>
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                width: '100%', height: '44px', marginTop: '0.5rem',
                background: loading ? '#0f5f56' : 'linear-gradient(to right, #14b8a6, #0f766e)',
                border: 'none', borderRadius: '0.75rem', color: 'white',
                fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '11px',
                letterSpacing: '0.08em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem',
                opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
              }}
            >
              {loading ? (
                <span style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                    {viewMode === 'forgot' ? 'mail_outline' : viewMode === 'reset' ? 'sync' : 'lock_open'}
                  </span>
                  {viewMode === 'signup' ? 'Create Account'
                    : viewMode === 'forgot' ? 'Send Reset Link'
                    : viewMode === 'reset' ? 'Reset Password'
                    : 'Authenticate'}
                </>
              )}
            </button>
          </form>

          {/* Footer Toggle */}
          <div style={{ padding: '1rem 1.5rem', backgroundColor: 'rgba(13,23,39,0.9)', borderTop: '1px solid rgba(30,41,59,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            {viewMode === 'login' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '10.5px', fontFamily: 'Inter, sans-serif' }}>
                <span style={{ color: '#94a3b8' }}>Need system access?</span>
                <button type="button"
                  onClick={() => { setViewMode('signup'); setError(null); setSuccessMsg(null); }}
                  style={{ background: 'none', border: 'none', color: '#14b8a6', fontWeight: 700, fontSize: '10.5px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                  Register Here
                </button>
              </div>
            )}
            {viewMode !== 'login' && (
              <button type="button"
                onClick={() => {
                  setViewMode('login'); setError(null); setSuccessMsg(null);
                  if (viewMode === 'reset') window.history.replaceState({}, document.title, window.location.pathname);
                }}
                style={{ background: 'none', border: 'none', color: '#14b8a6', fontWeight: 700, fontSize: '10.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_back</span>
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
