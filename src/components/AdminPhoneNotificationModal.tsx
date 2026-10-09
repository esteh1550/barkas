import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  Volume2, 
  Smartphone, 
  Send, 
  X, 
  Check, 
  AlertCircle, 
  ExternalLink, 
  Sparkles, 
  Radio, 
  HelpCircle,
  Loader2,
  CheckCircle2,
  Globe,
  Copy,
  MessageSquare,
  MessageCircle,
  CheckCheck
} from 'lucide-react';
import { 
  AdminPhoneNotificationConfig,
  WhatsAppProvider,
  getAdminNotificationConfig,
  saveAdminNotificationConfig,
  syncAdminNotificationConfigWithCloud,
  playAdminChimeSound,
  vibrateAdminPhone,
  requestBrowserNotificationPermission,
  testTelegramNotification,
  testWebhookNotification,
  testWhatsAppGateway
} from '../services/adminNotificationService';

interface AdminPhoneNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

export const AdminPhoneNotificationModal: React.FC<AdminPhoneNotificationModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [config, setConfig] = useState<AdminPhoneNotificationConfig>(getAdminNotificationConfig());
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [showTelegramHelp, setShowTelegramHelp] = useState(false);
  const [showWebhookHelp, setShowWebhookHelp] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const webhookAiPrompt = `Buat skenario otomatisasi di Make.com (atau n8n/Zapier) dengan Webhook (Custom Webhook) sebagai trigger untuk menerima notifikasi dari sistem info.barkasmajalengka, lalu otomatis kirim pesan WhatsApp ke HP Admin (0851-7955-0150).

Data JSON yang dikirim sistem:
{
  "event": "new_consignment_submission",
  "ticketId": "{{ticketId}}",
  "target": "085179550150",
  "message": "{{message}}",
  "item": {
    "id": "{{item.id}}",
    "itemName": "{{item.itemName}}",
    "category": "{{item.category}}",
    "condition": "{{item.condition}}",
    "size": "{{item.size}}",
    "nettPriceFormatted": "{{item.nettPriceFormatted}}",
    "description": "{{item.description}}",
    "sellerName": "{{item.sellerName}}",
    "sellerWhatsApp": "{{item.sellerWhatsApp}}",
    "sellerWhatsAppLink": "{{item.sellerWhatsAppLink}}",
    "kecamatan": "{{item.kecamatan}}",
    "bankAccount": "{{item.bankAccount}}",
    "primaryPhoto": "{{item.primaryPhoto}}"
  },
  "adminDashboardUrl": "{{adminDashboardUrl}}"
}

Template Pesan WhatsApp yang dikirim ke nomor Admin:
🚨 *BARANG TITIP BARU MASUK DI HP ADMIN!* 📦
━━━━━━━━━━━━━━━━━━━━
🏷️ *Kode Tiket:* {{item.id}}
📦 *Barang:* {{item.itemName}}
💰 *Harga Nett Titip:* {{item.nettPriceFormatted}}
📂 *Kategori:* {{item.category}} | {{item.condition}}
📏 *Ukuran:* {{item.size}}
📝 *Deskripsi/Minus:* {{item.description}}
━━━━━━━━━━━━━━━━━━━━
👤 *Penitip:* {{item.sellerName}} (Kec. {{item.kecamatan}})
📱 *WA Penitip:* {{item.sellerWhatsApp}}
🏦 *Rekening:* {{item.bankAccount}}
━━━━━━━━━━━━━━━━━━━━
👉 *Chat WA Penitip Langsung:* {{item.sellerWhatsAppLink}}
👉 *Buka Panel Admin:* {{adminDashboardUrl}}`;

  const webhookSampleJson = JSON.stringify({
    event: "new_consignment_submission",
    timestamp: "2026-10-09T14:00:00Z",
    ticketId: "#BM-2026-8812",
    target: "085179550150",
    message: "🚨 BARANG TITIP BARU MASUK! Tiket: #BM-2026-8812 - Sepatu Compass (Rp 350.000)",
    item: {
      id: "#BM-2026-8812",
      itemName: "Sepatu Compass Gazelle Low",
      category: "Sneakers / Sepatu",
      condition: "Seperti Baru / Like New",
      size: "42",
      nettPrice: 350000,
      nettPriceFormatted: "Rp 350.000",
      description: "Fullset box, no minus, siap COD",
      sellerName: "Budi Santoso",
      sellerWhatsApp: "081234567890",
      sellerWhatsAppLink: "https://wa.me/6281234567890",
      kecamatan: "Kadipaten",
      bankAccount: "BCA 12345678 a/n Budi",
      photosCount: 2,
      primaryPhoto: "https://example.com/photo.jpg"
    },
    adminDashboardUrl: "https://info.barkasmajalengka.com/admin"
  }, null, 2);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(webhookAiPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
    onShowToast('📋 Prompt Webhook WhatsApp berhasil disalin!');
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(webhookSampleJson);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2500);
    onShowToast('📋 Contoh JSON Payload berhasil disalin!');
  };

  useEffect(() => {
    if (isOpen) {
      syncAdminNotificationConfigWithCloud()
        .then((latest) => setConfig(latest))
        .catch(() => {});
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setBrowserPermission(Notification.permission);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const perm = await requestBrowserNotificationPermission();
    setBrowserPermission(perm);
    if (perm === 'granted') {
      playAdminChimeSound();
      vibrateAdminPhone();
      if ('Notification' in window) {
        new Notification('🔔 Notifikasi HP Admin Aktif!', {
          body: 'Notifikasi barang titip baru akan otomatis muncul di HP Anda.',
          icon: '/favicon.ico',
        });
      }
      onShowToast('✅ Izin notifikasi browser HP berhasil diaktifkan!');
    } else if (perm === 'denied') {
      onShowToast('⚠️ Izin notifikasi diblokir browser. Mohon izinkan via pengaturan browser.');
    }
  };

  const handleTestChimeAndVibrate = () => {
    playAdminChimeSound();
    vibrateAdminPhone();
    if (browserPermission === 'granted' && 'Notification' in window) {
      new Notification('🔔 Tes Bel & Getar HP Berhasil!', {
        body: 'Contoh: Sepatu Adidas Spezial (Rp 450.000) baru dititipkan oleh Budi!',
        icon: '/favicon.ico',
      });
    }
    onShowToast('🔔 Bunyi bel dan getar telah diuji di perangkat ini!');
  };

  const handleTestTelegram = async () => {
    if (!config.telegramBotToken.trim() || !config.telegramChatId.trim()) {
      onShowToast('⚠️ Masukkan Token Bot dan Chat ID Telegram terlebih dahulu.');
      return;
    }
    setIsTestingTelegram(true);
    try {
      const result = await testTelegramNotification(config.telegramBotToken, config.telegramChatId);
      if (result.success) {
        onShowToast('✅ ' + result.message);
      } else {
        onShowToast('❌ ' + result.message);
      }
    } finally {
      setIsTestingTelegram(false);
    }
  };

  const handleTestWhatsApp = async () => {
    setIsTestingWhatsApp(true);
    try {
      const result = await testWhatsAppGateway(config.whatsappProvider, config);
      if (result.success) {
        onShowToast('✅ ' + result.message);
      } else {
        onShowToast('❌ ' + result.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onShowToast('❌ Gagal menguji WhatsApp: ' + msg);
    } finally {
      setIsTestingWhatsApp(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!config.webhookUrl.trim()) {
      onShowToast('⚠️ Masukkan URL Webhook terlebih dahulu.');
      return;
    }
    setIsTestingWebhook(true);
    try {
      const result = await testWebhookNotification(config.webhookUrl);
      if (result.success) {
        onShowToast('✅ ' + result.message);
      } else {
        onShowToast('❌ ' + result.message);
      }
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveAdminNotificationConfig(config);
      onShowToast('✅ Pengaturan notifikasi HP admin berhasil disimpan ke Cloud & Perangkat!');
      onClose();
    } catch (err) {
      console.error(err);
      onShowToast('⚠️ Gagal menyimpan pengaturan ke Cloud.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative bg-[#FAF7F2] border-4 border-double border-stone-900 max-w-2xl w-full shadow-[8px_8px_0px_#1C1917] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-[#1B365D] text-white p-5 sm:p-6 border-b-2 border-amber-400 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg cursor-pointer transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-[#1B365D] flex items-center justify-center shadow-[2px_2px_0px_#C25E34]">
              <BellRing className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-amber-300 uppercase block">
                PUSAT NOTIFIKASI OTOMATIS REAL-TIME
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Notifikasi Barang Titip Baru ke HP Admin
              </h2>
              <p className="text-xs text-amber-100/90 mt-0.5">
                Admin langsung dapat notifikasi, bunyi bel, getar, atau pesan instan di HP begitu ada warga kirim barang titip baru.
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Status Bar */}
          <div className="bg-[#ECE5D8] border-2 border-stone-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#1C1917]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-stone-700">
                  Status Bel & Browser HP:
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    browserPermission === 'granted'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : browserPermission === 'denied'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {browserPermission === 'granted'
                    ? '● Izin Notifikasi Aktif'
                    : browserPermission === 'denied'
                    ? '✕ Izin Diblokir'
                    : '○ Belum Diizinkan'}
                </span>
              </div>
              <p className="text-xs text-stone-600 font-serif-editorial italic">
                Uji coba sekarang untuk mendengar bunyi bel perhatian dan merasakan getaran di HP.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {browserPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-3 py-1.5 bg-[#1B365D] hover:bg-[#152a48] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-300" />
                  <span>Izinkan di HP</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleTestChimeAndVibrate}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-[#1B365D] rounded-lg text-xs font-extrabold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Tes Bel & Getar</span>
              </button>
            </div>
          </div>

          {/* Section 1: In-App & Browser Notification Settings */}
          <div className="bg-white border-2 border-stone-800 p-4 sm:p-5 rounded-xl space-y-3 shadow-[2px_2px_0px_#1C1917]">
            <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
              <Smartphone className="w-4 h-4 text-[#1B365D]" />
              <h3 className="text-sm font-bold text-stone-900 uppercase">
                1. Bunyi Bel & Getar di HP Admin (Saat Buka Admin)
              </h3>
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-center justify-between p-2.5 rounded-lg hover:bg-stone-50 cursor-pointer border border-stone-200 transition-colors">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-bold text-stone-900 block">
                    Bunyikan Bel Perhatian (Audio Chime)
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    Memutar nada bel kasir (3-tone alert) seketika ada data formulir titip baru masuk ke server.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.soundChimeEnabled}
                  onChange={(e) => setConfig((prev) => ({ ...prev, soundChimeEnabled: e.target.checked }))}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg hover:bg-stone-50 cursor-pointer border border-stone-200 transition-colors">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-bold text-stone-900 block">
                    Getarkan HP Admin (Vibrate)
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    Menggetarkan smartphone admin saat formulir baru diterima.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.vibrationEnabled}
                  onChange={(e) => setConfig((prev) => ({ ...prev, vibrationEnabled: e.target.checked }))}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-lg hover:bg-stone-50 cursor-pointer border border-stone-200 transition-colors">
                <div className="space-y-0.5 pr-4">
                  <span className="text-xs font-bold text-stone-900 block">
                    Pop-up Notifikasi Sistem Layar (Browser Web Push)
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    Munculkan kartu notifikasi bawaan HP/laptop meskipun layar sedang membuka tab lain.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.browserPushEnabled}
                  onChange={(e) => setConfig((prev) => ({ ...prev, browserPushEnabled: e.target.checked }))}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Section 2: Telegram Bot Instant Push (24/7 Phone Push) */}
          <div className="bg-white border-2 border-stone-800 p-4 sm:p-5 rounded-xl space-y-4 shadow-[2px_2px_0px_#1C1917]">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-stone-900 uppercase">
                  2. Notifikasi Pesan Telegram ke HP (24 Jam & Bebas Biaya)
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                Sangat Direkomendasikan ⭐
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Dengan menghubungkan bot Telegram, notifikasi barang titip baru akan <strong>langsung masuk dan berdering di HP Anda</strong> 24 jam non-stop meskipun web browser ditutup, lengkap dengan foto barang, harga, nama penitip, dan link chat WA penitip!
            </p>

            <div className="flex items-center justify-between p-2.5 bg-sky-50 border border-sky-200 rounded-lg">
              <span className="text-xs font-bold text-sky-900">
                Aktifkan Pengiriman Notifikasi ke Telegram HP
              </span>
              <input
                type="checkbox"
                checked={config.telegramEnabled}
                onChange={(e) => setConfig((prev) => ({ ...prev, telegramEnabled: e.target.checked }))}
                className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
              />
            </div>

            {config.telegramEnabled && (
              <div className="space-y-3 pt-1 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Bot Token Telegram
                  </label>
                  <input
                    type="text"
                    value={config.telegramBotToken}
                    onChange={(e) => setConfig((prev) => ({ ...prev, telegramBotToken: e.target.value }))}
                    placeholder="Contoh: 7123456789:AAHk1_example_token_abcdef"
                    className="w-full px-3 py-2 border-2 border-stone-700 rounded-lg text-xs font-mono bg-stone-50 focus:bg-white focus:outline-hidden focus:border-[#1B365D]"
                  />
                  <span className="text-[11px] text-stone-500 mt-0.5 block">
                    Didapat dari bot resmi @BotFather di Telegram saat membuat bot baru.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Chat ID Telegram Akun HP Anda
                  </label>
                  <input
                    type="text"
                    value={config.telegramChatId}
                    onChange={(e) => setConfig((prev) => ({ ...prev, telegramChatId: e.target.value }))}
                    placeholder="Contoh: 1234567890 (angka ID akun Telegram Anda)"
                    className="w-full px-3 py-2 border-2 border-stone-700 rounded-lg text-xs font-mono bg-stone-50 focus:bg-white focus:outline-hidden focus:border-[#1B365D]"
                  />
                  <span className="text-[11px] text-stone-500 mt-0.5 block">
                    Didapat dengan mengirim pesan ke @userinfobot di Telegram.
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowTelegramHelp(!showTelegramHelp)}
                    className="text-xs text-sky-700 hover:text-sky-900 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showTelegramHelp ? 'Sembunyikan Panduan' : 'Lihat Cara Buat Bot (1 Menit)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={isTestingTelegram}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isTestingTelegram ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{isTestingTelegram ? 'Mengirim...' : 'Tes Kirim ke Telegram HP'}</span>
                  </button>
                </div>

                {showTelegramHelp && (
                  <div className="p-3 bg-stone-100 border border-stone-300 rounded-lg text-xs space-y-2 text-stone-700">
                    <p className="font-bold text-stone-900">
                      Cara Membuat Notifikasi Telegram di HP Anda (Gratis & Cepat):
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                      <li>Buka aplikasi Telegram di HP Anda, cari <strong>@BotFather</strong>, ketik <code>/newbot</code>.</li>
                      <li>Beri nama bot (misal: <em>BarkasMajalengka_Bot</em>), lalu salin <strong>HTTP API Token</strong> yang diberikan.</li>
                      <li>Cari bot buatan Anda tadi di Telegram dan klik tombol <strong>START</strong>.</li>
                      <li>Cari <strong>@userinfobot</strong> di Telegram, kirim pesan apa saja, salin angka <strong>Id</strong> Anda.</li>
                      <li>Tempel Token dan Chat ID di atas, lalu klik <strong>Tes Kirim ke Telegram HP</strong>!</li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: WhatsApp Gateway ke HP Admin (Fonnte, Wablas, WhatsApp Cloud API, Other) */}
          <div className="bg-white border-2 border-stone-800 p-4 sm:p-5 rounded-xl space-y-4 shadow-[2px_2px_0px_#1C1917]">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-stone-900 uppercase">
                  3. Notifikasi Otomatis ke WhatsApp HP Admin
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                WhatsApp Gateway
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Kirim notifikasi otomatis langsung ke nomor WhatsApp Admin (<strong>{config.adminPhoneNumber || '085179550150'}</strong>) setiap kali ada penitip mengirim formulir baru. Pilih gateway yang Anda pakai:
            </p>

            <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-700" />
                <span>Aktifkan Kirim Pesan ke WhatsApp HP Admin</span>
              </span>
              <input
                type="checkbox"
                checked={config.whatsappEnabled}
                onChange={(e) => setConfig((prev) => ({ ...prev, whatsappEnabled: e.target.checked }))}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
            </div>

            {config.whatsappEnabled && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                {/* Provider Selector Tabs */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-2">
                    Pilih Layanan WhatsApp Gateway:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'fonnte', name: 'Fonnte', badge: 'Terbaik ⭐', desc: 'Scan QR di ID' },
                      { id: 'wablas', name: 'Wablas', badge: 'Populer', desc: 'Gateway ID' },
                      { id: 'meta_cloud', name: 'Cloud API', badge: 'Meta Resmi', desc: 'Facebook Graph' },
                      { id: 'custom_webhook', name: 'Other', badge: 'Make / n8n', desc: 'Custom Webhook' },
                    ].map((provider) => {
                      const isSelected = config.whatsappProvider === provider.id;
                      return (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() => setConfig((prev) => ({ ...prev, whatsappProvider: provider.id as WhatsAppProvider }))}
                          className={`p-2.5 rounded-lg border-2 text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#1B365D] bg-sky-50/70 shadow-[2px_2px_0px_#1B365D]'
                              : 'border-stone-300 bg-white hover:border-stone-500 hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-stone-900">{provider.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                              {provider.badge}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-500 block mt-0.5">{provider.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Option 1: Fonnte */}
                {config.whatsappProvider === 'fonnte' && (
                  <div className="p-3 bg-stone-50 border border-stone-300 rounded-lg space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800">
                        Konfigurasi Fonnte (https://fonnte.com)
                      </span>
                      <a
                        href="https://fonnte.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                      >
                        <span>Buka Fonnte</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        API Token Fonnte
                      </label>
                      <input
                        type="text"
                        value={config.fonnteToken}
                        onChange={(e) => setConfig((prev) => ({ ...prev, fonnteToken: e.target.value }))}
                        placeholder="Contoh: aBcDeFgHiJkLmNoP123456"
                        className="w-full px-3 py-2 border-2 border-stone-700 rounded-lg text-xs font-mono bg-white focus:outline-hidden focus:border-[#1B365D]"
                      />
                      <span className="text-[11px] text-stone-500 mt-1 block">
                        Dapatkan token gratis setelah mendaftar dan menghubungkan device WhatsApp Anda di dashboard Fonnte.
                      </span>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleTestWhatsApp}
                        disabled={isTestingWhatsApp}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isTestingWhatsApp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>{isTestingWhatsApp ? 'Mengirim...' : 'Tes Kirim WhatsApp via Fonnte'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Option 2: Wablas */}
                {config.whatsappProvider === 'wablas' && (
                  <div className="p-3 bg-stone-50 border border-stone-300 rounded-lg space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800">
                        Konfigurasi Wablas (https://wablas.com)
                      </span>
                      <a
                        href="https://wablas.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                      >
                        <span>Buka Wablas</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Domain Server Wablas
                      </label>
                      <input
                        type="text"
                        value={config.wablasServerUrl}
                        onChange={(e) => setConfig((prev) => ({ ...prev, wablasServerUrl: e.target.value }))}
                        placeholder="https://solo.wablas.com atau https://bdg.wablas.com"
                        className="w-full px-3 py-2 border-2 border-stone-700 rounded-lg text-xs font-mono bg-white focus:outline-hidden focus:border-[#1B365D]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        API Token Wablas
                      </label>
                      <input
                        type="text"
                        value={config.wablasToken}
                        onChange={(e) => setConfig((prev) => ({ ...prev, wablasToken: e.target.value }))}
                        placeholder="Token API dari akun Wablas"
                        className="w-full px-3 py-2 border-2 border-stone-700 rounded-lg text-xs font-mono bg-white focus:outline-hidden focus:border-[#1B365D]"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleTestWhatsApp}
                        disabled={isTestingWhatsApp}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isTestingWhatsApp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>{isTestingWhatsApp ? 'Mengirim...' : 'Tes Kirim WhatsApp via Wablas'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Option 3: WhatsApp Cloud API (Meta) */}
                {config.whatsappProvider === 'meta_cloud' && (
                  <div className="p-3 bg-stone-50 border border-stone-300 rounded-lg space-y-3 animate-in fade-in duration-150">
                    <span className="text-xs font-bold text-stone-800 block">
                      Konfigurasi WhatsApp Cloud API (Meta for Developers)
                    </span>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Phone Number ID
                      </label>
                      <input
                        type="text"
                        value={config.metaPhoneNumberId}
                        onChange={(e) => setConfig((prev) => ({ ...prev, metaPhoneNumberId: e.target.value }))}
                        placeholder="Contoh: 106543219876543"
                        className="w-full px-3 py-2 border-2 border-stone-700 rounded-lg text-xs font-mono bg-white focus:outline-hidden focus:border-[#1B365D]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        Meta Graph Access Token
                      </label>
                      <input
                        type="text"
                        value={config.metaAccessToken}
                        onChange={(e) => setConfig((prev) => ({ ...prev, metaAccessToken: e.target.value }))}
                        placeholder="EAA..."
                        className="w-full px-3 py-2 border-2 border-stone-700 rounded-lg text-xs font-mono bg-white focus:outline-hidden focus:border-[#1B365D]"
                      />
                      <span className="text-[11px] text-stone-500 mt-1 block">
                        Catatan: WhatsApp Cloud API membutuhkan akun Meta Business dan pendaftaran template jika di luar sesi 24 jam.
                      </span>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleTestWhatsApp}
                        disabled={isTestingWhatsApp}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isTestingWhatsApp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>{isTestingWhatsApp ? 'Mengirim...' : 'Tes Kirim via Cloud API'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Option 4: Other (Custom Webhook / Make / n8n / Zapier) */}
                {config.whatsappProvider === 'custom_webhook' && (
                  <div className="p-3 bg-stone-50 border border-stone-300 rounded-lg space-y-3 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                        URL Webhook Endpoint (Make.com / n8n / Zapier)
                      </label>
                      <input
                        type="url"
                        value={config.webhookUrl}
                        onChange={(e) => setConfig((prev) => ({ ...prev, webhookUrl: e.target.value, webhookEnabled: true }))}
                        placeholder="https://hook.eu2.make.com/xxxx atau webhook n8n"
                        className="w-full px-3 py-2 border-2 border-stone-700 rounded-lg text-xs font-mono bg-white focus:outline-hidden focus:border-[#1B365D]"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setShowWebhookHelp(!showWebhookHelp)}
                        className="text-xs text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{showWebhookHelp ? 'Tutup Prompt Webhook' : 'Lihat Prompt Make/n8n & JSON'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleTestWebhook}
                        disabled={isTestingWebhook}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isTestingWebhook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                        <span>{isTestingWebhook ? 'Menguji...' : 'Tes Kirim Webhook'}</span>
                      </button>
                    </div>

                    {showWebhookHelp && (
                      <div className="p-3 bg-stone-100 border border-stone-300 rounded-lg text-xs space-y-3 text-stone-700 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 uppercase text-[11px]">
                            1. Prompt Siap Pakai untuk Make.com / n8n:
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyPrompt}
                            className="px-2.5 py-1 bg-white border border-stone-400 hover:border-stone-800 rounded text-stone-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            {copiedPrompt ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-stone-600" />}
                            <span>{copiedPrompt ? 'Tersalin!' : 'Salin Prompt Webhook'}</span>
                          </button>
                        </div>

                        <pre className="p-2.5 bg-stone-900 text-amber-200 rounded font-mono text-[10px] overflow-x-auto max-h-36 whitespace-pre-wrap leading-relaxed">
                          {webhookAiPrompt}
                        </pre>

                        <div className="flex items-center justify-between pt-1 border-t border-stone-200">
                          <span className="font-bold text-stone-900 uppercase text-[11px]">
                            2. Format JSON Payload:
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyJson}
                            className="px-2.5 py-1 bg-white border border-stone-400 hover:border-stone-800 rounded text-stone-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            {copiedJson ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-stone-600" />}
                            <span>{copiedJson ? 'Tersalin!' : 'Salin JSON Payload'}</span>
                          </button>
                        </div>

                        <pre className="p-2.5 bg-stone-900 text-emerald-300 rounded font-mono text-[10px] overflow-x-auto max-h-32 whitespace-pre leading-relaxed">
                          {webhookSampleJson}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 4: Nomor Kontak Admin */}
          <div className="bg-white border-2 border-stone-800 p-4 rounded-xl space-y-2 shadow-[2px_2px_0px_#1C1917]">
            <label className="block text-xs font-bold text-stone-800 uppercase">
              Nomor WhatsApp Penerima Notifikasi Admin
            </label>
            <input
              type="text"
              value={config.adminPhoneNumber}
              onChange={(e) => setConfig((prev) => ({ ...prev, adminPhoneNumber: e.target.value }))}
              placeholder="085179550150"
              className="w-full px-3 py-2 border-2 border-stone-700 rounded-lg text-xs font-mono bg-stone-50 focus:bg-white focus:outline-hidden focus:border-[#1B365D]"
            />
            <p className="text-[11px] text-stone-500">
              Nomor WhatsApp resmi Admin Esteh yang akan menerima konfirmasi tiket dari penitip.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-900 text-white p-4 border-t-2 border-stone-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-[#1B365D] font-extrabold text-xs rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4 stroke-[3]" />
            )}
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Notifikasi'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
