import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BondingLogo } from "@/components/BondingLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ConsentCheckbox from "@/components/legal/ConsentCheckbox";
import { useAppExperience } from "@/contexts/AppExperienceContext";
import { getCopy } from "@/lib/copy";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { fetchCurrentLegalDocuments } from "@/lib/api";

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useAppExperience();
  const copy = getCopy(language);
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [documentIds, setDocumentIds] = useState<number[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchCurrentLegalDocuments()
      .then((documents) => {
        if (isMounted) setDocumentIds(documents.map((doc) => doc.id));
      })
      .catch(() => {
        /* checkbox fica desabilitado abaixo se os documentos não carregarem */
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage("As senhas não correspondem.");
      toast({ title: "Erro", description: "As senhas não correspondem", variant: "destructive" });
      return;
    }
    if (parseInt(age) < 18) {
      setErrorMessage("Você deve ter pelo menos 18 anos.");
      toast({ title: "Erro", description: "Você deve ter pelo menos 18 anos", variant: "destructive" });
      return;
    }
    if (!acceptedTerms || documentIds.length === 0) {
      setErrorMessage("É necessário aceitar os Termos de Uso e a Política de Privacidade.");
      toast({
        title: "Erro",
        description: "É necessário aceitar os Termos de Uso e a Política de Privacidade",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const result = await signUp({
        name,
        age: Number(age),
        email,
        password,
        confirm_password: confirmPassword,
        accepted_document_ids: documentIds,
      });

      if (result.loggedIn) {
        navigate("/app", { replace: true });
        return;
      }

      toast({
        title: "Conta criada com sucesso",
        description: "Seu cadastro foi concluído. Também enviamos um e-mail para confirmar sua conta.",
      });
      navigate("/email-verification-sent", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Revise os dados e tente novamente.";
      setErrorMessage(message);
      toast({
        title: "Não foi possível criar a conta",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "bg-card border-white/10 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <a href="#main-content" className="skip-link">Pular para o conteúdo principal</a>
      <main id="main-content" tabIndex={-1} className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-2">
          <BondingLogo className="h-16 w-16" />
          <h1 className="font-display text-4xl text-foreground tracking-tight">Bonding</h1>
          <p className="text-muted-foreground text-sm font-body">{copy.signupTitle}</p>
        </div>

        <form onSubmit={handleSignUp} className="card-surface p-6 space-y-4" aria-describedby={errorMessage ? "signup-error" : undefined}>
          {errorMessage ? (
            <Alert id="signup-error" variant="destructive" className="border-destructive/40 bg-destructive/5 text-foreground">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Não foi possível criar a conta</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label className="font-body-bold text-sm">Nome completo</Label>
            <Input placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label className="font-body-bold text-sm">Idade</Label>
            <Input type="number" min={18} placeholder="18" value={age} onChange={(e) => setAge(e.target.value)} required className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label className="font-body-bold text-sm">E-mail</Label>
            <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label className="font-body-bold text-sm">Senha</Label>
            <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputClass} />
          </div>
          <div className="space-y-2">
            <Label className="font-body-bold text-sm">Confirmar senha</Label>
            <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputClass} />
          </div>
          <ConsentCheckbox
            checked={acceptedTerms}
            onCheckedChange={setAcceptedTerms}
            disabled={documentIds.length === 0}
          />
          <Button
            type="submit"
            disabled={isSubmitting || !acceptedTerms || documentIds.length === 0}
            className="w-full font-body-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95"
          >
            {isSubmitting ? "Criando conta..." : "Criar Conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground font-body">
          Já tem uma conta?{" "}
          <button onClick={() => navigate("/")} className="text-primary font-body-bold hover:underline">
            Entrar
          </button>
        </p>
      </main>
    </div>
  );
};

export default SignUp;
