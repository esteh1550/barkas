import { jsPDF } from 'jspdf';
import { ConsignmentItem, ADMIN_CONTACT } from '../types/consignment';
import { formatRupiah, calculateListingEstimates, getTenorTimeline } from './formatters';
import { generateTicketQRCode } from './qrCode';

/**
 * Generate official PDF receipt for consignment item
 * Embedded with operational scheme (3-tier fee, 30-day tenor, clean & original conditions)
 */
export const generateConsignmentPDF = async (item: ConsignmentItem): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const estimates = calculateListingEstimates(item.nettPrice);
  const tenor = getTenorTimeline(item.createdAt);

  // Header background banner (Navy Blue #1B365D)
  doc.setFillColor(27, 54, 93);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Gold accent bar
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 35, pageWidth, 3, 'F');

  // Header texts
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('info.barkasmajalengka', margin, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(253, 230, 138);
  doc.text('BUKTI RESMI REGISTRASI TITIP JUAL (CONSIGNMENT)', margin, 24);

  doc.setTextColor(226, 232, 240);
  doc.setFontSize(8);
  doc.text('Platform Kurasi & Titip Jual Barang Bekas Berkualitas Kabupaten Majalengka', margin, 29);

  // Generate QR Code image
  const qrDataUrl = await generateTicketQRCode(item);
  let currentY = 44;

  // Header Info Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 34, 3, 3, 'FD');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.text('NOMOR TIKET TITIP JUAL', margin + 6, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(27, 54, 93);
  doc.text(item.id, margin + 6, currentY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const formattedDate = new Date(item.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Waktu Registrasi: ${formattedDate} WIB`, margin + 6, currentY + 21);
  doc.text(`Status Berkas: ${item.status.toUpperCase()}`, margin + 6, currentY + 26);
  doc.text(`Masa Titip: 30 Hari (s.d. ${tenor.day30Date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})`, margin + 6, currentY + 31);

  // Embed QR Code on the right side of the card
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 32, currentY + 2, 30, 30);
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Scan untuk Verifikasi', pageWidth - margin - 30, currentY + 33);
  }

  currentY += 40;

  // SECTION 1: DATA PENITIP
  doc.setFillColor(27, 54, 93);
  doc.rect(margin, currentY, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(27, 54, 93);
  doc.text('1. DATA PENITIP', margin + 6, currentY + 5);

  currentY += 9;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'D');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  // Left col
  doc.text('Nama Lengkap', margin + 5, currentY + 7);
  doc.text('Nomor WhatsApp', margin + 5, currentY + 14);
  doc.text('Domisili Kecamatan', margin + 5, currentY + 21);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`:  ${item.fullName}`, margin + 42, currentY + 7);
  doc.text(`:  ${item.whatsappNumber}`, margin + 42, currentY + 14);
  doc.text(`:  Kec. ${item.kecamatan}, Kab. Majalengka`, margin + 42, currentY + 21);

  // Right col
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Rekening / E-Wallet', margin + 105, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`:  ${item.bankAccount}`, margin + 142, currentY + 7);

  currentY += 32;

  // SECTION 2: DETAIL BARANG
  doc.setFillColor(27, 54, 93);
  doc.rect(margin, currentY, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(27, 54, 93);
  doc.text('2. SPESIFIKASI BARANG TITIPAN', margin + 6, currentY + 5);

  currentY += 9;
  doc.roundedRect(margin, currentY, contentWidth, 50, 2, 2, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);

  doc.text('Kategori', margin + 5, currentY + 7);
  doc.text('Nama & Merk', margin + 5, currentY + 14);
  doc.text('Ukuran / Size', margin + 5, currentY + 21);
  doc.text('Kondisi Barang', margin + 5, currentY + 28);
  doc.text('Kelengkapan Foto', margin + 5, currentY + 35);
  doc.text('Deskripsi / Minus', margin + 5, currentY + 42);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`:  ${item.category}`, margin + 42, currentY + 7);
  doc.text(`:  ${item.itemNameAndBrand}`, margin + 42, currentY + 14);
  doc.text(`:  ${item.size || 'All Size'}`, margin + 42, currentY + 21);
  doc.text(`:  ${item.condition}`, margin + 42, currentY + 28);
  doc.text(`:  ${item.photos?.length || 0} Foto terunggah`, margin + 42, currentY + 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const splitDesc = doc.splitTextToSize(`:  "${item.descriptionAndFlaws}"`, contentWidth - 48);
  doc.text(splitDesc, margin + 42, currentY + 42);

  currentY += 56;

  // SECTION 3: KEUANGAN & SKEMA KOMISI
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(margin, currentY, contentWidth, 27, 2, 2, 'FD');

  doc.setTextColor(146, 64, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('HARGA BERSIH (NETT PENITIP):', margin + 6, currentY + 7);

  doc.setFontSize(15);
  doc.setTextColor(27, 54, 93);
  doc.text(formatRupiah(item.nettPrice), margin + 6, currentY + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(146, 64, 14);
  doc.text(
    `*Skema: ${estimates.tierName} (${estimates.rateDescription}) • Estimasi Listing: ± ${formatRupiah(estimates.suggestedListingPrice)}`,
    margin + 6,
    currentY + 20
  );
  doc.text(
    'Penitip menerima 100% penuh harga nett di atas saat barang telah laku dan diverifikasi.',
    margin + 6,
    currentY + 24
  );

  currentY += 33;

  // SECTION 4: SKEMA SISTEM OPERASIONAL RESMI
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(27, 54, 93);
  doc.text('SKEMA SISTEM OPERASIONAL RESMI INFO.BARKASMAJALENGKA:', margin + 5, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);

  doc.text('1. SKEMA KOMISI: < Rp100rb: Flat fee Rp10rb | Rp100rb-Rp1jt: 10%-15% | > Rp1jt: 8%-10% (brand/high-value).', margin + 5, currentY + 11);
  doc.text('2. TENOR TITIP: Maksimal 30 Hari. Pada Hari ke-20, admin menawarkan evaluasi turun harga (price drop) jika belum laku.', margin + 5, currentY + 16);
  doc.text('3. KETENTUAN 30 HARI: Jika belum laku dalam 30 hari, barang dikembalikan ke pemilik atau diperpanjang dengan diskon.', margin + 5, currentY + 21);
  doc.text('4. STANDAR KONDISI: Wajib bersih (sudah dicuci wangi), 100% Original, bebas noda parah atau kerusakan fungsi utama.', margin + 5, currentY + 26);
  doc.text('5. PENCAIRAN: Dana nett 100% utuh ditransfer ke rekening penitip maksimal 1x24 jam setelah barang laku dan dikonfirmasi.', margin + 5, currentY + 31);
  doc.text('6. Bukti PDF ini merupakan tanda registrasi digital resmi dari platform info.barkasmajalengka.', margin + 5, currentY + 35);

  // Bottom footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Dokumen Digital info.barkasmajalengka • Pengelola: ${ADMIN_CONTACT.name} (WA: ${ADMIN_CONTACT.whatsappFormatted}) • ID: ${item.id} • Cetak: ${new Date().toLocaleDateString('id-ID')}`,
    margin,
    288
  );

  // Save PDF
  const safeFilename = `Bukti-Titip-Jual-${item.id.replace(/[^a-zA-Z0-9-]/g, '')}.pdf`;
  doc.save(safeFilename);
};

export interface PayoutReceiptOptions {
  finalPayoutAmount: number;
  soldListingPrice: number;
  adminFeeAmount: number;
  transferMethod: string;
  transferReference: string;
  payoutNotes?: string;
}

/**
 * Generate Official Payout Receipt (Kwitansi Pencairan Dana Lunas) PDF for Consignor
 */
export const generatePayoutReceiptPDF = async (
  item: ConsignmentItem,
  options: PayoutReceiptOptions
): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const qrDataUrl = await generateTicketQRCode(item);

  // Header Banner (Emerald / Navy Official Payout Theme)
  doc.setFillColor(27, 54, 93);
  doc.rect(0, 0, pageWidth, 36, 'F');

  doc.setFillColor(16, 185, 129); // Emerald bar
  doc.rect(0, 36, pageWidth, 3.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('info.barkasmajalengka', margin, 16);

  doc.setFontSize(10.5);
  doc.setTextColor(167, 243, 208);
  doc.text('KWITANSI RESMI PENCAIRAN DANA TITIP JUAL (LUNAS)', margin, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(
    `Pengelola: ${ADMIN_CONTACT.name} • WhatsApp Resmi: ${ADMIN_CONTACT.whatsappFormatted} • Kabupaten Majalengka`,
    margin,
    30
  );

  let currentY = 46;

  // Status Stamp Box
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(margin, currentY, contentWidth, 34, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 95, 70);
  doc.text('NOMOR TIKET & STATUS PENCAIRAN', margin + 6, currentY + 8);

  doc.setFontSize(16);
  doc.setTextColor(27, 54, 93);
  doc.text(`${item.id} — DANA TELAH DICAIRKAN`, margin + 6, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const nowStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Tanggal Pencairan: ${nowStr} WIB`, margin + 6, currentY + 23);
  doc.text(
    `Metode / Referensi Transfer: ${options.transferMethod} (${options.transferReference || 'Terverifikasi'})`,
    margin + 6,
    currentY + 29
  );

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 32, currentY + 2, 30, 30);
  }

  currentY += 42;

  // SECTION 1: PENERIMA DANA (PENITIP)
  doc.setFillColor(27, 54, 93);
  doc.rect(margin, currentY, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(27, 54, 93);
  doc.text('1. DATA PENERIMA DANA (PENITIP)', margin + 6, currentY + 5);

  currentY += 9;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, currentY, contentWidth, 28, 2, 2, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Nama Penitip', margin + 5, currentY + 8);
  doc.text('Nomor WhatsApp', margin + 5, currentY + 15);
  doc.text('Rekening Tujuan', margin + 5, currentY + 22);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`:  ${item.fullName} (Kec. ${item.kecamatan})`, margin + 45, currentY + 8);
  doc.text(`:  ${item.whatsappNumber}`, margin + 45, currentY + 15);
  doc.text(`:  ${item.bankAccount}`, margin + 45, currentY + 22);

  currentY += 35;

  // SECTION 2: RINCIAN BARANG TERJUAL
  doc.setFillColor(27, 54, 93);
  doc.rect(margin, currentY, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(27, 54, 93);
  doc.text('2. RINCIAN BARANG YANG TERJUAL', margin + 6, currentY + 5);

  currentY += 9;
  doc.roundedRect(margin, currentY, contentWidth, 28, 2, 2, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Nama Barang & Merk', margin + 5, currentY + 8);
  doc.text('Kategori & Ukuran', margin + 5, currentY + 15);
  doc.text('Kondisi Saat Terjual', margin + 5, currentY + 22);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`:  ${item.itemNameAndBrand}`, margin + 45, currentY + 8);
  doc.text(`:  ${item.category} • Size: ${item.size || 'All Size'}`, margin + 45, currentY + 15);
  doc.text(`:  ${item.condition}`, margin + 45, currentY + 22);

  currentY += 35;

  // SECTION 3: RINCIAN PERHITUNGAN PENCAIRAN DANA
  doc.setFillColor(27, 54, 93);
  doc.rect(margin, currentY, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(27, 54, 93);
  doc.text('3. RINCIAN TRANSAKSI & DANA BERSIH DITERIMA', margin + 6, currentY + 5);

  currentY += 9;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, 48, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Harga Jual Akhir (Deal Pembeli)', margin + 6, currentY + 10);
  doc.text('Bagi Hasil / Jasa Layanan Kurasi & Iklan Admin', margin + 6, currentY + 18);
  doc.text('Catatan Pencairan', margin + 6, currentY + 26);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`:  ${formatRupiah(options.soldListingPrice)}`, margin + 95, currentY + 10);
  doc.text(`:  ${formatRupiah(options.adminFeeAmount)}`, margin + 95, currentY + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(`:  ${options.payoutNotes || 'Pencairan 100% sesuai kesepakatan nett penitip'}`, margin + 95, currentY + 26);

  // Highlight Final Nett Payout
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(margin + 4, currentY + 32, contentWidth - 8, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL DANA BERSIH DITERIMA PENITIP (LUNAS):', margin + 8, currentY + 40);
  doc.setFontSize(13);
  doc.text(formatRupiah(options.finalPayoutAmount), pageWidth - margin - 8, currentY + 40, {
    align: 'right',
  });

  currentY += 58;

  // Official Sign-off
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Terima kasih telah mempercayakan penjualan barang Anda melalui info.barkasmajalengka.',
    margin,
    currentY
  );
  doc.text(
    'Kwitansi digital ini sah dan diterbitkan secara otomatis oleh Sistem Consignment Hub info.barkasmajalengka.',
    margin,
    currentY + 5
  );

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Kwitansi Pencairan Resmi • ${ADMIN_CONTACT.name} (${ADMIN_CONTACT.whatsappFormatted}) • Tiket ${item.id}`,
    margin,
    286
  );

  const safeFilename = `Kwitansi-Pencairan-${item.id.replace(/[^a-zA-Z0-9-]/g, '')}.pdf`;
  doc.save(safeFilename);
};

export interface BuyerInvoiceOptions {
  buyerName: string;
  buyerWhatsapp?: string;
  dealPrice: number;
  shippingOrFee?: number;
  paymentMethod: string;
  codOrDeliveryPoint: string;
  invoiceNotes?: string;
}

/**
 * Generate Official Buyer Invoice / Nota Pembelian COD & Rekber (PDF)
 */
export const generateBuyerInvoicePDF = async (
  item: ConsignmentItem,
  options: BuyerInvoiceOptions
): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const qrDataUrl = await generateTicketQRCode(item);
  const totalPaid = (Number(options.dealPrice) || 0) + (Number(options.shippingOrFee) || 0);

  // Header Banner (Botanical Forest / Gold Editorial Invoice)
  doc.setFillColor(15, 41, 30);
  doc.rect(0, 0, pageWidth, 36, 'F');

  doc.setFillColor(245, 158, 11);
  doc.rect(0, 36, pageWidth, 3.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('info.barkasmajalengka', margin, 16);

  doc.setFontSize(10.5);
  doc.setTextColor(253, 230, 138);
  doc.text('NOTA PEMBELIAN RESMI / INVOICE TRANSAKSI COD & REKBER', margin, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(
    `Pengelola Resmi: ${ADMIN_CONTACT.name} • WA: ${ADMIN_CONTACT.whatsappFormatted} • Kabupaten Majalengka`,
    margin,
    30
  );

  let currentY = 46;

  // Invoice Summary Box
  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(margin, currentY, contentWidth, 34, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14);
  doc.text('NOMOR INVENTORI & STATUS TRANSAKSI PEMBELI', margin + 6, currentY + 8);

  doc.setFontSize(15);
  doc.setTextColor(15, 41, 30);
  doc.text(`INV/${item.id.replace('#', '')} — LUNAS / TERVERIFIKASI`, margin + 6, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const nowStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Tanggal Transaksi: ${nowStr} WIB`, margin + 6, currentY + 23);
  doc.text(
    `Metode Pembayaran: ${options.paymentMethod} • Titik COD/Kirim: ${options.codOrDeliveryPoint}`,
    margin + 6,
    currentY + 29
  );

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', pageWidth - margin - 32, currentY + 2, 30, 30);
  }

  currentY += 42;

  // SECTION 1: DATA PEMBELI
  doc.setFillColor(15, 41, 30);
  doc.rect(margin, currentY, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 41, 30);
  doc.text('1. DATA PEMBELI & PENGIRIMAN / COD', margin + 6, currentY + 5);

  currentY += 9;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, currentY, contentWidth, 28, 2, 2, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Nama Pembeli', margin + 5, currentY + 8);
  doc.text('Kontak WhatsApp', margin + 5, currentY + 15);
  doc.text('Titik COD / Tujuan', margin + 5, currentY + 22);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`:  ${options.buyerName || 'Pembeli Resmi info.barkasmajalengka'}`, margin + 45, currentY + 8);
  doc.text(`:  ${options.buyerWhatsapp || '-'}`, margin + 45, currentY + 15);
  doc.text(`:  ${options.codOrDeliveryPoint}`, margin + 45, currentY + 22);

  currentY += 35;

  // SECTION 2: SPESIFIKASI BARANG YANG DIBELI
  doc.setFillColor(15, 41, 30);
  doc.rect(margin, currentY, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 41, 30);
  doc.text('2. SPESIFIKASI BARANG YANG DIBELI', margin + 6, currentY + 5);

  currentY += 9;
  doc.roundedRect(margin, currentY, contentWidth, 36, 2, 2, 'D');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Kode Tiket & Kategori', margin + 5, currentY + 8);
  doc.text('Nama Barang & Merk', margin + 5, currentY + 15);
  doc.text('Ukuran & Kondisi', margin + 5, currentY + 22);
  doc.text('Keterangan Fisik', margin + 5, currentY + 29);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`:  ${item.id} (${item.category})`, margin + 45, currentY + 8);
  doc.text(`:  ${item.itemNameAndBrand}`, margin + 45, currentY + 15);
  doc.text(`:  Size ${item.size || 'All Size'} • ${item.condition}`, margin + 45, currentY + 22);
  doc.setFont('helvetica', 'normal');
  const cleanFlaws =
    item.descriptionAndFlaws.length > 75
      ? item.descriptionAndFlaws.slice(0, 75) + '...'
      : item.descriptionAndFlaws;
  doc.text(`:  ${cleanFlaws}`, margin + 45, currentY + 29);

  currentY += 43;

  // SECTION 3: RINCIAN PEMBAYARAN
  doc.setFillColor(15, 41, 30);
  doc.rect(margin, currentY, 3, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 41, 30);
  doc.text('3. RINCIAN HARGA & PEMBAYARAN', margin + 6, currentY + 5);

  currentY += 9;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, 48, 3, 3, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Harga Barang (Sesuai Kesepakatan / Deal)', margin + 6, currentY + 10);
  doc.text('Biaya Pengiriman / Kurir / Layanan Tambahan', margin + 6, currentY + 18);
  doc.text('Catatan Transaksi', margin + 6, currentY + 26);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`:  ${formatRupiah(options.dealPrice)}`, margin + 95, currentY + 10);
  doc.text(
    `:  ${options.shippingOrFee && options.shippingOrFee > 0 ? formatRupiah(options.shippingOrFee) : 'Gratis / COD Langsung'}`,
    margin + 95,
    currentY + 18
  );
  doc.setFont('helvetica', 'normal');
  doc.text(
    `:  ${options.invoiceNotes || 'Barang telah dicek bersama sesuai deskripsi etalase'}`,
    margin + 95,
    currentY + 26
  );

  doc.setFillColor(15, 41, 30);
  doc.roundedRect(margin + 4, currentY + 32, contentWidth - 8, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(253, 230, 138);
  doc.text('TOTAL PEMBAYARAN PEMBELI (LUNAS):', margin + 8, currentY + 40);
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(formatRupiah(totalPaid), pageWidth - margin - 8, currentY + 40, {
    align: 'right',
  });

  currentY += 56;

  // Footer Guarantee note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Terima kasih telah berbelanja barang preloved berkualitas di info.barkasmajalengka.',
    margin,
    currentY
  );
  doc.text(
    'Nota digital ini merupakan bukti transaksi sah melalui Rekening Bersama / COD Resmi Admin Esteh.',
    margin,
    currentY + 5
  );

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Nota Pembelian Resmi • ${ADMIN_CONTACT.name} (${ADMIN_CONTACT.whatsappFormatted}) • INV/${item.id.replace('#', '')}`,
    margin,
    286
  );

  const safeFilename = `Nota-Pembeli-${item.id.replace(/[^a-zA-Z0-9-]/g, '')}.pdf`;
  doc.save(safeFilename);
};

