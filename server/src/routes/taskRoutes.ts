import { Router } from 'express';
import {
  getTasksByProject,
  getMyTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../controllers/taskController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/my-tasks', getMyTasks);
router.get('/project/:projectId', getTasksByProject);
router.post('/project/:projectId', requireRole(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER']), createTask);
router.get('/:id', getTaskById);
router.patch('/:id', updateTask);
router.patch('/:id/status', updateTaskStatus); // Fast endpoint for Kanban drag-and-drop
router.delete('/:id', requireRole(['ADMIN', 'PROJECT_MANAGER']), deleteTask);

export default router;
