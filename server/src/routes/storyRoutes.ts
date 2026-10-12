import { Router } from 'express';
import {
  getStoriesByProject,
  getStoryById,
  createStory,
  updateStory,
  deleteStory,
} from '../controllers/storyController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/project/:projectId', getStoriesByProject);
router.post('/project/:projectId', requireRole(['ADMIN', 'PROJECT_MANAGER']), createStory);
router.get('/:id', getStoryById);
router.patch('/:id', requireRole(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER']), updateStory);
router.delete('/:id', requireRole(['ADMIN', 'PROJECT_MANAGER']), deleteStory);

export default router;
