'use client';

import { useState } from 'react';
import { Edit2, Trash2, Play, Clock, Eye, EyeOff, X } from 'lucide-react';
import VdoCipherPlayer from '@/components/VdoCipherPlayer';
import VideoStatusBadge from '@/components/VideoStatusBadge';
import type { CourseModule, Lesson } from '@/types';

interface Props {
  lessons: Lesson[];
  modules: CourseModule[];
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
}

export default function LessonsTable({ lessons, modules, onEdit, onDelete }: Props) {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const getModuleName = (moduleId: string) =>
    modules.find((m) => m.id === moduleId)?.name ?? '—';

  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-sm font-medium">No lessons yet</p>
        <p className="text-xs mt-1">Click &ldquo;Create Lesson&rdquo; to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['#', 'Title', 'Module', 'Duration', 'Preview', 'Video Status', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {lessons.map((lesson) => (
              <tr key={lesson.id} className="hover:bg-gray-50 transition-colors group">
                <td className="py-3.5 px-4 text-gray-400 tabular-nums">{lesson.order}</td>

                <td className="py-3.5 px-4 font-medium text-gray-900 max-w-[220px]">
                  <span className="truncate block">{lesson.title}</span>
                </td>

                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary-light text-primary font-medium">
                    {getModuleName(lesson.moduleId)}
                  </span>
                </td>

                <td className="py-3.5 px-4 text-gray-500">
                  {lesson.duration ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {lesson.duration}m
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>

                <td className="py-3.5 px-4">
                  {lesson.isFreePreview ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <Eye className="w-3 h-3" /> Free
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      <EyeOff className="w-3 h-3" /> Paid
                    </span>
                  )}
                </td>

                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <VideoStatusBadge status={lesson.videoStatus} />
                    {lesson.videoId && lesson.videoStatus === 'ready' && (
                      <button
                        onClick={() => setPlayingVideoId(lesson.videoId!)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" /> Play
                      </button>
                    )}
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(lesson)}
                      title="Edit lesson"
                      className="p-1.5 rounded text-gray-400 hover:text-primary hover:bg-primary-light transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(lesson.id)}
                      title="Delete lesson"
                      className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Video player overlay ─────────────────────────────────────────── */}
      {playingVideoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setPlayingVideoId(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-4xl">
            <button
              onClick={() => setPlayingVideoId(null)}
              className="absolute -top-10 right-0 p-1.5 text-white/70 hover:text-white transition-colors"
              aria-label="Close player"
            >
              <X className="w-6 h-6" />
            </button>
            <VdoCipherPlayer videoId={playingVideoId} className="rounded-xl" />
          </div>
        </div>
      )}
    </>
  );
}
