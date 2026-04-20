import { db } from '../database';
import type { DbVideo, VideoStatus } from '../database/JsonDatabase';

export interface VideoMeta {
  title?: string;
  duration?: number;
  sizeMb?: number;
  uploadedAt?: string;
  poster?: string;
}

function timestamp(): string {
  return new Date().toISOString();
}

export const videoRepository = {
  findById(id: string): DbVideo | undefined {
    return db.read().videos.find((v) => v.id === id);
  },

  register(id: string, title: string): DbVideo {
    const existing = db.read().videos.find((v) => v.id === id);
    if (existing) return existing;

    const now = timestamp();
    const video: DbVideo = {
      id,
      title,
      status: 'processing',
      createdAt: now,
      updatedAt: now,
    };

    db.write((data) => ({ ...data, videos: [...data.videos, video] }));
    return video;
  },

  updateStatus(id: string, status: VideoStatus, meta: VideoMeta = {}): DbVideo | null {
    let updated: DbVideo | null = null;

    db.write((data) => {
      const now = timestamp();
      const index = data.videos.findIndex((v) => v.id === id);

      if (index === -1) {
        console.warn(`[videoRepository] updateStatus: video "${id}" not found; registering with empty title.`);
        updated = { id, title: meta.title ?? '', status, ...meta, createdAt: now, updatedAt: now };
        return { ...data, videos: [...data.videos, updated] };
      }

      updated = { ...data.videos[index]!, status, ...meta, updatedAt: now };
      const videos = [...data.videos];
      videos[index] = updated;
      return { ...data, videos };
    });

    return updated;
  },
};
