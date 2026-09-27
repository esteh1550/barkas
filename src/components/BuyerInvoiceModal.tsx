import React, { useEffect, useState } from 'react';
import { X, FileText, MessageCircle, CheckCircle2 } from 'lucide-react';
import { ConsignmentItem, SubmissionStatus } from '../types/consignment';
import {
  formatRupiah,
  parseRupiahInput,
  calculateListingEstimates,
} from '../utils/formatters';
import { generateBuyerInvoicePDF } from '../utils/pdfGenerator';
import { generateBuyerInvoiceWhatsAppUrl } from '../utils/captionGenerator';

interface BuyerInvoiceModalProps {
  item: ConsignmentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (id: string, newStatus: SubmissionStatus) => void;
}

const PAYMENT_METHODS = [
  'COD Tunai (Majalengka)',
  'Rekber Transfer Bank (Admin Esteh)',
  'QRIS / E-Wallet (DANA / GoPay / ShopeePay)',
];

const COD_POINTS = [
  'Alun-Alun Majalengka',
  'GGM / Bundaran Munjul',
  'Jatiwangi',
  'Kadipaten',
  'Rajagaluh / Sindangwangi',
  'Sesuai Kecamatan Barang',
  'Kirim Ekspedisi / Kurir Lokal',
];

export const BuyerInvoiceModal: React.FC<BuyerInvoiceModalProps> = ({
  item,
  isOpen,
  onClose,
  onUpdateStatus,
}) => {
  const [buyerName, setBuyerName] = useState('');
  const [buyerWhatsapp, setBuyerWhatsapp] = useState('');
  const [dealPriceRaw, setDealPriceRaw] = useState('');
  const [shippingRaw, setShippingRaw] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [codPoint, setCodPoint] = useState(COD_POINTS[0]);
  const [invoiceNotes, setInvoiceNotes] = useState(
    'Barang telah diperiksa fisik & fungsinya sesuai deskripsi etalase.'
  );
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (item && isOpen) {
      const est = calculateListingEstimates(item.nettPrice);
      setDealPriceRaw(est.suggestedListingPrice.toLocaleString('id-ID'));
      setShippingRaw('0');
      setCodPoint(`Kec. ${item.kecamatan} / Alun-Alun Majalengka`);
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const dealPrice = parseRupiahInput(dealPriceRaw);
  const shippingFee = parseRupiahInput(shippingRaw);
  const totalPaid = dealPrice + shippingFee;

  const handleDownloadInvoice = async () => {
    setIsGenerating(true);
    try {
      await generateBuyerInvoicePDF(item, {
        buyerName: buyerName.trim() || 'Pembeli Resmi info.barkasmajalengka',
        buyerWhatsapp: buyerWhatsapp.trim() || '-',
        dealPrice,
        shippingOrFee: shippingFee,
        paymentMethod,
        codOrDeliveryPoint: codPoint,
        invoiceNotes,
      });
    } catch (e) {
      console.error('Invoice PDF error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const buyerWaUrl = buyerWhatsapp.trim()
    ? generateBuyerInvoiceWhatsAppUrl(
        item,
        buyerName.trim() || 'Pembeli',
        buyerWhatsapp.trim(),
        totalPaid,
        paymentMethod,
        codPoint
      )
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1B365D] text-white px-5 py-4 flex items-center justify-between border-b-2 border-amber-400">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
              Bukti Transaksi Pembeli · INV/{item.id.replace('#', '')}
            </span>
            <h3 className="font-extrabold text-sm sm:text-base">
              Cetak Nota Pembelian / Invoice COD & Rekber (PDF)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] text-slate-400 font-mono block">{item.id}</span>
              <strong className="text-slate-900 text-sm block">{item.itemNameAndBrand}</strong>
              <span className="text-[11px] text-slate-500">
                {item.category} · Size {item.size || 'All Size'} · {item.condition}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Total Tagihan Nota</span>
              <strong className="text-base font-mono font-black text-[#1B365D] tabular-nums">
                {formatRupiah(totalPaid)}
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Pembeli
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Contoh: Kang Raka Majalengka"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#1B365D] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                No. WhatsApp Pembeli (Opsional)
              </label>
              <input
                type="tel"
                value={buyerWhatsapp}
                onChange={(e) => setBuyerWhatsapp(e.target.value)}
                placeholder="0812xxxxxxx"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#1B365D] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Harga Deal Barang (Rp)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={dealPriceRaw}
                onChange={(e) => {
                  const num = parseRupiahInput(e.target.value);
                  setDealPriceRaw(num > 0 ? num.toLocaleString('id-ID') : '');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:border-[#1B365D] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Ongkir / Biaya Kurir (Rp)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={shippingRaw}
                onChange={(e) => {
                  const num = parseRupiahInput(e.target.value);
                  setShippingRaw(num > 0 ? num.toLocaleString('id-ID') : '0');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:border-[#1B365D] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:border-[#1B365D] focus:outline-hidden"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Titik COD / Pengiriman
              </label>
              <input
                type="text"
                value={codPoint}
                onChange={(e) => setCodPoint(e.target.value)}
                list="cod-points-list"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#1B365D] focus:outline-hidden"
              />
              <datalist id="cod-points-list">
                {COD_POINTS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Catatan Tambahan pada Nota
            </label>
            <input
              type="text"
              value={invoiceNotes}
              onChange={(e) => setInvoiceNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-[#1B365D] focus:outline-hidden"
            />
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleDownloadInvoice}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#1B365D] hover:bg-[#24477A] text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>
                {isGenerating
                  ? 'Menyiapkan Nota PDF...'
                  : 'Unduh Nota Pembelian Resmi (PDF)'}
              </span>
            </button>

            <div className="flex flex-col sm:flex-row gap-2">
              {buyerWaUrl && (
                <a
                  href={buyerWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Kirim Rincian Nota ke WA Pembeli</span>
                </a>
              )}

              {onUpdateStatus && item.status !== 'Terjual' && item.status !== 'Selesai & Dicairkan' && (
                <button
                  type="button"
                  onClick={() => onUpdateStatus(item.id, 'Terjual')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>Tandai Barang "Terjual"</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
