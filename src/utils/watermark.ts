/**
 * Image Watermarking Utility using HTML Canvas
 * Automatically adds the "info.barkasmajalengka" watermark to consignment photos
 */

export interface WatermarkOptions {
  watermarkText?: string;
  subText?: string;
  position?: 'bottom-right' | 'bottom-center' | 'center';
  badgeStyle?: 'modern-pill' | 'subtle-stamp' | 'center-diagonal';
}

export const applyWatermark = (
  imageUrl: string,
  options: WatermarkOptions = {}
): Promise<string> => {
  const {
    watermarkText = 'info.barkasmajalengka',
    subText = 'Titip Jual Barang Bekas Berkualitas',
    position = 'bottom-right',
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageUrl);
        return;
      }

      // Preserve native image dimensions for crystal clear posting quality
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      // Draw base image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Responsive sizing based on image resolution
      const baseDim = Math.min(canvas.width, canvas.height);
      const scale = Math.max(0.6, baseDim / 1000);

      const fontSize = Math.round(26 * scale);
      const subFontSize = Math.round(13 * scale);
      const paddingX = Math.round(22 * scale);
      const paddingY = Math.round(14 * scale);
      const borderRadius = Math.round(16 * scale);

      ctx.save();

      // Configure font
      ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      const mainTextWidth = ctx.measureText(watermarkText).width;
      ctx.font = `500 ${subFontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      const subTextWidth = ctx.measureText(subText).width;

      const badgeWidth = Math.max(mainTextWidth, subTextWidth) + paddingX * 2 + (30 * scale);
      const badgeHeight = fontSize + subFontSize + paddingY * 2 + (8 * scale);

      let badgeX = canvas.width - badgeWidth - (30 * scale);
      let badgeY = canvas.height - badgeHeight - (30 * scale);

      if (position === 'bottom-center') {
        badgeX = (canvas.width - badgeWidth) / 2;
      } else if (position === 'center') {
        badgeX = (canvas.width - badgeWidth) / 2;
        badgeY = (canvas.height - badgeHeight) / 2;
      }

      // 1. Draw modern dark glass pill with drop shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 18 * scale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 6 * scale;

      // Badge background (Navy Blue #1B365D with 88% opacity)
      ctx.fillStyle = 'rgba(27, 54, 93, 0.88)';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, borderRadius);
      ctx.fill();

      // 2. Draw subtle gold border
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = Math.max(1.5, 2 * scale);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)'; // Amber/Gold accent
      ctx.stroke();

      // 3. Draw Gold icon dot / accent emblem
      const iconSize = 14 * scale;
      const iconX = badgeX + paddingX;
      const iconY = badgeY + paddingY + (fontSize / 2);

      ctx.beginPath();
      ctx.arc(iconX + iconSize / 2, iconY, iconSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(iconX + iconSize / 2, iconY, (iconSize / 2) + (3 * scale), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(253, 230, 138, 0.4)';
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();

      // 4. Draw Main Watermark Text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      ctx.textBaseline = 'middle';
      const textStartX = iconX + iconSize + (12 * scale);
      ctx.fillText(watermarkText, textStartX, iconY);

      // 5. Draw Subtext (Tagline)
      ctx.fillStyle = '#FDE68A'; // Soft gold
      ctx.font = `600 ${subFontSize}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      ctx.fillText(subText, textStartX, iconY + (fontSize / 2) + (10 * scale));

      // 6. Draw subtle corner stamp on top-left for extra theft protection
      const stampFontSize = Math.round(14 * scale);
      ctx.font = `bold ${stampFontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4 * scale;
      ctx.fillText('✓ VERIFIED BY BARKASMAJALENGKA', 24 * scale, 32 * scale);

      ctx.restore();

      // Export high quality JPEG
      const resultDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      resolve(resultDataUrl);
    };

    img.onerror = (err) => {
      console.error('Failed to load image for watermarking:', err);
      reject(err);
    };

    img.src = imageUrl;
  });
};

/**
 * Download a data URL as an image file
 */
export const downloadImageFile = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
