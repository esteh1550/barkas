import React, { useState } from 'react';
import { 
  X, 
  History, 
  Search, 
  MessageCircle, 
  Trash2, 
  Download, 
  ShoppingBag, 
  Info,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  QrCode,
  FileText,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { ConsignmentItem, SubmissionStatus } from '../types/consignment';
import { formatRupiah, generateAdminWhatsAppUrl, calculateListingEstimates, getTenorTimeline } from '../utils/formatters';
import { generateConsignmentPDF } from '../utils/pdfGenerator';
import { TicketQRCodeModal } from './TicketQRCodeModal';

interface SubmissionsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: ConsignmentItem[];
  onUpdateStatus: (id: string, newStatus: SubmissionStatus) => void;
  onDeleteSubmission: (id: string) => void;
  adminWhatsAppNumber: string;
}

export const SubmissionsListModal: React.FC<SubmissionsListModalProps> = ({
  isOpen,
  onClose,
  submissions,
  onUpdateStatus,
  onDeleteSubmission,
  adminWhatsAppNumber,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [qrModalItem, setQrModalItem] = useState<ConsignmentItem | null>(null);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter submissions
  const filtered = submissions.filter((item) => {
    const matchesSearch =
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemNameAndBrand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kecamatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.whatsappNumber.includes(searchTerm);

    const matchesCategory =
      selectedCategory === 'ALL' || item.category === selectedCategory;

    const matchesStatus =
      selectedStatusTab === 'ALL' || item.status === selectedStatusTab;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Count by status for filter tabs
  const countPending = submissions.filter((s) => s.status === 'Menunggu Kurasi').length;
  const countAccepted = submissions.filter((s) => s.status === 'Diterima').length;
  const countRejected = submissions.filter((s) => s.status === 'Ditolak').length;
  const countLive = submissions.filter((s) => s.status === 'Sedang Dipajang (Live)').length;
  const countSold = submissions.filter((s) => s.status === 'Terjual').length;

  // Total nett value calculation
  const totalNettValue = filtered.reduce((acc, curr) => acc + (curr.nettPrice || 0), 0);

  // Export current submissions to CSV
  const handleExportCSV = (exportOnlyFiltered: boolean = false) => {
    const itemsToExport = exportOnlyFiltered ? filtered : submissions;
    if (itemsToExport.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    const headers = [
      'Kode Tiket',
      'Tanggal Input',
      'Nama Penitip',
      'No WhatsApp',
      'Kecamatan (Majalengka)',
      'Rekening / E-Wallet',
      'Kategori',
      'Nama & Merk Barang',
      'Ukuran/Size',
      'Kondisi',
      'Deskripsi & Minus',
      'Harga Bersih Nett (Rp)',
      'Jumlah Foto',
      'Status Kurasi',
    ];

    const rows = itemsToExport.map((item) => [
      `"${item.id}"`,
      `"${new Date(item.createdAt).toLocaleString('id-ID')}"`,
      `"${item.fullName.replace(/"/g, '""')}"`,
      `"${item.whatsappNumber}"`,
      `"${item.kecamatan}"`,
      `"${item.bankAccount.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.itemNameAndBrand.replace(/"/g, '""')}"`,
      `"${item.size || '-'}"`,
      `"${item.condition}"`,
      `"${item.descriptionAndFlaws.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
      `"${item.nettPrice}"`,
      `"${item.photos?.length || 0}"`,
      `"${item.status}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `data-titip-jual-barkas-${selectedStatusTab.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSinglePDF = async (item: ConsignmentItem) => {
    setGeneratingPdfId(item.id);
    try {
      await generateConsignmentPDF(item);
    } catch (e) {
      console.error(e);
      alert('Gagal mengunduh PDF.');
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const handleCopyAll = () => {
    if (filtered.length === 0) return;
    const summaryText = filtered
      .map(
        (item, i) =>
          `${i + 1}. [${item.id}] ${item.itemNameAndBrand} (${item.category}) - ${item.fullName} (WA: ${item.whatsappNumber}) - Rp ${item.nettPrice.toLocaleString('id-ID')} - Status: ${item.status}`
      )
      .join('\n');

    navigator.clipboard.writeText(summaryText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-[#1B365D] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#1B365D] flex items-center justify-center font-bold">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg">Panel Manajemen & Data Titip Jual</h3>
                <p className="text-xs text-amber-200/90">
                  {submissions.length} Pengajuan Tersimpan • info.barkasmajalengka
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportCSV(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                title="Ekspor seluruh data ke file CSV / Excel"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV (Excel)</span>
                <span className="sm:hidden">CSV</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Status Tabs Filter (Requested feature) */}
          <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 overflow-x-auto shrink-0 flex items-center gap-1.5 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
              Status:
            </span>

            {/* Tab: Semua */}
            <button
              onClick={() => setSelectedStatusTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedStatusTab === 'ALL'
                  ? 'bg-[#1B365D] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              <span>Semua</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedStatusTab === 'ALL' ? 'bg-white/20' : 'bg-slate-200 text-slate-700'}`}>
                {submissions.length}
              </span>
            </button>

            {/* Tab: Menunggu Kurasi */}
            <button
              onClick={() => setSelectedStatusTab('Menunggu Kurasi')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedStatusTab === 'Menunggu Kurasi'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Menunggu Kurasi</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedStatusTab === 'Menunggu Kurasi' ? 'bg-black/20' : 'bg-amber-100 text-amber-800'}`}>
                {countPending}
              </span>
            </button>

            {/* Tab: Diterima */}
            <button
              onClick={() => setSelectedStatusTab('Diterima')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedStatusTab === 'Diterima'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-purple-800 hover:bg-purple-50 border border-purple-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Diterima</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedStatusTab === 'Diterima' ? 'bg-black/20' : 'bg-purple-100 text-purple-800'}`}>
                {countAccepted}
              </span>
            </button>

            {/* Tab: Ditolak */}
            <button
              onClick={() => setSelectedStatusTab('Ditolak')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedStatusTab === 'Ditolak'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-200'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Ditolak</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedStatusTab === 'Ditolak' ? 'bg-black/20' : 'bg-rose-100 text-rose-800'}`}>
                {countRejected}
              </span>
            </button>

            {/* Tab: Sedang Dipajang (Live) */}
            <button
              onClick={() => setSelectedStatusTab('Sedang Dipajang (Live)')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedStatusTab === 'Sedang Dipajang (Live)'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-blue-800 hover:bg-blue-50 border border-blue-200'
              }`}
            >
              <span>Dipajang (Live)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedStatusTab === 'Sedang Dipajang (Live)' ? 'bg-black/20' : 'bg-blue-100 text-blue-800'}`}>
                {countLive}
              </span>
            </button>

            {/* Tab: Terjual */}
            <button
              onClick={() => setSelectedStatusTab('Terjual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedStatusTab === 'Terjual'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              <span>Terjual</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedStatusTab === 'Terjual' ? 'bg-black/20' : 'bg-emerald-100 text-emerald-800'}`}>
                {countSold}
              </span>
            </button>
          </div>

          {/* Search & Sub-Filter Bar */}
          <div className="p-3 sm:p-4 bg-white border-b border-slate-200 space-y-2 shrink-0">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode tiket, nama barang, penitip, no. WA, kecamatan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#1B365D] focus:bg-white"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden text-slate-700"
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Sneakers / Sepatu">Sneakers / Sepatu</option>
                  <option value="Helm & Otomotif">Helm & Otomotif</option>
                  <option value="Gadget & Elektronik">Gadget & Elektronik</option>
                  <option value="Lainnya">Lainnya</option>
                </select>

                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="px-2.5 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 cursor-pointer"
                  title="Salin Rangkuman Teks"
                >
                  {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick summary stats of current filter */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>
                Menampilkan <strong>{filtered.length}</strong> dari {submissions.length} pengajuan
              </span>
              <span>
                Total Nilai Barang (Filter): <strong className="text-[#1B365D] font-mono">{formatRupiah(totalNettValue)}</strong>
              </span>
            </div>
          </div>

          {/* Submissions List */}
          <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1 bg-slate-50/70">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ShoppingBag className="w-12 h-12 mx-auto stroke-[1.5] mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-600">Tidak ada pengajuan ditemukan</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {submissions.length === 0
                    ? 'Data pengajuan titip jual yang diisi pengguna akan otomatis muncul di sini.'
                    : 'Coba ubah kata kunci pencarian atau pilih tab status lain.'}
                </p>
              </div>
            ) : (
              filtered.map((item) => {
                const waUrl = generateAdminWhatsAppUrl(item, adminWhatsAppNumber);
                const tenor = getTenorTimeline(item.createdAt);
                const estimates = calculateListingEstimates(item.nettPrice);

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs hover:border-[#1B365D] transition-all space-y-3"
                  >
                    {/* Top Row: Ticket ID, Date & Status Dropdown */}
                    <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-[#1B365D]/10 text-[#1B365D]">
                            {item.id}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(item.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Tenor & Fee Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {tenor.isExpired ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              🚨 Tenor 30 Hari Habis (Opsi Kembalikan / Perpanjang)
                            </span>
                          ) : tenor.isPriceDropPeriod ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              ⚠️ Hari ke-20+ (Waktunya Opsi Price Drop)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              ⏳ Sisa Tenor: {tenor.remainingDays} hari
                            </span>
                          )}

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            {estimates.rateDescription}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 ml-auto">
                        <select
                          value={item.status}
                          onChange={(e) => onUpdateStatus(item.id, e.target.value as SubmissionStatus)}
                          className={`text-[11px] font-bold py-1 px-2.5 rounded-lg border focus:outline-hidden transition-all ${
                            item.status === 'Diterima'
                              ? 'bg-purple-50 border-purple-300 text-purple-800'
                              : item.status === 'Ditolak'
                              ? 'bg-rose-50 border-rose-300 text-rose-800'
                              : item.status === 'Terjual'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : item.status === 'Sedang Dipajang (Live)'
                              ? 'bg-blue-50 border-blue-300 text-blue-800'
                              : 'bg-amber-50 border-amber-300 text-amber-800'
                          }`}
                        >
                          <option value="Menunggu Kurasi">⏳ Menunggu Kurasi</option>
                          <option value="Diterima">✅ Diterima</option>
                          <option value="Ditolak">❌ Ditolak</option>
                          <option value="Sedang Dipajang (Live)">🔥 Sedang Dipajang (Live)</option>
                          <option value="Terjual">💰 Terjual</option>
                          <option value="Selesai & Dicairkan">🎉 Selesai & Dicairkan</option>
                        </select>

                        {confirmingDeleteId === item.id ? (
                          <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-lg text-[11px]">
                            <span className="text-rose-700 font-semibold">Hapus?</span>
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteSubmission(item.id);
                                setConfirmingDeleteId(null);
                              }}
                              className="px-1.5 py-0.5 bg-rose-600 text-white rounded font-bold text-[10px] hover:bg-rose-700 cursor-pointer"
                            >
                              Ya
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmingDeleteId(null)}
                              className="px-1 py-0.5 text-slate-500 hover:text-slate-700 rounded text-[10px] cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmingDeleteId(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus data"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Middle: Item Details & Photos */}
                    <div className="flex gap-3">
                      {item.photos && item.photos[0] ? (
                        <img
                          src={item.photos[0]}
                          alt={item.itemNameAndBrand}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">
                          {item.itemNameAndBrand}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {item.category} • Size: <strong>{item.size || '-'}</strong> • Kondisi: <strong>{item.condition}</strong>
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          Penitip: <strong>{item.fullName}</strong> • Kec. {item.kecamatan}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          WhatsApp:{' '}
                          <a
                            href={`https://wa.me/${item.whatsappNumber.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 font-semibold hover:underline"
                          >
                            {item.whatsappNumber}
                          </a>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block">Harga Bersih (Nett)</span>
                        <span className="font-black text-[#1B365D] text-sm sm:text-base">
                          {formatRupiah(item.nettPrice)}
                        </span>
                        <span className="text-[10px] text-amber-800 font-semibold block mt-0.5">
                          Est. Jual: ± {formatRupiah(estimates.suggestedListingPrice)}
                        </span>
                        {item.photos && item.photos.length > 0 && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            📸 {item.photos.length} foto
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Description & Flaws note */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-xs text-slate-600">
                      <span className="font-semibold text-slate-700">Detail & Minus: </span>
                      <span className="italic">{item.descriptionAndFlaws}</span>
                    </div>

                    {/* Bottom Action Bar: QR Code, PDF Download & WhatsApp */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 text-[11px] truncate">
                        Pencairan: <strong className="text-slate-800">{item.bankAccount}</strong>
                      </span>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* QR Code Action Button */}
                        <button
                          type="button"
                          onClick={() => setQrModalItem(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                          title="Lihat Kode QR Tiket untuk Scan Verifikasi"
                        >
                          <QrCode className="w-3.5 h-3.5 text-amber-700" />
                          <span>Kode QR</span>
                        </button>

                        {/* PDF Download Button (Requested) */}
                        <button
                          type="button"
                          onClick={() => handleDownloadSinglePDF(item)}
                          disabled={generatingPdfId === item.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#1B365D] hover:bg-[#24477A] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-60"
                          title="Download Bukti PDF Resmi"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span>{generatingPdfId === item.id ? 'Membuat PDF...' : 'Bukti PDF'}</span>
                        </button>

                        {/* WhatsApp Chat */}
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleExportCSV(true)}
              className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Hasil Filter ({filtered.length} item)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-[#1B365D] hover:bg-[#24477A] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Tutup Panel
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <TicketQRCodeModal
        item={qrModalItem}
        isOpen={!!qrModalItem}
        onClose={() => setQrModalItem(null)}
      />
    </>
  );
};
