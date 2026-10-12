import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  isLoading: boolean;
  setActiveProject: (project: Project | null) => void;
  setActiveProjectId: (id: string) => void;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProjects = async () => {
    if (!user) {
      setProjects([]);
      setActiveProject(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.projects.getAll();
      const list: Project[] = res.data || [];
      setProjects(list);

      // Select active project if none or previous active project
      setActiveProject((prev) => {
        if (!prev && list.length > 0) {
          // Default to OFD if present, else first
          const ofd = list.find((p) => p.key === 'OFD');
          return ofd || list[0];
        }
        if (prev) {
          const matched = list.find((p) => p.id === prev.id);
          return matched || (list.length > 0 ? list[0] : null);
        }
        return null;
      });
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const setActiveProjectId = (id: string) => {
    const p = projects.find((item) => item.id === id);
    if (p) setActiveProject(p);
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        isLoading,
        setActiveProject,
        setActiveProjectId,
        refreshProjects: fetchProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within a ProjectProvider');
  return context;
};
