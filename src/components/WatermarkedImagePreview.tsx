import React, { useEffect, useRef, useState } from 'react';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

interface WatermarkedImagePreviewProps {
  photos: string[];
  itemId: string;
  itemName: string;
  kecamatan?: string;
  category?: string;
  size?: string;
  condition?: string;
  listingPrice?: number;
  originalListingPrice?: number;
  priceDropText?: string;
  isSoldStatus?: boolean;
}

export const WatermarkedImagePreview: React.FC<WatermarkedImagePreviewProps> = ({
  photos,
  itemId,
  itemName,
  kecamatan,
  category = 'Preloved',
  size = 'All Size',
  condition = 'Siap Pakai',
  listingPrice,
  originalListingPrice,
  priceDropText,
  isSoldStatus = false,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [stampMode, setStampMode] = useState<'normal' | 'sold' | 'story_poster'>(
    isSoldStatus ? 'sold' : 'normal'
  );
  const [watermarkedDataUrl, setWatermarkedDataUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isSoldStatus && stampMode === 'normal') {
      setStampMode('sold');
    }
  }, [isSoldStatus]);

  useEffect(() => {
    if (!photos || photos.length === 0) return;
    const currentPhoto = photos[selectedIndex] || photos[0];
    if (!currentPhoto) return;

    setIsRendering(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Helper for rounded rect
      const drawRoundedRect = (
        x: number,
        y: number,
        w: number,
        h: number,
        r: number
      ) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
      };

      // Helper for multi-line wrapped text
      const drawWrappedText = (
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        lineHeight: number,
        maxLines: number = 2
      ): number => {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        let linesDrawn = 0;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            linesDrawn++;
            if (linesDrawn >= maxLines) {
              ctx.fillText(line.trim() + '...', x, currentY);
              return currentY + lineHeight;
            }
            ctx.fillText(line.trim(), x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line.trim(), x, currentY);
        return currentY + lineHeight;
      };

      // ============================================================
      // MODE 3: INSTAGRAM STORY POSTER CARD (9:16 — 1080 x 1920)
      // ============================================================
      if (stampMode === 'story_poster') {
        const W = 1080;
        const H = 1920;
        canvas.width = W;
        canvas.height = H;

        // 1. Deep Botanical Forest Background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#0F291E');
        bgGrad.addColorStop(0.6, '#133426');
        bgGrad.addColorStop(1, '#091A13');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // 2. Outer Gold Editorial Frame
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.lineWidth = 3;
        drawRoundedRect(44, 44, W - 88, H - 88, 36);
        ctx.stroke();

        // 3. Top Header Masthead
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FBBF24';
        ctx.font = 'bold 24px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText('ETALase RESMI BARANG TITIPAN TERKURASI', W / 2, 118);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 48px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText('@info.barkasmajalengka', W / 2, 176);

        // Subtle divider line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(140, 212);
        ctx.lineTo(W - 140, 212);
        ctx.stroke();

        // 4. Center Framed Product Image Box (Square 880 x 880)
        const imgBoxX = 100;
        const imgBoxY = 250;
        const imgBoxSize = 880;

        ctx.save();
        drawRoundedRect(imgBoxX, imgBoxY, imgBoxSize, imgBoxSize, 32);
        ctx.fillStyle = '#1E293B';
        ctx.fill();
        ctx.clip();

        // Object-cover crop into square
        const scale = Math.max(imgBoxSize / img.width, imgBoxSize / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const drawX = imgBoxX + (imgBoxSize - drawW) / 2;
        const drawY = imgBoxY + (imgBoxSize - drawH) / 2;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        ctx.restore();

        // Gold border around photo
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 4;
        drawRoundedRect(imgBoxX, imgBoxY, imgBoxSize, imgBoxSize, 32);
        ctx.stroke();

        // Ticket ID Tag on top-left of photo
        ctx.fillStyle = 'rgba(15, 41, 30, 0.92)';
        drawRoundedRect(imgBoxX + 24, imgBoxY + 24, 260, 58, 16);
        ctx.fill();
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#FBBF24';
        ctx.textAlign = 'center';
        ctx.font = 'bold 26px monospace';
        ctx.fillText(itemId, imgBoxX + 154, imgBoxY + 62);

        // Price Drop Badge on top-right of photo if active
        if (priceDropText) {
          ctx.fillStyle = '#E11D48';
          drawRoundedRect(imgBoxX + imgBoxSize - 330, imgBoxY + 24, 306, 58, 16);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 24px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.fillText(priceDropText, imgBoxX + imgBoxSize - 177, imgBoxY + 61);
        }

        // 5. Product Specs Card Area below photo
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FBBF24';
        ctx.font = 'bold 26px "Plus Jakarta Sans", system-ui, sans-serif';
        const metaLine = `${category}  ·  Size ${size || 'All Size'}  ·  ${condition}`;
        ctx.fillText(metaLine, W / 2, 1195);

        // Item Title (1-2 lines)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 44px "Plus Jakarta Sans", system-ui, sans-serif';
        const nextY = drawWrappedText(itemName.toUpperCase(), W / 2, 1260, 860, 54, 2);

        // Location Line
        ctx.fillStyle = '#D6D3D1';
        ctx.font = '600 28px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(
          `Lokasi Barang: Kec. ${kecamatan || 'Majalengka'}, Kab. Majalengka`,
          W / 2,
          nextY + 18
        );

        // 6. Prominent Price Box
        const priceBoxX = 100;
        const priceBoxY = 1435;
        const priceBoxW = 880;
        const priceBoxH = 220;

        ctx.fillStyle = '#F6F3EC';
        drawRoundedRect(priceBoxX, priceBoxY, priceBoxW, priceBoxH, 28);
        ctx.fill();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.textAlign = 'center';
        if (originalListingPrice && listingPrice && originalListingPrice > listingPrice) {
          ctx.fillStyle = '#E11D48';
          ctx.font = '800 24px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.fillText(
            `HARGA AWAL: ${formatRupiah(originalListingPrice)} (PROMO PRICE DROP)`,
            W / 2,
            priceBoxY + 58
          );

          ctx.fillStyle = '#0F291E';
          ctx.font = '900 68px monospace';
          ctx.fillText(formatRupiah(listingPrice), W / 2, priceBoxY + 138);
        } else {
          ctx.fillStyle = '#57534E';
          ctx.font = 'bold 24px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.fillText('HARGA ETALASE SIAP PAKAI', W / 2, priceBoxY + 62);

          ctx.fillStyle = '#0F291E';
          ctx.font = '900 70px monospace';
          ctx.fillText(
            listingPrice ? formatRupiah(listingPrice) : 'Cek Caption',
            W / 2,
            priceBoxY + 142
          );
        }

        ctx.fillStyle = '#047857';
        ctx.font = 'bold 23px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(
          'Bisa Rekber Admin Esteh / COD Area Majalengka',
          W / 2,
          priceBoxY + 190
        );

        // 7. Footer Call To Action
        ctx.fillStyle = '#FBBF24';
        ctx.font = '800 28px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(
          'MINAT? BALAS STORY INI ATAU WA ADMIN: 0851-8726-6629',
          W / 2,
          1745
        );

        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = '500 22px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.fillText(
          `Sebutkan Kode Tiket ${itemId} saat menghubungi Admin Esteh`,
          W / 2,
          1795
        );

        setWatermarkedDataUrl(canvas.toDataURL('image/jpeg', 0.92));
        setIsRendering(false);
        return;
      }

      // ============================================================
      // MODE 1 & 2: STANDARD 1:1 / PHOTO WATERMARK & SOLD OUT STAMP
      // ============================================================
      const targetWidth = Math.max(img.width, 800);
      const scaleRatio = targetWidth / img.width;
      const targetHeight = Math.round(img.height * scaleRatio);

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // 1. Draw Original Image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // 2. Bottom Gradient Scrim for legibility
      const barHeight = Math.max(Math.round(targetHeight * 0.085), 54);
      const gradient = ctx.createLinearGradient(0, targetHeight - barHeight * 1.6, 0, targetHeight);
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0)');
      gradient.addColorStop(0.5, 'rgba(15, 41, 30, 0.78)');
      gradient.addColorStop(1, 'rgba(15, 41, 30, 0.95)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, targetHeight - barHeight * 1.6, targetWidth, barHeight * 1.6);

      // 3. Gold Accent Line at very bottom
      const accentHeight = Math.max(Math.round(targetHeight * 0.008), 5);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(0, targetHeight - accentHeight, targetWidth, accentHeight);

      const paddingX = Math.round(targetWidth * 0.035);
      const centerY = targetHeight - Math.round(barHeight * 0.45);

      // 4. Left Text: @info.barkasmajalengka + Kecamatan
      const fontSizeBrand = Math.max(Math.round(targetWidth * 0.025), 16);
      ctx.font = `bold ${fontSizeBrand}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';

      const leftLabel = kecamatan
        ? `@info.barkasmajalengka  •  COD ${kecamatan}`
        : '@info.barkasmajalengka  •  Titip Jual Majalengka';
      ctx.fillText(leftLabel, paddingX, centerY);

      // 5. Right Pill Badge: Ticket ID (#BM-2026-XXXX)
      const fontSizeTicket = Math.max(Math.round(targetWidth * 0.022), 14);
      ctx.font = `bold ${fontSizeTicket}px monospace`;
      const ticketText = `${itemId}`;
      const textMetrics = ctx.measureText(ticketText);
      const badgePadX = Math.round(fontSizeTicket * 0.7);
      const badgePadY = Math.round(fontSizeTicket * 0.45);
      const badgeW = textMetrics.width + badgePadX * 2;
      const badgeH = fontSizeTicket + badgePadY * 2;
      const badgeX = targetWidth - paddingX - badgeW;
      const badgeY = centerY - badgeH / 2;

      ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
      ctx.strokeStyle = '#FBBF24';
      ctx.lineWidth = 2;
      drawRoundedRect(badgeX, badgeY, badgeW, badgeH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FDE68A';
      ctx.textAlign = 'center';
      ctx.fillText(ticketText, badgeX + badgeW / 2, centerY);

      // 6. Top-Left Price Drop Badge (if item has active price drop & not in sold mode)
      if (priceDropText && stampMode === 'normal') {
        const dropFontSize = Math.max(Math.round(targetWidth * 0.024), 16);
        ctx.font = `900 ${dropFontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
        const dropLabel = `${priceDropText}`;
        const dropMetrics = ctx.measureText(dropLabel);
        const dropW = dropMetrics.width + dropFontSize * 1.6;
        const dropH = dropFontSize * 2.0;
        const dropX = paddingX;
        const dropY = paddingX;

        ctx.fillStyle = 'rgba(225, 29, 72, 0.94)';
        ctx.strokeStyle = '#FECDD3';
        ctx.lineWidth = 2.5;
        drawRoundedRect(dropX, dropY, dropW, dropH, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dropLabel, dropX + dropW / 2, dropY + dropH / 2);
      }

      // 7. Diagonal "TERJUAL / SOLD OUT" Stamp Overlay (when stampMode === 'sold')
      if (stampMode === 'sold') {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.48)';
        ctx.fillRect(0, 0, targetWidth, targetHeight - barHeight * 1.1);

        ctx.save();
        ctx.translate(targetWidth / 2, targetHeight / 2 - barHeight * 0.3);
        ctx.rotate((-16 * Math.PI) / 180);

        const stampW = Math.round(targetWidth * 0.78);
        const stampH = Math.round(targetWidth * 0.22);

        ctx.fillStyle = 'rgba(220, 38, 38, 0.92)';
        ctx.strokeStyle = '#FEF08A';
        ctx.lineWidth = Math.max(Math.round(targetWidth * 0.008), 5);
        drawRoundedRect(-stampW / 2, -stampH / 2, stampW, stampH, 18);
        ctx.fill();
        ctx.stroke();

        const innerInset = Math.max(Math.round(targetWidth * 0.012), 8);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 2;
        drawRoundedRect(
          -stampW / 2 + innerInset,
          -stampH / 2 + innerInset,
          stampW - innerInset * 2,
          stampH - innerInset * 2,
          12
        );
        ctx.stroke();

        const mainStampFont = Math.max(Math.round(targetWidth * 0.072), 36);
        ctx.font = `900 ${mainStampFont}px "Plus Jakarta Sans", system-ui, sans-serif`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('TERJUAL / SOLD', 0, -Math.round(stampH * 0.11));

        const subStampFont = Math.max(Math.round(targetWidth * 0.025), 14);
        ctx.font = `bold ${subStampFont}px "Plus Jakarta Sans", system-ui, sans-serif`;
        ctx.fillStyle = '#FEF08A';
        ctx.fillText('ALHAMDULILLAH • @info.barkasmajalengka', 0, Math.round(stampH * 0.26));

        ctx.restore();
      }

      setWatermarkedDataUrl(canvas.toDataURL('image/jpeg', 0.9));
      setIsRendering(false);
    };

    img.onerror = () => {
      setWatermarkedDataUrl(currentPhoto);
      setIsRendering(false);
    };

    img.src = currentPhoto;
  }, [
    photos,
    selectedIndex,
    itemId,
    itemName,
    kecamatan,
    category,
    size,
    condition,
    listingPrice,
    originalListingPrice,
    priceDropText,
    stampMode,
  ]);

  const handleDownloadWatermarked = () => {
    if (!watermarkedDataUrl) return;
    const cleanName = itemName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 25);
    const cleanTicket = itemId.replace('#', '');
    const suffix =
      stampMode === 'sold'
        ? '_TERJUAL'
        : stampMode === 'story_poster'
        ? '_IG_STORY_9x16'
        : `_Foto_${selectedIndex + 1}`;
    const link = document.createElement('a');
    link.href = watermarkedDataUrl;
    link.download = `BarkasMJL_${cleanTicket}_${cleanName}${suffix}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!photos || photos.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs">
        Tidak ada foto tersedia
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Hidden Canvas for Watermark Processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Mode Switcher: Watermark Feed vs Stempel SOLD OUT vs Poster IG Story (9:16) */}
      <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => setStampMode('normal')}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap truncate ${
            stampMode === 'normal'
              ? 'bg-[#1B365D] text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Feed (1:1)
        </button>
        <button
          type="button"
          onClick={() => setStampMode('story_poster')}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap truncate ${
            stampMode === 'story_poster'
              ? 'bg-amber-500 text-stone-950 shadow-2xs'
              : 'text-slate-600 hover:text-amber-800'
          }`}
        >
          Poster Story (9:16)
        </button>
        <button
          type="button"
          onClick={() => setStampMode('sold')}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap truncate ${
            stampMode === 'sold'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-rose-700'
          }`}
        >
          Stempel SOLD
        </button>
      </div>

      {/* Main Preview Box */}
      <div
        className={`relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner group ${
          stampMode === 'story_poster' ? 'aspect-[9/16] max-h-[420px] mx-auto' : 'aspect-square'
        }`}
      >
        {watermarkedDataUrl ? (
          <img
            src={watermarkedDataUrl}
            alt={`${itemName} - Foto ${selectedIndex + 1}`}
            className="w-full h-full object-contain bg-slate-950"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
            Memproses Gambar...
          </div>
        )}

        {/* Top Left Counter */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full bg-slate-900/75 backdrop-blur-md text-white font-bold text-[11px] border border-white/15">
            Foto {selectedIndex + 1} / {photos.length}
          </span>
        </div>

        {/* Navigation Arrows if multiple photos */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() =>
                setSelectedIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
              }
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
              title="Foto Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                setSelectedIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
              }
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20"
              title="Foto Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip + Download Watermarked Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {photos.map((thumb, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                selectedIndex === idx
                  ? 'border-[#1B365D] scale-105 shadow-xs'
                  : 'border-slate-200 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={thumb} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleDownloadWatermarked}
          disabled={isRendering || !watermarkedDataUrl}
          className={`flex items-center gap-1.5 px-3 py-2 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer disabled:opacity-50 ${
            stampMode === 'sold'
              ? 'bg-rose-600 hover:bg-rose-700'
              : stampMode === 'story_poster'
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-[#1B365D] hover:bg-[#24477A]'
          }`}
          title="Unduh Gambar Siap Posting"
        >
          <Download className="w-3.5 h-3.5 text-amber-300" />
          <span>
            {stampMode === 'sold'
              ? 'Unduh Stempel SOLD'
              : stampMode === 'story_poster'
              ? 'Unduh Poster Story (9:16)'
              : `Unduh Foto #${selectedIndex + 1}`}
          </span>
        </button>
      </div>
    </div>
  );
};
