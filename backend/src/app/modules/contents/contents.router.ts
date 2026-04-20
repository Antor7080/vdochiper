import { Router } from 'express';
import { contentsController } from './contents.controller';
import { validate } from '../../../middleware/validate';
import {
  CreateModuleSchema,
  CreateLessonSchema,
  UpdateLessonSchema,
  GetUploadCredentialsSchema,
} from './contents.schema';

const router = Router();

// Modules
router.get('/modules', contentsController.getModules);
router.post('/modules', validate(CreateModuleSchema), contentsController.createModule);

// Lessons
router.get('/lessons', contentsController.getLessons);
router.post('/lessons', validate(CreateLessonSchema), contentsController.createLesson);
router.get('/lessons/:id', contentsController.getLesson);
router.put('/lessons/:id', validate(UpdateLessonSchema), contentsController.updateLesson);
router.delete('/lessons/:id', contentsController.deleteLesson);

// VdoCipher
router.post(
  '/upload/credentials',
  validate(GetUploadCredentialsSchema),
  contentsController.getUploadCredentials,
);
router.get('/video/:videoId/otp', contentsController.getVideoOTP);

export default router;
