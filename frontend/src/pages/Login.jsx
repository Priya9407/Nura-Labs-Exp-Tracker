import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as usersAPI from '../api/users';

// SVG Icons (inline, no external dependency)
const EyeIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const MailIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const LockIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const ArrowRightIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const ArrowLeftIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const FlaskIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 3L7 17a2 2 0 002 2h6a2 2 0 002-2L15 3" />
    <path d="M6 3h12" />
    <path d="M12 14v4" />
  </svg>
);

const KeyIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const CheckCircleIcon = ({ style }) => (
  <svg style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, authError, clearAuthError } = useAuth();

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
    setIsVisible(true);
    
    // Clear any stale context auth errors when unmounting
    return () => {
      if (clearAuthError) clearAuthError();
    };
  }, [isAuthenticated, navigate, clearAuthError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      let errMsg = 'Login failed. Please check your credentials.';
      if (err?.message) {
        errMsg = err.message;
      } else if (err?.data?.error?.message) {
        errMsg = err.data.error.message;
      } else if (typeof err === 'string') {
        errMsg = err;
      }
      setError(errMsg);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotEmail.trim()) {
      setForgotError('Email is required');
      return;
    }

    setForgotLoading(true);
    try {
      const response = await usersAPI.forgotPassword(forgotEmail.trim());
      setForgotSuccess(response.message || 'A new password has been sent to your email.');
      setForgotEmail('');
    } catch (err) {
      setForgotError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const switchToForgot = () => {
    setShowForgotPassword(true);
    setForgotEmail(email);
    setError('');
    setForgotError('');
    setForgotSuccess('');
  };

  const switchToLogin = () => {
    setShowForgotPassword(false);
    setEmail(forgotEmail);
    setError('');
    setForgotError('');
    setForgotSuccess('');
  };

  // Styles
  const containerStyles = {
    minHeight: '100vh',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-page)',
    padding: '16px',
    position: 'relative',
    overflow: 'auto',
    boxSizing: 'border-box',
  };

  const glowStyles = {
    position: 'fixed',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    pointerEvents: 'none',
    opacity: 0.12,
    filter: 'blur(50px)',
  };

  const cardStyles = {
    width: '100%',
    maxWidth: '380px',
    background: 'var(--bg-surface)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-modal)',
    padding: '32px',
    position: 'relative',
    zIndex: 1,
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
    transition: 'opacity 0.6s ease, transform 0.6s ease',
  };

  const logoContainerStyles = {
    textAlign: 'center',
    marginBottom: '24px',
  };

  const logoStyles = {
    width: '48px',
    height: '48px',
    background: 'var(--accent-coral)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
    boxShadow: '0 6px 20px rgba(232, 89, 60, 0.30)',
  };

  const titleStyles = {
    fontFamily: "'Inter', sans-serif",
    fontSize: '28px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '6px',
    marginTop: 0,
  };

  const subtitleStyles = {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  };

  const formStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  const fieldStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const labelStyles = {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
  };

  const inputWrapStyles = {
    position: 'relative',
  };

  const inputIconStyles = {
    position: 'absolute',
    left: '13px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  };

  const inputStyles = {
    width: '100%',
    padding: '12px 14px 12px 44px',
    background: 'var(--bg-surface-alt)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    fontFamily: "'Inter', sans-serif",
    fontSize: '14px',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const eyeBtnStyles = {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  };

  const errorStyles = {
    background: 'var(--error-light)',
    border: '1px solid var(--error)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '12px',
    color: 'var(--error)',
  };

  const successStyles = {
    background: 'var(--success-light)',
    border: '1px solid var(--success)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '12px',
    color: 'var(--success)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const buttonStyles = {
    width: '100%',
    padding: '12px 20px',
    background: 'var(--accent-coral)',
    border: 'none',
    borderRadius: '12px',
    fontFamily: "'Inter', sans-serif",
    fontSize: '14px',
    fontWeight: 700,
    color: 'white',
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '8px',
    boxShadow: '0 4px 20px rgba(232, 89, 60, 0.30)',
    transition: 'all 0.2s',
    opacity: loading ? 0.7 : 1,
  };

  const secondaryButtonStyles = {
    width: '100%',
    padding: '12px 20px',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    fontFamily: "'Inter', sans-serif",
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  };

  const footerStyles = {
    marginTop: '24px',
    textAlign: 'center',
  };

  const footerTextStyles = {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  };

  const linkStyles = {
    color: 'var(--accent-coral)',
    fontWeight: 500,
    textDecoration: 'none',
    cursor: 'pointer',
  };

  const forgotLinkStyles = {
    fontSize: '13px',
    color: 'var(--accent-coral)',
    textDecoration: 'none',
    cursor: 'pointer',
    fontWeight: 500,
    textAlign: 'right',
    marginTop: '-8px',
  };

  const dividerStyles = {
    marginTop: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  };

  const dividerLineStyles = {
    flex: 1,
    height: '1px',
    background: 'var(--border)',
  };

  const dividerTextStyles = {
    fontSize: '11px',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--text-muted)',
  };

  const backButtonStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '16px',
    padding: '4px 0',
  };

  const infoTextStyles = {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    marginBottom: '20px',
  };

  return (
    <div style={containerStyles}>
      {/* Decorative glows */}
      <div style={{ ...glowStyles, top: '-100px', right: '-100px', background: 'var(--accent-coral)' }} />
      <div style={{ ...glowStyles, bottom: '-100px', left: '-100px', background: 'var(--accent-teal)' }} />

      <div style={cardStyles}>
        {!showForgotPassword ? (
          // Login Form
          <>
            {/* Logo */}
            <div style={logoContainerStyles}>
              <div style={logoStyles}>
                <FlaskIcon style={{ width: '26px', height: '26px', color: 'white' }} />
              </div>
              <h1 style={titleStyles}>Welcome back</h1>
              <p style={subtitleStyles}>Sign in to continue to Nura Labs</p>
            </div>

            {/* Error Message */}
            {(error || authError) && (
              <div style={{
                background: 'var(--error-light)',
                color: 'var(--error)',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error || authError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={formStyles}>
              {/* Email Field */}
              <div style={fieldStyles}>
                <label style={labelStyles}>Email address</label>
                <div style={inputWrapStyles}>
                  <div style={inputIconStyles}>
                    <MailIcon style={{ width: '18px', height: '18px' }} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyles}
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div style={fieldStyles}>
                <label style={labelStyles}>Password</label>
                <div style={inputWrapStyles}>
                  <div style={inputIconStyles}>
                    <LockIcon style={{ width: '18px', height: '18px' }} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ ...inputStyles, paddingRight: '44px' }}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={eyeBtnStyles}
                  >
                    {showPassword ? (
                      <EyeOffIcon style={{ width: '18px', height: '18px' }} />
                    ) : (
                      <EyeIcon style={{ width: '18px', height: '18px' }} />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div style={forgotLinkStyles}>
                <span onClick={switchToForgot} style={{ cursor: 'pointer' }}>
                  Forgot password?
                </span>
              </div>



              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={buttonStyles}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRightIcon style={{ width: '16px', height: '16px' }} />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div style={footerStyles}>
              <p style={footerTextStyles}>
                Need an account?{' '}
                <span style={linkStyles}>Contact your administrator</span>
              </p>
            </div>

            {/* Divider */}
            <div style={dividerStyles}>
              <div style={dividerLineStyles} />
              <span style={dividerTextStyles}>Secure Login</span>
              <div style={dividerLineStyles} />
            </div>
          </>
        ) : (
          // Forgot Password Form
          <>
            {/* Back Button */}
            <button style={backButtonStyles} onClick={switchToLogin}>
              <ArrowLeftIcon style={{ width: '18px', height: '18px' }} />
              Back to login
            </button>

            {/* Logo */}
            <div style={logoContainerStyles}>
              <div style={{ ...logoStyles, background: 'var(--accent-teal)' }}>
                <KeyIcon style={{ width: '26px', height: '26px', color: 'white' }} />
              </div>
              <h1 style={titleStyles}>Reset Password</h1>
              <p style={subtitleStyles}>We'll send a new password to your email</p>
            </div>

            {/* Info Text */}
            <p style={infoTextStyles}>
              Enter your email address and we'll send you a new temporary password. You can change it after logging in.
            </p>

            {/* Form */}
            <form onSubmit={handleForgotPassword} style={formStyles}>
              {/* Email Field */}
              <div style={fieldStyles}>
                <label style={labelStyles}>Email address</label>
                <div style={inputWrapStyles}>
                  <div style={inputIconStyles}>
                    <MailIcon style={{ width: '18px', height: '18px' }} />
                  </div>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    style={inputStyles}
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Error Message */}
              {forgotError && (
                <div style={errorStyles}>
                  {forgotError}
                </div>
              )}

              {/* Success Message */}
              {forgotSuccess && (
                <div style={successStyles}>
                  <CheckCircleIcon style={{ width: '16px', height: '16px' }} />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={forgotLoading}
                style={{ ...buttonStyles, background: 'var(--accent-teal)', boxShadow: '0 4px 20px rgba(63, 191, 160, 0.30)' }}
              >
                {forgotLoading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send New Password</span>
                    <ArrowRightIcon style={{ width: '16px', height: '16px' }} />
                  </>
                )}
              </button>

              {/* Back to Login Button */}
              <button
                type="button"
                onClick={switchToLogin}
                style={secondaryButtonStyles}
              >
                <ArrowLeftIcon style={{ width: '16px', height: '16px' }} />
                <span>Back to Login</span>
              </button>
            </form>

            {/* Divider */}
            <div style={dividerStyles}>
              <div style={dividerLineStyles} />
              <span style={dividerTextStyles}>Secure Reset</span>
              <div style={dividerLineStyles} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
