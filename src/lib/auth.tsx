import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ActionResult, Role, User } from "./types";
import { access, canEdit, canView, type Access, type ModuleKey } from "./rbac";
import { useStore, type RegisterInput } from "./store";

const SESSION_KEY = "transitops_session_v1";

interface AuthValue {
  user: User | null;
  isAuthenticated: boolean;
  role: Role | null;
  login: (email: string, password: string) => ActionResult<User>;
  register: (input: RegisterInput) => ActionResult<User>;
  logout: () => void;
  access: (module: ModuleKey) => Access;
  canView: (module: ModuleKey) => boolean;
  canEdit: (module: ModuleKey) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { db, registerUser } = useStore();
  const [userId, setUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (userId) localStorage.setItem(SESSION_KEY, userId);
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, [userId]);

  const user = useMemo(
    () => db.users.find((u) => u.id === userId) ?? null,
    [db.users, userId],
  );

  const login = useCallback<AuthValue["login"]>(
    (email, password) => {
      const match = db.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
      );
      if (!match || match.password !== password) {
        return { ok: false, error: "Invalid email or password." };
      }
      setUserId(match.id);
      return { ok: true, data: match };
    },
    [db.users],
  );

  const register = useCallback<AuthValue["register"]>(
    (input) => {
      const res = registerUser(input);
      if (res.ok && res.data) setUserId(res.data.id);
      return res;
    },
    [registerUser],
  );

  const logout = useCallback(() => setUserId(null), []);

  const value: AuthValue = {
    user,
    isAuthenticated: !!user,
    role: user?.role ?? null,
    login,
    register,
    logout,
    access: (module) => (user ? access(user.role, module) : "none"),
    canView: (module) => (user ? canView(user.role, module) : false),
    canEdit: (module) => (user ? canEdit(user.role, module) : false),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
