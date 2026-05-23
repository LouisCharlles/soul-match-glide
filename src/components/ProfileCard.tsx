import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { BadgeCheck, Flag, Info, MapPin, Heart } from "lucide-react";
import SpotifyPreviewCard from "@/components/SpotifyPreviewCard";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import type { AppUserProfile } from "@/lib/types";

interface ProfileCardProps {
  profile: AppUserProfile;
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
  index: number;
  onReport?: (profile: AppUserProfile) => void;
  viewMode?: "discover" | "likes";
  onLikeBack?: (profileId: string) => void;
}

const ProfileCard = ({ profile, onSwipe, isTop, index, onReport, viewMode = "discover", onLikeBack }: ProfileCardProps) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isMobile = useIsMobile();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const isLikesMode = viewMode === "likes";

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (isLikesMode) return;
    if (Math.abs(info.offset.x) > 100) {
      onSwipe(info.offset.x > 0 ? "right" : "left");
    }
  };

  const nextPhoto = () => {
    if (photoIndex < profile.photos.length - 1) setPhotoIndex(photoIndex + 1);
  };

  const prevPhoto = () => {
    if (photoIndex > 0) setPhotoIndex(photoIndex - 1);
  };

  const scale = 1 - index * 0.05;
  const yOffset = index * 8;
  const dragElastic = isMobile ? 0.12 : 0.8;

  return (
    <div className="absolute inset-0 min-h-0 min-w-0 overflow-hidden rounded-lg">
      <motion.div
        className="relative h-full w-full max-w-full min-w-0 cursor-grab active:cursor-grabbing"
        style={{
          x: isTop ? x : 0,
          rotate: isTop ? rotate : 0,
          scale,
          y: yOffset,
          zIndex: 10 - index,
        }}
        drag={isTop && !isLikesMode ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={dragElastic}
        onDragEnd={isTop && !isLikesMode ? handleDragEnd : undefined}
        exit={{ x: 500, opacity: 0, transition: { duration: 0.3 } }}
      >
        <div className="card-surface flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden shadow-2xl">
          {/* Zona da foto: gestos de fotos e swipe só aqui */}
          <div className="relative flex min-h-0 flex-[3] flex-col">
            <div className="relative min-h-0 w-full flex-1 overflow-hidden">
              <img
                src={profile.photos[photoIndex]}
                alt={`Foto ${photoIndex + 1} do perfil de ${profile.name}`}
                className="absolute inset-0 h-full w-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 flex">
                <button type="button" className="h-full w-1/2 cursor-pointer border-0 bg-transparent p-0" onClick={prevPhoto} aria-label="Foto anterior" />
                <button type="button" className="h-full w-1/2 cursor-pointer border-0 bg-transparent p-0" onClick={nextPhoto} aria-label="Próxima foto" />
              </div>
              <div className="pointer-events-none absolute top-3 left-0 right-0 flex justify-center gap-1.5">
                {profile.photos.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all ${i === photoIndex ? "w-6 bg-foreground" : "w-4 bg-foreground/40"}`}
                  />
                ))}
              </div>
              {onReport ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onReport(profile);
                  }}
                  className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/75 text-foreground backdrop-blur-sm transition hover:bg-background"
                  aria-label={`Denunciar o perfil de ${profile.name}`}
                >
                  <Flag className="h-4 w-4" />
                </button>
              ) : null}
              <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-3 left-3 z-10 h-10 w-10 rounded-full bg-background/85 shadow-md backdrop-blur-sm"
                  aria-label={`Ver detalhes do perfil de ${profile.name}`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailsOpen(true);
                  }}
                >
                  <Info className="h-5 w-5" />
                </Button>
                <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto border-white/10 bg-card">
                  <SheetHeader className="text-left">
                    <SheetTitle className="font-display text-xl text-foreground">
                      {profile.name}
                      <span className="ml-2 font-heading text-muted-foreground">{profile.age}</span>
                      {profile.verified ? (
                        <BadgeCheck className="ml-1 inline-block h-5 w-5 align-middle text-primary" />
                      ) : null}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-4 pb-6">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-body">
                        {profile.location} · {profile.distance}
                      </span>
                    </div>
                    <p className="text-sm font-body leading-relaxed text-muted-foreground">{profile.bio}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.interests.map((interest) => (
                        <span
                          key={interest}
                          className="rounded-full bg-accent px-2.5 py-1 text-xs font-body-bold text-accent-foreground"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                    {profile.spotifyTrack ? (
                      <SpotifyPreviewCard track={profile.spotifyTrack} variant="embed" showOpenLink={false} embedHeight={152} />
                    ) : null}
                  </div>
                </SheetContent>
              </Sheet>
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-card via-card/70 to-transparent" />
              {isTop && (
                <>
                  <motion.div
                    className="pointer-events-none absolute top-8 left-6 rounded-lg border-4 border-success px-4 py-1 -rotate-12"
                    style={{ opacity: likeOpacity }}
                  >
                    <span className="font-display text-2xl text-success">CURTIR</span>
                  </motion.div>
                  <motion.div
                    className="pointer-events-none absolute top-8 right-6 rounded-lg border-4 border-destructive px-4 py-1 rotate-12"
                    style={{ opacity: nopeOpacity }}
                  >
                    <span className="font-display text-2xl text-destructive">PASSAR</span>
                  </motion.div>
                </>
              )}
            </div>
          </div>

          {/* Resumo sempre visível (Spotify continua só no Sheet) */}
          <div className="flex min-h-0 flex-[2] flex-col gap-2 border-t border-white/10 bg-card p-4">
            <div className="flex items-baseline gap-2">
              <h2 className="font-display text-xl text-foreground">{profile.name}</h2>
              {profile.verified ? <BadgeCheck className="h-5 w-5 shrink-0 text-primary" /> : null}
              <span className="font-heading text-lg text-muted-foreground">{profile.age}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="font-body">
                {profile.location} · {profile.distance}
              </span>
            </div>
            <p className="line-clamp-3 text-sm font-body leading-relaxed text-muted-foreground">{profile.bio}</p>
            <div className="mt-auto flex flex-wrap gap-1.5">
              {profile.interests.slice(0, 4).map((interest) => (
                <span key={interest} className="rounded-full bg-accent px-2.5 py-1 text-xs font-body-bold text-accent-foreground">
                  {interest}
                </span>
              ))}
            </div>
            {isLikesMode && onLikeBack ? (
              <Button
                className="mt-2 w-full"
                onClick={() => onLikeBack(profile.userId)}
              >
                <Heart className="mr-2 h-4 w-4" fill="currentColor" />
                Curtir de volta
              </Button>
            ) : null}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfileCard;
