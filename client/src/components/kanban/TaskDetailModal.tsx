import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Task, TaskStatus, PriorityLevel, TeamMember } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { PriorityBadge, TaskStatusBadge } from '../common/Badge';
import { ConfirmModal } from '../common/ConfirmModal';
import { Trash2, Send, AlertCircle, MessageSquare } from 'lucide-react';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
  teamMembers: TeamMember[];
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated,
  teamMembers,
}) => {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'issues'>('details');
  const [fullTask, setFullTask] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO' as TaskStatus,
    priority: 'MEDIUM' as PriorityLevel,
    storyPoints: 2,
    dueDate: '',
    assigneeId: '',
  });

  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (task && isOpen) {
      loadTaskDetails(task.id);
    } else {
      setFullTask(null);
      setIsEditing(false);
    }
  }, [task, isOpen]);

  const loadTaskDetails = async (id: string) => {
    try {
      const res = await api.tasks.getById(id);
      const data = res.data;
      setFullTask(data);
      setFormData({
        title: data.title,
        description: data.description || '',
        status: data.status,
        priority: data.priority,
        storyPoints: data.storyPoints || 2,
        dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
        assigneeId: data.assigneeId || '',
      });
    } catch (err) {
      console.error('Failed to load task:', err);
    }
  };

  if (!task || !isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.tasks.update(task.id, {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        storyPoints: Number(formData.storyPoints),
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        assigneeId: formData.assigneeId || null,
      });
      setIsEditing(false);
      await loadTaskDetails(task.id);
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setIsSubmittingComment(true);
      await api.comments.create({
        content: commentText.trim(),
        taskId: task.id,
      });
      setCommentText('');
      await loadTaskDetails(task.id);
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.comments.delete(commentId);
      await loadTaskDetails(task.id);
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleDeleteTask = async () => {
    try {
      setIsDeleting(true);
      await api.tasks.delete(task.id);
      setIsConfirmDeleteOpen(false);
      onClose();
      onTaskUpdated();
    } catch (err) {
      console.error('Failed to delete task:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = hasRole(['ADMIN', 'PROJECT_MANAGER']);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={fullTask ? `${fullTask.taskKey}: ${fullTask.title}` : 'Task Details'}
        subtitle={`Created in ${fullTask?.project?.name || 'Project'}`}
        maxWidth="xl"
      >
        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('comments')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'comments'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Comments ({fullTask?.comments?.length ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('issues')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'issues'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Linked Issues ({fullTask?.issues?.length ?? 0})
          </button>
        </div>

        {/* Tab 1: Details */}
        {activeTab === 'details' && (
          <div>
            {!isEditing ? (
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</h4>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {fullTask?.description || 'No description provided.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Status</span>
                    <TaskStatusBadge status={fullTask?.status || 'TODO'} />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Priority</span>
                    <PriorityBadge priority={fullTask?.priority || 'MEDIUM'} />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Story Points</span>
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {fullTask?.storyPoints || 0} pts
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Due Date</span>
                    <span className="text-xs text-slate-700 font-medium">
                      {fullTask?.dueDate
                        ? new Date(fullTask.dueDate).toLocaleDateString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'No deadline'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Assignee</span>
                    {fullTask?.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <Avatar name={fullTask.assignee.fullName} avatarUrl={fullTask.assignee.avatarUrl} size="xs" />
                        <span className="text-xs text-slate-700 font-medium">{fullTask.assignee.fullName}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Unassigned</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Reporter</span>
                    <span className="text-xs text-slate-700 font-medium">
                      {fullTask?.reporter?.fullName || 'System'}
                    </span>
                  </div>
                </div>

                {fullTask?.userStory && (
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs">
                    <span className="font-semibold text-indigo-900 block mb-0.5">Parent User Story</span>
                    <span className="font-mono text-indigo-700 font-bold mr-1.5">
                      {fullTask.userStory.storyKey}
                    </span>
                    <span className="text-slate-700">{fullTask.userStory.title}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => setIsConfirmDeleteOpen(true)}
                      className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Task
                    </button>
                  ) : <div />}
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs"
                  >
                    Edit Task
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="TESTING">Testing</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Story Points</label>
                    <select
                      value={formData.storyPoints}
                      onChange={(e) => setFormData({ ...formData, storyPoints: Number(e.target.value) })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      {[1, 2, 3, 5, 8, 13].map((pt) => (
                        <option key={pt} value={pt}>
                          {pt} pts
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee</label>
                    <select
                      value={formData.assigneeId}
                      onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Comments */}
        {activeTab === 'comments' && (
          <div className="space-y-4">
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {fullTask?.comments?.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">No comments yet. Start the discussion!</p>
              ) : (
                fullTask?.comments?.map((c: any) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={c.author.fullName} avatarUrl={c.author.avatarUrl} size="xs" />
                        <span className="font-semibold text-slate-800">{c.author.fullName}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {(c.authorId === user?.id || user?.role === 'ADMIN') && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-700 pl-8 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-slate-100">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                Post
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Linked Issues */}
        {activeTab === 'issues' && (
          <div className="space-y-3">
            {fullTask?.issues?.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No linked bugs or issues on this task.</p>
            ) : (
              fullTask?.issues?.map((iss: any) => (
                <div
                  key={iss.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded font-bold">
                      {iss.issueKey}
                    </span>
                    <span className="font-semibold text-slate-800">{iss.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={iss.priority} />
                    <span className="text-[11px] font-medium text-slate-500">[{iss.status}]</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to permanently delete "${fullTask?.title}"? This cannot be undone.`}
        confirmLabel="Delete Task"
        isLoading={isDeleting}
      />
    </>
  );
};
