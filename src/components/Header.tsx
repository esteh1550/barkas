import React from 'react';
import { Sparkles, HelpCircle, ShieldCheck, CheckCircle2, MessageCircle } from 'lucide-react';
import { ADMIN_CONTACT } from '../types/consignment';

interface HeaderProps {
  onOpenFAQ: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenFAQ }) => {
  return (
    <header className="relative bg-[#1B365D] text-white shadow-xl overflow-hidden border-b-4 border-amber-400">
      {/* Background elegant pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
      
      {/* Ambient gradient glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8 relative z-10">
        {/* Top utility row */}
        <div className="flex items-center justify-between gap-2 mb-4 text-xs sm:text-sm">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold tracking-wide">Penerimaan Titip Jual Dibuka</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${ADMIN_CONTACT.whatsappInternational}?text=${encodeURIComponent('Halo Admin Esteh, saya ingin tanya seputar titip jual di info.barkasmajalengka.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-200 border border-emerald-400/40 transition-all text-xs font-semibold"
              title="Hubungi Admin Esteh via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-300" />
              <span>WA Admin Esteh ({ADMIN_CONTACT.whatsappFormatted})</span>
            </a>

            <button
              onClick={onOpenFAQ}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/95 border border-white/20 transition-all text-xs font-semibold cursor-pointer"
              title="Panduan & Aturan Titip Jual"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>Panduan Titip Jual</span>
            </button>
          </div>
        </div>

        {/* Main Logo & Title */}
        <div className="text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center text-[#1B365D] font-black text-xl shadow-lg border border-amber-300">
                B
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>info.barkasmajalengka</span>
              </h1>
            </div>

            <p className="text-amber-200/90 font-medium text-sm sm:text-base flex items-center justify-center sm:justify-start gap-1.5 mt-1">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Formulir Titip Jual Barang Bekas Berkualitas</span>
            </p>

            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-xl leading-relaxed">
              Jual cepat & aman barang bekas layak pakai warga Majalengka. Cukup isi data, admin kurasi, dan dapatkan harga nett tanpa ribet meladeni pembeli!
            </p>
          </div>

          {/* Trust badges for mobile / desktop */}
          <div className="mt-4 sm:mt-0 flex sm:flex-col gap-2 justify-center sm:items-end">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15 text-xs text-slate-200">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>100% Harga Nett Milik Penitip</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15 text-xs text-slate-200">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Kurasi Cepat 1x24 Jam</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
