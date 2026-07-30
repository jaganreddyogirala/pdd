'use client';

import { useState } from 'react';
import { X, Trash2, Calendar, Box } from 'lucide-react';
import type { ARCaptureResponse } from '@/services/arCaptureService';

interface GalleryModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** Array of captures to display (newest first) */
  captures: ARCaptureResponse[];
  /** Called when the user deletes a capture */
  onDelete: (captureId: number) => void;
}

/**
 * Full-screen gallery modal overlay.
 *
 * Features:
 * - Grid of thumbnails (newest first).
 * - Each card shows thumbnail, product name, and capture date.
 * - Tap a thumbnail to open a fullscreen preview.
 * - Delete button on each card.
 */
export default function GalleryModal({ isOpen, onClose, captures, onDelete }: GalleryModalProps) {
  const [previewCapture, setPreviewCapture] = useState<ARCaptureResponse | null>(null);

  if (!isOpen) return null;

  /** Format a date string to a human-readable short form */
  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      {/* ── Gallery Grid ─────────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-50 flex flex-col bg-[#07090e]/95 backdrop-blur-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Captured Images</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close gallery"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {captures.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
              <Box className="w-12 h-12 text-slate-500" />
              <p className="text-sm text-slate-400">No captures yet.</p>
              <p className="text-xs text-slate-500">
                Place furniture in AR and tap the capture button.
              </p>
            </div>
          ) : (
            /* Thumbnail grid */
            <div className="grid grid-cols-2 gap-3">
              {captures.map((capture) => (
                <div
                  key={capture.id}
                  className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-md"
                >
                  {/* Thumbnail — tap to open fullscreen preview */}
                  <button
                    onClick={() => setPreviewCapture(capture)}
                    className="block w-full aspect-[4/3] overflow-hidden"
                  >
                    <img
                      src={capture.image_url}
                      alt={`AR capture of ${capture.product_name || 'furniture'}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </button>

                  {/* Info bar */}
                  <div className="p-2.5 space-y-1">
                    <p className="text-xs font-semibold text-white truncate">
                      {capture.product_name || 'Unknown Product'}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(capture.created_at)}</span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(capture.id);
                    }}
                    className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm text-red-400 opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                    aria-label={`Delete capture ${capture.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Fullscreen Preview ────────────────────────────────────────────── */}
      {previewCapture && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl">
          {/* Close button */}
          <button
            onClick={() => setPreviewCapture(null)}
            className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close preview"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image */}
          <img
            src={previewCapture.image_url}
            alt={`Full preview of ${previewCapture.product_name || 'capture'}`}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />

          {/* Caption */}
          <div className="absolute bottom-6 left-0 right-0 text-center space-y-1">
            <p className="text-sm font-semibold text-white">
              {previewCapture.product_name || 'Unknown Product'}
            </p>
            <p className="text-xs text-slate-400">
              {formatDate(previewCapture.created_at)}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
