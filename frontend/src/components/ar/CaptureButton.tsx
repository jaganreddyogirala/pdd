'use client';

import { Camera } from 'lucide-react';

interface CaptureButtonProps {
  /** Called when the capture button is tapped */
  onCapture: () => void;
  /** Whether a capture upload is currently in progress */
  isCapturing: boolean;
}

/**
 * Large circular capture button positioned at the bottom-center of the AR viewport.
 *
 * Design:
 * - White outer ring with transparent center (camera-shutter aesthetic).
 * - Pulses with a ring animation on tap.
 * - Shows a spinner while the image is being uploaded.
 * - pointer-events: auto so it intercepts taps before the gesture system.
 */
export default function CaptureButton({ onCapture, isCapturing }: CaptureButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!isCapturing) onCapture();
      }}
      disabled={isCapturing}
      className="group relative flex items-center justify-center w-[68px] h-[68px] rounded-full active:scale-90 transition-transform"
      aria-label="Capture AR screenshot"
    >
      {/* Outer ring */}
      <span className="absolute inset-0 rounded-full border-[3px] border-white/90 group-active:border-cyan-400 transition-colors" />

      {/* Inner circle */}
      <span className="relative flex items-center justify-center w-[54px] h-[54px] rounded-full bg-white/90 group-active:bg-cyan-400 transition-colors shadow-lg">
        {isCapturing ? (
          /* Spinner while uploading */
          <span className="w-6 h-6 rounded-full border-2 border-gray-800 border-t-transparent animate-spin" />
        ) : (
          <Camera className="w-6 h-6 text-gray-800" />
        )}
      </span>
    </button>
  );
}
