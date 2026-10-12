import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Issue, IssueStatus } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { IssueStatusBadge, PriorityBadge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { ConfirmModal } from '../common/ConfirmModal';
import { Trash2, Edit3, MessageSquare, Send, CheckCircle2, ArrowRight } from 'lucide-react';

interface IssueDetailModalProps {
  issueId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (issue: Issue) => void;
  onIssueUpdated: () => void;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({
  issueId,
  isOpen,
  onClose,
  onEdit,
  onIssueUpdated,
}) => {
  const { user, hasRole } = useAuth();
  const [issue, setIssue] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    if (issueId && isOpen) {
      loadIssue(issueId);
      setStatusError(null);
    } else {
      setIssue(null);
    }
  }, [issueId, isOpen]);

  const loadIssue = async (id: string) => {
    try {
      const res = await api.issues.getById(id);
      setIssue(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!issueId || !isOpen) return null;

  const handleStatusTransition = async (newStatus: IssueStatus) => {
    try {
      setStatusError(null);
      await api.issues.updateStatus(issueId, newStatus);
      await loadIssue(issueId);
      onIssueUpdated();
    } catch (err: any) {
      setStatusError(err.message || 'Failed to update issue status');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setIsSubmittingComment(true);
      await api.comments.create({
        content: commentText.trim(),
        issueId,
      });
      setCommentText('');
      await loadIssue(issueId);
      onIssueUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteIssue = async () => {
    try {
      setIsDeleting(true);
      await api.issues.delete(issueId);
      setIsConfirmDeleteOpen(false);
      onClose();
      onIssueUpdated();
    } catch (err) {
      console.error(err);
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
        title={issue ? `${issue.issueKey}: ${issue.title}` : 'Issue Details'}
        subtitle={`Type: ${issue?.type} | Project: ${issue?.project?.name || ''}`}
        maxWidth="xl"
      >
        <div className="space-y-5">
          {/* Status & Priority Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Status:</span>
              <IssueStatusBadge status={issue?.status || 'OPEN'} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Priority:</span>
              <PriorityBadge priority={issue?.priority || 'MEDIUM'} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-medium">Category:</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                {issue?.type}
              </span>
            </div>
          </div>

          {/* Workflow Transitions */}
          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
                Issue Lifecycle Workflow
              </h5>
              <span className="text-[10px] text-slate-500">
                Open → In Progress → Fixed → Closed
              </span>
            </div>

            {statusError && (
              <div className="mb-2 p-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {statusError}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {issue?.status === 'OPEN' && (
                <button
                  onClick={() => handleStatusTransition('IN_PROGRESS')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  Start Investigation (In Progress) <ArrowRight className="w-3 h-3" />
                </button>
              )}

              {issue?.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleStatusTransition('FIXED')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  Mark as Fixed (Ready for QA) <ArrowRight className="w-3 h-3" />
                </button>
              )}

              {issue?.status === 'FIXED' && (
                <button
                  onClick={() => handleStatusTransition('CLOSED')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verify & Close Issue (QA Tester / PM)
                </button>
              )}

              {issue?.status === 'CLOSED' && (
                <button
                  onClick={() => handleStatusTransition('OPEN')}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Reopen Issue
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h5 className="text-xs font-semibold text-slate-800 mb-1">Description</h5>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/70 whitespace-pre-wrap leading-relaxed">
              {issue?.description}
            </p>
          </div>

          {/* Bug Reproduction Section */}
          {issue?.reproductionSteps && (
            <div className="space-y-3 p-3.5 bg-rose-50/40 rounded-xl border border-rose-100">
              <h5 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                Bug Reproduction Details
              </h5>
              <div>
                <span className="text-[11px] font-semibold text-slate-600 block mb-0.5">Steps to Reproduce:</span>
                <p className="text-xs font-mono text-slate-800 bg-white p-2.5 rounded-lg border border-rose-100 whitespace-pre-wrap">
                  {issue.reproductionSteps}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {issue.expectedBehavior && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 block mb-0.5">Expected Behavior:</span>
                    <p className="p-2 bg-white rounded border border-slate-200 text-slate-700">
                      {issue.expectedBehavior}
                    </p>
                  </div>
                )}
                {issue.actualBehavior && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 block mb-0.5">Actual Behavior:</span>
                    <p className="p-2 bg-white rounded border border-slate-200 text-rose-700 font-medium">
                      {issue.actualBehavior}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Related Task */}
          {issue?.task && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <span className="text-slate-500">Related Task:</span>
              <span className="font-semibold text-slate-800">
                {issue.task.taskKey} - {issue.task.title}
              </span>
            </div>
          )}

          {/* People & Roles */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Reporter</span>
              <span className="font-medium text-slate-700">{issue?.reporter?.fullName || 'Reporter'}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Assignee</span>
              {issue?.assignee ? (
                <div className="flex items-center gap-1.5">
                  <Avatar name={issue.assignee.fullName} size="xs" />
                  <span className="font-medium text-slate-700">{issue.assignee.fullName}</span>
                </div>
              ) : (
                <span className="text-slate-400 italic">Unassigned</span>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h5 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Investigation Comments ({issue?.comments?.length ?? 0})
            </h5>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {issue?.comments?.map((c: any) => (
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
                placeholder="Post an investigation update or comment..."
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

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {canDelete ? (
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(true)}
                className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Issue
              </button>
            ) : <div />}
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(issue);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Issue
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleDeleteIssue}
        title="Delete Issue"
        message={`Are you sure you want to permanently delete issue "${issue?.title}"?`}
        confirmLabel="Delete Issue"
        isLoading={isDeleting}
      />
    </>
  );
};
