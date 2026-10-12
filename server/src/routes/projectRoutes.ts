import { Router } from 'express';
import {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  removeProjectMember,
} from '../controllers/projectController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getAllProjects);
router.get('/:id', getProjectById);
router.post('/', requireRole(['ADMIN', 'PROJECT_MANAGER']), createProject);
router.patch('/:id', requireRole(['ADMIN', 'PROJECT_MANAGER']), updateProject);
router.delete('/:id', requireRole(['ADMIN']), deleteProject);

router.post('/:id/members', requireRole(['ADMIN', 'PROJECT_MANAGER']), addProjectMember);
router.delete('/:id/members/:userId', requireRole(['ADMIN', 'PROJECT_MANAGER']), removeProjectMember);

export default router;
