'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface Props {
  videoId: string;
  watermarkText?: string;
  className?: string;
}

export default function VdoCipherPlayer({ videoId, watermarkText, className = '' }: Props) {
  const [otp, setOtp] = useState('');
  const [playbackInfo, setPlaybackInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchOTP = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.vdocipher.getOTP(videoId, watermarkText);
        if (!cancelled && res.success && res.data) {
          setOtp(res.data.otp);
          setPlaybackInfo(res.data.playbackInfo);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load video';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOTP();
    return () => { cancelled = true; };
  }, [videoId, watermarkText]);

  const baseClass = `w-full rounded-md overflow-hidden bg-gray-900 ${className}`;

  if (loading) {
    return (
      <div className={`${baseClass} flex items-center justify-center`} style={{ aspectRatio: '16/9' }}>
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (error) {
    const isProcessing = error.toLowerCase().includes('not ready') || error.toLowerCase().includes('processing');
    return (
      <div
        className={`${baseClass} flex flex-col items-center justify-center gap-3 text-white px-6 text-center`}
        style={{ aspectRatio: '16/9' }}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
            <div>
              <p className="text-sm font-medium">Video is being processed</p>
              <p className="text-xs text-gray-400 mt-1">VdoCipher is transcoding your video. Please try again in a minute.</p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-sm">{error}</p>
          </>
        )}
      </div>
    );
  }

  return (
    <iframe
      src={`https://player.vdocipher.com/v2/?otp=${otp}&playbackInfo=${playbackInfo}`}
      className={baseClass}
      style={{ border: 0, aspectRatio: '16/9' }}
      allowFullScreen
      allow="encrypted-media"
      title="VdoCipher Player"
    />
  );
}
