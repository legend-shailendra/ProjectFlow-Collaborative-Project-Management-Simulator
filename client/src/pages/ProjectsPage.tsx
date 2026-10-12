import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, Users, CheckCircle, Calendar, ArrowRight, Trash2, Edit3 } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Project, ProjectStatus } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const ProjectsPage: React.FC = () => {
  const { projects, activeProject, setActiveProject, refreshProjects } = useProject();
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    status: 'ACTIVE' as ProjectStatus,
    startDate: '',
    targetDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreate = () => {
    setProjectToEdit(null);
    setFormData({
      name: '',
      key: '',
      description: '',
      status: 'ACTIVE',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: '',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, p: Project) => {
    e.stopPropagation();
    setProjectToEdit(p);
    setFormData({
      name: p.name,
      key: p.key,
      description: p.description || '',
      status: p.status,
      startDate: p.startDate ? p.startDate.split('T')[0] : '',
      targetDate: p.targetDate ? p.targetDate.split('T')[0] : '',
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        name: formData.name,
        key: formData.key.toUpperCase(),
        description: formData.description,
        status: formData.status,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        targetDate: formData.targetDate ? new Date(formData.targetDate).toISOString() : null,
      };

      if (projectToEdit) {
        await api.projects.update(projectToEdit.id, payload);
      } else {
        await api.projects.create(payload);
      }

      await refreshProjects();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;
    try {
      setIsDeleting(true);
      await api.projects.delete(projectToDelete.id);
      await refreshProjects();
      setProjectToDelete(null);
    } catch (err: any) {
      alert(`Error deleting project: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectProject = (p: Project) => {
    setActiveProject(p);
    navigate('/kanban');
  };

  const canCreate = hasRole(['ADMIN', 'PROJECT_MANAGER']);
  const canDelete = hasRole(['ADMIN']);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Workspace Projects
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage projects, keys, delivery schedules, and Agile simulation boards.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" /> Create Project
          </button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((proj) => {
          const isCurrentActive = activeProject?.id === proj.id;
          const completion = proj.metrics?.completionPercentage || 0;

          return (
            <div
              key={proj.id}
              onClick={() => handleSelectProject(proj)}
              className={`bg-white rounded-2xl border p-5 transition-all cursor-pointer group flex flex-col justify-between shadow-2xs hover:shadow-md ${
                isCurrentActive ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200/90'
              }`}
            >
              <div>
                {/* Card Top: Key & Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/60 rounded">
                      {proj.key}
                    </span>
                    {isCurrentActive && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50/70 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {proj.status}
                  </span>
                </div>

                {/* Project Title & Description */}
                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {proj.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {proj.description || 'No description provided.'}
                </p>

                {/* Metrics Progress Bar */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-medium">Sprint Completion</span>
                    <span className="font-bold text-slate-800">{completion}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>

                {/* Meta details: Team count, total tasks */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{proj.members?.length || 1} members</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>{proj.metrics?.totalTasks || 0} tasks</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Target Date & Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {proj.targetDate
                      ? new Date(proj.targetDate).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'No target date'}
                  </span>
                </div>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {canCreate && (
                    <button
                      onClick={(e) => handleOpenEdit(e, proj)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100"
                      title="Edit project"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(proj);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleSelectProject(proj)}
                    className="p-1.5 text-indigo-600 hover:text-indigo-800 rounded-md hover:bg-indigo-50 font-medium flex items-center gap-1"
                  >
                    Open <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={projectToEdit ? `Edit Project: ${projectToEdit.name}` : 'Create New Project'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Online Food Delivery System"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Project Key (Prefix Identifier) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={8}
              placeholder="e.g. OFD"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
              disabled={Boolean(projectToEdit)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono disabled:bg-slate-100 uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Agile scope and platform deliverables..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date</label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm"
            >
              {isSubmitting ? 'Saving...' : projectToEdit ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(projectToDelete)}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to permanently delete "${projectToDelete?.name}" (${projectToDelete?.key})? All tasks, stories, and issues will be removed.`}
        confirmLabel="Delete Project"
        isLoading={isDeleting}
      />
    </div>
  );
};
