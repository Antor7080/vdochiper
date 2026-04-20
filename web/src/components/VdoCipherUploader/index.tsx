'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Film, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

type UploadState = 'idle' | 'requesting' | 'uploading' | 'success' | 'error';

interface Props {
  onUploadComplete: (videoId: string) => void;
  onUploadError?: (error: string) => void;
  value?: string;
  onClear?: () => void;
}

export default function VdoCipherUploader({ onUploadComplete, onUploadError, value, onClear }: Props) {
  const [state, setState] = useState<UploadState>(value ? 'success' : 'idle');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const reset = useCallback(() => {
    xhrRef.current?.abort();
    setState('idle');
    setProgress(0);
    setFileName('');
    setError('');
    onClear?.();
  }, [onClear]);

  const upload = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setError('');
      setState('requesting');

      try {
        const credRes = await api.vdocipher.getUploadCredentials(file.name);
        if (!credRes.success || !credRes.data) throw new Error('Failed to get upload credentials');

        const { clientPayload, videoId } = credRes.data;

        setState('uploading');
        setProgress(0);

        await new Promise<void>((resolve, reject) => {
          const form = new FormData();
          form.append('policy', clientPayload.policy);
          form.append('key', clientPayload.key);
          form.append('x-amz-signature', clientPayload['x-amz-signature']);
          form.append('x-amz-algorithm', clientPayload['x-amz-algorithm']);
          form.append('x-amz-date', clientPayload['x-amz-date']);
          form.append('x-amz-credential', clientPayload['x-amz-credential']);
          form.append('success_action_status', clientPayload.success_action_status);
          form.append('success_action_redirect', clientPayload.success_action_redirect ?? '');
          form.append('file', file);

          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
          });
          xhr.addEventListener('load', () => {
            xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`));
          });
          xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
          xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

          xhr.open('POST', clientPayload.uploadLink);
          xhr.send(form);
        });

        setState('success');
        setProgress(100);
        onUploadComplete(videoId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setError(msg);
        setState('error');
        onUploadError?.(msg);
      }
    },
    [onUploadComplete, onUploadError],
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file');
        setState('error');
        return;
      }
      if (file.size > 5 * 1024 * 1024 * 1024) {
        setError('File size must be less than 5 GB');
        setState('error');
        return;
      }
      upload(file);
    },
    [upload],
  );

  // ── Uploaded state ────────────────────────────────────────────────────────
  if (state === 'success') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-md">
        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-green-700">Video uploaded successfully</p>
          {fileName && <p className="text-xs text-green-600 truncate mt-0.5">{fileName}</p>}
        </div>
        <button type="button" onClick={reset} className="text-green-400 hover:text-green-600 ml-auto">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── Uploading state ────────────────────────────────────────────────────────
  if (state === 'uploading' || state === 'requesting') {
    return (
      <div className="px-4 py-3 border border-gray-200 rounded-md space-y-2">
        <div className="flex items-center gap-3">
          <Film className="w-4 h-4 text-primary shrink-0" />
          <p className="text-sm text-gray-700 flex-1 truncate min-w-0">{fileName}</p>
          <span className="text-sm font-semibold text-primary tabular-nums">
            {state === 'requesting' ? '—' : `${progress}%`}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-200"
            style={{ width: state === 'requesting' ? '4%' : `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          {state === 'requesting' ? 'Preparing secure upload...' : 'Uploading to VdoCipher...'}
        </div>
      </div>
    );
  }

  // ── Idle / Error state ────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload video file"
        className={`relative border-2 border-dashed rounded-md p-8 text-center cursor-pointer transition-colors duration-150 ${
          isDragging
            ? 'border-primary bg-primary-light'
            : state === 'error'
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-primary hover:bg-primary-light'
        }`}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
        <Upload
          className={`w-8 h-8 mx-auto mb-3 ${state === 'error' ? 'text-red-400' : 'text-gray-400'}`}
        />
        <p className="text-sm font-medium text-gray-700">
          Drop video here or{' '}
          <span className="text-primary underline underline-offset-2">browse files</span>
        </p>
        <p className="text-xs text-gray-400 mt-1.5">MP4, MOV, AVI, MKV — up to 5 GB</p>
      </div>

      {state === 'error' && (
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 flex-1">{error}</p>
          <button
            type="button"
            onClick={() => { setError(''); setState('idle'); }}
            className="text-xs text-primary hover:underline shrink-0"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
