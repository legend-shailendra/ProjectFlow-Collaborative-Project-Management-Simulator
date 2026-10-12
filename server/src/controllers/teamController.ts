import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export async function getTeamMembers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.query;

    if (projectId && projectId !== 'ALL') {
      const members = await prisma.projectMembership.findMany({
        where: { projectId: String(projectId) },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
              avatarUrl: true,
              createdAt: true,
              assignedTasks: {
                where: { projectId: String(projectId) },
                select: { id: true, status: true },
              },
            },
          },
        },
      });

      const formatted = members.map((m) => {
        const totalAssigned = m.user.assignedTasks.length;
        const totalCompleted = m.user.assignedTasks.filter((t) => t.status === 'DONE').length;
        return {
          id: m.user.id,
          fullName: m.user.fullName,
          email: m.user.email,
          role: m.role || m.user.role,
          avatarUrl: m.user.avatarUrl,
          joinedAt: m.joinedAt,
          totalAssigned,
          totalCompleted,
        };
      });

      res.status(200).json({ success: true, data: formatted });
      return;
    }

    // Default: workspace members
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        assignedTasks: {
          select: { id: true, status: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    const formatted = users.map((u) => {
      const totalAssigned = u.assignedTasks.length;
      const totalCompleted = u.assignedTasks.filter((t) => t.status === 'DONE').length;
      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        avatarUrl: u.avatarUrl,
        joinedAt: u.createdAt,
        totalAssigned,
        totalCompleted,
      };
    });

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
}
