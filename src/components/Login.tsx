import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { UserRole } from '../types';

/* ─── color tokens (scoped to Login only) ─── */
const C = {
  bg: '#f3f2ee',
  surface: '#ffffff',
  panelGray: '#f3f4f6',
  primary: '#005a9c',
  primaryContainer: '#1a73c0',
  onPrimaryContainer: '#f2f6ff',
  secondary: '#0d9488',
  onSurface: '#141b2b',
  onSurfaceVariant: '#414751',
  outline: '#717782',
  outlineVariant: '#c1c7d3',
  surfaceContainerLow: '#f1f3ff',
  error: '#ba1a1a',
  errorBg: 'rgba(186,26,26,0.06)',
  successGreen: '#10b981',
  successBg: 'rgba(16,185,129,0.06)',
};

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

  /* ─── form submit (unchanged logic) ─── */
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

        let data: any;
        try {
          data = await res.json();
        } catch {
          throw new Error('Cannot reach server. Make sure the backend is running.');
        }

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

        let data: any;
        try {
          data = await res.json();
        } catch {
          throw new Error('Cannot reach server. Make sure the backend is running.');
        }

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

        let data: any;
        try {
          data = await res.json();
        } catch {
          throw new Error('Cannot reach server. Make sure the backend is running.');
        }

        if (!res.ok || data.status === false) {
          throw new Error(data.message || 'Password reset failed');
        }

        setSuccessMsg('Password updated successfully! You can now log in.');
        window.history.replaceState({}, document.title, window.location.pathname);
        setViewMode('login');
        setPassword('');
        setConfirmPassword('');
      } else {
        // Login flow
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

        let data: any;
        try {
          data = await res.json();
        } catch {
          throw new Error('Cannot reach server. Make sure the backend is running on port 5505.');
        }

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

  /* ─── helpers ─── */
  const headingTitle = () => {
    switch (viewMode) {
      case 'signup': return 'Create Account';
      case 'forgot': return 'Reset Password';
      case 'reset': return 'New Password';
      default: return 'Welcome Back';
    }
  };

  const headingDesc = () => {
    switch (viewMode) {
      case 'signup': return 'Request credentials for the scheduling system';
      case 'forgot': return 'Enter your email to receive a reset link';
      case 'reset': return 'Provide a new secure password';
      default: return 'Secure access for plant operations';
    }
  };

  const submitLabel = () => {
    if (loading) return null;
    switch (viewMode) {
      case 'signup': return 'CREATE ACCOUNT';
      case 'forgot': return 'SEND RESET LINK';
      case 'reset': return 'RESET PASSWORD';
      default: return 'SIGN IN';
    }
  };

  /* ─── shared input style ─── */
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '10px',
    border: `1.5px solid ${C.outlineVariant}`,
    outline: 'none',
    fontSize: '18px',
    lineHeight: '28px',
    fontFamily: 'Inter, sans-serif',
    color: C.onSurface,
    backgroundColor: C.surface,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box' as const,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '15px',
    lineHeight: '20px',
    fontWeight: 600,
    color: C.onSurfaceVariant,
    fontFamily: 'Inter, sans-serif',
  };

  /* ─── info rows for left panel ─── */
  const infoRows = [
    { icon: 'schedule', label: 'Active Shift', value: 'SHIFT A', accent: C.primaryContainer },
    { icon: 'group', label: 'Associates Indexed', value: '32', accent: C.primaryContainer },
    { icon: 'sync', label: 'System Sync', value: 'Live SQL DB', accent: C.secondary },
    { icon: 'location_on', label: 'Location', value: 'Kolkata Snacks, IN', accent: C.primaryContainer },
  ];

  return (
    <div
      style={{
        minHeight: '100dvh',
        width: '100vw',
        marginLeft: 'calc(50% - 50vw)',
        marginRight: 'calc(50% - 50vw)',
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        padding: 0,
        backgroundColor: C.bg,
        fontFamily: 'Inter, sans-serif',
        overflowX: 'hidden',
        boxSizing: 'border-box' as const,
      }}
    >
      {/* ── Main Container ── */}
      <main
        style={{
          position: 'relative',
          backgroundColor: C.surface,
          width: '100%',
          flex: '1 1 auto',
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
        }}
      >
        {/* ── Gradient Top Bar ── */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '4px',
            background: 'linear-gradient(90deg, #1A73C0 0%, #0d9488 100%)',
            zIndex: 10,
          }}
        />

        {/* ════════════════════════════════════════════ */}
        {/* LEFT PANEL                                  */}
        {/* ════════════════════════════════════════════ */}
        <section
          className="login-left-panel"
          style={{
            width: '50%',
            flexShrink: 0,
            backgroundColor: C.surface,
            padding: '48px 56px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* subtle dot grid */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.03,
              pointerEvents: 'none',
              backgroundImage: `radial-gradient(${C.primary} 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Branding */}
            <div style={{ marginBottom: '56px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  className="material-symbols-outlined"
                  style={{ color: C.secondary, fontSize: '36px', fontWeight: 700 }}
                >
                  factory
                </span>
                <span
                  style={{
                    fontSize: '32px',
                    lineHeight: '40px',
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    color: C.onSurface,
                  }}
                >
                  PEPSICO
                </span>
              </div>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: C.outline,
                  marginTop: '6px',
                  display: 'block',
                }}
              >
                OPERATIONAL CONTROLS
              </span>
            </div>

            {/* Status Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 16px',
                borderRadius: '9999px',
                border: `1px solid ${C.secondary}30`,
                backgroundColor: `${C.secondary}0d`,
                marginBottom: '36px',
              }}
            >
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: C.secondary,
                  animation: 'pulse 2s infinite',
                }}
              />
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: C.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                ZONE 4 · SMART GATEWAY
              </span>
            </div>

            {/* Headlines */}
            <div style={{ marginBottom: '32px' }}>
              <h1
                style={{
                  fontSize: '40px',
                  lineHeight: '48px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: C.onSurface,
                  margin: 0,
                }}
              >
                Smarter Scheduling.
              </h1>
              <h1
                style={{
                  fontSize: '40px',
                  lineHeight: '48px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: C.onSurface,
                  margin: 0,
                }}
              >
                Optimized Output.
              </h1>
              <p
                style={{
                  fontSize: '18px',
                  lineHeight: '28px',
                  color: C.onSurfaceVariant,
                  marginTop: '20px',
                }}
              >
                Automated rostering. Real-time visibility. Better compliance.
              </p>
            </div>

            {/* Info List Card */}
            <div
              style={{
                backgroundColor: C.surface,
                border: `1.5px solid ${C.outlineVariant}`,
                borderRadius: '16px',
                overflow: 'hidden',
                maxWidth: '520px',
              }}
            >
              {infoRows.map((row, i) => (
                <div
                  key={row.icon}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px',
                    borderBottom: i < infoRows.length - 1 ? `1px solid ${C.outlineVariant}` : 'none',
                    cursor: 'default',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = C.surfaceContainerLow)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: `${row.accent}14`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: row.accent,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                        {row.icon}
                      </span>
                    </div>
                    <span style={{ fontSize: '17px', lineHeight: '24px', fontWeight: 500, color: C.onSurfaceVariant }}>
                      {row.label}
                    </span>
                  </div>
                  <span style={{ fontSize: '17px', lineHeight: '24px', fontWeight: 700, color: row.accent }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <footer style={{ marginTop: '56px', position: 'relative', zIndex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                color: C.outline,
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <span>© 2026 PepsiCo Operations</span>
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: C.outlineVariant,
                }}
              />
              <span>v4.12.0-stable</span>
            </div>
          </footer>
        </section>

        {/* ════════════════════════════════════════════ */}
        {/* RIGHT PANEL — Auth Form                     */}
        {/* ════════════════════════════════════════════ */}
        <section
          style={{
            width: '50%',
            flexShrink: 0,
            backgroundColor: C.panelGray,
            padding: '56px 64px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              backgroundColor: C.surface,
              padding: '40px',
              borderRadius: '16px',
              border: `1.5px solid ${C.outlineVariant}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            {/* Card header */}
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <h2
                style={{
                  fontSize: '30px',
                  lineHeight: '38px',
                  fontWeight: 700,
                  color: C.onSurface,
                  margin: 0,
                }}
              >
                {headingTitle()}
              </h2>
              <p
                style={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  color: C.onSurfaceVariant,
                  marginTop: '8px',
                }}
              >
                {headingDesc()}
              </p>
            </div>

            {/* ── Alerts ── */}
            {error && (
              <div
                style={{
                  padding: '14px 18px',
                  backgroundColor: C.errorBg,
                  borderLeft: `4px solid ${C.error}`,
                  borderRadius: '10px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '15px',
                  fontWeight: 500,
                  color: C.error,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  padding: '14px 18px',
                  backgroundColor: C.successBg,
                  borderLeft: `4px solid ${C.successGreen}`,
                  borderRadius: '10px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '15px',
                  fontWeight: 500,
                  color: '#059669',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Name (signup only) */}
              {viewMode === 'signup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rajesh Sen"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.primaryContainer;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primaryContainer}20`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = C.outlineVariant;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              )}

              {/* Email (not shown on reset) */}
              {viewMode !== 'reset' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@pepsico.com"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.primaryContainer;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primaryContainer}20`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = C.outlineVariant;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              )}

              {/* Password (not shown on forgot) */}
              {viewMode !== 'forgot' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={labelStyle}>
                      {viewMode === 'reset' ? 'New Password' : 'Password'}
                    </label>
                    {viewMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => { setViewMode('forgot'); setError(null); setSuccessMsg(null); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: C.primaryContainer,
                          cursor: 'pointer',
                          padding: 0,
                          fontFamily: 'Inter, sans-serif',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ ...inputStyle, paddingRight: '52px' }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = C.primaryContainer;
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primaryContainer}20`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = C.outlineVariant;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: C.outline,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.onSurfaceVariant)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = C.outline)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password (reset only) */}
              {viewMode === 'reset' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{ ...inputStyle, paddingRight: '52px' }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = C.primaryContainer;
                        e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primaryContainer}20`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = C.outlineVariant;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: C.outline,
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = C.onSurfaceVariant)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = C.outline)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Role selector (signup only) */}
              {viewMode === 'signup' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={labelStyle}>Access Level</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    style={{
                      ...inputStyle,
                      cursor: 'pointer',
                      appearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23717782' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 18px center',
                      paddingRight: '44px',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.primaryContainer;
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${C.primaryContainer}20`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = C.outlineVariant;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <option value="Production Supervisor">Production Supervisor</option>
                    <option value="HR / Training Coordinator">HR / Training Coordinator</option>
                    <option value="Plant Admin">Plant Admin</option>
                    <option value="Plant Manager">Plant Manager</option>
                  </select>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: loading ? '#5a9fd4' : C.primaryContainer,
                  color: C.onPrimaryContainer,
                  fontSize: '16px',
                  lineHeight: '24px',
                  fontWeight: 700,
                  fontFamily: 'Inter, sans-serif',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.8 : 1,
                  transition: 'all 0.15s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px',
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = C.primary;
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = C.primaryContainer;
                }}
                onMouseDown={(e) => {
                  if (!loading) e.currentTarget.style.transform = 'scale(0.98)';
                }}
                onMouseUp={(e) => {
                  if (!loading) e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {loading ? (
                  <span
                    style={{
                      width: '22px',
                      height: '22px',
                      border: '2.5px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.7s linear infinite',
                    }}
                  />
                ) : (
                  submitLabel()
                )}
              </button>
            </form>

            {/* ── Footer links ── */}
            <div
              style={{
                marginTop: '36px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px',
              }}
            >
              {/* Encryption badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: C.outline }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>lock</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Secured with 256-bit encryption</span>
              </div>

              {/* Toggle login ↔ signup */}
              {viewMode === 'login' && (
                <p style={{ fontSize: '16px', color: C.onSurfaceVariant, margin: 0 }}>
                  Need system access?{' '}
                  <button
                    type="button"
                    onClick={() => { setViewMode('signup'); setError(null); setSuccessMsg(null); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: C.primaryContainer,
                      fontWeight: 500,
                      fontSize: '16px',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                      textUnderlineOffset: '4px',
                      fontFamily: 'Inter, sans-serif',
                      marginLeft: '4px',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = C.primaryContainer)}
                  >
                    Register here
                  </button>
                </p>
              )}

              {viewMode !== 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setError(null);
                    setSuccessMsg(null);
                    if (viewMode === 'reset')
                      window.history.replaceState({}, document.title, window.location.pathname);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: C.primaryContainer,
                    fontWeight: 600,
                    fontSize: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: 0,
                    fontFamily: 'Inter, sans-serif',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = C.primary)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = C.primaryContainer)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                  Back to Sign In
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ── keyframe animations ── */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }
        @media (max-width: 768px) {
          .login-left-panel {
            display: none !important;
          }
          main {
            flex-direction: column !important;
          }
          main > section:last-child {
            width: 100% !important;
            min-width: unset !important;
          }
        }
      `}</style>
    </div>
  );
};