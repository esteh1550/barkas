import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-xs shadow-xs transition-all cursor-pointer"
        title="Install Aplikasi info.barkasmajalengka ke Layar Utama HP"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install Aplikasi</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-amber-200 border border-white/20 text-xs font-bold transition-all cursor-pointer"
        title="Pasang Aplikasi ke Layar Utama HP"
      >
        <Smartphone className="w-3.5 h-3.5 text-amber-300" />
        <span className="hidden sm:inline">{isIOS ? 'Install di iOS' : 'Aplikasi HP'}</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-slate-900 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-900 text-amber-300 flex items-center justify-center font-black">
                  B
                </div>
                <h3 className="text-sm font-extrabold text-stone-900">
                  Pasang Aplikasi ke Layar HP
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="text-xs text-stone-600 space-y-2 leading-relaxed">
                <p>Untuk memasang <strong>info.barkasmajalengka</strong> di iPhone / iPad:</p>
                <ol className="list-decimal pl-4 space-y-1.5 font-medium text-stone-800">
                  <li>Ketuk tombol <strong>Bagikan (Share)</strong> di bilah bawah Safari.</li>
                  <li>Gulir ke bawah lalu pilih <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.</li>
                  <li>Ketuk <strong>Tambah</strong> di pojok kanan atas.</li>
                </ol>
              </div>
            ) : (
              <div className="text-xs text-stone-600 space-y-2 leading-relaxed">
                <p>Untuk memasang aplikasi <strong>info.barkasmajalengka</strong> di HP Android / Chrome:</p>
                <ol className="list-decimal pl-4 space-y-1.5 font-medium text-stone-800">
                  <li>Ketuk ikon menu <strong>⋮ (Tiga Titik)</strong> di pojok kanan atas browser Chrome.</li>
                  <li>Pilih <strong>Tambahkan ke Layar Utama (Install App)</strong>.</li>
                </ol>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full rounded-xl bg-emerald-950 py-2.5 text-xs font-extrabold text-amber-300 hover:bg-emerald-900 cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
