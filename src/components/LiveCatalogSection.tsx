import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  MessageCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Check,
} from 'lucide-react';
import {
  ConsignmentItem,
  ItemCategory,
  KECAMATAN_MAJALENGKA,
  ADMIN_CONTACT,
} from '../types/consignment';
import {
  formatRupiah,
  parseRupiahInput,
  calculateListingEstimates,
  getTenorTimeline,
} from '../utils/formatters';
import { generateBuyerInquiryWhatsAppUrl } from '../utils/captionGenerator';
import { calculateMajalengkaCodAndCourier } from '../utils/majalengkaCodCalculator';

interface LiveCatalogSectionProps {
  items: ConsignmentItem[];
  soldItems?: ConsignmentItem[];
  adminWhatsAppNumber?: string;
  initialSelectedTicketId?: string | null;
  onSwitchToForm?: () => void;
  onSwitchToWanted?: () => void;
}

const CATEGORIES: ('Semua' | 'Wishlist' | ItemCategory)[] = [
  'Semua',
  'Wishlist',
  'Fashion',
  'Sneakers / Sepatu',
  'Helm & Otomotif',
  'Gadget & Elektronik',
  'Lainnya',
];

const MAJALENGKA_COD_POINTS = [
  'Sesuai Kecamatan Barang',
  'Alun-Alun Majalengka',
  'GGM / Bundaran Munjul',
  'Jatiwangi',
  'Kadipaten',
  'Rajagaluh / Sindangwangi',
  'Kirim Ekspedisi / Kurir Lokal',
];

type SortOption = 'newest' | 'price_asc' | 'price_desc';

const WISHLIST_STORAGE_KEY = 'barkas_wishlist_ids_v1';

export const LiveCatalogSection: React.FC<LiveCatalogSectionProps> = ({
  items,
  soldItems = [],
  adminWhatsAppNumber = ADMIN_CONTACT.whatsappInternational,
  initialSelectedTicketId,
  onSwitchToForm,
  onSwitchToWanted,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'Semua' | 'Wishlist' | ItemCategory>('Semua');
  const [onlyPriceDrop, setOnlyPriceDrop] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ConsignmentItem | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Compare Items State (up to 3 items)
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Buyer Negotiation & COD Point State inside Detail Modal
  const [purchaseMode, setPurchaseMode] = useState<'fixed' | 'nego'>('fixed');
  const [negoOfferRaw, setNegoOfferRaw] = useState('');
  const [buyerKecamatan, setBuyerKecamatan] = useState<string>('Majalengka');
  const [selectedCodPoint, setSelectedCodPoint] = useState<string>(MAJALENGKA_COD_POINTS[0]);

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  // Automatically open item detail if ?item=BM-2026-XXXX was passed in URL
  useEffect(() => {
    if (!initialSelectedTicketId || items.length === 0) return;
    const cleanQuery = initialSelectedTicketId.replace(/^#/, '').toUpperCase();
    const matched = items.find(
      (i) => i.id.replace(/^#/, '').toUpperCase() === cleanQuery
    );
    if (matched) {
      handleOpenDetail(matched);
    }
  }, [initialSelectedTicketId, items]);

  const toggleWishlist = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setWishlistIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleCompareItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const handleShareItem = async (e: React.MouseEvent, item: ConsignmentItem) => {
    e.stopPropagation();
    const cleanTicket = item.id.replace(/^#/, '');
    const shareUrl = `${window.location.origin}${window.location.pathname}?item=${encodeURIComponent(cleanTicket)}`;
    const estimates = calculateListingEstimates(item.nettPrice);
    const shareText = `Cek ${item.itemNameAndBrand} (${formatRupiah(estimates.suggestedListingPrice)}) di Etalase Resmi info.barkasmajalengka!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${item.itemNameAndBrand} - info.barkasmajalengka`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShareId(item.id);
      setTimeout(() => setCopiedShareId(null), 2500);
    } catch {
      // ignore
    }
  };

  const priceDropCount = useMemo(() => {
    return items.filter(
      (i) => typeof i.previousNettPrice === 'number' && i.previousNettPrice > i.nettPrice
    ).length;
  }, [items]);

  const filteredItems = useMemo(() => {
    const base = items.filter((item) => {
      const matchesCategory =
        selectedCategory === 'Semua'
          ? true
          : selectedCategory === 'Wishlist'
          ? wishlistIds.includes(item.id)
          : item.category === selectedCategory;

      const hasPriceDrop =
        typeof item.previousNettPrice === 'number' &&
        item.previousNettPrice > item.nettPrice;
      const matchesPromo = onlyPriceDrop ? hasPriceDrop : true;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.itemNameAndBrand.toLowerCase().includes(q) ||
        item.descriptionAndFlaws.toLowerCase().includes(q) ||
        item.kecamatan.toLowerCase().includes(q) ||
        item.size.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);
      return matchesCategory && matchesPromo && matchesSearch;
    });

    return [...base].sort((a, b) => {
      if (sortBy === 'price_asc') {
        return a.nettPrice - b.nettPrice;
      }
      if (sortBy === 'price_desc') {
        return b.nettPrice - a.nettPrice;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [items, selectedCategory, wishlistIds, onlyPriceDrop, searchQuery, sortBy]);

  const comparedItemsList = useMemo(() => {
    return compareIds
      .map((id) => items.find((i) => i.id === id))
      .filter((i): i is ConsignmentItem => Boolean(i));
  }, [compareIds, items]);

  const handleOpenDetail = (item: ConsignmentItem) => {
    setSelectedItem(item);
    setActivePhotoIndex(0);
    setPurchaseMode('fixed');
    const est = calculateListingEstimates(item.nettPrice);
    const defaultNego = Math.max(10000, est.suggestedListingPrice - 15000);
    setNegoOfferRaw(defaultNego.toLocaleString('id-ID'));
    const codEst = calculateMajalengkaCodAndCourier(item.kecamatan, buyerKecamatan);
    setSelectedCodPoint(codEst.recommendedMidpointCod);
  };

  return (
    <div className="mb-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-stone-900 text-stone-50 border-2 border-stone-900 shadow-[5px_5px_0px_#C25E34] p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-amber-300 text-xs font-mono font-bold uppercase tracking-widest block">
              LEMBAR I · ETALASE RESMI READY STOCK · KABUPATEN MAJALENGKA
            </span>
            <h2 className="text-xl sm:text-3xl font-serif-editorial font-bold leading-tight">
              Katalog Barang Sedang Dipajang (Live)
            </h2>
            <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
              Seluruh barang di bawah ini telah lolos kurasi fisik & keaslian oleh tim{' '}
              <strong className="text-amber-200">info.barkasmajalengka</strong>. Anda dapat membandingkan hingga 3 barang, mengajukan Nego Tipis, atau memilih titik COD se-Majalengka.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 bg-stone-800 border border-stone-700 text-right">
              <span className="text-[10px] text-amber-300 font-mono block uppercase tracking-wider">
                STOK TERSEDIA
              </span>
              <strong className="text-xl font-mono font-black text-stone-50 tabular-nums">
                {items.length} Barang
              </strong>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="mt-5 pt-4 border-t border-white/15 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Category Segmented Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 border text-xs font-mono font-bold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-[2px_2px_0px_#1C1917]'
                      : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700 hover:text-stone-100'
                  }`}
                >
                  {cat === 'Wishlist' && <Heart className="w-3 h-3 fill-current" />}
                  <span>
                    {cat === 'Wishlist' ? `Disimpan (${wishlistIds.length})` : cat}
                  </span>
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari merk, ukuran, kecamatan..."
                className="w-full pl-9 pr-3.5 py-2 border-2 border-stone-600 bg-stone-800 text-white placeholder:text-stone-400 text-xs focus:bg-white focus:text-stone-900 focus:placeholder:text-stone-500 focus:outline-hidden transition-colors font-mono"
              />
            </div>
          </div>

          {/* Sort & Promo Filter Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setOnlyPriceDrop((prev) => !prev)}
                className={`px-3 py-1.5 border-2 text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  onlyPriceDrop
                    ? 'bg-rose-700 text-stone-50 border-rose-900 shadow-[2px_2px_0px_#1C1917]'
                    : 'bg-stone-800 text-amber-300 border-stone-700 hover:bg-stone-700 shadow-[1px_1px_0px_#1C1917]'
                }`}
              >
                Promo Turun Harga ({priceDropCount})
              </button>

              {onSwitchToForm && (
                <button
                  type="button"
                  onClick={onSwitchToForm}
                  className="px-3 py-1.5 border-2 border-stone-800 bg-[#ECE5D8] hover:bg-white text-stone-900 text-xs font-mono font-bold cursor-pointer whitespace-nowrap shadow-[2px_2px_0px_#1C1917]"
                >
                  + Titip Jual (Lembar II)
                </button>
              )}

              {onSwitchToWanted && (
                <button
                  type="button"
                  onClick={onSwitchToWanted}
                  className="px-3 py-1.5 border-2 border-amber-500 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-mono font-bold cursor-pointer whitespace-nowrap shadow-[2px_2px_0px_#1C1917]"
                >
                  + Titip Cari Barang Incaran
                </button>
              )}

              {compareIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCompareModalOpen(true)}
                  className="px-3 py-1.5 border-2 border-amber-500 bg-amber-400 text-stone-950 text-xs font-mono font-bold cursor-pointer whitespace-nowrap shadow-[2px_2px_0px_#1C1917]"
                >
                  Bandingkan Barang ({compareIds.length}/3)
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-400 font-mono">Urutkan:</span>
              <div className="flex items-center gap-1 bg-stone-800 p-1 border border-stone-600">
                {[
                  { id: 'newest', label: 'Terbaru' },
                  { id: 'price_asc', label: 'Termurah' },
                  { id: 'price_desc', label: 'Tertinggi' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSortBy(opt.id as SortOption)}
                    className={`px-2.5 py-1 border text-[11px] font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      sortBy === opt.id
                        ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-[1px_1px_0px_#1C1917]'
                        : 'border-transparent text-stone-300 hover:text-white hover:bg-stone-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-3">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-800">
              {selectedCategory === 'Wishlist'
                ? 'Belum Ada Barang di Daftar Simpanan (Wishlist)'
                : onlyPriceDrop
                ? 'Belum Ada Barang yang Sedang Promo Turun Harga'
                : items.length === 0
                ? 'Belum Ada Barang di Etalase Saat Ini'
                : 'Barang Tidak Ditemukan'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {selectedCategory === 'Wishlist'
                ? 'Ketuk ikon hati pada barang yang Anda sukai untuk menyimpannya di perangkat Anda.'
                : onlyPriceDrop
                ? 'Matikan filter "Promo Turun Harga" untuk melihat seluruh koleksi barang siap pakai.'
                : items.length === 0
                ? 'Setiap barang yang masuk dan aktif akan otomatis tampil secara real-time di etalase ini.'
                : 'Coba gunakan kata kunci pencarian lain atau pilih kategori "Semua".'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {onSwitchToForm && (
              <button
                type="button"
                onClick={onSwitchToForm}
                className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-stone-800 bg-stone-900 text-amber-200 text-xs font-mono font-bold shadow-[2px_2px_0px_#C25E34] hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <span>Titip Jual Barang (Lembar II)</span>
              </button>
            )}
            {onSwitchToWanted && (
              <button
                type="button"
                onClick={onSwitchToWanted}
                className="inline-flex items-center gap-1.5 px-4 py-2 border-2 border-amber-500 bg-amber-400 text-stone-950 text-xs font-mono font-bold shadow-[2px_2px_0px_#1C1917] hover:bg-amber-300 transition-colors cursor-pointer"
              >
                <span>Pasang di Papan Titip Cari (Lembar III)</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const estimates = calculateListingEstimates(item.nettPrice);
            const hasPriceDrop =
              typeof item.previousNettPrice === 'number' &&
              item.previousNettPrice > item.nettPrice;
            const prevEstimates = hasPriceDrop
              ? calculateListingEstimates(item.previousNettPrice!)
              : null;
            const discountPct = hasPriceDrop
              ? Math.round(
                  ((item.previousNettPrice! - item.nettPrice) / item.previousNettPrice!) * 100
                )
              : 0;

            const tenor = getTenorTimeline(item.createdAt);
            const buyerWaUrl = generateBuyerInquiryWhatsAppUrl(item, adminWhatsAppNumber);
            const coverPhoto = item.photos && item.photos.length > 0 ? item.photos[0] : '';
            const isWishlisted = wishlistIds.includes(item.id);
            const isCompared = compareIds.includes(item.id);

            return (
              <div
                key={item.id}
                className="bg-[#FAF7F2] border-2 border-stone-800 shadow-[4px_4px_0px_#1C1917] flex flex-col justify-between transition-transform hover:-translate-y-1"
              >
                <div>
                  {/* Image Container */}
                  <div
                    onClick={() => handleOpenDetail(item)}
                    className="relative aspect-square bg-[#ECE5D8] border-b-2 border-stone-800 overflow-hidden cursor-pointer group"
                  >
                    {coverPhoto ? (
                      <img
                        src={coverPhoto}
                        alt={item.itemNameAndBrand}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        Tanpa Foto
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                      <span className="text-white text-xs font-bold">
                        Lihat Detail & Opsi Nego ({item.photos?.length || 1} Foto)
                      </span>
                    </div>

                    {/* Top Left Ticket ID, Status & Price Drop Badge */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-[#1C1917]/90 backdrop-blur-xs text-amber-200 px-2.5 py-1 rounded-md font-mono font-bold text-[11px] border border-amber-900/40">
                          {item.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-xs ${
                            item.status === 'Booked (Di-DP)' || item.postStatus === 'Booked'
                              ? 'bg-amber-800 text-amber-100'
                              : item.status === 'Sedang Dipajang (Live)'
                              ? 'bg-stone-900/90 text-stone-200 border border-stone-700/60'
                              : item.status === 'Diterima'
                              ? 'bg-stone-800 text-stone-300'
                              : 'bg-amber-300 text-stone-950 font-black'
                          }`}
                        >
                          {item.status === 'Booked (Di-DP)' || item.postStatus === 'Booked'
                            ? 'BOOKED / DI-DP'
                            : item.status === 'Sedang Dipajang (Live)'
                            ? 'LIVE'
                            : item.status === 'Diterima'
                            ? 'TERVERIFIKASI'
                            : 'BARU MASUK'}
                        </span>
                      </div>
                      {hasPriceDrop && (
                        <span className="bg-[#9A3412] text-amber-50 px-2 py-0.5 rounded-md font-bold text-[10px] border border-orange-950/40">
                          TURUN HARGA -{discountPct}%
                        </span>
                      )}
                    </div>

                    {/* Top Right Compare, Share & Wishlist Buttons */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => toggleCompareItem(e, item.id)}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-xs transition-colors cursor-pointer ${
                          isCompared
                            ? 'bg-amber-400 text-stone-950'
                            : 'bg-black/55 hover:bg-black/75 text-white'
                        }`}
                        title="Bandingkan Barang Ini"
                      >
                        {isCompared ? '✓ Banding' : '+ Banding'}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleShareItem(e, item)}
                        className="w-8 h-8 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                        title="Bagikan Link Barang Ini"
                      >
                        {copiedShareId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => toggleWishlist(e, item.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer ${
                          isWishlisted
                            ? 'bg-rose-600 text-white'
                            : 'bg-black/55 hover:bg-black/75 text-white'
                        }`}
                        title={isWishlisted ? 'Hapus dari Simpanan' : 'Simpan Barang'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span>{item.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>Size {item.size || 'All Size'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.condition}</span>
                    </div>

                    <h3
                      onClick={() => handleOpenDetail(item)}
                      className="font-serif-editorial font-bold text-stone-900 text-base sm:text-lg line-clamp-1 hover:text-[#C25E34] transition-colors cursor-pointer"
                    >
                      {item.itemNameAndBrand}
                    </h3>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {item.descriptionAndFlaws}
                    </p>

                    <div className="pt-1 flex items-center justify-between text-[11px] text-stone-500">
                      <span>Kec. {item.kecamatan}</span>
                      <span>Hari ke-{tenor.elapsedDays}/30</span>
                    </div>
                  </div>
                </div>

                {/* Price & Action Footer */}
                <div className="px-4 pb-3.5 pt-3 border-t-2 border-stone-800 bg-[#ECE5D8] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-600 block">
                      {hasPriceDrop ? '★ HARGA PRICE DROP' : 'HARGA ETALASE'}
                    </span>
                    {prevEstimates && (
                      <span className="text-[11px] font-mono text-stone-500 line-through block tabular-nums">
                        {formatRupiah(prevEstimates.suggestedListingPrice)}
                      </span>
                    )}
                    <strong className="text-base sm:text-lg font-mono font-black text-stone-950 tabular-nums">
                      {formatRupiah(estimates.suggestedListingPrice)}
                    </strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(item)}
                      className="px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-900 text-xs font-mono font-bold transition-colors cursor-pointer border border-stone-800 shadow-[1px_1px_0px_#1C1917]"
                    >
                      Nego / COD
                    </button>
                    <a
                      href={buyerWaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold transition-colors shadow-[2px_2px_0px_#C25E34] ${
                        item.status === 'Booked (Di-DP)' || item.postStatus === 'Booked'
                          ? 'bg-amber-800 text-amber-100 hover:bg-amber-900'
                          : 'bg-stone-950 text-amber-300 hover:bg-stone-800'
                      }`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>
                        {item.status === 'Booked (Di-DP)' || item.postStatus === 'Booked'
                          ? 'Antre'
                          : 'Beli'}
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Comparison Bar when 1..3 items are selected */}
      {comparedItemsList.length > 0 && (
        <div className="bg-[#1B365D] text-white rounded-2xl p-3.5 border-2 border-amber-400 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-extrabold text-amber-300 shrink-0">
              Bandingkan ({comparedItemsList.length}/3):
            </span>
            {comparedItemsList.map((ci) => (
              <span
                key={ci.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 text-xs font-semibold whitespace-nowrap"
              >
                <span className="truncate max-w-[140px]">{ci.itemNameAndBrand}</span>
                <button
                  type="button"
                  onClick={(e) => toggleCompareItem(e, ci.id)}
                  className="text-amber-300 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setIsCompareModalOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-extrabold cursor-pointer"
            >
              Lihat Tabel Perbandingan
            </button>
          </div>
        </div>
      )}

      {/* BARU SAJA TERJUAL (ARSIP SOLD OUT / SOCIAL PROOF) */}
      {soldItems.length > 0 && (
        <div className="pt-4 border-t border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                Bukti Penjualan Nyata · Kabupaten Majalengka
              </span>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                Baru Saja Terjual (Arsip Sold Out)
              </h3>
              <p className="text-xs text-slate-500">
                Daftar barang titipan warga Majalengka yang telah laku terjual melalui @info.barkasmajalengka.
              </p>
            </div>
            {onSwitchToForm && (
              <button
                type="button"
                onClick={onSwitchToForm}
                className="text-xs font-bold text-[#1B365D] hover:underline cursor-pointer self-start sm:self-auto"
              >
                Ingin barang Anda cepat laku seperti ini? Titip Jual Sekarang →
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {soldItems.slice(0, 8).map((sold) => {
              const est = calculateListingEstimates(sold.nettPrice);
              const cover = sold.photos && sold.photos.length > 0 ? sold.photos[0] : '';

              return (
                <div
                  key={sold.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden opacity-90 hover:opacity-100 transition-opacity flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-square bg-slate-100 overflow-hidden">
                      {cover ? (
                        <img
                          src={cover}
                          alt={sold.itemNameAndBrand}
                          className="w-full h-full object-cover grayscale-[25%]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                          Terjual
                        </div>
                      )}
                      <div className="absolute inset-0 bg-slate-950/45 flex items-center justify-center p-2">
                        <span className="px-3 py-1 rounded-lg bg-rose-600/95 text-white font-black text-xs tracking-wider uppercase border border-amber-200 shadow-md -rotate-6">
                          TERJUAL / SOLD
                        </span>
                      </div>
                    </div>

                    <div className="p-3 space-y-1">
                      <span className="text-[10px] text-slate-400 block">
                        {sold.category} · Size {sold.size || 'All Size'}
                      </span>
                      <h4 className="font-bold text-slate-800 text-xs line-clamp-1">
                        {sold.itemNameAndBrand}
                      </h4>
                    </div>
                  </div>

                  <div className="px-3 pb-3 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-slate-500 line-through tabular-nums">
                      {formatRupiah(est.suggestedListingPrice)}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      Kec. {sold.kecamatan}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal */}
      {isCompareModalOpen && comparedItemsList.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="sticky top-0 z-10 bg-[#1B365D] text-white px-5 py-4 flex items-center justify-between border-b-2 border-amber-400">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                  Perbandingan Spesifikasi & Harga
                </span>
                <h3 className="font-extrabold text-sm sm:text-base">
                  Bandingkan {comparedItemsList.length} Barang Pilihan Anda
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-x-auto">
              <div
                className={`grid gap-4 min-w-[600px] ${
                  comparedItemsList.length === 1
                    ? 'grid-cols-1 max-w-sm mx-auto'
                    : comparedItemsList.length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-3'
                }`}
              >
                {comparedItemsList.map((ci) => {
                  const est = calculateListingEstimates(ci.nettPrice);
                  const cover = ci.photos && ci.photos.length > 0 ? ci.photos[0] : '';
                  const waUrl = generateBuyerInquiryWhatsAppUrl(ci, adminWhatsAppNumber);

                  return (
                    <div
                      key={ci.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between space-y-3 text-xs"
                    >
                      <div className="space-y-3">
                        <div className="aspect-square rounded-xl overflow-hidden bg-slate-200 relative">
                          {cover && (
                            <img
                              src={cover}
                              alt={ci.itemNameAndBrand}
                              className="w-full h-full object-cover"
                            />
                          )}
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#1B365D] text-amber-300 font-mono font-bold text-[10px]">
                            {ci.id}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block">{ci.category}</span>
                          <h4 className="font-extrabold text-slate-900 text-sm">
                            {ci.itemNameAndBrand}
                          </h4>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-200">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Harga Etalase:</span>
                            <strong className="font-mono font-black text-[#1B365D] tabular-nums">
                              {formatRupiah(est.suggestedListingPrice)}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Ukuran / Size:</span>
                            <strong className="text-slate-800">{ci.size || 'All Size'}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Kondisi:</span>
                            <strong className="text-emerald-700">{ci.condition}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Domisili:</span>
                            <strong className="text-slate-800">Kec. {ci.kecamatan}</strong>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                          <span className="text-[10px] text-slate-400 block mb-0.5">
                            Deskripsi & Minus:
                          </span>
                          <p className="text-[11px] text-slate-600 line-clamp-4 leading-relaxed">
                            {ci.descriptionAndFlaws}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCompareModalOpen(false);
                            handleOpenDetail(ci);
                          }}
                          className="flex-1 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 font-bold text-xs cursor-pointer"
                        >
                          Nego / Detail
                        </button>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center"
                        >
                          Beli via WA
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Lightbox Modal with Negotiation & COD Point Picker */}
      {selectedItem && (() => {
        const estimates = calculateListingEstimates(selectedItem.nettPrice);
        const hasPriceDrop =
          typeof selectedItem.previousNettPrice === 'number' &&
          selectedItem.previousNettPrice > selectedItem.nettPrice;
        const prevEstimates = hasPriceDrop
          ? calculateListingEstimates(selectedItem.previousNettPrice!)
          : null;

        const parsedNegoOffer = parseRupiahInput(negoOfferRaw);
        const codEstimation = calculateMajalengkaCodAndCourier(
          selectedItem.kecamatan,
          buyerKecamatan
        );
        const isBookedItem =
          selectedItem.status === 'Booked (Di-DP)' || selectedItem.postStatus === 'Booked';
        const buyerWaUrl = generateBuyerInquiryWhatsAppUrl(selectedItem, adminWhatsAppNumber, {
          offerPrice: purchaseMode === 'nego' ? parsedNegoOffer : undefined,
          codPoint: selectedCodPoint,
        });
        const photos = selectedItem.photos || [];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
              <div className="sticky top-0 z-10 bg-[#1B365D] text-white px-5 py-4 flex items-center justify-between border-b-2 border-amber-400">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="font-mono font-black text-xs bg-amber-400 text-[#1B365D] px-2.5 py-1 rounded-lg shrink-0">
                    {selectedItem.id}
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base truncate">
                    {selectedItem.itemNameAndBrand}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleShareItem(e, selectedItem)}
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedShareId === selectedItem.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Link Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-amber-300" />
                        <span>Share Link</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(null)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Photo Viewer */}
                {photos.length > 0 && (
                  <div className="space-y-2">
                    <div className="relative aspect-square sm:aspect-video bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center">
                      <img
                        src={photos[activePhotoIndex]}
                        alt={selectedItem.itemNameAndBrand}
                        className="max-h-full max-w-full object-contain"
                      />
                      {photos.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setActivePhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
                            }
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setActivePhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    {photos.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {photos.map((photo, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActivePhotoIndex(idx)}
                            className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer ${
                              activePhotoIndex === idx ? 'border-[#1B365D]' : 'border-transparent opacity-60'
                            }`}
                          >
                            <img src={photo} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Specs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">
                      {hasPriceDrop ? 'Harga Promo' : 'Harga Etalase'}
                    </span>
                    {prevEstimates && (
                      <span className="text-[10px] font-mono text-slate-400 line-through block tabular-nums">
                        {formatRupiah(prevEstimates.suggestedListingPrice)}
                      </span>
                    )}
                    <strong className="text-sm font-mono font-black text-[#1B365D] tabular-nums">
                      {formatRupiah(estimates.suggestedListingPrice)}
                    </strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Kategori</span>
                    <strong className="text-slate-800">{selectedItem.category}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Ukuran / Size</span>
                    <strong className="text-slate-800">{selectedItem.size || 'All Size'}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Domisili Barang</span>
                    <strong className="text-slate-800">Kec. {selectedItem.kecamatan}</strong>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Deskripsi & Kondisi Fisik:</span>
                    <span className="text-emerald-700 font-semibold">
                      {selectedItem.condition}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                    {selectedItem.descriptionAndFlaws}
                  </p>
                </div>

                {isBookedItem && (
                  <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-300 text-orange-950 text-xs space-y-1">
                    <div className="font-extrabold flex items-center gap-1.5 text-orange-800">
                      <span>🔒 Status Saat Ini: BOOKED / SEDANG DI-DP</span>
                    </div>
                    <p className="text-[11px] text-orange-900 leading-relaxed">
                      Barang ini sedang di-DP oleh calon pembeli pertama. Namun Anda tetap dapat menekan tombol{' '}
                      <strong>Antre via WhatsApp</strong> di bawah agar Admin Esteh langsung menghubungi Anda jika transaksi sebelumnya batal.
                    </p>
                  </div>
                )}

                {/* OPSI NEGO TIPIS & KALKULATOR COD / KURIR LOKAL 26 KECAMATAN MAJALENGKA */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        Opsi Pembelian & Kalkulator COD 26 Kecamatan Majalengka
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Pilih beli harga pas atau ajukan tawaran nego tipis, lalu cek titik tengah COD & estimasi kurir lokal.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-1 bg-slate-200/80 p-1 rounded-xl shrink-0">
                      <button
                        type="button"
                        onClick={() => setPurchaseMode('fixed')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          purchaseMode === 'fixed'
                            ? 'bg-[#1B365D] text-white'
                            : 'text-slate-700 hover:text-slate-900'
                        }`}
                      >
                        Beli Harga Pas
                      </button>
                      <button
                        type="button"
                        onClick={() => setPurchaseMode('nego')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          purchaseMode === 'nego'
                            ? 'bg-amber-500 text-stone-950'
                            : 'text-slate-700 hover:text-slate-900'
                        }`}
                      >
                        Ajukan Nego Tipis
                      </button>
                    </div>
                  </div>

                  {purchaseMode === 'nego' && (
                    <div className="p-3.5 rounded-xl bg-white border border-amber-300 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">
                          Nominal Tawaran Anda (Rp)
                        </label>
                        <div className="flex items-center gap-1">
                          {[10000, 20000, 30000].map((cut) => {
                            const targetVal = Math.max(10000, estimates.suggestedListingPrice - cut);
                            return (
                              <button
                                key={cut}
                                type="button"
                                onClick={() => setNegoOfferRaw(targetVal.toLocaleString('id-ID'))}
                                className="px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] cursor-pointer"
                              >
                                -Rp {(cut / 1000).toFixed(0)}rb
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          Rp
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={negoOfferRaw}
                          onChange={(e) => {
                            const num = parseRupiahInput(e.target.value);
                            setNegoOfferRaw(num > 0 ? num.toLocaleString('id-ID') : '');
                          }}
                          className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:border-[#1B365D] focus:outline-hidden"
                          placeholder="Masukkan tawaran harga..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Kalkulator Jarak & Ongkir Kurir Lokal Antar 26 Kecamatan Majalengka */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-extrabold text-[#1B365D] block">
                          📍 Cek Titik Tengah COD & Ongkir dari Kec. {selectedItem.kecamatan}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Pilih kecamatan tempat tinggal Anda di Kabupaten Majalengka:
                        </span>
                      </div>
                      <select
                        value={buyerKecamatan}
                        onChange={(e) => {
                          const newKec = e.target.value;
                          setBuyerKecamatan(newKec);
                          const newEst = calculateMajalengkaCodAndCourier(
                            selectedItem.kecamatan,
                            newKec
                          );
                          setSelectedCodPoint(newEst.recommendedMidpointCod);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-bold text-slate-800 focus:border-[#1B365D] focus:outline-hidden"
                      >
                        {KECAMATAN_MAJALENGKA.map((kec) => (
                          <option key={kec} value={kec}>
                            Lokasi Saya: Kec. {kec}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block">Estimasi Jarak</span>
                        <strong className="text-slate-800 font-mono">
                          ± {codEstimation.estimatedDistanceKm} km
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block">Kurir Lokal Instan</span>
                        <strong className="text-emerald-700 font-mono">
                          {formatRupiah(codEstimation.localCourierFeeMin)} -{' '}
                          {formatRupiah(codEstimation.localCourierFeeMax)}
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 block">Ekspedisi Lokal (1 Hari)</span>
                        <strong className="text-slate-800">Rp 9rb - Rp 13rb</strong>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 bg-amber-50/70 border border-amber-200/80 rounded-lg px-2.5 py-1.5">
                      💡 {codEstimation.summaryNote}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Pilih Titik COD / Metode Pengiriman (Tercantum di Chat WA):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {codEstimation.alternativeCodPoints.map((point) => (
                        <button
                          key={point}
                          type="button"
                          onClick={() => setSelectedCodPoint(point)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-colors cursor-pointer ${
                            selectedCodPoint === point
                              ? 'bg-[#1B365D] text-white border-[#1B365D]'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {point}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-500">
                    Transaksi aman melalui Rekening Bersama / COD Admin Esteh ({ADMIN_CONTACT.whatsappFormatted})
                  </span>
                  <a
                    href={buyerWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-extrabold text-xs transition-colors ${
                      isBookedItem
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>
                      {isBookedItem
                        ? 'Antre jika Batal via WhatsApp'
                        : purchaseMode === 'nego'
                        ? `Ajukan Nego ${formatRupiah(parsedNegoOffer)} via WA`
                        : 'Beli / Booking COD via WhatsApp'}
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
