import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, AlertCircle, CheckCircle2, Plus } from 'lucide-react';

interface PhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  minPhotos?: number;
  maxPhotos?: number;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos,
  onChange,
  minPhotos = 1,
  maxPhotos = 8,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compress image to reasonable base64 data url for browser local storage
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 600;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(readerEvent.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.60);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = readerEvent.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const remainingSlots = maxPhotos - photos.length;
      if (remainingSlots <= 0) {
        setErrorMessage(`Batas maksimal foto adalah ${maxPhotos} foto.`);
        return;
      }

      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      const newPhotoPromises = filesToProcess.map((file) => compressImage(file));
      const newPhotos = await Promise.all(newPhotoPromises);

      onChange([...photos, ...newPhotos]);
    } catch (err) {
      console.error('Gagal memproses foto:', err);
      setErrorMessage('Terjadi kesalahan saat memproses foto. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (indexToRemove: number) => {
    const updated = photos.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const isRequirementMet = photos.length >= minPhotos;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-stone-300 pb-2">
        <label className="block text-sm font-serif-editorial font-bold text-stone-900">
          DOKUMENTASI FOTO ASLI FISIK <span className="text-[#C25E34]">*</span>
        </label>
        <span
          className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 bg-stone-900 text-amber-200 border border-stone-800"
        >
          {isRequirementMet ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>
            {photos.length}/{maxPhotos} FOTO (MIN. {minPhotos})
          </span>
        </span>
      </div>

      <p className="text-xs text-stone-600 leading-relaxed font-serif-editorial italic">
        Foto jelas dari berbagai sisi: <span className="font-bold text-stone-800 not-italic">Tampak Depan, Belakang/Samping, Label/Merk, dan Detail Minus (jika ada)</span>. Foto asli tanpa filter membantu kurasi lebih cepat!
      </p>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Upload drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#C25E34] bg-amber-50/70 scale-[0.99]'
            : 'border-stone-500 hover:border-stone-900 bg-[#FAF7F2] hover:bg-[#ECE5D8]'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 border-2 border-stone-900 bg-stone-900 text-amber-200 flex items-center justify-center shadow-[2px_2px_0px_#C25E34]">
            <UploadCloud className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <p className="text-sm font-mono font-bold text-stone-900 uppercase">
              {isProcessing ? 'Sedang Memproses Foto...' : 'Klik atau Tarik Foto ke Lembar Ini'}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">
              Mendukung file JPG, PNG, WEBP langsung dari Kamera HP / Galeri
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-amber-200 text-xs font-mono font-bold border border-stone-900 shadow-[2px_2px_0px_#C25E34] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>PILIH FOTO DARI PERANGKAT</span>
          </button>
        </div>
      </div>

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="group relative aspect-square border-2 border-stone-800 bg-[#ECE5D8] shadow-[3px_3px_0px_#1C1917] overflow-hidden"
            >
              <img
                src={photo}
                alt={`Foto barang ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Badge foto utama / urutan */}
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-stone-900/90 text-amber-200 font-mono text-[9px] font-bold border border-stone-700">
                {index === 0 ? 'FOTO UTAMA' : `FOTO #${index + 1}`}
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(index);
                }}
                className="absolute top-1.5 right-1.5 w-7 h-7 bg-rose-700 hover:bg-rose-800 text-white flex items-center justify-center shadow-md transition-colors cursor-pointer border border-stone-900"
                title="Hapus foto ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Add more button if slots remain */}
          {photos.length < maxPhotos && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-stone-500 hover:border-stone-900 flex flex-col items-center justify-center gap-1 text-stone-700 hover:text-stone-950 bg-[#FAF7F2] hover:bg-[#ECE5D8] transition-all text-xs font-mono font-bold cursor-pointer"
            >
              <Plus className="w-5 h-5 text-stone-600" />
              <span className="text-[11px]">+ TAMBAH FOTO</span>
            </button>
          )}
        </div>
      )}

      {/* Error notification */}
      {errorMessage && (
        <div className="flex items-start gap-2 p-2.5 bg-rose-50 border-2 border-rose-500 text-xs font-mono font-bold text-rose-800 shadow-[2px_2px_0px_#E11D48]">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Notification if under minimum */}
      {!isRequirementMet && (
        <div className="flex items-start gap-2 p-2.5 bg-amber-50 border-2 border-stone-800 text-xs font-mono font-bold text-stone-900 shadow-[2px_2px_0px_#1C1917]">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Wajib mengunggah minimal <strong>{minPhotos} foto</strong> (Kurang {minPhotos - photos.length} foto lagi). Foto lengkap mempercepat kurasi admin!
          </span>
        </div>
      )}
    </div>
  );
};
