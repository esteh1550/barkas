import React, { useEffect, useState } from 'react';
import { X, QrCode, Download, FileText, Check, Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import { ConsignmentItem } from '../types/consignment';
import { generateTicketQRCode } from '../utils/qrCode';
import { generateConsignmentPDF } from '../utils/pdfGenerator';
import { formatRupiah } from '../utils/formatters';

interface TicketQRCodeModalProps {
  item: ConsignmentItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TicketQRCodeModal: React.FC<TicketQRCodeModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (item && isOpen) {
      generateTicketQRCode(item).then((url) => setQrDataUrl(url));
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QRCode-${item.id.replace('#', '')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateConsignmentPDF(item);
    } catch (e) {
      console.error('PDF error:', e);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(item.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#1B365D] text-white p-5 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-amber-400 text-[#1B365D] flex items-center justify-center font-bold shadow-md">
            <QrCode className="w-6 h-6" />
          </div>

          <h3 className="font-extrabold text-lg">Kode QR Verifikasi Tiket</h3>
          <p className="text-xs text-amber-200/90 font-mono mt-0.5">{item.id}</p>
        </div>

        {/* Content */}
        <div className="p-5 text-center space-y-4">
          {/* QR Code Container */}
          <div className="p-3 bg-slate-50 border-2 border-dashed border-amber-300 rounded-2xl inline-block shadow-inner">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code ${item.id}`}
                className="w-48 h-48 mx-auto rounded-lg object-contain bg-white p-1"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                Membuat Kode QR...
              </div>
            )}
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              {item.itemNameAndBrand}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Penitip: <strong>{item.fullName}</strong> • Kec. {item.kecamatan}
            </p>
            <p className="text-xs font-bold text-amber-700 mt-1">
              Harga Nett: {formatRupiah(item.nettPrice)}
            </p>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed bg-blue-50/70 p-2.5 rounded-xl border border-blue-200/60 text-left flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1B365D] shrink-0 mt-0.5" />
            <span>
              Admin dapat memindai (scan) kode QR ini dengan kamera HP untuk verifikasi keaslian tiket saat serah terima barang di Majalengka.
            </span>
          </p>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1B365D] hover:bg-[#24477A] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>{isGeneratingPDF ? 'Menyiapkan PDF...' : 'Download Bukti Resmi (PDF)'}</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Simpan Gambar QR</span>
              </button>

              <button
                type="button"
                onClick={handleCopyTicket}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center gap-1"
                title="Salin ID Tiket"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
