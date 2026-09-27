import React, { useEffect, useRef, useState } from 'react';
import { X, Download, FileText, Check, Copy, ExternalLink, Smartphone } from 'lucide-react';
import { ConsignmentItem } from '../types/consignment';
import { generateTicketQRCode, getTicketVerificationUrl } from '../utils/qrCode';
import { generateConsignmentPDF } from '../utils/pdfGenerator';
import { formatRupiah, calculateListingEstimates } from '../utils/formatters';

interface TicketQRCodeModalProps {
  item: ConsignmentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenVerifyDetail?: (item: ConsignmentItem) => void;
}

export const TicketQRCodeModal: React.FC<TicketQRCodeModalProps> = ({
  item,
  isOpen,
  onClose,
  onOpenVerifyDetail,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'hangtag'>('qr');
  const [linkMode, setLinkMode] = useState<'admin' | 'public'>('admin');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [hangtagDataUrl, setHangtagDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const hangtagCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const verificationUrl = item ? getTicketVerificationUrl(item.id, linkMode) : '';

  useEffect(() => {
    if (item && isOpen) {
      generateTicketQRCode(item, linkMode).then((url) => setQrDataUrl(url));
    }
  }, [item, isOpen, linkMode]);

  // Render Hangtag Canvas whenever qrDataUrl or item is ready
  useEffect(() => {
    if (!item || !qrDataUrl || !isOpen) return;
    const canvas = hangtagCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const qrImg = new Image();
    qrImg.onload = () => {
      const W = 600;
      const H = 940;
      canvas.width = W;
      canvas.height = H;

      const estimates = calculateListingEstimates(item.nettPrice);

      // Background Cream Card
      ctx.fillStyle = '#FAF8F4';
      ctx.fillRect(0, 0, W, H);

      // Dashed cut-line border
      ctx.strokeStyle = '#0F291E';
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 8]);
      ctx.strokeRect(18, 18, W - 36, H - 36);
      ctx.setLineDash([]);

      // Top Header Banner
      ctx.fillStyle = '#0F291E';
      ctx.fillRect(34, 34, W - 68, 130);

      // Punch Hole Circle at top center
      ctx.fillStyle = '#FAF8F4';
      ctx.beginPath();
      ctx.arc(W / 2, 68, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#FBBF24';
      ctx.font = 'bold 15px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('SCAN QR DENGAN HP UNTUK VERIFIKASI DETAIL BARANG', W / 2, 114);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 26px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('info.barkasmajalengka', W / 2, 146);

      // Ticket ID Box
      ctx.fillStyle = '#FEF3C7';
      ctx.fillRect(60, 188, W - 120, 62);
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 188, W - 120, 62);

      ctx.fillStyle = '#0F291E';
      ctx.font = '900 32px monospace';
      ctx.fillText(item.id, W / 2, 230);

      // QR Code Image in Center
      const qrSize = 270;
      const qrX = (W - qrSize) / 2;
      const qrY = 270;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24);
      ctx.strokeStyle = '#E2DDD2';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24);
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Product Name & Specs
      ctx.fillStyle = '#1C1917';
      ctx.font = '800 24px "Plus Jakarta Sans", system-ui, sans-serif';
      const cleanTitle =
        item.itemNameAndBrand.length > 34
          ? item.itemNameAndBrand.slice(0, 34) + '...'
          : item.itemNameAndBrand;
      ctx.fillText(cleanTitle, W / 2, 595);

      ctx.fillStyle = '#57534E';
      ctx.font = '600 18px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(
        `${item.category}  ·  Size: ${item.size || 'All Size'}  ·  ${item.condition}`,
        W / 2,
        630
      );

      ctx.fillText(
        `Penitip: ${item.fullName} (Kec. ${item.kecamatan})`,
        W / 2,
        662
      );

      // Divider
      ctx.strokeStyle = '#D6D3D1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, 690);
      ctx.lineTo(W - 60, 690);
      ctx.stroke();

      // Price Box
      ctx.fillStyle = '#0F291E';
      ctx.fillRect(60, 712, W - 120, 125);

      ctx.fillStyle = '#FDE68A';
      ctx.font = 'bold 16px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText('HARGA JUAL ETALASE (TERMASUK JASA TITIP)', W / 2, 745);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 42px monospace';
      ctx.fillText(formatRupiah(estimates.suggestedListingPrice), W / 2, 795);

      ctx.fillStyle = '#A7F3D0';
      ctx.font = '600 15px monospace';
      ctx.fillText(`Nett Penitip: ${formatRupiah(item.nettPrice)}`, W / 2, 824);

      // Bottom Footer
      ctx.fillStyle = '#78716C';
      ctx.font = '600 14px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.fillText(
        `Tgl Masuk: ${new Date(item.createdAt).toLocaleDateString('id-ID')}  ·  WA Admin: 0851-8726-6629`,
        W / 2,
        872
      );

      ctx.fillStyle = '#1B365D';
      ctx.font = '700 13px monospace';
      const shortUrl = verificationUrl.replace(/^https?:\/\//, '');
      ctx.fillText(
        shortUrl.length > 52 ? shortUrl.slice(0, 52) + '...' : shortUrl,
        W / 2,
        898
      );

      setHangtagDataUrl(canvas.toDataURL('image/png'));
    };
    qrImg.src = qrDataUrl;
  }, [item, qrDataUrl, isOpen, verificationUrl]);

  if (!isOpen || !item) return null;

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-Verifikasi-${item.id.replace('#', '')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadHangtag = () => {
    if (!hangtagDataUrl) return;
    const a = document.createElement('a');
    a.href = hangtagDataUrl;
    a.download = `Hangtag-QR-${item.id.replace('#', '')}.png`;
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
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleCopyVerificationUrl = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(item.id);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <canvas ref={hangtagCanvasRef} className="hidden" />

        {/* Header */}
        <div className="bg-[#1B365D] text-white p-5 text-center relative border-b-2 border-amber-400">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="font-extrabold text-base sm:text-lg">
            QR Code Link Verifikasi & Hangtag
          </h3>
          <p className="text-xs text-amber-200/90 font-mono mt-0.5">{item.id}</p>

          {/* Segmented Mode Selector */}
          <div className="mt-3 grid grid-cols-2 gap-1.5 bg-black/25 p-1 rounded-xl border border-white/15">
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'qr'
                  ? 'bg-amber-400 text-stone-950'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              QR Link Verifikasi HP
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hangtag')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'hangtag'
                  ? 'bg-amber-400 text-stone-950'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Label Hangtag Fisik
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 text-center space-y-3.5">
          {/* Target Link Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-2 gap-1 text-left">
            <button
              type="button"
              onClick={() => setLinkMode('admin')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                linkMode === 'admin'
                  ? 'bg-[#1B365D] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Link Verifikasi Admin
            </button>
            <button
              type="button"
              onClick={() => setLinkMode('public')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer ${
                linkMode === 'public'
                  ? 'bg-[#1B365D] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Link Etalase Publik
            </button>
          </div>

          {activeTab === 'qr' ? (
            <>
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

              <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {linkMode === 'admin'
                    ? 'Scan dengan kamera HP untuk membuka Verifikasi Detail Admin'
                    : 'Scan dengan kamera HP untuk membuka barang di Etalase Publik'}
                </span>
              </div>

              {/* Direct Encoded Link Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-left space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    URL di Dalam QR Code
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyVerificationUrl}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1B365D] hover:underline cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Link Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin Link</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] font-mono text-slate-700 break-all bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80">
                  {verificationUrl}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {item.itemNameAndBrand}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Penitip: <strong>{item.fullName}</strong> · Kec. {item.kecamatan}
                </p>
                <p className="text-xs font-bold text-amber-700 mt-1 font-mono">
                  Harga Nett: {formatRupiah(item.nettPrice)}
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {onOpenVerifyDetail && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenVerifyDetail(item);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 text-amber-300" />
                    <span>Buka Halaman Verifikasi Detail Barang</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1B365D] hover:bg-[#24477A] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>{isGeneratingPDF ? 'Menyiapkan PDF...' : 'Download Bukti Resmi (PDF)'}</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Simpan Gambar QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyTicket}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    title="Salin ID Tiket"
                  >
                    {copiedTicket ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200">
                {hangtagDataUrl ? (
                  <img
                    src={hangtagDataUrl}
                    alt={`Hangtag ${item.id}`}
                    className="max-h-72 mx-auto rounded-lg shadow-sm object-contain"
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                    Menyiapkan Desain Hangtag...
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                QR pada hangtag ini sudah berisi <strong>Link Verifikasi Detail Barang</strong>. Saat ditempel di fisik barang, Admin cukup scan dengan kamera HP untuk melihat detail & status barang.
              </p>

              <button
                type="button"
                onClick={handleDownloadHangtag}
                disabled={!hangtagDataUrl}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1B365D] hover:bg-[#24477A] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Unduh Kartu Label / Hangtag (PNG)</span>
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
