import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('ap_voters_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('ap_voters_token') || null);
  const [selectedConstituency, setSelectedConstituency] = useState(null);
  const [loading, setLoading] = useState(!user && !!token);

  const refreshUserSelection = async () => {
    try {
      const res = await api.getUserConstituencySelection();
      if (res.success && res.data) {
        setSelectedConstituency({
          id: res.data.mptc_village_constituency_id,
          name_en: res.data.mptc_name_en,
          name_te: res.data.mptc_name_te,
          assembly_name_en: res.data.assembly_name_en,
          assembly_name_te: res.data.assembly_name_te,
          district_name_en: res.data.district_name_en,
          district_name_te: res.data.district_name_te
        });
      }
    } catch (e) {
      // not critical if fails or not set yet
    }
  };

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          setUser(res.user);
          localStorage.setItem('ap_voters_user', JSON.stringify(res.user));
          await refreshUserSelection();
        } else {
          logout();
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
        logout();
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success) {
      localStorage.setItem('ap_voters_token', res.token);
      localStorage.setItem('ap_voters_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      await refreshUserSelection();
    }
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success) {
      localStorage.setItem('ap_voters_token', res.token);
      localStorage.setItem('ap_voters_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      await refreshUserSelection();
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('ap_voters_token');
    localStorage.removeItem('ap_voters_user');
    setToken(null);
    setUser(null);
    setSelectedConstituency(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        selectedConstituency,
        setSelectedConstituency,
        refreshUserSelection,
        loading,
        login,
        register,
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
