'use client';

import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  /** Called when the back button is tapped */
  onBack: () => void;
}

/**
 * Glassmorphism back button positioned at the top-left corner of the AR viewport.
 * Ends the WebXR session and navigates back to the product page.
 */
export default function BackButton({ onBack }: BackButtonProps) {
  return (
    <button
      onClick={onBack}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white shadow-lg active:scale-90 transition-transform"
      aria-label="Back to product page"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  );
}
