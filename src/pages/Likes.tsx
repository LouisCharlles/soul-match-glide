import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EyeOff, Heart, Lock, Loader2, Sparkles } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { createConnection, fetchLikesReceived, unlockLikesReceived } from "@/lib/api";
import { useAppExperience } from "@/contexts/AppExperienceContext";
import ProfileCard from "@/components/ProfileCard";
import type { AppLikeReceived } from "@/lib/types";

type AccessMethod = "premium" | "ribbons" | "locked";

const PAGE_SIZE = 10;

const Likes = () => {
  const navigate = useNavigate();
  const { isPremium, refreshWallet } = useAppExperience();
  const queryClient = useQueryClient();

  const { data: firstPage, isLoading: isFirstPageLoading } = useQuery({
    queryKey: ["connections", "likes-received"],
    queryFn: () => fetchLikesReceived(0, PAGE_SIZE),
    staleTime: 60_000,
  });

  const [items, setItems] = useState<AppLikeReceived[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasUsedLikeBack, setHasUsedLikeBack] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AppLikeReceived | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  // Sync first page from React Query cache into local state
  useEffect(() => {
    if (firstPage) {
      setItems(firstPage.items);
      setNextOffset(firstPage.nextOffset);
      setIsInitialLoading(false);
    }
  }, [firstPage]);

  const loadMore = useCallback(async (offset: number) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (offset === 0) setIsInitialLoading(true);
    else setIsFetchingMore(true);

    try {
      const result = await fetchLikesReceived(offset, PAGE_SIZE);
      setItems((prev) => offset === 0 ? result.items : [...prev, ...result.items]);
      setNextOffset(result.nextOffset);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar as curtidas.");
    } finally {
      setIsInitialLoading(false);
      setIsFetchingMore(false);
      isFetchingRef.current = false;
    }
  }, []);

  // IntersectionObserver sentinel for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || nextOffset === null) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingRef.current && nextOffset !== null) {
          void loadMore(nextOffset);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nextOffset, loadMore]);

  const isSessionUnlocked = items.some((item) => item.visible);

  const accessMethod: AccessMethod = isPremium
    ? "premium"
    : isSessionUnlocked && !hasUsedLikeBack
      ? "ribbons"
      : "locked";

  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      await unlockLikesReceived();
      await Promise.all([loadMore(0), refreshWallet()]);
      setHasUsedLikeBack(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível desbloquear esta sessão.");
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleLikeBack = async (profileId: string) => {
    try {
      await createConnection({ to_user: profileId, status: "like" });
      if (accessMethod === "ribbons") {
        setHasUsedLikeBack(true);
      }
      // Remove the liked item from the list optimistically
      setItems((prev) => prev.filter((it) => it.profile?.userId !== profileId));
      setSelectedItem(null);
      void queryClient.invalidateQueries({ queryKey: ["connections", "likes-received"] });
      void queryClient.invalidateQueries({ queryKey: ["profiles", "discover"] });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível registrar sua curtida.");
    }
  };

  const lockedMessage =
    hasUsedLikeBack && !isPremium
      ? "Você já usou seu like desta sessão. Desbloqueie novamente com 50 laços."
      : "Perfis ficam borrados até você assinar o premium ou desbloquear a sessão com 50 laços.";

  const visibleItems = items.filter((item) => item.visible && item.profile);
  const hiddenItems = items.filter((item) => !item.visible);

  return (
    <section className="space-y-6 pb-8">
      <div>
        <h1 className="font-display text-3xl text-foreground">Curtidas recebidas</h1>
        <p className="mt-2 text-sm text-muted-foreground font-body">{lockedMessage}</p>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {/* Unlock prompt */}
      {accessMethod === "locked" ? (
        <div className="card-surface p-5 flex flex-col gap-4 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{ background: "var(--gradient-brand)" }}
          />
          <div className="relative">
            <p className="font-heading text-lg text-foreground">Desbloquear perfis desta sessão</p>
            <p className="text-sm text-muted-foreground font-body mt-1">Use 50 laços para revelar quem curtiu você.</p>
          </div>
          <div className="relative flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={() => void handleUnlock()}
              disabled={isUnlocking}
              className="text-white border-0 transition-all hover:opacity-90 active:scale-95"
              style={{ background: "var(--gradient-brand)", boxShadow: "0 2px 16px rgba(236,58,146,0.3)" }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isUnlocking ? "Desbloqueando..." : "Desbloquear com 50 laços"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/app/premium")} className="border-white/15 hover:border-white/25">
              Ver premium
            </Button>
          </div>
        </div>
      ) : null}

      {accessMethod === "ribbons" ? (
        <p className="text-xs text-muted-foreground font-body">
          Você pode curtir 1 perfil de volta nesta sessão.
        </p>
      ) : null}

      {/* Loading state */}
      {isInitialLoading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground font-body">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Carregando curtidas...
        </div>
      ) : (
        <>
          {/* Visible profiles grid */}
          {visibleItems.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {visibleItems.map((item) => (
                <button
                  key={item.connectionId}
                  type="button"
                  className="card-surface overflow-hidden text-left transition-transform hover:scale-[1.01] active:scale-[0.99]"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="relative aspect-[4/5]">
                    <img
                      src={item.profile!.photos[0]}
                      alt={item.profile!.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <p className="font-heading text-lg text-foreground leading-tight">
                        {item.profile!.name}, {item.profile!.age}
                      </p>
                      <p className="text-xs text-muted-foreground font-body">{item.profile!.location}</p>
                    </div>
                  </div>
                  {(accessMethod !== "locked") ? (
                    <div className="p-3">
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleLikeBack(item.profile!.userId);
                        }}
                        disabled={accessMethod === "ribbons" && hasUsedLikeBack}
                      >
                        <Heart className="mr-2 h-4 w-4" fill="currentColor" />
                        Curtir de volta
                      </Button>
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}

          {/* Blurred grid for locked profiles */}
          {hiddenItems.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {hiddenItems.map((item) => (
                <div key={item.connectionId} className="card-surface overflow-hidden">
                  <div className="relative aspect-[4/5] bg-card">
                    {item.profile ? (
                      <img
                        src={item.profile.photos[0]}
                        alt="Perfil bloqueado"
                        loading="lazy"
                        className="h-full w-full object-cover scale-105 blur-xl opacity-40"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-accent/40">
                        <EyeOff className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-background/35">
                      <div className="rounded-full border border-white/10 bg-card/80 px-4 py-2 text-sm text-foreground flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5" />
                        Perfil bloqueado
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-heading text-base text-foreground">Perfil oculto</p>
                    <p className="text-xs text-muted-foreground font-body">Assine o premium ou use laços para revelar.</p>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Sentinel for IntersectionObserver */}
          {nextOffset !== null ? (
            <div ref={sentinelRef} className="h-8" aria-hidden="true" />
          ) : null}

          {/* Loading more indicator */}
          {isFetchingMore ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : null}

          {/* Empty state */}
          {items.length === 0 && !isInitialLoading ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center animate-fade-in">
              <div className="text-5xl">💔</div>
              <p className="font-heading text-xl text-foreground">Por enquanto ninguém aqui...</p>
              <p className="text-sm text-muted-foreground/70 font-body max-w-xs">Continue descobrindo perfis e você vai aparecer no feed de alguém.</p>
            </div>
          ) : null}
        </>
      )}

      {/* Profile detail sheet */}
      <Sheet open={selectedItem !== null} onOpenChange={(open) => { if (!open) setSelectedItem(null); }}>
        <SheetContent side="bottom" className="max-h-[90dvh] p-0 border-white/10 bg-card overflow-hidden">
          {selectedItem?.profile ? (
            <div className="relative h-[85dvh]">
              <ProfileCard
                profile={selectedItem.profile}
                onSwipe={() => undefined}
                isTop
                index={0}
                viewMode="likes"
                onLikeBack={(id) => void handleLikeBack(id)}
              />
              <SheetHeader className="sr-only">
                <SheetTitle>{selectedItem.profile.name}</SheetTitle>
              </SheetHeader>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default Likes;
