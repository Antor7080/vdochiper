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

export interface VdoCipherUploadCredentials {
  clientPayload: VdoCipherClientPayload;
  videoId: string;
}

export interface VdoCipherOTPResponse {
  otp: string;
  playbackInfo: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
