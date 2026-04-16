import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BondingLogoSmall } from "@/components/BondingLogo";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { fetchMyProfile, fetchWallet } from "@/lib/api";
import type { AppWallet } from "@/lib/types";

const CurrencyWallet = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<AppWallet | null>(null);
  const [premiumTier, setPremiumTier] = useState("free");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadWallet = useCallback(async () => {
    try {
      const [nextWallet, profile] = await Promise.all([fetchWallet(), fetchMyProfile()]);
      setWallet(nextWallet);
      setPremiumTier(profile.premium_tier ?? "free");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar sua carteira.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  return (
    <section className="space-y-6 pb-8">
      <div>
        <h1 className="font-display text-3xl text-foreground">Laços e Corações</h1>
        <p className="mt-2 text-sm text-muted-foreground font-body">
          Acompanhe sua economia do app e escolha onde investir seus recursos.
        </p>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar sua carteira</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card-surface p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Laços</p>
          <p className="mt-2 font-heading text-3xl text-foreground">{wallet?.ribbons ?? 0}</p>
        </div>
        <div className="card-surface p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Corações</p>
          <div className="mt-2 flex items-center gap-2">
            <BondingLogoSmall className="h-6 w-6" />
            <p className="font-heading text-3xl text-foreground">{wallet?.hearts ?? 0}</p>
          </div>
        </div>
        <div className="card-surface p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Plano</p>
          <p className="mt-2 font-heading text-3xl text-foreground">{premiumTier}</p>
        </div>
      </div>

      <div className="card-surface p-5 space-y-3">
        <h2 className="font-heading text-lg text-foreground">Como ganhar mais</h2>
        <p className="text-sm text-muted-foreground font-body">
          Os vídeos recompensados e curtidas diárias já alimentam esta carteira pelo backend.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => navigate("/app/watch-videos")}>Assistir vídeos</Button>
          <Button variant="outline" onClick={() => navigate("/app/premium")}>Ver plano premium</Button>
          <Button variant="ghost" onClick={() => void loadWallet()} disabled={isLoading}>
            Atualizar carteira
          </Button>
        </div>
      </div>

      <div className="card-surface p-5 space-y-2 text-sm text-muted-foreground font-body">
        <p>100 laços formam 1 coração.</p>
        <p>50 laços podem desbloquear um perfil oculto.</p>
        <p>Com premium ou coração você libera mais rewinds.</p>
      </div>

      {wallet?.entries?.length ? (
        <div className="card-surface p-5 space-y-3">
          <h2 className="font-heading text-lg text-foreground">Extrato</h2>
          <div className="space-y-3">
            {wallet.entries.slice(0, 8).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3">
                <div>
                  <p className="text-sm text-foreground">{entry.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString("pt-BR")}</p>
                </div>
                <span className="text-sm font-body-bold text-primary">
                  {entry.ribbonsDelta > 0 ? "+" : ""}{entry.ribbonsDelta} laços
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : !isLoading ? (
        <div className="card-surface p-5 text-sm text-muted-foreground font-body">
          Seu extrato ainda está vazio. Assim que você ganhar ou gastar laços, ele aparece aqui.
        </div>
      ) : null}
    </section>
  );
};

export default CurrencyWallet;
