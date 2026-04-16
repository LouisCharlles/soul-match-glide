import { useEffect, useState } from "react";
import { PlayCircle, RefreshCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchWallet, rewardVideoWatch } from "@/lib/api";
import type { AppWallet } from "@/lib/types";

const WatchVideos = () => {
  const { toast } = useToast();
  const [wallet, setWallet] = useState<AppWallet | null>(null);
  const [videosWatchedToday, setVideosWatchedToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingIndex, setIsSubmittingIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadWalletState = async () => {
    try {
      const nextWallet = await fetchWallet();
      setWallet(nextWallet);
      const today = new Date().toISOString().slice(0, 10);
      setVideosWatchedToday(
        nextWallet.entries.filter(
          (entry) =>
            entry.entryType === "reward_video" &&
            entry.createdAt.slice(0, 10) === today &&
            entry.ribbonsDelta > 0,
        ).length,
      );
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar os vídeos recompensados.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadWalletState();
  }, []);

  const handleWatchVideo = async (index: number) => {
    setIsSubmittingIndex(index);
    try {
      const result = await rewardVideoWatch();
      await loadWalletState();
      toast({
        title: result.success ? "Recompensa liberada" : "Não foi possível liberar a recompensa",
        description: result.detail,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível registrar o vídeo.";
      setErrorMessage(message);
      toast({
        title: "Erro ao assistir vídeo",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingIndex(null);
    }
  };

  return (
    <section className="space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">Vídeos recompensados</h1>
          <p className="mt-2 text-sm text-muted-foreground font-body">
            Você pode assistir até 3 vídeos por dia. Cada vídeo libera 2 laços na carteira real.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadWalletState()} disabled={isLoading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar os vídeos</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => {
          const watched = index < videosWatchedToday;
          const isSubmitting = isSubmittingIndex === index;

          return (
            <div key={index} className="card-surface space-y-4 p-5">
              <div className="rounded-2xl bg-primary/10 p-4">
                <PlayCircle className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="font-heading text-lg text-foreground">Vídeo {index + 1}</h2>
                <p className="text-sm text-muted-foreground font-body">Recompensa: 2 laços</p>
              </div>
              <Button
                className="w-full"
                disabled={watched || isSubmitting || isLoading}
                onClick={() => void handleWatchVideo(index)}
              >
                {watched ? "Já assistido" : isSubmitting ? "Registrando..." : "Assistir"}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="card-surface p-5 text-sm text-muted-foreground font-body">
        <p>Vídeos assistidos hoje: {videosWatchedToday}/3</p>
        <p className="mt-2">Saldo atual: {wallet?.ribbons ?? 0} laços e {wallet?.hearts ?? 0} corações.</p>
      </div>
    </section>
  );
};

export default WatchVideos;
