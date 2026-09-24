export type ItemCategory = 
  | 'Fashion' 
  | 'Sneakers / Sepatu' 
  | 'Helm & Otomotif' 
  | 'Gadget & Elektronik' 
  | 'Lainnya';

export type ItemCondition = 
  | 'Baru / BNIB' 
  | 'Seperti Baru / Like New' 
  | 'Bekas Pemakaian Wajar' 
  | 'Ada Minus';

export type SubmissionStatus = 
  | 'Menunggu Kurasi' 
  | 'Diterima' 
  | 'Ditolak'
  | 'Sedang Dipajang (Live)' 
  | 'Terjual' 
  | 'Selesai & Dicairkan';

export type AdminPostStatus = 
  | 'Draft' 
  | 'Ready to Post' 
  | 'Posted' 
  | 'Sold Out';

export interface ConsignmentItem {
  id: string; // e.g. BM-2026-XXXX
  createdAt: string;
  // 1. Data Diri Penitip
  fullName: string;
  whatsappNumber: string;
  kecamatan: string;
  bankAccount: string; // Nomor Rekening / E-Wallet & Nama Bank/Provider

  // 2. Detail Barang
  category: ItemCategory;
  itemNameAndBrand: string;
  size: string;
  condition: ItemCondition;
  descriptionAndFlaws: string;
  nettPrice: number; // in IDR

  // 3. Media & Ketentuan
  photos: string[]; // Base64 or object URLs
  agreementAccepted: boolean;

  // Metadata
  status: SubmissionStatus;
  postStatus?: AdminPostStatus;
  syncedToGoogleForms?: boolean;
  googleFormId?: string;
}

export const ADMIN_CONTACT = {
  name: 'Admin Esteh',
  whatsappRaw: '085179550150',
  whatsappFormatted: '0851-7955-0150',
  whatsappInternational: '6285179550150',
  instagram: '@info.barkasmajalengka',
} as const;

export const KECAMATAN_MAJALENGKA = [
  'Majalengka',
  'Kadipaten',
  'Jatiwangi',
  'Kasokandel',
  'Dawuan',
  'Cigasong',
  'Sukahaji',
  'Sindangwangi',
  'Rajagaluh',
  'Leuwimunding',
  'Palasah',
  'Kertajati',
  'Jatitujuh',
  'Ligung',
  'Sumberjaya',
  'Bantarujeg',
  'Cikijing',
  'Cingambul',
  'Talaga',
  'Banjaran',
  'Maja',
  'Argapura',
  'Sindang',
  'Malausma',
  'Lemahsugih',
  'Panyingkiran',
] as const;

export const CATEGORIES: { label: ItemCategory; description: string; icon: string }[] = [
  { label: 'Fashion', description: 'Pakaian, hoodie, jaket, celana, thrift branded', icon: 'Shirt' },
  { label: 'Sneakers / Sepatu', description: 'Sneakers original, boots, sandal casual', icon: 'Footprints' },
  { label: 'Helm & Otomotif', description: 'Helm custom/vintage, jaket riding, apparel motor', icon: 'ShieldAlert' },
  { label: 'Gadget & Elektronik', description: 'Smartphone, kamera, smartwatch, audio', icon: 'Smartphone' },
  { label: 'Lainnya', description: 'Hobi, tas, jam tangan, aksesoris koleksi', icon: 'Package' },
];

export const CONDITIONS: { label: ItemCondition; badge: string; description: string }[] = [
  { label: 'Baru / BNIB', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', description: 'Brand New In Box, belum pernah dipakai sama sekali' },
  { label: 'Seperti Baru / Like New', badge: 'bg-blue-100 text-blue-800 border-blue-300', description: 'Kondisi 95-99%, sangat mulus, minim jejak pakai' },
  { label: 'Bekas Pemakaian Wajar', badge: 'bg-amber-100 text-amber-800 border-amber-300', description: 'Kondisi 85-94%, fungsi normal 100%, ada tanda pakai minor' },
  { label: 'Ada Minus', badge: 'bg-rose-100 text-rose-800 border-rose-300', description: 'Terdapat cacat, lecet atau minus fungsi wajib dirinci' },
];
