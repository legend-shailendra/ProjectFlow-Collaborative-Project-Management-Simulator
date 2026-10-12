import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Issue, IssueType, PriorityLevel, IssueStatus, TeamMember, Task } from '../../types';
import { api } from '../../services/api';
import { useProject } from '../../context/ProjectContext';

interface IssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  issueToEdit?: Issue | null;
  teamMembers: TeamMember[];
  tasks: Task[];
}

export const IssueModal: React.FC<IssueModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  issueToEdit,
  teamMembers,
  tasks,
}) => {
  const { activeProject } = useProject();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'BUG' as IssueType,
    priority: 'MEDIUM' as PriorityLevel,
    status: 'OPEN' as IssueStatus,
    reproductionSteps: '',
    expectedBehavior: '',
    actualBehavior: '',
    taskId: '',
    assigneeId: '',
  });

  useEffect(() => {
    if (issueToEdit) {
      setFormData({
        title: issueToEdit.title,
        description: issueToEdit.description,
        type: issueToEdit.type,
        priority: issueToEdit.priority,
        status: issueToEdit.status,
        reproductionSteps: issueToEdit.reproductionSteps || '',
        expectedBehavior: issueToEdit.expectedBehavior || '',
        actualBehavior: issueToEdit.actualBehavior || '',
        taskId: issueToEdit.taskId || '',
        assigneeId: issueToEdit.assigneeId || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'BUG',
        priority: 'MEDIUM',
        status: 'OPEN',
        reproductionSteps: '1. Step one\n2. Step two\n3. Observe bug',
        expectedBehavior: 'Application functions normally without crash.',
        actualBehavior: 'Application throws error or does not respond.',
        taskId: '',
        assigneeId: '',
      });
    }
  }, [issueToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) {
      setError('No active project selected.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        status: formData.status,
        reproductionSteps: formData.reproductionSteps || null,
        expectedBehavior: formData.expectedBehavior || null,
        actualBehavior: formData.actualBehavior || null,
        taskId: formData.taskId || null,
        assigneeId: formData.assigneeId || null,
      };

      if (issueToEdit) {
        await api.issues.update(issueToEdit.id, payload);
      } else {
        await api.issues.create(activeProject.id, payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={issueToEdit ? `Edit Issue (${issueToEdit.issueKey})` : 'Report New Issue / Bug'}
      subtitle={`Project: ${activeProject?.name}`}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Issue Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Login button unresponsive on mobile Safari"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as IssueType })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="BUG">Bug</option>
              <option value="TASK">Task</option>
              <option value="IMPROVEMENT">Improvement</option>
              <option value="FEATURE">Feature Request</option>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as IssueStatus })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="FIXED">Fixed</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Detailed Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            placeholder="Describe the issue, context, error messages, and affected users..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Bug Reproduction Section */}
        {formData.type === 'BUG' && (
          <div className="space-y-3 p-3.5 bg-rose-50/50 rounded-xl border border-rose-100">
            <h5 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
              QA Bug Reproduction Report
            </h5>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reproduction Steps</label>
              <textarea
                rows={2}
                placeholder="1. Open page... 2. Click button... 3. Enter value..."
                value={formData.reproductionSteps}
                onChange={(e) => setFormData({ ...formData, reproductionSteps: e.target.value })}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-mono text-[11px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Behavior</label>
                <input
                  type="text"
                  placeholder="What was supposed to happen..."
                  value={formData.expectedBehavior}
                  onChange={(e) => setFormData({ ...formData, expectedBehavior: e.target.value })}
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Actual Behavior</label>
                <input
                  type="text"
                  placeholder="What actually occurred..."
                  value={formData.actualBehavior}
                  onChange={(e) => setFormData({ ...formData, actualBehavior: e.target.value })}
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Related Task</label>
            <select
              value={formData.taskId}
              onChange={(e) => setFormData({ ...formData, taskId: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">None (Standalone Issue)</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.taskKey}: {t.title}
                </option>
              ))}
            </select>
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
                  {m.fullName} ({m.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
          >
            {isSubmitting ? 'Saving...' : issueToEdit ? 'Update Issue' : 'Submit Issue'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
