import { useEffect, useRef, useState } from "react";
import { PlayCircle, RefreshCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAppExperience } from "@/contexts/AppExperienceContext";
import { fetchWallet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AppWallet } from "@/lib/types";

// Placeholders — replace after configuring Ad Manager / AdSense account
const GPT_AD_UNIT_PATH = import.meta.env.VITE_GPT_AD_UNIT_PATH ?? "/PUBLISHER_ID/rewarded_video";

declare global {
  interface Window {
    googletag: {
      cmd: Array<() => void>;
      defineOutOfPageSlot: (adUnitPath: string, format: unknown) => GoogleTagSlot | null;
      pubads: () => GoogleTagPubAds;
      enableServices: () => void;
      display: (slot: GoogleTagSlot) => void;
      enums: { OutOfPageFormat: { REWARDED: unknown } };
      destroySlots: (slots: GoogleTagSlot[]) => void;
    };
  }
}

interface GoogleTagSlot {
  setTargeting: (key: string, value: string) => GoogleTagSlot;
  addService: (service: GoogleTagPubAds) => GoogleTagSlot;
}

interface GoogleTagGrantedDetail {
  amount: number;
  type: string;
}

interface GoogleTagReadyEvent {
  makeRewardedVisible: () => void;
}

interface GoogleTagPubAds {
  addEventListener: (event: string, handler: (event: { slot: GoogleTagSlot; payload?: GoogleTagGrantedDetail } | GoogleTagReadyEvent) => void) => void;
  removeEventListener: (event: string, handler: unknown) => void;
  enableSingleRequest: () => void;
}

const MAX_VIDEOS_PER_DAY = 3;

const WatchVideos = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { refreshWallet } = useAppExperience();
  const [wallet, setWallet] = useState<AppWallet | null>(null);
  const [videosWatchedToday, setVideosWatchedToday] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const activeSlotRef = useRef<GoogleTagSlot | null>(null);
  const gptLoadedRef = useRef(false);

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

  // Inject GPT script once
  useEffect(() => {
    if (gptLoadedRef.current || document.querySelector('script[src*="gpt.js"]')) {
      gptLoadedRef.current = true;
      return;
    }
    window.googletag = window.googletag || ({ cmd: [] } as typeof window.googletag);
    const script = document.createElement("script");
    script.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
    script.async = true;
    document.head.appendChild(script);
    gptLoadedRef.current = true;
  }, []);

  const handleWatchVideo = () => {
    if (isAdPlaying || videosWatchedToday >= MAX_VIDEOS_PER_DAY || !user) return;
    setIsAdPlaying(true);

    window.googletag = window.googletag || ({ cmd: [] } as typeof window.googletag);
    window.googletag.cmd.push(() => {
      const slot = window.googletag.defineOutOfPageSlot(
        GPT_AD_UNIT_PATH,
        window.googletag.enums.OutOfPageFormat.REWARDED,
      );

      if (!slot) {
        // REWARDED format not supported in this environment (e.g. localhost preview)
        setIsAdPlaying(false);
        toast({
          title: "Anúncio indisponível",
          description: "Formato de anúncio premiado não suportado neste ambiente.",
          variant: "destructive",
        });
        return;
      }

      // Pass user ID via targeting so Ad Manager SSV callback receives it as custom_data
      slot.setTargeting("custom_data", String(user.id));
      slot.addService(window.googletag.pubads());
      activeSlotRef.current = slot;

      const onReady = (event: unknown) => {
        (event as GoogleTagReadyEvent).makeRewardedVisible();
      };

      const onGranted = () => {
        // Google SSV will call our backend webhook — do NOT award ribbons here
        toast({ title: "Recompensa confirmada", description: "Seus laços serão creditados em instantes." });
      };

      const onClosed = () => {
        setIsAdPlaying(false);
        // Refresh wallet to reflect backend-side credit (SSV may arrive slightly after close)
        setTimeout(() => void refreshWallet(), 2000);
        void loadWalletState();
        window.googletag.pubads().removeEventListener("rewardedSlotReady", onReady);
        window.googletag.pubads().removeEventListener("rewardedSlotGranted", onGranted);
        window.googletag.pubads().removeEventListener("rewardedSlotClosed", onClosed);
        if (activeSlotRef.current) {
          window.googletag.destroySlots([activeSlotRef.current]);
          activeSlotRef.current = null;
        }
      };

      window.googletag.pubads().addEventListener("rewardedSlotReady", onReady);
      window.googletag.pubads().addEventListener("rewardedSlotGranted", onGranted);
      window.googletag.pubads().addEventListener("rewardedSlotClosed", onClosed);

      window.googletag.enableServices();
      window.googletag.display(slot);
    });
  };

  return (
    <section className="space-y-6 pb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-foreground">Vídeos recompensados</h1>
          <p className="mt-2 text-sm text-muted-foreground font-body">
            Você pode assistir até {MAX_VIDEOS_PER_DAY} vídeos por dia. Cada vídeo libera 2 laços na carteira real.
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
        {Array.from({ length: MAX_VIDEOS_PER_DAY }).map((_, index) => {
          const watched = index < videosWatchedToday;
          const isNext = index === videosWatchedToday;

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
                disabled={watched || isLoading || (isAdPlaying && isNext) || (!isNext && !watched)}
                onClick={isNext ? handleWatchVideo : undefined}
              >
                {watched
                  ? "Já assistido"
                  : isAdPlaying && isNext
                    ? "Aguardando anúncio..."
                    : "Assistir"}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="card-surface p-5 text-sm text-muted-foreground font-body">
        <p>Vídeos assistidos hoje: {videosWatchedToday}/{MAX_VIDEOS_PER_DAY}</p>
        <p className="mt-2">Saldo atual: {wallet?.ribbons ?? 0} laços e {wallet?.hearts ?? 0} corações.</p>
      </div>
    </section>
  );
};

export default WatchVideos;
