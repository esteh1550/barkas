import React, { useMemo, useState } from 'react';
import {
  X,
  TrendingUp,
  Wallet,
  ShoppingBag,
  Award,
  MapPin,
  Download,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { ConsignmentItem, ItemCategory } from '../types/consignment';
import { formatRupiah, calculateListingEstimates } from '../utils/formatters';

interface FinancialAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: ConsignmentItem[];
}

export const FinancialAnalyticsModal: React.FC<FinancialAnalyticsModalProps> = ({
  isOpen,
  onClose,
  submissions,
}) => {
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_30_DAYS'>('ALL');

  const filteredSubmissions = useMemo(() => {
    const now = new Date();
    return submissions.filter((item) => {
      if (periodFilter === 'ALL') return true;
      const created = new Date(item.createdAt);
      if (isNaN(created.getTime())) return true;
      if (periodFilter === 'THIS_MONTH') {
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      }
      if (periodFilter === 'LAST_30_DAYS') {
        const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 30;
      }
      return true;
    });
  }, [submissions, periodFilter]);

  const metrics = useMemo(() => {
    const soldItems = filteredSubmissions.filter(
      (i) => i.status === 'Terjual' || i.status === 'Selesai & Dicairkan' || i.postStatus === 'Sold Out'
    );
    const liveItems = filteredSubmissions.filter(
      (i) => i.status === 'Sedang Dipajang (Live)'
    );

    let realizedGMV = 0;
    let realizedNettPenitip = 0;
    let realizedAdminCommission = 0;

    soldItems.forEach((item) => {
      const est = calculateListingEstimates(item.nettPrice);
      realizedGMV += est.suggestedListingPrice;
      realizedNettPenitip += item.nettPrice;
      realizedAdminCommission += est.estimatedFee;
    });

    let potentialGMV = 0;
    let potentialAdminCommission = 0;
    liveItems.forEach((item) => {
      const est = calculateListingEstimates(item.nettPrice);
      potentialGMV += est.suggestedListingPrice;
      potentialAdminCommission += est.estimatedFee;
    });

    // Category Breakdown
    const categories: ItemCategory[] = [
      'Fashion',
      'Sneakers / Sepatu',
      'Helm & Otomotif',
      'Gadget & Elektronik',
      'Lainnya',
    ];

    const categoryStats = categories.map((cat) => {
      const allInCat = filteredSubmissions.filter((i) => i.category === cat);
      const soldInCat = soldItems.filter((i) => i.category === cat);
      const commissionInCat = soldInCat.reduce(
        (acc, cur) => acc + calculateListingEstimates(cur.nettPrice).estimatedFee,
        0
      );
      return {
        category: cat,
        totalCount: allInCat.length,
        soldCount: soldInCat.length,
        commission: commissionInCat,
      };
    });

    // Top Kecamatan in Majalengka
    const kecMap: Record<string, { total: number; sold: number }> = {};
    filteredSubmissions.forEach((item) => {
      const k = item.kecamatan || 'Majalengka';
      if (!kecMap[k]) kecMap[k] = { total: 0, sold: 0 };
      kecMap[k].total += 1;
      if (
        item.status === 'Terjual' ||
        item.status === 'Selesai & Dicairkan' ||
        item.postStatus === 'Sold Out'
      ) {
        kecMap[k].sold += 1;
      }
    });

    const topKecamatan = Object.entries(kecMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    const conversionRate =
      filteredSubmissions.length > 0
        ? Math.round((soldItems.length / filteredSubmissions.length) * 100)
        : 0;

    return {
      totalItems: filteredSubmissions.length,
      soldCount: soldItems.length,
      liveCount: liveItems.length,
      realizedGMV,
      realizedNettPenitip,
      realizedAdminCommission,
      potentialGMV,
      potentialAdminCommission,
      conversionRate,
      categoryStats,
      topKecamatan,
    };
  }, [filteredSubmissions]);

  const handleExportFinancialCSV = () => {
    const headers = [
      'Kode Tiket',
      'Tanggal',
      'Penitip',
      'Kecamatan',
      'Kategori',
      'Barang',
      'Status',
      'Harga Nett Penitip (Rp)',
      'Harga Jual Tayang (Rp)',
      'Bagi Hasil Admin (Rp)',
    ];
    const rows = filteredSubmissions.map((item) => {
      const est = calculateListingEstimates(item.nettPrice);
      return [
        item.id,
        new Date(item.createdAt).toLocaleDateString('id-ID'),
        `"${item.fullName.replace(/"/g, '""')}"`,
        item.kecamatan,
        item.category,
        `"${item.itemNameAndBrand.replace(/"/g, '""')}"`,
        item.status,
        item.nettPrice,
        est.suggestedListingPrice,
        est.estimatedFee,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Laporan-Keuangan-BarkasMajalengka-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1B365D] text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-amber-400">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#1B365D] flex items-center justify-center font-black">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                Rekap Laporan Keuangan & Analitik Komisi Admin
              </h3>
              <p className="text-[11px] text-amber-200">
                Ringkasan GMV, Bagi Hasil Bersih Admin Esteh, & Performa Kategori Majalengka
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/15 text-xs">
              <button
                type="button"
                onClick={() => setPeriodFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  periodFilter === 'ALL' ? 'bg-amber-400 text-[#1B365D]' : 'text-slate-200'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('THIS_MONTH')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  periodFilter === 'THIS_MONTH' ? 'bg-amber-400 text-[#1B365D]' : 'text-slate-200'
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => setPeriodFilter('LAST_30_DAYS')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  periodFilter === 'LAST_30_DAYS' ? 'bg-amber-400 text-[#1B365D]' : 'text-slate-200'
                }`}
              >
                30 Hari
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Top KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-emerald-900 text-white border border-emerald-700 space-y-1">
              <div className="flex items-center justify-between text-emerald-200 text-xs font-semibold">
                <span>Pendapatan Komisi Admin</span>
                <Wallet className="w-4 h-4 text-amber-300" />
              </div>
              <strong className="text-xl font-mono font-black text-amber-300 block">
                {formatRupiah(metrics.realizedAdminCommission)}
              </strong>
              <span className="text-[11px] text-emerald-100 block">
                Dari {metrics.soldCount} barang terjual/lunas
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#1B365D] text-white border border-slate-700 space-y-1">
              <div className="flex items-center justify-between text-amber-200 text-xs font-semibold">
                <span>Total Nilai Transaksi (GMV)</span>
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <strong className="text-xl font-mono font-black text-white block">
                {formatRupiah(metrics.realizedGMV)}
              </strong>
              <span className="text-[11px] text-slate-300 block">
                Hak Penitip: {formatRupiah(metrics.realizedNettPenitip)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
              <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
                <span>Potensi Komisi (Stok Live)</span>
                <ShoppingBag className="w-4 h-4 text-amber-600" />
              </div>
              <strong className="text-xl font-mono font-black text-amber-900 block">
                + {formatRupiah(metrics.potentialAdminCommission)}
              </strong>
              <span className="text-[11px] text-amber-700 block">
                {metrics.liveCount} barang sedang dipajang ({formatRupiah(metrics.potentialGMV)})
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-slate-600 text-xs font-semibold">
                <span>Rasio Terjual (Konversi)</span>
                <Award className="w-4 h-4 text-[#1B365D]" />
              </div>
              <strong className="text-xl font-mono font-black text-[#1B365D] block">
                {metrics.conversionRate}%
              </strong>
              <span className="text-[11px] text-slate-500 block">
                {metrics.soldCount} terjual dari {metrics.totalItems} pengajuan
              </span>
            </div>
          </div>

          {/* Breakdown Grid: Category Performance & Kecamatan Leaderboard */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Category Breakdown */}
            <div className="md:col-span-7 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs sm:text-sm font-extrabold text-[#1B365D] flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                <span>Performa Kategori Barang & Kontribusi Komisi</span>
              </h4>

              <div className="space-y-2.5">
                {metrics.categoryStats.map((cat) => {
                  const pct =
                    metrics.totalItems > 0
                      ? Math.round((cat.totalCount / metrics.totalItems) * 100)
                      : 0;
                  return (
                    <div
                      key={cat.category}
                      className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <strong className="text-slate-800">{cat.category}</strong>
                        <span className="font-mono font-bold text-emerald-700">
                          Komisi: {formatRupiah(cat.commission)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          Total Masuk: <strong>{cat.totalCount}</strong> • Terjual:{' '}
                          <strong className="text-emerald-700">{cat.soldCount}</strong>
                        </span>
                        <span>{pct}% dari katalog</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1B365D] rounded-full"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kecamatan Leaderboard */}
            <div className="md:col-span-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs sm:text-sm font-extrabold text-[#1B365D] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  <span>Top Kecamatan Penitip (Majalengka)</span>
                </h4>

                {metrics.topKecamatan.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    Belum ada data kecamatan.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {metrics.topKecamatan.map((kec, idx) => (
                      <div
                        key={kec.name}
                        className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#1B365D] text-amber-300 font-mono font-black text-[11px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <strong className="text-slate-800">Kec. {kec.name}</strong>
                        </div>
                        <div className="text-right text-[11px] text-slate-600">
                          <strong>{kec.total} barang</strong>{' '}
                          <span className="text-emerald-700">({kec.sold} laku)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-2">
                <button
                  type="button"
                  onClick={handleExportFinancialCSV}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Laporan Keuangan (CSV / Excel)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
