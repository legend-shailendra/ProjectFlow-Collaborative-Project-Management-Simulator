import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { projectSchema, updateProjectSchema, addMemberSchema } from '../validators/schemas';
import { AuthRequest } from '../middleware/auth';
import { logActivity } from '../services/activityService';

export async function getAllProjects(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const projects = await prisma.project.findMany({
      include: {
        manager: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true, avatarUrl: true, role: true } },
          },
        },
        _count: {
          select: {
            tasks: true,
            userStories: true,
            issues: true,
          },
        },
        tasks: {
          select: { status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = projects.map((project) => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter((t) => t.status === 'DONE').length;
      const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const { tasks, ...rest } = project;
      return {
        ...rest,
        metrics: {
          totalTasks,
          completedTasks,
          completionPercentage,
        },
      };
    });

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
}

export async function getProjectById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        manager: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true, avatarUrl: true, role: true } },
          },
        },
        _count: {
          select: {
            tasks: true,
            userStories: true,
            issues: true,
          },
        },
        tasks: {
          select: { status: true, priority: true },
        },
      },
    });

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found' });
      return;
    }

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter((t) => t.status === 'DONE').length;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const { tasks, ...rest } = project;

    res.status(200).json({
      success: true,
      data: {
        ...rest,
        metrics: {
          totalTasks,
          completedTasks,
          completionPercentage,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = projectSchema.parse(req.body);

    let workspace = await prisma.workspace.findFirst();
    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: { name: 'Default Workspace', slug: 'default-workspace' },
      });
    }

    const existingKey = await prisma.project.findUnique({
      where: { key: validated.key },
    });

    if (existingKey) {
      res.status(409).json({ success: false, message: `Project key '${validated.key}' already in use.` });
      return;
    }

    const project = await prisma.project.create({
      data: {
        key: validated.key,
        name: validated.name,
        description: validated.description,
        status: validated.status || 'ACTIVE',
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        targetDate: validated.targetDate ? new Date(validated.targetDate) : null,
        workspaceId: workspace.id,
        managerId: validated.managerId || req.user!.id,
        members: {
          create: {
            userId: req.user!.id,
            role: req.user!.role,
          },
        },
      },
      include: {
        manager: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    await logActivity({
      actionType: 'PROJECT_CREATED',
      details: `Project "${project.name}" (${project.key}) created`,
      entityType: 'PROJECT',
      entityId: project.id,
      userId: req.user!.id,
      projectId: project.id,
    });

    res.status(201).json({ success: true, message: 'Project created successfully', data: project });
  } catch (error) {
    next(error);
  }
}

export async function updateProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const validated = updateProjectSchema.parse(req.body);

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.status && { status: validated.status }),
        ...(validated.startDate !== undefined && {
          startDate: validated.startDate ? new Date(validated.startDate) : null,
        }),
        ...(validated.targetDate !== undefined && {
          targetDate: validated.targetDate ? new Date(validated.targetDate) : null,
        }),
        ...(validated.managerId !== undefined && { managerId: validated.managerId }),
      },
      include: {
        manager: { select: { id: true, fullName: true, email: true } },
      },
    });

    await logActivity({
      actionType: 'PROJECT_UPDATED',
      details: `Updated project "${project.name}"`,
      entityType: 'PROJECT',
      entityId: project.id,
      userId: req.user!.id,
      projectId: project.id,
    });

    res.status(200).json({ success: true, message: 'Project updated successfully', data: project });
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const project = await prisma.project.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: `Project "${project.name}" deleted successfully.` });
  } catch (error) {
    next(error);
  }
}

export async function addProjectMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const validated = addMemberSchema.parse(req.body);

    const membership = await prisma.projectMembership.upsert({
      where: {
        projectId_userId: {
          projectId: id,
          userId: validated.userId,
        },
      },
      update: {
        role: validated.role,
      },
      create: {
        projectId: id,
        userId: validated.userId,
        role: validated.role,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
      },
    });

    res.status(200).json({ success: true, message: 'Project member added/updated', data: membership });
  } catch (error) {
    next(error);
  }
}

export async function removeProjectMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, userId } = req.params;
    await prisma.projectMembership.delete({
      where: {
        projectId_userId: {
          projectId: id,
          userId,
        },
      },
    });

    res.status(200).json({ success: true, message: 'Project member removed successfully.' });
  } catch (error) {
    next(error);
  }
}
