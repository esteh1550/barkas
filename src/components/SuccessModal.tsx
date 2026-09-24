import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle, 
  MessageCircle, 
  Copy, 
  Printer, 
  FileSpreadsheet, 
  X, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Tag,
  Download,
  QrCode,
  FileText,
  Loader2
} from 'lucide-react';
import { ConsignmentItem } from '../types/consignment';
import { formatRupiah, generateAdminWhatsAppUrl, calculateListingEstimates } from '../utils/formatters';
import { generateConsignmentPDF } from '../utils/pdfGenerator';
import { generateTicketQRCode } from '../utils/qrCode';

interface SuccessModalProps {
  item: ConsignmentItem;
  isOpen: boolean;
  onClose: () => void;
  adminWhatsAppNumber: string;
  onSyncGoogleForm?: () => void;
  isSyncingGoogleForm?: boolean;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  item,
  isOpen,
  onClose,
  adminWhatsAppNumber,
  onSyncGoogleForm,
  isSyncingGoogleForm,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQRPreview, setShowQRPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#1B365D', '#F59E0B', '#10B981', '#3B82F6'],
        });
      } catch (e) {
        // ignore
      }

      // Generate QR Code
      generateTicketQRCode(item).then((url) => setQrCodeUrl(url));
    }
  }, [isOpen, item]);

  if (!isOpen) return null;

  const estimates = calculateListingEstimates(item.nettPrice);
  const waUrl = generateAdminWhatsAppUrl(item, adminWhatsAppNumber);

  const handleCopySummary = () => {
    const text = `KODE TIKET: ${item.id}
Penitip: ${item.fullName} (${item.whatsappNumber})
Domisili: Kec. ${item.kecamatan}, Majalengka
Barang: ${item.itemNameAndBrand} (${item.category})
Ukuran: ${item.size} | Kondisi: ${item.condition}
Harga Bersih (Nett): ${formatRupiah(item.nettPrice)}
Rekening: ${item.bankAccount}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateConsignmentPDF(item);
    } catch (err) {
      console.error(err);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Ribbon */}
        <div className="bg-[#1B365D] text-white p-5 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]"></div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center shadow-lg border-2 border-emerald-200">
            <CheckCircle className="w-8 h-8 text-white stroke-[2.5]" />
          </div>

          <span className="inline-block px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30 text-xs font-semibold mb-1">
            Data Berhasil Terdaftar
          </span>

          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Formulir Titip Jual Terkirim!
          </h3>

          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-md mx-auto">
            Simpan bukti resmi di bawah dan lanjut konfirmasi ke WhatsApp Admin info.barkasmajalengka.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Ticket ID Box */}
          <div className="bg-slate-50 border-2 border-dashed border-amber-400/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Kode Tiket Titip Jual
              </span>
              <span className="text-lg sm:text-xl font-mono font-black text-[#1B365D]">
                {item.id}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setShowQRPreview(!showQRPreview)}
                className={`flex items-center gap-1 px-2.5 py-1.5 border text-xs font-medium rounded-lg shadow-2xs transition-colors ${
                  showQRPreview
                    ? 'bg-amber-100 border-amber-300 text-amber-800'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
                title="Tampilkan Kode QR"
              >
                <QrCode className="w-3.5 h-3.5 text-[#1B365D]" />
                <span>{showQRPreview ? 'Sembunyikan QR' : 'Kode QR'}</span>
              </button>

              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition-colors"
                title="Salin Rangkuman"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1 px-2 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition-colors"
                title="Cetak Tiket"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* QR Code Collapsible Display */}
          {showQRPreview && (
            <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-2 animate-in fade-in duration-150">
              <span className="text-xs font-bold text-slate-700">
                Kode QR Verifikasi Serah Terima
              </span>
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-36 h-36 bg-white p-2 rounded-xl shadow-xs border border-slate-300"
                />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">
                  Memuat QR...
                </div>
              )}
              <p className="text-[11px] text-slate-500 max-w-xs">
                Admin barkasmajalengka dapat memindai kode ini saat penyerahan barang di lokasi Majalengka.
              </p>
            </div>
          )}

          {/* Download PDF & WhatsApp Primary Action Bar */}
          <div className="space-y-2">
            {/* WhatsApp Button */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-600/25 transition-all group"
            >
              <MessageCircle className="w-5 h-5 fill-white/20 text-white shrink-0 group-hover:scale-110 transition-transform" />
              <span>Lanjut Konfirmasi ke WhatsApp Admin</span>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </a>

            {/* Official PDF Download Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1B365D] hover:bg-[#24477A] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Sedang Membuat Dokumen PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Download Bukti Registrasi Resmi (PDF)</span>
                  <Download className="w-3.5 h-3.5 text-white/80 ml-auto" />
                </>
              )}
            </button>
          </div>

          {/* Item & Seller Summary Card */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 text-xs sm:text-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-semibold text-slate-800">
              <span className="flex items-center gap-1.5 text-[#1B365D]">
                <Tag className="w-4 h-4 text-amber-500" />
                <span>Rangkuman Data Titip Jual</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium text-xs">
                {item.category}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-slate-400 text-xs block">Nama Penitip:</span>
                <span className="font-semibold text-slate-800">{item.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">WhatsApp Penitip:</span>
                <span className="font-medium text-slate-800">{item.whatsappNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Kecamatan:</span>
                <span className="font-medium text-slate-800">Kec. {item.kecamatan}</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Pencairan Dana Ke:</span>
                <span className="font-medium text-slate-800 truncate block" title={item.bankAccount}>
                  {item.bankAccount}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-1.5">
              <div>
                <span className="text-slate-400 text-xs block">Barang:</span>
                <span className="font-bold text-slate-900 text-sm">{item.itemNameAndBrand}</span>
                <span className="text-xs text-slate-500 ml-1.5">
                  (Size: {item.size || 'All Size'} • {item.condition})
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Deskripsi & Minus:</span>
                <p className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200/80 leading-relaxed italic">
                  "{item.descriptionAndFlaws}"
                </p>
              </div>
            </div>

            {/* Price Highlight */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-900 block">
                  Harga Bersih (Nett Penitip):
                </span>
                <span className="text-xs text-amber-700">
                  Diterima 100% penuh saat laku
                </span>
              </div>
              <span className="text-base sm:text-lg font-black text-amber-700 font-mono">
                {formatRupiah(item.nettPrice)}
              </span>
            </div>

            {/* Photos thumbnail preview in summary */}
            {item.photos && item.photos.length > 0 && (
              <div className="pt-1">
                <span className="text-xs text-slate-500 block mb-1">
                  Foto Terlampir ({item.photos.length} foto):
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {item.photos.slice(0, 5).map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt="Thumbnail"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Google Forms optional action if requested */}
          {onSyncGoogleForm && (
            <div className="pt-1">
              <button
                type="button"
                onClick={onSyncGoogleForm}
                disabled={isSyncingGoogleForm}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>
                  {isSyncingGoogleForm
                    ? 'Menghubungkan ke Google Forms...'
                    : 'Sinkronkan / Buat Salinan di Google Forms'}
                </span>
              </button>
            </div>
          )}

          {/* Next Steps Guide */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-2xl text-xs text-blue-900 space-y-1.5">
            <span className="font-bold flex items-center gap-1 text-[#1B365D]">
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Alur Selanjutnya di info.barkasmajalengka:</span>
            </span>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1 leading-relaxed">
              <li>Admin mengonfirmasi data via WhatsApp & memeriksa detail foto.</li>
              <li>Barang dapat diserahkan di titik temu Majalengka (Alun-alun / Kadipaten / Jatiwangi).</li>
              <li>Admin memindai Kode QR pada bukti PDF untuk mencocokkan fisik barang.</li>
              <li>Barang tayang di media sosial info.barkasmajalengka hingga laku terjual.</li>
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="text-xs text-[#1B365D] hover:underline font-bold flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Simpan PDF Salinan</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
