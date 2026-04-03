import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { MapPin } from "lucide-react";
import { UserProfile } from "@/data/mockData";

interface ProfileCardProps {
  profile: UserProfile;
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
  index: number;
}

const ProfileCard = ({ profile, onSwipe, isTop, index }: ProfileCardProps) => {
  const [photoIndex, setPhotoIndex] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
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

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        scale,
        y: yOffset,
        zIndex: 10 - index,
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={isTop ? handleDragEnd : undefined}
      exit={{ x: 500, opacity: 0, transition: { duration: 0.3 } }}
    >
      <div className="card-surface h-full overflow-hidden shadow-2xl flex flex-col">
        {/* Photo Section */}
        <div className="relative flex-[3] min-h-0">
          <img
            src={profile.photos[photoIndex]}
            alt={profile.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* Photo nav areas */}
          <div className="absolute inset-0 flex">
            <div className="w-1/2 h-full" onClick={prevPhoto} />
            <div className="w-1/2 h-full" onClick={nextPhoto} />
          </div>
          {/* Dots */}
          <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5">
            {profile.photos.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === photoIndex ? "w-6 bg-foreground" : "w-4 bg-foreground/40"}`} />
            ))}
          </div>
          {/* Gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent" />
          {/* Swipe indicators */}
          {isTop && (
            <>
              <motion.div className="absolute top-8 left-6 border-4 border-success rounded-lg px-4 py-1 -rotate-12" style={{ opacity: likeOpacity }}>
                <span className="font-display text-2xl text-success">CURTIR</span>
              </motion.div>
              <motion.div className="absolute top-8 right-6 border-4 border-destructive rounded-lg px-4 py-1 rotate-12" style={{ opacity: nopeOpacity }}>
                <span className="font-display text-2xl text-destructive">PASSAR</span>
              </motion.div>
            </>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-[2] p-4 flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-2xl text-foreground">{profile.name}</h2>
            <span className="text-xl text-muted-foreground font-heading">{profile.age}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <MapPin className="h-3.5 w-3.5" />
            <span className="font-body">{profile.location} · {profile.distance}</span>
          </div>
          <p className="text-sm text-muted-foreground font-body leading-relaxed line-clamp-2">{profile.bio}</p>
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {profile.interests.slice(0, 4).map((interest) => (
              <span key={interest} className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground font-body-bold">
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileCard;
