import React, { useState, useEffect, useRef } from 'react';
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
  Lock,
  MessageCircle,
  Search,
  Clock,
  RotateCcw,
  ShoppingBag
} from 'lucide-react';

import { 
  ConsignmentItem, 
  ItemCategory, 
  ItemCondition, 
  KECAMATAN_MAJALENGKA, 
  CATEGORIES, 
  CONDITIONS,
  SubmissionStatus,
  AdminPostStatus,
  WantedRequest,
  WantedRequestStatus,
  ADMIN_CONTACT
} from './types/consignment';
import { formatRupiah, parseRupiahInput, calculateListingEstimates, getTenorTimeline } from './utils/formatters';
import { Header } from './components/Header';
import { PhotoUploader } from './components/PhotoUploader';
import { SuccessModal } from './components/SuccessModal';
import { FAQModal } from './components/FAQModal';
import { CommissionSimulator } from './components/CommissionSimulator';
import { LiveCatalogSection } from './components/LiveCatalogSection';
import { WantedBoardSection } from './components/WantedBoardSection';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AdminDashboard } from './pages/AdminDashboard';
import { initAuth } from './services/googleAuth';
import { createConsignmentGoogleForm } from './services/googleForms';
import {
  triggerInstagramAutoPublish,
  syncInstagramAutoPostConfigWithCloud,
} from './services/instagramAutomation';
import {
  triggerAdminPhoneAlertOnNewSubmission,
  playAdminChimeSound,
  vibrateAdminPhone,
  showAdminBrowserNotification,
  getAdminNotificationConfig,
} from './services/adminNotificationService';
import {
  saveSubmissionToFirebase,
  fetchSubmissionsFromServer,
  subscribeToSubmissions,
  subscribeToLiveCatalog,
  subscribeToSoldCatalog,
  getSubmissionByTicketId,
  updateSubmissionStatusInFirebase,
  updateSubmissionPostStatusInFirebase,
  updateSubmissionPriceInFirebase,
  updateSubmissionAdminNotesInFirebase,
  deleteSubmissionFromFirebase,
  saveWantedRequestToFirebase,
  updateWantedRequestStatusInFirebase,
  deleteWantedRequestFromFirebase,
  subscribeToWantedRequests,
  testFirestoreConnection,
} from './services/firebaseService';

const STORAGE_KEY = 'barkas_majalengka_submissions';
const WANTED_STORAGE_KEY = 'barkas_majalengka_wanted_requests';
const WANTED_DELETED_IDS_KEY = 'barkas_wanted_deleted_ids';
const FORM_DRAFT_KEY = 'barkas_consignment_form_draft';
const ADMIN_PHONE_KEY = 'barkas_admin_whatsapp';
const DEFAULT_ADMIN_PHONE = ADMIN_CONTACT.whatsappInternational;

// Helper to determine if current URL targets admin
const isTargetingAdmin = (): boolean => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = new URLSearchParams(window.location.search);

  return (
    path === '/admin' ||
    path.startsWith('/admin') ||
    hash === '#/admin' ||
    hash === '#admin' ||
    hash.startsWith('#/admin') ||
    search.get('page') === 'admin' ||
    search.get('admin') === 'true'
  );
};

export default function App() {
  // Navigation Route State (/ or /admin)
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return isTargetingAdmin() ? '/admin' : '/';
  });

  // Listen to browser URL changes (pathname, hash, popstate)
  useEffect(() => {
    const handleLocationChange = () => {
      if (isTargetingAdmin()) {
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
    try {
      window.history.pushState({}, '', path);
    } catch {
      // fallback for environments where pushState might fail
    }
    // Also set hash for universal static hosting compatibility (e.g. Vercel / GitHub Pages)
    if (path.startsWith('/admin')) {
      window.location.hash = '/admin';
    } else {
      if (window.location.hash.startsWith('#/admin') || window.location.hash === '#admin') {
        window.location.hash = '';
      }
    }
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
  
  const [adminPhone, setAdminPhone] = useState<string>(DEFAULT_ADMIN_PHONE);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appToast, setAppToast] = useState<string | null>(null);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  // Public Ticket Status Tracker State
  const [ticketSearchQuery, setTicketSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ticketParam = params.get('ticket') || params.get('lacak');
      if (ticketParam) return ticketParam.startsWith('#') ? ticketParam : `#${ticketParam}`;
    }
    return '';
  });
  const [trackedTicket, setTrackedTicket] = useState<ConsignmentItem | null>(null);
  const [isSearchingTicket, setIsSearchingTicket] = useState(false);
  const [ticketSearchError, setTicketSearchError] = useState<string | null>(null);
  const [publicActiveTab, setPublicActiveTab] = useState<'catalog' | 'form' | 'wanted'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'form') return 'form';
      if (params.get('tab') === 'wanted') return 'wanted';
      if (params.get('tab') === 'catalog' || params.get('item')) return 'catalog';
    }
    return 'catalog';
  });
  const [initialCatalogTicketId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('item');
    }
    return null;
  });
  const [liveCatalogItems, setLiveCatalogItems] = useState<ConsignmentItem[]>([]);
  const [soldCatalogItems, setSoldCatalogItems] = useState<ConsignmentItem[]>([]);
  const [wantedRequests, setWantedRequests] = useState<WantedRequest[]>(() => {
    let deletedIds: string[] = [];
    try {
      const savedDeleted = localStorage.getItem(WANTED_DELETED_IDS_KEY);
      if (savedDeleted) deletedIds = JSON.parse(savedDeleted);
    } catch {
      // ignore
    }

    try {
      const saved = localStorage.getItem(WANTED_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((r: WantedRequest) => !deletedIds.includes(r.id));
        }
      }
    } catch {
      // ignore
    }
    const defaults: WantedRequest[] = [
      {
        id: '#REQ-2026-8102',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        requesterName: 'Kang Fajar',
        whatsappNumber: '',
        kecamatan: 'Jatiwangi',
        category: 'Helm & Otomotif',
        itemWanted: 'Helm Cargloss Retro / Bogo Original Size L',
        maxBudget: 220000,
        notes: 'Warna hitam doff atau cream, busa masih kencang, siap COD Jatiwangi / Majalengka Kota.',
        status: 'Masih Dicari',
      },
      {
        id: '#REQ-2026-8149',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        requesterName: 'Teh Nisa',
        whatsappNumber: '',
        kecamatan: 'Majalengka',
        category: 'Sneakers / Sepatu',
        itemWanted: 'New Balance 530 / Compass Velocity Size 39-40',
        maxBudget: 450000,
        notes: 'Original 100%, kondisi mulus layak pakai jalan, lengkap box lebih diutamakan.',
        status: 'Masih Dicari',
      },
    ];
    return defaults.filter((r) => !deletedIds.includes(r.id));
  });
  const [adminWantedRequests, setAdminWantedRequests] = useState<WantedRequest[]>([]);

  // Google Workspace / Forms Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [latestIncomingSubmission, setLatestIncomingSubmission] = useState<ConsignmentItem | null>(null);
  const knownSubmissionIdsRef = useRef<Set<string>>(new Set());
  const initialCloudLoadedRef = useRef<boolean>(false);

  const showAppToast = (msg: string) => {
    setAppToast(msg);
    setTimeout(() => setAppToast(null), 3500);
  };

  // Save submissions to localStorage & state with QuotaExceededError fallback
  const saveSubmissions = (
    updater: ConsignmentItem[] | ((prev: ConsignmentItem[]) => ConsignmentItem[])
  ) => {
    setSubmissions((prev) => {
      const newItems = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      } catch {
        try {
          // Fallback: keep only 1 thumbnail photo per item in localStorage if 5MB quota is exceeded
          const lightweightItems = newItems.slice(0, 30).map((item) => ({
            ...item,
            photos: item.photos && item.photos.length > 0 ? [item.photos[0]] : [],
          }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(lightweightItems));
        } catch (innerErr) {
          console.warn('LocalStorage quota full, relying on Firestore cloud storage:', innerErr);
        }
      }
      return newItems;
    });
  };

  // Restore form draft from sessionStorage on initial mount
  useEffect(() => {
    try {
      const savedDraft = sessionStorage.getItem(FORM_DRAFT_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.fullName) setFullName(draft.fullName);
        if (draft.whatsappNumber) setWhatsappNumber(draft.whatsappNumber);
        if (draft.kecamatan) setKecamatan(draft.kecamatan);
        if (draft.bankAccount) setBankAccount(draft.bankAccount);
        if (draft.category) setCategory(draft.category);
        if (draft.itemNameAndBrand) setItemNameAndBrand(draft.itemNameAndBrand);
        if (draft.size) setSize(draft.size);
        if (draft.condition) setCondition(draft.condition);
        if (draft.descriptionAndFlaws) setDescriptionAndFlaws(draft.descriptionAndFlaws);
        if (draft.nettPriceRaw) setNettPriceRaw(draft.nettPriceRaw);
        if (draft.fullName || draft.itemNameAndBrand || draft.descriptionAndFlaws) {
          setHasRestoredDraft(true);
        }
      }
    } catch {
      // ignore sessionStorage errors
    }
  }, []);

  // Auto-track ticket if ?ticket= or ?lacak= was passed in URL (e.g. from QR scan)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ticketParam = params.get('ticket') || params.get('lacak');
    if (!ticketParam) return;

    const normalized = ticketParam.startsWith('#') ? ticketParam.toUpperCase() : `#${ticketParam.toUpperCase()}`;
    setIsSearchingTicket(true);
    getSubmissionByTicketId(normalized)
      .then((res) => {
        if (res) {
          setTrackedTicket(res);
        } else {
          const savedLocal = localStorage.getItem(STORAGE_KEY);
          if (savedLocal) {
            const parsed: ConsignmentItem[] = JSON.parse(savedLocal);
            const found = parsed.find(
              (i) =>
                i.id.toUpperCase() === normalized ||
                i.id.toUpperCase() === ticketParam.toUpperCase()
            );
            if (found) {
              setTrackedTicket(found);
              return;
            }
          }
          setTicketSearchError(`Tiket "${normalized}" tidak ditemukan. Pastikan kode tiket sudah benar.`);
        }
      })
      .catch(() => {
        setTicketSearchError('Gagal memeriksa status tiket. Silakan coba lagi.');
      })
      .finally(() => {
        setIsSearchingTicket(false);
      });
  }, []);

  // Auto-save form text draft to sessionStorage whenever user types
  useEffect(() => {
    try {
      const draft = {
        fullName,
        whatsappNumber,
        kecamatan,
        bankAccount,
        category,
        itemNameAndBrand,
        size,
        condition,
        descriptionAndFlaws,
        nettPriceRaw,
      };
      sessionStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // ignore sessionStorage errors
    }
  }, [
    fullName,
    whatsappNumber,
    kecamatan,
    bankAccount,
    category,
    itemNameAndBrand,
    size,
    condition,
    descriptionAndFlaws,
    nettPriceRaw,
  ]);

  const handleResetDraft = () => {
    setFullName('');
    setWhatsappNumber('');
    setKecamatan('Majalengka');
    setBankAccount('');
    setCategory('Fashion');
    setItemNameAndBrand('');
    setSize('');
    setCondition('Seperti Baru / Like New');
    setDescriptionAndFlaws('');
    setNettPriceRaw('');
    setPhotos([]);
    setAgreementAccepted(false);
    setErrors({});
    setHasRestoredDraft(false);
    try {
      sessionStorage.removeItem(FORM_DRAFT_KEY);
    } catch {
      // ignore
    }
    showAppToast('Draf formulir telah dikosongkan.');
  };

  // Load initial settings & Google Auth listener
  useEffect(() => {
    testFirestoreConnection();
    syncInstagramAutoPostConfigWithCloud();

    try {
      const savedAdmin = localStorage.getItem(ADMIN_PHONE_KEY);
      if (savedAdmin && savedAdmin !== '6285224000100') {
        setAdminPhone(savedAdmin);
      } else {
        setAdminPhone(DEFAULT_ADMIN_PHONE);
        localStorage.setItem(ADMIN_PHONE_KEY, DEFAULT_ADMIN_PHONE);
      }
    } catch (e) {
      console.warn('Failed to load local storage:', e);
    }

    // Initialize Google Firebase Auth state listener
    const unsubscribeAuth = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
      }
    );

    // Load local submissions on any route so Home Page Etalase also reflects local/offline items immediately
    let initialLocalItems: ConsignmentItem[] = [];
    try {
      const savedSubmissions = localStorage.getItem(STORAGE_KEY);
      if (savedSubmissions) {
        initialLocalItems = JSON.parse(savedSubmissions);
        if (Array.isArray(initialLocalItems) && initialLocalItems.length > 0) {
          setSubmissions(initialLocalItems);
          // Ensure any local items are also pushed to Firestore in the background
          initialLocalItems.forEach((item) => {
            saveSubmissionToFirebase(item).catch(() => {
              // ignore background sync errors
            });
          });
        }
      }
    } catch {
      // ignore
    }

    // Subscribe to public Live Catalog ('Sedang Dipajang (Live)', 'Diterima', 'Menunggu Kurasi') with privacy masking
    const unsubscribeLiveCatalog = subscribeToLiveCatalog((liveItems) => {
      setLiveCatalogItems(liveItems);
    });

    // Subscribe to recently sold items ('Terjual' / 'Selesai & Dicairkan') with privacy masking
    const unsubscribeSoldCatalog = subscribeToSoldCatalog((soldItems) => {
      setSoldCatalogItems(soldItems);
    });

    // Subscribe to public Wanted Board requests with privacy masking on phone number
    const unsubscribeWanted = subscribeToWantedRequests((cloudRequests) => {
      let deletedIds: string[] = [];
      try {
        const savedDeleted = localStorage.getItem(WANTED_DELETED_IDS_KEY);
        if (savedDeleted) deletedIds = JSON.parse(savedDeleted);
      } catch {
        // ignore
      }
      const filteredCloud = cloudRequests.filter((r) => !deletedIds.includes(r.id));
      if (filteredCloud.length > 0) {
        setAdminWantedRequests(filteredCloud);
        const masked = filteredCloud.map((r) => ({ ...r, whatsappNumber: '' }));
        setWantedRequests(masked);
        try {
          localStorage.setItem(WANTED_STORAGE_KEY, JSON.stringify(masked));
        } catch {
          // ignore
        }
      }
    });

    return () => {
      if (typeof unsubscribeAuth === 'function') unsubscribeAuth();
      if (typeof unsubscribeLiveCatalog === 'function') unsubscribeLiveCatalog();
      if (typeof unsubscribeSoldCatalog === 'function') unsubscribeSoldCatalog();
      if (typeof unsubscribeWanted === 'function') unsubscribeWanted();
    };
  }, []);

  const refreshCloudSubmissions = async (): Promise<number> => {
    const serverItems = await fetchSubmissionsFromServer(100);
    if (serverItems.length > 0) {
      setIsFirebaseConnected(true);
      saveSubmissions((prev) => {
        const cloudMap = new Map<string, ConsignmentItem>();
        serverItems.forEach((item) => cloudMap.set(item.id, item));
        // Keep any unsynced local items created in the last 10 minutes
        prev.forEach((localItem) => {
          if (!cloudMap.has(localItem.id) && localItem.whatsappNumber) {
            saveSubmissionToFirebase(localItem).catch(() => {});
            cloudMap.set(localItem.id, localItem);
          }
        });
        return Array.from(cloudMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    }
    return serverItems.length;
  };

  // Subscribe to full submissions collection ONLY when on /admin route (Protects consignor privacy on public page)
  useEffect(() => {
    const isAdminRoute = currentPath === '/admin' || currentPath.startsWith('/admin');
    if (!isAdminRoute) {
      return;
    }

    let initialLocalItems: ConsignmentItem[] = [];
    try {
      const savedSubmissions = localStorage.getItem(STORAGE_KEY);
      if (savedSubmissions) {
        initialLocalItems = JSON.parse(savedSubmissions);
        setSubmissions(initialLocalItems);
      }
    } catch {
      // ignore
    }

    // Immediate direct server pull on /admin open
    refreshCloudSubmissions();

    let hasSyncedLocalToCloud = false;

    const unsubscribeFirestore = subscribeToSubmissions(
      (cloudItems) => {
        setIsFirebaseConnected(true);

        if (!hasSyncedLocalToCloud) {
          hasSyncedLocalToCloud = true;
          const cloudIds = new Set(cloudItems.map((item) => item.id));
          const missingLocalItems = initialLocalItems.filter(
            (item) => !cloudIds.has(item.id) && item.whatsappNumber
          );

          if (missingLocalItems.length > 0) {
            missingLocalItems.forEach((item) => {
              saveSubmissionToFirebase(item).catch((err) =>
                console.warn('Failed to migrate local submission to Firestore:', err)
              );
            });
            const merged = [...missingLocalItems, ...cloudItems].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            saveSubmissions(merged);
            return;
          }
        }

        // Realtime phone alert detection on Admin device
        if (!initialCloudLoadedRef.current) {
          initialCloudLoadedRef.current = true;
          cloudItems.forEach((item) => knownSubmissionIdsRef.current.add(item.id));
        } else {
          // Check for newly arrived submissions (new ticket not previously in known list)
          const brandNewItems = cloudItems.filter(
            (item) => !knownSubmissionIdsRef.current.has(item.id) && item.status === 'Menunggu Kurasi'
          );
          cloudItems.forEach((item) => knownSubmissionIdsRef.current.add(item.id));

          if (brandNewItems.length > 0) {
            const newest = brandNewItems[0];
            const notifCfg = getAdminNotificationConfig();
            if (notifCfg.soundChimeEnabled) {
              playAdminChimeSound();
            }
            if (notifCfg.vibrationEnabled) {
              vibrateAdminPhone();
            }
            if (notifCfg.browserPushEnabled) {
              showAdminBrowserNotification(newest);
            }
            setLatestIncomingSubmission(newest);
          }
        }

        saveSubmissions(cloudItems);
      },
      () => {
        setIsFirebaseConnected(false);
      }
    );

    // Automatically re-fetch from server when Admin switches back from WhatsApp to browser tab or every 10s
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshCloudSubmissions();
      }
    };
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    const pollInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshCloudSubmissions();
      }
    }, 10000);

    return () => {
      if (typeof unsubscribeFirestore === 'function') unsubscribeFirestore();
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.clearInterval(pollInterval);
    };
  }, [currentPath]);

  // Public Ticket Status Lookup Handler
  const handleTrackTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = ticketSearchQuery.trim().toUpperCase();
    if (!cleaned) {
      setTicketSearchError('Masukkan kode tiket Anda (contoh: #BM-2026-1234).');
      setTrackedTicket(null);
      return;
    }

    setIsSearchingTicket(true);
    setTicketSearchError(null);
    try {
      const normalizedTicket = cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
      const cloudResult = await getSubmissionByTicketId(normalizedTicket);
      if (cloudResult) {
        setTrackedTicket(cloudResult);
        return;
      }

      // Fallback check in local storage if offline
      const savedLocal = localStorage.getItem(STORAGE_KEY);
      if (savedLocal) {
        const parsed: ConsignmentItem[] = JSON.parse(savedLocal);
        const foundLocal = parsed.find(
          (item) => item.id.toUpperCase() === normalizedTicket || item.id.toUpperCase() === cleaned
        );
        if (foundLocal) {
          setTrackedTicket(foundLocal);
          return;
        }
      }

      setTrackedTicket(null);
      setTicketSearchError(`Tiket "${normalizedTicket}" tidak ditemukan. Pastikan kode tiket sudah benar.`);
    } catch {
      setTicketSearchError('Gagal memeriksa status tiket. Silakan coba lagi.');
    } finally {
      setIsSearchingTicket(false);
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
    if (photos.length < 1) {
      newErrors.photos = 'Wajib mengunggah minimal 1 foto barang.';
    }
    if (!agreementAccepted) {
      newErrors.agreement = 'Anda wajib menyetujui ketentuan keaslian & sistem titip jual.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler (Saves to both localStorage and Firebase Firestore for real-time cross-device sync)
  const handleSubmit = async (e: React.FormEvent) => {
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

      // Update localStorage immediately for instant responsiveness & offline fallback
      saveSubmissions((prev) => [newItem, ...prev.filter((s) => s.id !== newItem.id)]);

      // Save to Firebase Firestore BEFORE opening SuccessModal so switching to WhatsApp app on mobile never interrupts the upload
      const cloudSavePromise = saveSubmissionToFirebase(newItem).catch((firebaseErr) => {
        console.warn('Firestore sync warning (data remains saved in localStorage):', firebaseErr);
      });
      await Promise.race([
        cloudSavePromise,
        new Promise((resolve) => setTimeout(resolve, 7000)),
      ]);

      // Trigger Instagram Auto-Post if enabled on new submission
      triggerInstagramAutoPublish(newItem, 'new_submission').catch(() => {
        // ignore background webhook errors on public submission
      });

      // Trigger instant notification to Admin's HP (Telegram Bot & Webhook)
      triggerAdminPhoneAlertOnNewSubmission(newItem).catch((notifErr) => {
        console.warn('Background admin phone alert warning:', notifErr);
      });

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
      setHasRestoredDraft(false);
      try {
        sessionStorage.removeItem(FORM_DRAFT_KEY);
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('Error submitting consignment form:', err);
      showAppToast('Terjadi kendala saat mengirim data. Silakan coba lagi.');
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
      showAppToast('✅ Google Form resmi berhasil dibuat dan disinkronkan!');
    } catch (err: any) {
      console.error('Sync to Google Form error:', err);
      showAppToast('⚠️ Gagal menyinkronkan ke Google Forms.');
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  // Merge Firestore live catalog with local active submissions (privacy-masked) so items never show (0) if saved locally
  const effectiveLiveCatalogItems = React.useMemo(() => {
    const activeStatuses: SubmissionStatus[] = [
      'Sedang Dipajang (Live)',
      'Booked (Di-DP)',
      'Diterima',
      'Menunggu Kurasi',
    ];
    const map = new Map<string, ConsignmentItem>();

    // First add local active items (masked for public view)
    submissions.forEach((item) => {
      if (activeStatuses.includes(item.status) && item.postStatus !== 'Sold Out') {
        map.set(item.id, {
          ...item,
          whatsappNumber: '',
          bankAccount: '',
        });
      }
    });

    // Cloud items override local items (since cloud items have full photos not truncated by localStorage)
    liveCatalogItems.forEach((item) => {
      if (activeStatuses.includes(item.status) && item.postStatus !== 'Sold Out') {
        map.set(item.id, item);
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [liveCatalogItems, submissions]);

  const effectiveSoldCatalogItems = React.useMemo(() => {
    const soldStatuses: SubmissionStatus[] = ['Terjual', 'Selesai & Dicairkan'];
    const map = new Map<string, ConsignmentItem>();

    submissions.forEach((item) => {
      if (soldStatuses.includes(item.status) || item.postStatus === 'Sold Out') {
        map.set(item.id, {
          ...item,
          whatsappNumber: '',
          bankAccount: '',
        });
      }
    });

    soldCatalogItems.forEach((item) => {
      map.set(item.id, item);
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [soldCatalogItems, submissions]);

  // ROUTE: IF /admin -> RENDER PROTECTED ADMIN DASHBOARD
  if (currentPath === '/admin') {
    return (
      <AdminDashboard
        submissions={submissions}
        isFirebaseConnected={isFirebaseConnected}
        onRefreshCloud={refreshCloudSubmissions}
        onUpdateStatus={(id: string, newStatus: SubmissionStatus) => {
          saveSubmissions((prev) => {
            const updated = prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s));
            const target = updated.find((s) => s.id === id);
            if (newStatus === 'Sedang Dipajang (Live)' && target) {
              triggerInstagramAutoPublish({ ...target, status: newStatus }, 'admin_live').catch(() => {});
            }
            updateSubmissionStatusInFirebase(id, newStatus).catch(() => {
              if (target) {
                saveSubmissionToFirebase(target).catch((err) =>
                  console.warn('Failed to sync status to Firestore:', err)
                );
              }
            });
            return updated;
          });
        }}
        onUpdatePostStatus={(id: string, newPostStatus: AdminPostStatus) => {
          saveSubmissions((prev) => {
            const updated = prev.map((s) => (s.id === id ? { ...s, postStatus: newPostStatus } : s));
            const target = updated.find((s) => s.id === id);
            if (newPostStatus === 'Posted' && target) {
              triggerInstagramAutoPublish({ ...target, postStatus: newPostStatus }, 'admin_live').catch(() => {});
            }
            updateSubmissionPostStatusInFirebase(id, newPostStatus).catch(() => {
              if (target) {
                saveSubmissionToFirebase(target).catch((err) =>
                  console.warn('Failed to sync postStatus to Firestore:', err)
                );
              }
            });
            return updated;
          });
        }}
        onUpdatePrice={async (id: string, newNettPrice: number, previousNettPrice?: number) => {
          saveSubmissions((prev) =>
            prev.map((s) =>
              s.id === id
                ? {
                    ...s,
                    nettPrice: newNettPrice,
                    previousNettPrice: previousNettPrice && previousNettPrice > 0 ? previousNettPrice : undefined,
                  }
                : s
            )
          );
          await updateSubmissionPriceInFirebase(id, newNettPrice, previousNettPrice);
        }}
        onUpdateAdminNotes={async (
          id: string,
          notes: {
            adminRackLocation?: string;
            adminBottomNettPrice?: number;
            adminInternalNotes?: string;
          }
        ) => {
          saveSubmissions((prev) =>
            prev.map((s) =>
              s.id === id
                ? {
                    ...s,
                    adminRackLocation: notes.adminRackLocation,
                    adminBottomNettPrice: notes.adminBottomNettPrice,
                    adminInternalNotes: notes.adminInternalNotes,
                  }
                : s
            )
          );
          await updateSubmissionAdminNotesInFirebase(id, notes);
        }}
        onDeleteSubmission={(id: string) => {
          saveSubmissions((prev) => prev.filter((s) => s.id !== id));
          deleteSubmissionFromFirebase(id).catch((err) =>
            console.warn('Failed to delete submission from Firestore:', err)
          );
        }}
        onAddSampleItem={(sampleItem: ConsignmentItem) => {
          saveSubmissions((prev) => [sampleItem, ...prev.filter((s) => s.id !== sampleItem.id)]);
          saveSubmissionToFirebase(sampleItem).catch((err) =>
            console.warn('Failed to save sample item to Firestore:', err)
          );
        }}
        wantedRequests={adminWantedRequests.length > 0 ? adminWantedRequests : wantedRequests}
        onUpdateWantedStatus={(reqId: string, newStatus: WantedRequestStatus) => {
          setAdminWantedRequests((prev) =>
            prev.map((r) => (r.id === reqId ? { ...r, status: newStatus } : r))
          );
          setWantedRequests((prev) => {
            const updated = prev.map((r) => (r.id === reqId ? { ...r, status: newStatus } : r));
            try {
              localStorage.setItem(WANTED_STORAGE_KEY, JSON.stringify(updated));
            } catch {
              // ignore
            }
            return updated;
          });
          updateWantedRequestStatusInFirebase(reqId, newStatus).catch((err) =>
            console.warn('Failed to update wanted request status in Firestore:', err)
          );
        }}
        onDeleteWantedRequest={(reqId: string) => {
          try {
            const savedDeleted = localStorage.getItem(WANTED_DELETED_IDS_KEY);
            const deletedIds: string[] = savedDeleted ? JSON.parse(savedDeleted) : [];
            if (!deletedIds.includes(reqId)) {
              localStorage.setItem(WANTED_DELETED_IDS_KEY, JSON.stringify([...deletedIds, reqId]));
            }
          } catch {
            // ignore
          }
          setAdminWantedRequests((prev) => prev.filter((r) => r.id !== reqId));
          setWantedRequests((prev) => {
            const updated = prev.filter((r) => r.id !== reqId);
            try {
              localStorage.setItem(WANTED_STORAGE_KEY, JSON.stringify(updated));
            } catch {
              // ignore
            }
            return updated;
          });
          deleteWantedRequestFromFirebase(reqId).catch((err) =>
            console.warn('Failed to delete wanted request from Firestore:', err)
          );
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
        latestIncomingSubmission={latestIncomingSubmission}
        onDismissIncomingSubmission={() => setLatestIncomingSubmission(null)}
      />
    );
  }

  // ROUTE: DEFAULT PUBLIC HOME PAGE (Formulir Titip Jual Saja - Sensitive Data Hidden)
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pb-16 selection:bg-[#1B365D] selection:text-white">
      {/* Header - Privacy Clean */}
      <Header
        onOpenFAQ={() => setIsFAQOpen(true)}
        activeTab={publicActiveTab}
        onSelectTab={(tab) => setPublicActiveTab(tab)}
        liveCount={effectiveLiveCatalogItems.length}
        wantedCount={wantedRequests.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8">
        {/* Intro Gazette Bulletin Notice */}
        <div className="mb-6 p-4 sm:p-5 bg-[#FAF7F2] border-2 border-stone-800 shadow-[4px_4px_0px_#1C1917] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C25E34] font-bold block">
              ★ MAKLUMAT RESMI WARGA MAJALENGKA ★
            </span>
            <h2 className="text-base sm:text-xl font-serif-editorial font-bold text-stone-950">
              Punya Barang Bagus Jarang Dipakai?
            </h2>
            <p className="text-xs text-stone-700 max-w-xl leading-relaxed">
              Titip jualkan di <strong>info.barkasmajalengka</strong>. Dapatkan dana bersih utuh 100% tanpa repot COD, tanpa risiko penipuan online.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsFAQOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-stone-900 bg-[#ECE5D8] hover:bg-stone-300 px-3.5 py-2 border-2 border-stone-800 shadow-[2px_2px_0px_#1C1917] transition-colors cursor-pointer shrink-0"
          >
            <span>BACA KETENTUAN & SOP</span>
          </button>
        </div>

        {/* Public Ticket Status Tracker (Archival Ledger Lookup) */}
        <div className="mb-6 bg-[#FAF7F2] border-2 border-stone-800 shadow-[4px_4px_0px_#1C1917] p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-stone-800 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-600 block">
                LEMBAR PEMERIKSAAN MANDIRI
              </span>
              <h3 className="text-base sm:text-lg font-serif-editorial font-bold text-stone-950">
                Pengecekan Arsip Tiket & Sisa Masa Titip 30 Hari
              </h3>
            </div>
            <span className="text-[11px] font-mono text-stone-600">
              Update Real-Time 24 Jam
            </span>
          </div>

          <form onSubmit={handleTrackTicket} className="flex flex-col sm:flex-row gap-2 pt-1">
            <input
              type="text"
              value={ticketSearchQuery}
              onChange={(e) => {
                setTicketSearchQuery(e.target.value);
                if (ticketSearchError) setTicketSearchError(null);
              }}
              placeholder="Ketik Kode Tiket (Contoh: #BM-2026-4821)"
              className="flex-1 px-3.5 py-2.5 border-2 border-stone-400 bg-white focus:border-stone-900 focus:outline-hidden text-xs sm:text-sm font-mono uppercase shadow-[2px_2px_0px_rgba(0,0,0,0.06)]"
            />
            <button
              type="submit"
              disabled={isSearchingTicket}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-200 font-mono font-bold text-xs sm:text-sm transition-colors border-2 border-stone-900 shadow-[2px_2px_0px_#C25E34] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isSearchingTicket ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Memeriksa Arsip...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-amber-400" />
                  <span>Lacak Tiket</span>
                </>
              )}
            </button>
          </form>

          {ticketSearchError && (
            <p className="text-xs text-rose-700 bg-rose-50 border-2 border-rose-400 px-3.5 py-2.5 flex items-center gap-2 font-mono font-bold shadow-[2px_2px_0px_#E11D48]">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{ticketSearchError}</span>
            </p>
          )}

          {trackedTicket && (() => {
            const tenor = getTenorTimeline(trackedTicket.createdAt);
            const estimates = calculateListingEstimates(trackedTicket.nettPrice);
            const progressPercent = Math.min(100, Math.round((tenor.elapsedDays / 30) * 100));
            return (
              <div className="p-5 bg-[#ECE5D8] border-2 border-stone-800 shadow-[3px_3px_0px_#1C1917] space-y-4 animate-in fade-in duration-150">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-stone-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 bg-stone-900 text-amber-300 font-mono font-bold text-xs border border-stone-800 shadow-[2px_2px_0px_#C25E34]">
                      {trackedTicket.id}
                    </span>
                    <div>
                      <h4 className="font-serif-editorial font-bold text-stone-950 text-sm sm:text-base">
                        {trackedTicket.itemNameAndBrand}
                      </h4>
                      <span className="text-[11px] font-mono text-stone-600">
                        Kategori: {trackedTicket.category} • Size: {trackedTicket.size || 'All Size'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 text-xs font-mono font-bold border-2 ${
                      trackedTicket.status === 'Terjual' || trackedTicket.status === 'Selesai & Dicairkan'
                        ? 'bg-emerald-100 text-emerald-950 border-emerald-700'
                        : trackedTicket.status === 'Sedang Dipajang (Live)'
                        ? 'bg-amber-300 text-stone-950 border-stone-900 shadow-[2px_2px_0px_#1C1917]'
                        : trackedTicket.status === 'Diterima'
                        ? 'bg-purple-100 text-purple-950 border-purple-700'
                        : trackedTicket.status === 'Ditolak'
                        ? 'bg-rose-100 text-rose-950 border-rose-700'
                        : 'bg-amber-100 text-amber-950 border-amber-600'
                    }`}
                  >
                    {trackedTicket.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-3 bg-white border border-stone-800 shadow-[2px_2px_0px_rgba(0,0,0,0.06)]">
                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">Harga Nett Penitip</span>
                    <strong className="text-stone-950 font-mono text-sm">{formatRupiah(trackedTicket.nettPrice)}</strong>
                  </div>
                  <div className="p-3 bg-white border border-stone-800 shadow-[2px_2px_0px_rgba(0,0,0,0.06)]">
                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">Est. Harga Tayang</span>
                    <strong className="text-[#C25E34] font-mono text-sm">± {formatRupiah(estimates.suggestedListingPrice)}</strong>
                  </div>
                  <div className="p-3 bg-white border border-stone-800 shadow-[2px_2px_0px_rgba(0,0,0,0.06)] col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider block">Status Masa Titip</span>
                    <strong className="text-stone-900 flex items-center gap-1 font-mono text-xs">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Hari ke-{tenor.elapsedDays} / 30 Hari</span>
                    </strong>
                  </div>
                </div>

                <div className="space-y-1.5 bg-white p-3 border border-stone-800">
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-700">
                    <span>Sisa Masa Titip: <strong>{tenor.remainingDays} hari</strong></span>
                    <span className="text-stone-600">
                      Evaluasi: {tenor.day20Date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • Batas: {tenor.day30Date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-stone-200 border border-stone-700 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        tenor.isExpired ? 'bg-rose-600' : tenor.isPriceDropPeriod ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setTrackedTicket(null)}
                    className="text-xs font-mono text-stone-600 hover:text-stone-950 font-bold underline cursor-pointer"
                  >
                    [Tutup Detail Arsip]
                  </button>
                  <a
                    href={`https://wa.me/${ADMIN_CONTACT.whatsappInternational}?text=${encodeURIComponent(
                      `Halo Admin Esteh, saya ingin menanyakan update untuk Kode Tiket ${trackedTicket.id} (${trackedTicket.itemNameAndBrand}).`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-200 text-xs font-mono font-bold border-2 border-stone-900 shadow-[2px_2px_0px_#C25E34] transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tanya Admin Esteh (WA)</span>
                  </a>
                </div>
              </div>
            );
          })()}
        </div>

        {/* If user selected Etalase Barang Live or Titip Cari Barang tab */}
        {publicActiveTab === 'catalog' ? (
          <LiveCatalogSection
            items={effectiveLiveCatalogItems}
            soldItems={effectiveSoldCatalogItems}
            adminWhatsAppNumber={adminPhone}
            initialSelectedTicketId={initialCatalogTicketId}
            onSwitchToForm={() => setPublicActiveTab('form')}
            onSwitchToWanted={() => setPublicActiveTab('wanted')}
          />
        ) : publicActiveTab === 'wanted' ? (
          <WantedBoardSection
            requests={wantedRequests}
            adminWhatsAppNumber={adminPhone}
            onAddRequest={async (newReq) => {
              setAdminWantedRequests((prev) => [newReq, ...prev]);
              const maskedNewReq = { ...newReq, whatsappNumber: '' };
              setWantedRequests((prev) => {
                const updated = [maskedNewReq, ...prev];
                try {
                  localStorage.setItem(WANTED_STORAGE_KEY, JSON.stringify(updated));
                } catch {
                  // ignore
                }
                return updated;
              });
              saveWantedRequestToFirebase(newReq).catch(() => {
                // ignore offline error, saved locally
              });
              showAppToast('✅ Permintaan cari barang Anda berhasil ditayangkan di Papan Wanted!');
            }}
            onFulfillViaForm={(prefill) => {
              setCategory(prefill.category);
              setItemNameAndBrand(prefill.itemNameAndBrand);
              setNettPriceRaw(String(prefill.suggestedNettPrice));
              setPublicActiveTab('form');
              showAppToast(
                `✅ Formulir telah diisi otomatis untuk "${prefill.itemNameAndBrand}". Silakan lengkapi foto & data diri Anda!`
              );
              window.scrollTo({ top: 320, behavior: 'smooth' });
            }}
          />
        ) : (
          <>
            {/* Lembar II Headline Header */}
            <div className="mb-6 p-4 sm:p-5 bg-stone-900 text-stone-50 border-2 border-stone-900 shadow-[4px_4px_0px_#C25E34] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold block">
                  LEMBAR II · BLANGKO RESMI PENDAFTARAN TITIP JUAL KONSINYASI
                </span>
                <h2 className="text-base sm:text-xl font-serif-editorial font-bold text-stone-50">
                  Formulir Pengajuan Titip Jual
                </h2>
                <p className="text-xs text-stone-300 max-w-xl leading-relaxed">
                  Isi data barang & kontak Anda dengan lengkap. Barang yang disetujui akan dipajang di <strong>LEMBAR I (Etalase Live)</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPublicActiveTab('catalog')}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 px-3.5 py-2 border-2 border-stone-900 shadow-[2px_2px_0px_#1C1917] transition-colors cursor-pointer shrink-0"
              >
                <span>LIHAT LEMBAR I (ETALASE)</span>
              </button>
            </div>

            {/* Interactive Commission & Listing Price Simulator */}
            <CommissionSimulator
              onApplyNettPrice={(nettAmount) => {
                setNettPriceRaw(String(nettAmount));
                if (errors.nettPrice) {
                  setErrors({ ...errors, nettPrice: '' });
                }
                showAppToast(
                  `✅ Harga Nett ${formatRupiah(nettAmount)} berhasil diterapkan ke formulir!`
                );
              }}
            />

            {/* Auto-saved Draft Banner if present */}
        {(hasRestoredDraft || fullName || itemNameAndBrand || descriptionAndFlaws) && (
          <div className="mb-4 px-4 py-2.5 rounded-xl bg-amber-50/90 border border-amber-200/80 flex items-center justify-between gap-2 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Auto-Save Draf Aktif:</strong> Isian formulir Anda otomatis tersimpan sementara agar tidak hilang jika halaman ter-refresh.
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetDraft}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] shrink-0 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Form</span>
            </button>
          </div>
        )}

        {/* The Consignment Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: DATA DIRI PENITIP */}
          <div 
            data-field="fullName"
            className="bg-[#FAF7F2] border-2 border-stone-800 shadow-[4px_4px_0px_#1C1917] p-6 sm:p-8"
          >
            <div className="flex items-center gap-3 pb-4 mb-5 border-b-2 border-stone-800">
              <div className="w-8 h-8 bg-stone-900 text-stone-50 border border-stone-800 flex items-center justify-center font-mono font-bold text-sm">
                01
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-serif-editorial font-bold text-stone-950 uppercase tracking-tight">
                  PASAL 01. IDENTITAS PENITIP & ALAMAT DOMISILI
                </h2>
                <p className="text-xs text-stone-600 font-serif-editorial italic">
                  Data kontak resmi untuk konfirmasi kurasi fisik & verifikasi pencairan dana
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5 font-mono">
                  Nama Lengkap <span className="text-[#C25E34]">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-500" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Gilang Ramadhan"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-3 text-sm border-2 bg-white text-stone-900 focus:outline-hidden transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.05)] ${
                      errors.fullName
                        ? 'border-rose-500 focus:border-rose-600'
                        : 'border-stone-400 focus:border-stone-900'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-mono">
                    <AlertCircle className="w-3 h-3" /> {errors.fullName}
                  </p>
                )}
              </div>

              {/* Nomor WhatsApp */}
              <div className="sm:col-span-1" data-field="whatsappNumber">
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5 font-mono">
                  Nomor WhatsApp <span className="text-[#C25E34]">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-500" />
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={whatsappNumber}
                    onChange={(e) => {
                      setWhatsappNumber(e.target.value);
                      if (errors.whatsappNumber) setErrors((prev) => ({ ...prev, whatsappNumber: '' }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-3 text-sm border-2 bg-white text-stone-900 focus:outline-hidden transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.05)] ${
                      errors.whatsappNumber
                        ? 'border-rose-500 focus:border-rose-600'
                        : 'border-stone-400 focus:border-stone-900'
                    }`}
                  />
                </div>
                {errors.whatsappNumber && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-mono">
                    <AlertCircle className="w-3 h-3" /> {errors.whatsappNumber}
                  </p>
                )}
              </div>

              {/* Domisili / Kecamatan di Majalengka */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5 font-mono">
                  Domisili / Kecamatan di Majalengka <span className="text-[#C25E34]">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-500" />
                  <select
                    value={kecamatan}
                    onChange={(e) => setKecamatan(e.target.value)}
                    className="w-full pl-10 pr-8 py-3 text-sm border-2 border-stone-400 bg-white focus:outline-hidden focus:border-stone-900 text-stone-900 transition-all appearance-none cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,0.05)]"
                  >
                    {KECAMATAN_MAJALENGKA.map((kec) => (
                      <option key={kec} value={kec}>
                        Kecamatan {kec}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-700">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Rekening / E-Wallet */}
              <div className="sm:col-span-1" data-field="bankAccount">
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5 font-mono">
                  Rekening / E-Wallet & Provider <span className="text-[#C25E34]">*</span>
                </label>
                <div className="relative">
                  <Wallet className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-500" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: BCA 1234567890 a.n Gilang"
                    value={bankAccount}
                    onChange={(e) => {
                      setBankAccount(e.target.value);
                      if (errors.bankAccount) setErrors((prev) => ({ ...prev, bankAccount: '' }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-3 text-sm border-2 bg-white text-stone-900 focus:outline-hidden transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.05)] ${
                      errors.bankAccount
                        ? 'border-rose-500 focus:border-rose-600'
                        : 'border-stone-400 focus:border-stone-900'
                    }`}
                  />
                </div>
                {errors.bankAccount ? (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-mono">
                    <AlertCircle className="w-3 h-3" /> {errors.bankAccount}
                  </p>
                ) : (
                  <p className="text-[11px] text-stone-500 mt-1 font-serif-editorial italic">
                    Bisa Bank (BCA/BRI/Mandiri/BJB) atau E-Wallet (GoPay/DANA/ShopeePay)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: DETAIL BARANG */}
          <div 
            data-field="itemNameAndBrand"
            className="bg-[#FAF7F2] border-2 border-stone-800 shadow-[4px_4px_0px_#1C1917] p-6 sm:p-8"
          >
            <div className="flex items-center gap-3 pb-4 mb-5 border-b-2 border-stone-800">
              <div className="w-8 h-8 bg-stone-900 text-stone-50 border border-stone-800 flex items-center justify-center font-mono font-bold text-sm">
                02
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-serif-editorial font-bold text-stone-950 uppercase tracking-tight">
                  PASAL 02. SPESIFIKASI BARANG, KONDISI & HARGA NETT
                </h2>
                <p className="text-xs text-stone-600 font-serif-editorial italic">
                  Semakin spesifik riwayat pemakaian & minus barang, semakin cepat pembeli percaya
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Kategori Barang */}
              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-2 font-mono">
                  Kategori Barang <span className="text-[#C25E34]">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.label;
                    return (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => setCategory(cat.label)}
                        className={`p-3 border-2 text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-stone-900 border-stone-900 text-stone-50 shadow-[3px_3px_0px_#C25E34]'
                            : 'bg-white border-stone-400 text-stone-800 hover:border-stone-800 hover:bg-[#FAF7F2] shadow-[2px_2px_0px_rgba(0,0,0,0.05)]'
                        }`}
                      >
                        <span className="font-bold text-xs sm:text-sm block font-mono">
                          {cat.label}
                        </span>
                        <span
                          className={`text-[10px] mt-1 line-clamp-2 ${
                            isSelected ? 'text-amber-200/90' : 'text-stone-500'
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
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5 font-mono">
                    Nama & Merk Barang <span className="text-[#C25E34]">*</span>
                  </label>
                  <div className="relative">
                    <Tag className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-500" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Helm Slimhead Vintage / Nike Dunk Low Panda"
                      value={itemNameAndBrand}
                      onChange={(e) => {
                        setItemNameAndBrand(e.target.value);
                        if (errors.itemNameAndBrand) setErrors((prev) => ({ ...prev, itemNameAndBrand: '' }));
                      }}
                      className={`w-full pl-10 pr-3.5 py-3 text-sm border-2 bg-white text-stone-900 focus:outline-hidden transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.05)] ${
                        errors.itemNameAndBrand
                          ? 'border-rose-500 focus:border-rose-600'
                          : 'border-stone-400 focus:border-stone-900'
                      }`}
                    />
                  </div>
                  {errors.itemNameAndBrand && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-mono">
                      <AlertCircle className="w-3 h-3" /> {errors.itemNameAndBrand}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5 font-mono">
                    Ukuran / Size <span className="text-stone-500 font-normal font-sans">(Contoh: M, 42, All Size)</span>
                  </label>
                  <div className="relative">
                    <Ruler className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-500" />
                    <input
                      type="text"
                      placeholder="Contoh: L / 42 / All Size"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3 text-sm border-2 border-stone-400 bg-white text-stone-900 focus:outline-hidden focus:border-stone-900 transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.05)]"
                    />
                  </div>
                </div>
              </div>

              {/* Kondisi Barang */}
              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-2 font-mono">
                  Kondisi Barang <span className="text-[#C25E34]">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CONDITIONS.map((cond) => {
                    const isSelected = condition === cond.label;
                    return (
                      <div
                        key={cond.label}
                        onClick={() => setCondition(cond.label)}
                        className={`p-3 border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-[#FAF7F2] border-stone-900 shadow-[3px_3px_0px_#1C1917]'
                            : 'bg-white border-stone-400 hover:border-stone-800 hover:bg-[#FAF7F2] shadow-[2px_2px_0px_rgba(0,0,0,0.05)]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="item_condition"
                          checked={isSelected}
                          onChange={() => setCondition(cond.label)}
                          className="mt-1 text-stone-900 focus:ring-stone-900"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold font-mono text-stone-950">
                              {cond.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-600 mt-0.5 leading-normal">
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
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5 font-mono">
                  Deskripsi & Detail Minus <span className="text-[#C25E34]">*</span>
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
                    className={`w-full p-3 text-sm border-2 bg-white text-stone-900 focus:outline-hidden transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.05)] ${
                      errors.descriptionAndFlaws
                        ? 'border-rose-500 focus:border-rose-600'
                        : 'border-stone-400 focus:border-stone-900'
                    }`}
                  />
                </div>
                {errors.descriptionAndFlaws && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-mono">
                    <AlertCircle className="w-3 h-3" /> {errors.descriptionAndFlaws}
                  </p>
                )}
              </div>

              {/* Harga Bersih / Nett yang Diinginkan Penitip */}
              <div data-field="nettPrice" className="pt-2">
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5 font-mono">
                  Harga Bersih / Nett yang Diinginkan Penitip (Rp) <span className="text-[#C25E34]">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-sm font-bold font-mono text-stone-600">
                    Rp
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 350000"
                    value={nettPriceRaw ? parseRupiahInput(nettPriceRaw).toLocaleString('id-ID') : ''}
                    onChange={handlePriceChange}
                    className={`w-full pl-12 pr-3.5 py-3.5 text-base sm:text-lg font-mono font-bold border-2 bg-white focus:outline-hidden transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.05)] ${
                      errors.nettPrice
                        ? 'border-rose-500 focus:border-rose-600 text-rose-600'
                        : 'border-stone-400 focus:border-stone-900 text-stone-900'
                    }`}
                  />
                </div>
                {errors.nettPrice && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-mono">
                    <AlertCircle className="w-3 h-3" /> {errors.nettPrice}
                  </p>
                )}

                {/* Live Transparent Estimator Banner with 3-Tier Operational Rules */}
                {parsedNettPrice > 0 && (
                  <div className="mt-3 p-4 bg-[#ECE5D8] border-2 border-stone-800 shadow-[3px_3px_0px_#1C1917] space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-stone-900 border border-stone-800 text-amber-200 font-mono font-bold text-xs">
                        <span>{priceEstimates.tierName}: {priceEstimates.rateDescription}</span>
                      </span>

                      <span className="text-[11px] font-mono font-bold text-stone-700">
                        Biaya Jasa Titip: +{formatRupiah(priceEstimates.estimatedFee)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
                      <span className="text-stone-950 font-bold flex items-center gap-1.5 font-serif-editorial">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Uang yang Anda Terima Penuh (Nett):</span>
                      </span>
                      <span className="font-mono font-extrabold text-stone-950 text-base sm:text-lg">
                        {formatRupiah(parsedNettPrice)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-700 pt-2 border-t border-stone-400">
                      <span>Estimasi Harga Listing (Kelipatan 5rb):</span>
                      <span className="font-mono font-bold text-stone-950 text-sm">
                        ± {formatRupiah(priceEstimates.suggestedListingPrice)}
                      </span>
                    </div>

                    {/* Operational Scheme Details */}
                    <div className="p-2.5 bg-white border border-stone-700 text-[11px] text-stone-700 space-y-1">
                      <div className="flex items-center justify-between font-bold text-stone-900 font-mono">
                        <span>⏳ Batas Waktu Titip (Tenor):</span>
                        <span className="text-[#C25E34]">Maksimal 30 Hari</span>
                      </div>
                      <p className="text-[10.5px] text-stone-600 leading-relaxed font-serif-editorial italic">
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
            className="bg-[#FAF7F2] border-2 border-stone-800 shadow-[4px_4px_0px_#1C1917] p-6 sm:p-8 space-y-5"
          >
            <div className="flex items-center gap-3 pb-4 mb-5 border-b-2 border-stone-800">
              <div className="w-8 h-8 bg-stone-900 text-stone-50 border border-stone-800 flex items-center justify-center font-mono font-bold text-sm">
                03
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-serif-editorial font-bold text-stone-950 uppercase tracking-tight">
                  PASAL 03. DOKUMENTASI FOTO ASLI & PERSETUJUAN
                </h2>
                <p className="text-xs text-stone-600 font-serif-editorial italic">
                  Foto asli fisik tanpa filter untuk bahan kurasi etalase & feed Instagram resmi
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
              minPhotos={1}
              maxPhotos={8}
            />
            {errors.photos && (
              <p className="text-xs text-rose-500 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.photos}
              </p>
            )}

            {/* Operational Quality Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
              <div className="p-3 bg-white border border-stone-800 shadow-[2px_2px_0px_rgba(0,0,0,0.06)] flex items-center gap-2">
                <span className="w-5 h-5 bg-stone-900 text-amber-300 flex items-center justify-center font-mono font-bold text-xs shrink-0 border border-stone-800">✓</span>
                <span className="text-stone-900 font-bold font-mono">Kondisi Bersih / Dicuci</span>
              </div>
              <div className="p-3 bg-white border border-stone-800 shadow-[2px_2px_0px_rgba(0,0,0,0.06)] flex items-center gap-2">
                <span className="w-5 h-5 bg-stone-900 text-amber-300 flex items-center justify-center font-mono font-bold text-xs shrink-0 border border-stone-800">✓</span>
                <span className="text-stone-900 font-bold font-mono">Hanya 100% Original</span>
              </div>
              <div className="p-3 bg-white border border-stone-800 shadow-[2px_2px_0px_rgba(0,0,0,0.06)] flex items-center gap-2">
                <span className="w-5 h-5 bg-stone-900 text-amber-300 flex items-center justify-center font-mono font-bold text-xs shrink-0 border border-stone-800">30</span>
                <span className="text-stone-900 font-bold font-mono">Masa Titip 30 Hari</span>
              </div>
            </div>

            {/* Checkbox Persetujuan Aturan */}
            <div 
              data-field="agreement"
              className={`p-4 border-2 transition-all ${
                errors.agreement
                  ? 'bg-rose-50 border-rose-500 shadow-[3px_3px_0px_#E11D48]'
                  : agreementAccepted
                  ? 'bg-[#ECE5D8] border-stone-900 shadow-[3px_3px_0px_#1C1917]'
                  : 'bg-white border-stone-400 shadow-[2px_2px_0px_rgba(0,0,0,0.05)]'
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
                  className="mt-1 w-4 h-4 border-2 border-stone-800 text-stone-900 focus:ring-stone-900 cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-stone-800 leading-relaxed font-serif-editorial">
                  "Saya menyetujui sistem operasional info.barkasmajalengka: barang dalam kondisi <strong>BERSIH (sudah dicuci)</strong>, <strong>100% ORIGINAL</strong>, bebas noda parah/kerusakan fungsi utama, serta menyetujui <strong>skema komisi & masa titip maksimal 30 hari</strong>."
                </span>
              </label>
              {errors.agreement && (
                <p className="text-xs text-rose-600 mt-2 font-mono font-bold flex items-center gap-1">
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
              className="w-full py-4 px-6 bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-amber-200 font-serif-editorial font-bold text-base sm:text-lg border-2 border-stone-900 shadow-[4px_4px_0px_#C25E34] transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-60 uppercase tracking-wider"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                  <span>Sedang Menerbitkan Data...</span>
                </>
              ) : (
                <>
                  <span>KIRIM PENGAJUAN TITIP JUAL RESMI</span>
                  <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <p className="text-[11px] text-center font-mono text-stone-600 mt-2">
              Setelah dikirim, Kode Tiket Resmi akan langsung tercetak dan terhubung ke WhatsApp Admin Esteh ({ADMIN_CONTACT.whatsappFormatted}).
            </p>
          </div>
        </form>
          </>
        )}

        {/* Always-Visible Titip Cari Barang Section when user is on Form or Catalog tab */}
        {publicActiveTab !== 'wanted' && (
          <div id="titip-cari-section" className="mt-10 pt-8 border-t-2 border-slate-200/80">
            <WantedBoardSection
              requests={wantedRequests}
              adminWhatsAppNumber={adminPhone}
              onAddRequest={async (newReq) => {
                setAdminWantedRequests((prev) => [newReq, ...prev]);
                const maskedNewReq = { ...newReq, whatsappNumber: '' };
                setWantedRequests((prev) => {
                  const updated = [maskedNewReq, ...prev];
                  try {
                    localStorage.setItem(WANTED_STORAGE_KEY, JSON.stringify(updated));
                  } catch {
                    // ignore
                  }
                  return updated;
                });
                try {
                  await saveWantedRequestToFirebase(newReq);
                } catch {
                  // ignore offline error, saved locally
                }
                showAppToast('✅ Permintaan cari barang Anda berhasil ditayangkan di Papan Wanted!');
              }}
              onFulfillViaForm={(prefill) => {
                setCategory(prefill.category);
                setItemNameAndBrand(prefill.itemNameAndBrand);
                setNettPriceRaw(String(prefill.suggestedNettPrice));
                setPublicActiveTab('form');
                showAppToast(
                  `✅ Formulir telah diisi otomatis untuk "${prefill.itemNameAndBrand}". Silakan lengkapi foto & data diri Anda!`
                );
                window.scrollTo({ top: 320, behavior: 'smooth' });
              }}
            />
          </div>
        )}
      </main>

      {/* Footer Branding & Discreet Admin Link */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <div className="max-w-3xl mx-auto px-4 space-y-2.5">
          <p className="font-bold text-[#1B365D]">
            info.barkasmajalengka © {new Date().getFullYear()}
          </p>
          <p className="text-[11px]">
            Platform Kurasi & Titip Jual Barang Bekas Berkualitas Majalengka — Transparan, Amanah, Cepat Laku.
          </p>
          <p className="text-[11px] text-slate-500">
            Layanan Pelanggan & Konsultasi: <strong>{ADMIN_CONTACT.name}</strong> •{' '}
            <a
              href={`https://wa.me/${ADMIN_CONTACT.whatsappInternational}?text=${encodeURIComponent('Halo Admin Esteh, saya ingin konsultasi seputar titip jual di info.barkasmajalengka.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-700 font-semibold underline inline-flex items-center gap-1"
            >
              <MessageCircle className="w-3 h-3" />
              <span>WhatsApp {ADMIN_CONTACT.whatsappFormatted}</span>
            </a>
          </p>

          {/* Discreet Admin Area Portal (With Hash fallback for Vercel/Static hosting) */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <a
              href="#/admin"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('/admin');
              }}
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-[#1B365D] font-medium transition-colors cursor-pointer hover:underline"
              title="Panel Khusus Admin Pengelola"
            >
              <Lock className="w-3 h-3" />
              <span>Login Pengelola (/admin)</span>
            </a>
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

      <OfflineIndicator />

      {appToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-amber-200 px-4 py-3 border-2 border-stone-900 shadow-[4px_4px_0px_#C25E34] flex items-center gap-2.5 text-xs font-mono font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{appToast}</span>
        </div>
      )}
    </div>
  );
}
