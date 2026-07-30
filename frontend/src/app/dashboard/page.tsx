'use client';

import { useEffect, useState } from 'react';
import { ApiService, formatAssetUrl } from '@/services/api';
import { Capture, Product } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';
import { Camera, Image as ImageIcon, Heart } from 'lucide-react';

export default function DashboardPage() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      ApiService.getCaptures(),
      ApiService.getWishlist(),
    ]).then(([capturesData, wishlistData]) => {
      setCaptures(capturesData);
      setSavedProducts(wishlistData.map((item) => item.product));
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  return (
    <div className="px-6 md:px-20 max-w-7xl mx-auto space-y-12 pt-28 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-white mb-2">My AR Dashboard & Gallery</h1>
        <p className="text-slate-400 text-sm">Saved session captures and wishlisted products synchronized with your Django account.</p>
      </div>

      {/* Snapshots Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Camera className="w-5 h-5 text-cyan-400" /> Saved Room Snapshots ({captures.length})
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 bg-slate-900/40 rounded-2xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : captures.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {captures.map((cap) => (
              <div key={cap.capture_id} className="glass-card rounded-2xl overflow-hidden">
                <img
                  src={formatAssetUrl(cap.captured_image_url || cap.captured_image)}
                  alt="AR Snapshot"
                  className="w-full h-52 object-cover"
                />
                <div className="p-4 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-blue-400" /> {cap.session || 'AR Session'}</span>
                  <span>{new Date(cap.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 rounded-3xl text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 mx-auto flex items-center justify-center">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Snapshots Saved Yet</h3>
            <p className="text-xs text-slate-400">
              Launch the WebAR Room Simulator or iOS app to place 3D furniture models and capture room snapshots into your gallery.
            </p>
          </div>
        )}
      </div>

      {/* Saved Products Section */}
      {savedProducts.length > 0 && (
        <div className="space-y-6 pt-4 border-t border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400" /> Saved Products ({savedProducts.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProducts.map((prod) => (
              <ProductCard key={prod.product_id} product={prod} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

