/**
 * Image Watermarking Utility using HTML Canvas
 * Automatically adds the "info.barkasmajalengka" watermark to consignment photos
 */

export interface WatermarkOptions {
  watermarkText?: string;
  subText?: string;
  position?: 'bottom-right' | 'bottom-center' | 'center';
  badgeStyle?: 'modern-pill' | 'subtle-stamp' | 'center-diagonal';
  priceDropText?: string;
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

      // 7. Optional Price Drop badge on top-right
      if (options.priceDropText) {
        const pdFontSize = Math.round(20 * scale);
        ctx.font = `800 ${pdFontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
        const pdTextWidth = ctx.measureText(options.priceDropText).width;
        const pdW = pdTextWidth + 32 * scale;
        const pdH = pdFontSize + 20 * scale;
        const pdX = canvas.width - pdW - 24 * scale;
        const pdY = 24 * scale;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 12 * scale;
        ctx.fillStyle = '#E11D48'; // Rose-600
        ctx.beginPath();
        ctx.roundRect(pdX, pdY, pdW, pdH, 12 * scale);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 2 * scale;
        ctx.strokeStyle = '#FDE68A';
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.textBaseline = 'middle';
        ctx.fillText(options.priceDropText, pdX + 16 * scale, pdY + pdH / 2);
      }

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
 * Generate a bold "SOLD OUT / TERJUAL" stamp overlay on an item photo for Instagram Story/Feed social proof
 */
export const applySoldOutStamp = (
  imageUrl: string,
  itemTitle: string,
  ticketId: string,
  kecamatan: string = 'Majalengka'
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageUrl);
        return;
      }

      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      // 1. Draw base image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 2. Darken overlay slightly so the SOLD OUT stamp pops dramatically
      ctx.fillStyle = 'rgba(15, 23, 42, 0.42)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const baseDim = Math.min(canvas.width, canvas.height);
      const scale = Math.max(0.65, baseDim / 1000);

      // 3. Draw Diagonal "TERJUAL / SOLD OUT" Stamp in Center
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2 - 20 * scale);
      ctx.rotate((-12 * Math.PI) / 180);

      const stampWidth = Math.min(canvas.width * 0.84, 680 * scale);
      const stampHeight = 165 * scale;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowBlur = 28 * scale;
      ctx.shadowOffsetY = 10 * scale;

      // Rich Crimson Red with Gold/White Double Border
      ctx.fillStyle = 'rgba(225, 29, 72, 0.94)';
      ctx.beginPath();
      ctx.roundRect(-stampWidth / 2, -stampHeight / 2, stampWidth, stampHeight, 20 * scale);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 5 * scale;
      ctx.strokeStyle = '#FDE68A';
      ctx.stroke();

      // Inner dashed border
      ctx.setLineDash([12 * scale, 8 * scale]);
      ctx.lineWidth = 2 * scale;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.roundRect(
        -stampWidth / 2 + 12 * scale,
        -stampHeight / 2 + 12 * scale,
        stampWidth - 24 * scale,
        stampHeight - 24 * scale,
        14 * scale
      );
      ctx.stroke();
      ctx.setLineDash([]);

      // Main SOLD OUT headline
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${Math.round(58 * scale)}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillText('TERJUAL / SOLD', 0, -16 * scale);

      // Sub-banner inside stamp
      ctx.fillStyle = '#FDE68A';
      ctx.font = `800 ${Math.round(22 * scale)}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillText(`ALHAMDULILLAH • ${ticketId.toUpperCase()}`, 0, 42 * scale);

      ctx.restore();

      // 4. Bottom Navy Banner with Item Name & @info.barkasmajalengka Branding
      ctx.save();
      const footerH = 115 * scale;
      const footerY = canvas.height - footerH - 24 * scale;
      const footerW = canvas.width - 48 * scale;
      const footerX = 24 * scale;

      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 20 * scale;
      ctx.fillStyle = 'rgba(27, 54, 93, 0.95)';
      ctx.beginPath();
      ctx.roundRect(footerX, footerY, footerW, footerH, 18 * scale);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 2.5 * scale;
      ctx.strokeStyle = '#F59E0B';
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#FDE68A';
      ctx.font = `800 ${Math.round(20 * scale)}px "Plus Jakarta Sans", system-ui, sans-serif`;
      const cleanTitle =
        itemTitle.length > 38 ? `${itemTitle.slice(0, 38)}...` : itemTitle;
      ctx.fillText(`✓ ${cleanTitle.toUpperCase()}`, canvas.width / 2, footerY + 38 * scale);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `700 ${Math.round(24 * scale)}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.fillText(
        `LAKU VIA @info.barkasmajalengka • Kec. ${kecamatan}`,
        canvas.width / 2,
        footerY + 78 * scale
      );
      ctx.restore();

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => resolve(imageUrl);
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
