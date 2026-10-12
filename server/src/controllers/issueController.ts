import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { issueSchema, updateIssueStatusSchema } from '../validators/schemas';
import { AuthRequest } from '../middleware/auth';
import { logActivity, createNotification } from '../services/activityService';

export async function getIssuesByProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const { type, priority, status, search } = req.query;

    const whereClause: any = { projectId };
    if (type) whereClause.type = String(type);
    if (priority) whereClause.priority = String(priority);
    if (status) whereClause.status = String(status);
    if (search) {
      whereClause.OR = [
        { title: { contains: String(search) } },
        { description: { contains: String(search) } },
        { issueKey: { contains: String(search) } },
      ];
    }

    const issues = await prisma.issue.findMany({
      where: whereClause,
      include: {
        reporter: { select: { id: true, fullName: true, email: true, role: true } },
        assignee: { select: { id: true, fullName: true, email: true, role: true } },
        task: { select: { id: true, taskKey: true, title: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: issues });
  } catch (error) {
    next(error);
  }
}

export async function getIssueById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, key: true } },
        task: { select: { id: true, taskKey: true, title: true, status: true } },
        reporter: { select: { id: true, fullName: true, email: true, role: true } },
        assignee: { select: { id: true, fullName: true, email: true, role: true } },
        comments: {
          include: {
            author: { select: { id: true, fullName: true, email: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!issue) {
      res.status(404).json({ success: false, message: 'Issue not found' });
      return;
    }

    res.status(200).json({ success: true, data: issue });
  } catch (error) {
    next(error);
  }
}

export async function createIssue(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const validated = issueSchema.parse(req.body);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, key: true, name: true },
    });

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    // Generate unique issue key e.g. OFD-ISS-101
    const count = await prisma.issue.count({ where: { projectId } });
    let issueKey = `${project.key}-ISS-${101 + count}`;

    const existing = await prisma.issue.findUnique({ where: { issueKey } });
    if (existing) {
      issueKey = `${project.key}-ISS-${101 + count + Math.floor(Math.random() * 500)}`;
    }

    const issue = await prisma.issue.create({
      data: {
        issueKey,
        title: validated.title,
        description: validated.description,
        type: validated.type,
        priority: validated.priority,
        status: validated.status || 'OPEN',
        reproductionSteps: validated.reproductionSteps || null,
        expectedBehavior: validated.expectedBehavior || null,
        actualBehavior: validated.actualBehavior || null,
        projectId,
        taskId: validated.taskId || null,
        assigneeId: validated.assigneeId || null,
        reporterId: req.user!.id,
      },
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
        assignee: { select: { id: true, fullName: true, email: true } },
      },
    });

    await logActivity({
      actionType: 'ISSUE_REPORTED',
      details: `Reported ${issue.type.toLowerCase()} "${issue.title}" (${issue.issueKey})`,
      entityType: 'ISSUE',
      entityId: issue.id,
      userId: req.user!.id,
      projectId,
    });

    if (issue.assigneeId && issue.assigneeId !== req.user!.id) {
      await createNotification({
        userId: issue.assigneeId,
        title: 'New Issue Assigned',
        message: `${req.user!.fullName} assigned issue "${issue.title}" (${issue.issueKey}) to you`,
        link: `/issues?projectId=${projectId}`,
      });
    }

    res.status(201).json({ success: true, message: 'Issue reported successfully', data: issue });
  } catch (error) {
    next(error);
  }
}

export async function updateIssue(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const validated = issueSchema.partial().parse(req.body);

    const issue = await prisma.issue.update({
      where: { id },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.description && { description: validated.description }),
        ...(validated.type && { type: validated.type }),
        ...(validated.priority && { priority: validated.priority }),
        ...(validated.status && { status: validated.status }),
        ...(validated.reproductionSteps !== undefined && { reproductionSteps: validated.reproductionSteps }),
        ...(validated.expectedBehavior !== undefined && { expectedBehavior: validated.expectedBehavior }),
        ...(validated.actualBehavior !== undefined && { actualBehavior: validated.actualBehavior }),
        ...(validated.taskId !== undefined && { taskId: validated.taskId }),
        ...(validated.assigneeId !== undefined && { assigneeId: validated.assigneeId }),
      },
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
        assignee: { select: { id: true, fullName: true, email: true } },
      },
    });

    await logActivity({
      actionType: 'ISSUE_UPDATED',
      details: `Updated issue "${issue.title}" (${issue.issueKey})`,
      entityType: 'ISSUE',
      entityId: issue.id,
      userId: req.user!.id,
      projectId: issue.projectId,
    });

    res.status(200).json({ success: true, message: 'Issue updated successfully', data: issue });
  } catch (error) {
    next(error);
  }
}

export async function updateIssueStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const validated = updateIssueStatusSchema.parse(req.body);

    const current = await prisma.issue.findUnique({ where: { id } });
    if (!current) {
      res.status(404).json({ success: false, message: 'Issue not found' });
      return;
    }

    // Role check for closing/verifying:
    // If moving to CLOSED, only TESTER, ADMIN, or PROJECT_MANAGER can verify & close
    if (validated.status === 'CLOSED' && req.user!.role === 'DEVELOPER') {
      res.status(403).json({
        success: false,
        message: 'Only Testers, Project Managers, or Admins can verify and close issues.',
      });
      return;
    }

    const previousStatus = current.status;
    const updated = await prisma.issue.update({
      where: { id },
      data: { status: validated.status },
      include: {
        assignee: { select: { id: true, fullName: true, email: true } },
        reporter: { select: { id: true, fullName: true, email: true } },
      },
    });

    await logActivity({
      actionType: 'ISSUE_STATUS_CHANGED',
      details: `Changed issue status "${updated.title}" (${updated.issueKey}) from ${previousStatus} to ${validated.status}`,
      entityType: 'ISSUE',
      entityId: updated.id,
      userId: req.user!.id,
      projectId: updated.projectId,
    });

    if (updated.reporterId !== req.user!.id) {
      await createNotification({
        userId: updated.reporterId,
        title: 'Issue Status Updated',
        message: `${req.user!.fullName} updated issue "${updated.title}" to ${validated.status}`,
        link: `/issues?projectId=${updated.projectId}`,
      });
    }

    res.status(200).json({ success: true, message: 'Issue status updated', data: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteIssue(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const issue = await prisma.issue.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: `Issue "${issue.title}" deleted successfully.` });
  } catch (error) {
    next(error);
  }
}
