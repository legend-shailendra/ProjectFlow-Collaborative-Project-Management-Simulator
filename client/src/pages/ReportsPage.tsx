import React, { useState, useEffect } from 'react';
import { Download, BarChart2, PieChart as PieIcon, Users, FileSpreadsheet } from 'lucide-react';
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

export const ReportsPage: React.FC = () => {
  const { activeProject } = useProject();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    async function loadReports() {
      try {
        setIsLoading(true);
        const res = await api.analytics.getOverview(activeProject?.id);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReports();
  }, [activeProject]);

  const exportCSV = async (type: 'tasks' | 'issues' | 'stories') => {
    try {
      setIsExporting(true);
      const res = await api.analytics.getExportData(type, activeProject?.id);
      const rows = res.data || [];

      if (rows.length === 0) {
        alert('No records available for export.');
        return;
      }

      const formattedRows = rows.map((r: any) => {
        if (type === 'tasks') {
          return {
            'Task Key': r.taskKey,
            Title: r.title,
            Status: r.status,
            Priority: r.priority,
            'Story Points': r.storyPoints ?? '',
            'Due Date': r.dueDate ? r.dueDate.split('T')[0] : '',
            Project: r.project?.name ?? '',
            Assignee: r.assignee?.fullName ?? 'Unassigned',
            'User Story': r.userStory?.storyKey ?? '',
            'Created Date': r.createdAt ? r.createdAt.split('T')[0] : '',
          };
        } else if (type === 'issues') {
          return {
            'Issue Key': r.issueKey,
            Title: r.title,
            Type: r.type,
            Status: r.status,
            Priority: r.priority,
            Project: r.project?.name ?? '',
            Assignee: r.assignee?.fullName ?? 'Unassigned',
            Reporter: r.reporter?.fullName ?? '',
            'Created Date': r.createdAt ? r.createdAt.split('T')[0] : '',
          };
        } else {
          return {
            'Story Key': r.storyKey,
            Title: r.title,
            Status: r.status,
            Priority: r.priority,
            'Story Points': r.storyPoints,
            Project: r.project?.name ?? '',
            Assignee: r.assignee?.fullName ?? 'Unassigned',
            'Created Date': r.createdAt ? r.createdAt.split('T')[0] : '',
          };
        }
      });

      const headers = Object.keys(formattedRows[0]);
      const csvContent = [
        headers.join(','),
        ...formattedRows.map((row: any) =>
          headers
            .map((field) => {
              const val = row[field] === null || row[field] === undefined ? '' : String(row[field]);
              return `"${val.replace(/"/g, '""')}"`;
            })
            .join(',')
        ),
      ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `ProjectFlow_${activeProject?.key || 'Export'}_${type}_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400">Loading reports and analytics...</div>
    );
  }

  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Reports & Velocity Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quantitative Agile metrics, issue distributions, and CSV data export for{' '}
            <span className="font-semibold text-slate-700">{activeProject?.name}</span>
          </p>
        </div>

        {/* CSV Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportCSV('tasks')}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export Tasks CSV
          </button>
          <button
            onClick={() => exportCSV('stories')}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" /> Export Stories CSV
          </button>
          <button
            onClick={() => exportCSV('issues')}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-rose-500" /> Export Issues CSV
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Story Points</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{summary.totalStoryPoints || 0}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {summary.completedStoryPoints || 0} points done
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Completion Rate</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.completionRate || 0}%</p>
          <span className="text-[10px] text-slate-500 mt-1 block">Sprint target</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Open / Active Bugs</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{summary.openIssues || 0}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">Awaiting QA verification</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Overdue Tasks</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{summary.overdueTasks || 0}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">Requires reassignment</span>
        </div>
      </div>

      {/* Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Distribution by Assignee */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" /> Work Distribution by Assignee
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.workDistribution || []}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="total" name="Total Tasks" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issue Status Lifecycle Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-600" /> Issue Lifecycle Statuses
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.issueStatusDistribution || []}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
                  {data?.issueStatusDistribution?.map((entry: any, index: number) => (
                    <Cell key={`cell-status-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
