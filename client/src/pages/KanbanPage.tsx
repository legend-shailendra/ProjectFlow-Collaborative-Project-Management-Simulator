import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Filter, Search, RotateCcw, AlertTriangle } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { api } from '../services/api';
import { Task, TaskStatus, PriorityLevel, TeamMember, UserStory } from '../types';
import { KanbanColumn } from '../components/kanban/KanbanColumn';
import { TaskDetailModal } from '../components/kanban/TaskDetailModal';
import { AddTaskModal } from '../components/kanban/AddTaskModal';

export const KanbanPage: React.FC = () => {
  const { activeProject } = useProject();
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [stories, setStories] = useState<UserStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');

  // Modals state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [initialAddStatus, setInitialAddStatus] = useState<TaskStatus>('TODO');

  const loadData = async () => {
    if (!activeProject) {
      setTasks([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorBanner(null);

      const [tasksRes, membersRes, storiesRes] = await Promise.all([
        api.tasks.getByProject(activeProject.id),
        api.team.getMembers(activeProject.id),
        api.stories.getByProject(activeProject.id),
      ]);

      setTasks(tasksRes.data || []);
      setTeamMembers(membersRes.data || []);
      setStories(storiesRes.data || []);

      // Check if URL specified a taskId to open
      const paramTaskId = searchParams.get('taskId');
      if (paramTaskId) {
        const found = (tasksRes.data || []).find((t: Task) => t.id === paramTaskId);
        if (found) {
          setSelectedTask(found);
          setIsDetailModalOpen(true);
        }
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to load Kanban tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject]);

  // Handle Drag & Drop with immediate optimistic update and database persistence
  const handleDropTask = async (taskId: string, targetStatus: TaskStatus) => {
    const originalTasks = [...tasks];
    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove || taskToMove.status === targetStatus) return;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    try {
      await api.tasks.updateStatus(taskId, targetStatus);
    } catch (err: any) {
      // Rollback on failure
      setTasks(originalTasks);
      setErrorBanner(`Failed to move task: ${err.message}. Changes were rolled back.`);
    }
  };

  const handleOpenAddTask = (status: TaskStatus = 'TODO') => {
    setInitialAddStatus(status);
    setIsAddModalOpen(true);
  };

  const handleOpenDetails = (task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (assigneeFilter !== 'ALL' && t.assigneeId !== assigneeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchKey = t.taskKey.toLowerCase().includes(q);
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      if (!matchKey && !matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const columns: { status: TaskStatus; title: string }[] = [
    { status: 'TODO', title: 'To Do' },
    { status: 'IN_PROGRESS', title: 'In Progress' },
    { status: 'TESTING', title: 'Testing' },
    { status: 'DONE', title: 'Done' },
  ];

  const handleClearFilters = () => {
    setSearch('');
    setPriorityFilter('ALL');
    setAssigneeFilter('ALL');
  };

  const hasActiveFilters = search || priorityFilter !== 'ALL' || assigneeFilter !== 'ALL';

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Kanban Board
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Agile task workflow simulation for{' '}
            <span className="font-semibold text-slate-700">
              {activeProject?.name || 'Workspace'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenAddTask('TODO')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Task
          </button>
        </div>
      </div>

      {/* Error banner if network/drag fails */}
      {errorBanner && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            onClick={() => setErrorBanner(null)}
            className="font-semibold text-rose-800 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search field */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300/80 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Assignee filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300/80 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[140px] truncate"
          >
            <option value="ALL">All Assignees</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Showing {filteredTasks.length} of {tasks.length} tasks
        </div>
      </div>

      {/* Kanban Board 4 Columns Canvas */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="animate-spin text-2xl">⏳</span>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <KanbanColumn
              key={col.status}
              status={col.status}
              title={col.title}
              tasks={filteredTasks.filter((t) => t.status === col.status)}
              onDropTask={handleDropTask}
              onOpenDetails={handleOpenDetails}
              onAddTask={handleOpenAddTask}
              onStatusChange={handleDropTask}
            />
          ))}
        </div>
      )}

      {/* Task Details Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTask(null);
        }}
        onTaskUpdated={loadData}
        teamMembers={teamMembers}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTaskCreated={loadData}
        initialStatus={initialAddStatus}
        teamMembers={teamMembers}
        stories={stories}
      />
    </div>
  );
};
