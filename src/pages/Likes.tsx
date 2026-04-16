import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchLikesReceived, unlockLikesReceived } from "@/lib/api";
import type { AppLikeReceived } from "@/lib/types";

const Likes = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<AppLikeReceived[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadLikes = async () => {
    try {
      const nextItems = await fetchLikesReceived();
      setItems(nextItems);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar as curtidas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLikes();
  }, []);

  const hasVisibleProfiles = items.some((item) => item.visible);
  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      await unlockLikesReceived();
      await loadLikes();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível desbloquear esta sessão.");
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <section className="space-y-6 pb-8">
      <div>
        <h1 className="font-display text-3xl text-foreground">Curtidas recebidas</h1>
        <p className="mt-2 text-sm text-muted-foreground font-body">
          Perfis ficam borrados até você assinar o premium ou desbloquear a sessão com 50 laços.
        </p>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar as curtidas</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {!hasVisibleProfiles ? (
        <div className="card-surface p-5 flex flex-col gap-3">
          <div>
            <p className="font-heading text-lg text-foreground">Desbloquear perfis desta sessão</p>
            <p className="text-sm text-muted-foreground font-body">Use 50 laços para revelar quem curtiu você.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => void handleUnlock()} disabled={isUnlocking}>
              <Sparkles className="mr-2 h-4 w-4" />
              {isUnlocking ? "Desbloqueando..." : "Desbloquear com 50 laços"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/app/premium")}>
              Ver premium
            </Button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-muted-foreground font-body">Carregando curtidas...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.connectionId} className="card-surface overflow-hidden">
              <div className={`relative aspect-[4/5] ${item.visible ? "" : "bg-card"}`}>
                {item.profile ? (
                  <img
                    src={item.profile.photos[0]}
                    alt={item.profile.name}
                    className={`h-full w-full object-cover ${item.visible ? "" : "scale-105 blur-xl opacity-40"}`}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-accent/40">
                    <EyeOff className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                {!item.visible ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/35">
                    <div className="rounded-full border border-white/10 bg-card/80 px-4 py-2 text-sm text-foreground">
                      Perfil bloqueado
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="p-4">
                <p className="font-heading text-lg text-foreground">
                  {item.profile ? `${item.profile.name}, ${item.profile.age}` : "Perfil oculto"}
                </p>
                <p className="text-sm text-muted-foreground font-body">
                  {item.profile ? item.profile.location : "Assine o premium ou use laços para revelar."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Likes;
