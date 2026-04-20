import { Request, Response, NextFunction } from 'express';
import { contentsService } from './contents.service';

export const contentsController = {
  // ── Modules ──────────────────────────────────────────────────────────────

  createModule: (req: Request, res: Response, next: NextFunction): void => {
    try {
      const module = contentsService.createModule(req.body);
      res.status(201).json({ success: true, data: module });
    } catch (err) {
      next(err);
    }
  },

  getModules: (_req: Request, res: Response, next: NextFunction): void => {
    try {
      const modules = contentsService.getModules();
      res.json({ success: true, data: modules });
    } catch (err) {
      next(err);
    }
  },

  // ── Lessons ───────────────────────────────────────────────────────────────

  createLesson: (req: Request, res: Response, next: NextFunction): void => {
    try {
      const lesson = contentsService.createLesson(req.body);
      res.status(201).json({ success: true, data: lesson });
    } catch (err) {
      next(err);
    }
  },

  getLessons: (req: Request, res: Response, next: NextFunction): void => {
    try {
      const moduleId = req.query.moduleId as string | undefined;
      const lessons = contentsService.getLessons(moduleId);
      res.json({ success: true, data: lessons });
    } catch (err) {
      next(err);
    }
  },

  getLesson: (req: Request, res: Response, next: NextFunction): void => {
    try {
      const lesson = contentsService.getLesson(req.params.id);
      res.json({ success: true, data: lesson });
    } catch (err) {
      next(err);
    }
  },

  updateLesson: (req: Request, res: Response, next: NextFunction): void => {
    try {
      const lesson = contentsService.updateLesson(req.params.id, req.body);
      res.json({ success: true, data: lesson });
    } catch (err) {
      next(err);
    }
  },

  deleteLesson: (req: Request, res: Response, next: NextFunction): void => {
    try {
      contentsService.deleteLesson(req.params.id);
      res.json({ success: true, message: 'Lesson deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  // ── VdoCipher ─────────────────────────────────────────────────────────────

  getUploadCredentials: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const credentials = await contentsService.getUploadCredentials(req.body.title as string);
      res.json({ success: true, data: credentials });
    } catch (err) {
      next(err);
    }
  },

  getVideoOTP: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const watermarkText = req.query.watermark as string | undefined;
      const otp = await contentsService.getVideoOTP(req.params.videoId, watermarkText);
      res.json({ success: true, data: otp });
    } catch (err) {
      next(err);
    }
  },
};
