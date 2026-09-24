import React, { useState } from 'react';
import { 
  Instagram, 
  Copy, 
  Check, 
  MessageCircle, 
  Sparkles, 
  DollarSign, 
  Tag, 
  MapPin, 
  Clock, 
  Share2, 
  ExternalLink,
  QrCode,
  FileText,
  Trash2
} from 'lucide-react';
import { ConsignmentItem, AdminPostStatus, SubmissionStatus } from '../types/consignment';
import { formatRupiah, calculateListingEstimates, getTenorTimeline } from '../utils/formatters';
import { 
  generateInstagramFeedCaption, 
  generateInstagramStoryCaption, 
  generatePenitipConfirmationWhatsAppUrl 
} from '../utils/captionGenerator';
import { WatermarkedImagePreview } from './WatermarkedImagePreview';

interface ContentOutputCardProps {
  item: ConsignmentItem;
  onUpdatePostStatus: (id: string, newPostStatus: AdminPostStatus) => void;
  onUpdateGeneralStatus: (id: string, newStatus: SubmissionStatus) => void;
  onDelete: (id: string) => void;
  onOpenQR: (item: ConsignmentItem) => void;
  onDownloadPDF: (item: ConsignmentItem) => void;
}

const POST_STATUSES: { value: AdminPostStatus; label: string; badge: string; border: string }[] = [
  { value: 'Draft', label: 'Draft', badge: 'bg-slate-100 text-slate-700', border: 'border-slate-300' },
  { value: 'Ready to Post', label: 'Ready to Post', badge: 'bg-amber-100 text-amber-900', border: 'border-amber-400' },
  { value: 'Posted', label: 'Posted (Live)', badge: 'bg-blue-100 text-blue-900', border: 'border-blue-400' },
  { value: 'Sold Out', label: 'Sold Out', badge: 'bg-emerald-100 text-emerald-900', border: 'border-emerald-400' },
];

export const ContentOutputCard: React.FC<ContentOutputCardProps> = ({
  item,
  onUpdatePostStatus,
  onUpdateGeneralStatus,
  onDelete,
  onOpenQR,
  onDownloadPDF,
}) => {
  const [captionTab, setCaptionTab] = useState<'feed' | 'story'>('feed');
  const [isCopied, setIsCopied] = useState(false);

  const estimates = calculateListingEstimates(item.nettPrice);
  const tenor = getTenorTimeline(item.createdAt);

  const feedCaption = generateInstagramFeedCaption(item);
  const storyCaption = generateInstagramStoryCaption(item);
  const activeCaption = captionTab === 'feed' ? feedCaption : storyCaption;

  const currentPostStatus = item.postStatus || (
    item.status === 'Terjual' || item.status === 'Selesai & Dicairkan'
      ? 'Sold Out'
      : item.status === 'Sedang Dipajang (Live)'
      ? 'Posted'
      : item.status === 'Diterima'
      ? 'Ready to Post'
      : 'Draft'
  );

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(activeCaption);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const confirmationWaUrl = generatePenitipConfirmationWhatsAppUrl(item);

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm hover:shadow-md hover:border-[#1B365D]/40 transition-all overflow-hidden">
      {/* Top Card Header */}
      <div className="bg-[#1B365D] text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-amber-400">
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-[#1B365D] font-mono font-black text-xs">
            {item.id}
          </span>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base leading-tight">
              {item.itemNameAndBrand}
            </h3>
            <span className="text-[11px] text-amber-200/90">
              Kategori: {item.category} • Domisili: Kec. {item.kecamatan}
            </span>
          </div>
        </div>

        {/* Post Status Pill Selector (Requested Feature) */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[11px] text-slate-300 font-semibold hidden sm:inline">
            Status Post:
          </span>

          <div className="flex bg-black/30 p-1 rounded-xl border border-white/20">
            {POST_STATUSES.map((statusObj) => {
              const isActive = currentPostStatus === statusObj.value;
              return (
                <button
                  key={statusObj.value}
                  type="button"
                  onClick={() => {
                    onUpdatePostStatus(item.id, statusObj.value);
                    if (statusObj.value === 'Posted') onUpdateGeneralStatus(item.id, 'Sedang Dipajang (Live)');
                    if (statusObj.value === 'Sold Out') onUpdateGeneralStatus(item.id, 'Terjual');
                    if (statusObj.value === 'Ready to Post') onUpdateGeneralStatus(item.id, 'Diterima');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-400 text-[#1B365D] shadow-sm scale-100 font-black'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {statusObj.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              if (confirm(`Hapus item ${item.id} (${item.itemNameAndBrand})?`)) {
                onDelete(item.id);
              }
            }}
            className="p-1.5 rounded-lg text-white/60 hover:text-rose-400 hover:bg-white/10 transition-colors ml-1 cursor-pointer"
            title="Hapus data"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Left (Watermarked Photos) & Right (Auto-Caption & Admin Tools) */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Watermarked Photos Studio (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Foto Ber-Watermark Otomatis</span>
            </span>

            <span className="text-[11px] text-slate-500">
              {item.photos?.length || 0} Foto Terupload
            </span>
          </div>

          {/* Interactive Watermarked Preview component */}
          <WatermarkedImagePreview
            photos={item.photos || []}
            itemId={item.id}
            itemName={item.itemNameAndBrand}
          />

          {/* Pricing Summary Box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold">
              <span className="text-slate-500">Harga Nett Penitip:</span>
              <span className="text-slate-800 font-mono text-sm">{formatRupiah(item.nettPrice)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-500">
              <span>Biaya Jasa Titip ({estimates.rateDescription}):</span>
              <span className="text-amber-700 font-semibold font-mono">+{formatRupiah(estimates.estimatedFee)}</span>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 font-black text-sm">
              <span className="text-[#1B365D]">Harga Jual Feed (Tayang):</span>
              <span className="text-emerald-700 font-mono text-base">{formatRupiah(estimates.suggestedListingPrice)}</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Auto-Caption Instagram & Admin Actions (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          <div>
            {/* Caption Header & Format Selector */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <Instagram className="w-4 h-4 text-pink-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Auto-Generate Caption
                </span>
              </div>

              {/* Feed vs Story Tab */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCaptionTab('feed')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    captionTab === 'feed'
                      ? 'bg-white text-[#1B365D] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Instagram Feed
                </button>
                <button
                  type="button"
                  onClick={() => setCaptionTab('story')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    captionTab === 'story'
                      ? 'bg-white text-[#1B365D] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Story Text
                </button>
              </div>
            </div>

            {/* Caption Box Preview */}
            <div className="mt-3 relative group">
              <textarea
                readOnly
                rows={10}
                value={activeCaption}
                className="w-full p-4 text-xs sm:text-sm font-sans rounded-2xl bg-slate-50 border border-slate-300 text-slate-800 leading-relaxed focus:outline-hidden resize-none selection:bg-amber-200"
              />

              {/* Float Copy Button */}
              <div className="absolute top-3 right-3">
                <button
                  type="button"
                  onClick={handleCopyCaption}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer ${
                    isCopied
                      ? 'bg-emerald-600 text-white scale-105'
                      : 'bg-[#1B365D] hover:bg-[#24477A] text-white'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>✓ Teks Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-400" />
                      <span>Copy Caption</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Action Row: WA to Penitip & Document Tools */}
          <div className="space-y-3 pt-2">
            {/* Primary Action: Kirim Konfirmasi WA ke Penitip (Requested Feature) */}
            <a
              href={confirmationWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all group"
            >
              <MessageCircle className="w-4 h-4 fill-white/20 text-white shrink-0 group-hover:scale-110 transition-transform" />
              <span>Kirim Konfirmasi WA ke Penitip</span>
              <span className="text-[11px] font-normal text-emerald-100 hidden sm:inline">
                (Kabar Barang Siap Diposting)
              </span>
            </a>

            {/* Quick Utility Tools */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Penitip: <strong>{item.fullName}</strong></span>
                <span>•</span>
                <span>Rek/E-Wallet: <strong>{item.bankAccount}</strong></span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenQR(item)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  title="Lihat Kode QR"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-700" />
                  <span>QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDownloadPDF(item)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  title="Download Bukti PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-[#1B365D]" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
