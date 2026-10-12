import { Router } from 'express';
import { getTeamMembers } from '../controllers/teamController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/members', getTeamMembers);

export default router;
