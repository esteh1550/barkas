import { ConsignmentItem } from '../types/consignment';
import { calculateListingEstimates, formatRupiah } from '../utils/formatters';
import {
  generateInstagramFeedCaption,
  generateInstagramStoryCaption,
} from '../utils/captionGenerator';

export interface InstagramAutoPostConfig {
  enabledOnNewSubmission: boolean;
  enabledOnAdminLive: boolean;
  webhookUrl: string;
  igBusinessAccountId: string;
  metaAccessToken: string;
}

const IG_CONFIG_STORAGE_KEY = 'barkas_ig_autopost_config_v1';

export const getInstagramAutoPostConfig = (): InstagramAutoPostConfig => {
  try {
    const saved = localStorage.getItem(IG_CONFIG_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return {
    enabledOnNewSubmission: false,
    enabledOnAdminLive: true,
    webhookUrl: '',
    igBusinessAccountId: '',
    metaAccessToken: '',
  };
};

export const saveInstagramAutoPostConfig = (config: InstagramAutoPostConfig): void => {
  try {
    localStorage.setItem(IG_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
};

export interface InstagramPublishResult {
  success: boolean;
  method: 'webhook' | 'graph_api' | 'none';
  message: string;
}

/**
 * Sends item data, captions, and image payload to Make.com / Zapier / n8n Webhook
 * or Meta Instagram Graph API for automatic Feed + Story publishing.
 */
export const triggerInstagramAutoPublish = async (
  item: ConsignmentItem,
  triggerSource: 'new_submission' | 'admin_live' | 'manual_button',
  customStoryDataUrl?: string
): Promise<InstagramPublishResult> => {
  const config = getInstagramAutoPostConfig();

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

  // 1. If Webhook URL (Make.com / Zapier / n8n) is configured
  if (config.webhookUrl.trim()) {
    try {
      const response = await fetch(config.webhookUrl.trim(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'instagram_auto_publish',
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
          catalogUrl,
          coverPhotoBase64: item.photos?.[0] || '',
          storyPosterBase64: customStoryDataUrl || item.photos?.[0] || '',
          photosCount: item.photos?.length || 0,
        }),
      });

      if (response.ok) {
        return {
          success: true,
          method: 'webhook',
          message: `✅ Otomatis terkirim ke Webhook Instagram (Feed & Story) untuk ${item.id}!`,
        };
      }
      return {
        success: false,
        method: 'webhook',
        message: `⚠️ Webhook merespons dengan status ${response.status}. Periksa URL Make.com/Zapier Anda.`,
      };
    } catch (err: any) {
      return {
        success: false,
        method: 'webhook',
        message: `⚠️ Gagal menghubungi Webhook: ${err?.message || 'Koneksi terputus'}`,
      };
    }
  }

  // 2. If Meta Graph API is configured directly (requires public image URL)
  if (config.igBusinessAccountId.trim() && config.metaAccessToken.trim()) {
    const firstPhoto = item.photos?.[0] || '';
    if (!firstPhoto.startsWith('http')) {
      return {
        success: false,
        method: 'graph_api',
        message:
          '⚠️ Meta Graph API membutuhkan URL gambar publik (atau gunakan Webhook Make.com untuk upload foto Base64 otomatis).',
      };
    }

    try {
      const igUserId = config.igBusinessAccountId.trim();
      const accessToken = config.metaAccessToken.trim();

      // Publish Feed container
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

      // Publish Story container
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

      return {
        success: true,
        method: 'graph_api',
        message: `✅ Berhasil diposting otomatis ke IG Feed & Story (@info.barkasmajalengka)!`,
      };
    } catch (err: any) {
      return {
        success: false,
        method: 'graph_api',
        message: `⚠️ Gagal memposting via Meta Graph API: ${err?.message || 'Error'}`,
      };
    }
  }

  return {
    success: false,
    method: 'none',
    message: 'Silakan atur Webhook Make.com / Meta Graph API terlebih dahulu untuk auto-upload.',
  };
};
