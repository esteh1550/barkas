import QRCode from 'qrcode';
import { ConsignmentItem } from '../types/consignment';

/**
 * Clean ticket ID without leading '#'
 */
export const cleanTicketCode = (ticketId: string): string => {
  return ticketId.trim().replace(/^#/, '');
};

/**
 * Generate a direct URL link to item verification detail so scanning with a phone camera
 * opens the item verification page directly in AdminDashboard (or public catalog).
 */
export const getTicketVerificationUrl = (
  ticketId: string,
  mode: 'admin' | 'public' = 'admin'
): string => {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://barkas-two.vercel.app';
  const cleanId = cleanTicketCode(ticketId);
  if (mode === 'public') {
    return `${origin}/?ticket=${encodeURIComponent(cleanId)}`;
  }
  return `${origin}/admin?verify=${encodeURIComponent(cleanId)}`;
};

/**
 * Generate QR code data URL for a consignment item containing the direct verification link
 */
export const generateTicketQRCode = async (
  item: ConsignmentItem,
  mode: 'admin' | 'public' = 'admin'
): Promise<string> => {
  try {
    const verificationUrl = getTicketVerificationUrl(item.id, mode);

    return await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
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
