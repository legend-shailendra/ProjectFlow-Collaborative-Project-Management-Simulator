import React from 'react';
import { PriorityLevel, TaskStatus, StoryStatus, IssueStatus, UserRole } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    slate: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 rounded-md font-medium',
    md: 'text-sm px-2.5 py-1 rounded-md font-medium',
  };

  return (
    <span className={`inline-flex items-center border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: PriorityLevel }> = ({ priority }) => {
  const map: Record<PriorityLevel, { variant: 'error' | 'warning' | 'info' | 'default'; label: string }> = {
    CRITICAL: { variant: 'error', label: 'Critical' },
    HIGH: { variant: 'warning', label: 'High' },
    MEDIUM: { variant: 'info', label: 'Medium' },
    LOW: { variant: 'default', label: 'Low' },
  };

  const config = map[priority] || { variant: 'default', label: priority };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const TaskStatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const map: Record<TaskStatus, { variant: 'slate' | 'info' | 'warning' | 'success'; label: string }> = {
    TODO: { variant: 'slate', label: 'To Do' },
    IN_PROGRESS: { variant: 'info', label: 'In Progress' },
    TESTING: { variant: 'warning', label: 'Testing' },
    DONE: { variant: 'success', label: 'Done' },
  };

  const config = map[status] || { variant: 'slate', label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const StoryStatusBadge: React.FC<{ status: StoryStatus }> = ({ status }) => {
  const map: Record<StoryStatus, { variant: 'slate' | 'info' | 'purple' | 'success'; label: string }> = {
    BACKLOG: { variant: 'slate', label: 'Backlog' },
    READY: { variant: 'info', label: 'Ready' },
    IN_PROGRESS: { variant: 'info', label: 'In Progress' },
    IN_REVIEW: { variant: 'purple', label: 'In Review' },
    DONE: { variant: 'success', label: 'Done' },
  };

  const config = map[status] || { variant: 'slate', label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const IssueStatusBadge: React.FC<{ status: IssueStatus }> = ({ status }) => {
  const map: Record<IssueStatus, { variant: 'error' | 'info' | 'purple' | 'success'; label: string }> = {
    OPEN: { variant: 'error', label: 'Open' },
    IN_PROGRESS: { variant: 'info', label: 'In Progress' },
    FIXED: { variant: 'purple', label: 'Fixed' },
    CLOSED: { variant: 'success', label: 'Closed' },
  };

  const config = map[status] || { variant: 'slate', label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const map: Record<UserRole, { variant: 'purple' | 'info' | 'success' | 'warning'; label: string }> = {
    ADMIN: { variant: 'purple', label: 'Admin' },
    PROJECT_MANAGER: { variant: 'info', label: 'Project Manager' },
    DEVELOPER: { variant: 'success', label: 'Developer' },
    TESTER: { variant: 'warning', label: 'Tester' },
  };

  const config = map[role] || { variant: 'purple', label: role };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};
