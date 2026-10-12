import { prisma } from '../utils/prisma';

export interface LogActivityParams {
  actionType: string;
  details: string;
  entityType: 'TASK' | 'STORY' | 'ISSUE' | 'PROJECT';
  entityId: string;
  userId: string;
  projectId?: string | null;
}

export async function logActivity(params: LogActivityParams) {
  try {
    return await prisma.activity.create({
      data: {
        actionType: params.actionType,
        details: params.details,
        entityType: params.entityType,
        entityId: params.entityId,
        userId: params.userId,
        projectId: params.projectId || null,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        link: params.link || null,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
