import React, { useMemo } from 'react';
import { MessageCircle } from 'lucide-react';
import { ConsignmentItem, SubmissionStatus } from '../types/consignment';
import { formatRupiah, getTenorTimeline } from '../utils/formatters';
import { generatePriceDropWhatsAppUrl } from '../utils/captionGenerator';

interface AdminPriorityActionCenterProps {
  submissions: ConsignmentItem[];
  onFilterByStatus: (statusTab: string) => void;
  onUpdateStatus: (id: string, newStatus: SubmissionStatus) => void;
  onOpenEditPrice: (item: ConsignmentItem) => void;
  onOpenPayoutReceipt: (item: ConsignmentItem) => void;
}

export const AdminPriorityActionCenter: React.FC<AdminPriorityActionCenterProps> = ({
  submissions,
  onFilterByStatus,
  onUpdateStatus,
  onOpenEditPrice,
  onOpenPayoutReceipt,
}) => {
  const priorityData = useMemo(() => {
    const needsCuration = submissions.filter((s) => s.status === 'Menunggu Kurasi');

    const needsPriceDropEval = submissions.filter((s) => {
      if (s.status !== 'Sedang Dipajang (Live)' && s.status !== 'Diterima') return false;
      const hasDropped =
        typeof s.previousNettPrice === 'number' && s.previousNettPrice > s.nettPrice;
      if (hasDropped) return false;
      const tenor = getTenorTimeline(s.createdAt);
      return tenor.elapsedDays >= 20;
    });

    const needsPayout = submissions.filter((s) => s.status === 'Terjual');

    return {
      needsCuration,
      needsPriceDropEval,
      needsPayout,
      totalTasks:
        needsCuration.length + needsPriceDropEval.length + needsPayout.length,
    };
  }, [submissions]);

  if (submissions.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
            Action Center Operasional · Admin Esteh
          </span>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
            Tugas Prioritas Admin Hari Ini
          </h2>
        </div>

        <span className="text-xs font-bold text-slate-600 tabular-nums">
          {priorityData.totalTasks === 0
            ? 'Semua antrean prioritas telah selesai'
            : `${priorityData.totalTasks} tindak lanjut menunggu`}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Perlu Kurasi Segera */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800">
                01. Antrean Kurasi Baru
              </span>
              <span className="font-mono font-black text-sm text-amber-700 tabular-nums">
                {priorityData.needsCuration.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Barang baru masuk yang menunggu pengecekan fisik & persetujuan tayang.
            </p>

            {priorityData.needsCuration.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {priorityData.needsCuration.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] text-slate-400 block">
                        {item.id} · {item.fullName}
                      </span>
                      <strong className="text-slate-800 truncate block">
                        {item.itemNameAndBrand}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(item.id, 'Sedang Dipajang (Live)')}
                      className="px-2.5 py-1 rounded-lg bg-[#1B365D] text-white font-bold text-[10px] shrink-0 cursor-pointer hover:opacity-90"
                      title="Setujui & Langsung Pajang ke Etalase Live"
                    >
                      Tayangkan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onFilterByStatus('Menunggu Kurasi')}
            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Lihat Antrean Kurasi ({priorityData.needsCuration.length})
          </button>
        </div>

        {/* Column 2: Evaluasi H-20 (Opsi Price Drop) */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800">
                02. Evaluasi H-20 (Price Drop)
              </span>
              <span className="font-mono font-black text-sm text-rose-600 tabular-nums">
                {priorityData.needsPriceDropEval.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Barang tayang ≥ 20 hari yang belum turun harga sesuai SOP masa titip 30 hari.
            </p>

            {priorityData.needsPriceDropEval.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {priorityData.needsPriceDropEval.slice(0, 2).map((item) => {
                  const tenor = getTenorTimeline(item.createdAt);
                  const waUrl = generatePriceDropWhatsAppUrl(item);
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] text-rose-600 font-bold block">
                          Hari ke-{tenor.elapsedDays}/30 · {item.id}
                        </span>
                        <strong className="text-slate-800 truncate block">
                          {item.itemNameAndBrand}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onOpenEditPrice(item)}
                          className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[10px] cursor-pointer"
                        >
                          Diskon
                        </button>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                          title="Kirim WA Opsi Price Drop ke Penitip"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onFilterByStatus('Sedang Dipajang (Live)')}
            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Cek Barang Sedang Live ({priorityData.needsPriceDropEval.length} H-20)
          </button>
        </div>

        {/* Column 3: Menunggu Pencairan Dana (Terjual -> Selesai & Dicairkan) */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800">
                03. Siap Dicairkan ke Penitip
              </span>
              <span className="font-mono font-black text-sm text-emerald-700 tabular-nums">
                {priorityData.needsPayout.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Barang berstatus Terjual yang menunggu transfer dana bersih & kwitansi lunas.
            </p>

            {priorityData.needsPayout.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {priorityData.needsPayout.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] text-emerald-700 font-bold block">
                        Nett: {formatRupiah(item.nettPrice)} · {item.fullName}
                      </span>
                      <strong className="text-slate-800 truncate block">
                        {item.itemNameAndBrand}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenPayoutReceipt(item)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shrink-0 cursor-pointer"
                    >
                      Cairkan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onFilterByStatus('Terjual')}
            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Lihat Antrean Pencairan ({priorityData.needsPayout.length})
          </button>
        </div>
      </div>
    </div>
  );
};
