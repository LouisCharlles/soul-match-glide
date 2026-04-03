import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserProfile } from "@/data/mockData";

interface MatchModalProps {
  isOpen: boolean;
  matchedUser: UserProfile | null;
  onClose: () => void;
  onSendMessage: () => void;
}

const FloatingHeart = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute text-primary"
    initial={{ y: 100, x: Math.random() * 200 - 100, opacity: 0, scale: 0.5 }}
    animate={{ y: -200, opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1, 0.5] }}
    transition={{ duration: 2.5, delay, ease: "easeOut" }}
  >
    <Heart className="h-6 w-6" fill="currentColor" />
  </motion.div>
);

const MatchModal = ({ isOpen, matchedUser, onClose, onSendMessage }: MatchModalProps) => {
  if (!matchedUser) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />

          {/* Content */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6 p-8"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: "spring", damping: 25 }}
          >
            {/* Floating Hearts */}
            <div className="absolute inset-0 flex justify-center overflow-hidden pointer-events-none">
              {[0, 0.3, 0.6, 0.9, 1.2, 1.5].map((delay, i) => (
                <FloatingHeart key={i} delay={delay} />
              ))}
            </div>

            {/* Big Heart */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10, delay: 0.2 }}
            >
              <Heart className="h-16 w-16 text-primary" fill="currentColor" />
            </motion.div>

            {/* Title */}
            <h2 className="font-display text-4xl text-foreground">É um Match!</h2>

            {/* Avatar */}
            <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-primary shadow-2xl">
              <img src={matchedUser.photos[0]} alt={matchedUser.name} className="h-full w-full object-cover" />
            </div>

            <p className="text-muted-foreground font-body text-center">
              Você e <span className="text-foreground font-body-bold">{matchedUser.name}</span> se curtiram!
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button
                onClick={onSendMessage}
                className="w-full font-body-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95"
              >
                Enviar Mensagem
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full font-body-bold border-white/20 text-foreground hover:bg-white/5 transition-all"
              >
                Continuar Descobrindo
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MatchModal;
