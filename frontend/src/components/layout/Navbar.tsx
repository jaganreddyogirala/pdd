'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Search, Sparkles, Sun, Moon, User, Menu, X } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAppStore();
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isRippling, setIsRippling] = useState(false);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Catalog', path: '/catalog' },
    { name: 'Room Simulator', path: '/simulator' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Wishlist', path: '/wishlist' },
    { name: 'About', path: '/about' },
  ];

  const handleRipple = () => {
    setIsRippling(true);
    setTimeout(() => setIsRippling(false), 600);
  };

  return (
    <motion.header
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: '-120%', opacity: 0 },
      }}
      animate={hidden ? 'hidden' : 'visible'}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none px-4 sm:px-6 lg:px-8"
    >
      <div className="w-full max-w-7xl pointer-events-auto">
        {/* Outer Animated Gradient Border Container */}
        <div className="relative p-[1px] rounded-full bg-gradient-to-r from-blue-500/30 via-cyan-400/20 to-purple-500/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
        <div className="bg-slate-950/40 backdrop-blur-2xl rounded-full px-6 py-3 flex items-center justify-between border border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
          
          {/* LEFT: Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 font-extrabold text-lg text-white group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1px] flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-slate-950/70 flex items-center justify-center">
                <Box className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="leading-none text-white tracking-tight">ARV</span>
              <span className="text-[9px] font-semibold text-slate-400 tracking-widest uppercase">
                AR Visualisation
              </span>
            </div>
          </Link>

          {/* CENTER: Desktop Navigation Menu */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`relative px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                    isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <motion.span
                    whileHover={{ y: -2 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                    className="relative z-10 block"
                  >
                    {item.name}
                  </motion.span>

                  {/* Active Indicator Underline */}
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600/40 to-cyan-500/40 border border-blue-400/30"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: Quick Controls & CTA */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Search Button */}
            <Link
              href="/catalog"
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all hover:scale-105"
              title="Search Catalog"
            >
              <Search className="w-4 h-4" />
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all hover:scale-105"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
            </button>

            {/* User Profile Avatar */}
            <Link
              href="/profile"
              className="relative p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all hover:scale-105"
              title={user ? `Profile (${user.username})` : 'User Account / Sign In'}
            >
              <User className="w-4 h-4 text-cyan-400" />
              {user && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
              )}
            </Link>

            {/* Magnetic Rounded Start AR Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative overflow-hidden rounded-full"
            >
              <button
                onClick={handleRipple}
                className="relative inline-flex items-center gap-2 px-6 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-[length:200%_auto] rounded-full shadow-lg shadow-blue-500/25 hover:shadow-cyan-500/40 transition-all overflow-hidden"
              >
                <Sparkles className="w-4 h-4 animate-spin-slow text-white" />
                <span>Start AR</span>

                {/* Ripple Effect */}
                {isRippling && (
                  <span className="absolute inset-0 rounded-full bg-white/30 animate-ping pointer-events-none" />
                )}
              </button>
            </motion.div>
          </div>

          {/* MOBILE: Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-full bg-white/5 text-slate-300 hover:text-white border border-white/10"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE: Slide-down Glass Drawer Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 8, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden w-full bg-[#07090e]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-2xl text-sm font-semibold transition-colors flex items-center justify-between ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600/30 to-cyan-500/30 text-white font-bold border border-blue-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{item.name}</span>
                    {isActive && <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />}
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
              <Link
                href="/simulator"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-full text-center shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Start AR Experience
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.header>
  );
}

export default Navbar;
