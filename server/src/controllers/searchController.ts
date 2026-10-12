import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export async function searchGlobal(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = req.query.q ? String(req.query.q).trim() : '';
    if (!q || q.length < 2) {
      res.status(200).json({
        success: true,
        data: {
          projects: [],
          tasks: [],
          stories: [],
          issues: [],
          users: [],
        },
      });
      return;
    }

    const [projects, tasks, stories, issues, users] = await Promise.all([
      prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { key: { contains: q } },
            { description: { contains: q } },
          ],
        },
        take: 5,
        select: { id: true, name: true, key: true, status: true },
      }),
      prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { taskKey: { contains: q } },
            { description: { contains: q } },
          ],
        },
        take: 8,
        include: {
          project: { select: { id: true, key: true, name: true } },
        },
      }),
      prisma.userStory.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { storyKey: { contains: q } },
            { userStatement: { contains: q } },
          ],
        },
        take: 5,
        include: {
          project: { select: { id: true, key: true, name: true } },
        },
      }),
      prisma.issue.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { issueKey: { contains: q } },
            { description: { contains: q } },
          ],
        },
        take: 5,
        include: {
          project: { select: { id: true, key: true, name: true } },
        },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { fullName: { contains: q } },
            { email: { contains: q } },
          ],
        },
        take: 5,
        select: { id: true, fullName: true, email: true, role: true, avatarUrl: true },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        projects,
        tasks,
        stories,
        issues,
        users,
      },
    });
  } catch (error) {
    next(error);
  }
}
