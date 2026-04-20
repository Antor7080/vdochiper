import { Router } from 'express';
import contentsRouter from '../app/modules/contents/contents.router';
import webhooksRouter from '../app/modules/webhooks/webhooks.router';

const router = Router();

router.use('/contents', contentsRouter);
router.use('/webhooks', webhooksRouter);

export default router;
