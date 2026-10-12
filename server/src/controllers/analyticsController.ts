import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../middleware/auth';

export async function getDashboardOverview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.query;

    const projectFilter: any = projectId && projectId !== 'ALL' ? { projectId: String(projectId) } : {};
    const directProjectFilter: any = projectId && projectId !== 'ALL' ? { id: String(projectId) } : {};

    const [
      totalProjects,
      tasks,
      issues,
      recentActivities,
      userStories,
    ] = await Promise.all([
      prisma.project.count({ where: directProjectFilter }),
      prisma.task.findMany({
        where: projectFilter,
        include: {
          assignee: { select: { id: true, fullName: true, avatarUrl: true } },
          project: { select: { id: true, name: true, key: true } },
        },
      }),
      prisma.issue.findMany({
        where: projectFilter,
        include: {
          project: { select: { id: true, name: true, key: true } },
        },
      }),
      prisma.activity.findMany({
        where: projectId && projectId !== 'ALL' ? { projectId: String(projectId) } : {},
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
          project: { select: { id: true, name: true, key: true } },
        },
      }),
      prisma.userStory.findMany({
        where: projectFilter,
      }),
    ]);

    const now = new Date();

    // Summary KPIs
    const totalTasks = tasks.length;
    const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
    const openIssues = issues.filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length;
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
    ).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Task Status Distribution
    const taskStatusDistribution = [
      { name: 'To Do', count: tasks.filter((t) => t.status === 'TODO').length, color: '#94A3B8' },
      { name: 'In Progress', count: inProgressTasks, color: '#3B82F6' },
      { name: 'Testing', count: tasks.filter((t) => t.status === 'TESTING').length, color: '#EAB308' },
      { name: 'Done', count: completedTasks, color: '#22C55E' },
    ];

    // Issue Priority Distribution
    const issuePriorityDistribution = [
      { name: 'Critical', count: issues.filter((i) => i.priority === 'CRITICAL').length, color: '#EF4444' },
      { name: 'High', count: issues.filter((i) => i.priority === 'HIGH').length, color: '#F97316' },
      { name: 'Medium', count: issues.filter((i) => i.priority === 'MEDIUM').length, color: '#EAB308' },
      { name: 'Low', count: issues.filter((i) => i.priority === 'LOW').length, color: '#3B82F6' },
    ];

    // Issue Status Distribution
    const issueStatusDistribution = [
      { name: 'Open', count: issues.filter((i) => i.status === 'OPEN').length, color: '#EF4444' },
      { name: 'In Progress', count: issues.filter((i) => i.status === 'IN_PROGRESS').length, color: '#3B82F6' },
      { name: 'Fixed', count: issues.filter((i) => i.status === 'FIXED').length, color: '#8B5CF6' },
      { name: 'Closed', count: issues.filter((i) => i.status === 'CLOSED').length, color: '#22C55E' },
    ];

    // Work Distribution by Assignee
    const memberWorkMap: Record<string, { name: string; total: number; completed: number }> = {};
    tasks.forEach((t) => {
      const name = t.assignee ? t.assignee.fullName : 'Unassigned';
      if (!memberWorkMap[name]) {
        memberWorkMap[name] = { name, total: 0, completed: 0 };
      }
      memberWorkMap[name].total += 1;
      if (t.status === 'DONE') memberWorkMap[name].completed += 1;
    });

    const workDistribution = Object.values(memberWorkMap);

    // Total Story Points
    const totalStoryPoints = userStories.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);
    const completedStoryPoints = userStories
      .filter((s) => s.status === 'DONE')
      .reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalProjects,
          totalTasks,
          inProgressTasks,
          completedTasks,
          openIssues,
          overdueTasks,
          completionRate,
          totalStoryPoints,
          completedStoryPoints,
        },
        taskStatusDistribution,
        issuePriorityDistribution,
        issueStatusDistribution,
        workDistribution,
        recentActivities,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getExportData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId, type } = req.query;
    const filter: any = projectId && projectId !== 'ALL' ? { projectId: String(projectId) } : {};

    if (type === 'tasks') {
      const tasks = await prisma.task.findMany({
        where: filter,
        include: {
          project: { select: { key: true, name: true } },
          assignee: { select: { fullName: true, email: true } },
          userStory: { select: { storyKey: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ success: true, data: tasks });
      return;
    }

    if (type === 'issues') {
      const issues = await prisma.issue.findMany({
        where: filter,
        include: {
          project: { select: { key: true, name: true } },
          assignee: { select: { fullName: true } },
          reporter: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ success: true, data: issues });
      return;
    }

    if (type === 'stories') {
      const stories = await prisma.userStory.findMany({
        where: filter,
        include: {
          project: { select: { key: true, name: true } },
          assignee: { select: { fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json({ success: true, data: stories });
      return;
    }

    res.status(400).json({ success: false, message: 'Invalid export type. Specify tasks, issues, or stories.' });
  } catch (error) {
    next(error);
  }
}
