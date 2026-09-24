import React, { useState, useEffect } from 'react';
import { Download, Sparkles, Check, Loader2, Image as ImageIcon, Eye } from 'lucide-react';
import { applyWatermark, downloadImageFile } from '../utils/watermark';

interface WatermarkedImagePreviewProps {
  photos: string[];
  itemId: string;
  itemName: string;
}

export const WatermarkedImagePreview: React.FC<WatermarkedImagePreviewProps> = ({
  photos,
  itemId,
  itemName,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [watermarkedUrls, setWatermarkedUrls] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [downloadedIndex, setDownloadedIndex] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const processAll = async () => {
      if (!photos || photos.length === 0) return;
      setIsProcessing(true);

      try {
        const promises = photos.map((url) => applyWatermark(url));
        const results = await Promise.all(promises);
        if (isMounted) {
          setWatermarkedUrls(results);
        }
      } catch (err) {
        console.error('Error applying watermark:', err);
      } finally {
        if (isMounted) setIsProcessing(false);
      }
    };

    processAll();

    return () => {
      isMounted = false;
    };
  }, [photos]);

  if (!photos || photos.length === 0) {
    return (
      <div className="h-48 rounded-2xl bg-slate-100 flex flex-col items-center justify-center text-slate-400 text-xs">
        <ImageIcon className="w-8 h-8 mb-1 stroke-1" />
        <span>Tidak ada foto barang</span>
      </div>
    );
  }

  const currentOriginal = photos[selectedIndex];
  const currentWatermarked = watermarkedUrls[selectedIndex] || currentOriginal;
  const activeImage = showOriginal ? currentOriginal : currentWatermarked;

  const handleDownloadCurrent = () => {
    const safeName = itemName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 25);
    const filename = `barkasmajalengka_${itemId.replace('#', '')}_${safeName}_foto-${selectedIndex + 1}.jpg`;
    downloadImageFile(currentWatermarked, filename);
    setDownloadedIndex(selectedIndex);
    setTimeout(() => setDownloadedIndex(null), 2500);
  };

  const handleDownloadAll = async () => {
    for (let i = 0; i < watermarkedUrls.length; i++) {
      const url = watermarkedUrls[i];
      const safeName = itemName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 25);
      const filename = `barkasmajalengka_${itemId.replace('#', '')}_${safeName}_foto-${i + 1}.jpg`;
      downloadImageFile(url, filename);
      // Brief pause between browser downloads
      await new Promise((r) => setTimeout(r, 300));
    }
  };

  return (
    <div className="space-y-3">
      {/* Main Preview Container */}
      <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 shadow-md border border-slate-200 group">
        <img
          src={activeImage}
          alt={`${itemName} - Foto ${selectedIndex + 1}`}
          className="w-full h-full object-contain bg-slate-950/90 transition-all duration-200"
        />

        {/* Loading Spinner overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white text-xs gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
            <span>Memproses Watermark...</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10">
            Foto {selectedIndex + 1} / {photos.length}
          </span>

          {!showOriginal && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/90 text-slate-950 text-[11px] font-bold shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-slate-950" />
              <span>Watermark Aktif</span>
            </span>
          )}
        </div>

        {/* Top Right Toggle: Original vs Watermark Preview */}
        <div className="absolute top-2.5 right-2.5">
          <button
            type="button"
            onClick={() => setShowOriginal(!showOriginal)}
            className="px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black/90 text-white text-[11px] font-medium backdrop-blur-md border border-white/20 transition-all cursor-pointer flex items-center gap-1"
            title="Bandingkan dengan foto asli tanpa watermark"
          >
            <Eye className="w-3 h-3 text-amber-300" />
            <span>{showOriginal ? 'Lihat Watermark' : 'Lihat Asli'}</span>
          </button>
        </div>

        {/* Bottom Download Overlay Button */}
        <div className="absolute bottom-2.5 right-2.5 left-2.5 flex items-center justify-between pointer-events-none">
          <span className="text-[10px] text-white/70 bg-black/60 px-2 py-1 rounded-md pointer-events-auto backdrop-blur-xs">
            Format Siap Post Instagram
          </span>

          <button
            type="button"
            onClick={handleDownloadCurrent}
            className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-[#1B365D] font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
          >
            {downloadedIndex === selectedIndex ? (
              <>
                <Check className="w-4 h-4 text-emerald-800" />
                <span>Foto Terunduh!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-[#1B365D]" />
                <span>Download Foto Watermark</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Thumbnails Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none flex-1">
          {photos.map((photo, idx) => {
            const isSelected = selectedIndex === idx;
            const thumbUrl = watermarkedUrls[idx] || photo;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105 shadow-sm'
                    : 'border-slate-200 hover:border-[#1B365D] opacity-75 hover:opacity-100'
                }`}
              >
                <img
                  src={thumbUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0.5 right-0.5 px-1 bg-black/70 text-white text-[9px] font-bold rounded">
                  #{idx + 1}
                </span>
              </button>
            );
          })}
        </div>

        {photos.length > 1 && (
          <button
            type="button"
            onClick={handleDownloadAll}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-xl border border-slate-300 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
            title="Download seluruh foto ber-watermark sekaligus"
          >
            <Download className="w-3.5 h-3.5 text-[#1B365D]" />
            <span className="hidden sm:inline">Download Semua ({photos.length})</span>
          </button>
        )}
      </div>
    </div>
  );
};
