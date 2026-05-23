import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, Flag, X, Heart, Star, RotateCcw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdCard } from "@/components/AdCard";
import ProfileCard from "@/components/ProfileCard";
import MatchModal from "@/components/MatchModal";
import ReportUserDialog from "@/components/ReportUserDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAppExperience } from "@/contexts/AppExperienceContext";
import { createConnection, fetchDiscoverProfiles, undoLastConnection } from "@/lib/api";
import type { AppUserProfile } from "@/lib/types";

const Discover = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    discoveryFilters,
    incrementSwipeCount,
    registerDailyLikeReward,
    refreshWallet,
  } = useAppExperience();
  const queryClient = useQueryClient();
  const { data: fetchedProfiles, isLoading, isError, error: queryError } = useQuery({
    queryKey: ["profiles", "discover"],
    queryFn: fetchDiscoverProfiles,
    staleTime: 30_000,
  });

  const [profiles, setProfiles] = useState<AppUserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchUser, setMatchUser] = useState<AppUserProfile | null>(null);
  const [showMatch, setShowMatch] = useState(false);
  const [isSubmittingSwipe, setIsSubmittingSwipe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reportTarget, setReportTarget] = useState<AppUserProfile | null>(null);
  const [showAd, setShowAd] = useState(false);
  const [matchedConnectionId, setMatchedConnectionId] = useState<string | null>(null);

  useEffect(() => {
    if (fetchedProfiles) {
      setProfiles(fetchedProfiles);
      setCurrentIndex(0);
    }
  }, [fetchedProfiles]);

  useEffect(() => {
    if (isError && queryError) {
      const message = queryError instanceof Error ? queryError.message : "Tente novamente em instantes.";
      setErrorMessage(message);
      toast({ title: "Não foi possível carregar perfis", description: message, variant: "destructive" });
    }
  }, [isError, queryError, toast]);

  const filteredProfiles = useMemo(() => profiles.filter((profile) => {
    const matchesAge = profile.age >= discoveryFilters.minAge && profile.age <= discoveryFilters.maxAge;
    const matchesGender = discoveryFilters.gender === "all" || profile.gender === discoveryFilters.gender;
    const matchesIntent = discoveryFilters.intentions.length === 0
      || (profile.relationshipIntent ? discoveryFilters.intentions.includes(profile.relationshipIntent as typeof discoveryFilters.intentions[number]) : true);
    return matchesAge && matchesGender && matchesIntent;
  }), [discoveryFilters.gender, discoveryFilters.intentions, discoveryFilters.maxAge, discoveryFilters.minAge, profiles]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [discoveryFilters.gender, discoveryFilters.maxAge, discoveryFilters.minAge]);

  const handleSwipe = useCallback(async (direction: "left" | "right" | "superlike") => {
    const currentProfile = filteredProfiles[currentIndex];
    if (!currentProfile || isSubmittingSwipe) {
      return;
    }

    setIsSubmittingSwipe(true);

    try {
      const match = await createConnection({
        to_user: currentProfile.userId,
        status:
          direction === "left"
            ? "pass"
            : direction === "superlike"
              ? "superlike"
              : "like",
      });

      if (match) {
        setMatchUser(match.user);
        setMatchedConnectionId(match.id);
        setShowMatch(true);
      }

      if (direction === "right" || direction === "superlike") {
        const reward = registerDailyLikeReward();
        if (reward.success) {
          toast({
            title: "Laço diário recebido",
            description: reward.message,
          });
        }
        void refreshWallet();
      }

      if (incrementSwipeCount()) {
        setShowAd(true);
      }

      setCurrentIndex((prev) => prev + 1);
      setErrorMessage("");
      void queryClient.invalidateQueries({ queryKey: ["profiles", "discover"] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tente novamente.";
      setErrorMessage(message);
      toast({
        title: "Não foi possível registrar sua ação",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmittingSwipe(false);
    }
  }, [currentIndex, filteredProfiles, incrementSwipeCount, isSubmittingSwipe, queryClient, refreshWallet, registerDailyLikeReward, toast]);

  const [isUndoing, setIsUndoing] = useState(false);

  const handleUndo = useCallback(async () => {
    if (isSubmittingSwipe || isUndoing) return;
    setIsUndoing(true);
    try {
      const result = await undoLastConnection();
      setProfiles((prev) => [result.profile, ...prev]);
      setCurrentIndex((prev) => Math.max(0, prev - 1));
      await refreshWallet();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível reverter.";
      toast({ title: "Não foi possível reverter", description: message, variant: "destructive" });
    } finally {
      setIsUndoing(false);
    }
  }, [isSubmittingSwipe, isUndoing, refreshWallet, toast]);

  const visibleProfiles = filteredProfiles.slice(currentIndex, currentIndex + 3);
  const allSwiped = currentIndex >= filteredProfiles.length;
  const currentProfile = filteredProfiles[currentIndex] ?? null;

  return (
    <section className="flex h-[calc(100dvh-8.5rem)] flex-col items-center gap-2 md:h-[calc(100dvh-8rem)] md:gap-4" aria-labelledby="discover-heading">
      <div className="sr-only" aria-live="polite">
        {isLoading ? "Carregando perfis para descoberta." : currentProfile ? `Mostrando o perfil de ${currentProfile.name}.` : "Nenhum perfil disponível no momento."}
      </div>
      <h1 id="discover-heading" className="sr-only">Descobrir perfis</h1>

      {errorMessage ? (
        <Alert variant="destructive" className="w-full max-w-xl border-destructive/40 bg-destructive/5 text-foreground">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Algo saiu do esperado</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="relative w-full max-w-sm md:max-w-lg xl:max-w-xl flex-1 min-h-0">
        {isLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center" role="status" aria-live="polite">
            <div className="h-8 w-8 rounded-full animate-glow-pulse" style={{ background: "var(--gradient-brand)" }} />
            <p className="text-sm font-body text-muted-foreground">Buscando pessoas por aí...</p>
          </div>
        ) : allSwiped ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center animate-fade-in">
            <div className="text-5xl">👀</div>
            <p className="font-heading text-xl text-foreground">Tamo averiguando a resenha!</p>
            <p className="text-muted-foreground/70 font-body text-sm max-w-xs">Volte mais tarde — o campus vai te trazer novas conexões.</p>
          </div>
        ) : (
          <AnimatePresence>
            {visibleProfiles.map((profile, i) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                onSwipe={handleSwipe}
                isTop={i === 0}
                index={i}
                onReport={setReportTarget}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Action Buttons */}
      {!allSwiped && (
        <div className="flex items-center gap-3 pb-10 md:gap-4 md:pb-6" aria-label="Ações do perfil atual">
          {/* Denunciar */}
          <button
            onClick={() => setReportTarget(currentProfile)}
            disabled={!currentProfile}
            aria-label={currentProfile ? `Denunciar o perfil de ${currentProfile.name}` : "Denunciar perfil"}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-muted-foreground/70 transition-all hover:scale-110 active:scale-95 hover:border-white/25 hover:bg-white/5 hover:text-muted-foreground disabled:opacity-40"
          >
            <Flag className="h-4 w-4" />
          </button>

          {/* Desfazer */}
          <button
            onClick={() => void handleUndo()}
            disabled={isSubmittingSwipe || isUndoing}
            aria-label="Desfazer última ação"
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 text-warning transition-all hover:scale-110 active:scale-95"
            style={{ borderColor: "rgba(251,191,36,0.5)", color: "#FBBF24" }}
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          {/* Passar / X */}
          <button
            onClick={() => void handleSwipe("left")}
            disabled={isSubmittingSwipe}
            aria-label="Passar perfil"
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-destructive/60 text-destructive transition-all hover:scale-110 active:scale-95 hover:bg-destructive/10"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Like — botão principal com gradiente */}
          <button
            onClick={() => void handleSwipe("right")}
            disabled={isSubmittingSwipe}
            aria-label="Curtir perfil"
            className="flex h-16 w-16 items-center justify-center rounded-full text-white transition-all hover:scale-110 active:scale-95 disabled:opacity-60"
            style={{
              background: "var(--gradient-brand)",
              boxShadow: "var(--glow-brand)",
            }}
          >
            <Heart className="h-8 w-8" fill="currentColor" />
          </button>

          {/* Super like */}
          <button
            onClick={() => void handleSwipe("superlike")}
            disabled={isSubmittingSwipe}
            aria-label="Dar super like"
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all hover:scale-110 active:scale-95"
            style={{ borderColor: "#3B9DF2", color: "#3B9DF2" }}
          >
            <Star className="h-5 w-5" />
          </button>
        </div>
      )}

      <MatchModal
        isOpen={showMatch}
        matchedUser={matchUser}
        onClose={() => setShowMatch(false)}
        onSendMessage={() => {
          setShowMatch(false);
          navigate(matchedConnectionId ? `/app/messages?chat=${matchedConnectionId}` : "/app/messages");
        }}
      />
      {showAd ? <AdCard onClose={() => setShowAd(false)} /> : null}
      <ReportUserDialog
        isOpen={Boolean(reportTarget)}
        user={reportTarget}
        onClose={() => setReportTarget(null)}
        onReported={() => {
          toast({
            title: "Denúncia enviada",
            description: "Recebemos sua denúncia e vamos analisar o caso.",
          });
        }}
      />
    </section>
  );
};

export default Discover;
