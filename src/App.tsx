import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  Send, 
  User as UserIcon, 
  Package, 
  Camera, 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle, 
  Sparkles, 
  Building2, 
  Wallet, 
  Tag, 
  Ruler, 
  FileText, 
  Info,
  DollarSign,
  Phone,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Lock
} from 'lucide-react';

import { 
  ConsignmentItem, 
  ItemCategory, 
  ItemCondition, 
  KECAMATAN_MAJALENGKA, 
  CATEGORIES, 
  CONDITIONS,
  SubmissionStatus,
  AdminPostStatus
} from './types/consignment';
import { formatRupiah, parseRupiahInput, calculateListingEstimates } from './utils/formatters';
import { Header } from './components/Header';
import { PhotoUploader } from './components/PhotoUploader';
import { SuccessModal } from './components/SuccessModal';
import { FAQModal } from './components/FAQModal';
import { AdminDashboard } from './pages/AdminDashboard';
import { initAuth } from './services/googleAuth';
import { createConsignmentGoogleForm } from './services/googleForms';

const STORAGE_KEY = 'barkas_majalengka_submissions';
const ADMIN_PHONE_KEY = 'barkas_admin_whatsapp';
const DEFAULT_ADMIN_PHONE = '6285224000100';

export default function App() {
  // Navigation Route State (/ or /admin)
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/admin') || window.location.hash === '#/admin') {
        return '/admin';
      }
    }
    return '/';
  });

  // Listen to browser URL changes
  useEffect(() => {
    const handleLocationChange = () => {
      if (window.location.pathname.startsWith('/admin') || window.location.hash === '#/admin') {
        setCurrentPath('/admin');
      } else {
        setCurrentPath('/');
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Form State
  const [fullName, setFullName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [kecamatan, setKecamatan] = useState<string>('Majalengka');
  const [bankAccount, setBankAccount] = useState('');

  const [category, setCategory] = useState<ItemCategory>('Fashion');
  const [itemNameAndBrand, setItemNameAndBrand] = useState('');
  const [size, setSize] = useState('');
  const [condition, setCondition] = useState<ItemCondition>('Seperti Baru / Like New');
  const [descriptionAndFlaws, setDescriptionAndFlaws] = useState('');
  const [nettPriceRaw, setNettPriceRaw] = useState<string>('');

  const [photos, setPhotos] = useState<string[]>([]);
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  // App Submissions State
  const [submissions, setSubmissions] = useState<ConsignmentItem[]>([]);
  const [submittedItem, setSubmittedItem] = useState<ConsignmentItem | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isFAQOpen, setIsFAQOpen] = useState(false);
  
  const [adminPhone, setAdminPhone] = useState(DEFAULT_ADMIN_PHONE);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google Workspace / Forms Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);

  // Load submissions and settings from localStorage on initial render
  useEffect(() => {
    try {
      const savedSubmissions = localStorage.getItem(STORAGE_KEY);
      if (savedSubmissions) {
        setSubmissions(JSON.parse(savedSubmissions));
      }
      const savedAdmin = localStorage.getItem(ADMIN_PHONE_KEY);
      if (savedAdmin) {
        setAdminPhone(savedAdmin);
      }
    } catch (e) {
      console.warn('Failed to load local storage:', e);
    }

    // Initialize Google Firebase Auth state listener
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Save submissions to localStorage
  const saveSubmissions = (newItems: ConsignmentItem[]) => {
    setSubmissions(newItems);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  };

  // Rupiah input handling
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const numeric = parseRupiahInput(rawVal);
    setNettPriceRaw(numeric > 0 ? numeric.toString() : '');
    if (errors.nettPrice) {
      setErrors((prev) => ({ ...prev, nettPrice: '' }));
    }
  };

  const parsedNettPrice = parseRupiahInput(nettPriceRaw);
  const priceEstimates = calculateListingEstimates(parsedNettPrice);

  // Validate form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Nama lengkap wajib diisi.';
    }
    if (!whatsappNumber.trim()) {
      newErrors.whatsappNumber = 'Nomor WhatsApp wajib diisi.';
    } else if (whatsappNumber.replace(/[^0-9]/g, '').length < 9) {
      newErrors.whatsappNumber = 'Nomor WhatsApp minimal 9 digit valid.';
    }
    if (!bankAccount.trim()) {
      newErrors.bankAccount = 'Rekening atau E-Wallet wajib diisi untuk pencairan.';
    }
    if (!itemNameAndBrand.trim()) {
      newErrors.itemNameAndBrand = 'Nama & merk barang wajib diisi.';
    }
    if (!descriptionAndFlaws.trim()) {
      newErrors.descriptionAndFlaws = 'Deskripsi & detail minus wajib diisi (tulis "Tidak ada minus" jika mulus).';
    }
    if (parsedNettPrice <= 0) {
      newErrors.nettPrice = 'Masukkan nominal harga bersih yang Anda inginkan.';
    }
    if (photos.length < 3) {
      newErrors.photos = `Wajib mengunggah minimal 3 foto barang (saat ini ${photos.length} foto).`;
    }
    if (!agreementAccepted) {
      newErrors.agreement = 'Anda wajib menyetujui ketentuan keaslian & sistem titip jual.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstErrorKey = Object.keys(errors)[0];
      const targetElement = document.querySelector(`[data-field="${firstErrorKey}"]`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const randomTicketNum = Math.floor(1000 + Math.random() * 9000);
      const ticketId = `#BM-${new Date().getFullYear()}-${randomTicketNum}`;

      const newItem: ConsignmentItem = {
        id: ticketId,
        createdAt: new Date().toISOString(),
        fullName: fullName.trim(),
        whatsappNumber: whatsappNumber.trim(),
        kecamatan,
        bankAccount: bankAccount.trim(),
        category,
        itemNameAndBrand: itemNameAndBrand.trim(),
        size: size.trim() || 'All Size',
        condition,
        descriptionAndFlaws: descriptionAndFlaws.trim(),
        nettPrice: parsedNettPrice,
        photos,
        agreementAccepted,
        status: 'Menunggu Kurasi',
      };

      const updatedList = [newItem, ...submissions];
      saveSubmissions(updatedList);

      setSubmittedItem(newItem);
      setIsSuccessModalOpen(true);

      // Reset form fields
      setFullName('');
      setWhatsappNumber('');
      setBankAccount('');
      setItemNameAndBrand('');
      setSize('');
      setDescriptionAndFlaws('');
      setNettPriceRaw('');
      setPhotos([]);
      setAgreementAccepted(false);
      setErrors({});
    } catch (err) {
      console.error('Error submitting consignment form:', err);
      alert('Terjadi kendala saat mengirim data. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google Forms Direct Sync
  const handleSyncToGoogleForms = async () => {
    if (!accessToken) {
      navigateTo('/admin');
      return;
    }

    setIsSyncingGoogle(true);
    try {
      await createConsignmentGoogleForm(accessToken);
      alert('Google Form resmi berhasil dibuat dan disinkronkan ke akun Google Anda!');
    } catch (err: any) {
      console.error('Sync to Google Form error:', err);
      alert('Gagal menyinkronkan ke Google Forms: ' + (err.message || 'Izin ditolak'));
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  // ROUTE: IF /admin -> RENDER PROTECTED ADMIN DASHBOARD
  if (currentPath === '/admin') {
    return (
      <AdminDashboard
        submissions={submissions}
        onUpdateStatus={(id: string, newStatus: SubmissionStatus) => {
          const updated = submissions.map((s) => (s.id === id ? { ...s, status: newStatus } : s));
          saveSubmissions(updated);
        }}
        onUpdatePostStatus={(id: string, newPostStatus: AdminPostStatus) => {
          const updated = submissions.map((s) => (s.id === id ? { ...s, postStatus: newPostStatus } : s));
          saveSubmissions(updated);
        }}
        onDeleteSubmission={(id: string) => {
          const updated = submissions.filter((s) => s.id !== id);
          saveSubmissions(updated);
        }}
        onAddSampleItem={(sampleItem: ConsignmentItem) => {
          const updated = [sampleItem, ...submissions];
          saveSubmissions(updated);
        }}
        adminWhatsAppNumber={adminPhone}
        onUpdateAdminWhatsApp={(newPhone) => {
          setAdminPhone(newPhone);
          localStorage.setItem(ADMIN_PHONE_KEY, newPhone);
        }}
        onBackToHome={() => navigateTo('/')}
        currentUser={currentUser}
        accessToken={accessToken}
        onAuthSuccess={(user, token) => {
          setCurrentUser(user);
          setAccessToken(token);
        }}
        onLogoutGoogle={() => {
          setCurrentUser(null);
          setAccessToken(null);
        }}
      />
    );
  }

  // ROUTE: DEFAULT PUBLIC HOME PAGE (Formulir Titip Jual Saja - Sensitive Data Hidden)
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pb-16 selection:bg-[#1B365D] selection:text-white">
      {/* Header - Privacy Clean */}
      <Header
        onOpenFAQ={() => setIsFAQOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 sm:py-8">
        {/* Intro banner */}
        <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-800">
                Punya Barang Bagus Jarang Dipakai?
              </h2>
              <p className="text-xs text-slate-500">
                Titip jualkan di <strong>info.barkasmajalengka</strong>. Dapatkan uang tunai tanpa repot COD!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFAQOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B365D] hover:text-amber-600 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Cara Kerja & Tenor</span>
          </button>
        </div>

        {/* The Consignment Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: DATA DIRI PENITIP */}
          <div 
            data-field="fullName"
            className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-[#1B365D] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                1
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#1B365D] flex items-center gap-2">
                  <span>Data Diri Penitip</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Informasi kontak Anda dijamin aman & hanya digunakan untuk konfirmasi titip jual
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Gilang Ramadhan"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-3 text-sm rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden transition-all ${
                      errors.fullName
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-[#1B365D] focus:ring-2 focus:ring-[#1B365D]/20'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.fullName}
                  </p>
                )}
              </div>

              {/* Nomor WhatsApp */}
              <div className="sm:col-span-1" data-field="whatsappNumber">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nomor WhatsApp <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={whatsappNumber}
                    onChange={(e) => {
                      setWhatsappNumber(e.target.value);
                      if (errors.whatsappNumber) setErrors((prev) => ({ ...prev, whatsappNumber: '' }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-3 text-sm rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden transition-all ${
                      errors.whatsappNumber
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-[#1B365D] focus:ring-2 focus:ring-[#1B365D]/20'
                    }`}
                  />
                </div>
                {errors.whatsappNumber && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.whatsappNumber}
                  </p>
                )}
              </div>

              {/* Domisili / Kecamatan di Majalengka */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Domisili / Kecamatan di Majalengka <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <select
                    value={kecamatan}
                    onChange={(e) => setKecamatan(e.target.value)}
                    className="w-full pl-10 pr-8 py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#1B365D] focus:ring-2 focus:ring-[#1B365D]/20 text-slate-800 transition-all appearance-none cursor-pointer"
                  >
                    {KECAMATAN_MAJALENGKA.map((kec) => (
                      <option key={kec} value={kec}>
                        Kecamatan {kec}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Rekening / E-Wallet */}
              <div className="sm:col-span-1" data-field="bankAccount">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Rekening / E-Wallet & Provider <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Wallet className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: BCA 1234567890 a.n Gilang"
                    value={bankAccount}
                    onChange={(e) => {
                      setBankAccount(e.target.value);
                      if (errors.bankAccount) setErrors((prev) => ({ ...prev, bankAccount: '' }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-3 text-sm rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden transition-all ${
                      errors.bankAccount
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-[#1B365D] focus:ring-2 focus:ring-[#1B365D]/20'
                    }`}
                  />
                </div>
                {errors.bankAccount ? (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.bankAccount}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Bisa Bank (BCA/BRI/Mandiri/BJB) atau E-Wallet (GoPay/DANA/ShopeePay)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: DETAIL BARANG */}
          <div 
            data-field="itemNameAndBrand"
            className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-[#1B365D] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                2
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#1B365D] flex items-center gap-2">
                  <span>Detail Barang Titipan</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Semakin spesifik informasi barang, semakin cepat pembeli tertarik
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Kategori Barang */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Kategori Barang <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.label;
                    return (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setCategory(cat.label)}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1B365D] border-[#1B365D] text-white shadow-sm ring-2 ring-[#1B365D]/30'
                            : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <span className="font-bold text-xs sm:text-sm block">
                          {cat.label}
                        </span>
                        <span
                          className={`text-[10px] mt-1 line-clamp-2 ${
                            isSelected ? 'text-slate-200' : 'text-slate-400'
                          }`}
                        >
                          {cat.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nama & Merk Barang + Ukuran */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nama & Merk Barang <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Helm Slimhead Vintage / Nike Dunk Low Panda"
                      value={itemNameAndBrand}
                      onChange={(e) => {
                        setItemNameAndBrand(e.target.value);
                        if (errors.itemNameAndBrand) setErrors((prev) => ({ ...prev, itemNameAndBrand: '' }));
                      }}
                      className={`w-full pl-10 pr-3.5 py-3 text-sm rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden transition-all ${
                        errors.itemNameAndBrand
                          ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                          : 'border-slate-300 focus:border-[#1B365D] focus:ring-2 focus:ring-[#1B365D]/20'
                      }`}
                    />
                  </div>
                  {errors.itemNameAndBrand && (
                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.itemNameAndBrand}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ukuran / Size <span className="text-slate-400 font-normal">(Contoh: M, 42, All Size)</span>
                  </label>
                  <div className="relative">
                    <Ruler className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Contoh: L / 42 / All Size"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3 text-sm rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#1B365D] focus:ring-2 focus:ring-[#1B365D]/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Kondisi Barang */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Kondisi Barang <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CONDITIONS.map((cond) => {
                    const isSelected = condition === cond.label;
                    return (
                      <div
                        key={cond.label}
                        onClick={() => setCondition(cond.label)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-amber-50/50 border-amber-400 ring-2 ring-amber-400/20 shadow-2xs'
                            : 'bg-slate-50/40 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="item_condition"
                          checked={isSelected}
                          onChange={() => setCondition(cond.label)}
                          className="mt-1 text-[#1B365D] focus:ring-[#1B365D]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-800">
                              {cond.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                            {cond.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Deskripsi & Detail Minus */}
              <div data-field="descriptionAndFlaws">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Deskripsi & Detail Minus <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    required
                    placeholder="Ceritakan kelengkapan (box/tag/struk), riwayat pemakaian, serta minus sekecil apapun (contoh: ada sedikit lecet di ujung sol, kancing lepas satu, dsb). Jika sangat mulus, tulis: Tidak ada minus."
                    value={descriptionAndFlaws}
                    onChange={(e) => {
                      setDescriptionAndFlaws(e.target.value);
                      if (errors.descriptionAndFlaws) setErrors((prev) => ({ ...prev, descriptionAndFlaws: '' }));
                    }}
                    className={`w-full p-3 text-sm rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden transition-all ${
                      errors.descriptionAndFlaws
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-[#1B365D] focus:ring-2 focus:ring-[#1B365D]/20'
                    }`}
                  />
                </div>
                {errors.descriptionAndFlaws && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.descriptionAndFlaws}
                  </p>
                )}
              </div>

              {/* Harga Bersih / Nett yang Diinginkan Penitip */}
              <div data-field="nettPrice" className="pt-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Harga Bersih / Nett yang Diinginkan Penitip (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-sm font-bold text-slate-500">
                    Rp
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 350000"
                    value={nettPriceRaw ? parseInt(nettPriceRaw, 10).toLocaleString('id-ID') : ''}
                    onChange={handlePriceChange}
                    className={`w-full pl-12 pr-3.5 py-3.5 text-base sm:text-lg font-mono font-bold rounded-xl border bg-slate-50/50 focus:bg-white focus:outline-hidden transition-all ${
                      errors.nettPrice
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : 'border-slate-300 focus:border-[#1B365D] focus:ring-2 focus:ring-[#1B365D]/20 text-[#1B365D]'
                    }`}
                  />
                </div>
                {errors.nettPrice && (
                  <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.nettPrice}
                  </p>
                )}

                {/* Live Transparent Estimator Banner with 3-Tier Operational Rules */}
                {parsedNettPrice > 0 && (
                  <div className="mt-3 p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200/70 border border-amber-300 text-amber-900 font-bold text-xs">
                        <span>{priceEstimates.tierName}: {priceEstimates.rateDescription}</span>
                      </span>

                      <span className="text-[11px] font-semibold text-slate-500">
                        Biaya Jasa Titip: +{formatRupiah(priceEstimates.estimatedFee)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
                      <span className="text-amber-950 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Uang yang Anda Terima Penuh (Nett):</span>
                      </span>
                      <span className="font-mono font-extrabold text-amber-950 text-base sm:text-lg">
                        {formatRupiah(parsedNettPrice)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-amber-200/80">
                      <span>Estimasi Harga Listing di info.barkasmajalengka:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        ± {formatRupiah(priceEstimates.suggestedListingPrice)}
                      </span>
                    </div>

                    {/* Operational Scheme Details */}
                    <div className="p-2.5 bg-white/90 rounded-xl border border-amber-200/80 text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span>⏳ Batas Waktu Titip (Tenor):</span>
                        <span className="text-[#1B365D]">Maksimal 30 Hari</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 leading-relaxed">
                        • Hari ke-20: Penawaran opsi turun harga (<em>price drop</em>) jika belum laku.<br />
                        • Hari ke-30: Barang dikembalikan atau diperpanjang dengan diskon khusus.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: MEDIA & KETENTUAN */}
          <div 
            data-field="photos"
            className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs transition-all hover:shadow-md space-y-5"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-[#1B365D] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                3
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#1B365D] flex items-center gap-2">
                  <span>Foto Barang & Persetujuan</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Minimal 3 sampai 5 foto jelas untuk bahan kurasi & display
                </p>
              </div>
            </div>

            {/* Photo Uploader */}
            <PhotoUploader
              photos={photos}
              onChange={(newPhotos) => {
                setPhotos(newPhotos);
                if (errors.photos) setErrors((prev) => ({ ...prev, photos: '' }));
              }}
              minPhotos={3}
              maxPhotos={8}
            />
            {errors.photos && (
              <p className="text-xs text-rose-500 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.photos}
              </p>
            )}

            {/* Operational Quality Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                <span className="text-slate-700 font-medium">Kondisi Bersih / Dicuci</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">✓</span>
                <span className="text-slate-700 font-medium">Hanya 100% Original</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">30</span>
                <span className="text-slate-700 font-medium">Masa Titip 30 Hari</span>
              </div>
            </div>

            {/* Checkbox Persetujuan Aturan */}
            <div 
              data-field="agreement"
              className={`p-4 rounded-2xl border transition-all ${
                errors.agreement
                  ? 'bg-rose-50 border-rose-300'
                  : agreementAccepted
                  ? 'bg-emerald-50/50 border-emerald-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreementAccepted}
                  onChange={(e) => {
                    setAgreementAccepted(e.target.checked);
                    if (errors.agreement) setErrors((prev) => ({ ...prev, agreement: '' }));
                  }}
                  className="mt-1 w-4 h-4 rounded text-[#1B365D] focus:ring-[#1B365D] cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  "Saya menyetujui sistem operasional info.barkasmajalengka: barang dalam kondisi <strong>BERSIH (sudah dicuci)</strong>, <strong>100% ORIGINAL</strong>, bebas noda parah/kerusakan fungsi utama, serta menyetujui <strong>skema komisi & masa titip maksimal 30 hari</strong>."
                </span>
              </label>
              {errors.agreement && (
                <p className="text-xs text-rose-600 mt-2 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.agreement}
                </p>
              )}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-[#1B365D] hover:bg-[#24477A] active:scale-[0.99] text-white font-extrabold text-base sm:text-lg shadow-xl shadow-[#1B365D]/25 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                  <span>Sedang Mengirim Data...</span>
                </>
              ) : (
                <>
                  <span>Kirim Data Titip Jual</span>
                  <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2">
              Setelah tombol ditekan, Anda akan mendapatkan <strong>Kode Tiket Titip Jual</strong> dan tombol langsung ke WhatsApp Admin info.barkasmajalengka.
            </p>
          </div>
        </form>
      </main>

      {/* Footer Branding & Discreet Admin Link */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-3xl mx-auto px-4 space-y-2">
          <p className="font-bold text-[#1B365D]">
            info.barkasmajalengka © {new Date().getFullYear()}
          </p>
          <p className="text-[11px]">
            Platform Kurasi & Titip Jual Barang Bekas Berkualitas Majalengka — Transparan, Amanah, Cepat Laku.
          </p>

          {/* Discreet Admin Area Portal */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigateTo('/admin')}
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-[#1B365D] font-medium transition-colors cursor-pointer hover:underline"
            >
              <Lock className="w-3 h-3" />
              <span>Login Pengelola (/admin)</span>
            </button>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {submittedItem && (
        <SuccessModal
          isOpen={isSuccessModalOpen}
          item={submittedItem}
          onClose={() => setIsSuccessModalOpen(false)}
          adminWhatsAppNumber={adminPhone}
          onSyncGoogleForm={handleSyncToGoogleForms}
          isSyncingGoogleForm={isSyncingGoogle}
        />
      )}

      <FAQModal
        isOpen={isFAQOpen}
        onClose={() => setIsFAQOpen(false)}
      />
    </div>
  );
}
