'use client';

import { useEffect, useState } from 'react';
import { ApiService } from '@/services/api';
import { Product } from '@/types';
import { useWishlist } from '@/hooks/useWishlist';
import { ProductCard } from '@/components/product/ProductCard';
import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
  const { wishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      ApiService.getWishlist(),
      ApiService.getProducts(),
    ]).then(([wishlistItems, allProducts]) => {
      if (wishlistItems && wishlistItems.length > 0) {
        setProducts(wishlistItems.map((item) => item.product));
      } else {
        const filtered = allProducts.filter((p) => wishlist.includes(p.product_id));
        setProducts(filtered);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [wishlist]);

  return (
    <div className="px-6 md:px-20 max-w-7xl mx-auto space-y-8 pt-28 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-white mb-2">My Saved Wishlist</h1>
        <p className="text-slate-400 text-sm">Products you saved for future WebAR visualization sessions.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
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
        <div className="glass-card p-16 rounded-3xl text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Your Wishlist is Empty</h3>
          <p className="text-xs text-slate-400">
            Browse the product catalog and click the heart icon on any item to save it to your personal wishlist.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-full transition-all"
          >
            Explore Product Catalog
          </Link>
        </div>
      )}
    </div>
  );
}

