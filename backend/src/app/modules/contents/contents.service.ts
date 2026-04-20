import axios from 'axios';
import env from '../../../config/env';
import { AppError } from '../../../middleware/errorHandler';
import { moduleRepository } from '../../../repositories/module.repository';
import { lessonRepository } from '../../../repositories/lesson.repository';
import { videoRepository } from '../../../repositories/video.repository';
import type { VideoMeta } from '../../../repositories/video.repository';
import type { DbModule, DbLesson, DbVideo, VideoStatus } from '../../../database/JsonDatabase';
import type { VdoCipherUploadCredentials, VdoCipherOTPResponse } from '../../../types';
import type { CreateModuleDto, CreateLessonDto, UpdateLessonDto } from './contents.schema';

export interface LessonWithStatus extends DbLesson {
  videoStatus: VideoStatus | null;
}

const vdocipherClient = axios.create({
  baseURL: env.vdocipher.baseUrl,
  headers: { Authorization: `Apisecret ${env.vdocipher.apiKey}` },
  timeout: 15_000,
});

const withVideoStatus = (lesson: DbLesson): LessonWithStatus => ({
  ...lesson,
  videoStatus: lesson.videoId
    ? (videoRepository.findById(lesson.videoId)?.status ?? 'pending')
    : null,
});

export const contentsService = {
  // ── Modules ────────────────────────────────────────────────────────────────

  createModule(dto: CreateModuleDto): DbModule {
    return moduleRepository.create(dto);
  },

  getModules(): DbModule[] {
    return moduleRepository.findAll();
  },

  // ── Lessons ─────────────────────────────────────────────────────────────────

  createLesson(dto: CreateLessonDto): LessonWithStatus {
    if (!moduleRepository.exists(dto.moduleId)) {
      throw new AppError('Module not found', 404);
    }
    const lesson = lessonRepository.create(dto);
    return withVideoStatus(lesson);
  },

  getLessons(moduleId?: string): LessonWithStatus[] {
    return lessonRepository.findAll(moduleId).map(withVideoStatus);
  },

  getLesson(id: string): LessonWithStatus {
    const lesson = lessonRepository.findById(id);
    if (!lesson) throw new AppError('Lesson not found', 404);
    return withVideoStatus(lesson);
  },

  updateLesson(id: string, dto: UpdateLessonDto): LessonWithStatus {
    const lesson = lessonRepository.update(id, dto);
    if (!lesson) throw new AppError('Lesson not found', 404);
    return withVideoStatus(lesson);
  },

  deleteLesson(id: string): void {
    if (!lessonRepository.delete(id)) throw new AppError('Lesson not found', 404);
  },

  // ── VdoCipher ──────────────────────────────────────────────────────────────

  async getUploadCredentials(title: string): Promise<VdoCipherUploadCredentials> {
    try {
      const { data } = await vdocipherClient.put<VdoCipherUploadCredentials>('/videos', undefined, {
        params: { title },
        headers: { 'Content-Type': 'text/plain' },
      });

      // Register video in DB so we can track its processing status
      videoRepository.register(data.videoId, title);

      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status ?? 502;
        console.error('[VdoCipher] Upload credentials error:', {
          status,
          data: err.response?.data,
          headers: err.response?.headers,
          message: err.message,
        });
        const errData = err.response?.data as Record<string, unknown> | undefined;
        const message = String(errData?.message ?? errData?.error ?? JSON.stringify(errData) ?? 'VdoCipher error');
        throw new AppError(`Upload credentials failed: ${message}`, status);
      }
      console.error('[VdoCipher] Network error:', err);
      throw new AppError('Failed to connect to VdoCipher', 502);
    }
  },

  async getVideoOTP(videoId: string, watermarkText?: string): Promise<VdoCipherOTPResponse> {
    try {
      const body: Record<string, unknown> = { ttl: 300 };
      const annotationText = watermarkText ?? 'Demo - VdoCipher LMS';
      body.annotate = JSON.stringify([
        {
          type: 'rtext',
          text: annotationText,
          alpha: '0.60',
          color: '#FF0000',
          size: '8',
          interval: '5000',
        },
      ]);
      const { data } = await vdocipherClient.post<VdoCipherOTPResponse>(
        `/videos/${videoId}/otp`,
        body,
      );
      return data;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status ?? 502;
        const message = (err.response?.data as { message?: string })?.message ?? 'VdoCipher error';
        throw new AppError(`OTP generation failed: ${message}`, status);
      }
      throw new AppError('Failed to connect to VdoCipher', 502);
    }
  },

  updateVideoStatus(videoId: string, status: VideoStatus, meta?: VideoMeta): DbVideo | null {
    return videoRepository.updateStatus(videoId, status, meta);
  },
};
