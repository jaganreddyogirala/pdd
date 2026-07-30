'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ApiService } from '@/services/api';
import { Product } from '@/types';

const RoomSimulatorCanvas = dynamic(
  () => import('@/components/three/RoomSimulatorCanvas').then((m) => m.RoomSimulatorCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[650px] rounded-3xl glass-card border border-white/10 flex items-center justify-center text-slate-400 text-xs">
        Loading 3D WebGL Canvas...
      </div>
    ),
  }
);

export default function SimulatorPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    ApiService.getProducts()
      .then((res) => setProducts(res))
      .catch((err) => console.error('Failed to load products:', err));
  }, []);

  return (
    <div className="px-6 md:px-20 max-w-7xl mx-auto space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white mb-2">WebAR Spatial Simulator</h1>
        <p className="text-slate-400 text-sm">Place, scale, and rotate true 3D models in an interactive WebGL spatial canvas.</p>
      </div>

      <RoomSimulatorCanvas products={products} />
    </div>
  );
}
