'use client';

import Link from 'next/link';
import { Box, Globe, Share2, MessageSquare, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#040609] border-t border-white/10 pt-16 pb-12 px-6 md:px-20 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3 font-bold text-lg text-white">
            <Box className="w-5 h-5 text-blue-500" />
            <span>Arv Spatial</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Enterprise 3D & WebAR Visualisation platform built for IKEA-level real-time surface placement, true scale rendering, and seamless cloud session sync.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-4">Platform Routes</h4>
          <ul className="space-y-2.5">
            <li><Link href="/" className="hover:text-white transition-colors">Home Experience</Link></li>
            <li><Link href="/catalog" className="hover:text-white transition-colors">Product Catalog</Link></li>
            <li><Link href="/simulator" className="hover:text-white transition-colors">WebAR Simulator</Link></li>
            <li><Link href="/dashboard" className="hover:text-white transition-colors">AR Snapshot Gallery</Link></li>
            <li><Link href="/wishlist" className="hover:text-white transition-colors">My Wishlist</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-4">Tech Architecture</h4>
          <ul className="space-y-2.5">
            <li><span>Next.js 15 App Router</span></li>
            <li><span>React 18 / React 19</span></li>
            <li><span>Three.js & WebGL</span></li>
            <li><span>Tailwind CSS</span></li>
            <li><span>Django REST Backend API</span></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold text-sm mb-4">Stay Connected</h4>
          <div className="flex items-center gap-3 mb-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Globe className="w-4 h-4 text-slate-300" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Share2 className="w-4 h-4 text-slate-300" />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
              <MessageSquare className="w-4 h-4 text-slate-300" />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
        <div>© 2026 Arv Spatial Platform. All rights reserved.</div>
        <div className="flex items-center gap-1">
          <span>Crafted with</span>
          <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
          <span>for spatial visual computing.</span>
        </div>
      </div>
    </footer>
  );
}
