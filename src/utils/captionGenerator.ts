import { ConsignmentItem } from '../types/consignment';
import { formatRupiah, calculateListingEstimates, normalizeWhatsAppNumber } from './formatters';

/**
 * Generate formatted Instagram Feed Caption based on user prompt specification
 */
export const generateInstagramFeedCaption = (item: ConsignmentItem): string => {
  const estimates = calculateListingEstimates(item.nettPrice);
  const formattedPrice = new Intl.NumberFormat('id-ID').format(estimates.suggestedListingPrice);

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

  return `${categoryEmoji} FOR SALE: ${item.itemNameAndBrand}

Keterangan Barang:
- Merk / Model: ${item.itemNameAndBrand}
- Ukuran: ${item.size || 'All Size'}
- Kondisi: ${item.condition}
- Kelengkapan & Detail: ${item.descriptionAndFlaws}
- Minus: ${minusText}

💰 Harga: Rp ${formattedPrice} (Nego Tipis)
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

  return `🔥 BARU MASUK! TITIP JUAL BARKAS
📦 ${item.itemNameAndBrand}
📏 Size: ${item.size || 'All Size'} • Kondisi: ${item.condition}
💰 Harga: ${formatRupiah(estimates.suggestedListingPrice)}
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

  const message = `Halo Kak *${item.fullName}*, salam dari Admin *info.barkasmajalengka*! 👋

Kabar baik, barang titip jual Anda telah selesai melalui tahap verifikasi & kurasi kami:

🎫 *Kode Tiket:* ${item.id}
📦 *Barang:* ${item.itemNameAndBrand} (Size: ${item.size || 'All Size'})
💎 *Harga Bersih (Nett Anda):* ${formatRupiah(item.nettPrice)}
🏷️ *Estimasi Harga Tayang Feed/Story:* ± ${formatRupiah(estimates.suggestedListingPrice)}

✅ Foto barang telah kami watermark resmi dan materi caption postingan sudah siap tayang di Instagram *@info.barkasmajalengka*.

Kami akan segera mengabarkan jika barang Anda sudah laku terjual. Nominal bersih Anda dijamin 100% utuh tanpa potongan biaya di muka.

Terima kasih atas kepercayaannya menitipkan barang di *info.barkasmajalengka*! 🙏✨`;

  return `https://wa.me/${cleanPenitipPhone}?text=${encodeURIComponent(message)}`;
};
