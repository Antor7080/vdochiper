import { Request, Response, NextFunction } from 'express';
import env from '../../../config/env';
import { contentsService } from '../contents/contents.service';
import type { VideoStatus } from '../../../database/JsonDatabase';

interface VdoCipherWebhookBody {
  event?: string;
  payload?: {
    videoId?: string;
    id?: string;
    video?: { id?: string };
    status?: number | string;
    title?: string;
    length?: number;
    totalSizeMb?: number;
    upload_time?: number;
    posters?: { url: string; height: number }[];
  };
}

// VdoCipher numeric status → our VideoStatus
const numericStatusMap: Record<number, VideoStatus> = {
  0: 'pending',    // upload in progress
  1: 'pending',    // queued
  2: 'processing', // transcoding
  3: 'ready',
  4: 'failed',
  5: 'failed',
};

// VdoCipher event name → our VideoStatus (both dot and colon separators)
const eventStatusMap: Record<string, VideoStatus> = {
  'video.ready': 'ready',
  'video:ready': 'ready',
  'video.encoded': 'ready',
  'video:encoded': 'ready',
  'video.uploaded': 'processing',
  'video:uploaded': 'processing',
  'video.transcoding': 'processing',
  'video:transcoding': 'processing',
  'video.failed': 'failed',
  'video:failed': 'failed',
  'video.error': 'failed',
  'video:error': 'failed',
};

// VdoCipher string status field → our VideoStatus
const stringStatusMap: Record<string, VideoStatus> = {
  'ready': 'ready',
  'processing': 'processing',
  'transcoding': 'processing',
  'pending': 'pending',
  'failed': 'failed',
  'error': 'failed',
};

export const webhooksController = {
  vdocipher: (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Optional secret verification — configure in VdoCipher dashboard webhook URL
      if (env.webhookSecret) {
        const provided = (req.query.secret as string) ?? req.headers['x-webhook-secret'];
        if (provided !== env.webhookSecret) {
          res.status(401).json({ success: false, error: 'Unauthorized' });
          return;
        }
      }

      const body = req.body as VdoCipherWebhookBody;
      const event = body.event ?? '';
      const pl = body.payload ?? {};

      // Extract videoId — VdoCipher uses different shapes across versions
      const videoId = pl.videoId ?? pl.id ?? pl.video?.id;

      if (!videoId) {
        console.warn('[Webhook] VdoCipher payload missing videoId:', JSON.stringify(body));
        res.status(200).json({ success: true, message: 'No videoId — ignored' });
        return;
      }

      // Determine status: prefer event name, fall back to numeric status field
      let status: VideoStatus | undefined;
      if (event && eventStatusMap[event]) {
        status = eventStatusMap[event];
      } else if (pl.status !== undefined && typeof pl.status === 'number') {
        status = numericStatusMap[pl.status];
      } else if (typeof pl.status === 'string' && pl.status in stringStatusMap) {
        status = stringStatusMap[pl.status];
      }

      if (!status) {
        console.warn(`[Webhook] Unrecognised event/status — ignoring. event="${event}" status=${JSON.stringify(pl.status)}`);
        res.status(200).json({ success: true, message: 'Unrecognised event — ignored' });
        return;
      }

      const poster = pl.posters?.reduce((best, p) => (!best || p.height > best.height ? p : best))?.url;

      const updated = contentsService.updateVideoStatus(videoId, status, {
        ...(pl.title && { title: pl.title }),
        ...(pl.length !== undefined && { duration: pl.length }),
        ...(pl.totalSizeMb !== undefined && { sizeMb: pl.totalSizeMb }),
        ...(pl.upload_time !== undefined && { uploadedAt: new Date(pl.upload_time * 1000).toISOString() }),
        ...(poster && { poster }),
      });

      console.log(`[Webhook] event="${event}" videoId="${videoId}" → status="${status}" tracked=${!!updated}`);

      // VdoCipher expects a 200 response quickly
      res.status(200).json({ success: true, videoId, status });
    } catch (err) {
      next(err);
    }
  },
};
