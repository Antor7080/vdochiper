import { Router } from 'express';
import { webhooksController } from './webhooks.controller';

const router = Router();

router.post('/vdocipher', webhooksController.vdocipher);

export default router;
