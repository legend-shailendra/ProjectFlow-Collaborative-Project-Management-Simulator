import React, { useState } from 'react';
import { Menu, Search, LogOut, HelpCircle, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { Avatar } from '../common/Avatar';
import { NotificationPopover } from '../common/NotificationPopover';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { Modal } from '../common/Modal';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { projects, activeProject, setActiveProject } = useProject();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Mobile Toggle & Project Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Project Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200/60"
            >
              <span className="font-semibold text-slate-900 truncate max-w-[140px] sm:max-w-[200px]">
                {activeProject ? activeProject.name : 'All Projects'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {isProjectDropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setIsProjectDropdownOpen(false)}
              >
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Active Project
                </div>
                {projects.map((p) => {
                  const isSelected = activeProject?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setActiveProject(p)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 ${
                        isSelected ? 'bg-indigo-50/70 font-semibold text-indigo-900' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-bold">
                          {p.key}
                        </span>
                        <span className="truncate">{p.name}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Center: Search Trigger Button */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-400 bg-slate-100 hover:bg-slate-200/70 rounded-lg border border-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search project, stories, tasks, bugs...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-white border border-slate-200 rounded text-slate-500 shadow-2xs">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right: Actions & User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile search icon */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <NotificationPopover />

          {/* Viva / Academic Guide Help */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Viva Examination & Agile Architecture Guide"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* User Profile Menu */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Avatar name={user.fullName} avatarUrl={user.avatarUrl} size="sm" />
                <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 max-w-[100px] truncate">
                  {user.fullName}
                </span>
                <ChevronDown className="hidden sm:inline-block w-3.5 h-3.5 text-slate-400" />
              </button>

              {isUserMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-800">{user.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded">
                      {user.role}
                    </span>
                  </div>

                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Viva / Project Simulator Guide Modal */}
      <Modal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title="ProjectFlow Agile Simulator — Viva Examination & Architecture Guide"
        subtitle="Key concepts, architecture highlights, and viva examination explanations"
        maxWidth="xl"
      >
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
            <h5 className="font-semibold text-indigo-900 mb-1">Academic Objective</h5>
            <p>
              ProjectFlow demonstrates full-cycle collaborative Agile project management for software teams:
              User Stories formulation (invest model), Kanban workflow orchestration, Issue/Bug lifecycle tracking,
              Role-Based Access Control (RBAC), and metrics analytics.
            </p>
          </div>

          <div>
            <h5 className="font-semibold text-slate-900 mb-1">1. User Stories vs Tasks</h5>
            <p>
              <strong>User Stories:</strong> Written from the end-user perspective ("As a [role], I want [feature], so that [benefit]"). Accompanied by measurable acceptance criteria and Fibonacci story points (1, 2, 3, 5, 8, 13).
            </p>
            <p className="mt-1">
              <strong>Tasks:</strong> Granular technical engineering units executed on the Kanban board (To Do, In Progress, Testing, Done) linked back to a parent user story.
            </p>
          </div>

          <div>
            <h5 className="font-semibold text-slate-900 mb-1">2. Role-Based Permissions (RBAC)</h5>
            <ul className="list-disc pl-4 space-y-1 mt-1">
              <li><strong>Admin:</strong> Full workspace governance, project creation, member assignment, and deletion.</li>
              <li><strong>Project Manager:</strong> Creates projects, user stories, tasks, and oversees sprint status.</li>
              <li><strong>Developer:</strong> Updates Kanban task statuses, adds comments, works on bug fixes.</li>
              <li><strong>Tester (QA):</strong> Reports bugs with reproduction steps, and verifies/closes resolved issues.</li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-slate-900 mb-1">3. Database & Architecture</h5>
            <p>
              Built with Express.js, Prisma ORM, and React 18 with TypeScript. Database persistence is backed by SQLite for zero-setup local execution with seamless PostgreSQL production readiness via schema configuration.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};
