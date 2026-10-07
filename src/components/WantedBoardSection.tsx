import React, { useState } from 'react';
import {
  Search,
  Plus,
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  X,
} from 'lucide-react';
import {
  WantedRequest,
  ItemCategory,
  KECAMATAN_MAJALENGKA,
  CATEGORIES,
  ADMIN_CONTACT,
} from '../types/consignment';
import { formatRupiah, parseRupiahInput, normalizeWhatsAppNumber } from '../utils/formatters';

interface WantedBoardSectionProps {
  requests: WantedRequest[];
  adminWhatsAppNumber?: string;
  onAddRequest: (newReq: WantedRequest) => Promise<void>;
  onFulfillViaForm: (prefill: {
    category: ItemCategory;
    itemNameAndBrand: string;
    suggestedNettPrice: number;
  }) => void;
}

export const WantedBoardSection: React.FC<WantedBoardSectionProps> = ({
  requests,
  adminWhatsAppNumber = ADMIN_CONTACT.whatsappInternational,
  onAddRequest,
  onFulfillViaForm,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'Semua' | ItemCategory>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // New Wanted Request Form State
  const [requesterName, setRequesterName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [kecamatan, setKecamatan] = useState<string>('Majalengka');
  const [category, setCategory] = useState<ItemCategory>('Fashion');
  const [itemWanted, setItemWanted] = useState('');
  const [maxBudgetRaw, setMaxBudgetRaw] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const parsedBudget = parseRupiahInput(maxBudgetRaw);

  const filteredRequests = requests.filter((req) => {
    const matchesCat = selectedCategory === 'Semua' || req.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      req.itemWanted.toLowerCase().includes(q) ||
      req.notes.toLowerCase().includes(q) ||
      req.kecamatan.toLowerCase().includes(q) ||
      req.id.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requesterName.trim() || !whatsappNumber.trim() || !itemWanted.trim() || parsedBudget <= 0) {
      setFormError('Mohon lengkapi nama, nomor WhatsApp, barang yang dicari, dan estimasi budget.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const newReq: WantedRequest = {
        id: `#REQ-${new Date().getFullYear()}-${randomNum}`,
        createdAt: new Date().toISOString(),
        requesterName: requesterName.trim(),
        whatsappNumber: whatsappNumber.trim(),
        kecamatan,
        category,
        itemWanted: itemWanted.trim(),
        maxBudget: parsedBudget,
        notes: notes.trim() || 'Kondisi layak pakai, siap COD area Majalengka.',
        status: 'Masih Dicari',
      };

      await onAddRequest(newReq);
      setRequesterName('');
      setWhatsappNumber('');
      setItemWanted('');
      setMaxBudgetRaw('');
      setNotes('');
      setIsFormOpen(false);
    } catch {
      setFormError('Terjadi kendala saat menyimpan permintaan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const cleanAdminWa = normalizeWhatsAppNumber(adminWhatsAppNumber);

  return (
    <div className="mb-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-stone-900 text-stone-50 border-2 border-stone-900 shadow-[5px_5px_0px_#C25E34] p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-amber-300 text-xs font-mono font-bold uppercase tracking-widest block">
              LEMBAR III · PAPAN WARTA PERMINTAAN WARGA · KABUPATEN MAJALENGKA
            </span>
            <h2 className="text-xl sm:text-3xl font-serif-editorial font-bold leading-tight">
              Titip Cari Barang (Wanted Board)
            </h2>
            <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
              Belum menemukan barang incaran Anda di etalase? Daftarkan barang yang dicari beserta estimasi budgetnya. Pemilik barang di 26 kecamatan Majalengka dapat langsung menawarkan kepada Anda melalui kurasi Admin!
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsFormOpen((prev) => !prev)}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer border-2 border-amber-500 shadow-[2px_2px_0px_#1C1917]"
          >
            {isFormOpen ? (
              <>
                <X className="w-4 h-4" />
                <span>TUTUP FORMULIR</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>PASANG WARTA CARI BARANG</span>
              </>
            )}
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-5 pt-4 border-t border-white/15 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(['Semua', ...CATEGORIES.map((c) => c.label)] as ('Semua' | ItemCategory)[]).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 border text-xs font-mono font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-[2px_2px_0px_#1C1917]'
                      : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700 hover:text-stone-100'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari barang yang sedang dicari warga..."
              className="w-full pl-9 pr-3.5 py-2 border-2 border-stone-600 bg-stone-800 text-white placeholder:text-stone-400 text-xs focus:bg-white focus:text-stone-900 focus:placeholder:text-stone-500 focus:outline-hidden transition-colors font-mono"
            />
          </div>
        </div>
      </div>

      {/* Collapsible Form to Submit Wanted Item */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmitRequest}
          className="bg-[#FAF7F2] p-5 sm:p-6 border-2 border-stone-800 shadow-[4px_4px_0px_#1C1917] space-y-4"
        >
          <div className="flex items-center justify-between border-b-2 border-stone-800 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C25E34] font-bold block">
                PENGAJUAN WARTA
              </span>
              <h3 className="text-sm sm:text-base font-serif-editorial font-bold text-stone-950">
                Formulir Titip Cari Barang Bekas Berkualitas
              </h3>
              <p className="text-xs text-stone-600 font-serif-editorial italic">
                Nomor WhatsApp Anda tetap aman (disembunyikan dari publik) dan hanya dihubungi melalui Admin Esteh.
              </p>
            </div>
          </div>

          {formError && (
            <p className="text-xs text-rose-700 bg-rose-50 border-2 border-rose-400 px-3.5 py-2.5 font-mono font-bold shadow-[2px_2px_0px_#E11D48]">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold font-mono text-stone-800 mb-1 uppercase">
                Nama Anda <span className="text-[#C25E34]">*</span>
              </label>
              <input
                type="text"
                required
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="Contoh: Daffa Pratama"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border-2 border-stone-400 bg-white text-stone-900 focus:border-stone-900 focus:outline-hidden shadow-[2px_2px_0px_rgba(0,0,0,0.05)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-mono text-stone-800 mb-1 uppercase">
                No. WhatsApp Aktif <span className="text-[#C25E34]">*</span>
              </label>
              <input
                type="tel"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border-2 border-stone-400 bg-white text-stone-900 focus:border-stone-900 focus:outline-hidden shadow-[2px_2px_0px_rgba(0,0,0,0.05)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-mono text-stone-800 mb-1 uppercase">
                Domisili Kecamatan <span className="text-[#C25E34]">*</span>
              </label>
              <select
                value={kecamatan}
                onChange={(e) => setKecamatan(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border-2 border-stone-400 bg-white text-stone-900 focus:border-stone-900 focus:outline-hidden shadow-[2px_2px_0px_rgba(0,0,0,0.05)]"
              >
                {KECAMATAN_MAJALENGKA.map((kec) => (
                  <option key={kec} value={kec}>
                    Kec. {kec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold font-mono text-stone-800 mb-1 uppercase">
                Kategori Barang <span className="text-[#C25E34]">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border-2 border-stone-400 bg-white text-stone-900 focus:border-stone-900 focus:outline-hidden shadow-[2px_2px_0px_rgba(0,0,0,0.05)]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold font-mono text-stone-800 mb-1 uppercase">
                Barang & Ukuran yang Dicari <span className="text-[#C25E34]">*</span>
              </label>
              <input
                type="text"
                required
                value={itemWanted}
                onChange={(e) => setItemWanted(e.target.value)}
                placeholder="Contoh: Helm Cargloss Hitam Doff Size L"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border-2 border-stone-400 bg-white text-stone-900 focus:border-stone-900 focus:outline-hidden shadow-[2px_2px_0px_rgba(0,0,0,0.05)]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-mono text-stone-800 mb-1 uppercase">
                Budget Maksimal (Rp) <span className="text-[#C25E34]">*</span>
              </label>
              <input
                type="text"
                required
                value={maxBudgetRaw ? Number(maxBudgetRaw).toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const num = parseRupiahInput(e.target.value);
                  setMaxBudgetRaw(num > 0 ? String(num) : '');
                }}
                placeholder="Contoh: 200.000"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono border-2 border-stone-400 bg-white text-stone-900 focus:border-stone-900 focus:outline-hidden shadow-[2px_2px_0px_rgba(0,0,0,0.05)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold font-mono text-stone-800 mb-1 uppercase">
              Catatan Spesifikasi / Kondisi yang Diharapkan
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Busa masih tebal, lecet pemakaian wajar tidak masalah, siap COD Alun-Alun Majalengka"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border-2 border-stone-400 bg-white text-stone-900 focus:border-stone-900 focus:outline-hidden shadow-[2px_2px_0px_rgba(0,0,0,0.05)]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-300">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 border-2 border-stone-400 hover:border-stone-800 bg-white text-stone-800 text-xs font-mono font-bold cursor-pointer transition-colors"
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-200 text-xs font-mono font-bold border-2 border-stone-900 shadow-[2px_2px_0px_#C25E34] cursor-pointer disabled:opacity-60 transition-colors uppercase"
            >
              {isSubmitting ? 'Menyimpan...' : 'TAYANGKAN PERMINTAAN CARI BARANG'}
            </button>
          </div>
        </form>
      )}

      {/* Wanted Requests Grid */}
      {filteredRequests.length === 0 ? (
        <div className="bg-[#FAF7F2] p-8 text-center border-2 border-stone-800 shadow-[3px_3px_0px_#1C1917] space-y-3">
          <h3 className="text-sm font-bold font-mono text-stone-950 uppercase">
            Belum Ada Permintaan Barang pada Filter Ini
          </h3>
          <p className="text-xs text-stone-600 max-w-md mx-auto font-serif-editorial italic">
            Sedang mencari sepatu, helm, jaket, atau gadget preloved di Majalengka? Klik tombol <strong>"PASANG WARTA CARI BARANG"</strong> di atas agar pemilik barang dapat menawarkan kepada Anda!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredRequests.map((req) => {
            const isFulfilled = req.status === 'Sudah Dapat';
            const suggestedNett = Math.max(10000, Math.round((req.maxBudget * 0.88) / 5000) * 5000);
            const offerWaText = `Halo Admin Esteh (*info.barkasmajalengka*), saya memiliki barang yang sesuai dengan permintaan di Papan Titip Cari Barang:

🔎 *Kode Request:* ${req.id}
📦 *Barang Dicari:* ${req.itemWanted}
💰 *Budget Pencari:* s.d. ${formatRupiah(req.maxBudget)}
📍 *Kecamatan Pencari:* Kec. ${req.kecamatan}

Saya ingin menawarkan / menitipjualkan barang saya untuk permintaan ini. Terima kasih!`;

            const offerWaUrl = `https://wa.me/${cleanAdminWa}?text=${encodeURIComponent(offerWaText)}`;

            return (
              <div
                key={req.id}
                className="bg-[#FAF7F2] border-2 border-stone-800 shadow-[4px_4px_0px_#1C1917] p-5 flex flex-col justify-between gap-4 transition-transform hover:-translate-y-1"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-[#1B365D]">
                      <span>{req.id}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-sans font-medium text-slate-500">{req.category}</span>
                    </div>
                    <span
                      className={`font-bold ${
                        isFulfilled ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {isFulfilled ? '✓ Sudah Dapat' : '● Masih Dicari'}
                    </span>
                  </div>

                  <h3 className="text-base font-serif-editorial font-bold text-stone-900 leading-snug">
                    Dicari: {req.itemWanted}
                  </h3>

                  <p className="text-xs text-stone-600 leading-relaxed">{req.notes}</p>

                  <div className="pt-1 flex items-center justify-between text-xs text-stone-500">
                    <span>
                      Pencari: <strong className="text-stone-800">{req.requesterName}</strong> · Kec. {req.kecamatan}
                    </span>
                    <span>
                      {new Date(req.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t-2 border-stone-800 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-600 block">
                        ESTIMASI BUDGET
                      </span>
                      <strong className="text-base font-mono font-black text-stone-950 tabular-nums">
                        s.d. {formatRupiah(req.maxBudget)}
                      </strong>
                    </div>

                    {isFulfilled && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-800 px-2 py-0.5 bg-emerald-100 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>TERPENUHI</span>
                      </span>
                    )}
                  </div>

                  {!isFulfilled && (
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          onFulfillViaForm({
                            category: req.category,
                            itemNameAndBrand: req.itemWanted,
                            suggestedNettPrice: suggestedNett,
                          })
                        }
                        className="flex-1 min-w-[130px] px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-900 text-xs font-mono font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer border border-stone-800 shadow-[1px_1px_0px_#1C1917]"
                      >
                        <span>Titip Barang Ini</span>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-800" />
                      </button>

                      <a
                        href={offerWaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[110px] px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-200 text-xs font-mono font-bold transition-colors inline-flex items-center justify-center gap-1 border border-stone-900 shadow-[1px_1px_0px_#C25E34]"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Tawarkan (WA)</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
