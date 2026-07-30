'use client';

import Link from 'next/link';
import { Layers, Box, Cpu, ShieldCheck, Sparkles, Smartphone, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AboutPage() {
  const features = [
    {
      icon: Box,
      title: 'True-to-Scale 3D Visualisation',
      description:
        'Every 3D asset is normalized using bounding box volume parsing to guarantee true physical scale when rendered in WebGL or AR environments.',
    },
    {
      icon: Cpu,
      title: 'WebAR & LiDAR Surface Anchor Engine',
      description:
        'Native WebGL plane projection and raycasting mimic Apple ARKit LiDAR surface detection, accurately anchoring furniture onto floors and wall surfaces.',
    },
    {
      icon: ShieldCheck,
      title: 'Django REST Cloud Persistence',
      description:
        'Captured spatial sessions, user preferences, and high-resolution JPEG room snapshots synchronize instantly with SQLite database backends.',
    },
    {
      icon: Layers,
      title: 'Next.js 15 & React 18 Architecture',
      description:
        'Built with ultra-fast App Router static generation, server component optimization, Lenis smooth scrolling, and custom WebGL shaders.',
    },
  ];

  return (
    <div className="px-6 md:px-20 max-w-7xl mx-auto pt-28 pb-16 space-y-16">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> Next-Generation Spatial E-Commerce
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Redefining How You Experience Furniture
        </h1>

        <p className="text-slate-400 text-base md:text-lg leading-relaxed">
          ARV (AR Visualisation) bridges the gap between digital catalogues and physical living spaces. By integrating modern WebGL graphics, Apple ARKit compatibility, and cloud session sync, we empower users to preview products in real time before making purchase decisions.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -6 }}
              className="glass-card p-8 rounded-3xl space-y-4 relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-cyan-400/20 border border-blue-500/30 flex items-center justify-center text-cyan-400">
                <Icon className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-bold text-white">{feat.title}</h3>

              <p className="text-slate-400 text-sm leading-relaxed">{feat.description}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Call to Action Banner */}
      <div className="glass-card p-10 md:p-14 rounded-3xl text-center space-y-6 relative overflow-hidden bg-gradient-to-r from-blue-900/30 via-slate-900/60 to-purple-900/30 border border-white/10">
        <h2 className="text-2xl md:text-4xl font-extrabold text-white">Ready to Preview Furniture in Your Room?</h2>
        <p className="text-slate-300 text-sm max-w-xl mx-auto">
          Explore our interactive catalog or launch the WebAR simulator to place 3D models in your room right now.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/simulator"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-sm rounded-full shadow-lg shadow-blue-500/25 transition-all hover:scale-105"
          >
            <Smartphone className="w-4 h-4" /> Launch 3D Room Simulator
          </Link>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-7 py-4 bg-white/10 text-white font-semibold text-sm rounded-full border border-white/10 hover:bg-white/15 transition-all"
          >
            Browse Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
