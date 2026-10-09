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
  Loader2,
  AlertCircle
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
  const [pdfError, setPdfError] = useState<string | null>(null);
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
    setPdfError(null);
    try {
      await generateConsignmentPDF(item);
    } catch (err) {
      console.error(err);
      setPdfError('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative bg-[#FAF7F2] border-4 border-double border-stone-900 max-w-xl w-full shadow-[8px_8px_0px_#1C1917] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Ribbon */}
        <div className="bg-stone-900 text-stone-50 p-5 sm:p-6 text-center relative border-b-2 border-stone-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-400 hover:text-white border border-stone-700 bg-stone-800 hover:bg-stone-700 p-1.5 cursor-pointer transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 mx-auto mb-2 border-2 border-amber-400 bg-stone-950 flex items-center justify-center shadow-[2px_2px_0px_#C25E34]">
            <CheckCircle className="w-7 h-7 text-amber-300 stroke-[2.5]" />
          </div>

          <span className="inline-block px-3 py-0.5 border border-amber-400/40 bg-stone-800 text-amber-300 text-[11px] font-mono font-bold uppercase mb-1">
            BUKTI RESMI TERDAFTAR
          </span>

          <h3 className="text-xl sm:text-2xl font-serif-editorial font-bold tracking-tight uppercase">
            Formulir Titip Jual Terbit!
          </h3>

          <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-md mx-auto font-serif-editorial italic">
            Simpan bukti resmi di bawah dan lanjut konfirmasi ke WhatsApp Admin info.barkasmajalengka.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Ticket ID Box */}
          <div className="bg-[#ECE5D8] border-2 border-dashed border-stone-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#1C1917]">
            <div>
              <span className="text-[10px] font-mono font-bold text-stone-600 uppercase tracking-widest block">
                KODE TIKET TITIP JUAL
              </span>
              <span className="text-xl sm:text-2xl font-mono font-black text-stone-950">
                {item.id}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setShowQRPreview(!showQRPreview)}
                className={`flex items-center gap-1 px-2.5 py-1.5 border text-xs font-mono font-bold cursor-pointer transition-colors ${
                  showQRPreview
                    ? 'bg-amber-300 border-stone-900 text-stone-950 shadow-[1px_1px_0px_#1C1917]'
                    : 'bg-white border-stone-500 hover:border-stone-900 text-stone-800'
                }`}
                title="Tampilkan Kode QR"
              >
                <QrCode className="w-3.5 h-3.5 text-stone-900" />
                <span>{showQRPreview ? 'TUTUP QR' : 'KODE QR'}</span>
              </button>

              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-stone-500 hover:border-stone-900 text-stone-800 text-xs font-mono font-bold cursor-pointer transition-colors"
                title="Salin Rangkuman"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-700" />}
                <span>{copied ? 'TERSALIN' : 'SALIN'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-stone-500 hover:border-stone-900 text-stone-800 text-xs font-mono font-bold cursor-pointer transition-colors"
                title="Cetak Tiket"
              >
                <Printer className="w-3.5 h-3.5 text-stone-700" />
                <span>CETAK</span>
              </button>
            </div>
          </div>

          {/* QR Code Collapsible Display */}
          {showQRPreview && (
            <div className="p-4 bg-white border-2 border-stone-800 flex flex-col items-center justify-center text-center space-y-2 animate-in fade-in duration-150">
              <span className="text-xs font-bold font-mono uppercase text-stone-900">
                Kode QR Verifikasi Serah Terima
              </span>
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-36 h-36 bg-white p-2 border-2 border-stone-800 shadow-[2px_2px_0px_#1C1917]"
                />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center text-xs font-mono text-stone-400">
                  Memuat QR...
                </div>
              )}
              <p className="text-[11px] text-stone-600 max-w-xs font-serif-editorial italic">
                Admin barkasmajalengka dapat memindai kode ini saat penyerahan barang di lokasi Majalengka.
              </p>
            </div>
          )}

          {/* Download PDF & WhatsApp Primary Action Bar */}
          <div className="space-y-2">
            {/* Instant Admin Notification Delivery Badge */}
            <div className="p-3 bg-emerald-50 border-2 border-emerald-700/60 flex items-center gap-2.5 text-xs text-emerald-950 font-serif-editorial shadow-[2px_2px_0px_#064e3b]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping shrink-0" />
              <div className="leading-tight">
                <span className="font-bold block font-mono text-[11px] uppercase text-emerald-800">
                  Notifikasi Otomatis Terkirim ke HP Admin
                </span>
                <span>
                  Admin langsung menerima notifikasi barang titip baru Anda di HP. Ketuk tombol hijau di bawah untuk konfirmasi via WhatsApp:
                </span>
              </div>
            </div>

            {/* WhatsApp Button */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between gap-3 px-5 py-3.5 bg-emerald-800 hover:bg-emerald-900 text-stone-50 font-mono font-bold text-sm sm:text-base border-2 border-emerald-950 shadow-[3px_3px_0px_#064e3b] transition-all group"
            >
              <div className="flex items-center gap-2.5 text-left">
                <MessageCircle className="w-5 h-5 text-amber-300 shrink-0" />
                <div>
                  <span className="block leading-tight uppercase">Konfirmasi ke WhatsApp Admin Esteh</span>
                  <span className="text-[11px] font-normal text-emerald-200 block">
                    No. Resmi: 0851-7955-0150 (Langsung terhubung)
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0 text-amber-300 group-hover:translate-x-1 transition-transform" />
            </a>

            {/* Official PDF Download Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 hover:bg-stone-800 text-amber-200 font-mono font-bold text-xs sm:text-sm border-2 border-stone-900 shadow-[3px_3px_0px_#C25E34] transition-all cursor-pointer disabled:opacity-60 uppercase"
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
                  <Download className="w-3.5 h-3.5 text-amber-200 ml-auto" />
                </>
              )}
            </button>
          </div>

          {/* Item & Seller Summary Card */}
          <div className="bg-white p-4 border-2 border-stone-800 text-xs sm:text-sm space-y-3 shadow-[2px_2px_0px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between pb-2 border-b-2 border-stone-800 font-bold text-stone-900">
              <span className="flex items-center gap-1.5 font-mono uppercase text-xs">
                <Tag className="w-4 h-4 text-[#C25E34]" />
                <span>Rangkuman Data Titip Jual</span>
              </span>
              <span className="px-2 py-0.5 bg-stone-900 text-amber-200 border border-stone-800 font-mono text-xs">
                {item.category}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-stone-700 text-xs">
              <div>
                <span className="text-stone-500 font-mono block">Nama Penitip:</span>
                <span className="font-bold text-stone-900">{item.fullName}</span>
              </div>
              <div>
                <span className="text-stone-500 font-mono block">WhatsApp:</span>
                <span className="font-mono font-bold text-stone-900">{item.whatsappNumber}</span>
              </div>
              <div>
                <span className="text-stone-500 font-mono block">Kecamatan:</span>
                <span className="font-bold text-stone-900">Kec. {item.kecamatan}</span>
              </div>
              <div>
                <span className="text-stone-500 font-mono block">Pencairan Dana:</span>
                <span className="font-mono font-bold text-stone-900 truncate block" title={item.bankAccount}>
                  {item.bankAccount}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-300 space-y-1.5">
              <div>
                <span className="text-stone-500 font-mono text-xs block">Barang:</span>
                <span className="font-serif-editorial font-bold text-stone-950 text-base">{item.itemNameAndBrand}</span>
                <span className="text-xs text-stone-600 font-mono ml-1.5">
                  (Size: {item.size || 'All Size'} • {item.condition})
                </span>
              </div>
              <div>
                <span className="text-stone-500 font-mono text-xs block">Deskripsi & Minus:</span>
                <p className="text-xs text-stone-800 bg-[#FAF7F2] p-2 border border-stone-400 leading-relaxed italic font-serif-editorial">
                  "{item.descriptionAndFlaws}"
                </p>
              </div>
            </div>

            {/* Price Highlight */}
            <div className="p-3 bg-[#ECE5D8] border border-stone-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold font-mono uppercase text-stone-900 block">
                  Harga Bersih (Nett Penitip):
                </span>
                <span className="text-[11px] text-stone-600 font-serif-editorial italic">
                  Diterima 100% penuh saat laku
                </span>
              </div>
              <span className="text-base sm:text-lg font-black text-stone-950 font-mono">
                {formatRupiah(item.nettPrice)}
              </span>
            </div>

            {/* Photos thumbnail preview in summary */}
            {item.photos && item.photos.length > 0 && (
              <div className="pt-1">
                <span className="text-xs font-mono text-stone-600 block mb-1">
                  Foto Terlampir ({item.photos.length} foto):
                </span>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {item.photos.slice(0, 5).map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt="Thumbnail"
                      className="w-12 h-12 object-cover border border-stone-800 shadow-2xs"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Next Steps Guide */}
          <div className="p-3.5 bg-[#FAF7F2] border-2 border-stone-800 text-xs text-stone-800 space-y-1.5 shadow-[2px_2px_0px_#1C1917]">
            <span className="font-bold flex items-center gap-1 font-mono uppercase text-stone-950">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Alur Selanjutnya di info.barkasmajalengka:</span>
            </span>
            <ol className="list-decimal list-inside space-y-1 text-stone-700 pl-1 leading-relaxed font-serif-editorial">
              <li>Admin mengonfirmasi data via WhatsApp & memeriksa detail foto.</li>
              <li>Barang dapat diserahkan di titik temu Majalengka (Alun-alun / Kadipaten / Jatiwangi).</li>
              <li>Admin memindai Kode QR pada bukti PDF untuk mencocokkan fisik barang.</li>
              <li>Barang tayang di media sosial info.barkasmajalengka hingga laku terjual.</li>
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        {pdfError && (
          <div className="px-4 py-2 bg-rose-50 border-t-2 border-rose-400 text-rose-800 text-xs font-mono font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{pdfError}</span>
          </div>
        )}
        <div className="p-4 bg-[#ECE5D8] border-t-2 border-stone-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="text-xs font-mono font-bold text-stone-800 hover:text-stone-950 underline flex items-center gap-1 cursor-pointer uppercase"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Simpan PDF Salinan</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-200 text-xs font-mono font-bold border-2 border-stone-900 shadow-[2px_2px_0px_#C25E34] cursor-pointer transition-colors uppercase"
          >
            Selesai & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
