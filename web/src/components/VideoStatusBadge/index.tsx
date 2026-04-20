import { CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';
import type { VideoStatus } from '@/types';

const config: Record<
  VideoStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  pending: {
    label: 'Pending',
    icon: <Clock className="w-3 h-3" />,
    className: 'text-gray-500 bg-gray-100',
  },
  processing: {
    label: 'Processing',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    className: 'text-amber-600 bg-amber-50',
  },
  ready: {
    label: 'Ready',
    icon: <CheckCircle className="w-3 h-3" />,
    className: 'text-emerald-600 bg-emerald-50',
  },
  failed: {
    label: 'Failed',
    icon: <XCircle className="w-3 h-3" />,
    className: 'text-red-600 bg-red-50',
  },
};

interface Props {
  status: VideoStatus | null;
}

export default function VideoStatusBadge({ status }: Props) {
  if (!status) return <span className="text-xs text-gray-300">—</span>;

  const { label, icon, className } = config[status];

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {icon}
      {label}
    </span>
  );
}
