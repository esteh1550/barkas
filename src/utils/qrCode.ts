import QRCode from 'qrcode';
import { ConsignmentItem } from '../types/consignment';

/**
 * Generate QR code data URL for a consignment item
 */
export const generateTicketQRCode = async (item: ConsignmentItem): Promise<string> => {
  try {
    // Structured verification string for admin scanner
    const qrPayload = JSON.stringify({
      app: 'info.barkasmajalengka',
      ticket: item.id,
      penitip: item.fullName,
      wa: item.whatsappNumber,
      kecamatan: item.kecamatan,
      barang: item.itemNameAndBrand,
      size: item.size || '-',
      kondisi: item.condition,
      hargaNett: item.nettPrice,
      rekening: item.bankAccount,
      tgl: item.createdAt,
    });

    return await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#1B365D',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return '';
  }
};
