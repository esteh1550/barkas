import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  Lock, 
  Unlock, 
  KeyRound, 
  Search, 
  Download, 
  MessageCircle, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShoppingBag, 
  QrCode, 
  FileText, 
  FileSpreadsheet, 
  History, 
  ShieldCheck, 
  ArrowLeft, 
  Phone, 
  Eye, 
  EyeOff, 
  LogOut,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  LayoutGrid,
  List,
  Sparkles,
  PlusCircle
} from 'lucide-react';
import { ConsignmentItem, SubmissionStatus, AdminPostStatus } from '../types/consignment';
import { 
  formatRupiah, 
  generateAdminWhatsAppUrl, 
  calculateListingEstimates, 
  getTenorTimeline,
  normalizeWhatsAppNumber 
} from '../utils/formatters';
import { generateConsignmentPDF } from '../utils/pdfGenerator';
import { TicketQRCodeModal } from '../components/TicketQRCodeModal';
import { GoogleFormsModal } from '../components/GoogleFormsModal';
import { ContentOutputCard } from '../components/ContentOutputCard';

interface AdminDashboardProps {
  submissions: ConsignmentItem[];
  onUpdateStatus: (id: string, newStatus: SubmissionStatus) => void;
  onUpdatePostStatus?: (id: string, newPostStatus: AdminPostStatus) => void;
  onDeleteSubmission: (id: string) => void;
  onAddSampleItem?: (sampleItem: ConsignmentItem) => void;
  adminWhatsAppNumber: string;
  onUpdateAdminWhatsApp: (newPhone: string) => void;
  onBackToHome: () => void;
  currentUser: User | null;
  accessToken: string | null;
  onAuthSuccess: (user: User, token: string) => void;
  onLogoutGoogle: () => void;
}

const ADMIN_PIN_STORAGE_KEY = 'barkas_admin_auth_session';
const CUSTOM_PIN_KEY = 'barkas_admin_pin_code';
const DEFAULT_PIN = 'barkas2026';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  submissions,
  onUpdateStatus,
  onUpdatePostStatus,
  onDeleteSubmission,
  onAddSampleItem,
  adminWhatsAppNumber,
  onUpdateAdminWhatsApp,
  onBackToHome,
  currentUser,
  accessToken,
  onAuthSuccess,
  onLogoutGoogle,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(ADMIN_PIN_STORAGE_KEY) === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Settings State
  const [adminPhone, setAdminPhone] = useState(adminWhatsAppNumber);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');

  // Dashboard View Mode & Filter State
  const [viewMode, setViewMode] = useState<'studio' | 'table'>('studio');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL');
  const [qrModalItem, setQrModalItem] = useState<ConsignmentItem | null>(null);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleLoadDemoItem = () => {
    if (!onAddSampleItem) return;
    
    // Create demo image canvas to generate a clean photo
    const createDemoImage = (title: string, color: string) => {
      const c = document.createElement('canvas');
      c.width = 800;
      c.height = 800;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 800, 800);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.arc(400, 400, 260, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, 400, 390);
        ctx.font = '22px sans-serif';
        ctx.fillStyle = '#F59E0B';
        ctx.fillText('info.barkasmajalengka', 400, 435);
      }
      return c.toDataURL('image/jpeg', 0.9);
    };

    const demoPhotos = [
      createDemoImage('Helm Slimhead Vintage - Depan', '#1B365D'),
      createDemoImage('Helm Slimhead Vintage - Samping', '#24477A'),
      createDemoImage('Helm Slimhead Vintage - Interior', '#0F172A'),
    ];

    const demoItem: ConsignmentItem = {
      id: `#BM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      fullName: 'Rizki Pratama',
      whatsappNumber: '085223456789',
      kecamatan: 'Majalengka',
      bankAccount: 'BCA 1480987654 a.n Rizki Pratama',
      category: 'Helm & Otomotif',
      itemNameAndBrand: 'Helm Slimhead Vintage Classic Retro',
      size: 'L (59-60 cm)',
      condition: 'Seperti Baru / Like New',
      descriptionAndFlaws: 'Busa tebal original, cat mulus 98%, visor bening belum ada baret, kelengkapan helm + sarung kardus.',
      nettPrice: 450000,
      photos: demoPhotos,
      agreementAccepted: true,
      status: 'Menunggu Kurasi',
      postStatus: 'Draft'
    };

    onAddSampleItem(demoItem);
  };

  const getSavedPIN = () => {
    return localStorage.getItem(CUSTOM_PIN_KEY) || DEFAULT_PIN;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = getSavedPIN();

    if (pinInput.trim() === correctPin) {
      setIsAuthenticated(true);
      sessionStorage.setItem(ADMIN_PIN_STORAGE_KEY, 'true');
      setPinError('');
    } else {
      setPinError('PIN Administrator salah. Silakan periksa kembali.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(ADMIN_PIN_STORAGE_KEY);
    setPinInput('');
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length < 4) {
      alert('PIN minimal 4 karakter.');
      return;
    }
    localStorage.setItem(CUSTOM_PIN_KEY, newPin.trim());
    setIsChangingPin(false);
    setNewPin('');
    alert('PIN Admin berhasil diperbarui!');
  };

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

  // Counters
  const countPending = submissions.filter((s) => s.status === 'Menunggu Kurasi').length;
  const countAccepted = submissions.filter((s) => s.status === 'Diterima').length;
  const countRejected = submissions.filter((s) => s.status === 'Ditolak').length;
  const countLive = submissions.filter((s) => s.status === 'Sedang Dipajang (Live)').length;
  const countSold = submissions.filter((s) => s.status === 'Terjual').length;

  // Total nett value calculation
  const totalNettValue = filtered.reduce((acc, curr) => acc + (curr.nettPrice || 0), 0);
  const totalAllNettValue = submissions.reduce((acc, curr) => acc + (curr.nettPrice || 0), 0);

  // Export CSV
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
      `data-titip-jual-barkasmajalengka-${new Date().toISOString().slice(0, 10)}.csv`
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
      alert('Gagal membuat PDF.');
    } finally {
      setGeneratingPdfId(null);
    }
  };

  // If NOT authenticated, show Secure PIN Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1B365D] text-amber-400 flex items-center justify-center shadow-lg border border-amber-400/30">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#1B365D]">
              Area Khusus Pengelola
            </h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Data penitip dan informasi barang bersifat rahasia. Masukkan PIN keamanan untuk mengakses <strong>/admin</strong> info.barkasmajalengka.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                PIN Administrator
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showPin ? 'text' : 'password'}
                  placeholder="Masukkan PIN Admin..."
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError('');
                  }}
                  autoFocus
                  required
                  className="w-full pl-10 pr-10 py-3 text-center tracking-widest text-lg font-mono font-bold rounded-xl border border-slate-300 focus:border-[#1B365D] focus:ring-2 focus:ring-[#1B365D]/20 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {pinError && (
                <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1 font-semibold justify-center">
                  <AlertCircle className="w-3.5 h-3.5" /> {pinError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#1B365D] hover:bg-[#24477A] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4 text-amber-400" />
              <span>Buka Panel Admin</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={onBackToHome}
              className="flex items-center gap-1 text-slate-600 hover:text-[#1B365D] font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Utama</span>
            </button>

            <span className="text-[11px] text-slate-400">
              Default: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-700">barkas2026</code>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Once Authenticated: Render Full Protected Admin Dashboard
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-[#1B365D] text-white shadow-lg sticky top-0 z-30 border-b-2 border-amber-400">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHome}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Ke Formulir Publik"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-[#1B365D] flex items-center justify-center font-black text-sm">
                B
              </div>
              <div>
                <h1 className="font-extrabold text-sm sm:text-base leading-tight">
                  Panel Pengelola /admin
                </h1>
                <p className="text-[11px] text-amber-200/90 hidden sm:block">
                  info.barkasmajalengka Consignment Hub
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Google Forms Button */}
            <button
              onClick={() => setIsGoogleModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                currentUser
                  ? 'bg-amber-400 text-[#1B365D] font-bold shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Google Forms</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={() => handleExportCSV(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Excel/CSV</span>
            </button>

            {/* Logout / Lock Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-rose-600/80 text-white rounded-xl text-xs font-semibold transition-colors"
              title="Kunci Panel"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kunci</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* KPI Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
              Total Pengajuan
            </span>
            <span className="text-2xl font-black text-[#1B365D] block mt-1">
              {submissions.length}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Barang masuk sistem
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-2xs bg-gradient-to-br from-white to-amber-50/40">
            <span className="text-xs text-amber-800 font-semibold uppercase tracking-wider block">
              Menunggu Kurasi
            </span>
            <span className="text-2xl font-black text-amber-600 block mt-1">
              {countPending}
            </span>
            <span className="text-[11px] text-amber-700/80 mt-0.5 block">
              Wajib dicek admin
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-purple-200/80 shadow-2xs bg-gradient-to-br from-white to-purple-50/40">
            <span className="text-xs text-purple-800 font-semibold uppercase tracking-wider block">
              Diterima & Live
            </span>
            <span className="text-2xl font-black text-purple-700 block mt-1">
              {countAccepted + countLive}
            </span>
            <span className="text-[11px] text-purple-600/80 mt-0.5 block">
              Siap / sedang dipajang
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-emerald-200/80 shadow-2xs bg-gradient-to-br from-white to-emerald-50/40">
            <span className="text-xs text-emerald-800 font-semibold uppercase tracking-wider block">
              Total Nilai Barang (Nett)
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-700 block mt-1 truncate">
              {formatRupiah(totalAllNettValue)}
            </span>
            <span className="text-[11px] text-emerald-600/80 mt-0.5 block">
              Nilai titipan warga
            </span>
          </div>
        </div>

        {/* Operational Setting & Quick Admin WhatsApp config */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Nomor WhatsApp Admin Penerima Notifikasi:</span>
              <strong className="text-slate-800 text-sm font-mono">+{adminWhatsAppNumber}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isEditingPhone ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="628..."
                  className="py-1 px-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    onUpdateAdminWhatsApp(adminPhone);
                    setIsEditingPhone(false);
                  }}
                  className="px-2.5 py-1 bg-[#1B365D] text-white rounded-lg font-semibold cursor-pointer"
                >
                  Simpan
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingPhone(true)}
                className="px-2.5 py-1 text-slate-700 hover:text-[#1B365D] bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
              >
                Ubah No. WA Admin
              </button>
            )}

            {isChangingPin ? (
              <form onSubmit={handleSaveNewPin} className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="PIN Baru..."
                  className="py-1 px-2.5 border border-slate-300 rounded-lg text-xs font-mono w-28"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-amber-500 text-white rounded-lg font-semibold"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setIsChangingPin(false)}
                  className="px-1.5 py-1 text-slate-400"
                >
                  Batal
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsChangingPin(true)}
                className="px-2.5 py-1 text-slate-700 hover:text-[#1B365D] bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
              >
                Ganti PIN Admin
              </button>
            )}
          </div>
        </div>

        {/* Management Table Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          {/* Status Tabs Filter */}
          <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2.5 overflow-x-auto flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
              Filter Status:
            </span>

            <button
              onClick={() => setSelectedStatusTab('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                selectedStatusTab === 'ALL'
                  ? 'bg-[#1B365D] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span>Semua</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedStatusTab === 'ALL' ? 'bg-white/20' : 'bg-slate-200 text-slate-700'}`}>
                {submissions.length}
              </span>
            </button>

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
          <div className="p-4 bg-white border-b border-slate-200 space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode tiket, nama barang, penitip, no. WA, kecamatan di Majalengka..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#1B365D] focus:bg-white"
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
                  onClick={() => {
                    const text = filtered.map((item, i) => 
                      `${i + 1}. [${item.id}] ${item.itemNameAndBrand} - ${item.fullName} (WA: ${item.whatsappNumber}) - Rp ${item.nettPrice.toLocaleString('id-ID')} [${item.status}]`
                    ).join('\n');
                    navigator.clipboard.writeText(text);
                    setCopiedAll(true);
                    setTimeout(() => setCopiedAll(false), 2000);
                  }}
                  className="px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                  title="Salin Rangkuman Teks"
                >
                  {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span className="hidden sm:inline">{copiedAll ? 'Tersalin' : 'Salin Teks'}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span>
                  Menampilkan <strong>{filtered.length}</strong> dari {submissions.length} pengajuan
                </span>
                <span>•</span>
                <span>
                  Total Nilai: <strong className="text-[#1B365D] font-mono">{formatRupiah(totalNettValue)}</strong>
                </span>
              </div>

              {/* Mode Switcher: Studio Output & Watermark vs Tabel Ringkas */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('studio')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'studio'
                      ? 'bg-[#1B365D] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Output Studio & Watermark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-[#1B365D] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Tabel Ringkas</span>
                </button>
              </div>
            </div>
          </div>

          {/* Submissions List Container */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-5 max-h-[72vh] bg-slate-50/60">
            {filtered.length === 0 ? (
              <div className="text-center py-14 px-4 bg-white rounded-3xl border-2 border-dashed border-slate-300 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1B365D]/10 text-[#1B365D] flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-slate-800">
                    {submissions.length === 0 ? 'Belum Ada Data Pengajuan Titip Jual' : 'Tidak Ada Hasil yang Sesuai Filter'}
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    {submissions.length === 0
                      ? 'Setiap barang yang didaftarkan penitip melalui formulir akan otomatis tersimpan di sini. Anda dapat langsung mencoba fitur Watermark Foto & Auto-Generate Caption Instagram menggunakan data simulasi demo di bawah ini.'
                      : 'Coba sesuaikan kata kunci pencarian atau ganti filter status di tab atas.'}
                  </p>
                </div>

                {submissions.length === 0 && onAddSampleItem && (
                  <div className="pt-2 flex items-center justify-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleLoadDemoItem}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Muat Contoh Barang Titipan (Demo)</span>
                    </button>
                    <button
                      type="button"
                      onClick={onBackToHome}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Buka Formulir Publik
                    </button>
                  </div>
                )}
              </div>
            ) : viewMode === 'studio' ? (
              /* STUDIO OUTPUT MODE: Page Output with Watermarked Photos, Instagram Auto-Caption, WhatsApp Confirmation & Status Tags */
              <div className="space-y-6">
                {filtered.map((item) => (
                  <ContentOutputCard
                    key={item.id}
                    item={item}
                    onUpdatePostStatus={(id, postStatus) => {
                      if (onUpdatePostStatus) {
                        onUpdatePostStatus(id, postStatus);
                      }
                    }}
                    onUpdateGeneralStatus={onUpdateStatus}
                    onDelete={onDeleteSubmission}
                    onOpenQR={(item) => setQrModalItem(item)}
                    onDownloadPDF={handleDownloadSinglePDF}
                  />
                ))}
              </div>
            ) : (
              /* COMPACT TABLE MODE */
              filtered.map((item) => {
                const waUrl = generateAdminWhatsAppUrl(item, adminWhatsAppNumber);
                const tenor = getTenorTimeline(item.createdAt);
                const estimates = calculateListingEstimates(item.nettPrice);

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-[#1B365D] transition-all space-y-3.5"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-[#1B365D]/10 text-[#1B365D]">
                            {item.id}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(item.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Tenor & Fee Status Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {tenor.isExpired ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              🚨 Tenor 30 Hari Habis (Opsi Kembalikan / Perpanjang)
                            </span>
                          ) : tenor.isPriceDropPeriod ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              ⚠️ Hari ke-20+ (Waktunya Opsi Price Drop)
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              ⏳ Sisa Tenor: {tenor.remainingDays} hari (Maks. 30 Hari)
                            </span>
                          )}

                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            {estimates.rateDescription} ({estimates.tierName})
                          </span>
                        </div>
                      </div>

                      {/* Status Selector Dropdown */}
                      <div className="flex items-center gap-2 ml-auto">
                        <select
                          value={item.status}
                          onChange={(e) => onUpdateStatus(item.id, e.target.value as SubmissionStatus)}
                          className={`text-xs font-bold py-1.5 px-3 rounded-xl border focus:outline-hidden cursor-pointer transition-all ${
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
                          <option value="Diterima">✅ Diterima & Disetujui</option>
                          <option value="Ditolak">❌ Ditolak</option>
                          <option value="Sedang Dipajang (Live)">🔥 Sedang Dipajang (Live)</option>
                          <option value="Terjual">💰 Terjual</option>
                          <option value="Selesai & Dicairkan">🎉 Selesai & Dicairkan</option>
                        </select>

                        <button
                          onClick={() => {
                            if (confirm(`Hapus pengajuan ${item.id} (${item.itemNameAndBrand})?`)) {
                              onDeleteSubmission(item.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Pengajuan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Item Body Row */}
                    <div className="flex gap-4">
                      {item.photos && item.photos[0] ? (
                        <img
                          src={item.photos[0]}
                          alt={item.itemNameAndBrand}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <ShoppingBag className="w-8 h-8" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                          {item.itemNameAndBrand}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Kategori: <strong>{item.category}</strong> • Size: <strong>{item.size || 'All Size'}</strong> • Kondisi: <strong>{item.condition}</strong>
                        </p>
                        <p className="text-xs text-slate-600">
                          Penitip: <strong>{item.fullName}</strong> • Domisili: <strong>Kec. {item.kecamatan}, Majalengka</strong>
                        </p>
                        <p className="text-xs text-slate-500">
                          WhatsApp:{' '}
                          <a
                            href={`https://wa.me/${normalizeWhatsAppNumber(item.whatsappNumber)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 font-bold hover:underline"
                          >
                            {item.whatsappNumber}
                          </a>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-slate-400 block">Harga Bersih (Nett)</span>
                        <span className="font-black text-[#1B365D] text-base sm:text-lg">
                          {formatRupiah(item.nettPrice)}
                        </span>
                        <span className="text-[11px] text-amber-800 font-bold block mt-0.5">
                          Est. Jual: ± {formatRupiah(estimates.suggestedListingPrice)}
                        </span>
                        {item.photos && item.photos.length > 0 && (
                          <span className="text-[10px] text-slate-400 block mt-1">
                            📸 {item.photos.length} foto tersedia
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Deskripsi & Detail Minus */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-600">
                      <span className="font-bold text-slate-700">Detail & Minus: </span>
                      <span className="italic">{item.descriptionAndFlaws}</span>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 text-[11px] truncate">
                        Pencairan ke: <strong className="text-slate-800">{item.bankAccount}</strong>
                      </span>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* QR Code Scan Verification */}
                        <button
                          type="button"
                          onClick={() => setQrModalItem(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5 text-amber-700" />
                          <span>Kode QR Tiket</span>
                        </button>

                        {/* Download PDF Receipt */}
                        <button
                          type="button"
                          onClick={() => handleDownloadSinglePDF(item)}
                          disabled={generatingPdfId === item.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1B365D] hover:bg-[#24477A] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-60"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span>{generatingPdfId === item.id ? 'Membuat PDF...' : 'Download PDF'}</span>
                        </button>

                        {/* WhatsApp Direct Chat */}
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Hubungi Penitip (WA)</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleExportCSV(true)}
              className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Hasil Filter ({filtered.length} item)</span>
            </button>

            <span className="text-[11px] text-slate-400">
              info.barkasmajalengka © {new Date().getFullYear()} • Panel Rahasia Pengelola
            </span>
          </div>
        </div>
      </main>

      {/* QR Code Modal */}
      <TicketQRCodeModal
        item={qrModalItem}
        isOpen={!!qrModalItem}
        onClose={() => setQrModalItem(null)}
      />

      {/* Google Forms Modal */}
      <GoogleFormsModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        currentUser={currentUser}
        accessToken={accessToken}
        onAuthSuccess={onAuthSuccess}
        onLogout={onLogoutGoogle}
      />
    </div>
  );
};
