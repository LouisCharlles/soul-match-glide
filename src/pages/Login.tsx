import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BondingLogo } from "@/components/BondingLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppExperience } from "@/contexts/AppExperienceContext";
import { getCopy } from "@/lib/copy";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { language } = useAppExperience();
  const copy = getCopy(language);
  const { isAuthenticated, isLoading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/app", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await login(email, password);
      const nextPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/app";
      navigate(nextPath, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Verifique seu e-mail e senha.";
      setErrorMessage(message);
      toast({
        title: "Não foi possível entrar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <a href="#main-content" className="skip-link">Pular para o conteúdo principal</a>
      <main id="main-content" tabIndex={-1} className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-2">
          <BondingLogo className="h-16 w-16" />
          <h1 className="font-display text-4xl text-foreground tracking-tight">Bonding</h1>
          <p className="text-muted-foreground text-sm font-body">{copy.brandTagline}</p>
        </div>

        <form onSubmit={handleLogin} className="card-surface p-6 space-y-4" aria-describedby={errorMessage ? "login-error" : undefined}>
          {errorMessage ? (
            <Alert id="login-error" variant="destructive" className="border-destructive/40 bg-destructive/5 text-foreground">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Não foi possível entrar</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email" className="font-body-bold text-sm">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-card border-white/10 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-body-bold text-sm">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-card border-white/10 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full font-body-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
          <div className="text-right">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              aria-label="Ir para redefinição de senha"
              className="text-sm text-primary font-body-bold hover:underline"
            >
              Esqueci minha senha
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-muted-foreground font-body">
          Não tem uma conta?{" "}
          <button onClick={() => navigate("/signup")} className="text-primary font-body-bold hover:underline">
            Cadastre-se
          </button>
        </p>
      </main>
    </div>
  );
};

export default Login;
