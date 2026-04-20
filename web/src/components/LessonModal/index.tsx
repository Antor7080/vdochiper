'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, BookOpen } from 'lucide-react';
import VdoCipherUploader from '@/components/VdoCipherUploader';
import { api } from '@/lib/api';
import type { CourseModule, Lesson } from '@/types';

const schema = z.object({
  moduleId: z.string().min(1, 'Please select a module'),
  title: z.string().min(1, 'Lesson title is required').max(300),
  duration: z.coerce.number().positive('Must be positive').optional().or(z.literal('')),
  order: z.coerce.number().int().positive('Must be a positive number'),
  isFreePreview: z.boolean(),
  attachments: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (lesson: Lesson) => void;
  modules: CourseModule[];
  editLesson?: Lesson | null;
}

export default function LessonModal({ isOpen, onClose, onSuccess, modules, editLesson }: Props) {
  const [videoId, setVideoId] = useState(editLesson?.videoId ?? '');
  const [videoError, setVideoError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      moduleId: '',
      title: '',
      duration: undefined,
      order: 1,
      isFreePreview: false,
      attachments: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        moduleId: editLesson?.moduleId ?? '',
        title: editLesson?.title ?? '',
        duration: editLesson?.duration ?? undefined,
        order: editLesson?.order ?? 1,
        isFreePreview: editLesson?.isFreePreview ?? false,
        attachments: editLesson?.attachments.join(', ') ?? '',
      });
      setVideoId(editLesson?.videoId ?? '');
      setVideoError('');
      setApiError('');
    }
  }, [isOpen, editLesson, reset]);

  const isFreePreview = watch('isFreePreview');

  const onSubmit = async (data: FormValues) => {
    if (!videoId) {
      setVideoError('Please upload a lesson video');
      return;
    }
    setVideoError('');
    setApiError('');
    setSubmitting(true);

    try {
      const payload = {
        moduleId: data.moduleId,
        title: data.title,
        videoId,
        duration: data.duration ? Number(data.duration) : undefined,
        order: Number(data.order),
        isFreePreview: data.isFreePreview,
        attachments: data.attachments
          ? data.attachments
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      };

      const res = editLesson
        ? await api.lessons.update(editLesson.id, payload)
        : await api.lessons.create(payload);

      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setApiError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative bg-white rounded-xl shadow-modal w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <span className="block w-1 h-6 bg-primary rounded-full" aria-hidden="true" />
            <h2 id="modal-title" className="text-base font-semibold text-primary">
              {editLesson ? 'Edit Lesson' : 'Create New Lesson'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable form body ─────────────────────────────────────────── */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {/* Row 1: Module + Lesson Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="moduleId" className="field-label">
                <span className="text-primary">*</span> Module
              </label>
              <select
                id="moduleId"
                {...register('moduleId')}
                className={`input-field appearance-none ${errors.moduleId ? 'input-field-error' : ''}`}
              >
                <option value="">Select module for this lesson</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.order}. {m.name}
                  </option>
                ))}
              </select>
              {errors.moduleId && <p className="field-error">{errors.moduleId.message}</p>}
            </div>

            <div>
              <label htmlFor="title" className="field-label">
                <span className="text-primary">*</span> Lesson Title
              </label>
              <input
                id="title"
                type="text"
                placeholder="Enter lesson title (e.g. Introduction to React)"
                {...register('title')}
                className={`input-field ${errors.title ? 'input-field-error' : ''}`}
              />
              {errors.title && <p className="field-error">{errors.title.message}</p>}
            </div>
          </div>

          {/* Row 2: Video Upload */}
          <div>
            <label className="field-label">
              <span className="text-primary">*</span> Lesson Video
            </label>
            <VdoCipherUploader
              value={videoId}
              onUploadComplete={(id) => { setVideoId(id); setVideoError(''); }}
              onUploadError={(msg) => setVideoError(msg)}
              onClear={() => setVideoId('')}
            />
            {videoError && <p className="field-error">{videoError}</p>}
          </div>

          {/* Row 3: Duration + Order */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="duration" className="field-label">
                Lesson Duration (Minutes)
              </label>
              <input
                id="duration"
                type="number"
                min={1}
                placeholder="Enter duration in minutes (e.g. 10)"
                {...register('duration')}
                className={`input-field ${errors.duration ? 'input-field-error' : ''}`}
              />
              {errors.duration && <p className="field-error">{errors.duration.message}</p>}
            </div>

            <div>
              <label htmlFor="order" className="field-label">
                <span className="text-primary">*</span> Lesson Order
              </label>
              <input
                id="order"
                type="number"
                min={1}
                placeholder="Enter lesson order (1, 2, 3...)"
                {...register('order')}
                className={`input-field ${errors.order ? 'input-field-error' : ''}`}
              />
              {errors.order && <p className="field-error">{errors.order.message}</p>}
            </div>
          </div>

          {/* Row 4: Free Preview toggle */}
          <div>
            <p className="field-label">Free Preview</p>
            <button
              type="button"
              role="switch"
              aria-checked={isFreePreview}
              onClick={() => setValue('isFreePreview', !isFreePreview)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                isFreePreview ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  isFreePreview ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Row 5: Attachments */}
          <div>
            <label htmlFor="attachments" className="field-label">
              Attachments
            </label>
            <input
              id="attachments"
              type="text"
              placeholder="Paste attachment URLs, separated by commas"
              {...register('attachments')}
              className="input-field"
            />
            <p className="text-xs text-gray-400 mt-1">Separate multiple URLs with a comma</p>
          </div>

          {/* API error */}
          {apiError && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{apiError}</p>
            </div>
          )}

          {/* ── Actions ──────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 pt-1 border-t border-gray-100 mt-6">
            <button type="submit" disabled={submitting} className="btn-primary">
              <BookOpen className="w-4 h-4" />
              {submitting ? 'Saving...' : editLesson ? 'Update Lesson' : 'Create'}
            </button>
            <button type="button" onClick={onClose} className="btn-outline">
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
