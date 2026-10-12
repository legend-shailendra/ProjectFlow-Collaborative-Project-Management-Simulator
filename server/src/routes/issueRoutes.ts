import { Router } from 'express';
import {
  getIssuesByProject,
  getIssueById,
  createIssue,
  updateIssue,
  updateIssueStatus,
  deleteIssue,
} from '../controllers/issueController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/project/:projectId', getIssuesByProject);
router.post('/project/:projectId', createIssue);
router.get('/:id', getIssueById);
router.patch('/:id', updateIssue);
router.patch('/:id/status', updateIssueStatus);
router.delete('/:id', requireRole(['ADMIN', 'PROJECT_MANAGER']), deleteIssue);

export default router;
