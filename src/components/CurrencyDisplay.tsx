import { BondingLogoSmall } from "@/components/BondingLogo";
import { Crown, Play } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useNavigate } from "react-router-dom";

export function CurrencyDisplay() {
  const { ribbons, hearts, videosWatchedToday, isPremium } = useCurrency();
  const navigate = useNavigate();
  const remainingVideos = 3 - videosWatchedToday;

  const ribbonProgress = (ribbons % 100) / 100 * 100;

  return (
    <div className="flex items-center gap-3">
      {/* Hearts */}
      {hearts > 0 && (
        <button
          onClick={() => navigate('/app/currency')}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          <BondingLogoSmall className="w-4 h-4" />
          <span className="text-sm font-bold text-primary">{hearts}</span>
        </button>
      )}

      {/* Ribbons */}
      <button
        onClick={() => navigate('/app/currency')}
        className="flex items-center gap-1 px-3 py-1.5 bg-card rounded-full border border-border hover:bg-secondary/50 transition-colors"
      >
        <div className="text-primary text-lg">🎀</div>
        <span className="text-sm font-bold">{ribbons}</span>
        {ribbons >= 20 && (
          <div className="w-16 h-1 bg-secondary rounded-full overflow-hidden ml-1">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${ribbonProgress}%` }}
            />
          </div>
        )}
      </button>

      {/* Watch Videos - Only show if not maxed */}
      {remainingVideos > 0 && !isPremium && (
        <button
          onClick={() => navigate('/app/watch-videos')}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 rounded-full border border-green-500/20 hover:bg-green-500/20 transition-colors"
        >
          <Play className="w-3 h-3 text-green-500 fill-green-500" />
          <span className="text-xs font-bold text-green-500">{remainingVideos}</span>
        </button>
      )}

      {/* Premium Badge */}
      {isPremium && (
        <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-primary to-yellow-600 rounded-full">
          <Crown className="w-3 h-3 text-white" />
          <span className="text-xs font-bold text-white">PRO</span>
        </div>
      )}
    </div>
  );
}
