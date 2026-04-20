export type VideoStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface CourseModule {
  id: string;
  name: string;
  description?: string;
  order: number;
  createdAt: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  videoId?: string;
  videoStatus: VideoStatus | null;
  duration?: number;
  order: number;
  isFreePreview: boolean;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface VdoCipherClientPayload {
  policy: string;
  key: string;
  'x-amz-signature': string;
  'x-amz-algorithm': string;
  'x-amz-date': string;
  'x-amz-credential': string;
  success_action_status: string;
  success_action_redirect: string;
  uploadLink: string;
  bucket: string;
}

export interface UploadCredentials {
  clientPayload: VdoCipherClientPayload;
  videoId: string;
}

export interface VideoOTP {
  otp: string;
  playbackInfo: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
