import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hirevoxa_user');
    const savedToken = localStorage.getItem('hirevoxa_token');
    if (saved && savedToken) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('hirevoxa_token') || null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(() => !!localStorage.getItem('hirevoxa_token'));

  useEffect(() => {
    // If a token exists, verify with backend session
    async function verifyUser() {
      const storedToken = localStorage.getItem('hirevoxa_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('hirevoxa_user', JSON.stringify(res.user));
          } else {
            throw new Error('Invalid user session');
          }
        } catch {
          // Session expired or invalid
          localStorage.removeItem('hirevoxa_token');
          localStorage.removeItem('hirevoxa_user');
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setInitialLoading(false);
    }
    verifyUser();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await api.login(credentials);
      if (res?.token && res?.user) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('hirevoxa_token', res.token);
        localStorage.setItem('hirevoxa_user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Invalid response from server' };
    } catch (err) {
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await api.register(userData);
      if (res?.token && res?.user) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('hirevoxa_token', res.token);
        localStorage.setItem('hirevoxa_user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err) {
      return { success: false, error: err.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role = 'company') => {
    setLoading(true);
    try {
      const res = await api.demoLogin(role);
      if (res?.token && res?.user) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('hirevoxa_token', res.token);
        localStorage.setItem('hirevoxa_user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Demo sign-in unavailable' };
    } catch (err) {
      console.warn('Backend demo-login failed:', err.message);
      return { success: false, error: err.message || 'Demo sign-in unavailable' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('hirevoxa_token');
    localStorage.removeItem('hirevoxa_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        initialLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        demoLogin,
        logout
      }}
    >
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
