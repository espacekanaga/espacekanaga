import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi, tokenStorage } from '../api/auth';
import type { User, LoginCredentials, RegisterClientPayload, UserRole } from '../types/auth';

type Theme = 'dark' | 'light' | 'system';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (payload: RegisterClientPayload) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  hasRole: (roles: UserRole[]) => boolean;
  hasPressingAccess: boolean;
  hasAtelierAccess: boolean;
  hasBothWorkspaces: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'dark';
  });

  const resolveTheme = useCallback((preference: Theme): 'dark' | 'light' => {
    if (preference === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return preference;
  }, []);

  const applyResolvedTheme = useCallback((resolved: 'dark' | 'light') => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;

    // Main background (requested: apply on body)
    document.body.style.transition = 'background 200ms ease, color 200ms ease';
    document.body.style.background =
      resolved === 'dark'
        ? 'linear-gradient(135deg, #0a1628 0%, #0f1d32 50%, #0a1628 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f8fafc 100%)';
    document.body.style.color = resolved === 'dark' ? '#f0f9ff' : '#0f172a';
  }, []);

  const applyThemePreference = useCallback(
    (preference: Theme) => {
      applyResolvedTheme(resolveTheme(preference));
      localStorage.setItem('theme', preference);
    },
    [applyResolvedTheme, resolveTheme]
  );

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const decodeToken = useCallback((token: string): User | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.sub,
        prenom: payload.prenom || '',
        nom: payload.nom || '',
        telephone: payload.telephone || '',
        email: payload.email || '',
        adresse: payload.adresse || '',
        role: payload.role,
        isActive: payload.isActive ?? true,
        accessPressing: payload.accessPressing || false,
        accessAtelier: payload.accessAtelier || false,
        clientType: payload.clientType,
        theme: payload.theme || 'dark',
        createdAt: '',
        updatedAt: '',
      };
    } catch {
      return null;
    }
  }, []);

  const getThemeFromToken = useCallback((token: string): Theme | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const t = payload.theme as string | undefined;
      if (t === 'dark' || t === 'light' || t === 'system') return t;
      return null;
    } catch {
      return null;
    }
  }, []);

  // Apply theme preference on mount + whenever it changes
  useEffect(() => {
    applyThemePreference(theme);
  }, [applyThemePreference, theme]);

  // React to OS theme changes when preference is "system"
  useEffect(() => {
    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyResolvedTheme(resolveTheme('system'));
    handler();

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [applyResolvedTheme, resolveTheme, theme]);

  useEffect(() => {
    const initAuth = () => {
      const token = tokenStorage.getAccessToken();
      if (token) {
        const storedTheme = localStorage.getItem('theme') as Theme | null;
        if (!storedTheme) {
          const tokenTheme = getThemeFromToken(token);
          if (tokenTheme) setThemeState(tokenTheme);
        }

        const decodedUser = decodeToken(token);
        if (decodedUser) {
          setUser(decodedUser);
        } else {
          tokenStorage.clearTokens();
        }
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen for logout events from API interceptor
    const handleLogout = () => {
      setUser(null);
    };
    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [decodeToken, getThemeFromToken]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback(async (payload: RegisterClientPayload) => {
    const response = await authApi.register(payload);
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const hasRole = useCallback(
    (roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isEmployee = user?.role === 'EMPLOYEE';
  const isClient = user?.role === 'CLIENT';

  const hasPressingAccess = user?.role === 'SUPER_ADMIN' || user?.accessPressing === true;
  const hasAtelierAccess = user?.role === 'SUPER_ADMIN' || user?.accessAtelier === true;
  const hasBothWorkspaces = hasPressingAccess && hasAtelierAccess;

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    theme,
    setTheme,
    login,
    register,
    logout,
    updateUser,
    hasRole,
    hasPressingAccess,
    hasAtelierAccess,
    hasBothWorkspaces,
    isSuperAdmin,
    isAdmin,
    isEmployee,
    isClient,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
}
