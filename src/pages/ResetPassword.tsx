import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, Heart } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { confirmPasswordReset } from "@/lib/api";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId = "", token = "" } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!userId || !token) {
      setErrorMessage("O link de redefinição não é válido.");
      toast({
        title: "Link inválido",
        description: "O link de redefinição não é válido.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await confirmPasswordReset({
        userId,
        token,
        password,
        confirmPassword,
      });
      toast({
        title: "Senha atualizada",
        description: response.detail,
      });
      navigate("/", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tente novamente.";
      setErrorMessage(message);
      toast({
        title: "Não foi possível redefinir a senha",
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
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Heart className="h-8 w-8 text-primary-foreground" fill="currentColor" />
          </div>
          <h1 className="font-display text-4xl text-foreground tracking-tight">Bonding</h1>
          <p className="text-muted-foreground text-sm font-body">Definir nova senha</p>
        </div>

        <form onSubmit={handleSubmit} className="card-surface p-6 space-y-4" aria-describedby={errorMessage ? "reset-password-error" : undefined}>
          {errorMessage ? (
            <Alert id="reset-password-error" variant="destructive" className="border-destructive/40 bg-destructive/5 text-foreground">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Não foi possível redefinir a senha</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="password" className="font-body-bold text-sm">Nova senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-card border-white/10 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="font-body-bold text-sm">Confirmar nova senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-card border-white/10 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full font-body-bold">
            {isSubmitting ? "Salvando..." : "Redefinir senha"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default ResetPassword;
