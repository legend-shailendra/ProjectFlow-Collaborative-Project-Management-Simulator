import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Task, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onDropTask: (taskId: string, targetStatus: TaskStatus) => void;
  onOpenDetails: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  tasks,
  onDropTask,
  onOpenDetails,
  onAddTask,
  onStatusChange,
}) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = () => {
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    try {
      let taskId = e.dataTransfer.getData('text/plain');
      if (!taskId) {
        const dataStr = e.dataTransfer.getData('application/json');
        if (dataStr) {
          taskId = JSON.parse(dataStr).taskId;
        }
      }
      if (taskId) {
        onDropTask(taskId, status);
      }
    } catch (err) {
      console.error('Drag drop error:', err);
    }
  };

  const columnThemes: Record<TaskStatus, { border: string; pill: string; countPill: string }> = {
    TODO: {
      border: 'border-slate-300',
      pill: 'bg-slate-100 text-slate-700',
      countPill: 'bg-slate-200 text-slate-700',
    },
    IN_PROGRESS: {
      border: 'border-blue-300',
      pill: 'bg-blue-50 text-blue-700',
      countPill: 'bg-blue-100 text-blue-800',
    },
    TESTING: {
      border: 'border-amber-300',
      pill: 'bg-amber-50 text-amber-700',
      countPill: 'bg-amber-100 text-amber-800',
    },
    DONE: {
      border: 'border-emerald-300',
      pill: 'bg-emerald-50 text-emerald-700',
      countPill: 'bg-emerald-100 text-emerald-800',
    },
  };

  const theme = columnThemes[status];

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col h-full rounded-2xl bg-slate-100/70 border p-3 min-w-[280px] max-w-xs sm:max-w-none flex-1 transition-all ${
        isOver ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-400/20 shadow-md' : 'border-slate-200/80'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${theme.pill}`}>
            {title}
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${theme.countPill}`}>
            {tasks.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onAddTask(status)}
          title={`Add task to ${title}`}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task Cards list */}
      <div className="flex-1 space-y-2.5 overflow-y-auto min-h-[150px] pr-0.5">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onOpenDetails={onOpenDetails}
            onStatusChange={onStatusChange}
          />
        ))}

        {tasks.length === 0 && (
          <div className="h-28 flex items-center justify-center border border-dashed border-slate-300/80 rounded-xl text-xs text-slate-400 italic">
            Drag cards here or click +
          </div>
        )}
      </div>

      {/* Bottom Quick Add Button */}
      <button
        type="button"
        onClick={() => onAddTask(status)}
        className="mt-3 w-full py-1.5 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 hover:bg-white/80 rounded-lg transition-colors border border-transparent hover:border-slate-200 shadow-2xs"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Task</span>
      </button>
    </div>
  );
};
