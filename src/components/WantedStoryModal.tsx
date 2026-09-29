import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Sparkles,
  Image as ImageIcon,
  Layers,
} from 'lucide-react';
import { WantedRequest, ADMIN_CONTACT } from '../types/consignment';
import { formatRupiah } from '../utils/formatters';

interface WantedStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequest: WantedRequest | null;
  allRequests: WantedRequest[];
}

type StoryMode = 'single' | 'recap';
type StoryTheme = 'navy' | 'forest' | 'cream';

const STORY_THEMES: {
  id: StoryTheme;
  label: string;
  bgStart: string;
  bgEnd: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentText: string;
}[] = [
  {
    id: 'navy',
    label: 'Navy Gold',
    bgStart: '#0F2342',
    bgEnd: '#1B365D',
    cardBg: '#FFFFFF',
    cardBorder: '#F59E0B',
    textPrimary: '#FFFFFF',
    textSecondary: '#CBD5E1',
    accent: '#F59E0B',
    accentText: '#0F172A',
  },
  {
    id: 'forest',
    label: 'Botanical Forest',
    bgStart: '#091B13',
    bgEnd: '#133829',
    cardBg: '#FFFFFF',
    cardBorder: '#F59E0B',
    textPrimary: '#FFFFFF',
    textSecondary: '#D1FAE5',
    accent: '#FBBF24',
    accentText: '#091B13',
  },
  {
    id: 'cream',
    label: 'Editorial Cream',
    bgStart: '#F6F3EC',
    bgEnd: '#EAE3D2',
    cardBg: '#FFFFFF',
    cardBorder: '#1B365D',
    textPrimary: '#1B365D',
    textSecondary: '#475569',
    accent: '#1B365D',
    accentText: '#FFFFFF',
  },
];

// Helper to wrap text on HTML5 Canvas cleanly without clipping
function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 3
): number {
  const words = text.split(/\s+/);
  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line ? `${line} ${words[n]}` : words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lineCount++;
      if (lineCount >= maxLines) {
        ctx.fillText(line.trim() + '...', x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line, x, currentY);
      line = words[n];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

export const WantedStoryModal: React.FC<WantedStoryModalProps> = ({
  isOpen,
  onClose,
  selectedRequest,
  allRequests,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [storyMode, setStoryMode] = useState<StoryMode>(selectedRequest ? 'single' : 'recap');
  const [activeRequestId, setActiveRequestId] = useState<string>(
    selectedRequest?.id || allRequests[0]?.id || ''
  );
  const [themeId, setThemeId] = useState<StoryTheme>('navy');
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [isRendering, setIsRendering] = useState(false);

  useEffect(() => {
    if (selectedRequest) {
      setActiveRequestId(selectedRequest.id);
      setStoryMode('single');
    } else if (allRequests.length > 0) {
      setActiveRequestId(allRequests[0].id);
      setStoryMode('recap');
    }
  }, [selectedRequest, allRequests, isOpen]);

  const currentRequest =
    allRequests.find((r) => r.id === activeRequestId) || selectedRequest || allRequests[0] || null;

  const activeWantedList = allRequests.filter((r) => r.status === 'Masih Dicari');
  const listForRecap = (activeWantedList.length > 0 ? activeWantedList : allRequests).slice(0, 4);

  // Render 1080x1920 9:16 Instagram Story Canvas
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    const renderStory = async () => {
      setIsRendering(true);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1920;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const theme = STORY_THEMES.find((t) => t.id === themeId) || STORY_THEMES[0];

        // 1. Background Gradient
        const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
        grad.addColorStop(0, theme.bgStart);
        grad.addColorStop(1, theme.bgEnd);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 1920);

        // Subtle architectural dot grid
        ctx.fillStyle =
          theme.id === 'cream' ? 'rgba(27, 54, 93, 0.05)' : 'rgba(255, 255, 255, 0.06)';
        for (let gx = 40; gx < 1080; gx += 48) {
          for (let gy = 40; gy < 1920; gy += 48) {
            ctx.beginPath();
            ctx.arc(gx, gy, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Top Gold Accent Bar
        ctx.fillStyle = theme.accent;
        ctx.fillRect(0, 0, 1080, 18);

        // 2. Top Brand Header
        ctx.textAlign = 'center';
        ctx.fillStyle = theme.id === 'cream' ? '#B45309' : '#FBBF24';
        ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('INFO.BARKASMAJALENGKA • CURATED CONSIGNMENT HUB', 540, 110);

        ctx.fillStyle = theme.textPrimary;
        ctx.font = '900 58px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(
          storyMode === 'single' ? 'DICARI WARGA MAJALENGKA!' : 'TITIP CARI BARANG HARI INI',
          540,
          185
        );

        ctx.fillStyle = theme.textSecondary;
        ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(
          'Punya barang nganggur sesuai kriteria di bawah? Cairkan jadi uang tunai!',
          540,
          240
        );

        // Generate QR Code pointing to ?tab=wanted
        const origin =
          typeof window !== 'undefined' && window.location?.origin
            ? window.location.origin
            : 'https://barkas-two.vercel.app';
        const wantedUrl = `${origin}/?tab=wanted`;
        const qrDataUrl = await QRCode.toDataURL(wantedUrl, {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 240,
          color: {
            dark: '#1B365D',
            light: '#FFFFFF',
          },
        });

        const qrImg = new Image();
        await new Promise<void>((resolve) => {
          qrImg.onload = () => resolve();
          qrImg.onerror = () => resolve();
          qrImg.src = qrDataUrl;
        });

        if (storyMode === 'single' && currentRequest) {
          // SINGLE ITEM WANTED POSTER CARD
          const cardX = 70;
          const cardY = 300;
          const cardW = 940;
          const cardH = 1060;

          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.28)';
          ctx.shadowBlur = 40;
          ctx.shadowOffsetY = 16;
          ctx.fillStyle = theme.cardBg;
          ctx.beginPath();
          ctx.roundRect(cardX, cardY, cardW, cardH, 44);
          ctx.fill();
          ctx.restore();

          ctx.lineWidth = 6;
          ctx.strokeStyle = theme.cardBorder;
          ctx.beginPath();
          ctx.roundRect(cardX, cardY, cardW, cardH, 44);
          ctx.stroke();

          // Top Ribbon inside Card
          ctx.fillStyle = '#1B365D';
          ctx.beginPath();
          ctx.roundRect(cardX + 50, cardY + 48, 840, 82, 22);
          ctx.fill();

          ctx.textAlign = 'left';
          ctx.fillStyle = '#FBBF24';
          ctx.font = '800 28px monospace';
          ctx.fillText(
            `${currentRequest.id}  •  ${currentRequest.category.toUpperCase()}`,
            cardX + 82,
            cardY + 99
          );

          ctx.textAlign = 'right';
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '800 26px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(
            currentRequest.status === 'Sudah Dapat' ? '✓ SUDAH DAPAT' : '● MASIH DICARI',
            cardX + cardW - 82,
            cardY + 99
          );

          // Main Wanted Item Title
          ctx.textAlign = 'left';
          ctx.fillStyle = '#64748B';
          ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
          ctx.fillText('BARANG & UKURAN YANG DICARI:', cardX + 56, cardY + 195);

          ctx.fillStyle = '#0F172A';
          ctx.font = '900 48px "Plus Jakarta Sans", sans-serif';
          const afterTitleY = wrapCanvasText(
            ctx,
            currentRequest.itemWanted,
            cardX + 56,
            cardY + 258,
            828,
            60,
            3
          );

          // Budget Highlight Box
          const budgetBoxY = Math.max(cardY + 420, afterTitleY + 24);
          ctx.fillStyle = '#FFFBEB';
          ctx.beginPath();
          ctx.roundRect(cardX + 56, budgetBoxY, 828, 190, 28);
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#F59E0B';
          ctx.stroke();

          ctx.fillStyle = '#92400E';
          ctx.font = '800 25px "Plus Jakarta Sans", sans-serif';
          ctx.fillText('ESTIMASI BUDGET PEMBELI SIAP BAYAR:', cardX + 92, budgetBoxY + 58);

          ctx.fillStyle = '#1B365D';
          ctx.font = '900 64px monospace';
          ctx.fillText(`s.d. ${formatRupiah(currentRequest.maxBudget)}`, cardX + 92, budgetBoxY + 138);

          // Notes / Criteria Box
          const notesBoxY = budgetBoxY + 225;
          ctx.fillStyle = '#F8FAFC';
          ctx.beginPath();
          ctx.roundRect(cardX + 56, notesBoxY, 828, 220, 28);
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#E2E8F0';
          ctx.stroke();

          ctx.fillStyle = '#475569';
          ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
          ctx.fillText('SPESIFIKASI & KONDISI YANG DIHARAPKAN:', cardX + 86, notesBoxY + 52);

          ctx.fillStyle = '#1E293B';
          ctx.font = '600 30px "Plus Jakarta Sans", sans-serif';
          wrapCanvasText(
            ctx,
            `"${currentRequest.notes || 'Kondisi layak pakai, siap COD area Majalengka.'}"`,
            cardX + 86,
            notesBoxY + 104,
            768,
            42,
            3
          );

          // Requester & Location Footer inside Card
          const metaY = cardY + cardH - 72;
          ctx.fillStyle = '#334155';
          ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(
            `Pencari: ${currentRequest.requesterName}  •  Domisili: Kec. ${currentRequest.kecamatan}`,
            cardX + 56,
            metaY
          );
        } else {
          // RECAP MODE: UP TO 4 WANTED ITEMS
          let currentY = 290;
          listForRecap.forEach((req, idx) => {
            const boxH = 245;
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 24;
            ctx.shadowOffsetY = 8;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.roundRect(70, currentY, 940, boxH, 32);
            ctx.fill();
            ctx.restore();

            ctx.lineWidth = 4;
            ctx.strokeStyle = idx === 0 ? '#F59E0B' : '#CBD5E1';
            ctx.beginPath();
            ctx.roundRect(70, currentY, 940, boxH, 32);
            ctx.stroke();

            // Number badge
            ctx.fillStyle = '#1B365D';
            ctx.beginPath();
            ctx.roundRect(102, currentY + 32, 64, 64, 18);
            ctx.fill();
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FBBF24';
            ctx.font = '900 32px monospace';
            ctx.fillText(`0${idx + 1}`, 134, currentY + 75);

            // Title & Meta
            ctx.textAlign = 'left';
            ctx.fillStyle = '#64748B';
            ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
            ctx.fillText(
              `${req.id} • ${req.category} • Pencari: ${req.requesterName} (Kec. ${req.kecamatan})`,
              190,
              currentY + 54
            );

            ctx.fillStyle = '#0F172A';
            ctx.font = '900 34px "Plus Jakarta Sans", sans-serif';
            wrapCanvasText(ctx, req.itemWanted, 190, currentY + 102, 780, 42, 1);

            // Budget Pill
            ctx.fillStyle = '#047857';
            ctx.font = '900 32px monospace';
            ctx.fillText(`Budget Siap Bayar: s.d. ${formatRupiah(req.maxBudget)}`, 190, currentY + 160);

            ctx.fillStyle = '#475569';
            ctx.font = '500 23px "Plus Jakarta Sans", sans-serif';
            wrapCanvasText(ctx, `Catatan: ${req.notes}`, 190, currentY + 205, 780, 32, 1);

            currentY += boxH + 26;
          });
        }

        // 4. Bottom CTA & QR Code Footer Card
        const footerY = 1410;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(70, footerY, 940, 390, 40);
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#F59E0B';
        ctx.stroke();

        // Draw QR Code on the right side of Footer
        if (qrImg.width > 0) {
          ctx.drawImage(qrImg, 730, footerY + 55, 235, 235);
          ctx.textAlign = 'center';
          ctx.fillStyle = '#1B365D';
          ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
          ctx.fillText('SCAN FORM TITIP JUAL', 847, footerY + 322);
        }

        // Left side CTA text
        ctx.textAlign = 'left';
        ctx.fillStyle = '#D97706';
        ctx.font = '900 26px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('PUNYA BARANG YANG DICARI DI ATAS?', 115, footerY + 78);

        ctx.fillStyle = '#0F172A';
        ctx.font = '900 42px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Tawarkan & Cairkan Tunai!', 115, footerY + 135);

        ctx.fillStyle = '#334155';
        ctx.font = '600 26px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('1. Klik Link di Bio IG @info.barkasmajalengka', 115, footerY + 195);
        ctx.fillText('2. Buka tab "Titip Cari" & klik "Titip Jual Barang Ini"', 115, footerY + 238);
        ctx.fillText(
          `3. Atau WA Admin Esteh: ${ADMIN_CONTACT.whatsappFormatted}`,
          115,
          footerY + 281
        );

        ctx.fillStyle = '#059669';
        ctx.font = '800 25px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('✓ 100% Harga Nett Utuh  •  ✓ Rekber & COD Aman', 115, footerY + 338);

        // Bottom watermark strip
        ctx.textAlign = 'center';
        ctx.fillStyle = theme.textSecondary;
        ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(
          '@info.barkasmajalengka  •  26 Kecamatan Kabupaten Majalengka',
          540,
          1865
        );

        if (!isCancelled) {
          canvasRef.current = canvas;
          setPreviewDataUrl(canvas.toDataURL('image/png'));
        }
      } catch (err) {
        console.error('Failed to render Wanted IG Story:', err);
      } finally {
        if (!isCancelled) setIsRendering(false);
      }
    };

    renderStory();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, storyMode, currentRequest, listForRecap, themeId]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!previewDataUrl) return;
    const link = document.createElement('a');
    const suffix =
      storyMode === 'single' && currentRequest
        ? currentRequest.id.replace(/[^a-zA-Z0-9_-]/g, '')
        : 'Rekap-Wanted';
    link.download = `IG-Story-TitipCari-${suffix}.png`;
    link.href = previewDataUrl;
    link.click();
  };

  const handleShareImage = async () => {
    if (!previewDataUrl || !navigator.share) {
      handleDownload();
      return;
    }
    try {
      const res = await fetch(previewDataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'ig-story-titip-cari-majalengka.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'IG Story Titip Cari Barang - info.barkasmajalengka',
          text: 'Warga Majalengka sedang mencari barang ini! Punya barangnya? Titip jual di info.barkasmajalengka.',
          files: [file],
        });
        return;
      }
    } catch {
      // fallback to download
    }
    handleDownload();
  };

  const storyCaptionText =
    storyMode === 'single' && currentRequest
      ? `🔎 *DICARI WARGA MAJALENGKA (${currentRequest.id})*\n\n📦 *Barang Dicari:* ${currentRequest.itemWanted}\n💰 *Budget Siap Bayar:* s.d. ${formatRupiah(currentRequest.maxBudget)}\n📍 *Lokasi Pencari:* Kec. ${currentRequest.kecamatan}\n📝 *Kriteria:* ${currentRequest.notes}\n\nPunya barang ini di rumah jarang dipakai? Langsung tawarkan via link di bio *@info.barkasmajalengka* atau hubungi WA Admin Esteh (${ADMIN_CONTACT.whatsappFormatted})!`
      : `🔎 *DAFTAR TITIP CARI BARANG WARGA MAJALENGKA HARI INI*\n\n${listForRecap
          .map(
            (r, i) =>
              `${i + 1}. *${r.itemWanted}* — Budget s.d. *${formatRupiah(r.maxBudget)}* (Kec. ${r.kecamatan})`
          )
          .join(
            '\n'
          )}\n\nPunya salah satu barang di atas? Jadikan uang tunai sekarang di *@info.barkasmajalengka* atau WA Admin Esteh (${ADMIN_CONTACT.whatsappFormatted})!`;

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(storyCaptionText);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#1B365D] text-white px-5 py-4 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold">
                Generator Poster Instagram Story • Titip Cari Barang
              </h3>
              <p className="text-[11px] text-amber-200">
                Resolusi Penuh 1080×1920 px (Rasio 9:16) Siap Upload ke IG Story & Status WhatsApp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: 9:16 Story Preview */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="w-full max-w-[270px] aspect-[9/16] rounded-2xl overflow-hidden border-2 border-slate-300 shadow-lg bg-slate-900 relative flex items-center justify-center">
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Preview IG Story Titip Cari"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xs text-slate-300">
                  {isRendering ? 'Membuat desain Story...' : 'Pratinjau belum tersedia'}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 mt-2">
              Pratinjau Kanvas Vertikal 9:16 (1080 × 1920 px)
            </span>
          </div>

          {/* Right Column: Controls & Download */}
          <div className="md:col-span-7 space-y-4">
            {/* Mode Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                1. Pilih Mode Desain Story
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStoryMode('single')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    storyMode === 'single'
                      ? 'bg-[#1B365D] text-white border-[#1B365D]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>1 Barang (Fokus Detail)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStoryMode('recap')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    storyMode === 'recap'
                      ? 'bg-[#1B365D] text-white border-[#1B365D]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Rekap Daftar Dicari ({listForRecap.length})</span>
                </button>
              </div>
            </div>

            {/* Select Request if Single Mode */}
            {storyMode === 'single' && allRequests.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  2. Pilih Item Titip Cari
                </label>
                <select
                  value={activeRequestId}
                  onChange={(e) => setActiveRequestId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-[#1B365D] focus:outline-hidden"
                >
                  {allRequests.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id} — {r.itemWanted} (Budget {formatRupiah(r.maxBudget)} • Kec. {r.kecamatan})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Theme Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                3. Pilih Tema Warna Story
              </label>
              <div className="grid grid-cols-3 gap-2">
                {STORY_THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setThemeId(t.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                      themeId === t.id
                        ? 'bg-amber-400 text-stone-950 border-amber-500 font-extrabold shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-generated Caption for WA Status / IG Story */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  4. Teks Pengantar WA Status / Broadcast
                </label>
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#1B365D] hover:text-amber-600 cursor-pointer"
                >
                  {copiedCaption ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Teks</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                readOnly
                rows={4}
                value={storyCaptionText}
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono leading-relaxed focus:outline-hidden"
              />
            </div>

            {/* Download & Share Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#1B365D] hover:bg-[#24477A] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Download Poster IG Story (PNG)</span>
              </button>

              <button
                type="button"
                onClick={handleShareImage}
                className="py-3 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Bagikan ke IG / WA</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
