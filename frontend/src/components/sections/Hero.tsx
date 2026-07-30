'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Layers, Smartphone, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import Silk from '@/components/reactbits/Silk';
import BlurText from '@/components/reactbits/text/BlurText';

const HeroCanvas = dynamic(
  () => import('@/components/three/HeroCanvas').then((m) => m.HeroCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
        Loading 3D Engine...
      </div>
    ),
  }
);

export function Hero() {
  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden pt-28 pb-16 px-6 md:px-20">
      {/* 1. Full-Screen Animated Silk Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Silk color="#3b82f6" speed={7} scale={1} noiseIntensity={1.5} rotation={0} />
      </div>

      {/* 2. Dark Transparent Overlay above Silk for Readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-[#07090e]/40 to-[#07090e] pointer-events-none" />

      {/* 3. Foreground Content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
        {/* Left Column: Title, Subtitle, CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" /> Next.js 15 & ARKit Integrated
          </div>

          <BlurText
            text="Visualize Products In Your Space Real Time"
            delay={120}
            animateBy="words"
            direction="top"
            className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight"
          />

          <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-lg">
            Bridge digital catalogues with physical spaces using true-to-scale 3D models, LiDAR plane detection, session persistence, and instant Django REST cloud sync.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/simulator"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-base rounded-full shadow-xl shadow-blue-500/25 transition-all hover:shadow-cyan-500/30"
              >
                <Smartphone className="w-5 h-5" /> Start 3D Room Experience
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 px-7 py-4 bg-white/10 text-white font-semibold text-base rounded-full border border-white/10 hover:bg-white/15 transition-all"
              >
                <LayoutGrid className="w-5 h-5" /> Explore Catalogue
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Column: 3D Furniture Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full h-[500px] rounded-3xl overflow-hidden bg-slate-900/60 border border-white/10 shadow-2xl backdrop-blur-sm"
        >
          <HeroCanvas />

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <div className="text-blue-400 font-bold text-sm">1.0x Scale</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Ground Normalized</div>
            </div>
            <div className="bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
              <div className="text-cyan-400 font-bold text-sm">60 FPS</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">WebGL Orbit Engine</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
