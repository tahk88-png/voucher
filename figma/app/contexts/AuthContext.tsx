import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type AppRole = 'guest' | 'user' | 'merchant' | 'admin';
export type AuthenticatedRole = Exclude<AppRole, 'guest'>;
export type RouteAccess = 'public' | 'authenticated' | 'user' | 'merchant' | 'admin';

type RoleProfile = {
  name: string;
  accountLabel: string;
};

const STORAGE_KEY = 'figmaAppRole';

const roleProfiles: Record<AuthenticatedRole, RoleProfile> = {
  user: {
    name: 'Maria Silva',
    accountLabel: 'Customer Account',
  },
  merchant: {
    name: 'Fashion Store',
    accountLabel: 'Merchant Account',
  },
  admin: {
    name: 'Super Admin',
    accountLabel: 'Admin Account',
  },
};

const roleHome: Record<AuthenticatedRole, string> = {
  user: '/user-dashboard',
  merchant: '/dashboard',
  admin: '/admin-dashboard',
};

interface AuthContextType {
  role: AppRole;
  isHydrated: boolean;
  isAuthenticated: boolean;
  profile: RoleProfile | null;
  loginAs: (nextRole: AuthenticatedRole) => void;
  logout: () => void;
  canAccess: (requiredAccess?: RouteAccess) => boolean;
  getHomeRoute: (nextRole?: AppRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeRole(value: string | null): AppRole {
  if (value === 'user' || value === 'merchant' || value === 'admin') {
    return value;
  }
  return 'guest';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<AppRole>('guest');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRole(normalizeRole(window.localStorage.getItem(STORAGE_KEY)));
    }
    setIsHydrated(true);
  }, []);

  const loginAs = (nextRole: AuthenticatedRole) => {
    setRole(nextRole);
    setIsHydrated(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, nextRole);
    }
  };

  const logout = () => {
    setRole('guest');
    setIsHydrated(true);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const canAccess = (requiredAccess: RouteAccess = 'public') => {
    if (requiredAccess === 'public') {
      return true;
    }
    if (role === 'guest') {
      return false;
    }
    if (role === 'admin') {
      return true;
    }
    if (requiredAccess === 'authenticated') {
      return true;
    }
    if (requiredAccess === 'merchant') {
      return role === 'merchant';
    }
    if (requiredAccess === 'user') {
      return role === 'user';
    }
    if (requiredAccess === 'admin') {
      return false;
    }
    return false;
  };

  const getHomeRoute = (nextRole?: AppRole) => {
    const resolvedRole = nextRole ?? role;
    if (resolvedRole === 'guest') {
      return '/';
    }
    return roleHome[resolvedRole];
  };

  const value = useMemo<AuthContextType>(
    () => ({
      role,
      isHydrated,
      isAuthenticated: role !== 'guest',
      profile: role === 'guest' ? null : roleProfiles[role],
      loginAs,
      logout,
      canAccess,
      getHomeRoute,
    }),
    [isHydrated, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
