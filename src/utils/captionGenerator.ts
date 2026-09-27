import { ConsignmentItem, ADMIN_CONTACT } from '../types/consignment';
import { formatRupiah, calculateListingEstimates, normalizeWhatsAppNumber } from './formatters';

/**
 * Generate formatted Instagram Feed Caption based on user prompt specification
 */
export const generateInstagramFeedCaption = (item: ConsignmentItem): string => {
  const estimates = calculateListingEstimates(item.nettPrice);
  const formattedPrice = new Intl.NumberFormat('id-ID').format(estimates.suggestedListingPrice);

  const hasPriceDrop =
    typeof item.previousNettPrice === 'number' && item.previousNettPrice > item.nettPrice;
  const prevEstimates = hasPriceDrop
    ? calculateListingEstimates(item.previousNettPrice!)
    : null;
  const formattedPrevPrice = prevEstimates
    ? new Intl.NumberFormat('id-ID').format(prevEstimates.suggestedListingPrice)
    : '';

  // Category emoji
  let categoryEmoji = '✨';
  let categoryTag = 'fashionmajalengka';

  switch (item.category) {
    case 'Sneakers / Sepatu':
      categoryEmoji = '👟';
      categoryTag = 'sneakersmajalengka';
      break;
    case 'Helm & Otomotif':
      categoryEmoji = '🪖';
      categoryTag = 'helmmajalengka';
      break;
    case 'Gadget & Elektronik':
      categoryEmoji = '📱';
      categoryTag = 'gadgetmajalengka';
      break;
    case 'Fashion':
      categoryEmoji = '👕';
      categoryTag = 'fashionmajalengka';
      break;
    default:
      categoryEmoji = '📦';
      categoryTag = 'secondmajalengka';
  }

  // Extract minus or default
  const minusText = item.descriptionAndFlaws.trim() || 'Tidak ada minus (mulus pemakaian wajar)';

  const headerLine = hasPriceDrop
    ? `🚨 PROMO TURUN HARGA! ${categoryEmoji} FOR SALE: ${item.itemNameAndBrand}`
    : `${categoryEmoji} FOR SALE: ${item.itemNameAndBrand}`;

  const priceLine = hasPriceDrop
    ? `💰 Harga Promo: Rp ${formattedPrice} (Turun dari Rp ${formattedPrevPrice} 🔥)`
    : `💰 Harga: Rp ${formattedPrice} (Nego Tipis)`;

  return `${headerLine}

Keterangan Barang:
- Merk / Model: ${item.itemNameAndBrand}
- Ukuran: ${item.size || 'All Size'}
- Kondisi: ${item.condition}
- Kelengkapan & Detail: ${item.descriptionAndFlaws}
- Minus: ${minusText}

${priceLine}
📍 Lokasi: Kec. ${item.kecamatan}, Majalengka
🚚 Transaksi: COD Majalengka / Rekber / Kirim Ekspedisi

📲 Minat? DM @info.barkasmajalengka atau klik link di bio!
---
#barkasmajalengka #${categoryTag} #thriftingmajalengka #infomajalengka #majalengkahits #prelovedmajalengka #exploremajalengka`;
};

/**
 * Generate short punchy Story caption for Instagram / WhatsApp status
 */
export const generateInstagramStoryCaption = (item: ConsignmentItem): string => {
  const estimates = calculateListingEstimates(item.nettPrice);
  const hasPriceDrop =
    typeof item.previousNettPrice === 'number' && item.previousNettPrice > item.nettPrice;
  const prevEstimates = hasPriceDrop
    ? calculateListingEstimates(item.previousNettPrice!)
    : null;

  return `${hasPriceDrop ? '🚨 PROMO TURUN HARGA (PRICE DROP)!' : '🔥 BARU MASUK! TITIP JUAL BARKAS'}
📦 ${item.itemNameAndBrand}
📏 Size: ${item.size || 'All Size'} • Kondisi: ${item.condition}
💰 Harga: ${formatRupiah(estimates.suggestedListingPrice)}${
    prevEstimates ? ` (Dari ${formatRupiah(prevEstimates.suggestedListingPrice)})` : ''
  }
📍 Lokasi: Kec. ${item.kecamatan}, Majalengka
🚚 Siap COD Majalengka / Kirim Ekspedisi

📲 Minat langsung DM @info.barkasmajalengka atau klik link di bio!`;
};

/**
 * Generate WhatsApp confirmation message from Admin to Penitip
 * Notifies the penitip that their item has been processed and is ready / scheduled for posting!
 */
export const generatePenitipConfirmationWhatsAppUrl = (item: ConsignmentItem): string => {
  const estimates = calculateListingEstimates(item.nettPrice);
  const cleanPenitipPhone = normalizeWhatsAppNumber(item.whatsappNumber);

  const message = `Halo Kak *${item.fullName}*, salam dari Admin Esteh (*info.barkasmajalengka*)! 👋

Kabar baik, barang titip jual Anda telah selesai melalui tahap verifikasi & kurasi kami:

🎫 *Kode Tiket:* ${item.id}
📦 *Barang:* ${item.itemNameAndBrand} (Size: ${item.size || 'All Size'})
💎 *Harga Bersih (Nett Anda):* ${formatRupiah(item.nettPrice)}
🏷️ *Estimasi Harga Tayang Feed/Story:* ± ${formatRupiah(estimates.suggestedListingPrice)}

✅ Foto barang telah kami watermark resmi dan materi caption postingan sudah siap tayang di Instagram *@info.barkasmajalengka*.

Kami akan segera mengabarkan jika barang Anda sudah laku terjual. Nominal bersih Anda dijamin 100% utuh tanpa potongan biaya di muka.

Terima kasih atas kepercayaannya menitipkan barang di *info.barkasmajalengka*!

Salam hangat,
*Admin Esteh* - info.barkasmajalengka
📲 WhatsApp Resmi: ${ADMIN_CONTACT.whatsappFormatted} (${ADMIN_CONTACT.whatsappRaw}) 🙏✨`;

  return `https://wa.me/${cleanPenitipPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Generate WhatsApp message from Admin to Penitip for Day-20 Price Drop Review
 */
export const generatePriceDropWhatsAppUrl = (item: ConsignmentItem): string => {
  const estimates = calculateListingEstimates(item.nettPrice);
  const suggestedDropNett = Math.round((item.nettPrice * 0.9) / 5000) * 5000;
  const cleanPenitipPhone = normalizeWhatsAppNumber(item.whatsappNumber);

  const message = `Halo Kak *${item.fullName}*, salam dari Admin Esteh (*info.barkasmajalengka*)! 👋

Menginfokan update untuk barang titip jual Anda yang telah memasuki *masa tayang Hari ke-20*:

🎫 *Kode Tiket:* ${item.id}
📦 *Barang:* ${item.itemNameAndBrand}
💎 *Harga Nett Saat Ini:* ${formatRupiah(item.nettPrice)} (Tayang: ${formatRupiah(estimates.suggestedListingPrice)})

Sesuai SOP *info.barkasmajalengka*, pada hari ke-20 kami menawarkan *Opsi Turun Harga (Price Drop)* agar barang lebih cepat terjual sebelum masa titip 30 hari berakhir (contoh rekomendasi harga nett baru: ± *${formatRupiah(suggestedDropNett)}*).

Apakah Kakak berkenan menyesuaikan harga, atau tetap di harga semula hingga hari ke-30?

Terima kasih Kak! 🙏
*Admin Esteh* - info.barkasmajalengka (${ADMIN_CONTACT.whatsappFormatted})`;

  return `https://wa.me/${cleanPenitipPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Generate WhatsApp message from Admin to Penitip for Payout / Pencairan Dana
 */
export const generatePayoutWhatsAppUrl = (
  item: ConsignmentItem,
  finalPayoutAmount: number,
  transferMethod: string,
  transferReference: string
): string => {
  const cleanPenitipPhone = normalizeWhatsAppNumber(item.whatsappNumber);
  const message = `Halo Kak *${item.fullName}*, kabar gembira dari *${ADMIN_CONTACT.name}* (*info.barkasmajalengka*)! 🎉

Alhamdulillah barang titip jual Kakak telah *TERJUAL & LUNAS*:

🎫 *Kode Tiket:* ${item.id}
📦 *Barang:* ${item.itemNameAndBrand}
💰 *Total Dana Bersih Dicairkan:* *${formatRupiah(finalPayoutAmount)}*
🏦 *Rekening Tujuan:* ${item.bankAccount}
💳 *Metode / Ref Transfer:* ${transferMethod} (${transferReference || 'Berhasil Ditransfer'})

Dana telah kami teruskan ke rekening/E-Wallet Kakak. Bukti Kwitansi Resmi Pencairan (PDF) juga dapat kami lampirkan di chat ini.

Terima kasih telah mempercayakan titip jual di *info.barkasmajalengka*! Ditunggu titipan barang berikutnya ya Kak 🙏✨`;

  return `https://wa.me/${cleanPenitipPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Generate WhatsApp message from Prospective Buyer to Admin Esteh from Live Catalog
 */
export const generateBuyerInquiryWhatsAppUrl = (
  item: ConsignmentItem,
  adminWhatsApp: string = ADMIN_CONTACT.whatsappInternational,
  options?: {
    offerPrice?: number;
    codPoint?: string;
  }
): string => {
  const estimates = calculateListingEstimates(item.nettPrice);
  const cleanAdmin = normalizeWhatsAppNumber(adminWhatsApp);

  const isNegotiating =
    options?.offerPrice &&
    options.offerPrice > 0 &&
    options.offerPrice !== estimates.suggestedListingPrice;

  const priceBlock = isNegotiating
    ? `💰 *Harga Etalase:* ${formatRupiah(estimates.suggestedListingPrice)}\n🤝 *Pengajuan Nego Tipis:* *${formatRupiah(options.offerPrice!)}*`
    : `💰 *Harga Pembelian:* ${formatRupiah(estimates.suggestedListingPrice)} (Harga Pas Sesuai Etalase)`;

  const codBlock = options?.codPoint
    ? `\n📍 *Preferensi Titik COD / Pengiriman:* *${options.codPoint}*`
    : '';

  const message = `Halo Admin Esteh (*info.barkasmajalengka*), saya tertarik dengan barang di Etalase Live berikut:

🏷️ *Nama Barang:* ${item.itemNameAndBrand}
🎫 *Kode Tiket:* ${item.id}
📏 *Ukuran / Kondisi:* ${item.size || 'All Size'} (${item.condition})
🏠 *Domisili Barang:* Kec. ${item.kecamatan}, Majalengka
${priceBlock}${codBlock}

Apakah barang ini masih *READY* untuk transaksi? Terima kasih!`;

  return `https://wa.me/${cleanAdmin}?text=${encodeURIComponent(message)}`;
};

/**
 * Generate WhatsApp message to send Buyer Invoice summary to Buyer
 */
export const generateBuyerInvoiceWhatsAppUrl = (
  item: ConsignmentItem,
  buyerName: string,
  buyerWhatsapp: string,
  dealPrice: number,
  paymentMethod: string,
  codOrDeliveryPoint: string
): string => {
  const cleanPhone = normalizeWhatsAppNumber(buyerWhatsapp);
  const message = `Halo Kak *${buyerName || 'Pembeli'}*, terima kasih telah berbelanja di *info.barkasmajalengka* bersama *${ADMIN_CONTACT.name}*! 🙏

Berikut rincian *Nota Pembelian Resmi* Kakak:
🧾 *No. Nota:* INV/${item.id.replace('#', '')}
📦 *Barang:* ${item.itemNameAndBrand} (Size ${item.size || 'All Size'} · ${item.condition})
💰 *Total Harga Deal:* *${formatRupiah(dealPrice)}*
💳 *Metode Transaksi:* ${paymentMethod}
📍 *Titik COD / Pengiriman:* ${codOrDeliveryPoint}

File PDF Nota Pembelian Resmi juga dapat kami lampirkan di chat ini. Semoga barangnya awet dan bermanfaat ya Kak! Ditunggu belanja atau titip jual berikutnya di *@info.barkasmajalengka* ✨`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * Generate Daily Ready Stock Broadcast text for WhatsApp Status / Groups
 */
export const generateDailyStockBroadcastMessage = (
  liveItems: ConsignmentItem[],
  catalogBaseUrl: string = typeof window !== 'undefined' ? window.location.origin : ''
): string => {
  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (liveItems.length === 0) {
    return `📢 *UPDATE STOK READY INFO.BARKASMAJALENGKA*\n📅 ${todayStr}\n\nSaat ini seluruh stok sedang dalam proses kurasi. Punya barang bagus jarang dipakai? Yuk titip jualkan di ${catalogBaseUrl}`;
  }

  const lines = liveItems.slice(0, 20).map((item, idx) => {
    const est = calculateListingEstimates(item.nettPrice);
    const hasDrop =
      typeof item.previousNettPrice === 'number' &&
      item.previousNettPrice > item.nettPrice;
    const dropTag = hasDrop ? ' 🔥 *(PROMO TURUN HARGA)*' : '';
    return `${idx + 1}. *${item.itemNameAndBrand}* (${item.size || 'All Size'} · ${item.condition})\n   💰 *${formatRupiah(est.suggestedListingPrice)}*${dropTag} | 📍 Kec. ${item.kecamatan} | Kode: \`${item.id}\``;
  });

  return `📢 *REKAP STOK READY HARI INI — @info.barkasmajalengka*
📅 *${todayStr}*
✅ *100% Lolos Kurasi · Bisa Rekber & COD Area Majalengka*

${lines.join('\n\n')}
${liveItems.length > 20 ? `\n...dan +${liveItems.length - 20} barang lainnya di etalase web!` : ''}

🌐 *Lihat Foto Detail, Bandingkan & Nego di Etalase Live:*
${catalogBaseUrl}

📲 *Minat Beli / Booking COD? Chat Admin Esteh:*
WA: ${ADMIN_CONTACT.whatsappFormatted}`;
};


