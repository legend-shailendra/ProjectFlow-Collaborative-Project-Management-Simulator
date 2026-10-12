import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, Calendar, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { Task, TaskStatus, TeamMember } from '../types';
import { TaskStatusBadge, PriorityBadge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { TaskDetailModal } from '../components/kanban/TaskDetailModal';

export const MyTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const navigate = useNavigate();

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const res = await api.tasks.getMyTasks(activeTab);
      setTasks(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await api.team.getMembers();
        setTeamMembers(res.data || []);
      } catch (e) {
        console.error(e);
      }
    }
    loadMembers();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [activeTab]);

  const tabs = [
    { key: 'ALL', label: 'All Tasks' },
    { key: 'TODO', label: 'To Do' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'TESTING', label: 'Testing' },
    { key: 'DONE', label: 'Completed' },
  ];

  const overdueCount = tasks.filter((t) => t.isOverdue).length;
  const dueSoonCount = tasks.filter((t) => t.isDueSoon).length;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          My Personal Work Dashboard
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Direct work assignments, upcoming sprint deadlines, and task execution progress.
        </p>
      </div>

      {/* Deadline Alert Badges */}
      {(overdueCount > 0 || dueSoonCount > 0) && (
        <div className="flex flex-wrap gap-3">
          {overdueCount > 0 && (
            <div className="px-3.5 py-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>
                <strong>{overdueCount} task{overdueCount > 1 ? 's' : ''}</strong> past deadline!
              </span>
            </div>
          )}
          {dueSoonCount > 0 && (
            <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>
                <strong>{dueSoonCount} task{dueSoonCount > 1 ? 's' : ''}</strong> due within the next 3 days.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading your tasks...</div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="All Caught Up!"
          description="You currently have no tasks assigned in this status."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => {
                setSelectedTask(task);
                setIsDetailOpen(true);
              }}
              className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                    {task.taskKey}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {task.storyPoints !== null && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        {task.storyPoints} pts
                      </span>
                    )}
                    <PriorityBadge priority={task.priority} />
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {task.title}
                </h4>

                {task.project && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Project: <span className="font-medium text-slate-600">{task.project.name}</span>
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <TaskStatusBadge status={task.status} />

                {task.dueDate && (
                  <div
                    className={`flex items-center gap-1 text-[11px] font-medium ${
                      task.isOverdue ? 'text-rose-600' : 'text-slate-500'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(task.dueDate).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Details Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTask(null);
        }}
        onTaskUpdated={loadTasks}
        teamMembers={teamMembers}
      />
    </div>
  );
};
