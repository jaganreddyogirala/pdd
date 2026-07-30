'use client';

import { useEffect, useState, useCallback } from 'react';
import { ApiService } from '@/services/api';
import { Product } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';
import { useAppStore } from '@/store/useAppStore';
import { Search, ArrowUpDown } from 'lucide-react';

export default function CatalogPage() {
  const { searchQuery, setSearchQuery, categoryFilter, setCategoryFilter, sortBy, setSortBy } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCatalogProducts = useCallback(async () => {
    setLoading(true);
    let orderingParam = undefined;
    if (sortBy === 'name') orderingParam = 'name';
    else if (sortBy === 'newest') orderingParam = '-created_at';
    else if (sortBy === 'price_low') orderingParam = 'price';
    else if (sortBy === 'price_high') orderingParam = '-price';

    try {
      const res = await ApiService.getProducts({
        search: searchQuery || undefined,
        surface_type: categoryFilter !== 'all' ? categoryFilter : undefined,
        ordering: orderingParam,
      });
      setProducts(res);
    } catch (e) {
      console.error('Failed to load catalog products:', e);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCatalogProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchCatalogProducts]);

  return (
    <div className="px-6 md:px-20 max-w-7xl mx-auto space-y-8 pt-28 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Product Catalogue</h1>
        <p className="text-slate-400 text-sm">Select furniture, lighting, or decor items to preview in 3D and launch in AR.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-white/10">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name, material, keyword..."
            className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Surface Category Filters */}
          <div className="flex items-center gap-2">
            {(['all', 'floor', 'tabletop'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold capitalize transition-all ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {cat === 'all' ? 'All Items' : cat}
              </button>
            ))}
          </div>

          {/* Sorting Control */}
          <div className="relative inline-flex items-center gap-1.5 bg-white/5 px-3 py-2 rounded-full border border-white/10 text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer pr-1"
            >
              <option value="featured" className="bg-slate-900 text-white">Featured</option>
              <option value="newest" className="bg-slate-900 text-white">Newest First</option>
              <option value="name" className="bg-slate-900 text-white">Alphabetical (A-Z)</option>
              <option value="price_low" className="bg-slate-900 text-white">Price: Low to High</option>
              <option value="price_high" className="bg-slate-900 text-white">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-80 bg-slate-900/40 rounded-2xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((prod) => (
            <ProductCard key={prod.product_id} product={prod} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500">
          No products match your search filter.
        </div>
      )}
    </div>
  );
}

