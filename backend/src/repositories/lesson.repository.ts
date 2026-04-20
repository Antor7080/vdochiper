import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import type { DbLesson } from '../database/JsonDatabase';
import type { CreateLessonDto, UpdateLessonDto } from '../app/modules/contents/contents.schema';

export const lessonRepository = {
  findAll(moduleId?: string): DbLesson[] {
    const lessons = db.read().lessons;
    const filtered = moduleId ? lessons.filter((l) => l.moduleId === moduleId) : lessons;
    return filtered.slice().sort((a, b) => a.order - b.order);
  },

  findById(id: string): DbLesson | undefined {
    return db.read().lessons.find((l) => l.id === id);
  },

  create(dto: CreateLessonDto): DbLesson {
    const now = new Date().toISOString();
    const lesson: DbLesson = {
      id: uuidv4(),
      moduleId: dto.moduleId,
      title: dto.title,
      ...(dto.videoId && { videoId: dto.videoId }),
      ...(dto.duration !== undefined && { duration: dto.duration }),
      order: dto.order,
      isFreePreview: dto.isFreePreview,
      attachments: dto.attachments,
      createdAt: now,
      updatedAt: now,
    };
    db.write((data) => ({ ...data, lessons: [...data.lessons, lesson] }));
    return lesson;
  },

  update(id: string, dto: UpdateLessonDto): DbLesson | null {
    let updated: DbLesson | null = null;

    db.write((data) => {
      const index = data.lessons.findIndex((l) => l.id === id);
      if (index === -1) return data;

      updated = { ...data.lessons[index]!, ...dto, id, updatedAt: new Date().toISOString() };
      const lessons = [...data.lessons];
      lessons[index] = updated;
      return { ...data, lessons };
    });

    return updated;
  },

  delete(id: string): boolean {
    const before = db.read().lessons.length;
    db.write((data) => ({
      ...data,
      lessons: data.lessons.filter((l) => l.id !== id),
    }));
    return db.read().lessons.length < before;
  },
};
