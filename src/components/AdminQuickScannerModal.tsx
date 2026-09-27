import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Search, QrCode, Camera, FileText } from 'lucide-react';
import { ConsignmentItem, SubmissionStatus } from '../types/consignment';
import { formatRupiah, calculateListingEstimates } from '../utils/formatters';

interface AdminQuickScannerModalProps {
  submissions: ConsignmentItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectAndFocusTicket: (ticketId: string) => void;
  onUpdateStatus: (id: string, newStatus: SubmissionStatus) => void;
  onOpenQRModal: (item: ConsignmentItem) => void;
  onOpenBuyerInvoice: (item: ConsignmentItem) => void;
  onOpenPayoutReceipt: (item: ConsignmentItem) => void;
}

export const AdminQuickScannerModal: React.FC<AdminQuickScannerModalProps> = ({
  submissions,
  isOpen,
  onClose,
  onSelectAndFocusTicket,
  onUpdateStatus,
  onOpenQRModal,
  onOpenBuyerInvoice,
  onOpenPayoutReceipt,
}) => {
  const [queryText, setQueryText] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const startCameraScan = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Use native BarcodeDetector if available in browser
      const BarcodeDetectorApi = (window as unknown as { BarcodeDetector?: new (opts: { formats: string[] }) => { detect: (el: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
      if (BarcodeDetectorApi) {
        const detector = new BarcodeDetectorApi({ formats: ['qr_code'] });
        const interval = setInterval(async () => {
          if (!videoRef.current || !streamRef.current) {
            clearInterval(interval);
            return;
          }
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0 && codes[0].rawValue) {
              const raw = codes[0].rawValue;
              // Extract BM-YYYY-XXXX pattern if present
              const match = raw.match(/#?BM-\d{4}-\d{3,6}/i);
              if (match) {
                setQueryText(match[0].toUpperCase());
              } else {
                setQueryText(raw);
              }
              clearInterval(interval);
              stopCamera();
            }
          } catch {
            // ignore frame error
          }
        }, 450);
      }
    } catch {
      setCameraError(
        'Kamera tidak dapat diakses di browser ini. Gunakan kolom pencarian cepat di bawah untuk mengetik 4 angka akhir tiket.'
      );
      setIsCameraActive(false);
    }
  };

  const matchedItems = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    if (!q) return submissions.slice(0, 5);
    return submissions
      .filter(
        (item) =>
          item.id.toLowerCase().includes(q) ||
          item.itemNameAndBrand.toLowerCase().includes(q) ||
          item.fullName.toLowerCase().includes(q) ||
          item.kecamatan.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [submissions, queryText]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#1B365D] text-white px-5 py-4 flex items-center justify-between border-b-2 border-amber-400">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
              Verifikasi Gudang & Drop-Off · Admin Esteh
            </span>
            <h3 className="font-extrabold text-sm sm:text-base">
              Pemindai QR & Lookup Cepat Kode Tiket
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

        <div className="p-5 space-y-4">
          {/* Search & Camera Row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Ketik 4 angka tiket (mis. 4821), nama barang, atau penitip..."
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:border-[#1B365D] focus:bg-white focus:outline-hidden"
              />
            </div>

            <button
              type="button"
              onClick={isCameraActive ? stopCamera : startCameraScan}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                isCameraActive
                  ? 'bg-rose-600 text-white'
                  : 'bg-amber-400 hover:bg-amber-300 text-stone-950'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{isCameraActive ? 'Tutup Kamera' : 'Scan Kamera QR'}</span>
            </button>
          </div>

          {isCameraActive && (
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-amber-400 aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <div className="absolute inset-0 border-[3px] border-dashed border-amber-400/70 m-8 rounded-2xl pointer-events-none flex items-end justify-center pb-2">
                <span className="bg-black/70 text-amber-300 text-[11px] font-bold px-3 py-1 rounded-full">
                  Arahkan Kamera ke QR Code Tiket / Hangtag
                </span>
              </div>
            </div>
          )}

          {cameraError && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-xl">
              {cameraError}
            </p>
          )}

          {/* Results List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {queryText.trim()
                  ? `Hasil Pencarian (${matchedItems.length} cocok)`
                  : '5 Tiket Terbaru di Gudang / Sistem'}
              </span>
            </div>

            {matchedItems.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                Tidak ada tiket yang cocok dengan "{queryText}".
              </div>
            ) : (
              matchedItems.map((item) => {
                const est = calculateListingEstimates(item.nettPrice);
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-[#1B365D]">
                            {item.id}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            · {item.status}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">
                          {item.itemNameAndBrand}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Penitip: <strong>{item.fullName}</strong> (Kec. {item.kecamatan}) · Size{' '}
                          {item.size || 'All Size'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block">Harga Tayang</span>
                        <strong className="font-mono font-black text-xs text-[#1B365D] tabular-nums">
                          {formatRupiah(est.suggestedListingPrice)}
                        </strong>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/70">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectAndFocusTicket(item.id);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#1B365D] text-white text-[11px] font-bold cursor-pointer"
                      >
                        Buka di Dashboard
                      </button>

                      {item.status === 'Menunggu Kurasi' && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(item.id, 'Sedang Dipajang (Live)')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Setujui & Tayangkan
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onOpenQRModal(item);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3 h-3 text-amber-600" />
                        <span>Hangtag</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onOpenBuyerInvoice(item);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3 h-3 text-[#1B365D]" />
                        <span>Nota Pembeli</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onOpenPayoutReceipt(item);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold cursor-pointer"
                      >
                        Kwitansi Cair
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
