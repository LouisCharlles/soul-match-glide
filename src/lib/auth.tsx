import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  clearStoredTokens,
  fetchCurrentUser,
  login as loginRequest,
  onSessionExpired,
  register as registerRequest,
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";
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
  const userRef = useRef<UserSummary | null>(null);
  userRef.current = user;

  // Refresh token recusado com o usuario logado: sem isso a UI seguia como
  // logada e toda chamada autenticada falhava em silencio.
  useEffect(
    () =>
      onSessionExpired(() => {
        if (!userRef.current) return;
        setUser(null);
        toast({
          title: "Sua sessão expirou",
          description: "Faça login novamente para continuar.",
          variant: "destructive",
        });
      }),
    [],
  );

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
