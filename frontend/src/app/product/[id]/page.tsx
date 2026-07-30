'use client';

import { useEffect, useState, use } from 'react';
import dynamic from 'next/dynamic';
import { ApiService } from '@/services/api';
import { Product } from '@/types';
import { Sparkles, ArrowLeft, Download, QrCode, Smartphone, X } from 'lucide-react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

const HeroCanvas = dynamic(
  () => import('@/components/three/HeroCanvas').then((m) => m.HeroCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
        Loading 3D Viewport...
      </div>
    ),
  }
);

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [arUrl, setArUrl] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    ApiService.getProductDetails(id)
      .then((prod) => { setProduct(prod); setLoading(false); })
      .catch((err) => { console.error('Failed to load product:', err); setLoading(false); });

    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/ar/${id}`;
      console.log("AR URL:", url);
      alert(url);   // Temporary for debugging
      setArUrl(url);
    }
  }, [id]);

  if (loading || !product) {
    return <div className="p-28 text-center text-slate-400 font-semibold animate-pulse">Loading product details from Django REST API...</div>;
  }

  const modelUrl = product.model_display_url || product.model_url;
  const usdzUrl = product.usdz_display_url || product.usdz_url;

  return (
    <div className="px-6 md:px-20 max-w-7xl mx-auto pt-28 pb-12 space-y-8">
      <Link href="/catalog" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* 3D Inspector Viewport */}
        <div className="w-full h-[460px] rounded-3xl overflow-hidden bg-slate-900/60 border border-white/10 shadow-2xl relative">
          <HeroCanvas modelUrl={modelUrl} />
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-cyan-400 uppercase border border-white/10">
            360° Interactive 3D Model
          </div>
        </div>

        {/* Product Details & Actions */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-2">{product.name}</h1>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase border border-cyan-500/20">
                {product.surface_type || 'floor'} Surface Placement
              </div>
              {product.price ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                  ${product.price.toFixed(2)}
                </div>
              ) : null}
            </div>
          </div>

          <p className="text-slate-400 text-sm leading-relaxed">{product.description}</p>

          <div className="glass-card p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Specifications</h3>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
              <div><span className="text-slate-500">Material:</span> <span className="text-white font-medium">{product.material || 'N/A'}</span></div>
              <div><span className="text-slate-500">Dimensions:</span> <span className="text-white font-medium">{product.dimensions || 'N/A'}</span></div>
              <div><span className="text-slate-500">Weight:</span> <span className="text-white font-medium">{product.weight || 'N/A'}</span></div>
              <div><span className="text-slate-500">Assembly:</span> <span className="text-white font-medium">{product.assembly || 'N/A'}</span></div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/simulator"
              className="flex-1 inline-flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm rounded-full shadow-lg shadow-blue-500/25 transition-all"
            >
              <Sparkles className="w-4 h-4" /> Launch WebAR Simulator
            </Link>

            <button
              onClick={() => setShowQrModal(true)}
              className="px-5 py-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-xs rounded-full shadow-md flex items-center gap-2 transition-all"
              title="Scan QR code on mobile phone camera to place in room"
            >
              <QrCode className="w-4 h-4" /> Mobile AR (QR)
            </button>

            {usdzUrl ? (
              <a
                href={usdzUrl}
                download
                className="px-5 py-4 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-full border border-white/10 transition-all flex items-center gap-2"
                title="Download USDZ Model for iOS RealityKit"
              >
                <Download className="w-4 h-4 text-cyan-400" /> USDZ Model
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile AR QR Code Overlay Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#07090e] border border-white/15 rounded-3xl p-8 max-w-sm w-full text-center space-y-5 relative shadow-2xl">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center border border-cyan-500/20 mb-2">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Scan for Mobile AR</h3>
              <p className="text-xs text-slate-400">Point your phone camera at this QR code to view {product.name} in your room.</p>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner mx-auto">
              <QRCodeSVG value={arUrl} size={180} fgColor="#07090e" bgColor="#ffffff" level="H" />
            </div>

            <div className="text-[11px] text-slate-400 space-y-1 font-mono bg-white/5 p-3 rounded-xl border border-white/5">
              <div>URL: {arUrl}</div>
              <div className="text-cyan-400 font-sans text-[10px]">Android ARCore / iOS Quick Look Enabled</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


