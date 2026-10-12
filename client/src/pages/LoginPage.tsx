import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, LogIn, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Viva Examination Demo Fill
  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 mb-4">
          <Layers className="w-6 h-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          ProjectFlow
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Collaborative Agile Project Management Simulator
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-200">
          <h3 className="text-base font-bold text-slate-900 mb-5">Sign in to your account</h3>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In
                </>
              )}
            </button>
          </form>

          {/* Viva Exam Quick-Fill Shortcuts */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              🎓 Viva Examination Demo Roles (1-Click Fill)
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@projectflow.dev')}
                className="p-2 text-left bg-purple-50 hover:bg-purple-100/70 text-purple-900 border border-purple-200 rounded-lg transition-colors"
              >
                <span className="font-bold block">Admin</span>
                <span className="text-[10px] text-purple-600">Full workspace control</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('pm@projectflow.dev')}
                className="p-2 text-left bg-blue-50 hover:bg-blue-100/70 text-blue-900 border border-blue-200 rounded-lg transition-colors"
              >
                <span className="font-bold block">Project Manager</span>
                <span className="text-[10px] text-blue-600">Stories & sprint manager</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('dev@projectflow.dev')}
                className="p-2 text-left bg-emerald-50 hover:bg-emerald-100/70 text-emerald-900 border border-emerald-200 rounded-lg transition-colors"
              >
                <span className="font-bold block">Developer</span>
                <span className="text-[10px] text-emerald-600">Kanban execution</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('tester@projectflow.dev')}
                className="p-2 text-left bg-amber-50 hover:bg-amber-100/70 text-amber-900 border border-amber-200 rounded-lg transition-colors"
              >
                <span className="font-bold block">QA Tester</span>
                <span className="text-[10px] text-amber-600">Bug reproduction & verification</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
              Register now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
