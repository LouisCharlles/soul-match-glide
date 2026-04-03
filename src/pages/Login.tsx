import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/app");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Heart className="h-8 w-8 text-primary-foreground" fill="currentColor" />
          </div>
          <h1 className="font-display text-4xl text-foreground tracking-tight">Bonding</h1>
          <p className="text-muted-foreground text-sm font-body">Encontre sua conexão</p>
        </div>

        <form onSubmit={handleLogin} className="card-surface p-6 space-y-4">
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
          <Button type="submit" className="w-full font-body-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95">
            Entrar
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground font-body">
          Não tem uma conta?{" "}
          <button onClick={() => navigate("/signup")} className="text-primary font-body-bold hover:underline">
            Cadastre-se
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
