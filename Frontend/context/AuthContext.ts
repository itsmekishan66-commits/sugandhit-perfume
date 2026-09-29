import { createContext, useContext } from 'react';
import type { ProfileUpdateInput, UserProfile } from '@/types/user';

export interface AuthContextValue {
  token: string;
  setToken: (token: string) => void;
  userProfile: UserProfile | null;
  getUserProfile: (token: string) => Promise<void>;
  updateUserProfile: (profileData: ProfileUpdateInput) => Promise<boolean>;
  uploadProfileImage: (image: File) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}