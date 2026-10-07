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

export type UIThemeId = 'editorial' | 'forest' | 'terracotta' | 'obsidian' | 'navy';

const UI_THEMES: { id: UIThemeId; label: string; dot: string }[] = [
  { id: 'editorial', label: 'Warm Editorial', dot: 'bg-[#27211E] border-[#C25E34]' },
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
      if (saved && ['editorial', 'forest', 'terracotta', 'obsidian', 'navy'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'editorial';
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
    <header className="relative bg-[#F4EFE6] text-stone-900 border-b-2 border-stone-900 transition-colors duration-300">
      {/* Top Gazette Dateline Header */}
      <div className="border-b border-stone-400/80 bg-[#ECE5D8] px-4 py-1.5 text-[11px] font-mono tracking-wider text-stone-700">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-bold uppercase tracking-widest text-stone-900">
              KAB. MAJALENGKA, JAWA BARAT
            </span>
            <span className="hidden sm:inline text-stone-400">|</span>
            <span className="hidden sm:inline">WARTA TITIP JUAL & ARSIP PRELOVED RESMI</span>
            <span className="hidden md:inline text-stone-400">|</span>
            <span className="hidden md:inline">EDISI 2026</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Theme switcher */}
            <div className="inline-flex items-center gap-1 bg-[#E4DDD0] px-2 py-0.5 border border-stone-600">
              <span className="text-[10px] text-stone-800 font-bold flex items-center gap-1">
                <Palette className="w-3 h-3 text-stone-800" />
                <span className="hidden lg:inline">Tema:</span>
              </span>
              {UI_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTheme(t.id)}
                  className={`px-1.5 py-0.5 border text-[10px] font-bold font-mono transition-all cursor-pointer ${
                    activeTheme === t.id
                      ? 'bg-stone-900 text-stone-50 border-stone-900 shadow-[1px_1px_0px_#1C1917]'
                      : 'border-transparent text-stone-700 hover:text-stone-950 hover:bg-stone-300 hover:border-stone-400'
                  }`}
                  title={`Ganti ke tema ${t.label}`}
                >
                  {t.label.split(' ')[0]}
                </button>
              ))}
            </div>

            <PWAInstallButton />

            <a
              href={`https://wa.me/${ADMIN_CONTACT.whatsappInternational}?text=${encodeURIComponent(
                'Halo Admin Esteh, saya ingin tanya seputar titip jual di info.barkasmajalengka.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-stone-900 hover:bg-stone-800 text-amber-200 text-[11px] font-bold transition-colors cursor-pointer"
              title="Hubungi Admin Esteh via WhatsApp"
            >
              <MessageCircle className="w-3 h-3 text-amber-300" />
              <span>Admin Esteh</span>
            </a>

            <button
              type="button"
              onClick={onOpenFAQ}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-200 hover:bg-stone-300 text-stone-900 border border-stone-400 text-[11px] font-bold cursor-pointer"
              title="Panduan & Aturan Titip Jual"
            >
              <HelpCircle className="w-3 h-3 text-stone-700" />
              <span className="hidden sm:inline">SOP Titip</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Editorial Broadside Masthead */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-4 sm:pt-8 sm:pb-6">
        <div className="border-b-4 border-double border-stone-900 pb-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            {/* Left Editorial Stamp */}
            <div className="hidden lg:flex flex-col justify-center items-center w-32 p-2 border-2 border-stone-800 bg-[#ECE5D8] text-center shrink-0">
              <span className="text-[9px] font-mono font-bold tracking-widest text-stone-600 block uppercase">
                KONSINYASI RESMI
              </span>
              <span className="text-xl font-serif-editorial font-bold text-stone-900 block my-0.5">
                100% NETT
              </span>
              <span className="text-[8.5px] text-stone-600 uppercase tracking-tight block">
                DANA UTUH KE PENITIP
              </span>
            </div>

            {/* Center Gazette Title */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-[#C25E34]">
                  ★ JURNAL KURASI BARANG PRELOVED PILIHAN ★
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif-editorial font-extrabold tracking-tight text-stone-950 uppercase leading-none">
                INFO BARKAS MAJALENGKA
              </h1>
              <p className="text-stone-700 font-serif-editorial italic text-sm sm:text-base pt-1 max-w-2xl">
                "Warta Penghubung Titip Jual & Etalase Barang Seken Berkualitas Warga Kabupaten Majalengka — Terverifikasi, Transparan, Bebas Tipu-Tipu"
              </p>
            </div>

            {/* Right Editorial Stamp */}
            <div className="hidden lg:flex flex-col justify-center items-center w-36 p-2 border-2 border-stone-800 bg-[#ECE5D8] text-center shrink-0">
              <span className="text-[9px] font-mono font-bold tracking-widest text-stone-600 block uppercase">
                TITIK TEMU COD
              </span>
              <span className="text-xs font-serif-editorial font-bold text-stone-900 block my-0.5">
                ALUN-ALUN & GGM
              </span>
              <span className="text-[8.5px] text-stone-600 uppercase tracking-tight block">
                26 KECAMATAN TERJANGKAU
              </span>
            </div>
          </div>
        </div>

        {/* Newspaper Section Navigation Bar */}
        {onSelectTab && (
          <nav className="mt-3 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => onSelectTab('catalog')}
              className={`p-2.5 text-center transition-all flex items-center justify-center gap-2 border-2 cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-stone-900 text-stone-50 border-stone-900 shadow-[3px_3px_0px_#C25E34]'
                  : 'bg-white text-stone-800 border-stone-400 hover:border-stone-800 hover:bg-[#FAF7F2]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
              <span>LEMBAR I: ETALASE LIVE ({liveCount})</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('form')}
              className={`p-2.5 text-center transition-all flex items-center justify-center gap-2 border-2 cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-stone-900 text-stone-50 border-stone-900 shadow-[3px_3px_0px_#C25E34]'
                  : 'bg-white text-stone-800 border-stone-400 hover:border-stone-800 hover:bg-[#FAF7F2]'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span>LEMBAR II: FORMULIR TITIP JUAL</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('wanted')}
              className={`p-2.5 text-center transition-all flex items-center justify-center gap-2 border-2 cursor-pointer ${
                activeTab === 'wanted'
                  ? 'bg-stone-900 text-stone-50 border-stone-900 shadow-[3px_3px_0px_#C25E34]'
                  : 'bg-white text-stone-800 border-stone-400 hover:border-stone-800 hover:bg-[#FAF7F2]'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-amber-500" />
              <span>LEMBAR III: WARTA CARI BARANG ({wantedCount})</span>
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};
