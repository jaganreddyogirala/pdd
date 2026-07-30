'use client';

import { Images } from 'lucide-react';

interface CapturedImagesButtonProps {
  /** Called when the button is tapped to open the gallery */
  onOpen: () => void;
  /** Number of captures to display as a badge */
  captureCount: number;
}

/**
 * Gallery toggle button positioned at the bottom-left of the AR viewport.
 * Shows a badge with the number of captured images.
 */
export default function CapturedImagesButton({ onOpen, captureCount }: CapturedImagesButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      className="relative flex items-center justify-center w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white shadow-lg active:scale-90 transition-transform"
      aria-label="Open captured images gallery"
    >
      <Images className="w-5 h-5" />

      {/* Badge — only shown when there are captures */}
      {captureCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-500 text-[10px] font-bold text-white shadow-md">
          {captureCount > 99 ? '99+' : captureCount}
        </span>
      )}
    </button>
  );
}
