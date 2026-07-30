'use client';

import { useEffect, useState, useCallback } from 'react';
import { ApiService, setAuthToken } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';

export function useAuth() {
  const { user, token, setUser, logout } = useAppStore();
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async () => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('arv_auth_token') : null;
    if (storedToken) {
      setAuthToken(storedToken);
      try {
        const userData = await ApiService.getProfile();
        setUser(userData, storedToken);
      } catch (err) {
        console.warn('Session verification failed:', err);
        setAuthToken(null);
        setUser(null, null);
      }
    }
    setLoading(false);
  }, [setUser]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    token,
    isAuthenticated: !!user && !!token,
    loading,
    logout,
    refreshUser: checkAuth,
  };
}
