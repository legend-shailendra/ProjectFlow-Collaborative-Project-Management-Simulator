import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, AlertCircle, RotateCcw } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { api } from '../services/api';
import { Issue, TeamMember, Task } from '../types';
import { IssueStatusBadge, PriorityBadge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { EmptyState } from '../components/common/EmptyState';
import { IssueModal } from '../components/issues/IssueModal';
import { IssueDetailModal } from '../components/issues/IssueDetailModal';

export const IssuesPage: React.FC = () => {
  const { activeProject } = useProject();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [issueToEdit, setIssueToEdit] = useState<Issue | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadData = async () => {
    if (!activeProject) {
      setIssues([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [issuesRes, membersRes, tasksRes] = await Promise.all([
        api.issues.getByProject(activeProject.id),
        api.team.getMembers(activeProject.id),
        api.tasks.getByProject(activeProject.id),
      ]);
      setIssues(issuesRes.data || []);
      setTeamMembers(membersRes.data || []);
      setTasks(tasksRes.data || []);
    } catch (err) {
      console.error('Failed to load issues:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject]);

  const filteredIssues = issues.filter((i) => {
    if (typeFilter !== 'ALL' && i.type !== typeFilter) return false;
    if (statusFilter !== 'ALL' && i.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && i.priority !== priorityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchKey = i.issueKey.toLowerCase().includes(q);
      const matchTitle = i.title.toLowerCase().includes(q);
      const matchDesc = i.description.toLowerCase().includes(q);
      if (!matchKey && !matchTitle && !matchDesc) return false;
    }
    return true;
  });

  const handleOpenCreate = () => {
    setIssueToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (issue: Issue) => {
    setIssueToEdit(issue);
    setIsModalOpen(true);
  };

  const handleOpenDetails = (id: string) => {
    setSelectedIssueId(id);
    setIsDetailOpen(true);
  };

  const hasActiveFilters = search || typeFilter !== 'ALL' || statusFilter !== 'ALL' || priorityFilter !== 'ALL';

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Issues & Bug Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Defect management and QA workflow lifecycle for{' '}
            <span className="font-semibold text-slate-700">
              {activeProject ? activeProject.name : 'Workspace'}
            </span>
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Report Issue
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search bugs and issues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300/80 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Types</option>
            <option value="BUG">Bug</option>
            <option value="TASK">Task</option>
            <option value="IMPROVEMENT">Improvement</option>
            <option value="FEATURE">Feature</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300/80 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="FIXED">Fixed</option>
            <option value="CLOSED">Closed</option>
          </select>

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

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearch('');
                setTypeFilter('ALL');
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
              }}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        <div className="text-xs text-slate-400 font-medium">
          {filteredIssues.length} of {issues.length} issues
        </div>
      </div>

      {/* Issues Table */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading issues...</div>
      ) : filteredIssues.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No Issues Reported"
          description="Track bugs, reproduction steps, improvements, and verify fixes with your QA team."
          actionLabel="Report Issue"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Issue Key</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Reported</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    onClick={() => handleOpenDetails(issue.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono font-semibold text-slate-600">
                      <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[11px]">
                        {issue.issueKey}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-sm">
                      <p className="font-semibold text-slate-900 line-clamp-1">{issue.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {issue.description}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[10px]">
                        {issue.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={issue.priority} />
                    </td>
                    <td className="px-4 py-3.5">
                      <IssueStatusBadge status={issue.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      {issue.assignee ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar name={issue.assignee.fullName} size="xs" />
                          <span className="text-slate-700 font-medium truncate max-w-[120px]">
                            {issue.assignee.fullName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                      {new Date(issue.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEdit(issue)}
                        className="px-2.5 py-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-medium rounded transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issue Create / Edit Modal */}
      <IssueModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadData}
        issueToEdit={issueToEdit}
        teamMembers={teamMembers}
        tasks={tasks}
      />

      {/* Issue Detail Modal */}
      <IssueDetailModal
        issueId={selectedIssueId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedIssueId(null);
        }}
        onEdit={handleOpenEdit}
        onIssueUpdated={loadData}
      />
    </div>
  );
};
