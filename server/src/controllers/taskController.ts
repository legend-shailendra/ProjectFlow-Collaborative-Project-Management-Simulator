import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { taskSchema, updateTaskStatusSchema } from '../validators/schemas';
import { AuthRequest } from '../middleware/auth';
import { logActivity, createNotification } from '../services/activityService';

export async function getTasksByProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const { assigneeId, priority, status, search } = req.query;

    const whereClause: any = { projectId };
    if (assigneeId) whereClause.assigneeId = String(assigneeId);
    if (priority) whereClause.priority = String(priority);
    if (status) whereClause.status = String(status);
    if (search) {
      whereClause.OR = [
        { title: { contains: String(search) } },
        { description: { contains: String(search) } },
        { taskKey: { contains: String(search) } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: { select: { id: true, fullName: true, email: true, avatarUrl: true, role: true } },
        reporter: { select: { id: true, fullName: true, email: true } },
        userStory: { select: { id: true, storyKey: true, title: true } },
        _count: {
          select: {
            comments: true,
            issues: true,
          },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
}

export async function getMyTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { status } = req.query;

    const whereClause: any = { assigneeId: userId };
    if (status && status !== 'ALL') {
      whereClause.status = String(status);
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        project: { select: { id: true, name: true, key: true } },
        userStory: { select: { id: true, storyKey: true, title: true } },
        _count: { select: { comments: true, issues: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    const now = new Date();
    const formatted = tasks.map((t) => {
      const isOverdue = t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE';
      const isDueSoon =
        t.dueDate &&
        !isOverdue &&
        new Date(t.dueDate).getTime() - now.getTime() < 3 * 24 * 60 * 60 * 1000 &&
        t.status !== 'DONE';
      return {
        ...t,
        isOverdue: Boolean(isOverdue),
        isDueSoon: Boolean(isDueSoon),
      };
    });

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
}

export async function getTaskById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, key: true } },
        userStory: { select: { id: true, storyKey: true, title: true, status: true } },
        assignee: { select: { id: true, fullName: true, email: true, avatarUrl: true, role: true } },
        reporter: { select: { id: true, fullName: true, email: true } },
        issues: {
          select: {
            id: true,
            issueKey: true,
            title: true,
            type: true,
            priority: true,
            status: true,
          },
        },
        comments: {
          include: {
            author: { select: { id: true, fullName: true, email: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

export async function createTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const validated = taskSchema.parse(req.body);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, key: true, name: true },
    });

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    // Generate unique task key e.g. OFD-101
    const count = await prisma.task.count({ where: { projectId } });
    let taskKey = `${project.key}-${101 + count}`;

    const existing = await prisma.task.findUnique({ where: { taskKey } });
    if (existing) {
      taskKey = `${project.key}-${101 + count + Math.floor(Math.random() * 900)}`;
    }

    const task = await prisma.task.create({
      data: {
        taskKey,
        title: validated.title,
        description: validated.description,
        status: validated.status || 'TODO',
        priority: validated.priority || 'MEDIUM',
        storyPoints: validated.storyPoints || null,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        order: validated.order || 0,
        projectId,
        userStoryId: validated.userStoryId || null,
        assigneeId: validated.assigneeId || null,
        reporterId: req.user!.id,
      },
      include: {
        assignee: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        reporter: { select: { id: true, fullName: true, email: true } },
        userStory: { select: { id: true, storyKey: true, title: true } },
      },
    });

    await logActivity({
      actionType: 'TASK_CREATED',
      details: `Created task "${task.title}" (${task.taskKey}) in ${task.status}`,
      entityType: 'TASK',
      entityId: task.id,
      userId: req.user!.id,
      projectId,
    });

    if (task.assigneeId && task.assigneeId !== req.user!.id) {
      await createNotification({
        userId: task.assigneeId,
        title: 'New Task Assignment',
        message: `${req.user!.fullName} assigned task "${task.title}" (${task.taskKey}) to you`,
        link: `/kanban?projectId=${projectId}&taskId=${task.id}`,
      });
    }

    res.status(201).json({ success: true, message: 'Task created successfully', data: task });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const validated = taskSchema.partial().parse(req.body);

    const oldTask = await prisma.task.findUnique({ where: { id } });
    if (!oldTask) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(validated.title && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.status && { status: validated.status }),
        ...(validated.priority && { priority: validated.priority }),
        ...(validated.storyPoints !== undefined && { storyPoints: validated.storyPoints }),
        ...(validated.dueDate !== undefined && {
          dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        }),
        ...(validated.userStoryId !== undefined && { userStoryId: validated.userStoryId }),
        ...(validated.assigneeId !== undefined && { assigneeId: validated.assigneeId }),
        ...(validated.order !== undefined && { order: validated.order }),
      },
      include: {
        assignee: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        userStory: { select: { id: true, storyKey: true, title: true } },
      },
    });

    // Notify new assignee if changed
    if (validated.assigneeId && validated.assigneeId !== oldTask.assigneeId && validated.assigneeId !== req.user!.id) {
      await createNotification({
        userId: validated.assigneeId,
        title: 'Task Reassigned to You',
        message: `${req.user!.fullName} assigned task "${updated.title}" (${updated.taskKey}) to you`,
        link: `/kanban?projectId=${updated.projectId}&taskId=${updated.id}`,
      });
    }

    await logActivity({
      actionType: 'TASK_UPDATED',
      details: `Updated task "${updated.title}" (${updated.taskKey})`,
      entityType: 'TASK',
      entityId: updated.id,
      userId: req.user!.id,
      projectId: updated.projectId,
    });

    res.status(200).json({ success: true, message: 'Task updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
}

export async function updateTaskStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const validated = updateTaskStatusSchema.parse(req.body);

    const currentTask = await prisma.task.findUnique({ where: { id } });
    if (!currentTask) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    const previousStatus = currentTask.status;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: validated.status,
        ...(validated.order !== undefined && { order: validated.order }),
      },
      include: {
        assignee: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        userStory: { select: { id: true, storyKey: true, title: true } },
      },
    });

    if (previousStatus !== validated.status) {
      await logActivity({
        actionType: 'TASK_STATUS_CHANGED',
        details: `Moved task "${updated.title}" (${updated.taskKey}) from ${previousStatus} to ${validated.status}`,
        entityType: 'TASK',
        entityId: updated.id,
        userId: req.user!.id,
        projectId: updated.projectId,
      });

      if (updated.assigneeId && updated.assigneeId !== req.user!.id) {
        await createNotification({
          userId: updated.assigneeId,
          title: 'Task Status Updated',
          message: `${req.user!.fullName} moved "${updated.title}" to ${validated.status}`,
          link: `/kanban?projectId=${updated.projectId}&taskId=${updated.id}`,
        });
      }
    }

    res.status(200).json({ success: true, message: 'Task status updated', data: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const task = await prisma.task.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: `Task "${task.title}" deleted successfully.` });
  } catch (error) {
    next(error);
  }
}
