import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Kanban,
  BookOpen,
  AlertCircle,
  Users,
  BarChart3,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/Badge';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { activeProject } = useProject();
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Tasks', path: '/my-tasks', icon: CheckSquare },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Kanban Board', path: '/kanban', icon: Kanban },
    { name: 'User Stories', path: '/stories', icon: BookOpen },
    { name: 'Issues & Bugs', path: '/issues', icon: AlertCircle },
    { name: 'Team Members', path: '/team', icon: Users },
    { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <span className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
            ProjectFlow
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">
              v1.0
            </span>
          </span>
          <p className="text-[11px] text-slate-400">Agile Simulator</p>
        </div>
      </div>

      {/* Active Project Banner */}
      <div className="px-4 py-3 mx-3 my-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span>Active Project</span>
          {activeProject && (
            <span className="font-mono text-[10px] bg-slate-700 text-indigo-300 px-1.5 py-0.5 rounded">
              {activeProject.key}
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-white mt-1 truncate" title={activeProject?.name || 'No project'}>
          {activeProject ? activeProject.name : 'Select a project'}
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Current User Session Bar */}
      {user && (
        <div className="p-3 mx-3 mb-3 bg-slate-800/50 rounded-xl border border-slate-800 flex items-center gap-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
            <div className="mt-1">
              <RoleBadge role={user.role} />
            </div>
          </div>
          <div title="Role Verified by Server RBAC">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          </div>
        </div>
      )}
    </aside>
  );
};
