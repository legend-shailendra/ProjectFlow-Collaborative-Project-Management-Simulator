import React, { useState, useEffect } from 'react';
import { Users, UserPlus, CheckCircle, Clock } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { TeamMember, UserRole } from '../types';
import { Avatar } from '../components/common/Avatar';
import { RoleBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const TeamPage: React.FC = () => {
  const { activeProject } = useProject();
  const { user, hasRole } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('DEVELOPER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [membersRes, allUsersRes] = await Promise.all([
        api.team.getMembers(activeProject?.id),
        api.team.getMembers(), // workspace members
      ]);
      setMembers(membersRes.data || []);
      setAllUsers(allUsersRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !selectedUserId) return;

    try {
      setIsSubmitting(true);
      await api.projects.addMember(activeProject.id, {
        userId: selectedUserId,
        role: selectedRole,
      });
      await loadData();
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canManageTeam = hasRole(['ADMIN', 'PROJECT_MANAGER']);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Team Members & Collaboration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Engineers, Product Managers, and QA Testers participating in{' '}
            <span className="font-semibold text-slate-700">
              {activeProject ? activeProject.name : 'Workspace'}
            </span>
          </p>
        </div>

        {canManageTeam && activeProject && (
          <button
            onClick={() => {
              setSelectedUserId(allUsers[0]?.id || '');
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm self-start sm:self-auto"
          >
            <UserPlus className="w-3.5 h-3.5" /> Add Project Member
          </button>
        )}
      </div>

      {/* Team Members Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading team members...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {members.map((member) => {
            const completionRate =
              member.totalAssigned > 0
                ? Math.round((member.totalCompleted / member.totalAssigned) * 100)
                : 0;

            return (
              <div
                key={member.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar name={member.fullName} avatarUrl={member.avatarUrl} size="md" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-slate-900 truncate">{member.fullName}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{member.email}</p>
                    </div>
                  </div>

                  <div className="mt-2">
                    <RoleBadge role={member.role} />
                  </div>

                  {/* Contribution metrics */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
                        <Clock className="w-3 h-3" /> Assigned
                      </div>
                      <span className="text-sm font-bold text-slate-800">{member.totalAssigned}</span>
                    </div>

                    <div className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600 mb-0.5">
                        <CheckCircle className="w-3 h-3" /> Done
                      </div>
                      <span className="text-sm font-bold text-emerald-800">{member.totalCompleted}</span>
                    </div>
                  </div>

                  {/* Completion percentage bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Velocity</span>
                      <span className="font-semibold text-slate-700">{completionRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Role: {member.role}</span>
                  <span className="text-emerald-600 font-semibold">Active Contributor</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Member to Project"
        subtitle={`Assign teammate to ${activeProject?.name}`}
        maxWidth="md"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="DEVELOPER">Developer</option>
              <option value="TESTER">Tester</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg"
            >
              {isSubmitting ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
