const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('projectflow_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('projectflow_token');
      localStorage.removeItem('projectflow_user');
      // Dispatch custom event for auth listeners
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    const message = data.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (credentials: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getMe: () => request<any>('/auth/me'),
    logout: () => request<any>('/auth/logout', { method: 'POST' }),
  },

  // Projects
  projects: {
    getAll: () => request<any>('/projects'),
    getById: (id: string) => request<any>(`/projects/${id}`),
    create: (data: any) => request<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/projects/${id}`, { method: 'DELETE' }),
    addMember: (id: string, data: any) => request<any>(`/projects/${id}/members`, { method: 'POST', body: JSON.stringify(data) }),
    removeMember: (id: string, userId: string) => request<any>(`/projects/${id}/members/${userId}`, { method: 'DELETE' }),
  },

  // User Stories
  stories: {
    getByProject: (projectId: string, params?: { status?: string; priority?: string; search?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any>(`/stories/project/${projectId}${q ? `?${q}` : ''}`);
    },
    getById: (id: string) => request<any>(`/stories/${id}`),
    create: (projectId: string, data: any) => request<any>(`/stories/project/${projectId}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/stories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/stories/${id}`, { method: 'DELETE' }),
  },

  // Tasks
  tasks: {
    getByProject: (projectId: string, params?: { assigneeId?: string; priority?: string; status?: string; search?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any>(`/tasks/project/${projectId}${q ? `?${q}` : ''}`);
    },
    getMyTasks: (status?: string) => {
      const q = status ? `?status=${status}` : '';
      return request<any>(`/tasks/my-tasks${q}`);
    },
    getById: (id: string) => request<any>(`/tasks/${id}`),
    create: (projectId: string, data: any) => request<any>(`/tasks/project/${projectId}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string, order?: number) =>
      request<any>(`/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, order }) }),
    delete: (id: string) => request<any>(`/tasks/${id}`, { method: 'DELETE' }),
  },

  // Issues
  issues: {
    getByProject: (projectId: string, params?: { type?: string; priority?: string; status?: string; search?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any>(`/issues/project/${projectId}${q ? `?${q}` : ''}`);
    },
    getById: (id: string) => request<any>(`/issues/${id}`),
    create: (projectId: string, data: any) => request<any>(`/issues/project/${projectId}`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/issues/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) => request<any>(`/issues/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id: string) => request<any>(`/issues/${id}`, { method: 'DELETE' }),
  },

  // Comments
  comments: {
    get: (params: { taskId?: string; userStoryId?: string; issueId?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return request<any>(`/comments${q ? `?${q}` : ''}`);
    },
    create: (data: { content: string; taskId?: string; userStoryId?: string; issueId?: string }) =>
      request<any>('/comments', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request<any>(`/comments/${id}`, { method: 'DELETE' }),
  },

  // Analytics
  analytics: {
    getOverview: (projectId?: string) => {
      const q = projectId ? `?projectId=${projectId}` : '';
      return request<any>(`/analytics/overview${q}`);
    },
    getExportData: (type: 'tasks' | 'issues' | 'stories', projectId?: string) => {
      const q = projectId ? `&projectId=${projectId}` : '';
      return request<any>(`/analytics/export?type=${type}${q}`);
    },
  },

  // Team
  team: {
    getMembers: (projectId?: string) => {
      const q = projectId ? `?projectId=${projectId}` : '';
      return request<any>(`/team/members${q}`);
    },
  },

  // Notifications
  notifications: {
    getAll: () => request<any>('/notifications'),
    markRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request<any>('/notifications/read-all', { method: 'POST' }),
  },

  // Global Search
  search: {
    query: (query: string) => request<any>(`/search?q=${encodeURIComponent(query)}`),
  },
};
