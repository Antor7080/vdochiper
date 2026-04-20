import axios from 'axios';
import type { ApiResponse, CourseModule, Lesson, UploadCredentials, VideoOTP } from '@/types';

const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

const unwrap = <T>(promise: Promise<{ data: ApiResponse<T> }>) =>
  promise.then((r) => r.data);

export const api = {
  modules: {
    list: () => unwrap(http.get<ApiResponse<CourseModule[]>>('/contents/modules')),
    create: (payload: { name: string; description?: string; order: number }) =>
      unwrap(http.post<ApiResponse<CourseModule>>('/contents/modules', payload)),
  },

  lessons: {
    list: (moduleId?: string) =>
      unwrap(
        http.get<ApiResponse<Lesson[]>>('/contents/lessons', {
          params: moduleId ? { moduleId } : undefined,
        }),
      ),
    create: (payload: Omit<Lesson, 'id' | 'videoStatus' | 'createdAt' | 'updatedAt'>) =>
      unwrap(http.post<ApiResponse<Lesson>>('/contents/lessons', payload)),
    update: (id: string, payload: Partial<Omit<Lesson, 'id' | 'moduleId' | 'videoStatus' | 'createdAt' | 'updatedAt'>>) =>
      unwrap(http.put<ApiResponse<Lesson>>(`/contents/lessons/${id}`, payload)),
    delete: (id: string) =>
      unwrap(http.delete<ApiResponse<void>>(`/contents/lessons/${id}`)),
  },

  vdocipher: {
    getUploadCredentials: (title: string) =>
      unwrap(http.post<ApiResponse<UploadCredentials>>('/contents/upload/credentials', { title })),
    getOTP: (videoId: string, watermarkText?: string) =>
      unwrap(http.get<ApiResponse<VideoOTP>>(`/contents/video/${videoId}/otp`, {
        params: watermarkText ? { watermark: watermarkText } : undefined,
      })),
  },
};
