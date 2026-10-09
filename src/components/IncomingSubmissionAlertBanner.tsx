import React, { useEffect } from 'react';
import { BellRing, MessageCircle, Eye, X, Sparkles } from 'lucide-react';
import { ConsignmentItem } from '../types/consignment';
import { formatRupiah } from '../utils/formatters';

interface IncomingSubmissionAlertBannerProps {
  item: ConsignmentItem | null;
  onDismiss: () => void;
  onViewItem: (item: ConsignmentItem) => void;
}

export const IncomingSubmissionAlertBanner: React.FC<IncomingSubmissionAlertBannerProps> = ({
  item,
  onDismiss,
  onViewItem,
}) => {
  useEffect(() => {
    if (item) {
      // Auto dismiss after 25 seconds if not interacted
      const timer = setTimeout(() => {
        onDismiss();
      }, 25000);
      return () => clearTimeout(timer);
    }
  }, [item, onDismiss]);

  if (!item) return null;

  const cleanPhone = item.whatsappNumber.replace(/[^0-9]/g, '');
  const waLink = cleanPhone.startsWith('0') 
    ? `https://wa.me/62${cleanPhone.slice(1)}` 
    : `https://wa.me/${cleanPhone}`;

  return (
    <div className="fixed top-16 sm:top-20 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-stone-900 border-3 border-amber-400 text-stone-50 p-4 rounded-2xl shadow-[6px_6px_0px_#C25E34] overflow-hidden relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#1B365D] flex items-center justify-center shrink-0 shadow-xs animate-pulse">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.2 bg-amber-400 text-[#1B365D] font-mono font-black text-[10px] rounded uppercase">
                  BARU MASUK ⚡
                </span>
                <span className="text-[11px] font-mono text-amber-300 font-bold">
                  {item.id}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5 leading-snug line-clamp-1">
                {item.itemNameAndBrand}
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="text-stone-400 hover:text-white p-1 rounded-lg bg-stone-800 hover:bg-stone-700 cursor-pointer transition-colors"
            title="Tutup Notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-stone-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-stone-400 text-[11px] block">Harga Nett Titip:</span>
            <span className="text-amber-400 font-bold font-mono text-sm">
              {formatRupiah(item.nettPrice)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-stone-400 text-[11px] block">Penitip:</span>
            <span className="text-stone-200 font-semibold block text-xs line-clamp-1">
              {item.fullName} (Kec. {item.kecamatan})
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onViewItem(item);
              onDismiss();
            }}
            className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-[#1B365D] font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Tinjau Tiket</span>
          </button>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Chat WA</span>
          </a>
        </div>
      </div>
    </div>
  );
};
