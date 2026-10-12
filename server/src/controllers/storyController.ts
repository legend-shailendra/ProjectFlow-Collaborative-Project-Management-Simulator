import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { userStorySchema } from '../validators/schemas';
import { AuthRequest } from '../middleware/auth';
import { logActivity, createNotification } from '../services/activityService';

export async function getStoriesByProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const { status, priority, search } = req.query;

    const whereClause: any = { projectId };
    if (status) whereClause.status = String(status);
    if (priority) whereClause.priority = String(priority);
    if (search) {
      whereClause.OR = [
        { title: { contains: String(search) } },
        { description: { contains: String(search) } },
        { userStatement: { contains: String(search) } },
        { storyKey: { contains: String(search) } },
      ];
    }

    const stories = await prisma.userStory.findMany({
      where: whereClause,
      include: {
        reporter: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        assignee: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        tasks: { select: { id: true, taskKey: true, title: true, status: true } },
        _count: { select: { tasks: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: stories });
  } catch (error) {
    next(error);
  }
}

export async function getStoryById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const story = await prisma.userStory.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, key: true } },
        reporter: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        assignee: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        tasks: {
          select: {
            id: true,
            taskKey: true,
            title: true,
            status: true,
            priority: true,
            storyPoints: true,
            assignee: { select: { id: true, fullName: true } },
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

    if (!story) {
      res.status(404).json({ success: false, message: 'User story not found' });
      return;
    }

    res.status(200).json({ success: true, data: story });
  } catch (error) {
    next(error);
  }
}

export async function createStory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const validated = userStorySchema.parse(req.body);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, key: true, name: true },
    });

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    // Generate unique story key: e.g. OFD-US01
    const count = await prisma.userStory.count({ where: { projectId } });
    const formattedCount = String(count + 1).padStart(2, '0');
    let storyKey = `${project.key}-US${formattedCount}`;

    // Ensure uniqueness
    const existingKey = await prisma.userStory.findUnique({ where: { storyKey } });
    if (existingKey) {
      storyKey = `${project.key}-US${Date.now().toString().slice(-4)}`;
    }

    const acceptanceCriteria = Array.isArray(validated.acceptanceCriteria)
      ? JSON.stringify(validated.acceptanceCriteria)
      : validated.acceptanceCriteria;

    const story = await prisma.userStory.create({
      data: {
        storyKey,
        title: validated.title,
        description: validated.description,
        userStatement: validated.userStatement,
        acceptanceCriteria,
        priority: validated.priority,
        storyPoints: validated.storyPoints,
        status: validated.status,
        projectId,
        reporterId: req.user!.id,
        assigneeId: validated.assigneeId || null,
      },
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
        assignee: { select: { id: true, fullName: true, email: true } },
      },
    });

    await logActivity({
      actionType: 'STORY_CREATED',
      details: `Created User Story "${story.title}" (${story.storyKey})`,
      entityType: 'STORY',
      entityId: story.id,
      userId: req.user!.id,
      projectId,
    });

    if (story.assigneeId && story.assigneeId !== req.user!.id) {
      await createNotification({
        userId: story.assigneeId,
        title: 'Assigned to User Story',
        message: `${req.user!.fullName} assigned you to "${story.title}" (${story.storyKey})`,
        link: `/stories?projectId=${projectId}`,
      });
    }

    res.status(201).json({ success: true, message: 'User story created successfully', data: story });
  } catch (error) {
    next(error);
  }
}

export async function updateStory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const validated = userStorySchema.partial().parse(req.body);

    const dataToUpdate: any = { ...validated };
    if (validated.acceptanceCriteria !== undefined) {
      dataToUpdate.acceptanceCriteria = Array.isArray(validated.acceptanceCriteria)
        ? JSON.stringify(validated.acceptanceCriteria)
        : validated.acceptanceCriteria;
    }

    const updated = await prisma.userStory.update({
      where: { id },
      data: dataToUpdate,
      include: {
        reporter: { select: { id: true, fullName: true, email: true } },
        assignee: { select: { id: true, fullName: true, email: true } },
      },
    });

    await logActivity({
      actionType: 'STORY_UPDATED',
      details: `Updated User Story "${updated.title}" (${updated.storyKey})`,
      entityType: 'STORY',
      entityId: updated.id,
      userId: req.user!.id,
      projectId: updated.projectId,
    });

    res.status(200).json({ success: true, message: 'User story updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
}

export async function deleteStory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const story = await prisma.userStory.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: `User story "${story.title}" deleted successfully.` });
  } catch (error) {
    next(error);
  }
}
