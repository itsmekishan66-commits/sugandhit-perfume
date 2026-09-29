import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserProfile, updateUserProfile as updateProfile } from '@/services/auth.service';
import { uploadProfileImage as uploadImage } from '@/services/upload.service';
import { clearToken, getToken, setToken as persistToken } from '@/utils/storage';
import { AuthContext, type AuthContextValue } from './AuthContext';
import type { ProfileUpdateInput, UserProfile } from '@/types/user';

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

export { AuthProvider };
export default AuthProvider;