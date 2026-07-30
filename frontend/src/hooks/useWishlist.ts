'use client';

import { useEffect, useState, useCallback } from 'react';
import { ApiService } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';

export function useWishlist() {
  const { wishlist, setWishlist, toggleWishlist: storeToggleWishlist } = useAppStore();
  const [loading, setLoading] = useState<boolean>(true);

  const fetchWishlist = useCallback(async () => {
    setLoading(true);
    try {
      const items = await ApiService.getWishlist();
      const ids = items.map((item) => item.product.product_id);
      setWishlist(ids);
    } catch (e) {
      console.warn('Failed to load wishlist from server:', e);
    } finally {
      setLoading(false);
    }
  }, [setWishlist]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  return {
    wishlist,
    loading,
    toggleWishlist: storeToggleWishlist,
    refetch: fetchWishlist,
  };
}
