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
      <div className="bg-[#1B365D] text-white rounded-3xl p-5 sm:p-6 border-2 border-amber-400 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-amber-300 text-xs font-bold uppercase tracking-wider block">
              Papan Permintaan Pembeli · Kabupaten Majalengka
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold leading-tight">
              Titip Cari Barang (Wanted Board)
            </h2>
            <p className="text-xs text-slate-200 max-w-2xl leading-relaxed">
              Belum menemukan barang incaran Anda di etalase? Tulis barang yang sedang Anda cari beserta budgetnya. Warga Majalengka yang memiliki barang tersebut dapat langsung menawarkan atau menitipjualkannya!
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsFormOpen((prev) => !prev)}
            className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            {isFormOpen ? (
              <>
                <X className="w-4 h-4" />
                <span>Tutup Form</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Pasang Info Cari Barang</span>
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-400 text-[#1B365D]'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari barang yang sedang dicari warga..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-300 text-xs focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-400 focus:outline-hidden transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Collapsible Form to Submit Wanted Item */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmitRequest}
          className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#1B365D] shadow-md space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#1B365D]">
                Formulir Titip Cari Barang Bekas Berkualitas
              </h3>
              <p className="text-xs text-slate-500">
                Nomor WhatsApp Anda tetap aman (disembunyikan dari publik) dan hanya dihubungi melalui Admin Esteh.
              </p>
            </div>
          </div>

          {formError && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5 font-semibold">
              {formError}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Anda <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="Contoh: Daffa Pratama"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-[#1B365D] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                No. WhatsApp Aktif <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-[#1B365D] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Domisili Kecamatan <span className="text-rose-500">*</span>
              </label>
              <select
                value={kecamatan}
                onChange={(e) => setKecamatan(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-[#1B365D] focus:outline-hidden"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori Barang <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-[#1B365D] focus:outline-hidden"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.label} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Barang & Ukuran yang Dicari <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={itemWanted}
                onChange={(e) => setItemWanted(e.target.value)}
                placeholder="Contoh: Helm Cargloss Hitam Doff Size L"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-[#1B365D] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Budget Maksimal (Rp) <span className="text-rose-500">*</span>
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
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-[#1B365D] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan Spesifikasi / Kondisi yang Diharapkan
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Busa masih tebal, lecet pemakaian wajar tidak masalah, siap COD Alun-Alun Majalengka"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-[#1B365D] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#1B365D] hover:bg-[#24477A] text-white text-xs font-extrabold cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'Menyimpan...' : 'Tayangkan Permintaan Cari Barang'}
            </button>
          </div>
        </form>
      )}

      {/* Wanted Requests Grid */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-3">
          <h3 className="text-sm font-extrabold text-slate-800">
            Belum Ada Permintaan Barang pada Filter Ini
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Sedang mencari sepatu, helm, jaket, atau gadget preloved di Majalengka? Klik tombol <strong>"Pasang Info Cari Barang"</strong> di atas agar pemilik barang dapat menawarkan kepada Anda!
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
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
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

                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                    Dicari: {req.itemWanted}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">{req.notes}</p>

                  <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Pencari: <strong className="text-slate-800">{req.requesterName}</strong> · Kec. {req.kecamatan}
                    </span>
                    <span>
                      {new Date(req.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Estimasi Budget Siap Bayar</span>
                    <strong className="text-sm sm:text-base font-mono font-black text-[#1B365D] tabular-nums">
                      s.d. {formatRupiah(req.maxBudget)}
                    </strong>
                  </div>

                  {!isFulfilled ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onFulfillViaForm({
                            category: req.category,
                            itemNameAndBrand: req.itemWanted,
                            suggestedNettPrice: suggestedNett,
                          })
                        }
                        className="px-3 py-2 rounded-xl bg-[#1B365D] hover:bg-[#24477A] text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <span>Titip Jual Barang Ini</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                      </button>

                      <a
                        href={offerWaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Tawarkan (WA)</span>
                      </a>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Terpenuhi</span>
                    </span>
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
