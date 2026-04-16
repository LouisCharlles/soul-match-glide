import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Crown, Heart, Shield, Sparkles, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { fetchMyProfile, fetchMySubscriptions, fetchPremiumPlans, fetchWallet } from "@/lib/api";
import type { AppPremiumPlan, AppSubscription, AppWallet } from "@/lib/types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const Premium = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<AppPremiumPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<AppSubscription[]>([]);
  const [wallet, setWallet] = useState<AppWallet | null>(null);
  const [premiumTier, setPremiumTier] = useState("free");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadPremiumState = async () => {
      try {
        const [nextPlans, nextSubscriptions, nextWallet, profile] = await Promise.all([
          fetchPremiumPlans(),
          fetchMySubscriptions(),
          fetchWallet(),
          fetchMyProfile(),
        ]);

        if (!isMounted) {
          return;
        }

        setPlans(nextPlans);
        setSubscriptions(nextSubscriptions);
        setWallet(nextWallet);
        setPremiumTier(profile.premium_tier ?? "free");
        setErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar os planos premium.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPremiumState();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeSubscription = useMemo(
    () => subscriptions.find((subscription) => subscription.status === "active") ?? null,
    [subscriptions],
  );

  return (
    <section className="space-y-6 pb-8">
      <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-primary/20 via-card to-yellow-700/10 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/15 p-3">
            <Crown className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl text-foreground">Plano Premium</h1>
            <p className="text-sm text-muted-foreground font-body">
              Assinaturas, laços, corações e recursos avançados para descobrir pessoas com mais contexto.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {[
            { icon: Sparkles, label: "Laços", value: String(wallet?.ribbons ?? 0) },
            { icon: Heart, label: "Corações", value: String(wallet?.hearts ?? 0) },
            {
              icon: Shield,
              label: "Status",
              value: activeSubscription ? activeSubscription.plan.name : premiumTier,
            },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-background/40 p-4">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
              <p className="mt-1 font-heading text-xl text-foreground">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar os planos</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {activeSubscription ? (
        <div className="card-surface p-5 space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Assinatura ativa</p>
          <p className="font-heading text-2xl text-foreground">{activeSubscription.plan.name}</p>
          <p className="text-sm text-muted-foreground font-body">
            Iniciada em {new Date(activeSubscription.startedAt).toLocaleDateString("pt-BR")}
            {activeSubscription.expiresAt
              ? ` e válida até ${new Date(activeSubscription.expiresAt).toLocaleDateString("pt-BR")}.`
              : "."}
          </p>
        </div>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-muted-foreground font-body">Carregando planos...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => (
            <div key={plan.id} className="card-surface p-5 space-y-4">
              <div>
                <h2 className="font-heading text-2xl text-foreground">{plan.name}</h2>
                <p className="mt-1 text-lg text-primary font-body-bold">
                  {currencyFormatter.format(plan.priceMonthly)}/mês
                </p>
                <p className="mt-2 text-sm text-muted-foreground font-body">
                  {plan.description || "Mais visibilidade, mais controle e uma experiência sem atrito."}
                </p>
              </div>

              <div className="space-y-2">
                {[
                  `Até ${plan.likesPerDay} curtidas por dia`,
                  plan.canSeeWhoLiked ? "Vê quem curtiu você" : "Desbloqueio de curtidas via laços",
                  plan.hasUnlimitedSwipes ? "Swipes sem limite" : "Limite padrão de swipes",
                  plan.hasPriorityBoost ? "Prioridade no discover" : "Distribuição padrão no discover",
                  plan.hasVideoCalls ? "Videochamadas liberadas" : "Videochamadas não incluídas",
                ].map((perk) => (
                  <div key={perk} className="flex items-center gap-2 text-sm text-foreground font-body">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>

              <Button
                className="w-full"
                disabled={activeSubscription?.plan.id === plan.id}
                onClick={() => navigate(`/app/payment?plan=${plan.id}`)}
              >
                {activeSubscription?.plan.id === plan.id ? "Plano atual" : `Assinar ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="card-surface p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-warning" />
          <h2 className="font-heading text-lg text-foreground">Economia do app</h2>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground font-body">
          <li>Assistir até 3 vídeos por dia libera 6 laços ao todo.</li>
          <li>100 laços formam 1 coração.</li>
          <li>50 laços desbloqueiam a visibilidade das curtidas recebidas na sessão atual.</li>
          <li>Premium elimina boa parte do atrito para ver curtidas, rewinds e recursos avançados.</li>
          <li>Cúpido fica reservado para o plano mais alto do backend.</li>
        </ul>
      </div>
    </section>
  );
};

export default Premium;
