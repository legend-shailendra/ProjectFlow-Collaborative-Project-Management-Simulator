export type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER' | 'TESTER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string | null;
  createdAt?: string;
}

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface Project {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  startDate?: string | null;
  targetDate?: string | null;
  workspaceId: string;
  managerId?: string | null;
  createdAt: string;
  updatedAt: string;
  manager?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
  members?: Array<{
    user: {
      id: string;
      fullName: string;
      email: string;
      avatarUrl?: string | null;
      role: UserRole;
    };
  }>;
  _count?: {
    tasks: number;
    userStories: number;
    issues: number;
  };
  metrics?: {
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
  };
}

export type StoryStatus = 'BACKLOG' | 'READY' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface UserStory {
  id: string;
  storyKey: string;
  title: string;
  description?: string | null;
  userStatement: string;
  acceptanceCriteria: string; // JSON array or string
  priority: PriorityLevel;
  storyPoints: number;
  status: StoryStatus;
  projectId: string;
  reporterId: string;
  assigneeId?: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; key: string };
  reporter?: { id: string; fullName: string; email: string; avatarUrl?: string | null };
  assignee?: { id: string; fullName: string; email: string; avatarUrl?: string | null };
  tasks?: Array<{ id: string; taskKey: string; title: string; status: TaskStatus; priority?: PriorityLevel; storyPoints?: number }>;
  comments?: Comment[];
  _count?: { tasks: number; comments: number };
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'TESTING' | 'DONE';

export interface Task {
  id: string;
  taskKey: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: PriorityLevel;
  storyPoints?: number | null;
  dueDate?: string | null;
  order: number;
  projectId: string;
  userStoryId?: string | null;
  assigneeId?: string | null;
  reporterId: string;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; key: string };
  userStory?: { id: string; storyKey: string; title: string };
  assignee?: { id: string; fullName: string; email: string; avatarUrl?: string | null; role?: UserRole };
  reporter?: { id: string; fullName: string; email: string };
  issues?: Array<{ id: string; issueKey: string; title: string; type: string; priority: PriorityLevel; status: IssueStatus }>;
  comments?: Comment[];
  _count?: { comments: number; issues: number };
  isOverdue?: boolean;
  isDueSoon?: boolean;
}

export type IssueType = 'BUG' | 'TASK' | 'IMPROVEMENT' | 'FEATURE';
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'FIXED' | 'CLOSED';

export interface Issue {
  id: string;
  issueKey: string;
  title: string;
  description: string;
  type: IssueType;
  priority: PriorityLevel;
  status: IssueStatus;
  reproductionSteps?: string | null;
  expectedBehavior?: string | null;
  actualBehavior?: string | null;
  projectId: string;
  taskId?: string | null;
  reporterId: string;
  assigneeId?: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; key: string };
  task?: { id: string; taskKey: string; title: string; status?: TaskStatus };
  reporter?: { id: string; fullName: string; email: string; role?: UserRole };
  assignee?: { id: string; fullName: string; email: string; role?: UserRole };
  comments?: Comment[];
  _count?: { comments: number };
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  taskId?: string | null;
  userStoryId?: string | null;
  issueId?: string | null;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
    role?: UserRole;
  };
}

export interface Activity {
  id: string;
  actionType: string;
  details: string;
  entityType: 'TASK' | 'STORY' | 'ISSUE' | 'PROJECT';
  entityId: string;
  userId: string;
  projectId?: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    role: UserRole;
  };
  project?: {
    id: string;
    name: string;
    key: string;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  userId: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  joinedAt?: string;
  totalAssigned: number;
  totalCompleted: number;
}

export interface DashboardSummary {
  totalProjects: number;
  totalTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  openIssues: number;
  overdueTasks: number;
  completionRate: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
}
