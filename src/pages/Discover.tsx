import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { X, Heart, Star, RotateCcw } from "lucide-react";
import ProfileCard from "@/components/ProfileCard";
import MatchModal from "@/components/MatchModal";
import { profiles, UserProfile } from "@/data/mockData";

const Discover = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchUser, setMatchUser] = useState<UserProfile | null>(null);
  const [showMatch, setShowMatch] = useState(false);

  const handleSwipe = useCallback((direction: "left" | "right") => {
    if (direction === "right" && Math.random() > 0.7) {
      setMatchUser(profiles[currentIndex]);
      setShowMatch(true);
    }
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex]);

  const handleUndo = () => {
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const visibleProfiles = profiles.slice(currentIndex, currentIndex + 3);
  const allSwiped = currentIndex >= profiles.length;

  return (
    <div className="flex flex-col items-center gap-4 h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)]">
      {/* Card Stack */}
      <div className="relative w-full max-w-sm flex-1 min-h-0">
        {allSwiped ? (
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
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Action Buttons */}
      {!allSwiped && (
        <div className="flex items-center gap-4 pb-2">
          <button
            onClick={handleUndo}
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-warning text-warning transition-all hover:scale-110 active:scale-95 hover:bg-warning/10"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleSwipe("left")}
            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-destructive text-destructive transition-all hover:scale-110 active:scale-95 hover:bg-destructive/10"
          >
            <X className="h-7 w-7" />
          </button>
          <button
            onClick={() => handleSwipe("right")}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:scale-110 active:scale-95 shadow-lg"
          >
            <Heart className="h-7 w-7" fill="currentColor" />
          </button>
          <button
            onClick={() => handleSwipe("right")}
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
          navigate("/app/messages");
        }}
      />
    </div>
  );
};

export default Discover;
