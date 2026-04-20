import { z } from 'zod';

export const CreateModuleSchema = z.object({
  name: z.string().min(1, 'Module name is required').max(200),
  description: z.string().max(1000).optional(),
  order: z.number().int().positive('Order must be a positive integer'),
});

export const CreateLessonSchema = z.object({
  moduleId: z.string().min(1, 'Module is required'),
  title: z.string().min(1, 'Lesson title is required').max(300),
  videoId: z.string().optional(),
  duration: z.number().positive().optional(),
  order: z.number().int().positive('Order must be a positive integer'),
  isFreePreview: z.boolean().default(false),
  attachments: z.array(z.string()).default([]),
});

export const UpdateLessonSchema = CreateLessonSchema.partial().omit({ moduleId: true });

export const GetUploadCredentialsSchema = z.object({
  title: z.string().min(1, 'Video title is required'),
});

export type CreateModuleDto = z.infer<typeof CreateModuleSchema>;
export type CreateLessonDto = z.infer<typeof CreateLessonSchema>;
export type UpdateLessonDto = z.infer<typeof UpdateLessonSchema>;
export type GetUploadCredentialsDto = z.infer<typeof GetUploadCredentialsSchema>;
