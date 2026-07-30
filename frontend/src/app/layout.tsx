import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SmoothScroll } from '@/components/providers/SmoothScroll';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ARV | AR Product Visualisation Platform',
  description: 'Enterprise 3D & WebAR Visualisation platform built with Next.js 15, Three.js, and Django REST API.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body className="bg-[#07090e] text-slate-100 min-h-screen flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
        <Navbar />
        <SmoothScroll>{children}</SmoothScroll>
        <Footer />
      </body>
    </html>
  );
}

