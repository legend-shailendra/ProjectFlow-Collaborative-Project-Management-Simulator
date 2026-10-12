import { Router } from 'express';
import { getComments, createComment, deleteComment } from '../controllers/commentController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getComments);
router.post('/', createComment);
router.delete('/:id', deleteComment);

export default router;
