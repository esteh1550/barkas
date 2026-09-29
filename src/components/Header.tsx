import React, { useEffect, useState } from 'react';
import {
  HelpCircle,
  MessageCircle,
  Palette,
  Tag,
  ShoppingBag,
  Search,
} from 'lucide-react';
import { ADMIN_CONTACT } from '../types/consignment';
import { PWAInstallButton } from './PWAInstallButton';

export type UIThemeId = 'forest' | 'terracotta' | 'obsidian' | 'navy';

const UI_THEMES: { id: UIThemeId; label: string; dot: string }[] = [
  { id: 'forest', label: 'Botanical Forest', dot: 'bg-[#0F291E] border-amber-400' },
  { id: 'terracotta', label: 'Terracotta Vintage', dot: 'bg-[#431407] border-orange-400' },
  { id: 'obsidian', label: 'Obsidian Dark', dot: 'bg-slate-950 border-amber-400' },
  { id: 'navy', label: 'Classic Navy', dot: 'bg-[#1B365D] border-sky-300' },
];

const THEME_STORAGE_KEY = 'barkas_ui_theme_v1';

interface HeaderProps {
  onOpenFAQ: () => void;
  activeTab?: 'form' | 'catalog' | 'wanted';
  onSelectTab?: (tab: 'form' | 'catalog' | 'wanted') => void;
  liveCount?: number;
  wantedCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenFAQ,
  activeTab,
  onSelectTab,
  liveCount = 0,
  wantedCount = 0,
}) => {
  const [activeTheme, setActiveTheme] = useState<UIThemeId>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as UIThemeId | null;
      if (saved && ['forest', 'terracotta', 'obsidian', 'navy'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'forest';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, activeTheme);
    } catch {
      // ignore
    }
  }, [activeTheme]);

  return (
    <header className="relative bg-[#1B365D] text-white shadow-xl overflow-hidden border-b-4 border-amber-400 transition-colors duration-300">
      {/* Subtle architectural grid texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>

      {/* Warm atmospheric glow */}
      <div className="absolute -top-28 -right-24 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-28 -left-24 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8 relative z-10">
        {/* Top utility & theme switcher bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-5 pb-3.5 border-b border-white/15 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 backdrop-blur-md border border-amber-400/35 text-amber-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold tracking-wide">Curated Consignment Hub • Majalengka</span>
            </div>

            {/* Interactive UI Theme Selector */}
            <div className="inline-flex items-center gap-1 bg-black/25 p-1 rounded-xl border border-white/15">
              <span className="px-1.5 text-[10px] text-amber-200/90 font-bold flex items-center gap-1">
                <Palette className="w-3 h-3 text-amber-300" />
                <span className="hidden md:inline">Tema:</span>
              </span>
              {UI_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTheme(t.id)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTheme === t.id
                      ? 'bg-amber-400 text-stone-950 shadow-xs'
                      : 'text-white/75 hover:text-white hover:bg-white/10'
                  }`}
                  title={`Ganti ke tema ${t.label}`}
                >
                  <span className={`w-2 h-2 rounded-full border ${t.dot}`} />
                  <span className="hidden sm:inline">{t.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <PWAInstallButton />

            <a
              href={`https://wa.me/${ADMIN_CONTACT.whatsappInternational}?text=${encodeURIComponent(
                'Halo Admin Esteh, saya ingin tanya seputar titip jual di info.barkasmajalengka.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-100 border border-emerald-400/40 transition-all text-xs font-bold"
              title="Hubungi Admin Esteh via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-300" />
              <span>Admin Esteh</span>
            </a>

            <button
              type="button"
              onClick={onOpenFAQ}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all text-xs font-bold cursor-pointer"
              title="Panduan & Aturan Titip Jual"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>Panduan SOP</span>
            </button>
          </div>
        </div>

        {/* Editorial Brand Identity & Hero Masthead */}
        <div className="text-center sm:text-left sm:flex sm:items-end sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 flex items-center justify-center text-stone-950 font-serif-accent font-black text-2xl shadow-lg border-2 border-amber-200">
                B
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-mono uppercase tracking-[0.22em] text-amber-300/90 font-bold">
                  EST. MAJALENGKA • PRELOVED ARCHIVE
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  info.barkasmajalengka
                </h1>
              </div>
            </div>

            <p className="text-amber-200 font-serif-accent italic text-base sm:text-lg pt-0.5">
              Ruang Kurasi & Titip Jual Barang Bekas Berkualitas
            </p>

            <p className="text-stone-200/90 text-xs sm:text-sm max-w-xl leading-relaxed">
              Solusi jual cepat & terkurasi untuk warga Kabupaten Majalengka. Daftarkan barang terbaik Anda atau jelajahi etalase stok siap pakai bersama <strong>Admin Esteh</strong>.
            </p>
          </div>

          {/* Editorial Key Metrics / Guarantees */}
          <div className="mt-4 sm:mt-0 flex sm:flex-col gap-2 justify-center sm:items-end shrink-0">
            <div className="inline-flex items-center px-3.5 py-2 rounded-xl bg-black/25 backdrop-blur-xs border border-amber-400/30 text-xs text-amber-100 font-semibold">
              <span>100% Harga Nett Utuh ke Penitip</span>
            </div>
            <div className="inline-flex items-center px-3.5 py-2 rounded-xl bg-black/25 backdrop-blur-xs border border-white/15 text-xs text-stone-200">
              <span>Rekber & COD Resmi Majalengka</span>
            </div>
          </div>
        </div>

        {/* Quick Mode Navigation Bar inside Masthead */}
        {onSelectTab && (
          <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectTab('form')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-amber-400 text-stone-950 shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Formulir Titip Jual</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('catalog')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-amber-400 text-stone-950 shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Etalase Barang Live ({liveCount})</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('wanted')}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'wanted'
                  ? 'bg-amber-400 text-stone-950 shadow-sm'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-amber-400/40'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-amber-300" />
              <span>Titip Cari Barang ({wantedCount})</span>
              <span className="px-1.5 py-0.2 rounded-md bg-amber-300 text-stone-950 text-[10px] font-black">
                WANTED
              </span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
