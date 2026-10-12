import { Router } from 'express';
import authRoutes from './authRoutes';
import projectRoutes from './projectRoutes';
import storyRoutes from './storyRoutes';
import taskRoutes from './taskRoutes';
import issueRoutes from './issueRoutes';
import commentRoutes from './commentRoutes';
import analyticsRoutes from './analyticsRoutes';
import teamRoutes from './teamRoutes';
import notificationRoutes from './notificationRoutes';
import searchRoutes from './searchRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/stories', storyRoutes);
router.use('/tasks', taskRoutes);
router.use('/issues', issueRoutes);
router.use('/comments', commentRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/team', teamRoutes);
router.use('/notifications', notificationRoutes);
router.use('/search', searchRoutes);

export default router;
