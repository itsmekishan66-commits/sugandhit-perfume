import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { adminLogin, seedDashboardNotes } from '../services/auth';
import { AuthContext } from './auth-context';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string>(() => localStorage.getItem('token') || '');

  useEffect(() => {
    localStorage.setItem('token', token);
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await adminLogin({ email, password });
    if (!data.success) {
      throw new Error(data.message || 'Login failed');
    }
    setToken(data.token);
    await seedDashboardNotes(data.token);
  };

  const logout = () => setToken('');

  const value = useMemo(
    () => ({ token, isAuthenticated: token !== '', login, logout }),
    [token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};