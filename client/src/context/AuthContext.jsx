import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const defaultCompanyUser = {
  _id: 'usr-company-001',
  name: 'Richard Feynman',
  email: 'richardfeynman@gmail.com',
  role: 'company',
  companyName: 'Acme Technologies',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  accountExecutive: {
    name: 'Esther Howard',
    role: 'Account Executive - AE',
    email: 'esther.howard@hirevoxa.internal',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80'
  },
  joinedDate: '27 April, 2024'
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hirevoxa_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultCompanyUser;
      }
    }
    return defaultCompanyUser;
  });

  const [token, setToken] = useState(() => localStorage.getItem('hirevoxa_token') || 'demo_token_richard_feynman');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If we have a custom token, verify with backend
    async function verifyUser() {
      const storedToken = localStorage.getItem('hirevoxa_token');
      if (storedToken && storedToken !== 'demo_token_richard_feynman') {
        try {
          const res = await api.getMe();
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('hirevoxa_user', JSON.stringify(res.user));
          }
        } catch {
          // Token invalid
          localStorage.removeItem('hirevoxa_token');
          localStorage.removeItem('hirevoxa_user');
          setUser(defaultCompanyUser);
          setToken('demo_token_richard_feynman');
        }
      }
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
        return { success: true };
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
        return { success: true };
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
        return { success: true };
      }
    } catch (err) {
      console.warn('Backend demo-login failed, falling back to local demo profile:', err);
      // Fallback
      if (role === 'candidate') {
        const candUser = {
          _id: 'usr-candidate-001',
          name: 'Rodrigo Feynman Silva',
          email: 'rodrigo@hirevoxa-latam.dev',
          role: 'candidate',
          companyName: '',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          joinedDate: '10 January, 2024'
        };
        setUser(candUser);
        setToken('demo_token_candidate');
        localStorage.setItem('hirevoxa_user', JSON.stringify(candUser));
      } else {
        setUser(defaultCompanyUser);
        setToken('demo_token_richard_feynman');
        localStorage.setItem('hirevoxa_user', JSON.stringify(defaultCompanyUser));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
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
        isAuthenticated: !!user,
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
