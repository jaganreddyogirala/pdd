'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import Hero from '@/components/sections/Hero';
import { ApiService } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { setProducts, setCategories } = useAppStore();

  useEffect(() => {
    // Load featured products, latest products, and categories from Django REST API
    Promise.all([
      ApiService.getProducts({ featured: true }),
      ApiService.getProducts({ ordering: '-created_at' }),
      ApiService.getCategories(),
    ]).then(([featuredData, latestData, categoriesData]) => {
      if (featuredData && featuredData.length > 0) {
        setProducts(featuredData);
      } else if (latestData && latestData.length > 0) {
        setProducts(latestData);
      }
      if (categoriesData) {
        setCategories(categoriesData);
      }
    }).catch((err) => {
      console.warn('Home page API prefetch warning:', err);
    });
  }, [setProducts, setCategories]);

  const faqs = [
    {
      q: 'How does surface detection work in the WebAR simulator?',
      a: 'The WebAR simulator utilizes Three.js WebGL raycasting onto a virtual floor plane grid, providing an interactive focus frame that mimics native iOS ARKit surface detection.',
    },
    {
      q: 'Are captured snapshots stored on the server?',
      a: 'Yes! Both the iOS app and web client upload base64 encoded snapshot images to the Django REST API backend endpoint /api/capture/save/, storing records in the SQLite database.',
    },
    {
      q: 'What 3D formats are supported?',
      a: 'The iOS app natively renders .usdz models via RealityKit, while the Web platform renders glTF/GLB models using Three.js GLTFLoader.',
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section with Silk Animated Background */}
      <Hero />

      {/* FAQ Accordion */}
      <section className="px-6 md:px-20 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white tracking-tight">Frequently Asked Questions</h2>
          <p className="text-slate-400 text-sm">Everything you need to know about the Arv spatial platform.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <motion.div key={idx} className="glass-card rounded-2xl overflow-hidden transition-all">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-6 text-left font-semibold text-white flex items-center justify-between gap-4"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${openFaq === idx ? 'rotate-180 text-cyan-400' : 'text-slate-400'}`} />
              </button>
              {openFaq === idx && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="px-6 pb-6 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-4"
                >
                  {faq.a}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

