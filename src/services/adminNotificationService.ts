import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ConsignmentItem } from '../types/consignment';
import { formatRupiah } from '../utils/formatters';
import { db, handleFirestoreError, OperationType } from './firebaseService';

export type WhatsAppProvider = 'fonnte' | 'wablas' | 'meta_cloud' | 'custom_webhook';

export interface AdminPhoneNotificationConfig {
  soundChimeEnabled: boolean;
  vibrationEnabled: boolean;
  browserPushEnabled: boolean;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  // WhatsApp Notification Settings
  whatsappEnabled: boolean;
  whatsappProvider: WhatsAppProvider;
  fonnteToken: string;
  wablasToken: string;
  wablasServerUrl: string;
  metaPhoneNumberId: string;
  metaAccessToken: string;
  // Custom Webhook
  webhookEnabled: boolean;
  webhookUrl: string;
  adminPhoneNumber: string;
}

const STORAGE_KEY = 'barkas_admin_phone_notif_config_v1';
const SETTINGS_COLLECTION = 'settings';
const NOTIF_SETTINGS_DOC_ID = 'admin_notifications';
const DEFAULT_ADMIN_PHONE = '085179550150';

export const getDefaultAdminPhoneConfig = (): AdminPhoneNotificationConfig => ({
  soundChimeEnabled: true,
  vibrationEnabled: true,
  browserPushEnabled: true,
  telegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  whatsappEnabled: false,
  whatsappProvider: 'fonnte',
  fonnteToken: '',
  wablasToken: '',
  wablasServerUrl: 'https://solo.wablas.com',
  metaPhoneNumberId: '',
  metaAccessToken: '',
  webhookEnabled: false,
  webhookUrl: '',
  adminPhoneNumber: DEFAULT_ADMIN_PHONE,
});

/**
 * Load admin notification config from localStorage
 */
export const getAdminNotificationConfig = (): AdminPhoneNotificationConfig => {
  const defaults = getDefaultAdminPhoneConfig();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaults,
        ...parsed,
      };
    }
  } catch {
    // ignore
  }
  return defaults;
};

/**
 * Save admin notification config to localStorage and Firestore
 */
export const saveAdminNotificationConfig = async (
  config: AdminPhoneNotificationConfig
): Promise<void> => {
  const cleanConfig: AdminPhoneNotificationConfig = {
    soundChimeEnabled: Boolean(config.soundChimeEnabled),
    vibrationEnabled: Boolean(config.vibrationEnabled),
    browserPushEnabled: Boolean(config.browserPushEnabled),
    telegramEnabled: Boolean(config.telegramEnabled),
    telegramBotToken: (config.telegramBotToken || '').trim().slice(0, 120),
    telegramChatId: (config.telegramChatId || '').trim().slice(0, 60),
    whatsappEnabled: Boolean(config.whatsappEnabled),
    whatsappProvider: config.whatsappProvider || 'fonnte',
    fonnteToken: (config.fonnteToken || '').trim().slice(0, 150),
    wablasToken: (config.wablasToken || '').trim().slice(0, 150),
    wablasServerUrl: (config.wablasServerUrl || 'https://solo.wablas.com').trim().slice(0, 150),
    metaPhoneNumberId: (config.metaPhoneNumberId || '').trim().slice(0, 100),
    metaAccessToken: (config.metaAccessToken || '').trim().slice(0, 600),
    webhookEnabled: Boolean(config.webhookEnabled),
    webhookUrl: (config.webhookUrl || '').trim().slice(0, 500),
    adminPhoneNumber: (config.adminPhoneNumber || DEFAULT_ADMIN_PHONE).trim().slice(0, 40),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanConfig));
  } catch {
    // ignore
  }

  // Sync to Firestore under settings/admin_notifications
  const path = `${SETTINGS_COLLECTION}/${NOTIF_SETTINGS_DOC_ID}`;
  try {
    await setDoc(
      doc(db, SETTINGS_COLLECTION, NOTIF_SETTINGS_DOC_ID),
      {
        enabledOnNewSubmission: true,
        enabledOnAdminLive: true,
        ...cleanConfig,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

/**
 * Pull and sync notification config from Firestore cloud
 */
export const syncAdminNotificationConfigWithCloud = async (): Promise<AdminPhoneNotificationConfig> => {
  const localConfig = getAdminNotificationConfig();
  const path = `${SETTINGS_COLLECTION}/${NOTIF_SETTINGS_DOC_ID}`;

  try {
    const snap = await getDoc(doc(db, SETTINGS_COLLECTION, NOTIF_SETTINGS_DOC_ID));
    if (snap.exists()) {
      const data = snap.data();
      const merged: AdminPhoneNotificationConfig = {
        soundChimeEnabled: typeof data.soundChimeEnabled === 'boolean' ? data.soundChimeEnabled : localConfig.soundChimeEnabled,
        vibrationEnabled: typeof data.vibrationEnabled === 'boolean' ? data.vibrationEnabled : localConfig.vibrationEnabled,
        browserPushEnabled: typeof data.browserPushEnabled === 'boolean' ? data.browserPushEnabled : localConfig.browserPushEnabled,
        telegramEnabled: typeof data.telegramEnabled === 'boolean' ? data.telegramEnabled : localConfig.telegramEnabled,
        telegramBotToken: (data.telegramBotToken || localConfig.telegramBotToken || '').trim(),
        telegramChatId: (data.telegramChatId || localConfig.telegramChatId || '').trim(),
        whatsappEnabled: typeof data.whatsappEnabled === 'boolean' ? data.whatsappEnabled : localConfig.whatsappEnabled,
        whatsappProvider: (data.whatsappProvider || localConfig.whatsappProvider || 'fonnte') as WhatsAppProvider,
        fonnteToken: (data.fonnteToken || localConfig.fonnteToken || '').trim(),
        wablasToken: (data.wablasToken || localConfig.wablasToken || '').trim(),
        wablasServerUrl: (data.wablasServerUrl || localConfig.wablasServerUrl || 'https://solo.wablas.com').trim(),
        metaPhoneNumberId: (data.metaPhoneNumberId || localConfig.metaPhoneNumberId || '').trim(),
        metaAccessToken: (data.metaAccessToken || localConfig.metaAccessToken || '').trim(),
        webhookEnabled: typeof data.webhookEnabled === 'boolean' ? data.webhookEnabled : localConfig.webhookEnabled,
        webhookUrl: (data.webhookUrl || localConfig.webhookUrl || '').trim(),
        adminPhoneNumber: (data.adminPhoneNumber || localConfig.adminPhoneNumber || DEFAULT_ADMIN_PHONE).trim(),
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // ignore
      }
      return merged;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  return localConfig;
};

/**
 * Play high-attention alert chime using Web Audio API (cross-device & offline capable)
 */
export const playAdminChimeSound = (): void => {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number, volume: number = 0.25) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    // Bright cheerful attention chime: G5 -> C6 -> E6 (Cashier/Bell alert)
    playTone(784, now, 0.12, 0.22);
    playTone(1046.5, now + 0.13, 0.15, 0.26);
    playTone(1318.5, now + 0.30, 0.40, 0.30);
  } catch (err) {
    console.warn('Audio chime playback error:', err);
  }
};

/**
 * Vibrate smartphone
 */
export const vibrateAdminPhone = (pattern: number[] = [300, 120, 300, 120, 450]): void => {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore
  }
};

/**
 * Request browser push notification permission
 */
export const requestBrowserNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch {
    return Notification.permission;
  }
};

/**
 * Trigger system notification on Admin's phone / PC
 */
export const showAdminBrowserNotification = (
  item: ConsignmentItem,
  onOpen?: () => void
): void => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const title = `📦 BARANG TITIP BARU MASUK!`;
    const body = `${item.itemNameAndBrand} (${formatRupiah(item.nettPrice)})\nDari: ${item.fullName} (Kec. ${item.kecamatan})\nTiket: ${item.id}`;
    
    const notif = new Notification(title, {
      body,
      icon: item.photos?.[0] || '/favicon.ico',
      badge: '/favicon.ico',
      tag: item.id,
      requireInteraction: true,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
      if (onOpen) onOpen();
    };
  } catch (err) {
    console.warn('Browser notification error:', err);
  }
};

/**
 * Send instant alert to Admin's Telegram App on phone
 */
export const sendTelegramAlert = async (
  item: ConsignmentItem,
  config?: AdminPhoneNotificationConfig
): Promise<boolean> => {
  const currentConfig = config || getAdminNotificationConfig();
  if (!currentConfig.telegramEnabled || !currentConfig.telegramBotToken || !currentConfig.telegramChatId) {
    return false;
  }

  const cleanPhone = item.whatsappNumber.replace(/[^0-9]/g, '');
  const waLink = cleanPhone.startsWith('0') 
    ? `https://wa.me/62${cleanPhone.slice(1)}` 
    : `https://wa.me/${cleanPhone}`;

  const adminOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://info.barkasmajalengka.com';
  const adminUrl = `${adminOrigin}/admin`;

  const messageText = 
`🚨 *BARANG TITIP BARU MASUK DI HP ADMIN!* 📦
━━━━━━━━━━━━━━━━━━━━
🏷️ *Kode Tiket:* \`${item.id}\`
📦 *Nama Barang:* *${item.itemNameAndBrand}*
💰 *Harga Nett Titip:* *${formatRupiah(item.nettPrice)}*
📂 *Kategori:* ${item.category}
⚙️ *Kondisi:* ${item.condition}
📏 *Ukuran:* ${item.size}
📝 *Minus/Ket:* ${item.descriptionAndFlaws || '-'}
━━━━━━━━━━━━━━━━━━━━
👤 *Penitip:* ${item.fullName}
📍 *Domisili:* Kec. ${item.kecamatan}, Majalengka
📱 *Nomor WA:* ${item.whatsappNumber}
🏦 *Rekening:* ${item.bankAccount}
━━━━━━━━━━━━━━━━━━━━
👉 [Buka Chat WA Penitip](${waLink})
👉 [Tinjau & Kurasi di Panel Admin](${adminUrl})`;

  try {
    const url = `https://api.telegram.org/bot${currentConfig.telegramBotToken.trim()}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: currentConfig.telegramChatId.trim(),
        text: messageText,
        parse_mode: 'Markdown',
        disable_web_page_preview: false,
      }),
    });

    if (!res.ok) {
      console.warn('Telegram API response not ok:', await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error sending Telegram alert to Admin phone:', err);
    return false;
  }
};

/**
 * Build rich WhatsApp text notification with markdown formatting
 */
export const formatWhatsAppNotificationMessage = (
  item: ConsignmentItem,
  adminOrigin?: string
): string => {
  const cleanPhone = item.whatsappNumber.replace(/[^0-9]/g, '');
  const waLink = cleanPhone.startsWith('0') 
    ? `https://wa.me/62${cleanPhone.slice(1)}` 
    : `https://wa.me/${cleanPhone}`;
  
  const origin = adminOrigin || (typeof window !== 'undefined' ? window.location.origin : 'https://info.barkasmajalengka.com');
  const adminUrl = `${origin}/admin`;

  return `🚨 *NOTIFIKASI BARANG TITIP BARU!* 📦
━━━━━━━━━━━━━━━━━━━━
🏷️ *Kode Tiket:* *${item.id}*
📦 *Barang:* *${item.itemNameAndBrand}*
💰 *Harga Nett Titip:* *${formatRupiah(item.nettPrice)}*
📂 *Kategori:* ${item.category}
⚙️ *Kondisi:* ${item.condition}
📏 *Ukuran:* ${item.size}
📝 *Deskripsi/Minus:* ${item.descriptionAndFlaws || '-'}
━━━━━━━━━━━━━━━━━━━━
👤 *Penitip:* ${item.fullName}
📍 *Domisili:* Kec. ${item.kecamatan}, Majalengka
📱 *WhatsApp Penitip:* ${item.whatsappNumber}
🏦 *Rekening:* ${item.bankAccount}
━━━━━━━━━━━━━━━━━━━━
👉 *Chat WA Penitip:* ${waLink}
👉 *Buka Panel Admin:* ${adminUrl}`;
};

/**
 * Send WhatsApp notification via Fonnte Gateway
 */
export const sendFonnteAlert = async (
  item: ConsignmentItem,
  config: AdminPhoneNotificationConfig
): Promise<boolean> => {
  if (!config.fonnteToken.trim()) return false;
  const target = (config.adminPhoneNumber || DEFAULT_ADMIN_PHONE).replace(/[^0-9]/g, '');
  const message = formatWhatsAppNotificationMessage(item);

  try {
    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': config.fonnteToken.trim(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target,
        message,
        url: item.photos?.[0] || undefined,
        typing: false,
        delay: '1',
      }),
    });
    const data = await res.json().catch(() => ({}));
    return Boolean(res.ok && (data.status === true || data.status === 'true' || res.status === 200));
  } catch (err) {
    console.error('Error sending Fonnte WhatsApp alert:', err);
    return false;
  }
};

/**
 * Send WhatsApp notification via Wablas Gateway
 */
export const sendWablasAlert = async (
  item: ConsignmentItem,
  config: AdminPhoneNotificationConfig
): Promise<boolean> => {
  if (!config.wablasToken.trim()) return false;
  const target = (config.adminPhoneNumber || DEFAULT_ADMIN_PHONE).replace(/[^0-9]/g, '');
  const message = formatWhatsAppNotificationMessage(item);
  const server = (config.wablasServerUrl || 'https://solo.wablas.com').replace(/\/+$/, '');

  try {
    const res = await fetch(`${server}/api/send-message`, {
      method: 'POST',
      headers: {
        'Authorization': config.wablasToken.trim(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: target,
        message,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('Error sending Wablas WhatsApp alert:', err);
    return false;
  }
};

/**
 * Send WhatsApp notification via Meta WhatsApp Cloud API
 */
export const sendMetaCloudAlert = async (
  item: ConsignmentItem,
  config: AdminPhoneNotificationConfig
): Promise<boolean> => {
  if (!config.metaPhoneNumberId.trim() || !config.metaAccessToken.trim()) return false;
  let target = (config.adminPhoneNumber || DEFAULT_ADMIN_PHONE).replace(/[^0-9]/g, '');
  if (target.startsWith('0')) target = '62' + target.slice(1);
  const message = formatWhatsAppNotificationMessage(item);
  const phoneId = config.metaPhoneNumberId.trim();

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.metaAccessToken.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: target,
        type: 'text',
        text: { body: message },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('Error sending Meta Cloud WhatsApp alert:', err);
    return false;
  }
};

/**
 * Send WhatsApp alert based on selected provider
 */
export const sendWhatsAppAlert = async (
  item: ConsignmentItem,
  config?: AdminPhoneNotificationConfig
): Promise<boolean> => {
  const currentConfig = config || getAdminNotificationConfig();
  if (!currentConfig.whatsappEnabled) return false;

  switch (currentConfig.whatsappProvider) {
    case 'fonnte':
      return sendFonnteAlert(item, currentConfig);
    case 'wablas':
      return sendWablasAlert(item, currentConfig);
    case 'meta_cloud':
      return sendMetaCloudAlert(item, currentConfig);
    case 'custom_webhook':
      return sendWebhookAlert(item, currentConfig);
    default:
      return false;
  }
};

/**
 * Send webhook notification to Admin's phone (Fonnte, Wablas, Discord, Zapier, Make)
 */
export const sendWebhookAlert = async (
  item: ConsignmentItem,
  config?: AdminPhoneNotificationConfig
): Promise<boolean> => {
  const currentConfig = config || getAdminNotificationConfig();
  if (!currentConfig.webhookEnabled || !currentConfig.webhookUrl) {
    return false;
  }

  const cleanPhone = item.whatsappNumber.replace(/[^0-9]/g, '');
  const waLink = cleanPhone.startsWith('0') 
    ? `https://wa.me/62${cleanPhone.slice(1)}` 
    : `https://wa.me/${cleanPhone}`;

  const payload = {
    event: 'new_consignment_submission',
    timestamp: new Date().toISOString(),
    ticketId: item.id,
    item: {
      id: item.id,
      itemName: item.itemNameAndBrand,
      category: item.category,
      condition: item.condition,
      size: item.size,
      nettPrice: item.nettPrice,
      nettPriceFormatted: formatRupiah(item.nettPrice),
      description: item.descriptionAndFlaws,
      sellerName: item.fullName,
      sellerWhatsApp: item.whatsappNumber,
      sellerWhatsAppLink: waLink,
      kecamatan: item.kecamatan,
      bankAccount: item.bankAccount,
      photosCount: (item.photos || []).length,
      primaryPhoto: item.photos?.[0] || '',
    },
    adminDashboardUrl: typeof window !== 'undefined' ? `${window.location.origin}/admin` : '',
    // Generic chat-ready message formatting for Discord / Fonnte WA gateway
    content: `🚨 BARANG TITIP BARU MASUK! Tiket: ${item.id} - ${item.itemNameAndBrand} (${formatRupiah(item.nettPrice)}) dari ${item.fullName} (${item.kecamatan}). WA: ${waLink}`,
    target: currentConfig.adminPhoneNumber || DEFAULT_ADMIN_PHONE,
    message: `🚨 *BARANG TITIP BARU MASUK!* 📦\nTiket: ${item.id}\nBarang: ${item.itemNameAndBrand}\nNett: ${formatRupiah(item.nettPrice)}\nPenitip: ${item.fullName} (${item.kecamatan})\nWA Penitip: ${waLink}`,
  };

  try {
    const res = await fetch(currentConfig.webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error('Error sending webhook alert:', err);
    return false;
  }
};

/**
 * Dispatch all configured phone notifications whenever a new item is submitted
 */
export const triggerAdminPhoneAlertOnNewSubmission = async (
  item: ConsignmentItem
): Promise<void> => {
  // Sync latest cloud config first so any updates from Admin HP are picked up
  const config = await syncAdminNotificationConfigWithCloud().catch(() => getAdminNotificationConfig());

  // Trigger Telegram, WhatsApp Gateway, and Webhook in parallel
  await Promise.allSettled([
    sendTelegramAlert(item, config),
    sendWhatsAppAlert(item, config),
    sendWebhookAlert(item, config),
  ]);
};

/**
 * Test WhatsApp gateway connection with a sample message to Admin HP
 */
export const testWhatsAppGateway = async (
  provider: WhatsAppProvider,
  config: AdminPhoneNotificationConfig
): Promise<{ success: boolean; message: string }> => {
  const target = (config.adminPhoneNumber || DEFAULT_ADMIN_PHONE).replace(/[^0-9]/g, '');
  const sampleMessage = `🔔 *TES NOTIFIKASI WHATSAPP HP ADMIN INFO.BARKASMAJALENGKA* ✅
━━━━━━━━━━━━━━━━━━━━
Halo Admin Esteh! WhatsApp Gateway via *${provider.toUpperCase()}* telah terhubung dengan sukses ke nomor HP ini (*${config.adminPhoneNumber}*).

Setiap kali ada penitip mengirim formulir barang titip baru di website, notifikasi otomatis langsung masuk ke WhatsApp HP Admin secara *real-time*!

Waktu Tes: ${new Date().toLocaleString('id-ID')}`;

  try {
    if (provider === 'fonnte') {
      if (!config.fonnteToken.trim()) {
        return { success: false, message: 'Token Fonnte belum diisi. Salin API Token dari dashboard Fonnte Anda.' };
      }
      const res = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': config.fonnteToken.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target,
          message: sampleMessage,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.status === true || data.status === 'true' || res.status === 200)) {
        return { success: true, message: `Berhasil! Pesan tes WhatsApp via Fonnte telah dikirim ke nomor ${config.adminPhoneNumber}.` };
      }
      return { 
        success: false, 
        message: data.reason || data.detail || `Fonnte error (HTTP ${res.status}). Pastikan nomor HP device di Fonnte dalam status Connected.` 
      };
    }

    if (provider === 'wablas') {
      if (!config.wablasToken.trim()) {
        return { success: false, message: 'Token Wablas belum diisi.' };
      }
      const server = (config.wablasServerUrl || 'https://solo.wablas.com').replace(/\/+$/, '');
      const res = await fetch(`${server}/api/send-message`, {
        method: 'POST',
        headers: {
          'Authorization': config.wablasToken.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: target,
          message: sampleMessage,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, message: `Berhasil! Pesan tes WhatsApp via Wablas terkirim ke ${config.adminPhoneNumber}.` };
      }
      return { success: false, message: data.message || `Wablas gagal (HTTP ${res.status}). Periksa URL domain & token Wablas.` };
    }

    if (provider === 'meta_cloud') {
      if (!config.metaPhoneNumberId.trim() || !config.metaAccessToken.trim()) {
        return { success: false, message: 'Phone Number ID dan Access Token Meta Graph API wajib diisi.' };
      }
      let formattedTarget = target;
      if (formattedTarget.startsWith('0')) formattedTarget = '62' + formattedTarget.slice(1);
      const res = await fetch(`https://graph.facebook.com/v20.0/${config.metaPhoneNumberId.trim()}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.metaAccessToken.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedTarget,
          type: 'text',
          text: { body: sampleMessage },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return { success: true, message: `Berhasil! Pesan WhatsApp Cloud API terkirim ke ${config.adminPhoneNumber}.` };
      }
      return { 
        success: false, 
        message: data.error?.message || `Meta Cloud API error (HTTP ${res.status}). Catatan: Meta memerlukan pesan template jika window 24 jam belum terbuka.` 
      };
    }

    if (provider === 'custom_webhook') {
      return testWebhookNotification(config.webhookUrl);
    }

    return { success: false, message: 'Provider tidak dikenali.' };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Koneksi gagal: ${errMsg}` };
  }
};

/**
 * Test Telegram bot connection to Admin's phone
 */
export const testTelegramNotification = async (
  token: string,
  chatId: string
): Promise<{ success: boolean; message: string }> => {
  if (!token.trim() || !chatId.trim()) {
    return { success: false, message: 'Token Bot dan Chat ID Telegram wajib diisi.' };
  }

  const sampleText = 
`🔔 *TES NOTIFIKASI HP ADMIN INFO.BARKASMAJALENGKA* ✅
━━━━━━━━━━━━━━━━━━━━
Halo Admin Esteh! Konfigurasi notifikasi Telegram di HP Anda telah terhubung dengan sempurna.

Setiap kali ada penitip mengirim formulir barang titip baru di website, pesan notifikasi instan akan langsung masuk ke HP Anda di sini secara *real-time* 24 jam!

Waktu Uji: ${new Date().toLocaleString('id-ID')}`;

  try {
    const url = `https://api.telegram.org/bot${token.trim()}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: sampleText,
        parse_mode: 'Markdown',
      }),
    });

    const data = await res.json();
    if (data.ok) {
      return { success: true, message: 'Pesan tes berhasil terkirim ke Telegram HP Anda!' };
    } else {
      return { 
        success: false, 
        message: `Gagal: ${data.description || 'Periksa token atau pastikan sudah klik START pada bot di Telegram.'}` 
      };
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal terhubung ke Telegram: ${errMsg}` };
  }
};

/**
 * Test Webhook / WA Gateway connection to Admin's phone
 */
export const testWebhookNotification = async (
  webhookUrl: string
): Promise<{ success: boolean; message: string }> => {
  if (!webhookUrl.trim()) {
    return { success: false, message: 'URL Webhook wajib diisi.' };
  }

  const payload = {
    event: 'test_admin_phone_alert',
    timestamp: new Date().toISOString(),
    message: '🔔 Tes Notifikasi Webhook HP Admin Barkas Majalengka Berhasil!',
    content: '🔔 Tes Notifikasi Webhook HP Admin Barkas Majalengka Berhasil!',
  };

  try {
    const res = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return { success: true, message: 'Tes Webhook berhasil terkirim (HTTP ' + res.status + ')!' };
    } else {
      return { success: false, message: `Server Webhook mengembalikan kode HTTP ${res.status}.` };
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Gagal memanggil URL Webhook: ${errMsg}` };
  }
};
