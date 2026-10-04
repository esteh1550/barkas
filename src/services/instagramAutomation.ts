import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ConsignmentItem } from '../types/consignment';
import { calculateListingEstimates, formatRupiah } from '../utils/formatters';
import {
  generateInstagramFeedCaption,
  generateInstagramStoryCaption,
  generateFacebookPageCaption,
} from '../utils/captionGenerator';
import { db, handleFirestoreError, OperationType } from './firebaseService';

export interface InstagramAutoPostConfig {
  enabledOnNewSubmission: boolean;
  enabledOnAdminLive: boolean;
  enabledOnFacebookPage?: boolean;
  webhookUrl: string;
  igBusinessAccountId: string;
  metaAccessToken: string;
  facebookPageId?: string;
  facebookPageAccessToken?: string;
  feedPhotoMode?: 'single' | 'collage';
}

const IG_CONFIG_STORAGE_KEY = 'barkas_ig_autopost_config_v1';
const SETTINGS_COLLECTION = 'settings';
const IG_SETTINGS_DOC_ID = 'instagram_autopost';

export const getInstagramAutoPostConfig = (): InstagramAutoPostConfig => {
  try {
    const saved = localStorage.getItem(IG_CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        feedPhotoMode: 'collage',
        enabledOnFacebookPage: true,
        ...parsed,
      };
    }
  } catch {
    // ignore
  }
  return {
    enabledOnNewSubmission: false,
    enabledOnAdminLive: true,
    enabledOnFacebookPage: true,
    webhookUrl: '',
    igBusinessAccountId: '',
    metaAccessToken: '',
    facebookPageId: '',
    facebookPageAccessToken: '',
    feedPhotoMode: 'collage',
  };
};

export const saveInstagramAutoPostConfig = async (
  config: InstagramAutoPostConfig
): Promise<void> => {
  const cleanConfig: InstagramAutoPostConfig = {
    enabledOnNewSubmission: Boolean(config.enabledOnNewSubmission),
    enabledOnAdminLive: Boolean(config.enabledOnAdminLive),
    enabledOnFacebookPage: config.enabledOnFacebookPage !== false,
    webhookUrl: (config.webhookUrl || '').trim().slice(0, 500),
    igBusinessAccountId: (config.igBusinessAccountId || '').trim().slice(0, 120),
    metaAccessToken: (config.metaAccessToken || '').trim().slice(0, 600),
    facebookPageId: (config.facebookPageId || '').trim().slice(0, 120),
    facebookPageAccessToken: (config.facebookPageAccessToken || '').trim().slice(0, 600),
    feedPhotoMode: config.feedPhotoMode === 'single' ? 'single' : 'collage',
  };

  try {
    localStorage.setItem(IG_CONFIG_STORAGE_KEY, JSON.stringify(cleanConfig));
  } catch {
    // ignore
  }

  const path = `${SETTINGS_COLLECTION}/${IG_SETTINGS_DOC_ID}`;
  try {
    await setDoc(
      doc(db, SETTINGS_COLLECTION, IG_SETTINGS_DOC_ID),
      {
        ...cleanConfig,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

/**
 * Synchronizes Instagram & Facebook Auto-Post Webhook configuration with Firebase Firestore
 * so all devices (/admin on phone, tablet, PC, and public consignment form) share the same Webhook URL.
 */
export const syncInstagramAutoPostConfigWithCloud =
  async (): Promise<InstagramAutoPostConfig> => {
    const localConfig = getInstagramAutoPostConfig();
    const path = `${SETTINGS_COLLECTION}/${IG_SETTINGS_DOC_ID}`;

    try {
      const snap = await getDoc(doc(db, SETTINGS_COLLECTION, IG_SETTINGS_DOC_ID));
      if (snap.exists()) {
        const data = snap.data() as Partial<InstagramAutoPostConfig>;
        const cloudConfig: InstagramAutoPostConfig = {
          enabledOnNewSubmission:
            typeof data.enabledOnNewSubmission === 'boolean'
              ? data.enabledOnNewSubmission
              : localConfig.enabledOnNewSubmission,
          enabledOnAdminLive:
            typeof data.enabledOnAdminLive === 'boolean'
              ? data.enabledOnAdminLive
              : localConfig.enabledOnAdminLive,
          enabledOnFacebookPage:
            typeof data.enabledOnFacebookPage === 'boolean'
              ? data.enabledOnFacebookPage
              : localConfig.enabledOnFacebookPage !== false,
          webhookUrl: (data.webhookUrl || localConfig.webhookUrl || '').trim(),
          igBusinessAccountId: (
            data.igBusinessAccountId ||
            localConfig.igBusinessAccountId ||
            ''
          ).trim(),
          metaAccessToken: (
            data.metaAccessToken ||
            localConfig.metaAccessToken ||
            ''
          ).trim(),
          facebookPageId: (
            data.facebookPageId ||
            localConfig.facebookPageId ||
            ''
          ).trim(),
          facebookPageAccessToken: (
            data.facebookPageAccessToken ||
            localConfig.facebookPageAccessToken ||
            ''
          ).trim(),
          feedPhotoMode:
            data.feedPhotoMode === 'single' ? 'single' : 'collage',
        };

        // If local device has a webhookUrl that wasn't in cloud yet, push it to cloud
        if (!data.webhookUrl && localConfig.webhookUrl.trim()) {
          await saveInstagramAutoPostConfig(cloudConfig);
        } else {
          try {
            localStorage.setItem(IG_CONFIG_STORAGE_KEY, JSON.stringify(cloudConfig));
          } catch {
            // ignore
          }
        }
        return cloudConfig;
      } else if (
        localConfig.webhookUrl.trim() ||
        localConfig.igBusinessAccountId.trim() ||
        localConfig.facebookPageId?.trim()
      ) {
        // First time migration: push existing local config to Firestore Cloud automatically!
        await saveInstagramAutoPostConfig(localConfig);
        return localConfig;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }

    return localConfig;
  };

export interface InstagramPublishResult {
  success: boolean;
  method: 'webhook' | 'graph_api' | 'facebook_direct' | 'none';
  message: string;
  instagramSuccess?: boolean;
  facebookSuccess?: boolean;
  facebookPostId?: string;
}

/**
 * Posts photo & rich caption directly to Facebook Page via Meta Graph API
 */
export const postDirectlyToFacebookPage = async (
  pageId: string,
  accessToken: string,
  caption: string,
  photoUrlOrBase64: string,
  fileName: string = 'consignment-photo.jpg'
): Promise<{ success: boolean; postId?: string; message: string }> => {
  try {
    const cleanToken = accessToken.trim();
    const cleanPageId = pageId.trim();

    if (!cleanPageId || !cleanToken) {
      return { success: false, message: 'Page ID dan Access Token Facebook wajib diisi.' };
    }

    if (photoUrlOrBase64.startsWith('http://') || photoUrlOrBase64.startsWith('https://')) {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${encodeURIComponent(cleanPageId)}/photos`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: photoUrlOrBase64,
            caption,
            access_token: cleanToken,
          }),
        }
      );
      const data = await res.json();
      if (data.id || data.post_id) {
        return {
          success: true,
          postId: data.post_id || data.id,
          message: 'Berhasil diposting ke Facebook Page',
        };
      }
      return {
        success: false,
        message: data.error?.message || 'Gagal memposting ke Facebook Page',
      };
    }

    // Binary / Base64 upload via FormData
    const cleanBase64 = photoUrlOrBase64.includes(';base64,')
      ? photoUrlOrBase64.split(';base64,')[1]
      : photoUrlOrBase64;

    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('source', blob, fileName);
    formData.append('caption', caption);
    formData.append('access_token', cleanToken);

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(cleanPageId)}/photos`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await res.json();
    if (data.id || data.post_id) {
      return {
        success: true,
        postId: data.post_id || data.id,
        message: 'Berhasil diposting ke Facebook Page',
      };
    }
    return {
      success: false,
      message: data.error?.message || 'Gagal memposting ke Facebook Page',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Koneksi ke Facebook Graph API gagal',
    };
  }
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const drawWrappedText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 2
): number => {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  let linesDrawn = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      linesDrawn++;
      if (linesDrawn >= maxLines) {
        ctx.fillText(line.trim() + '...', x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY + lineHeight;
};

/**
 * Generates both the watermarked Feed image and 9:16 Story Poster image on an offscreen canvas
 * so automatic uploads to Make.com / Cloudinary / Instagram always include the official watermark.
 */
export const renderWatermarkedImagesForItem = async (
  item: ConsignmentItem,
  feedPhotoMode: 'single' | 'collage' = 'collage'
): Promise<{ feedDataUrl: string; storyDataUrl: string }> => {
  const rawPhoto = item.photos?.[0] || '';
  if (!rawPhoto || typeof document === 'undefined') {
    return { feedDataUrl: rawPhoto, storyDataUrl: rawPhoto };
  }

  const estimates = calculateListingEstimates(item.nettPrice);
  const hasPriceDrop =
    typeof item.previousNettPrice === 'number' && item.previousNettPrice > item.nettPrice;
  const prevEstimates = hasPriceDrop
    ? calculateListingEstimates(item.previousNettPrice!)
    : null;
  const discountPct = hasPriceDrop
    ? Math.round(((item.previousNettPrice! - item.nettPrice) / item.previousNettPrice!) * 100)
    : 0;
  const priceDropText = hasPriceDrop ? `TURUN HARGA -${discountPct}%` : undefined;
  const isSold =
    item.status === 'Terjual' ||
    item.status === 'Selesai & Dicairkan' ||
    item.postStatus === 'Sold Out';

  // Helper to load an HTMLImageElement safely
  const loadImg = (src: string): Promise<HTMLImageElement | null> =>
    new Promise((res) => {
      if (!src) {
        res(null);
        return;
      }
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => res(image);
      image.onerror = () => res(null);
      image.src = src;
    });

  const extraPhotoUrls =
    feedPhotoMode === 'collage' && Array.isArray(item.photos) && item.photos.length > 1
      ? item.photos.slice(1, 4)
      : [];

  const [mainImg, ...extraImgsLoaded] = await Promise.all([
    loadImg(rawPhoto),
    ...extraPhotoUrls.map((u) => loadImg(u)),
  ]);

  const extraImgs = extraImgsLoaded.filter((im): im is HTMLImageElement => im !== null);

  if (!mainImg) {
    return { feedDataUrl: rawPhoto, storyDataUrl: rawPhoto };
  }

  const img = mainImg;

  return new Promise((resolve) => {
    try {
        // ------------------------------------------------------------
        // 1. RENDER WATERMARKED FEED PHOTO (Clamped to IG 4:5 - 1.91:1)
        // ------------------------------------------------------------
        const feedCanvas = document.createElement('canvas');
        const feedCtx = feedCanvas.getContext('2d');

        const targetWidth = Math.min(Math.max(img.width, 800), 960);
        const scaleRatio = targetWidth / img.width;
        const rawTargetHeight = Math.round(img.height * scaleRatio);
        // Clamp aspect ratio to Instagram's allowed Feed range (0.8 to 1.91)
        const minHeight = Math.round(targetWidth / 1.91);
        const maxHeight = Math.round(targetWidth / 0.8);
        const targetHeight = Math.min(Math.max(rawTargetHeight, minHeight), maxHeight);

        feedCanvas.width = targetWidth;
        feedCanvas.height = targetHeight;

        if (feedCtx) {
          // Draw image object-cover into canvas
          const coverScale = Math.max(targetWidth / img.width, targetHeight / img.height);
          const drawW = img.width * coverScale;
          const drawH = img.height * coverScale;
          const drawX = (targetWidth - drawW) / 2;
          const drawY = (targetHeight - drawH) / 2;
          feedCtx.drawImage(img, drawX, drawY, drawW, drawH);

          // Bottom Gradient Scrim for legibility
          const barHeight = Math.max(Math.round(targetHeight * 0.085), 64);
          const gradient = feedCtx.createLinearGradient(
            0,
            targetHeight - barHeight * 1.6,
            0,
            targetHeight
          );
          gradient.addColorStop(0, 'rgba(15, 23, 42, 0)');
          gradient.addColorStop(0.5, 'rgba(15, 41, 30, 0.82)');
          gradient.addColorStop(1, 'rgba(15, 41, 30, 0.96)');

          feedCtx.fillStyle = gradient;
          feedCtx.fillRect(0, targetHeight - barHeight * 1.6, targetWidth, barHeight * 1.6);

          // Gold Accent Line at very bottom
          const accentHeight = Math.max(Math.round(targetHeight * 0.008), 6);
          feedCtx.fillStyle = '#F59E0B';
          feedCtx.fillRect(0, targetHeight - accentHeight, targetWidth, accentHeight);

          const paddingX = Math.round(targetWidth * 0.035);
          const centerY = targetHeight - Math.round(barHeight * 0.45);

          // Multi-Photo Detail Thumbnails Strip (Foto 2, 3, 4) right above the bottom watermark bar
          if (extraImgs.length > 0 && !isSold) {
            const thumbSize = Math.round(targetWidth * 0.19);
            const thumbGap = Math.round(targetWidth * 0.016);
            const thumbY = targetHeight - barHeight - thumbSize - Math.round(targetHeight * 0.018);

            extraImgs.forEach((detailImg, idx) => {
              const thumbX =
                targetWidth -
                paddingX -
                (extraImgs.length - idx) * thumbSize -
                (extraImgs.length - 1 - idx) * thumbGap;

              // Subtle dark backing shadow
              feedCtx.save();
              feedCtx.fillStyle = 'rgba(15, 41, 30, 0.92)';
              drawRoundedRect(feedCtx, thumbX - 3, thumbY - 3, thumbSize + 6, thumbSize + 6, 14);
              feedCtx.fill();

              drawRoundedRect(feedCtx, thumbX, thumbY, thumbSize, thumbSize, 12);
              feedCtx.clip();

              const tScale = Math.max(
                thumbSize / detailImg.width,
                thumbSize / detailImg.height
              );
              const tW = detailImg.width * tScale;
              const tH = detailImg.height * tScale;
              const tX = thumbX + (thumbSize - tW) / 2;
              const tY = thumbY + (thumbSize - tH) / 2;
              feedCtx.drawImage(detailImg, tX, tY, tW, tH);
              feedCtx.restore();

              // Gold border around detail thumbnail
              feedCtx.strokeStyle = '#FBBF24';
              feedCtx.lineWidth = 3;
              drawRoundedRect(feedCtx, thumbX, thumbY, thumbSize, thumbSize, 12);
              feedCtx.stroke();

              // Small label pill "Foto #2" etc.
              const labelW = Math.round(thumbSize * 0.56);
              const labelH = Math.round(thumbSize * 0.22);
              feedCtx.fillStyle = 'rgba(15, 41, 30, 0.9)';
              drawRoundedRect(
                feedCtx,
                thumbX + 6,
                thumbY + thumbSize - labelH - 6,
                labelW,
                labelH,
                6
              );
              feedCtx.fill();
              feedCtx.fillStyle = '#FDE68A';
              feedCtx.font = `bold ${Math.max(Math.round(labelH * 0.62), 11)}px system-ui, sans-serif`;
              feedCtx.textAlign = 'center';
              feedCtx.textBaseline = 'middle';
              feedCtx.fillText(
                `Foto ${idx + 2}`,
                thumbX + 6 + labelW / 2,
                thumbY + thumbSize - labelH / 2 - 6
              );
            });
          }

          // Left Text: @info.barkasmajalengka + Kecamatan
          const fontSizeBrand = Math.max(Math.round(targetWidth * 0.025), 20);
          feedCtx.font = `bold ${fontSizeBrand}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
          feedCtx.fillStyle = '#FFFFFF';
          feedCtx.textBaseline = 'middle';
          feedCtx.textAlign = 'left';

          const leftLabel = item.kecamatan
            ? `@info.barkasmajalengka  •  COD ${item.kecamatan}`
            : '@info.barkasmajalengka  •  Titip Jual Majalengka';
          feedCtx.fillText(leftLabel, paddingX, centerY);

          // Right Pill Badge: Ticket ID (#BM-2026-XXXX)
          const fontSizeTicket = Math.max(Math.round(targetWidth * 0.022), 16);
          feedCtx.font = `bold ${fontSizeTicket}px monospace`;
          const ticketText = `${item.id}`;
          const textMetrics = feedCtx.measureText(ticketText);
          const badgePadX = Math.round(fontSizeTicket * 0.7);
          const badgePadY = Math.round(fontSizeTicket * 0.45);
          const badgeW = textMetrics.width + badgePadX * 2;
          const badgeH = fontSizeTicket + badgePadY * 2;
          const badgeX = targetWidth - paddingX - badgeW;
          const badgeY = centerY - badgeH / 2;

          feedCtx.fillStyle = 'rgba(245, 158, 11, 0.22)';
          feedCtx.strokeStyle = '#FBBF24';
          feedCtx.lineWidth = 2.5;
          drawRoundedRect(feedCtx, badgeX, badgeY, badgeW, badgeH, 10);
          feedCtx.fill();
          feedCtx.stroke();

          feedCtx.fillStyle = '#FDE68A';
          feedCtx.textAlign = 'center';
          feedCtx.fillText(ticketText, badgeX + badgeW / 2, centerY);

          // Top-Right Price Tag Pill on Feed Photo
          const priceFontSize = Math.max(Math.round(targetWidth * 0.026), 20);
          feedCtx.font = `900 ${priceFontSize}px monospace`;
          const priceLabel = formatRupiah(estimates.suggestedListingPrice);
          const priceMetrics = feedCtx.measureText(priceLabel);
          const priceW = priceMetrics.width + priceFontSize * 1.5;
          const priceH = priceFontSize * 1.9;
          const priceX = targetWidth - paddingX - priceW;
          const priceY = paddingX;

          feedCtx.fillStyle = 'rgba(15, 41, 30, 0.92)';
          feedCtx.strokeStyle = '#FBBF24';
          feedCtx.lineWidth = 2.5;
          drawRoundedRect(feedCtx, priceX, priceY, priceW, priceH, 12);
          feedCtx.fill();
          feedCtx.stroke();

          feedCtx.fillStyle = '#FBBF24';
          feedCtx.textAlign = 'center';
          feedCtx.textBaseline = 'middle';
          feedCtx.fillText(priceLabel, priceX + priceW / 2, priceY + priceH / 2);

          // Top-Left Price Drop Badge (if active)
          if (priceDropText && !isSold) {
            const dropFontSize = Math.max(Math.round(targetWidth * 0.024), 18);
            feedCtx.font = `900 ${dropFontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
            const dropMetrics = feedCtx.measureText(priceDropText);
            const dropW = dropMetrics.width + dropFontSize * 1.6;
            const dropH = dropFontSize * 2.0;
            const dropX = paddingX;
            const dropY = paddingX;

            feedCtx.fillStyle = 'rgba(225, 29, 72, 0.94)';
            feedCtx.strokeStyle = '#FECDD3';
            feedCtx.lineWidth = 2.5;
            drawRoundedRect(feedCtx, dropX, dropY, dropW, dropH, 12);
            feedCtx.fill();
            feedCtx.stroke();

            feedCtx.fillStyle = '#FFFFFF';
            feedCtx.textAlign = 'center';
            feedCtx.textBaseline = 'middle';
            feedCtx.fillText(priceDropText, dropX + dropW / 2, dropY + dropH / 2);
          }

          // Diagonal "TERJUAL / SOLD OUT" Stamp Overlay (if sold)
          if (isSold) {
            feedCtx.fillStyle = 'rgba(15, 23, 42, 0.48)';
            feedCtx.fillRect(0, 0, targetWidth, targetHeight - barHeight * 1.1);

            feedCtx.save();
            feedCtx.translate(targetWidth / 2, targetHeight / 2 - barHeight * 0.3);
            feedCtx.rotate((-16 * Math.PI) / 180);

            const stampW = Math.round(targetWidth * 0.78);
            const stampH = Math.round(targetWidth * 0.22);

            feedCtx.fillStyle = 'rgba(220, 38, 38, 0.92)';
            feedCtx.strokeStyle = '#FEF08A';
            feedCtx.lineWidth = Math.max(Math.round(targetWidth * 0.008), 5);
            drawRoundedRect(feedCtx, -stampW / 2, -stampH / 2, stampW, stampH, 18);
            feedCtx.fill();
            feedCtx.stroke();

            const mainStampFont = Math.max(Math.round(targetWidth * 0.072), 36);
            feedCtx.font = `900 ${mainStampFont}px "Plus Jakarta Sans", system-ui, sans-serif`;
            feedCtx.fillStyle = '#FFFFFF';
            feedCtx.textAlign = 'center';
            feedCtx.textBaseline = 'middle';
            feedCtx.fillText('TERJUAL / SOLD', 0, -Math.round(stampH * 0.11));

            const subStampFont = Math.max(Math.round(targetWidth * 0.025), 14);
            feedCtx.font = `bold ${subStampFont}px "Plus Jakarta Sans", system-ui, sans-serif`;
            feedCtx.fillStyle = '#FEF08A';
            feedCtx.fillText(
              'ALHAMDULILLAH • @info.barkasmajalengka',
              0,
              Math.round(stampH * 0.26)
            );
            feedCtx.restore();
          }
        }

        const feedDataUrl = feedCanvas.toDataURL('image/jpeg', 0.82);

        // ------------------------------------------------------------
        // 2. RENDER 9:16 INSTAGRAM STORY POSTER (1080 x 1920)
        // ------------------------------------------------------------
        const storyCanvas = document.createElement('canvas');
        const storyCtx = storyCanvas.getContext('2d');
        const W = 1080;
        const H = 1920;
        storyCanvas.width = W;
        storyCanvas.height = H;

        if (storyCtx) {
          const bgGrad = storyCtx.createLinearGradient(0, 0, 0, H);
          bgGrad.addColorStop(0, '#0F291E');
          bgGrad.addColorStop(0.6, '#133426');
          bgGrad.addColorStop(1, '#091A13');
          storyCtx.fillStyle = bgGrad;
          storyCtx.fillRect(0, 0, W, H);

          storyCtx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
          storyCtx.lineWidth = 3;
          drawRoundedRect(storyCtx, 44, 44, W - 88, H - 88, 36);
          storyCtx.stroke();

          storyCtx.textAlign = 'center';
          storyCtx.fillStyle = '#FBBF24';
          storyCtx.font = 'bold 24px "Plus Jakarta Sans", system-ui, sans-serif';
          storyCtx.fillText('ETALASE RESMI BARANG TITIPAN TERKURASI', W / 2, 118);

          storyCtx.fillStyle = '#FFFFFF';
          storyCtx.font = '900 48px "Plus Jakarta Sans", system-ui, sans-serif';
          storyCtx.fillText('@info.barkasmajalengka', W / 2, 176);

          const imgBoxX = 100;
          const imgBoxY = 250;
          const imgBoxSize = 880;

          storyCtx.save();
          drawRoundedRect(storyCtx, imgBoxX, imgBoxY, imgBoxSize, imgBoxSize, 32);
          storyCtx.fillStyle = '#1E293B';
          storyCtx.fill();
          storyCtx.clip();

          const sScale = Math.max(imgBoxSize / img.width, imgBoxSize / img.height);
          const sDrawW = img.width * sScale;
          const sDrawH = img.height * sScale;
          const sDrawX = imgBoxX + (imgBoxSize - sDrawW) / 2;
          const sDrawY = imgBoxY + (imgBoxSize - sDrawH) / 2;
          storyCtx.drawImage(img, sDrawX, sDrawY, sDrawW, sDrawH);
          storyCtx.restore();

          storyCtx.strokeStyle = '#F59E0B';
          storyCtx.lineWidth = 4;
          drawRoundedRect(storyCtx, imgBoxX, imgBoxY, imgBoxSize, imgBoxSize, 32);
          storyCtx.stroke();

          storyCtx.fillStyle = 'rgba(15, 41, 30, 0.92)';
          drawRoundedRect(storyCtx, imgBoxX + 24, imgBoxY + 24, 260, 58, 16);
          storyCtx.fill();
          storyCtx.strokeStyle = '#FBBF24';
          storyCtx.lineWidth = 2;
          storyCtx.stroke();

          storyCtx.fillStyle = '#FBBF24';
          storyCtx.textAlign = 'center';
          storyCtx.font = 'bold 26px monospace';
          storyCtx.fillText(item.id, imgBoxX + 154, imgBoxY + 62);

          if (priceDropText) {
            storyCtx.fillStyle = '#E11D48';
            drawRoundedRect(storyCtx, imgBoxX + imgBoxSize - 330, imgBoxY + 24, 306, 58, 16);
            storyCtx.fill();
            storyCtx.fillStyle = '#FFFFFF';
            storyCtx.font = '900 24px "Plus Jakarta Sans", system-ui, sans-serif';
            storyCtx.fillText(priceDropText, imgBoxX + imgBoxSize - 177, imgBoxY + 61);
          }

          storyCtx.textAlign = 'center';
          storyCtx.fillStyle = '#FBBF24';
          storyCtx.font = 'bold 26px "Plus Jakarta Sans", system-ui, sans-serif';
          const metaLine = `${item.category || 'Preloved'}  ·  Size ${item.size || 'All Size'}  ·  ${item.condition || 'Siap Pakai'}`;
          storyCtx.fillText(metaLine, W / 2, 1195);

          storyCtx.fillStyle = '#FFFFFF';
          storyCtx.font = '900 44px "Plus Jakarta Sans", system-ui, sans-serif';
          const nextY = drawWrappedText(
            storyCtx,
            item.itemNameAndBrand.toUpperCase(),
            W / 2,
            1260,
            860,
            54,
            2
          );

          storyCtx.fillStyle = '#D6D3D1';
          storyCtx.font = '600 28px "Plus Jakarta Sans", system-ui, sans-serif';
          storyCtx.fillText(
            `Lokasi Barang: Kec. ${item.kecamatan || 'Majalengka'}, Kab. Majalengka`,
            W / 2,
            nextY + 18
          );

          const priceBoxX = 100;
          const priceBoxY = 1435;
          const priceBoxW = 880;
          const priceBoxH = 220;

          storyCtx.fillStyle = '#F6F3EC';
          drawRoundedRect(storyCtx, priceBoxX, priceBoxY, priceBoxW, priceBoxH, 28);
          storyCtx.fill();
          storyCtx.strokeStyle = '#F59E0B';
          storyCtx.lineWidth = 4;
          storyCtx.stroke();

          if (
            prevEstimates &&
            prevEstimates.suggestedListingPrice > estimates.suggestedListingPrice
          ) {
            storyCtx.fillStyle = '#E11D48';
            storyCtx.font = '800 24px "Plus Jakarta Sans", system-ui, sans-serif';
            storyCtx.fillText(
              `HARGA AWAL: ${formatRupiah(prevEstimates.suggestedListingPrice)} (PROMO PRICE DROP)`,
              W / 2,
              priceBoxY + 58
            );

            storyCtx.fillStyle = '#0F291E';
            storyCtx.font = '900 68px monospace';
            storyCtx.fillText(
              formatRupiah(estimates.suggestedListingPrice),
              W / 2,
              priceBoxY + 138
            );
          } else {
            storyCtx.fillStyle = '#57534E';
            storyCtx.font = 'bold 24px "Plus Jakarta Sans", system-ui, sans-serif';
            storyCtx.fillText('HARGA ETALASE SIAP PAKAI', W / 2, priceBoxY + 62);

            storyCtx.fillStyle = '#0F291E';
            storyCtx.font = '900 70px monospace';
            storyCtx.fillText(
              formatRupiah(estimates.suggestedListingPrice),
              W / 2,
              priceBoxY + 142
            );
          }

          storyCtx.fillStyle = '#047857';
          storyCtx.font = 'bold 23px "Plus Jakarta Sans", system-ui, sans-serif';
          storyCtx.fillText(
            'Bisa Rekber Admin Esteh / COD Area Majalengka',
            W / 2,
            priceBoxY + 190
          );

          storyCtx.fillStyle = '#FBBF24';
          storyCtx.font = '800 28px "Plus Jakarta Sans", system-ui, sans-serif';
          storyCtx.fillText(
            'MINAT? BALAS STORY INI ATAU WA ADMIN: 0851-8726-6629',
            W / 2,
            1745
          );

          storyCtx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          storyCtx.font = '500 22px "Plus Jakarta Sans", system-ui, sans-serif';
          storyCtx.fillText(
            `Sebutkan Kode Tiket ${item.id} saat menghubungi Admin Esteh`,
            W / 2,
            1795
          );
        }

        const storyDataUrl = storyCanvas.toDataURL('image/jpeg', 0.80);
        resolve({ feedDataUrl, storyDataUrl });
      } catch {
        resolve({ feedDataUrl: rawPhoto, storyDataUrl: rawPhoto });
      }
  });
};

/**
 * Sends item data, captions, and WATERMARKED image payload to Make.com / Zapier / n8n Webhook
 * or Meta Instagram Graph API for automatic Feed + Story publishing.
 */
export const triggerInstagramAutoPublish = async (
  item: ConsignmentItem,
  triggerSource: 'new_submission' | 'admin_live' | 'manual_button',
  customStoryDataUrl?: string
): Promise<InstagramPublishResult> => {
  let config = getInstagramAutoPostConfig();
  if (!config.webhookUrl.trim() && !config.igBusinessAccountId.trim()) {
    config = await syncInstagramAutoPostConfigWithCloud();
  }

  if (triggerSource === 'new_submission' && !config.enabledOnNewSubmission) {
    return {
      success: false,
      method: 'none',
      message: 'Auto-post saat submit form belum diaktifkan.',
    };
  }

  if (triggerSource === 'admin_live' && !config.enabledOnAdminLive) {
    return {
      success: false,
      method: 'none',
      message: 'Auto-post saat status Live belum diaktifkan.',
    };
  }

  const estimates = calculateListingEstimates(item.nettPrice);
  const feedCaption = generateInstagramFeedCaption(item);
  const storyCaption = generateInstagramStoryCaption(item);
  const cleanTicket = item.id.replace(/^#/, '');
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://barkas-two.vercel.app';
  const catalogUrl = `${origin}/?item=${encodeURIComponent(cleanTicket)}`;
  const facebookCaption = generateFacebookPageCaption(item, catalogUrl);

  // Automatically render watermarked Feed (with multi-photo detail thumbnails) & 9:16 Story images on canvas before sending
  const rendered = await renderWatermarkedImagesForItem(item, config.feedPhotoMode || 'collage');
  const rawCoverPhoto = rendered.feedDataUrl || item.photos?.[0] || '';
  const rawStoryPoster = customStoryDataUrl || rendered.storyDataUrl || rawCoverPhoto;
  const cleanCoverBase64 = rawCoverPhoto.includes(';base64,')
    ? rawCoverPhoto.split(';base64,')[1]
    : rawCoverPhoto;
  const cleanStoryBase64 = rawStoryPoster.includes(';base64,')
    ? rawStoryPoster.split(';base64,')[1]
    : rawStoryPoster;

  const shouldPublishFacebook = config.enabledOnFacebookPage !== false;

  // 1. If Webhook URL (Make.com / Zapier / n8n) is configured
  if (config.webhookUrl.trim()) {
    try {
      const response = await fetch(config.webhookUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'social_auto_publish',
          legacyEvent: 'instagram_auto_publish',
          triggerSource,
          timestamp: new Date().toISOString(),
          ticketId: item.id,
          itemNameAndBrand: item.itemNameAndBrand,
          category: item.category,
          size: item.size,
          condition: item.condition,
          kecamatan: item.kecamatan,
          nettPrice: item.nettPrice,
          listingPrice: estimates.suggestedListingPrice,
          listingPriceFormatted: formatRupiah(estimates.suggestedListingPrice),
          feedCaption,
          storyCaption,
          facebookCaption,
          facebookPageCaption: facebookCaption,
          publishToInstagram: true,
          publishToFacebook: shouldPublishFacebook,
          facebookPageId: config.facebookPageId || '',
          platforms: ['instagram', shouldPublishFacebook ? 'facebook' : null].filter(Boolean),
          catalogUrl,
          coverPhotoBase64: rawCoverPhoto,
          coverPhotoCleanBase64: cleanCoverBase64,
          storyPosterBase64: rawStoryPoster,
          storyPosterCleanBase64: cleanStoryBase64,
          photosCount: item.photos?.length || 0,
        }),
      });

      if (response.ok) {
        const dest = shouldPublishFacebook
          ? 'Instagram (Feed & Story) dan Halaman Facebook (Page)'
          : 'Instagram (Feed & Story)';
        return {
          success: true,
          method: 'webhook',
          instagramSuccess: true,
          facebookSuccess: shouldPublishFacebook,
          message: `✅ Otomatis terkirim ke Webhook ${dest} untuk ${item.id}!`,
        };
      }
      return {
        success: false,
        method: 'webhook',
        message: `⚠️ Webhook merespons dengan status ${response.status}. Periksa skenario Make.com/Zapier Anda.`,
      };
    } catch (err: any) {
      return {
        success: false,
        method: 'webhook',
        message: `⚠️ Gagal menghubungi Webhook: ${err?.message || 'Koneksi terputus'}`,
      };
    }
  }

  // 2. Direct Meta Graph API (Instagram and/or Facebook Page)
  const hasIgConfig = Boolean(config.igBusinessAccountId.trim() && config.metaAccessToken.trim());
  const fbToken = (config.facebookPageAccessToken || config.metaAccessToken || '').trim();
  const hasFbConfig = Boolean(shouldPublishFacebook && config.facebookPageId?.trim() && fbToken);

  if (hasIgConfig || hasFbConfig) {
    let igSuccess = false;
    let igErrorMsg = '';
    let fbSuccess = false;
    let fbErrorMsg = '';
    let fbPostId: string | undefined;

    // A. Post to Facebook Page (Supports direct Base64 upload or public URL!)
    if (hasFbConfig) {
      try {
        const fbRes = await postDirectlyToFacebookPage(
          config.facebookPageId!.trim(),
          fbToken,
          facebookCaption,
          rawCoverPhoto,
          `${cleanTicket}.jpg`
        );
        if (fbRes.success) {
          fbSuccess = true;
          fbPostId = fbRes.postId;
        } else {
          fbErrorMsg = fbRes.message;
        }
      } catch (fbErr: any) {
        fbErrorMsg = fbErr?.message || 'Gagal posting ke Facebook Page';
      }
    }

    // B. Post to Instagram Feed & Story (Requires public URL)
    if (hasIgConfig) {
      const firstPhoto = item.photos?.[0] || '';
      if (!firstPhoto.startsWith('http')) {
        igErrorMsg = 'Instagram API butuh URL gambar publik (Gunakan Webhook Make.com untuk foto lokal/Base64)';
      } else {
        try {
          const igUserId = config.igBusinessAccountId.trim();
          const accessToken = config.metaAccessToken.trim();

          // Feed container
          const feedCreateRes = await fetch(
            `https://graph.facebook.com/v19.0/${encodeURIComponent(igUserId)}/media`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image_url: firstPhoto,
                caption: feedCaption,
                access_token: accessToken,
              }),
            }
          );
          const feedCreateData = await feedCreateRes.json();
          if (feedCreateData.id) {
            await fetch(
              `https://graph.facebook.com/v19.0/${encodeURIComponent(igUserId)}/media_publish`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  creation_id: feedCreateData.id,
                  access_token: accessToken,
                }),
              }
            );
          }

          // Story container
          const storyCreateRes = await fetch(
            `https://graph.facebook.com/v19.0/${encodeURIComponent(igUserId)}/media`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image_url: firstPhoto,
                media_type: 'STORIES',
                access_token: accessToken,
              }),
            }
          );
          const storyCreateData = await storyCreateRes.json();
          if (storyCreateData.id) {
            await fetch(
              `https://graph.facebook.com/v19.0/${encodeURIComponent(igUserId)}/media_publish`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  creation_id: storyCreateData.id,
                  access_token: accessToken,
                }),
              }
            );
          }
          igSuccess = true;
        } catch (igErr: any) {
          igErrorMsg = igErr?.message || 'Error API Instagram';
        }
      }
    }

    if (igSuccess && fbSuccess) {
      return {
        success: true,
        method: 'graph_api',
        instagramSuccess: true,
        facebookSuccess: true,
        facebookPostId: fbPostId,
        message: '✅ Berhasil diposting otomatis ke Instagram Feed/Story DAN Halaman Facebook!',
      };
    } else if (fbSuccess && !hasIgConfig) {
      return {
        success: true,
        method: 'facebook_direct',
        facebookSuccess: true,
        facebookPostId: fbPostId,
        message: '✅ Berhasil diposting otomatis ke Halaman Facebook!',
      };
    } else if (fbSuccess && !igSuccess) {
      return {
        success: true,
        method: 'facebook_direct',
        facebookSuccess: true,
        instagramSuccess: false,
        facebookPostId: fbPostId,
        message: `✅ Berhasil diposting ke Halaman Facebook! (Instagram: ${igErrorMsg})`,
      };
    } else if (igSuccess && !fbSuccess && hasFbConfig) {
      return {
        success: true,
        method: 'graph_api',
        instagramSuccess: true,
        facebookSuccess: false,
        message: `✅ Berhasil ke Instagram Feed & Story! (FB: ${fbErrorMsg})`,
      };
    } else if (igSuccess) {
      return {
        success: true,
        method: 'graph_api',
        instagramSuccess: true,
        message: '✅ Berhasil diposting otomatis ke IG Feed & Story (@info.barkasmajalengka)!',
      };
    } else {
      const combinedError = [
        hasFbConfig ? `FB: ${fbErrorMsg || 'Gagal'}` : null,
        hasIgConfig ? `IG: ${igErrorMsg || 'Gagal'}` : null,
      ]
        .filter(Boolean)
        .join(' | ');
      return {
        success: false,
        method: 'graph_api',
        message: `⚠️ Gagal auto-post Meta Graph API: ${combinedError || 'Periksa token & izin'}`,
      };
    }
  }

  return {
    success: false,
    method: 'none',
    message: 'Silakan atur Webhook Make.com atau Meta Graph API (Instagram / Facebook Page) terlebih dahulu.',
  };
};
