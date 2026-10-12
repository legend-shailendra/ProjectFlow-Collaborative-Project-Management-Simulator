import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
    role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'TESTER']).optional().default('DEVELOPER'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const projectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  key: z
    .string()
    .min(2, 'Project key must be at least 2 characters')
    .max(10, 'Project key max 10 characters')
    .toUpperCase(),
  description: z.string().optional().default(''),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional().default('ACTIVE'),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
});

export const updateProjectSchema = projectSchema.partial();

export const userStorySchema = z.object({
  title: z.string().min(3, 'Story title must be at least 3 characters'),
  description: z.string().optional().default(''),
  userStatement: z.string().min(5, 'User statement is required (e.g., As a... I want... so that...)'),
  acceptanceCriteria: z.union([
    z.array(z.string()),
    z.string()
  ]),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  storyPoints: z.coerce.number().int().min(1).max(100).default(3),
  status: z.enum(['BACKLOG', 'READY', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).default('BACKLOG'),
  assigneeId: z.string().optional().nullable(),
});

export const taskSchema = z.object({
  title: z.string().min(3, 'Task title must be at least 3 characters'),
  description: z.string().optional().default(''),
  status: z.enum(['TODO', 'IN_PROGRESS', 'TESTING', 'DONE']).default('TODO'),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  storyPoints: z.coerce.number().int().min(1).max(50).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  userStoryId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  order: z.number().int().optional().default(0),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'TESTING', 'DONE']),
  order: z.number().int().optional(),
});

export const issueSchema = z.object({
  title: z.string().min(3, 'Issue title must be at least 3 characters'),
  description: z.string().min(5, 'Description is required'),
  type: z.enum(['BUG', 'TASK', 'IMPROVEMENT', 'FEATURE']).default('BUG'),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'FIXED', 'CLOSED']).default('OPEN'),
  reproductionSteps: z.string().optional().nullable(),
  expectedBehavior: z.string().optional().nullable(),
  actualBehavior: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

export const updateIssueStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'FIXED', 'CLOSED']),
});

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty'),
  taskId: z.string().optional().nullable(),
  userStoryId: z.string().optional().nullable(),
  issueId: z.string().optional().nullable(),
});

export const addMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'TESTER']).default('DEVELOPER'),
});
