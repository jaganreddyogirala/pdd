'use client';

import { useEffect, useState, useCallback } from 'react';
import { ApiService, GetProductsParams } from '@/services/api';
import { Product } from '@/types';
import { useAppStore } from '@/store/useAppStore';

export function useProducts(params?: GetProductsParams) {
  const { products, setProducts } = useAppStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const search = params?.search;
  const surface_type = params?.surface_type;
  const category = params?.category;
  const featured = params?.featured;
  const ordering = params?.ordering;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.getProducts({ search, surface_type, category, featured, ordering });
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products from API:', err);
      setError('Unable to connect to the backend. Please ensure Django is running.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, surface_type, category, featured, ordering, setProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
}
