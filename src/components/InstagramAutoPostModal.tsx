import React, { useState, useEffect } from 'react';
import {
  X,
  Instagram,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Send,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  InstagramAutoPostConfig,
  getInstagramAutoPostConfig,
  saveInstagramAutoPostConfig,
  syncInstagramAutoPostConfigWithCloud,
} from '../services/instagramAutomation';

const MAKE_COM_AI_PROMPT = `Create a Make.com scenario for automatic Instagram Business publishing triggered by a Custom Webhook.

1. Trigger Module: "Webhooks -> Custom webhook"
   It receives a POST JSON payload from our consignment web app (info.barkasmajalengka) with these fields:
   - event (string: "instagram_auto_publish")
   - ticketId (string, e.g. "#MJL-1024")
   - itemNameAndBrand (string)
   - category (string)
   - listingPriceFormatted (string)
   - feedCaption (string, ready-to-post Instagram Feed caption with hashtags)
   - storyCaption (string, ready-to-post Instagram Story caption)
   - catalogUrl (string, direct link to item catalog)
   - coverPhotoCleanBase64 (string, raw base64 JPEG image without data URI prefix)
   - storyPosterCleanBase64 (string, raw base64 9:16 JPEG image without data URI prefix)

2. Filter after Webhook:
   Only continue if \`event\` equals "instagram_auto_publish".

3. Image Hosting Step (HTTP / Cloudinary / Imgur):
   Convert \`coverPhotoCleanBase64\` and \`storyPosterCleanBase64\` into public image URLs (since Meta Instagram Graph API requires a public URL for Photo URL), OR upload \`toBinary(coverPhotoCleanBase64; "base64")\` to an image host and return \`feed_image_url\` and \`story_image_url\`.

4. Module: "Instagram for Business -> Create a Photo Post"
   - Photo URL: map the public URL from step 3 (\`feed_image_url\`)
   - Caption: map \`feedCaption\` from the Webhook

5. Module: "Instagram for Business -> Create a Story"
   - Media Type: Photo
   - Photo URL: map the public URL from step 3 (\`story_image_url\`)`;

interface InstagramAutoPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (msg: string) => void;
}

export const InstagramAutoPostModal: React.FC<InstagramAutoPostModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [config, setConfig] = useState<InstagramAutoPostConfig>(() =>
    getInstagramAutoPostConfig()
  );
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(getInstagramAutoPostConfig());
      setTestResult(null);
      setCopiedPrompt(false);
      syncInstagramAutoPostConfigWithCloud().then((cloudCfg) => {
        setConfig(cloudCfg);
      });
    }
  }, [isOpen]);

  const handleCopyMakePrompt = async () => {
    try {
      await navigator.clipboard.writeText(MAKE_COM_AI_PROMPT);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 3000);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveInstagramAutoPostConfig(config);
    if (onSaved) {
      onSaved(
        '✅ Pengaturan Auto-Upload IG berhasil disimpan ke Cloud (otomatis aktif di semua HP/Laptop)!'
      );
    }
    onClose();
  };

  const handleTestWebhook = async () => {
    if (!config.webhookUrl.trim()) {
      setTestResult('⚠️ Masukkan URL Webhook Make.com / Zapier terlebih dahulu untuk tes koneksi.');
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      // Create a crisp watermarked sample Feed & Story image on canvas so Cloudinary & IG test have watermark
      const createSampleWatermarkedBase64 = (w: number, h: number, isStory: boolean) => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0F291E');
        grad.addColorStop(1, '#1B365D');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#FBBF24';
        ctx.textAlign = 'center';
        ctx.font = 'bold 36px system-ui, sans-serif';
        ctx.fillText('ETALASE RESMI BARANG TITIPAN', w / 2, h / 2 - 60);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 54px system-ui, sans-serif';
        ctx.fillText('@info.barkasmajalengka', w / 2, h / 2 + 10);

        ctx.fillStyle = '#FDE68A';
        ctx.font = 'bold 32px monospace';
        ctx.fillText(
          isStory ? 'STORY 9:16 • #BM-2026-TEST' : 'FEED WATERMARK • #BM-2026-TEST',
          w / 2,
          h / 2 + 75
        );

        // Bottom watermark bar
        const barH = 90;
        ctx.fillStyle = 'rgba(15, 41, 30, 0.95)';
        ctx.fillRect(0, h - barH, w, barH);
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(0, h - 8, w, 8);

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.font = 'bold 28px system-ui, sans-serif';
        ctx.fillText('@info.barkasmajalengka  •  COD Majalengka', 40, h - 42);

        ctx.fillStyle = '#FBBF24';
        ctx.textAlign = 'right';
        ctx.font = 'bold 26px monospace';
        ctx.fillText('#BM-2026-TEST', w - 40, h - 42);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        return dataUrl.split(';base64,')[1] || '';
      };

      const sampleFeedClean = createSampleWatermarkedBase64(1080, 1080, false);
      const sampleStoryClean = createSampleWatermarkedBase64(1080, 1920, true);

      const res = await fetch(config.webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'instagram_auto_publish',
          triggerSource: 'test_button',
          source: 'info.barkasmajalengka',
          timestamp: new Date().toISOString(),
          ticketId: '#BM-2026-TEST',
          itemNameAndBrand: 'Tes Koneksi Watermark Otomatis @info.barkasmajalengka',
          category: 'Fashion & Pakaian',
          listingPriceFormatted: 'Rp 175.000',
          feedCaption:
            '✨ TES AUTO-POST WATERMARK @info.barkasmajalengka ✨\n\nFoto ini sudah dilengkapi Watermark Resmi + Harga + Kode Tiket otomatis dari sistem.\n\n#barkasmajalengka #infobarkasmajalengka #prelovedmajalengka',
          storyCaption: '🔥 TES STORY @info.barkasmajalengka — #BM-2026-TEST',
          catalogUrl: window.location.origin,
          coverPhotoCleanBase64: sampleFeedClean,
          storyPosterCleanBase64: sampleStoryClean,
        }),
      });
      if (res.ok) {
        setTestResult(
          '✅ Koneksi & Watermark berhasil dikirim! Cek Make.com / Instagram Anda.'
        );
      } else {
        setTestResult(`⚠️ Server Webhook merespons dengan status HTTP ${res.status}.`);
      }
    } catch (err: any) {
      setTestResult(`⚠️ Gagal mengirim ke Webhook: ${err?.message || 'Periksa URL Anda'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#1B365D] text-white px-5 py-4 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold">
                Otomatisasi Upload Instagram Feed & Story
              </h3>
              <p className="text-[11px] text-amber-200">
                Hubungkan ke Make.com / Zapier atau Meta Graph API untuk Auto-Post
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5 text-xs">
          {/* Explanation Banner */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1.5">
            <div className="font-extrabold flex items-center gap-1.5 text-xs sm:text-sm">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <span>2 Cara Upload ke Instagram Feed & Story:</span>
            </div>
            <p className="leading-relaxed text-slate-700">
              1. <strong>Tanpa API (1-Klik Share di HP):</strong> Pada setiap kartu barang di <code>/admin</code>, tekan tombol <strong>"Share ke IG Feed / Story"</strong>. Caption otomatis tersalin dan aplikasi Instagram di HP langsung terbuka dengan foto siap tayang.<br />
              2. <strong>Full Otomatis di Latar Belakang (Webhook Make.com / Meta API):</strong> Isi URL Webhook di bawah ini agar setiap ada barang masuk atau saat status diubah ke <strong>Posted (Live)</strong>, foto + caption Feed + Story otomatis ter-upload ke akun Instagram Bisnis <code>@info.barkasmajalengka</code>.
            </p>
          </div>

          {/* Trigger Toggles */}
          <div className="space-y-2.5">
            <label className="block font-extrabold text-slate-800 uppercase tracking-wider">
              Kapan Auto-Upload Dijalankan?
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/80">
              <input
                type="checkbox"
                checked={config.enabledOnAdminLive}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, enabledOnAdminLive: e.target.checked }))
                }
                className="mt-0.5 w-4 h-4 rounded text-[#1B365D]"
              />
              <div>
                <span className="font-extrabold text-slate-900 block">
                  Saat Admin Mengubah Status ke "Posted (Live)" (Direkomendasikan ✓)
                </span>
                <span className="text-slate-500 text-[11px]">
                  Aman dari spam! Barang baru otomatis di-upload ke Feed & Story IG segera setelah Admin Esteh menyetujui hasil kurasi (QC).
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/80">
              <input
                type="checkbox"
                checked={config.enabledOnNewSubmission}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, enabledOnNewSubmission: e.target.checked }))
                }
                className="mt-0.5 w-4 h-4 rounded text-[#1B365D]"
              />
              <div>
                <span className="font-extrabold text-slate-900 block">
                  Langsung Saat Penitip Mengirim Formulir Titip Jual Baru
                </span>
                <span className="text-slate-500 text-[11px]">
                  Begitu warga menekan tombol Kirim di formulir publik, data foto & caption langsung dikirim ke antrean Auto-Post Instagram Anda.
                </span>
              </div>
            </label>
          </div>

          {/* Webhook URL Input (Make.com / Zapier / n8n) */}
          <div className="space-y-1.5">
            <label className="block font-extrabold text-slate-800 uppercase tracking-wider">
              Opsi A: Webhook URL (Make.com / Zapier / n8n → Instagram for Business)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={config.webhookUrl}
                onChange={(e) => setConfig((prev) => ({ ...prev, webhookUrl: e.target.value }))}
                placeholder="https://hook.eu1.make.com/xxxxxxxxxxxxxxx"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-[#1B365D] focus:outline-hidden font-mono text-xs"
              />
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={isTesting}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold cursor-pointer shrink-0 disabled:opacity-60 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span>{isTesting ? 'Menguji...' : 'Tes Webhook'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Buat skenario gratis di <strong>Make.com</strong>: pilih modul <em>Custom Webhook</em> → hubungkan ke modul <em>Instagram for Business (Create a Photo Post & Create a Story)</em>.
            </p>
            {testResult && (
              <p className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 font-semibold text-slate-800">
                {testResult}
              </p>
            )}

            {/* Make.com AI Assistant Prompt Box */}
            <div className="mt-3 p-3.5 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-extrabold text-amber-400 text-xs">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>Prompt AI Assistant Make.com (Siap Copy-Paste)</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyMakePrompt}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-900" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin Prompt Make.com</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-[10px] leading-relaxed font-mono text-slate-300 bg-slate-950/80 p-2.5 rounded-xl overflow-x-auto max-h-36 whitespace-pre-wrap">
                {MAKE_COM_AI_PROMPT}
              </pre>
            </div>
          </div>

          {/* Direct Meta Graph API Optional Inputs */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center gap-1.5 font-extrabold text-slate-700">
              <ShieldCheck className="w-4 h-4 text-[#1B365D]" />
              <span>Opsi B: Meta Instagram Graph API Langsung (Opsional)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Instagram Business Account ID
                </label>
                <input
                  type="text"
                  value={config.igBusinessAccountId}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, igBusinessAccountId: e.target.value }))
                  }
                  placeholder="Contoh: 17841405822304914"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Meta Graph API Access Token
                </label>
                <input
                  type="password"
                  value={config.metaAccessToken}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, metaAccessToken: e.target.value }))
                  }
                  placeholder="EAAGm0PX4ZCpsBA..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#1B365D] hover:bg-[#24477A] text-white font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Simpan Pengaturan Auto-Post IG</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
