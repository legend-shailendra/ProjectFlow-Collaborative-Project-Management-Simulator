import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, BookOpen, RotateCcw, CheckSquare } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { api } from '../services/api';
import { UserStory, TeamMember } from '../types';
import { StoryStatusBadge, PriorityBadge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { EmptyState } from '../components/common/EmptyState';
import { StoryModal } from '../components/stories/StoryModal';
import { StoryDetailModal } from '../components/stories/StoryDetailModal';

export const StoriesPage: React.FC = () => {
  const { activeProject } = useProject();
  const [stories, setStories] = useState<UserStory[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storyToEdit, setStoryToEdit] = useState<UserStory | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const loadData = async () => {
    if (!activeProject) {
      setStories([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [storiesRes, teamRes] = await Promise.all([
        api.stories.getByProject(activeProject.id),
        api.team.getMembers(activeProject.id),
      ]);
      setStories(storiesRes.data || []);
      setTeamMembers(teamRes.data || []);
    } catch (err) {
      console.error('Failed to load user stories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject]);

  const filteredStories = stories.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && s.priority !== priorityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchKey = s.storyKey.toLowerCase().includes(q);
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchStatement = s.userStatement.toLowerCase().includes(q);
      if (!matchKey && !matchTitle && !matchStatement) return false;
    }
    return true;
  });

  const handleOpenCreate = () => {
    setStoryToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (story: UserStory) => {
    setStoryToEdit(story);
    setIsModalOpen(true);
  };

  const handleOpenDetails = (id: string) => {
    setSelectedStoryId(id);
    setIsDetailOpen(true);
  };

  const hasActiveFilters = search || statusFilter !== 'ALL' || priorityFilter !== 'ALL';

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            User Stories Backlog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Requirements management and Agile user story prioritization for{' '}
            <span className="font-semibold text-slate-700">
              {activeProject ? activeProject.name : 'Workspace'}
            </span>
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Create User Story
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search user stories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300/80 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="BACKLOG">Backlog</option>
            <option value="READY">Ready</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
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
          {filteredStories.length} of {stories.length} stories
        </div>
      </div>

      {/* Stories Table */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading stories...</div>
      ) : filteredStories.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No User Stories Found"
          description="Create your first Agile user story with measurable acceptance criteria and story points."
          actionLabel="Add Story"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Key</th>
                  <th className="px-4 py-3">Title & User Statement</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3 text-center">Points</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStories.map((story) => (
                  <tr
                    key={story.id}
                    onClick={() => handleOpenDetails(story.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5 font-mono font-semibold text-slate-600">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px]">
                        {story.storyKey}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-md">
                      <p className="font-semibold text-slate-900 line-clamp-1">{story.title}</p>
                      <p className="text-[11px] text-slate-500 italic line-clamp-1 mt-0.5">
                        "{story.userStatement}"
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <StoryStatusBadge status={story.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={story.priority} />
                    </td>
                    <td className="px-4 py-3.5 text-center font-bold text-indigo-700">
                      <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[11px]">
                        {story.storyPoints}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {story.assignee ? (
                        <div className="flex items-center gap-1.5">
                          <Avatar name={story.assignee.fullName} size="xs" />
                          <span className="text-slate-700 font-medium truncate max-w-[120px]">
                            {story.assignee.fullName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenEdit(story)}
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

      {/* Story Form Modal */}
      <StoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadData}
        storyToEdit={storyToEdit}
        teamMembers={teamMembers}
      />

      {/* Story Details Modal */}
      <StoryDetailModal
        storyId={selectedStoryId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedStoryId(null);
        }}
        onEdit={handleOpenEdit}
        onStoryUpdated={loadData}
      />
    </div>
  );
};
