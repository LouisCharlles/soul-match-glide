import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Heart } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { requestPasswordReset } from "@/lib/api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await requestPasswordReset(email);
      toast({
        title: "Solicitação recebida",
        description: response.detail,
      });
      navigate("/", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tente novamente.";
      setErrorMessage(message);
      toast({
        title: "Não foi possível solicitar a redefinição",
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
          <p className="text-muted-foreground text-sm font-body">Recuperar senha</p>
        </div>

        <form onSubmit={handleSubmit} className="card-surface p-6 space-y-4" aria-describedby={errorMessage ? "forgot-password-error" : undefined}>
          {errorMessage ? (
            <Alert id="forgot-password-error" variant="destructive" className="border-destructive/40 bg-destructive/5 text-foreground">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Não foi possível solicitar a redefinição</AlertTitle>
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
          <Button type="submit" disabled={isSubmitting} className="w-full font-body-bold">
            {isSubmitting ? "Enviando..." : "Enviar link de redefinição"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground font-body">
          <button onClick={() => navigate("/")} className="text-primary font-body-bold hover:underline">
            Voltar para login
          </button>
        </p>
      </main>
    </div>
  );
};

export default ForgotPassword;
