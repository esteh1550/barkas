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
