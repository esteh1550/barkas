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
  minPhotos = 3,
  maxPhotos = 8,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
          const maxDim = 1200;

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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
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

    try {
      const remainingSlots = maxPhotos - photos.length;
      if (remainingSlots <= 0) {
        alert(`Batas maksimal foto adalah ${maxPhotos} foto.`);
        return;
      }

      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      const newPhotoPromises = filesToProcess.map((file) => compressImage(file));
      const newPhotos = await Promise.all(newPhotoPromises);

      onChange([...photos, ...newPhotos]);
    } catch (err) {
      console.error('Gagal memproses foto:', err);
      alert('Terjadi kesalahan saat memproses foto. Silakan coba lagi.');
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
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-800">
          Upload Foto Barang <span className="text-rose-500">*</span>
        </label>
        <span
          className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium ${
            isRequirementMet
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}
        >
          {isRequirementMet ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          )}
          <span>
            {photos.length}/{minPhotos} Foto (Min. {minPhotos})
          </span>
        </span>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">
        Foto jelas dari berbagai sisi: <span className="font-medium text-slate-700">Tampak Depan, Belakang/Samping, Tag/Merk, dan Detail Minus (jika ada)</span>. Pencahayaan terang sangat membantu proses kurasi!
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
        className={`relative border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-amber-500 bg-amber-50/70 scale-[0.99]'
            : 'border-slate-300 hover:border-[#1B365D] hover:bg-slate-50/80 bg-white'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-[#1B365D] group-hover:scale-110 transition-transform">
            <UploadCloud className="w-6 h-6 text-[#1B365D]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              {isProcessing ? 'Sedang memproses foto...' : 'Klik atau Tarik Foto ke Sini'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Mendukung file JPG, PNG, WEBP dari Galeri atau Kamera HP
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1B365D] hover:bg-[#24477A] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pilih Foto dari Perangkat</span>
          </button>
        </div>
      </div>

      {/* Photo Previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="group relative aspect-square rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-xs hover:border-[#1B365D] transition-all"
            >
              <img
                src={photo}
                alt={`Foto barang ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Badge foto utama / urutan */}
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-white rounded">
                {index === 0 ? 'Foto Utama' : `Foto #${index + 1}`}
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(index);
                }}
                className="absolute top-1.5 right-1.5 w-7 h-7 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg flex items-center justify-center shadow-md transition-colors"
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
              className="aspect-square border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-amber-700 bg-slate-50/50 hover:bg-amber-50/30 transition-all text-xs"
            >
              <Plus className="w-5 h-5 text-slate-400" />
              <span className="font-medium text-[11px]">Tambah Foto</span>
            </button>
          )}
        </div>
      )}

      {/* Notification if under minimum */}
      {!isRequirementMet && (
        <div className="flex items-start gap-2 p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Wajib mengunggah minimal <strong>{minPhotos} foto</strong> (Kurang {minPhotos - photos.length} foto lagi). Foto lengkap mempercepat kurasi admin!
          </span>
        </div>
      )}
    </div>
  );
};
