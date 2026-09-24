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
  RotateCcw 
} from 'lucide-react';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FAQModal: React.FC<FAQModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#1B365D] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#1B365D] flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Skema Sistem Operasional & Aturan Titip Jual</h3>
              <p className="text-xs text-amber-200/90">info.barkasmajalengka Consignment Guidelines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs sm:text-sm text-slate-700">
          {/* SECTION 1: PENENTUAN KOMISI (FEE STRUCTURE) */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-300 space-y-3">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-sm sm:text-base">
              <Banknote className="w-5 h-5 text-amber-600 shrink-0" />
              <span>1. Penentuan Komisi (Fee Structure)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kami menggunakan sistem <strong>Komisi Persentase dengan Minimum Fee</strong> yang adil dan transparan agar penitip maupun pengelola sama-sama diuntungkan:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {/* Tier 1 */}
              <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  Barang &lt; Rp 100.000
                </span>
                <span className="text-base font-black text-[#1B365D] block">
                  Flat Rp 10.000
                </span>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Minimum fee tetap per barang agar barang murah tetap terlayani.
                </p>
              </div>

              {/* Tier 2 */}
              <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  Rp 100rb – Rp 1.000.000
                </span>
                <span className="text-base font-black text-[#1B365D] block">
                  Komisi 10% – 15%
                </span>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Komisi standar (rata-rata 12%) untuk kurasi, foto & promosi media.
                </p>
              </div>

              {/* Tier 3 */}
              <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-1">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  Barang &gt; Rp 1.000.000
                </span>
                <span className="text-base font-black text-[#1B365D] block">
                  Komisi 8% – 10%
                </span>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Tarif diturunkan khusus agar sangat menarik untuk barang brand & bernilai tinggi.
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200/80 text-[11px] text-amber-900">
              💡 <strong>Catatan Penting:</strong> Penitip menentukan <strong>Harga Bersih (Nett)</strong>. Nominal bersih tersebut 100% utuh ditransfer ke rekening penitip setelah barang laku!
            </div>
          </div>

          {/* SECTION 2: BATAS WAKTU TITIP (TENOR) */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
            <div className="flex items-center gap-2 text-[#1B365D] font-bold text-sm sm:text-base">
              <Calendar className="w-5 h-5 text-[#1B365D] shrink-0" />
              <span>2. Batas Waktu Titip (Tenor & Evaluasi)</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#1B365D] font-bold flex items-center justify-center shrink-0 text-xs">
                  30
                </span>
                <div>
                  <strong className="text-slate-900">Masa Titip Maksimal: 30 Hari</strong>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Barang dipajang secara aktif di katalog feeds, story harian, dan jejaring komunitas Majalengka.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  20
                </span>
                <div>
                  <strong className="text-slate-900 flex items-center gap-1">
                    <span>Hari ke-20: Evaluasi & Opsi Price Drop</span>
                    <ArrowDownCircle className="w-3.5 h-3.5 text-amber-600" />
                  </strong>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Jika belum laku hingga hari ke-20, admin akan menghubungi penitip untuk menawarkan opsi turun harga (*price drop*) agar barang lebih cepat terjual.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  <RotateCcw className="w-3.5 h-3.5" />
                </span>
                <div>
                  <strong className="text-slate-900">Hari ke-30: Pengembalian atau Perpanjangan</strong>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Jika tetap tidak laku setelah 30 hari, barang dapat diambil kembali oleh pemilik atau masa titip diperpanjang dengan kesepakatan diskon khusus.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: KETENTUAN BARANG YANG DITERIMA */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm sm:text-base">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>3. Ketentuan Barang yang Diterima</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Wajib Bersih & Higienis:</strong> Pakaian, sepatu, helm, maupun apparel wajib sudah dicuci / dibersihkan wangi sebelum diserahkan.
                </span>
              </div>

              <div className="flex items-start gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Hanya Menerima Barang Original (Asli):</strong> Khusus sneakers, brand fashion, jam tangan, helm bermerek, atau elektronik, wajib original 100%. Kami menolak barang tiruan/KW.
                </span>
              </div>

              <div className="flex items-start gap-2 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Bebas Kerusakan Parah:</strong> Tidak menerima barang dengan noda membandel yang tidak bisa hilang, sobek besar, atau kerusakan pada fungsi utama elektronik/gadget.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-[#1B365D] hover:bg-[#24477A] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Saya Memahami Ketentuan
          </button>
        </div>
      </div>
    </div>
  );
};
