import React, { useState, useEffect } from 'react';
import {
  X,
  FileDown,
  MessageCircle,
  CheckCircle2,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { ConsignmentItem, SubmissionStatus } from '../types/consignment';
import { formatRupiah, calculateListingEstimates, parseRupiahInput } from '../utils/formatters';
import { generatePayoutReceiptPDF } from '../utils/pdfGenerator';
import { generatePayoutWhatsAppUrl } from '../utils/captionGenerator';

interface PayoutReceiptModalProps {
  item: ConsignmentItem | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: SubmissionStatus) => void;
}

export const PayoutReceiptModal: React.FC<PayoutReceiptModalProps> = ({
  item,
  onClose,
  onUpdateStatus,
}) => {
  const [finalPayoutRaw, setFinalPayoutRaw] = useState('');
  const [soldPriceRaw, setSoldPriceRaw] = useState('');
  const [transferMethod, setTransferMethod] = useState('Transfer Bank / SeaBank / E-Wallet');
  const [transferReference, setTransferReference] = useState('');
  const [payoutNotes, setPayoutNotes] = useState(
    'Pencairan 100% utuh sesuai kesepakatan harga bersih (nett) penitip'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [markedComplete, setMarkedComplete] = useState(false);

  useEffect(() => {
    if (item) {
      const est = calculateListingEstimates(item.nettPrice);
      setFinalPayoutRaw(item.nettPrice.toLocaleString('id-ID'));
      setSoldPriceRaw(est.suggestedListingPrice.toLocaleString('id-ID'));
      setTransferMethod(item.bankAccount || 'Transfer Bank / E-Wallet');
      setTransferReference(`TRX-${item.id.replace(/[^0-9]/g, '')}`);
      setMarkedComplete(item.status === 'Selesai & Dicairkan');
    }
  }, [item]);

  if (!item) return null;

  const finalPayoutAmount = parseRupiahInput(finalPayoutRaw) || item.nettPrice;
  const soldListingPrice = parseRupiahInput(soldPriceRaw) || finalPayoutAmount;
  const adminFeeAmount = Math.max(0, soldListingPrice - finalPayoutAmount);

  const handleDownloadPayoutPDF = async () => {
    setIsGenerating(true);
    try {
      await generatePayoutReceiptPDF(item, {
        finalPayoutAmount,
        soldListingPrice,
        adminFeeAmount,
        transferMethod,
        transferReference,
        payoutNotes,
      });
      if (item.status !== 'Selesai & Dicairkan') {
        onUpdateStatus(item.id, 'Selesai & Dicairkan');
        setMarkedComplete(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyPriceDrop10Percent = () => {
    const droppedNett = Math.round((item.nettPrice * 0.9) / 5000) * 5000;
    const est = calculateListingEstimates(droppedNett);
    setFinalPayoutRaw(droppedNett.toLocaleString('id-ID'));
    setSoldPriceRaw(est.suggestedListingPrice.toLocaleString('id-ID'));
    setPayoutNotes('Pencairan sesuai kesepakatan Opsi Turun Harga (Price Drop H-20)');
  };

  const payoutWaUrl = generatePayoutWhatsAppUrl(
    item,
    finalPayoutAmount,
    transferMethod,
    transferReference
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-emerald-700 text-white px-5 py-4 flex items-center justify-between border-b-2 border-amber-300">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                Kwitansi Pencairan Dana (Payout Receipt)
              </h3>
              <p className="text-[11px] text-emerald-100">
                Tiket {item.id} • {item.fullName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Item Summary */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Barang Terjual</span>
              <strong className="text-slate-900 text-sm">{item.itemNameAndBrand}</strong>
              <span className="text-[11px] text-slate-500 block">
                Rekening Penitip: <strong>{item.bankAccount}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleApplyPriceDrop10Percent}
              className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] shrink-0 cursor-pointer transition-colors"
              title="Hitung otomatis jika barang laku lewat program Price Drop -10%"
            >
              Simulasi Price Drop (-10%)
            </button>
          </div>

          {/* Editable Financial Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dana Bersih Diterima Penitip (Rp)
              </label>
              <input
                type="text"
                value={finalPayoutRaw}
                onChange={(e) => {
                  const n = parseRupiahInput(e.target.value);
                  setFinalPayoutRaw(n ? n.toLocaleString('id-ID') : '');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-extrabold text-sm text-emerald-800 bg-emerald-50/50 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Harga Deal Pembeli (Rp)
              </label>
              <input
                type="text"
                value={soldPriceRaw}
                onChange={(e) => {
                  const n = parseRupiahInput(e.target.value);
                  setSoldPriceRaw(n ? n.toLocaleString('id-ID') : '');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm text-slate-800 bg-slate-50 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rekening / Metode Transfer
              </label>
              <input
                type="text"
                value={transferMethod}
                onChange={(e) => setTransferMethod(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Referensi Transfer
              </label>
              <input
                type="text"
                value={transferReference}
                onChange={(e) => setTransferReference(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono bg-slate-50 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Kwitansi
            </label>
            <input
              type="text"
              value={payoutNotes}
              onChange={(e) => setPayoutNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-2xl bg-emerald-900 text-white flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-200 block">
                Total Dicairkan ke {item.fullName}
              </span>
              <strong className="text-lg font-mono font-black text-amber-300">
                {formatRupiah(finalPayoutAmount)}
              </strong>
            </div>
            <div className="text-right text-xs">
              <span className="text-emerald-200 block">Bagi Hasil Admin</span>
              <strong className="font-mono">{formatRupiah(adminFeeAmount)}</strong>
            </div>
          </div>

          {markedComplete && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Status barang otomatis ditandai "Selesai & Dicairkan".</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleDownloadPayoutPDF}
              disabled={isGenerating}
              className="py-3 px-4 rounded-xl bg-[#1B365D] hover:bg-[#24477A] text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-amber-400" />
              <span>{isGenerating ? 'Membuat Kwitansi...' : 'Unduh Kwitansi PDF'}</span>
            </button>

            <a
              href={payoutWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (item.status !== 'Selesai & Dicairkan') {
                  onUpdateStatus(item.id, 'Selesai & Dicairkan');
                  setMarkedComplete(true);
                }
              }}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Kirim Notifikasi WA Lunas</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
