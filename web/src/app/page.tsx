'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Layers, Loader2, PlusCircle, RefreshCw, X } from 'lucide-react';
import LessonModal from '@/components/LessonModal';
import LessonsTable from '@/components/LessonsTable';
import { api } from '@/lib/api';
import type { CourseModule, Lesson } from '@/types';

const POLL_INTERVAL_MS = 5_000;

export default function HomePage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);

  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [moduleName, setModuleName] = useState('');
  const [moduleOrder, setModuleOrder] = useState(1);
  const [moduleSubmitting, setModuleSubmitting] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasNonReadyVideos = (list: Lesson[]) =>
    list.some((l) => l.videoId && l.videoStatus !== 'ready' && l.videoStatus !== 'failed');

  const fetchLessons = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.lessons.list();
      if (res.success && res.data) setLessons(res.data);
      return res.data ?? [];
    } catch (err) {
      console.error('[Poll] Failed to fetch lessons:', err);
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const fetchModules = useCallback(async () => {
    try {
      const res = await api.modules.list();
      if (res.success && res.data) {
        setModules(res.data);
        setModuleOrder((res.data.length ?? 0) + 1);
      }
    } catch (err) {
      console.error('Failed to fetch modules:', err);
    }
  }, []);

  const fetchAll = useCallback(async (silent = false) => {
    await Promise.all([fetchLessons(silent), fetchModules()]);
  }, [fetchLessons, fetchModules]);

  // Smart polling: runs while any video is still processing
  const schedulePoll = useCallback(
    (currentLessons: Lesson[]) => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);

      if (!hasNonReadyVideos(currentLessons)) return;

      pollTimerRef.current = setTimeout(async () => {
        const updated = await fetchLessons(true);
        schedulePoll(updated);
      }, POLL_INTERVAL_MS);
    },
    [fetchLessons],
  );

  useEffect(() => {
    fetchAll();
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-evaluate polling whenever lessons change
  useEffect(() => {
    schedulePoll(lessons);
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [lessons, schedulePoll]);

  const handleCreateModule = async () => {
    if (!moduleName.trim()) return;
    setModuleSubmitting(true);
    try {
      const res = await api.modules.create({ name: moduleName.trim(), order: moduleOrder });
      if (res.success && res.data) {
        setModules((prev) => [...prev, res.data!].sort((a, b) => a.order - b.order));
        setModuleName('');
        setModuleOrder((prev) => prev + 1);
        setModuleFormOpen(false);
      }
    } catch (err) {
      console.error('Failed to create module:', err);
    } finally {
      setModuleSubmitting(false);
    }
  };

  const handleLessonSuccess = (lesson: Lesson) => {
    setLessons((prev) => {
      const idx = prev.findIndex((l) => l.id === lesson.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = lesson;
        return next;
      }
      return [...prev, lesson];
    });
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await api.lessons.delete(lessonId);
      setLessons((prev) => prev.filter((l) => l.id !== lessonId));
    } catch (err) {
      console.error('Failed to delete lesson:', err);
    }
  };

  const processingCount = lessons.filter(
    (l) => l.videoId && l.videoStatus !== 'ready' && l.videoStatus !== 'failed',
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="block w-1 h-7 bg-primary rounded-full" aria-hidden="true" />
            <h1 className="text-lg font-semibold text-gray-900">Lesson Management</h1>
            {!loading && (
              <span className="text-xs text-gray-400 font-medium">
                {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
              </span>
            )}
            {/* Live processing indicator */}
            {processingCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                <Loader2 className="w-3 h-3 animate-spin" />
                {processingCount} video{processingCount > 1 ? 's' : ''} processing
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAll()}
              disabled={loading}
              title="Refresh"
              className="p-2 text-gray-400 hover:text-primary hover:bg-primary-light rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button onClick={() => setModuleFormOpen((o) => !o)} className="btn-outline">
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Modules</span>
            </button>

            <button onClick={() => { setEditLesson(null); setModalOpen(true); }} className="btn-primary">
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Create Lesson</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* ── Module quick-create panel ─────────────────────────────────── */}
        {moduleFormOpen && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Course Modules
              </h2>
              <button onClick={() => setModuleFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modules.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {modules.map((m) => (
                  <span key={m.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-light text-primary text-xs font-medium rounded-full">
                    <span className="opacity-60">{m.order}.</span> {m.name}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="text"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateModule()}
                placeholder="Module name (e.g. Introduction)"
                className="input-field flex-1"
              />
              <input
                type="number"
                value={moduleOrder}
                onChange={(e) => setModuleOrder(Number(e.target.value))}
                min={1}
                placeholder="Order"
                className="input-field w-24"
              />
              <button
                onClick={handleCreateModule}
                disabled={moduleSubmitting || !moduleName.trim()}
                className="btn-primary shrink-0"
              >
                {moduleSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
              </button>
            </div>
          </div>
        )}

        {/* ── Lessons card ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">All Lessons</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <LessonsTable
              lessons={lessons}
              modules={modules}
              onEdit={(lesson) => { setEditLesson(lesson); setModalOpen(true); }}
              onDelete={handleDeleteLesson}
            />
          )}
        </div>
      </main>

      <LessonModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleLessonSuccess}
        modules={modules}
        editLesson={editLesson}
      />
    </div>
  );
}
