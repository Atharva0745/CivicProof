import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setToken } from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('civicproof_token');
      if (token) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            setToken(null);
          }
        } catch (err) {
          console.warn('[Auth] Session check failed, clearing token.');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      setAuthModalOpen(false);
    }
    return res;
  };

  const register = async (name, email, password, role = 'citizen') => {
    const res = await api.register({ name, email, password, role });
    if (res.success && res.token) {
      setToken(res.token);
      setUser(res.user);
      setAuthModalOpen(false);
    }
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Proceed even if network fails
    }
    setToken(null);
    setUser(null);
  };

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
