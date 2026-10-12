import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { commentSchema } from '../validators/schemas';
import { AuthRequest } from '../middleware/auth';
import { logActivity, createNotification } from '../services/activityService';

export async function getComments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { taskId, userStoryId, issueId } = req.query;

    const whereClause: any = {};
    if (taskId) whereClause.taskId = String(taskId);
    if (userStoryId) whereClause.userStoryId = String(userStoryId);
    if (issueId) whereClause.issueId = String(issueId);

    const comments = await prisma.comment.findMany({
      where: whereClause,
      include: {
        author: { select: { id: true, fullName: true, email: true, avatarUrl: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
}

export async function createComment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = commentSchema.parse(req.body);

    if (!validated.taskId && !validated.userStoryId && !validated.issueId) {
      res.status(400).json({
        success: false,
        message: 'Comment must be attached to a taskId, userStoryId, or issueId.',
      });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        content: validated.content,
        authorId: req.user!.id,
        taskId: validated.taskId || null,
        userStoryId: validated.userStoryId || null,
        issueId: validated.issueId || null,
      },
      include: {
        author: { select: { id: true, fullName: true, email: true, avatarUrl: true, role: true } },
      },
    });

    // Determine target entity for activity and notification
    let entityType: 'TASK' | 'STORY' | 'ISSUE' = 'TASK';
    let entityId = '';
    let projectId: string | null = null;
    let notifyUserId: string | null = null;
    let itemTitle = '';

    if (validated.taskId) {
      entityType = 'TASK';
      entityId = validated.taskId;
      const t = await prisma.task.findUnique({ where: { id: validated.taskId } });
      if (t) {
        projectId = t.projectId;
        itemTitle = t.title;
        notifyUserId = t.assigneeId || t.reporterId;
      }
    } else if (validated.userStoryId) {
      entityType = 'STORY';
      entityId = validated.userStoryId;
      const s = await prisma.userStory.findUnique({ where: { id: validated.userStoryId } });
      if (s) {
        projectId = s.projectId;
        itemTitle = s.title;
        notifyUserId = s.assigneeId || s.reporterId;
      }
    } else if (validated.issueId) {
      entityType = 'ISSUE';
      entityId = validated.issueId;
      const i = await prisma.issue.findUnique({ where: { id: validated.issueId } });
      if (i) {
        projectId = i.projectId;
        itemTitle = i.title;
        notifyUserId = i.assigneeId || i.reporterId;
      }
    }

    await logActivity({
      actionType: 'COMMENT_ADDED',
      details: `Comment added by ${req.user!.fullName} on ${itemTitle || entityType}`,
      entityType,
      entityId,
      userId: req.user!.id,
      projectId,
    });

    if (notifyUserId && notifyUserId !== req.user!.id) {
      await createNotification({
        userId: notifyUserId,
        title: 'New Comment',
        message: `${req.user!.fullName} commented on "${itemTitle || 'an item'}"`,
      });
    }

    res.status(201).json({ success: true, message: 'Comment added', data: comment });
  } catch (error) {
    next(error);
  }
}

export async function deleteComment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found' });
      return;
    }

    // Only author or ADMIN can delete
    if (comment.authorId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, message: 'Permission denied to delete this comment.' });
      return;
    }

    await prisma.comment.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Comment deleted successfully.' });
  } catch (error) {
    next(error);
  }
}
