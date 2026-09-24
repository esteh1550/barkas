import { ConsignmentItem } from '../types/consignment';

/**
 * Format number to Indonesian Rupiah representation
 */
export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Clean string to plain number
 */
export const parseRupiahInput = (val: string): number => {
  const clean = val.replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
};

/**
 * Format raw WhatsApp phone number for wa.me links
 * e.g. 081234567890 -> 6281234567890
 * +6281234567890 -> 6281234567890
 */
export const normalizeWhatsAppNumber = (phone: string): string => {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

export interface CommissionBreakdown {
  nettPrice: number;
  estimatedFee: number;
  suggestedListingPrice: number;
  tierName: string;
  rateDescription: string;
  tenorDays: number;
  priceDropDay: number;
}

/**
 * Calculate recommended selling price on info.barkasmajalengka
 * Based on the Operational Scheme:
 * 1. < Rp100.000: Flat fee Rp10.000 / barang
 * 2. Rp100.000 – Rp1.000.000: Komisi 12% (rentang 10% - 15%)
 * 3. > Rp1.000.000: Komisi 8% (rentang 8% - 10%, menarik untuk barang brand / high value)
 */
export const calculateListingEstimates = (nettPrice: number): CommissionBreakdown => {
  if (!nettPrice || nettPrice <= 0) {
    return {
      nettPrice: 0,
      estimatedFee: 0,
      suggestedListingPrice: 0,
      tierName: 'Standar',
      rateDescription: '0%',
      tenorDays: 30,
      priceDropDay: 20,
    };
  }

  let estimatedFee = 0;
  let tierName = '';
  let rateDescription = '';

  if (nettPrice < 100000) {
    // 1. Barang < Rp100.000: Flat fee Rp10.000 / barang
    estimatedFee = 10000;
    tierName = 'Tier Terjangkau (< Rp 100rb)';
    rateDescription = 'Flat Fee Rp 10.000';
  } else if (nettPrice <= 1000000) {
    // 2. Barang Rp100.000 – Rp1.000.000: Komisi 12% (10% – 15%)
    const rate = 0.12;
    estimatedFee = Math.round(nettPrice * rate);
    tierName = 'Tier Menengah (Rp 100rb – Rp 1jt)';
    rateDescription = 'Komisi 12%';
  } else {
    // 3. Barang > Rp1.000.000: Komisi 8% (8% – 10%, menarik bagi pemegang brand/high-value)
    const rate = 0.08;
    estimatedFee = Math.round(nettPrice * rate);
    tierName = 'Tier Premium & Brand (> Rp 1jt)';
    rateDescription = 'Komisi Khusus 8%';
  }

  const suggestedListingPrice = nettPrice + estimatedFee;

  return {
    nettPrice,
    estimatedFee,
    suggestedListingPrice,
    tierName,
    rateDescription,
    tenorDays: 30,
    priceDropDay: 20,
  };
};

/**
 * Calculate tenor timeline dates from creation date
 */
export const getTenorTimeline = (createdAt: string) => {
  const createdDate = new Date(createdAt);
  
  // Day 20: Price Drop Review
  const day20Date = new Date(createdDate);
  day20Date.setDate(day20Date.getDate() + 20);

  // Day 30: Tenor Expiry (Return or Renewal)
  const day30Date = new Date(createdDate);
  day30Date.setDate(day30Date.getDate() + 30);

  const now = new Date();
  const diffTime = day30Date.getTime() - now.getTime();
  const remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    createdDate,
    day20Date,
    day30Date,
    remainingDays,
    isPriceDropPeriod: now >= day20Date && now < day30Date,
    isExpired: now >= day30Date,
  };
};

/**
 * Generate formatted WhatsApp message for Admin
 */
export const generateAdminWhatsAppUrl = (
  item: ConsignmentItem,
  adminPhone: string = '6285224000100'
): string => {
  const estimates = calculateListingEstimates(item.nettPrice);

  const text = `Halo Admin *info.barkasmajalengka*, saya ingin mengajukan titip jual barang bekas:

🎫 *KODE TIKET: ${item.id}*
📅 Diajukan: ${new Date(item.createdAt).toLocaleDateString('id-ID', { dateStyle: 'full' })}
------------------------------------------
👤 *DATA PENITIP*
• Nama: *${item.fullName}*
• No. WhatsApp: ${item.whatsappNumber}
• Domisili: Kec. ${item.kecamatan}, Kab. Majalengka
• Rekening/E-Wallet: ${item.bankAccount}

📦 *DETAIL BARANG*
• Kategori: *${item.category}*
• Nama & Merk: *${item.itemNameAndBrand}*
• Ukuran / Size: ${item.size || '-'}
• Kondisi: *${item.condition}*
• Deskripsi & Detail Minus:
  "${item.descriptionAndFlaws}"

💰 *SKEMA KEUANGAN & KOMISI*
• *Harga Bersih (Nett Saya): ${formatRupiah(item.nettPrice)}*
• Skema Biaya: ${estimates.rateDescription} (${estimates.tierName})
• Estimasi Harga Jual di Barkas: ± ${formatRupiah(estimates.suggestedListingPrice)}

⏳ *SKEMA OPERASIONAL & TENOR*
• Masa Titip: Maksimal 30 Hari (Evaluasi diskon Hari ke-20)
• Kondisi Barang: Bersih (sudah dicuci), 100% Original & fungsi utama normal.

📸 *DOKUMENTASI FOTO*
• ${item.photos?.length || 0} foto barang telah saya siapkan dan siap diverifikasi.

Mohon konfirmasi tahap kurasi selanjutnya ya Min. Hatur nuhun! 🙏`;

  const cleanAdminPhone = normalizeWhatsAppNumber(adminPhone);
  return `https://wa.me/${cleanAdminPhone}?text=${encodeURIComponent(text)}`;
};
