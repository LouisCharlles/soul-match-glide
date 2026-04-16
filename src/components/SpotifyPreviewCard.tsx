import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Music2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppSpotifyTrack } from "@/lib/types";

type SpotifyPreviewVariant = "default" | "compact";

interface SpotifyPreviewCardProps {
  track: AppSpotifyTrack;
  variant?: SpotifyPreviewVariant;
  className?: string;
  showOpenLink?: boolean;
}

let activePreviewAudio: HTMLAudioElement | null = null;

const SpotifyPreviewCard = ({
  track,
  variant = "default",
  className = "",
  showOpenLink = true,
}: SpotifyPreviewCardProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPreview = Boolean(track.previewUrl);

  const shellClassName = useMemo(() => {
    if (variant === "compact") {
      return `flex items-center gap-3 rounded-2xl border border-white/10 bg-background/45 p-3 ${className}`.trim();
    }

    return `rounded-3xl border border-white/10 bg-background/45 p-4 ${className}`.trim();
  }, [className, variant]);

  useEffect(() => {
    if (!track.previewUrl) {
      audioRef.current?.pause();
      audioRef.current = null;
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(track.previewUrl);
    audioRef.current = audio;

    const handleEnded = () => {
      setIsPlaying(false);
      if (activePreviewAudio === audio) {
        activePreviewAudio = null;
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (activePreviewAudio === audio) {
        activePreviewAudio = null;
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setPreviewError("");
    };

    const handleError = () => {
      setIsPlaying(false);
      setPreviewError("Prévia indisponível");
      if (activePreviewAudio === audio) {
        activePreviewAudio = null;
      }
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.pause();
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("error", handleError);
      if (activePreviewAudio === audio) {
        activePreviewAudio = null;
      }
    };
  }, [track.previewUrl]);

  const handleTogglePreview = async () => {
    if (!audioRef.current || !hasPreview) {
      return;
    }

    if (!audioRef.current.paused) {
      audioRef.current.pause();
      return;
    }

    if (activePreviewAudio && activePreviewAudio !== audioRef.current) {
      activePreviewAudio.pause();
      activePreviewAudio.currentTime = 0;
    }

    try {
      activePreviewAudio = audioRef.current;
      await audioRef.current.play();
    } catch {
      setPreviewError("Prévia indisponível");
      setIsPlaying(false);
      if (activePreviewAudio === audioRef.current) {
        activePreviewAudio = null;
      }
    }
  };

  const imageClassName = variant === "compact" ? "h-14 w-14 rounded-2xl" : "h-20 w-20 rounded-3xl";
  const buttonSize = variant === "compact" ? "icon" : "sm";

  return (
    <div
      className={shellClassName}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      {track.imageUrl ? (
        <img src={track.imageUrl} alt={track.name} className={`${imageClassName} object-cover`} />
      ) : (
        <div className={`${imageClassName} flex items-center justify-center bg-[#1DB954]/15 text-[#1DB954]`}>
          <Music2 className="h-6 w-6" />
        </div>
      )}

      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-body-bold text-foreground">{track.name}</p>
        <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
        <p className="text-[11px] text-muted-foreground">
          {previewError || (hasPreview ? (isPlaying ? "Prévia tocando" : "Toque para ouvir a prévia") : "Prévia indisponível")}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size={buttonSize}
          variant={variant === "compact" ? "ghost" : "outline"}
          onClick={() => void handleTogglePreview()}
          disabled={!hasPreview}
          aria-label={isPlaying ? `Pausar prévia de ${track.name}` : `Tocar prévia de ${track.name}`}
          className={variant === "compact" ? "h-10 w-10 rounded-full" : "rounded-full"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {variant === "default" ? (isPlaying ? "Pausar" : "Ouvir prévia") : null}
        </Button>
        {showOpenLink ? (
          <Button type="button" size="icon" variant="ghost" asChild aria-label={`Abrir ${track.name} no Spotify`}>
            <a href={track.url} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default SpotifyPreviewCard;
