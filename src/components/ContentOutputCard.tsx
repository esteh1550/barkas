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
  Trash2,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';
import { ConsignmentItem, AdminPostStatus, SubmissionStatus } from '../types/consignment';
import { formatRupiah, calculateListingEstimates, getTenorTimeline } from '../utils/formatters';
import { 
  generateInstagramFeedCaption, 
  generateInstagramStoryCaption, 
  generatePenitipConfirmationWhatsAppUrl,
  generatePriceDropWhatsAppUrl
} from '../utils/captionGenerator';
import { WatermarkedImagePreview } from './WatermarkedImagePreview';

interface ContentOutputCardProps {
  item: ConsignmentItem;
  onUpdatePostStatus: (id: string, newPostStatus: AdminPostStatus) => void;
  onUpdateGeneralStatus: (id: string, newStatus: SubmissionStatus) => void;
  onUpdateAdminNotes?: (
    id: string,
    notes: {
      adminRackLocation?: string;
      adminBottomNettPrice?: number;
      adminInternalNotes?: string;
    }
  ) => Promise<void>;
  onDelete: (id: string) => void;
  onOpenQR: (item: ConsignmentItem) => void;
  onDownloadPDF: (item: ConsignmentItem) => void;
  onOpenPayoutReceipt?: (item: ConsignmentItem) => void;
  onOpenBuyerInvoice?: (item: ConsignmentItem) => void;
  onOpenEditPrice?: (item: ConsignmentItem) => void;
}

const POST_STATUSES: { value: AdminPostStatus; label: string; badge: string; border: string }[] = [
  { value: 'Draft', label: 'Draft', badge: 'bg-slate-100 text-slate-700', border: 'border-slate-300' },
  { value: 'Ready to Post', label: 'Ready to Post', badge: 'bg-amber-100 text-amber-900', border: 'border-amber-400' },
  { value: 'Posted', label: 'Posted (Live)', badge: 'bg-blue-100 text-blue-900', border: 'border-blue-400' },
  { value: 'Booked', label: 'Booked (Di-DP)', badge: 'bg-orange-100 text-orange-900', border: 'border-orange-400' },
  { value: 'Sold Out', label: 'Sold Out', badge: 'bg-emerald-100 text-emerald-900', border: 'border-emerald-400' },
];

export const ContentOutputCard: React.FC<ContentOutputCardProps> = ({
  item,
  onUpdatePostStatus,
  onUpdateGeneralStatus,
  onUpdateAdminNotes,
  onDelete,
  onOpenQR,
  onDownloadPDF,
  onOpenPayoutReceipt,
  onOpenBuyerInvoice,
  onOpenEditPrice,
}) => {
  const [captionTab, setCaptionTab] = useState<'feed' | 'story'>('feed');
  const [isCopied, setIsCopied] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(
    Boolean(item.adminRackLocation || item.adminBottomNettPrice || item.adminInternalNotes)
  );
  const [rackLocationInput, setRackLocationInput] = useState(item.adminRackLocation || '');
  const [bottomNettInput, setBottomNettInput] = useState(
    item.adminBottomNettPrice ? item.adminBottomNettPrice.toLocaleString('id-ID') : ''
  );
  const [internalNotesInput, setInternalNotesInput] = useState(item.adminInternalNotes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedToast, setNotesSavedToast] = useState(false);

  const estimates = calculateListingEstimates(item.nettPrice);
  const hasPriceDrop =
    typeof item.previousNettPrice === 'number' && item.previousNettPrice > item.nettPrice;
  const prevEstimates = hasPriceDrop
    ? calculateListingEstimates(item.previousNettPrice!)
    : null;
  const discountPct = hasPriceDrop
    ? Math.round(((item.previousNettPrice! - item.nettPrice) / item.previousNettPrice!) * 100)
    : 0;
  const tenor = getTenorTimeline(item.createdAt);

  const feedCaption = generateInstagramFeedCaption(item);
  const storyCaption = generateInstagramStoryCaption(item);
  const activeCaption = captionTab === 'feed' ? feedCaption : storyCaption;

  const currentPostStatus = item.postStatus || (
    item.status === 'Terjual' || item.status === 'Selesai & Dicairkan'
      ? 'Sold Out'
      : item.status === 'Booked (Di-DP)'
      ? 'Booked'
      : item.status === 'Sedang Dipajang (Live)'
      ? 'Posted'
      : item.status === 'Diterima'
      ? 'Ready to Post'
      : 'Draft'
  );

  const handleSaveInternalNotes = async () => {
    if (!onUpdateAdminNotes) return;
    setIsSavingNotes(true);
    try {
      const numericBottom = Number(bottomNettInput.replace(/[^0-9]/g, '')) || 0;
      await onUpdateAdminNotes(item.id, {
        adminRackLocation: rackLocationInput.trim(),
        adminBottomNettPrice: numericBottom > 0 ? numericBottom : undefined,
        adminInternalNotes: internalNotesInput.trim(),
      });
      setNotesSavedToast(true);
      setTimeout(() => setNotesSavedToast(false), 2500);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(activeCaption);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const confirmationWaUrl = generatePenitipConfirmationWhatsAppUrl(item);
  const priceDropWaUrl = generatePriceDropWhatsAppUrl(item);

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm hover:shadow-md hover:border-[#1B365D]/40 transition-all overflow-hidden">
      {/* Top Card Header */}
      <div className="bg-[#1B365D] text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-amber-400">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-[#1B365D] font-mono font-black text-xs">
            {item.id}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                {item.itemNameAndBrand}
              </h3>
              {tenor.isExpired ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white border border-rose-300">
                  🚨 Hari ke-{tenor.elapsedDays}: Tenor 30 Hari Habis
                </span>
              ) : tenor.isPriceDropPeriod ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-[#1B365D] border border-amber-200">
                  ⚠️ Hari ke-{tenor.elapsedDays}/30: Waktunya Opsi Price Drop
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/15 text-amber-200 border border-white/20">
                  ⏳ Hari ke-{tenor.elapsedDays}/30 (Sisa {tenor.remainingDays} hari)
                </span>
              )}
            </div>
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
                    if (statusObj.value === 'Booked') onUpdateGeneralStatus(item.id, 'Booked (Di-DP)');
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

          {isConfirmingDelete ? (
            <div className="flex items-center gap-1.5 bg-rose-600/90 text-white px-2.5 py-1 rounded-xl text-xs border border-rose-300/40 shadow-sm animate-in fade-in">
              <span className="text-[11px] font-semibold text-white">Yakin hapus?</span>
              <button
                type="button"
                onClick={() => {
                  onDelete(item.id);
                  setIsConfirmingDelete(false);
                }}
                className="px-2 py-0.5 bg-white text-rose-700 font-bold rounded-md hover:bg-rose-50 text-[11px] cursor-pointer shadow-xs"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-2 py-0.5 bg-black/20 hover:bg-black/30 text-white rounded-md text-[11px] cursor-pointer"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className="p-1.5 rounded-lg text-white/60 hover:text-rose-400 hover:bg-white/10 transition-colors ml-1 cursor-pointer flex items-center gap-1"
              title="Hapus pengajuan ini"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline text-white/60 hover:text-rose-300">Hapus</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left (Watermarked Photos) & Right (Auto-Caption & Admin Tools) */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Watermarked Photos Studio (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Studio Foto, Poster Story & Stempel
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
            kecamatan={item.kecamatan}
            category={item.category}
            size={item.size}
            condition={item.condition}
            listingPrice={estimates.suggestedListingPrice}
            originalListingPrice={prevEstimates?.suggestedListingPrice}
            priceDropText={hasPriceDrop ? `TURUN HARGA -${discountPct}%` : undefined}
            isSoldStatus={
              item.status === 'Terjual' ||
              item.status === 'Selesai & Dicairkan' ||
              currentPostStatus === 'Sold Out'
            }
          />

          {/* Pricing Summary Box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-600">
                {hasPriceDrop ? 'Harga Nett Promo:' : 'Harga Nett Penitip:'}
              </span>
              <div className="flex items-center gap-2">
                {hasPriceDrop && (
                  <span className="text-[11px] font-mono text-slate-400 line-through">
                    {formatRupiah(item.previousNettPrice!)}
                  </span>
                )}
                <span className="text-slate-900 font-mono font-extrabold text-sm">
                  {formatRupiah(item.nettPrice)}
                </span>
                {onOpenEditPrice && (
                  <button
                    type="button"
                    onClick={() => onOpenEditPrice(item)}
                    className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                    title="Edit Harga / Aktifkan Promo Price Drop"
                  >
                    <TrendingDown className="w-3 h-3" />
                    <span>Edit Harga</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-slate-500">
              <span>Biaya Jasa Titip ({estimates.rateDescription}):</span>
              <span className="text-amber-700 font-semibold font-mono">+{formatRupiah(estimates.estimatedFee)}</span>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200 font-black text-sm">
              <span className="text-[#1B365D]">Harga Jual Feed (Tayang):</span>
              <div className="text-right">
                {prevEstimates && (
                  <span className="text-[11px] font-mono text-slate-400 line-through mr-2">
                    {formatRupiah(prevEstimates.suggestedListingPrice)}
                  </span>
                )}
                <span className="text-emerald-700 font-mono text-base">
                  {formatRupiah(estimates.suggestedListingPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Private Admin Notes, Rack Location & Bottom Nett Price */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setIsNotesOpen((prev) => !prev)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <span>🔒 Catatan Internal Gudang & Rak</span>
                {item.adminRackLocation && (
                  <span className="px-2 py-0.5 rounded-md bg-[#1B365D] text-amber-300 font-mono text-[10px]">
                    {item.adminRackLocation}
                  </span>
                )}
              </span>
              <span className="text-[10px] text-[#1B365D] font-semibold">
                {isNotesOpen ? 'Tutup ▲' : 'Edit ▼'}
              </span>
            </button>

            {isNotesOpen && (
              <div className="p-3.5 border-t border-slate-200 bg-white space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Kode Rak / Lokasi Simpan
                    </label>
                    <input
                      type="text"
                      value={rackLocationInput}
                      onChange={(e) => setRackLocationInput(e.target.value)}
                      placeholder="Contoh: Rak A-02 / Box 4"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:border-[#1B365D] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Batas Nego Mentok Penitip (Rp)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={bottomNettInput}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        setBottomNettInput(raw ? Number(raw).toLocaleString('id-ID') : '');
                      }}
                      placeholder="Contoh: 300.000"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono bg-slate-50 focus:bg-white focus:border-[#1B365D] focus:outline-hidden"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Catatan Rahasia Admin (DP / Janji COD / Kelengkapan)
                  </label>
                  <input
                    type="text"
                    value={internalNotesInput}
                    onChange={(e) => setInternalNotesInput(e.target.value)}
                    placeholder="Contoh: Sudah di-DP 50rb oleh Kang Dani, pelunasan Sabtu sore"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:border-[#1B365D] focus:outline-hidden"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-400">
                    Hanya terlihat di /admin (disembunyikan dari publik)
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveInternalNotes}
                    disabled={isSavingNotes}
                    className="px-3 py-1.5 rounded-lg bg-[#1B365D] hover:bg-[#24477A] text-white font-bold text-[11px] cursor-pointer disabled:opacity-60"
                  >
                    {notesSavedToast
                      ? '✓ Tersimpan'
                      : isSavingNotes
                      ? 'Menyimpan...'
                      : 'Simpan Catatan'}
                  </button>
                </div>
              </div>
            )}
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

              <div className="flex items-center gap-1.5 flex-wrap">
                <a
                  href={priceDropWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  title="Kirim WA Opsi Turun Harga (Hari ke-20)"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>WA Price Drop (H-20)</span>
                </a>

                {onOpenPayoutReceipt && (
                  <button
                    type="button"
                    onClick={() => onOpenPayoutReceipt(item)}
                    className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    title="Buat Kwitansi Pencairan Dana Lunas (PDF & WA)"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Kwitansi Cair</span>
                  </button>
                )}

                {onOpenBuyerInvoice && (
                  <button
                    type="button"
                    onClick={() => onOpenBuyerInvoice(item)}
                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    title="Cetak Nota Pembelian / Invoice COD & Rekber (PDF)"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-700" />
                    <span>Nota Pembeli</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const cleanTicket = item.id.replace(/^#/, '');
                    const url = `${window.location.origin}/?item=${encodeURIComponent(cleanTicket)}`;
                    navigator.clipboard.writeText(url);
                    setIsCopiedLink(true);
                    setTimeout(() => setIsCopiedLink(false), 2500);
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  title="Salin Link Etalase Barang Ini (Untuk IG Story Link)"
                >
                  {isCopiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Link Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-[#1B365D]" />
                      <span>Link Etalase</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onOpenQR(item)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  title="Lihat Kode QR & Cetak Label Hangtag Gudang"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-700" />
                  <span>QR & Hangtag</span>
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
