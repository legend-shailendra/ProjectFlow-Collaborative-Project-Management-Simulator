import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { UserStory, PriorityLevel, StoryStatus, TeamMember } from '../../types';
import { api } from '../../services/api';
import { useProject } from '../../context/ProjectContext';
import { Plus, Trash2 } from 'lucide-react';

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  storyToEdit?: UserStory | null;
  teamMembers: TeamMember[];
}

export const StoryModal: React.FC<StoryModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  storyToEdit,
  teamMembers,
}) => {
  const { activeProject } = useProject();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    userStatement: 'As a customer, I want to search for restaurants so that I can find suitable food options.',
    acceptanceCriteria: ['Must return matching results', 'Show empty state when no matches'],
    priority: 'MEDIUM' as PriorityLevel,
    storyPoints: 3,
    status: 'BACKLOG' as StoryStatus,
    assigneeId: '',
  });

  useEffect(() => {
    if (storyToEdit) {
      let parsedCriteria: string[] = [];
      try {
        parsedCriteria = Array.isArray(storyToEdit.acceptanceCriteria)
          ? storyToEdit.acceptanceCriteria
          : JSON.parse(storyToEdit.acceptanceCriteria);
      } catch (e) {
        parsedCriteria = storyToEdit.acceptanceCriteria ? [storyToEdit.acceptanceCriteria] : [];
      }

      setFormData({
        title: storyToEdit.title,
        description: storyToEdit.description || '',
        userStatement: storyToEdit.userStatement,
        acceptanceCriteria: parsedCriteria.length > 0 ? parsedCriteria : [''],
        priority: storyToEdit.priority,
        storyPoints: storyToEdit.storyPoints || 3,
        status: storyToEdit.status,
        assigneeId: storyToEdit.assigneeId || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        userStatement: 'As a [user], I want [action], so that [outcome].',
        acceptanceCriteria: ['Criteria item 1'],
        priority: 'MEDIUM',
        storyPoints: 3,
        status: 'BACKLOG',
        assigneeId: '',
      });
    }
  }, [storyToEdit, isOpen]);

  const handleAddCriteria = () => {
    setFormData((prev) => ({
      ...prev,
      acceptanceCriteria: [...prev.acceptanceCriteria, ''],
    }));
  };

  const handleCriteriaChange = (index: number, val: string) => {
    const updated = [...formData.acceptanceCriteria];
    updated[index] = val;
    setFormData((prev) => ({ ...prev, acceptanceCriteria: updated }));
  };

  const handleRemoveCriteria = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      acceptanceCriteria: prev.acceptanceCriteria.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) {
      setError('No active project selected.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const filteredCriteria = formData.acceptanceCriteria.filter((c) => c.trim().length > 0);

      const payload = {
        title: formData.title,
        description: formData.description,
        userStatement: formData.userStatement,
        acceptanceCriteria: filteredCriteria,
        priority: formData.priority,
        storyPoints: Number(formData.storyPoints),
        status: formData.status,
        assigneeId: formData.assigneeId || null,
      };

      if (storyToEdit) {
        await api.stories.update(storyToEdit.id, payload);
      } else {
        await api.stories.create(activeProject.id, payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save user story');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={storyToEdit ? `Edit User Story (${storyToEdit.storyKey})` : 'Create User Story'}
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
            Story Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Restaurant Search & Filtering"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            User Story Statement (Standard Format) <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            required
            placeholder="As a [type of user], I want [functionality], so that [benefit]."
            value={formData.userStatement}
            onChange={(e) => setFormData({ ...formData, userStatement: e.target.value })}
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-indigo-50/20 font-medium text-slate-800"
          />
        </div>

        {/* Dynamic Acceptance Criteria */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">Acceptance Criteria</label>
            <button
              type="button"
              onClick={handleAddCriteria}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Criteria
            </button>
          </div>
          <div className="space-y-2">
            {formData.acceptanceCriteria.map((crit, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono w-4">{idx + 1}.</span>
                <input
                  type="text"
                  placeholder="e.g. Matching restaurants are displayed with ratings"
                  value={crit}
                  onChange={(e) => handleCriteriaChange(idx, e.target.value)}
                  className="flex-1 text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {formData.acceptanceCriteria.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCriteria(idx)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as StoryStatus })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="BACKLOG">Backlog</option>
              <option value="READY">Ready</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Story Points (Fibonacci)</label>
            <select
              value={formData.storyPoints}
              onChange={(e) => setFormData({ ...formData, storyPoints: Number(e.target.value) })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {[1, 2, 3, 5, 8, 13].map((pt) => (
                <option key={pt} value={pt}>
                  {pt} points
                </option>
              ))}
            </select>
          </div>
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
            {isSubmitting ? 'Saving...' : storyToEdit ? 'Update Story' : 'Create User Story'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
