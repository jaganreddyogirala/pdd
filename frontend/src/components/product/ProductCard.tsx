'use client';

import Link from 'next/link';
import { Product } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { Heart, Box, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatAssetUrl } from '@/services/api';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { wishlist, toggleWishlist } = useAppStore();
  const isWishlisted = wishlist.includes(product.product_id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="glass-card rounded-2xl overflow-hidden flex flex-col group relative"
    >
      {/* Surface Type Badge */}
      <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
        {product.surface_type || 'floor'}
      </div>

      {/* Wishlist Button */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={() => toggleWishlist(product.product_id)}
        className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
      </motion.button>

      {/* Thumbnail Container */}
      <div className="w-full h-56 bg-black/20 flex items-center justify-center p-4 relative overflow-hidden">
        {product.image_url ? (
          <img
            src={formatAssetUrl(product.image_display_url || product.image_url || '')}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
          />
        ) : (
          <Box className="w-16 h-16 text-blue-500/40 group-hover:scale-110 transition-transform" />
        )}
      </div>

      {/* Body Info */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="text-base font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            <span>Dimensions: </span>
            <span className="text-white font-medium">{product.dimensions}</span>
          </div>

          <Link
            href={`/product/${product.product_id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
          >
            View Details <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
