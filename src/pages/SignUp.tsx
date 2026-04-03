import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não correspondem", variant: "destructive" });
      return;
    }
    if (parseInt(age) < 18) {
      toast({ title: "Erro", description: "Você deve ter pelo menos 18 anos", variant: "destructive" });
      return;
    }
    navigate("/app");
  };

  const inputClass = "bg-card border-white/10 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Heart className="h-8 w-8 text-primary-foreground" fill="currentColor" />
          </div>
          <h1 className="font-display text-4xl text-foreground tracking-tight">Bonding</h1>
          <p className="text-muted-foreground text-sm font-body">Crie sua conta</p>
        </div>

        <form onSubmit={handleSignUp} className="card-surface p-6 space-y-4">
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
          <Button type="submit" className="w-full font-body-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95">
            Criar Conta
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground font-body">
          Já tem uma conta?{" "}
          <button onClick={() => navigate("/")} className="text-primary font-body-bold hover:underline">
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
