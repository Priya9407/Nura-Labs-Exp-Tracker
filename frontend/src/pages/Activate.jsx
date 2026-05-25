import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as usersAPI from '../api/users';

function Activate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or expired invitation link');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await usersAPI.activateAccount(token, password);
      setSuccess(true);
    } catch (err) {
      if (err.code === 'INVALID_TOKEN') {
        setError('Invalid or expired invitation link');
      } else {
        setError(err.message || 'Activation failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-card glass-card" style={{ textAlign: 'center' }}>
          <div className="login-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="#DDE6ED"/>
              <path d="M24 12C24 12 14 18 14 28C14 32.4183 17.5817 36 22 36H26C30.4183 36 34 32.4183 34 28C34 18 24 12 24 12Z" stroke="#2F3D46" strokeWidth="2" fill="none"/>
              <circle cx="24" cy="26" r="4" fill="#2F3D46"/>
              <path d="M20 20H28" stroke="#2F3D46" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h1>Activate Account</h1>
          </div>
          <div className="alert alert-error" style={{ justifyContent: 'center' }}>
            Invalid or expired invitation link
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 'var(--spacing-md) 0' }}>
            Please contact your administrator for a new invitation.
          </p>
          <a href="/login" className="btn btn-secondary" style={{ marginTop: 'var(--spacing-md)' }}>
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="login-container">
        <div className="login-card glass-card" style={{ textAlign: 'center' }}>
          <div className="login-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="12" fill="#DDE6ED"/>
              <path d="M24 12C24 12 14 18 14 28C14 32.4183 17.5817 36 22 36H26C30.4183 36 34 32.4183 34 28C34 18 24 12 24 12Z" stroke="#2F3D46" strokeWidth="2" fill="none"/>
              <circle cx="24" cy="26" r="4" fill="#2F3D46"/>
              <path d="M20 20H28" stroke="#2F3D46" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h1>Account Activated!</h1>
          </div>
          <div className="alert alert-success" style={{ justifyContent: 'center' }}>
            Account activated successfully!
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 'var(--spacing-md) 0' }}>
            You can now sign in with your email and password.
          </p>
          <a href="/login" className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }}>
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card glass-card">
        <div className="login-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="12" fill="#DDE6ED"/>
            <path d="M24 12C24 12 14 18 14 28C14 32.4183 17.5817 36 22 36H26C30.4183 36 34 32.4183 34 28C34 18 24 12 24 12Z" stroke="#2F3D46" strokeWidth="2" fill="none"/>
            <circle cx="24" cy="26" r="4" fill="#2F3D46"/>
            <path d="M20 20H28" stroke="#2F3D46" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h1>Activate Account</h1>
          <p>Set your password to complete registration</p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="form-hint">
              Must be at least 8 characters with uppercase, lowercase, and numbers
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-input"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-md)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                Activating...
              </>
            ) : (
              'Activate Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Activate;
