import React from 'react';
import { Calendar, MessageSquare, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { Task, TaskStatus } from '../../types';
import { PriorityBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';

interface TaskCardProps {
  task: Task;
  onOpenDetails: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onOpenDetails, onStatusChange }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.setData('application/json', JSON.stringify({ taskId: task.id, fromStatus: task.status }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const nextStatuses: Record<TaskStatus, TaskStatus[]> = {
    TODO: ['IN_PROGRESS'],
    IN_PROGRESS: ['TESTING', 'TODO'],
    TESTING: ['DONE', 'IN_PROGRESS'],
    DONE: ['TODO'],
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpenDetails(task)}
      className="group relative bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing"
    >
      {/* Top Header: Key & Priority */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
          {task.taskKey}
        </span>
        <div className="flex items-center gap-1.5">
          {task.storyPoints !== null && task.storyPoints !== undefined && (
            <span
              title="Story Points"
              className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.5 rounded"
            >
              {task.storyPoints} pts
            </span>
          )}
          <PriorityBadge priority={task.priority} />
        </div>
      </div>

      {/* Task Title */}
      <h4 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
        {task.title}
      </h4>

      {/* Parent User Story Link */}
      {task.userStory && (
        <p className="text-[11px] text-slate-400 mt-1 truncate">
          Story: <span className="font-medium text-slate-600">{task.userStory.storyKey}</span>
        </p>
      )}

      {/* Footer Info: Due Date, Comments, Issues, Assignee */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
        <div className="flex items-center gap-2.5 text-slate-400">
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 text-[11px] ${
                task.isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
              }`}
              title={task.isOverdue ? 'Overdue!' : 'Due date'}
            >
              <Calendar className="w-3 h-3" />
              <span>{new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
            </div>
          )}

          {(task._count?.comments ?? 0) > 0 && (
            <div className="flex items-center gap-0.5 text-[11px] text-slate-500" title="Comments">
              <MessageSquare className="w-3 h-3" />
              <span>{task._count?.comments}</span>
            </div>
          )}

          {(task._count?.issues ?? 0) > 0 && (
            <div className="flex items-center gap-0.5 text-[11px] text-rose-500 font-medium" title="Linked issues">
              <AlertCircle className="w-3 h-3" />
              <span>{task._count?.issues}</span>
            </div>
          )}
        </div>

        {/* Assignee Avatar */}
        <div className="flex items-center gap-1.5">
          {task.assignee ? (
            <Avatar name={task.assignee.fullName} avatarUrl={task.assignee.avatarUrl} size="xs" />
          ) : (
            <span className="text-[10px] text-slate-400 italic">Unassigned</span>
          )}

          {/* Keyboard accessible quick move menu button */}
          {onStatusChange && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const next = nextStatuses[task.status][0];
                  if (next) onStatusChange(task.id, next);
                }}
                title={`Quick move to ${nextStatuses[task.status][0]}`}
                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded"
              >
                <ArrowRightLeft className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
