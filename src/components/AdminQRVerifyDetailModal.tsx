import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  MessageCircle,
  Copy,
  Check,
  QrCode,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ConsignmentItem, SubmissionStatus } from '../types/consignment';
import {
  formatRupiah,
  calculateListingEstimates,
  getTenorTimeline,
  generateAdminWhatsAppUrl,
} from '../utils/formatters';
import { getTicketVerificationUrl } from '../utils/qrCode';

interface AdminQRVerifyDetailModalProps {
  item: ConsignmentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: SubmissionStatus) => void;
  onOpenQRModal: (item: ConsignmentItem) => void;
  onOpenBuyerInvoice: (item: ConsignmentItem) => void;
  onOpenPayoutReceipt: (item: ConsignmentItem) => void;
  onDownloadPDF: (item: ConsignmentItem) => void;
}

const ALL_STATUSES: SubmissionStatus[] = [
  'Menunggu Kurasi',
  'Diterima',
  'Sedang Dipajang (Live)',
  'Terjual',
  'Selesai & Dicairkan',
  'Ditolak',
];

export const AdminQRVerifyDetailModal: React.FC<AdminQRVerifyDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  onUpdateStatus,
  onOpenQRModal,
  onOpenBuyerInvoice,
  onOpenPayoutReceipt,
  onDownloadPDF,
}) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !item) return null;

  const estimates = calculateListingEstimates(item.nettPrice);
  const tenor = getTenorTimeline(item.createdAt);
  const photos = item.photos && item.photos.length > 0 ? item.photos : [];
  const currentPhoto = photos[activePhotoIndex] || photos[0] || '';
  const verifyUrl = getTicketVerificationUrl(item.id, 'admin');

  const handleCopyBank = () => {
    navigator.clipboard.writeText(item.bankAccount);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleCopyVerifyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-4">
        {/* Verified Header */}
        <div className="bg-[#0F291E] text-white p-4 sm:p-5 flex items-start justify-between gap-3 border-b-2 border-amber-400">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-[#0F291E] flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                  TERVERIFIKASI QR BARKAS
                </span>
                <span className="font-mono text-xs font-extrabold text-amber-300">
                  {item.id}
                </span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg text-white mt-0.5 line-clamp-1">
                {item.itemNameAndBrand}
              </h3>
              <p className="text-[11px] text-stone-300">
                Terdaftar: {new Date(item.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })} · Hari ke-{tenor.elapsedDays} dari 30 Hari
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {/* Top Grid: Photo + Quick Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Photo Preview (5 cols) */}
            <div className="sm:col-span-5">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt={item.itemNameAndBrand}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                    Tidak ada foto
                  </div>
                )}

                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActivePhotoIndex((prev) =>
                          prev === 0 ? photos.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActivePhotoIndex((prev) =>
                          prev === photos.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/65 text-white text-[10px] font-mono">
                      {activePhotoIndex + 1}/{photos.length}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Item Specs & Financial Breakdown (7 cols) */}
            <div className="sm:col-span-7 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                    {item.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                    Size: {item.size || 'All Size'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    {item.condition}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Deskripsi & Kondisi Fisik / Minus
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {item.descriptionAndFlaws}
                  </p>
                </div>
              </div>

              {/* Financial Box */}
              <div className="p-3.5 rounded-2xl bg-[#1B365D] text-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Harga Nett Penitip:</span>
                  <span className="font-mono font-bold text-white">
                    {formatRupiah(item.nettPrice)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">
                    Bagian Admin ({estimates.rateDescription}):
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    + {formatRupiah(estimates.estimatedFee)}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/15 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase">
                    Harga Tayang Etalase:
                  </span>
                  <span className="font-mono text-base font-extrabold text-white">
                    {formatRupiah(estimates.suggestedListingPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Consignor (Penitip) Identity & Payout Info */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-700">
                Data Penitip & Rekening Pencairan
              </h4>
              <span className="text-xs font-semibold text-stone-500">
                Kec. {item.kecamatan}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-stone-200/80">
                <span className="text-[10px] text-stone-400 block">Nama Lengkap Penitip</span>
                <span className="font-bold text-stone-900 text-sm">{item.fullName}</span>
                <span className="text-[11px] text-stone-500 block mt-0.5 font-mono">
                  WA: {item.whatsappNumber}
                </span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-stone-200/80 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] text-stone-400 block">
                    Rekening / E-Wallet Pencairan
                  </span>
                  <span className="font-bold text-stone-900 font-mono text-xs break-all">
                    {item.bankAccount}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyBank}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[11px] shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  {copiedBank ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Direct Status Verification Switcher */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Update Status Verifikasi Barang (1-Klik)
              </span>
              <span className="text-xs font-bold text-[#1B365D]">
                Status Saat Ini: {item.status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {ALL_STATUSES.map((st) => {
                const isActive = item.status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onUpdateStatus(item.id, st)}
                    className={`px-2.5 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-[#0F291E] text-amber-300 border-[#0F291E] shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <a
              href={generateAdminWhatsAppUrl(item)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Hubungi Penitip</span>
            </a>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenQRModal(item);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-[#1B365D]" />
              <span>QR & Hangtag</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBuyerInvoice(item);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-bold transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-800" />
              <span>Nota Pembeli</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPayoutReceipt(item);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#1B365D] hover:bg-[#24477A] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>Kwitansi Cair</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopyVerifyLink}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B365D] hover:underline cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Link Verifikasi Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Link Verifikasi QR</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDownloadPDF(item)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Unduh PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              Selesai Verifikasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
