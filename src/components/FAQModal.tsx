import React from 'react';
import { 
  X, 
  HelpCircle, 
  ShieldCheck, 
  Banknote, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowDownCircle, 
  RotateCcw,
  MessageCircle
} from 'lucide-react';
import { ADMIN_CONTACT } from '../types/consignment';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FAQModal: React.FC<FAQModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FAF7F2] border-4 border-double border-stone-900 max-w-2xl w-full shadow-[8px_8px_0px_#1C1917] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-stone-900 text-stone-50 p-5 flex items-center justify-between border-b-2 border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 border-2 border-amber-400 bg-stone-950 text-amber-300 flex items-center justify-center font-bold shadow-[2px_2px_0px_#C25E34]">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-amber-300 uppercase tracking-widest block font-bold">
                PEDOMAN & KETENTUAN RESMI
              </span>
              <h3 className="font-serif-editorial font-bold text-base sm:text-lg uppercase">
                Skema Sistem Operasional & Aturan Titip Jual
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 border border-stone-700 text-stone-400 hover:text-white bg-stone-800 hover:bg-stone-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs sm:text-sm text-stone-800">
          {/* SECTION 1: PENENTUAN KOMISI (FEE STRUCTURE) */}
          <div className="p-4 bg-[#ECE5D8] border-2 border-stone-800 space-y-3 shadow-[2px_2px_0px_#1C1917]">
            <div className="flex items-center gap-2 text-stone-950 font-bold text-sm sm:text-base font-serif-editorial">
              <Banknote className="w-5 h-5 text-[#C25E34] shrink-0" />
              <span>PASAL 01. Penentuan Komisi (Fee Structure)</span>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed font-serif-editorial">
              Kami menggunakan sistem <strong>Komisi Persentase dengan Minimum Fee</strong> yang adil dan transparan agar penitip maupun pengelola sama-sama diuntungkan:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {/* Tier 1 */}
              <div className="bg-white p-3 border border-stone-800 shadow-[2px_2px_0px_rgba(0,0,0,0.06)] space-y-1">
                <span className="text-[10px] font-mono font-bold text-stone-600 uppercase tracking-wider block">
                  Barang &lt; Rp 100.000
                </span>
                <span className="text-base font-mono font-black text-stone-950 block">
                  Flat Rp 10.000
                </span>
                <p className="text-[11px] text-stone-600 leading-normal font-serif-editorial">
                  Minimum fee tetap per barang agar barang murah tetap terlayani.
                </p>
              </div>

              {/* Tier 2 */}
              <div className="bg-white p-3 border border-stone-800 shadow-[2px_2px_0px_rgba(0,0,0,0.06)] space-y-1">
                <span className="text-[10px] font-mono font-bold text-stone-600 uppercase tracking-wider block">
                  Rp 100rb – Rp 1.000.000
                </span>
                <span className="text-base font-mono font-black text-[#C25E34] block">
                  Komisi 10% – 15%
                </span>
                <p className="text-[11px] text-stone-600 leading-normal font-serif-editorial">
                  Komisi standar (rata-rata 12%) untuk kurasi, foto & promosi media.
                </p>
              </div>

              {/* Tier 3 */}
              <div className="bg-white p-3 border border-stone-800 shadow-[2px_2px_0px_rgba(0,0,0,0.06)] space-y-1">
                <span className="text-[10px] font-mono font-bold text-stone-600 uppercase tracking-wider block">
                  Barang &gt; Rp 1.000.000
                </span>
                <span className="text-base font-mono font-black text-emerald-800 block">
                  Komisi 8% – 10%
                </span>
                <p className="text-[11px] text-stone-600 leading-normal font-serif-editorial">
                  Tarif diturunkan khusus agar sangat menarik untuk barang brand & bernilai tinggi.
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-white border border-stone-700 text-[11px] text-stone-800 font-mono">
              💡 <strong>Catatan Penting:</strong> Penitip menentukan <strong>Harga Bersih (Nett)</strong>. Nominal bersih tersebut 100% utuh ditransfer ke rekening penitip setelah barang laku! Estimasi harga tayang di etalase dibulatkan ke <strong>kelipatan Rp 5.000 terdekat</strong> agar rapi dan memudahkan transaksi.
            </div>
          </div>

          {/* SECTION 2: BATAS WAKTU TITIP (TENOR) */}
          <div className="p-4 bg-[#ECE5D8] border-2 border-stone-800 space-y-3 shadow-[2px_2px_0px_#1C1917]">
            <div className="flex items-center gap-2 text-stone-950 font-bold text-sm sm:text-base font-serif-editorial">
              <Calendar className="w-5 h-5 text-amber-700 shrink-0" />
              <span>PASAL 02. Batas Waktu Titip (Tenor & Evaluasi)</span>
            </div>

            <div className="space-y-2.5 text-xs text-stone-800">
              <div className="flex items-start gap-2.5 bg-white p-3 border border-stone-800 shadow-[2px_2px_0px_rgba(0,0,0,0.06)]">
                <span className="w-6 h-6 border border-stone-800 bg-stone-900 text-amber-300 font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                  30
                </span>
                <div>
                  <strong className="text-stone-950 font-mono">Masa Titip Maksimal: 30 Hari</strong>
                  <p className="text-stone-600 text-[11px] mt-0.5 font-serif-editorial">
                    Barang dipajang secara aktif di katalog feeds, story harian, dan jejaring komunitas Majalengka.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-white p-3 border border-stone-800 shadow-[2px_2px_0px_rgba(0,0,0,0.06)]">
                <span className="w-6 h-6 border border-stone-800 bg-amber-300 text-stone-950 font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                  20
                </span>
                <div>
                  <strong className="text-stone-950 flex items-center gap-1 font-mono">
                    <span>Hari ke-20: Evaluasi & Opsi Price Drop</span>
                    <ArrowDownCircle className="w-3.5 h-3.5 text-amber-700" />
                  </strong>
                  <p className="text-stone-600 text-[11px] mt-0.5 font-serif-editorial">
                    Jika belum laku hingga hari ke-20, admin akan menghubungi penitip untuk menawarkan opsi turun harga (<em>price drop</em>) agar barang lebih cepat terjual.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-white p-3 border border-stone-800 shadow-[2px_2px_0px_rgba(0,0,0,0.06)]">
                <span className="w-6 h-6 border border-stone-800 bg-stone-200 text-stone-900 font-mono font-bold flex items-center justify-center shrink-0 text-xs">
                  <RotateCcw className="w-3.5 h-3.5" />
                </span>
                <div>
                  <strong className="text-stone-950 font-mono">Hari ke-30: Pengembalian atau Perpanjangan</strong>
                  <p className="text-stone-600 text-[11px] mt-0.5 font-serif-editorial">
                    Jika tetap tidak laku setelah 30 hari, barang dapat diambil kembali oleh pemilik atau masa titip diperpanjang dengan kesepakatan diskon khusus.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: KETENTUAN BARANG YANG DITERIMA */}
          <div className="p-4 bg-[#ECE5D8] border-2 border-stone-800 space-y-3 shadow-[2px_2px_0px_#1C1917]">
            <div className="flex items-center gap-2 text-stone-950 font-bold text-sm sm:text-base font-serif-editorial">
              <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0" />
              <span>PASAL 03. Ketentuan Barang yang Diterima</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-stone-800 bg-white p-2.5 border border-stone-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span className="font-serif-editorial">
                  <strong>Wajib Bersih & Higienis:</strong> Pakaian, sepatu, helm, maupun apparel wajib sudah dicuci / dibersihkan wangi sebelum diserahkan.
                </span>
              </div>

              <div className="flex items-start gap-2 text-stone-800 bg-white p-2.5 border border-stone-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span className="font-serif-editorial">
                  <strong>Hanya Menerima Barang Original (Asli):</strong> Khusus sneakers, brand fashion, jam tangan, helm bermerek, atau elektronik, wajib original 100%. Kami menolak barang tiruan/KW.
                </span>
              </div>

              <div className="flex items-start gap-2 text-stone-800 bg-white p-2.5 border border-stone-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span className="font-serif-editorial">
                  <strong>Bebas Kerusakan Parah:</strong> Tidak menerima barang dengan noda membandel yang tidak bisa hilang, sobek besar, atau kerusakan pada fungsi utama elektronik/gadget.
                </span>
              </div>
            </div>
          </div>

          {/* CONTACT ADMIN ESTEH */}
          <div className="p-4 bg-white border-2 border-stone-800 shadow-[3px_3px_0px_#1C1917] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold font-mono uppercase text-stone-900 block">
                Punya Pertanyaan Langsung ke Pengelola?
              </span>
              <p className="text-[11px] text-stone-600 mt-0.5 font-serif-editorial italic">
                Konsultasikan barang Anda langsung ke <strong>{ADMIN_CONTACT.name}</strong> di nomor resmi <strong>{ADMIN_CONTACT.whatsappFormatted}</strong>.
              </p>
            </div>
            <a
              href={`https://wa.me/${ADMIN_CONTACT.whatsappInternational}?text=${encodeURIComponent(`Halo ${ADMIN_CONTACT.name} (*info.barkasmajalengka*), saya ingin konsultasi mengenai ketentuan titip jual barang saya.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-stone-50 font-mono font-bold text-xs border border-emerald-950 shadow-[2px_2px_0px_#064e3b] transition-all shrink-0 uppercase"
            >
              <MessageCircle className="w-4 h-4 text-amber-300" />
              <span>Chat {ADMIN_CONTACT.name}</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#ECE5D8] border-t-2 border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-200 text-xs font-mono font-bold border-2 border-stone-900 shadow-[2px_2px_0px_#C25E34] transition-colors cursor-pointer uppercase"
          >
            SAYA MEMAHAMI KETENTUAN
          </button>
        </div>
      </div>
    </div>
  );
};
