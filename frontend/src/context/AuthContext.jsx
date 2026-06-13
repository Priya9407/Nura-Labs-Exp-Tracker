import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import * as authAPI from '../api/auth';
import { isAuthError } from '../api/client';

const AuthContext = createContext(null);

// Session refresh interval (5 minutes)
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000;

export function AuthProvider({ children, initialUser = null }) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(!!initialUser);
  const [authError, setAuthError] = useState(null);

  // Use ref for interval to avoid dependency issues
  const intervalRef = useRef(null);
  const mountedRef = useRef(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setAuthError(null);
    
    try {
      const response = await authAPI.login(email, password);
      setUser(response.user);
      setIsAuthReady(true);
      return response;
    } catch (error) {
      setAuthError(error?.message || error?.data?.error?.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authAPI.logout();
      setUser(null);
      setIsAuthReady(false);
      setAuthError(null);
    } catch (err) {
      console.error('Logout failed:', err);
      setUser(null);
      setIsAuthReady(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authAPI.checkAuth();
      setUser(userData);
      setAuthError(null);
      return userData;
    } catch (error) {
      if (isAuthError(error) || error.status === 401) {
        setUser(null);
        setAuthError('Session expired. Please login again.');
      } else {
        setAuthError('Connection issue. Retrying...');
      }
      return null;
    }
  }, []);

  // Initial auth check - runs once on mount
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const checkAuth = async () => {
      try {
        const userData = await authAPI.checkAuth();
        setUser(userData);
      } catch {
        setUser(null);
      } finally {
        setIsAuthReady(true);
      }
    };

    checkAuth();
  }, []);

  // Session refresh interval - only when user exists
  useEffect(() => {
    if (!user?.uuid) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Set up interval for periodic validation
    intervalRef.current = setInterval(() => {
      refreshUser();
    }, SESSION_REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user?.uuid]); // Only depend on user UUID, not the whole user object

  // Handle visibility change (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.uuid) {
        refreshUser();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.uuid, refreshUser]);

  const isAdmin = user?.role === 'ADMIN';
  const isAuthenticated = !!user && isAuthReady;
  
  const clearAuthError = useCallback(() => setAuthError(null), []);

  const value = {
    user,
    setUser,
    isAuthenticated,
    isAuthReady,
    isAdmin,
    login,
    logout,
    refreshUser,
    loading,
    authError,
    clearAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
