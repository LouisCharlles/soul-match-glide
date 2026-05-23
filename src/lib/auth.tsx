import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  clearStoredTokens,
  fetchCurrentUser,
  login as loginRequest,
  register as registerRequest,
} from "@/lib/api";
import type { SignUpPayload, UserSummary } from "@/lib/types";

interface AuthContextValue {
  user: UserSummary | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<{ registered: boolean; loggedIn: boolean }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const currentUser = await fetchCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        await clearStoredTokens();
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const nextUser = await loginRequest({ email, password });
    setUser(nextUser);
  }, []);

  const signUp = useCallback(async (payload: SignUpPayload) => {
    await registerRequest(payload);

    try {
      const nextUser = await loginRequest({
        email: payload.email,
        password: payload.password,
      });
      setUser(nextUser);
      return { registered: true, loggedIn: true };
    } catch {
      return { registered: true, loggedIn: false };
    }
  }, []);

  const logout = useCallback(async () => {
    await clearStoredTokens();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      signUp,
      logout,
    }),
    [isLoading, login, logout, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
