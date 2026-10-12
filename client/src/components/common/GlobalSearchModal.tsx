import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CheckSquare, BookOpen, AlertCircle, FolderKanban, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({ projects: [], tasks: [], stories: [], issues: [], users: [] });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ projects: [], tasks: [], stories: [], issues: [], users: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ projects: [], tasks: [], stories: [], issues: [], users: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await api.search.query(query);
        setResults(res.data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    (results.projects?.length || 0) +
    (results.tasks?.length || 0) +
    (results.stories?.length || 0) +
    (results.issues?.length || 0) +
    (results.users?.length || 0);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-start justify-center pt-20 px-4">
        <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Search bar input */}
          <div className="flex items-center px-4 border-b border-slate-200 bg-slate-50/50">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search projects, tasks, user stories, bugs, or members..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full py-4 text-base bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-800 placeholder-slate-400"
            />
            {query && (
              <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[11px] font-semibold text-slate-500 bg-slate-200/70 border border-slate-300 rounded">
              ESC
            </kbd>
          </div>

          {/* Results list */}
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
            {isLoading && (
              <div className="py-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                <span className="animate-spin text-base">⏳</span> Searching across ProjectFlow workspace...
              </div>
            )}

            {!isLoading && query.length >= 2 && totalResults === 0 && (
              <div className="py-8 text-center text-sm text-slate-500">
                No matching results found for "<span className="font-semibold">{query}</span>"
              </div>
            )}

            {!isLoading && query.length < 2 && (
              <div className="py-6 text-center text-xs text-slate-400">
                Type at least 2 characters to search across projects, tasks, stories, and issues.
              </div>
            )}

            {/* Projects */}
            {results.projects?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5" /> Projects
                </div>
                <div className="space-y-1">
                  {results.projects.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelect(`/projects`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-semibold">
                          {p.key}
                        </span>
                        <span className="text-sm font-medium text-slate-800">{p.name}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks */}
            {results.tasks?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" /> Tasks
                </div>
                <div className="space-y-1">
                  {results.tasks.map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelect(`/kanban?projectId=${t.projectId}&taskId=${t.id}`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-semibold">
                          {t.taskKey}
                        </span>
                        <span className="text-sm font-medium text-slate-800">{t.title}</span>
                        <span className="text-xs text-slate-400">({t.status})</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stories */}
            {results.stories?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> User Stories
                </div>
                <div className="space-y-1">
                  {results.stories.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelect(`/stories?projectId=${s.projectId}`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold">
                          {s.storyKey}
                        </span>
                        <span className="text-sm font-medium text-slate-800">{s.title}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Issues */}
            {results.issues?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Issues & Bugs
                </div>
                <div className="space-y-1">
                  {results.issues.map((i: any) => (
                    <button
                      key={i.id}
                      onClick={() => handleSelect(`/issues?projectId=${i.projectId}`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs px-2 py-0.5 bg-rose-50 text-rose-700 rounded font-semibold">
                          {i.issueKey}
                        </span>
                        <span className="text-sm font-medium text-slate-800">{i.title}</span>
                        <span className="text-xs text-rose-500 font-medium">{i.priority}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Users */}
            {results.users?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Team Members
                </div>
                <div className="space-y-1">
                  {results.users.map((u: any) => (
                    <button
                      key={u.id}
                      onClick={() => handleSelect(`/team`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-medium text-slate-800">{u.fullName}</span>
                        <span className="text-xs text-slate-400">({u.role})</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
