// lib/authContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

interface AuthContextType {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  register: (username: string, email: string, bio?: string) => Promise<{ success: boolean; error?: string }>;
  login: (emailOrUsername: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updatedData: Partial<UserAccount>) => Promise<void>;
  getAllAccounts: () => UserAccount[];
  switchAccount: (userId: string) => void;
}

const STORAGE_KEY_CURRENT_USER = 'novelflow_current_user_v1';
const STORAGE_KEY_ALL_ACCOUNTS = 'novelflow_all_accounts_v1';

// デフォルトのサンプルユーザー作成（各端末・各ユーザーに固有のIDを付与し、いいねの衝突を防ぐ）
function getOrCreateDeviceUser(): UserAccount {
  let devId = 'guest';
  if (typeof window !== 'undefined') {
    devId = localStorage.getItem('novelflow_device_client_id') || '';
    if (!devId) {
      devId = 'dev-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
      localStorage.setItem('novelflow_device_client_id', devId);
    }
  }
  return {
    id: `user-${devId}`,
    username: '読書太郎',
    email: `reader-${devId.substring(0, 8)}@novelflow.jp`,
    bio: 'ファンタジーとショート小説が好きです。毎日隙間時間に読んでいます。',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.id === 'user-sample-me') {
          const fresh = getOrCreateDeviceUser();
          parsed.id = fresh.id;
          localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(parsed));
        }
        return parsed;
      }
      const freshUser = getOrCreateDeviceUser();
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(freshUser));
      return freshUser;
    } catch {
      return getOrCreateDeviceUser();
    }
  });

  // 初期化：ローカルストレージからログインユーザーを読み込み（固有ID保証）
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      const storedAccounts = localStorage.getItem(STORAGE_KEY_ALL_ACCOUNTS);

      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        // 以前の固定ID 'user-sample-me' の場合は端末固有IDへ安全に移行
        if (parsed.id === 'user-sample-me') {
          const fresh = getOrCreateDeviceUser();
          parsed.id = fresh.id;
          localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(parsed));
        }
        setCurrentUser(parsed);
      } else {
        const freshUser = getOrCreateDeviceUser();
        setCurrentUser(freshUser);
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(freshUser));
        if (!storedAccounts) {
          localStorage.setItem(STORAGE_KEY_ALL_ACCOUNTS, JSON.stringify([freshUser]));
        }
      }
    } catch (e) {
      console.error('Failed to load user session:', e);
      const fallbackUser = getOrCreateDeviceUser();
      setCurrentUser(fallbackUser);
    }
  }, []);

  const getAllAccounts = (): UserAccount[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ALL_ACCOUNTS);
      return stored ? JSON.parse(stored) : [getOrCreateDeviceUser()];
    } catch {
      return [getOrCreateDeviceUser()];
    }
  };

  const register = async (username: string, email: string, bio?: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedUsername) {
      return { success: false, error: 'ユーザー名を入力してください' };
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: '有効なメールアドレスを入力してください' };
    }

    const accounts = getAllAccounts();
    const existing = accounts.find(
      (a) => a.email.toLowerCase() === trimmedEmail || a.username.toLowerCase() === trimmedUsername.toLowerCase()
    );

    if (existing) {
      return { success: false, error: '同じメールアドレスまたはユーザー名が既に存在します' };
    }

    // アバターURLのシード生成
    const avatarNumber = (accounts.length % 6) + 1;
    const avatars = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    ];

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      username: trimmedUsername,
      email: trimmedEmail,
      bio: bio?.trim() || 'よろしくお願いします！NovelFlowで物語を読んでいます。',
      avatar_url: avatars[avatarNumber - 1],
      created_at: new Date().toISOString(),
    };

    const updatedAccounts = [newUser, ...accounts];
    localStorage.setItem(STORAGE_KEY_ALL_ACCOUNTS, JSON.stringify(updatedAccounts));
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(newUser));
    setCurrentUser(newUser);

    return { success: true };
  };

  const login = async (emailOrUsername: string): Promise<{ success: boolean; error?: string }> => {
    const query = emailOrUsername.trim().toLowerCase();
    if (!query) {
      return { success: false, error: 'ユーザー名またはメールアドレスを入力してください' };
    }

    const accounts = getAllAccounts();
    const user = accounts.find(
      (a) => a.email.toLowerCase() === query || a.username.toLowerCase() === query
    );

    if (!user) {
      return { success: false, error: 'アカウントが見つかりませんでした。新規登録をお試しください。' };
    }

    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
    setCurrentUser(user);
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    setCurrentUser(null);
  };

  const updateProfile = async (updatedData: Partial<UserAccount>) => {
    if (!currentUser) return;

    const updatedUser: UserAccount = {
      ...currentUser,
      ...updatedData,
    };

    const accounts = getAllAccounts().map((a) => (a.id === currentUser.id ? updatedUser : a));
    localStorage.setItem(STORAGE_KEY_ALL_ACCOUNTS, JSON.stringify(accounts));
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  const switchAccount = (userId: string) => {
    const accounts = getAllAccounts();
    const target = accounts.find((a) => a.id === userId);
    if (target) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(target));
      setCurrentUser(target);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: currentUser !== null,
        register,
        login,
        logout,
        updateProfile,
        getAllAccounts,
        switchAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
