import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarClock,
  ArrowRight,
  TrendingUp,
  Activity as ActivityIcon,
  Plus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useProject } from '../context/ProjectContext';
import { api } from '../services/api';
import { Avatar } from '../components/common/Avatar';
import { RoleBadge } from '../components/common/Badge';

export const Dashboard: React.FC = () => {
  const { activeProject, projects } = useProject();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setIsLoading(true);
        const res = await api.analytics.getOverview(activeProject?.id);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, [activeProject]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <span className="animate-spin text-2xl">⏳</span>
          <p className="text-xs text-slate-500 font-medium">Loading workspace analytics...</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    totalProjects: 0,
    totalTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    openIssues: 0,
    overdueTasks: 0,
    completionRate: 0,
  };

  const metricCards = [
    {
      title: 'Total Projects',
      value: summary.totalProjects,
      icon: FolderKanban,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      path: '/projects',
    },
    {
      title: 'Total Tasks',
      value: summary.totalTasks,
      icon: CheckSquare,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      path: '/kanban',
    },
    {
      title: 'Tasks In Progress',
      value: summary.inProgressTasks,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      path: '/kanban?status=IN_PROGRESS',
    },
    {
      title: 'Completed Tasks',
      value: summary.completedTasks,
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      path: '/kanban?status=DONE',
    },
    {
      title: 'Open Issues',
      value: summary.openIssues,
      icon: AlertCircle,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
      path: '/issues?status=OPEN',
    },
    {
      title: 'Overdue Tasks',
      value: summary.overdueTasks,
      icon: CalendarClock,
      color: 'text-orange-600 bg-orange-50 border-orange-100',
      path: '/my-tasks',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Agile Analytics Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry and sprint monitoring for{' '}
            <span className="font-semibold text-slate-700">
              {activeProject ? activeProject.name : 'All Projects'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/kanban')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Open Kanban Board
          </button>
        </div>
      </div>

      {/* 6 Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(card.path)}
              className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg border ${card.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Progress Gauge Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-800">Sprint Delivery Velocity & Completion</h3>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            {summary.completionRate}% Done ({summary.completedTasks} / {summary.totalTasks} Tasks)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
          <div
            className="bg-linear-to-r from-indigo-500 to-emerald-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, summary.completionRate))}%` }}
          />
        </div>
      </div>

      {/* Two Column Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Task Status Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Task Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.taskStatusDistribution || []}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data?.taskStatusDistribution?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Issue Priority Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Issue Priority Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.issuePriorityDistribution || []}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data?.issuePriorityDistribution?.map((entry: any, index: number) => (
                    <Cell key={`cell-pie-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Audit Feed */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-800">Recent Agile Activity Feed</h3>
          </div>
          <span className="text-xs text-slate-400">Live database audit trail</span>
        </div>

        <div className="space-y-3 divide-y divide-slate-100">
          {(!data?.recentActivities || data.recentActivities.length === 0) ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">No recent activities recorded.</p>
          ) : (
            data.recentActivities.map((act: any) => (
              <div key={act.id} className="pt-3 first:pt-0 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <Avatar name={act.user.fullName} avatarUrl={act.user.avatarUrl} size="xs" />
                  <div>
                    <span className="font-semibold text-slate-800">{act.user.fullName}</span>{' '}
                    <span className="text-slate-600">{act.details}</span>
                    {act.project && (
                      <span className="ml-2 font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                        {act.project.key}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 flex-shrink-0">
                  {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
