import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { User } from '../types';
import { authService, notificationService } from '../services';
import { playNotificationSound, notificationTypeToSound, unlockAudio, buildSpeechText } from '../utils/sound';

interface AuthContextType {
  user: User | null;
  token: string | null;
  unreadCount: number;
  login: (email: string, password: string, slug?: string) => Promise<any>;
  logout: () => void;
  refreshUnread: () => void;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isOrgAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadRef = useRef<number | null>(null);
  const prevNotifIdsRef = useRef<Set<string>>(new Set());

  // Unlock AudioContext on first user gesture
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Listen for SW → tab messages (push arrived while tab open)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'PLAY_SOUND') {
        const soundType = event.data.soundType || 'default';
        const speechText = event.data.speechText || '';
        playNotificationSound(soundType, speechText);
      }
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  const refreshUnread = useCallback(async () => {
    try {
      const data = await notificationService.getAll();
      const newCount = data.unreadCount;
      const unreadNotifs = data.notifications.filter((n: any) => !n.isRead);
      const newIds = new Set(unreadNotifs.map((n: any) => n.id as string));

      // Detect genuinely new notifications
      const arrivedIds = [...newIds].filter(id => !prevNotifIdsRef.current.has(id));

      if (prevUnreadRef.current !== null && arrivedIds.length > 0) {
        // Play sound + speak for each new notification (stagger if multiple)
        arrivedIds.forEach((id, idx) => {
          const notif = data.notifications.find((n: any) => n.id === id);
          if (!notif) return;
          const soundType = notificationTypeToSound(notif.type);
          let parsedData: Record<string, any> | null = null;
          try { parsedData = notif.data ? JSON.parse(notif.data) : null; } catch { }
          const speechText = buildSpeechText(notif.type, notif.body, parsedData);
          // Stagger by 2s if multiple arrive at once
          setTimeout(() => playNotificationSound(soundType, speechText), idx * 2000);
        });
      }

      prevUnreadRef.current = newCount;
      prevNotifIdsRef.current = newIds;
      setUnreadCount(newCount);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      refreshUnread();
      const interval = setInterval(refreshUnread, 15000);
      return () => clearInterval(interval);
    }
  }, [user, refreshUnread]);

  // Inside AuthContext.tsx
  const login = async (email: string, password: string, slug?: string) => {
    try {
      const data = await authService.login(email, password, slug);

      // If multiOrg is returned, we return it to LoginPage to show the selection
      if ((data as any).multiOrg) return data;

      const { user: u, token: t } = data as { user: User; token: string };
      setUser(u);
      setToken(t);
      localStorage.setItem('token', t);
      localStorage.setItem('user', JSON.stringify(u));

      return data;
    } catch (error) {
      // 🚩 CRITICAL: You MUST re-throw the error here
      // so that LoginPage.tsx can 'catch' it and show the toast.
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setUnreadCount(0);
    prevUnreadRef.current = null;
    prevNotifIdsRef.current = new Set();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isOrgAdmin = user?.role === 'ORG_ADMIN';

  return (
    <AuthContext.Provider value={{ user, token, unreadCount, login, logout, refreshUnread, isLoading, isSuperAdmin, isOrgAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
