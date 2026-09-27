import React, { useMemo, useState } from 'react';
import { X, Copy, Check, MessageCircle } from 'lucide-react';
import { ConsignmentItem, ItemCategory } from '../types/consignment';
import { generateDailyStockBroadcastMessage } from '../utils/captionGenerator';

interface DailyStockBroadcastModalProps {
  submissions: ConsignmentItem[];
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: ('Semua' | 'Promo Turun Harga' | ItemCategory)[] = [
  'Semua',
  'Promo Turun Harga',
  'Fashion',
  'Sneakers / Sepatu',
  'Helm & Otomotif',
  'Gadget & Elektronik',
  'Lainnya',
];

export const DailyStockBroadcastModal: React.FC<DailyStockBroadcastModalProps> = ({
  submissions,
  isOpen,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'Semua' | 'Promo Turun Harga' | ItemCategory>('Semua');
  const [includeAccepted, setIncludeAccepted] = useState(false);
  const [copied, setCopied] = useState(false);

  const filteredLiveItems = useMemo(() => {
    return submissions.filter((item) => {
      const validStatus = includeAccepted
        ? item.status === 'Sedang Dipajang (Live)' || item.status === 'Diterima'
        : item.status === 'Sedang Dipajang (Live)';
      if (!validStatus) return false;

      if (selectedCategory === 'Semua') return true;
      if (selectedCategory === 'Promo Turun Harga') {
        return (
          typeof item.previousNettPrice === 'number' &&
          item.previousNettPrice > item.nettPrice
        );
      }
      return item.category === selectedCategory;
    });
  }, [submissions, selectedCategory, includeAccepted]);

  const broadcastText = useMemo(() => {
    return generateDailyStockBroadcastMessage(filteredLiveItems);
  }, [filteredLiveItems]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(broadcastText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(broadcastText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1B365D] text-white px-5 py-4 flex items-center justify-between border-b-2 border-amber-400">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
              Generator Promosi Harian · Admin Esteh
            </span>
            <h3 className="font-extrabold text-sm sm:text-base">
              Broadcast Rekap Stok Ready Hari Ini
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-800 block">
                Filter Kategori Stok ({filteredLiveItems.length} Barang Terpilih)
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#1B365D] text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={includeAccepted}
                onChange={(e) => setIncludeAccepted(e.target.checked)}
                className="rounded border-slate-300 text-[#1B365D]"
              />
              <span>Sertakan status "Diterima"</span>
            </label>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                Pratinjau Teks Broadcast WhatsApp Status / Saluran / Grup:
              </span>
              <span className="text-[11px] text-slate-400">
                Otomatis menyertakan harga etalase & link web
              </span>
            </div>
            <textarea
              readOnly
              value={broadcastText}
              rows={12}
              className="w-full p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed border border-slate-700 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#1B365D] hover:bg-[#24477A] text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Teks Broadcast Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-300" />
                  <span>Salin Teks Broadcast</span>
                </>
              )}
            </button>

            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Teruskan ke WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
