import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { saveUserDoc, getUserDoc } from '../services/firebase.js';
import { User, UserRole } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    studentId: string;
    password: string;
    role: UserRole;
    department: string;
    campus: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
  openLoginModal: () => void;
  openRegisterModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Check saved session on mount
  useEffect(() => {
    const token = localStorage.getItem('campusrecover_token');
    if (token) {
      api.getMe()
        .then((res) => {
          if (res?.user) {
            setUser(res.user);
            saveUserDoc(res.user).catch(() => {});
          }
        })
        .catch(() => {
          localStorage.removeItem('campusrecover_token');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email.trim(), password);
      setUser(res.user);
      // Sync with Firestore database
      await saveUserDoc(res.user).catch(() => {});
      setAuthModalOpen(false);
    } catch (err: any) {
      const msg = err.message || 'Login failed';
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    studentId: string;
    password: string;
    role: UserRole;
    department: string;
    campus: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.register({
        name: data.name.trim(),
        email: data.email.trim(),
        studentId: data.studentId.trim(),
        password: data.password,
        role: data.role,
        department: data.department,
        campus: data.campus,
      });
      setUser(res.user);
      // Sync with Firestore database
      await saveUserDoc(res.user).catch(() => {});
      setAuthModalOpen(false);
    } catch (err: any) {
      const msg = err.message || 'Registration failed';
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const res = await api.googleLogin({
        email: 'harikabalaga03@gmail.com',
        name: 'Harika Balaga',
      });
      setUser(res.user);
      // Sync with Firestore database
      await saveUserDoc(res.user).catch(() => {});
      setAuthModalOpen(false);
    } catch (err: any) {
      const msg = err.message || 'Google sign in failed';
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const openLoginModal = () => {
    setAuthModalMode('login');
    setAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalMode('register');
    setAuthModalOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        authModalOpen,
        setAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openLoginModal,
        openRegisterModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
