import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { UserStory } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StoryStatusBadge, PriorityBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { ConfirmModal } from '../common/ConfirmModal';
import { CheckSquare, Trash2, Edit3, MessageSquare, Send } from 'lucide-react';

interface StoryDetailModalProps {
  storyId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (story: UserStory) => void;
  onStoryUpdated: () => void;
}

export const StoryDetailModal: React.FC<StoryDetailModalProps> = ({
  storyId,
  isOpen,
  onClose,
  onEdit,
  onStoryUpdated,
}) => {
  const { user, hasRole } = useAuth();
  const [story, setStory] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (storyId && isOpen) {
      loadStory(storyId);
    } else {
      setStory(null);
    }
  }, [storyId, isOpen]);

  const loadStory = async (id: string) => {
    try {
      const res = await api.stories.getById(id);
      setStory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!storyId || !isOpen) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setIsSubmittingComment(true);
      await api.comments.create({
        content: commentText.trim(),
        userStoryId: storyId,
      });
      setCommentText('');
      await loadStory(storyId);
      onStoryUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteStory = async () => {
    try {
      setIsDeleting(true);
      await api.stories.delete(storyId);
      setIsConfirmDeleteOpen(false);
      onClose();
      onStoryUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  let criteriaList: string[] = [];
  try {
    if (story?.acceptanceCriteria) {
      criteriaList = Array.isArray(story.acceptanceCriteria)
        ? story.acceptanceCriteria
        : JSON.parse(story.acceptanceCriteria);
    }
  } catch (e) {
    criteriaList = story?.acceptanceCriteria ? [story.acceptanceCriteria] : [];
  }

  const canDelete = hasRole(['ADMIN', 'PROJECT_MANAGER']);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={story ? `${story.storyKey}: ${story.title}` : 'User Story'}
        subtitle={`Project: ${story?.project?.name || ''}`}
        maxWidth="xl"
      >
        <div className="space-y-5">
          {/* Status & Points Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Status:</span>
              <StoryStatusBadge status={story?.status || 'BACKLOG'} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Priority:</span>
              <PriorityBadge priority={story?.priority || 'MEDIUM'} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Estimation:</span>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                {story?.storyPoints || 0} story points
              </span>
            </div>
          </div>

          {/* User Story Statement Card */}
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 mb-1.5">
              User Story Statement
            </h5>
            <p className="text-xs font-medium text-slate-800 leading-relaxed italic">
              "{story?.userStatement}"
            </p>
          </div>

          {/* Acceptance Criteria */}
          <div>
            <h5 className="text-xs font-semibold text-slate-800 mb-2">Acceptance Criteria</h5>
            <div className="space-y-1.5">
              {criteriaList.map((crit, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-200/70 text-xs text-slate-700">
                  <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{crit}</span>
                </div>
              ))}
              {criteriaList.length === 0 && (
                <p className="text-xs text-slate-400 italic">No acceptance criteria defined.</p>
              )}
            </div>
          </div>

          {/* Linked Tasks */}
          <div>
            <h5 className="text-xs font-semibold text-slate-800 mb-2">
              Decomposed Tasks ({story?.tasks?.length ?? 0})
            </h5>
            <div className="space-y-1.5">
              {story?.tasks?.map((t: any) => (
                <div key={t.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 bg-white border rounded font-semibold text-slate-700">
                      {t.taskKey}
                    </span>
                    <span className="font-medium text-slate-800">{t.title}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">[{t.status}]</span>
                </div>
              ))}
              {(!story?.tasks || story.tasks.length === 0) && (
                <p className="text-xs text-slate-400 italic">No tasks linked yet.</p>
              )}
            </div>
          </div>

          {/* People & Comments */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Reporter</span>
              <span className="font-medium text-slate-700">{story?.reporter?.fullName || 'Manager'}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Assignee</span>
              {story?.assignee ? (
                <div className="flex items-center gap-1.5">
                  <Avatar name={story.assignee.fullName} size="xs" />
                  <span className="font-medium text-slate-700">{story.assignee.fullName}</span>
                </div>
              ) : (
                <span className="text-slate-400 italic">Unassigned</span>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h5 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Comments ({story?.comments?.length ?? 0})
            </h5>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {story?.comments?.map((c: any) => (
                <div key={c.id} className="p-2.5 bg-slate-50 rounded-lg text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar name={c.author.fullName} size="xs" />
                    <span className="font-semibold text-slate-800">{c.author.fullName}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-700 pl-6">{c.content}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Discuss user story..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
              >
                <Send className="w-3 h-3" /> Post
              </button>
            </form>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {canDelete ? (
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Story
              </button>
            ) : <div />}
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(story);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Story
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteStory}
        title="Delete User Story"
        message={`Are you sure you want to permanently delete "${story?.title}"?`}
        confirmLabel="Delete Story"
        isLoading={isDeleting}
      />
    </>
  );
};
