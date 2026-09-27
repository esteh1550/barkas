import React, { useState, useEffect } from 'react';
import { X, TrendingDown, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';
import { ConsignmentItem } from '../types/consignment';
import { formatRupiah, calculateListingEstimates, parseRupiahInput } from '../utils/formatters';

interface EditPriceModalProps {
  item: ConsignmentItem | null;
  onClose: () => void;
  onSavePrice: (ticketId: string, newNettPrice: number, previousNettPrice?: number) => Promise<void>;
}

export const EditPriceModal: React.FC<EditPriceModalProps> = ({
  item,
  onClose,
  onSavePrice,
}) => {
  const [newNettRaw, setNewNettRaw] = useState('');
  const [markAsPriceDrop, setMarkAsPriceDrop] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setNewNettRaw(item.nettPrice.toLocaleString('id-ID'));
      setMarkAsPriceDrop(true);
    }
  }, [item]);

  if (!item) return null;

  const baseOriginalNett =
    item.previousNettPrice && item.previousNettPrice > item.nettPrice
      ? item.previousNettPrice
      : item.nettPrice;

  const parsedNewNett = parseRupiahInput(newNettRaw) || 0;
  const newEstimates = calculateListingEstimates(parsedNewNett > 0 ? parsedNewNett : item.nettPrice);
  const oldEstimates = calculateListingEstimates(baseOriginalNett);

  const applyPercentageDiscount = (percent: number) => {
    const discounted = Math.round((baseOriginalNett * (1 - percent / 100)) / 5000) * 5000;
    setNewNettRaw(Math.max(10000, discounted).toLocaleString('id-ID'));
    setMarkAsPriceDrop(true);
  };

  const handleRestoreOriginal = () => {
    setNewNettRaw(baseOriginalNett.toLocaleString('id-ID'));
    setMarkAsPriceDrop(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedNewNett < 10000) return;
    setIsSaving(true);
    try {
      const prevPriceToStore =
        markAsPriceDrop && parsedNewNett < baseOriginalNett ? baseOriginalNett : 0;
      await onSavePrice(item.id, parsedNewNett, prevPriceToStore);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const discountPercent =
    parsedNewNett > 0 && parsedNewNett < baseOriginalNett
      ? Math.round(((baseOriginalNett - parsedNewNett) / baseOriginalNett) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-[#1B365D] text-white px-5 py-4 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-[#1B365D] flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                Edit Harga & Promo Price Drop
              </h3>
              <p className="text-[11px] text-amber-200">
                {item.id} • {item.itemNameAndBrand}
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Harga Nett Awal Penitip</span>
              <strong className="text-slate-800 font-mono text-sm">
                {formatRupiah(baseOriginalNett)}
              </strong>
              <span className="text-[10px] text-slate-500 block">
                Tayang Awal: {formatRupiah(oldEstimates.suggestedListingPrice)}
              </span>
            </div>
            {item.previousNettPrice && item.previousNettPrice > item.nettPrice && (
              <button
                type="button"
                onClick={handleRestoreOriginal}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px] cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Kembalikan Awal</span>
              </button>
            )}
          </div>

          {/* Quick Price Drop Presets */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700 block">
              Opsi Cepat Turun Harga (SOP Evaluasi H-20):
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => applyPercentageDiscount(pct)}
                  className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-extrabold text-xs transition-colors cursor-pointer"
                >
                  Turun -{pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Custom Nett Price Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Harga Bersih (Nett) Baru Penitip (Rp):
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={newNettRaw}
              onChange={(e) => {
                const n = parseRupiahInput(e.target.value);
                setNewNettRaw(n ? n.toLocaleString('id-ID') : '');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-extrabold text-sm text-[#1B365D] bg-slate-50 focus:bg-white focus:border-[#1B365D] focus:outline-hidden"
            />
          </div>

          {/* Toggle Badge Price Drop */}
          {parsedNewNett < baseOriginalNett && (
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={markAsPriceDrop}
                onChange={(e) => setMarkAsPriceDrop(e.target.checked)}
                className="mt-0.5 rounded text-[#1B365D]"
              />
              <span className="text-amber-900 leading-relaxed">
                <strong>Tampilkan Badge "TURUN HARGA (-{discountPercent}%)"</strong> & Harga Coret di Etalase Live, Watermark Foto, serta Caption Instagram.
              </span>
            </label>
          )}

          {/* New Listing Price Preview */}
          <div className="p-4 rounded-2xl bg-[#1B365D] text-white flex items-center justify-between">
            <div>
              <span className="text-[10px] text-amber-200 block">
                Estimasi Harga Tayang Baru
              </span>
              <strong className="text-base sm:text-lg font-mono font-black text-amber-300">
                {formatRupiah(newEstimates.suggestedListingPrice)}
              </strong>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-300 block">Bagi Hasil Admin</span>
              <strong className="font-mono text-emerald-300">
                + {formatRupiah(newEstimates.estimatedFee)}
              </strong>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving || parsedNewNett < 10000}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Perubahan Harga</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
