import React, { useState, useEffect } from 'react';
import {
  X,
  Instagram,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Send,
} from 'lucide-react';
import {
  InstagramAutoPostConfig,
  getInstagramAutoPostConfig,
  saveInstagramAutoPostConfig,
} from '../services/instagramAutomation';

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

  useEffect(() => {
    if (isOpen) {
      setConfig(getInstagramAutoPostConfig());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveInstagramAutoPostConfig(config);
    if (onSaved) {
      onSaved('✅ Pengaturan Auto-Upload Instagram Feed & Story berhasil disimpan!');
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
      const res = await fetch(config.webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'instagram_test_ping',
          source: 'info.barkasmajalengka',
          timestamp: new Date().toISOString(),
          sampleCaption: 'Tes koneksi Auto-Post IG Feed & Story dari info.barkasmajalengka',
        }),
      });
      if (res.ok) {
        setTestResult('✅ Koneksi berhasil! Webhook menerima data uji dari info.barkasmajalengka.');
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
