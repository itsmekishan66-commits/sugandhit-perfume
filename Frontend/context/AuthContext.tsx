import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserProfile, updateUserProfile as updateProfile } from '@/services/auth.service';
import { uploadProfileImage as uploadImage } from '@/services/upload.service';
import { clearToken, getToken, setToken as persistToken } from '@/utils/storage';
import type { ProfileUpdateInput, UserProfile } from '@/types/user';

interface AuthContextValue {
  token: string;
  setToken: (token: string) => void;
  userProfile: UserProfile | null;
  getUserProfile: (token: string) => Promise<void>;
  updateUserProfile: (profileData: ProfileUpdateInput) => Promise<boolean>;
  uploadProfileImage: (image: File) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setTokenState] = useState(() => getToken());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  const setToken = (next: string) => {
    setTokenState(next);
    persistToken(next);
  };

  const getUserProfile = async (t: string) => {
    try {
      const user = await fetchUserProfile(t);
      if (user) {
        setUserProfile(user);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const updateUserProfile = async (profileData: ProfileUpdateInput): Promise<boolean> => {
    try {
      const { ok, user, message } = await updateProfile(token, profileData);
      if (ok && user) {
        setUserProfile(user);
      } else if (message) {
        console.error(message);
      }
      return ok;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const uploadProfileImage = async (image: File): Promise<boolean> => {
    try {
      const result = await uploadImage(token, image);
      if (result.ok && result.image) {
        setUserProfile((prev) => (prev ? { ...prev, image: result.image } : prev));
      } else if (result.message) {
        console.error(result.message);
      }
      return result.ok;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const logout = () => {
    clearToken();
    setTokenState('');
    setUserProfile(null);
    navigate('/');
  };

  useEffect(() => {
    if (!token) return;
    fetchUserProfile(token)
      .then((user) => {
        if (user) {
          setUserProfile(user);
        }
      })
      .catch((error) => console.log(error));
  }, [token]);

  const value: AuthContextValue = {
    token,
    setToken,
    userProfile,
    getUserProfile,
    updateUserProfile,
    uploadProfileImage,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthProvider };
export default AuthProvider;