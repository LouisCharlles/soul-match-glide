import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, Flag, X, Heart, Star, RotateCcw } from "lucide-react";
import { AdCard } from "@/components/AdCard";
import ProfileCard from "@/components/ProfileCard";
import MatchModal from "@/components/MatchModal";
import ReportUserDialog from "@/components/ReportUserDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAppExperience } from "@/contexts/AppExperienceContext";
import { createConnection, fetchDiscoverProfiles } from "@/lib/api";
import type { AppUserProfile } from "@/lib/types";

const Discover = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    discoveryFilters,
    incrementSwipeCount,
    registerDailyLikeReward,
  } = useAppExperience();
  const [profiles, setProfiles] = useState<AppUserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchUser, setMatchUser] = useState<AppUserProfile | null>(null);
  const [showMatch, setShowMatch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingSwipe, setIsSubmittingSwipe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reportTarget, setReportTarget] = useState<AppUserProfile | null>(null);
  const [showAd, setShowAd] = useState(false);
  const [matchedConnectionId, setMatchedConnectionId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfiles = async () => {
      try {
        const nextProfiles = await fetchDiscoverProfiles();
        if (isMounted) {
          setProfiles(nextProfiles);
          setErrorMessage("");
        }
      } catch (error) {
        if (isMounted) {
          const message = error instanceof Error ? error.message : "Tente novamente em instantes.";
          setErrorMessage(message);
          toast({
            title: "Não foi possível carregar perfis",
            description: message,
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProfiles();

    return () => {
      isMounted = false;
    };
  }, [toast]);

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
      }

      if (incrementSwipeCount()) {
        setShowAd(true);
      }

      setCurrentIndex((prev) => prev + 1);
      setErrorMessage("");
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
  }, [currentIndex, filteredProfiles, incrementSwipeCount, isSubmittingSwipe, registerDailyLikeReward, toast]);

  const handleUndo = () => {
    toast({
      title: "Desfazer ainda não disponível",
      description: "O backend atual não expõe uma rota para reverter a última interação.",
    });
  };

  const visibleProfiles = filteredProfiles.slice(currentIndex, currentIndex + 3);
  const allSwiped = currentIndex >= filteredProfiles.length;
  const currentProfile = filteredProfiles[currentIndex] ?? null;

  return (
    <section className="flex flex-col items-center gap-4 h-[calc(100dvh-10rem)] md:h-[calc(100dvh-8rem)]" aria-labelledby="discover-heading">
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
          <div className="flex h-full items-center justify-center text-sm font-body text-muted-foreground" role="status" aria-live="polite">
            Carregando perfis...
          </div>
        ) : allSwiped ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <Heart className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground font-heading text-lg">Sem mais perfis por agora</p>
            <p className="text-muted-foreground/60 font-body text-sm">Volte mais tarde para novas conexões</p>
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
        <div className="flex items-center gap-4 pb-24 md:pb-6" aria-label="Ações do perfil atual">
          <button
            onClick={() => setReportTarget(currentProfile)}
            disabled={!currentProfile}
            aria-label={currentProfile ? `Denunciar o perfil de ${currentProfile.name}` : "Denunciar perfil"}
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/20 text-muted-foreground transition-all hover:scale-110 active:scale-95 hover:bg-white/5 disabled:opacity-50"
          >
            <Flag className="h-5 w-5" />
          </button>
          <button
            onClick={handleUndo}
            disabled={isSubmittingSwipe}
            aria-label="Desfazer última ação"
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-warning text-warning transition-all hover:scale-110 active:scale-95 hover:bg-warning/10"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={() => void handleSwipe("left")}
            disabled={isSubmittingSwipe}
            aria-label="Passar perfil"
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-destructive text-destructive transition-all hover:scale-110 active:scale-95 hover:bg-destructive/10"
          >
            <X className="h-7 w-7" />
          </button>
          <button
            onClick={() => void handleSwipe("right")}
            disabled={isSubmittingSwipe}
            aria-label="Curtir perfil"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:scale-110 active:scale-95 shadow-lg"
          >
            <Heart className="h-7 w-7" fill="currentColor" />
          </button>
          <button
            onClick={() => void handleSwipe("superlike")}
            disabled={isSubmittingSwipe}
            aria-label="Dar super like"
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-warning text-warning transition-all hover:scale-110 active:scale-95 hover:bg-warning/10"
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
