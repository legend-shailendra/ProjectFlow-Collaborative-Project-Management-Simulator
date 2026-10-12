import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('projectflow_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('projectflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuth() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.auth.getMe();
        if (res.data?.user) {
          setUser(res.data.user);
          localStorage.setItem('projectflow_user', JSON.stringify(res.data.user));
        }
      } catch (err) {
        console.warn('Session verification failed, signing out');
        setUser(null);
        setToken(null);
        localStorage.removeItem('projectflow_token');
        localStorage.removeItem('projectflow_user');
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [token]);

  const login = async (credentials: any) => {
    const res = await api.auth.login(credentials);
    const { user: loggedInUser, token: authToken } = res.data;
    setUser(loggedInUser);
    setToken(authToken);
    localStorage.setItem('projectflow_token', authToken);
    localStorage.setItem('projectflow_user', JSON.stringify(loggedInUser));
  };

  const register = async (userData: any) => {
    const res = await api.auth.register(userData);
    const { user: registeredUser, token: authToken } = res.data;
    setUser(registeredUser);
    setToken(authToken);
    localStorage.setItem('projectflow_token', authToken);
    localStorage.setItem('projectflow_user', JSON.stringify(registeredUser));
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      // Proceed even if network request fails
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('projectflow_token');
      localStorage.removeItem('projectflow_user');
    }
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
