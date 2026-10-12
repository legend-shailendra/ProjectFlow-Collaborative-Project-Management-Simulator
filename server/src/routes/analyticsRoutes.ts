import { Router } from 'express';
import { getDashboardOverview, getExportData } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/overview', getDashboardOverview);
router.get('/export', getExportData);

export default router;
