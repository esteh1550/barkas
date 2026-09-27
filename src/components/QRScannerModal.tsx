import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Search,
  QrCode,
  Sparkles,
  FileDown,
} from 'lucide-react';
import { ConsignmentItem, SubmissionStatus } from '../types/consignment';
import { formatRupiah } from '../utils/formatters';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: ConsignmentItem[];
  onUpdateStatus: (id: string, newStatus: SubmissionStatus) => void;
  onDownloadPDF: (item: ConsignmentItem) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  submissions,
  onUpdateStatus,
  onDownloadPDF,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualTicketInput, setManualTicketInput] = useState('');
  const [matchedItem, setMatchedItem] = useState<ConsignmentItem | null>(null);
  const [decodedRawInfo, setDecodedRawInfo] = useState<Record<string, any> | null>(null);
  const [statusUpdatedNotice, setStatusUpdatedNotice] = useState<string | null>(null);

  const parseScannedString = (rawText: string) => {
    setStatusUpdatedNotice(null);
    let ticketId = rawText.trim();
    let parsedJson: Record<string, any> | null = null;

    try {
      const obj = JSON.parse(rawText);
      if (obj && typeof obj === 'object') {
        parsedJson = obj;
        if (obj.ticket) {
          ticketId = String(obj.ticket);
        }
      }
    } catch {
      // If not JSON, check if it contains #BM- pattern
      const match = rawText.match(/#?BM-\d{4}-\d{3,6}/i);
      if (match) {
        ticketId = match[0].toUpperCase();
      }
    }

    const normalized = ticketId.startsWith('#') ? ticketId.toUpperCase() : `#${ticketId.toUpperCase()}`;
    const found = submissions.find(
      (s) => s.id.toUpperCase() === normalized || s.id.toUpperCase() === ticketId.toUpperCase()
    );

    if (found) {
      setMatchedItem(found);
      setDecodedRawInfo(parsedJson);
      stopCamera();
    } else if (parsedJson && parsedJson.ticket) {
      setDecodedRawInfo(parsedJson);
      setMatchedItem(null);
      stopCamera();
    } else {
      setCameraError(`Kode terbaca ("${rawText}"), namun tidak cocok dengan tiket di database.`);
    }
  };

  const stopCamera = () => {
    setIsCameraActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setMatchedItem(null);
    setDecodedRawInfo(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch {
      setCameraError(
        'Kamera tidak dapat diakses pada perangkat ini. Anda tetap dapat mengunggah foto/screenshot QR Code atau mengetik nomor tiket di bawah.'
      );
      setIsCameraActive(false);
    }
  };

  // Continuous QR frame scanning loop when camera is active
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isCameraActive) return;
    let animationFrameId: number;

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code && code.data) {
            parseScannedString(code.data);
            return;
          }
        }
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isCameraActive, submissions]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCameraError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          parseScannedString(code.data);
        } else {
          setCameraError('QR Code tidak terdeteksi pada gambar tersebut. Pastikan gambar QR terlihat jelas.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTicketInput.trim()) return;
    parseScannedString(manualTicketInput.trim());
  };

  const handleQuickStatusChange = (newStatus: SubmissionStatus) => {
    if (!matchedItem) return;
    onUpdateStatus(matchedItem.id, newStatus);
    setMatchedItem({ ...matchedItem, status: newStatus });
    setStatusUpdatedNotice(`Status tiket ${matchedItem.id} berhasil diubah menjadi "${newStatus}"!`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-[#1B365D] text-white px-5 py-4 flex items-center justify-between border-b-2 border-amber-400">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-[#1B365D] flex items-center justify-center font-black">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">
                Pemindai QR Code Tiket (COD / Drop-off)
              </h3>
              <p className="text-[11px] text-amber-200">
                Verifikasi bukti fisik penitip & ubah status kurasi secara instan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Camera Controls & Upload */}
          <div className="grid grid-cols-2 gap-2.5">
            {!isCameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="py-3 px-4 rounded-2xl bg-[#1B365D] hover:bg-[#24477A] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Buka Kamera Scanner</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Matikan Kamera</span>
              </button>
            )}

            <label className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-[#1B365D]" />
              <span>Upload Gambar QR</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Live Video Viewport */}
          {isCameraActive && (
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border-2 border-amber-400">
              <video ref={videoRef} className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-44 h-44 border-2 border-amber-400/90 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
              </div>
              <div className="absolute bottom-2 inset-x-0 text-center">
                <span className="px-3 py-1 rounded-full bg-black/70 text-amber-300 text-[11px] font-semibold">
                  Arahkan kamera ke QR Code pada Bukti Tiket PDF Penitip...
                </span>
              </div>
            </div>
          )}

          {/* Manual Ticket Lookup Fallback */}
          <form onSubmit={handleManualLookup} className="flex gap-2">
            <input
              type="text"
              value={manualTicketInput}
              onChange={(e) => setManualTicketInput(e.target.value)}
              placeholder="Atau ketik Kode Tiket (misal: #BM-2026-4821)"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs font-mono uppercase focus:bg-white focus:border-[#1B365D] focus:outline-hidden"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Cari</span>
            </button>
          </form>

          {cameraError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          )}

          {statusUpdatedNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusUpdatedNotice}</span>
            </div>
          )}

          {/* Matched Item Verification Card */}
          {matchedItem && (
            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-[#1B365D] space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div>
                  <span className="px-2 py-0.5 rounded-md bg-[#1B365D] text-amber-300 font-mono font-black text-xs">
                    {matchedItem.id}
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-sm mt-1">
                    {matchedItem.itemNameAndBrand}
                  </h4>
                </div>
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Terverifikasi
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Penitip</span>
                  <strong className="text-slate-800">
                    {matchedItem.fullName} (Kec. {matchedItem.kecamatan})
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Harga Nett</span>
                  <strong className="text-[#1B365D] font-mono">
                    {formatRupiah(matchedItem.nettPrice)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Rekening Pencairan</span>
                  <strong className="text-slate-800">{matchedItem.bankAccount}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Status Saat Ini</span>
                  <strong className="text-amber-800">{matchedItem.status}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 block">
                  Tindakan Cepat Admin:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickStatusChange('Diterima')}
                    className="py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Terima Fisik Barang</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickStatusChange('Sedang Dipajang (Live)')}
                    className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tayangkan (Live)</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onDownloadPDF(matchedItem)}
                  className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Unduh Bukti Registrasi PDF</span>
                </button>
              </div>
            </div>
          )}

          {/* If QR decoded from external device not yet in local list */}
          {!matchedItem && decodedRawInfo && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 text-xs">
              <strong className="text-amber-900 block">
                Data QR Terbaca ({decodedRawInfo.ticket}):
              </strong>
              <p className="text-amber-800">
                Barang: <strong>{decodedRawInfo.barang}</strong> • Penitip:{' '}
                <strong>{decodedRawInfo.penitip}</strong> • Harga Nett:{' '}
                <strong>{formatRupiah(Number(decodedRawInfo.hargaNett) || 0)}</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
