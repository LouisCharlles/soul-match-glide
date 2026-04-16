import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AppLanguage = "pt-BR" | "en-US";
type GenderFilter = "all" | "male" | "female" | "non_binary";
type IntentionFilter = "serious" | "casual" | "friendship" | "exploring";

interface DiscoveryFilters {
  minAge: number;
  maxAge: number;
  gender: GenderFilter;
  intentions: IntentionFilter[];
}

interface ProfileCustomization {
  accentColor: string;
  spotifyTrackUrl: string;
  allowGifs: boolean;
}

interface ExperienceState {
  language: AppLanguage;
  discoveryFilters: DiscoveryFilters;
  ribbons: number;
  hearts: number;
  videosWatchedToday: number;
  isPremium: boolean;
  rewindsAvailable: number;
  swipeCount: number;
  customization: ProfileCustomization;
  unlockedProfileIds: number[];
  setLanguage: (language: AppLanguage) => void;
  setDiscoveryAgeRange: (minAge: number, maxAge: number) => void;
  setDiscoveryGender: (gender: GenderFilter) => void;
  setDiscoveryIntentions: (intentions: IntentionFilter[]) => void;
  watchRewardVideo: () => { success: boolean; message: string };
  registerDailyLikeReward: () => { success: boolean; message: string };
  unlockHiddenProfile: (profileId: number) => { success: boolean; message: string };
  consumeRewind: () => { success: boolean; message: string };
  grantPremium: () => void;
  incrementSwipeCount: () => boolean;
  setCustomization: (customization: Partial<ProfileCustomization>) => void;
}

const STORAGE_KEY = "bonding_app_experience";

interface StoredState {
  language: AppLanguage;
  discoveryFilters: DiscoveryFilters;
  ribbons: number;
  hearts: number;
  videosWatchedToday: number;
  lastVideoRewardDate: string;
  isPremium: boolean;
  rewindsAvailable: number;
  swipeCount: number;
  lastDailyLikeRewardDate: string;
  customization: ProfileCustomization;
  unlockedProfileIds: number[];
}

const defaultState: StoredState = {
  language: "pt-BR",
  discoveryFilters: {
    minAge: 18,
    maxAge: 35,
    gender: "all",
    intentions: ["serious", "casual", "friendship", "exploring"],
  },
  ribbons: 12,
  hearts: 0,
  videosWatchedToday: 0,
  lastVideoRewardDate: "",
  isPremium: false,
  rewindsAvailable: 0,
  swipeCount: 0,
  lastDailyLikeRewardDate: "",
  customization: {
    accentColor: "#D71D29",
    spotifyTrackUrl: "",
    allowGifs: true,
  },
  unlockedProfileIds: [],
};

const AppExperienceContext = createContext<ExperienceState | undefined>(undefined);

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeRibbonsAndHearts(ribbons: number, hearts: number) {
  const extraHearts = Math.floor(ribbons / 100);
  return {
    ribbons: ribbons % 100,
    hearts: hearts + extraHearts,
  };
}

function loadState(): StoredState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return defaultState;
    }

    const parsed = JSON.parse(rawValue) as Partial<StoredState>;
    const today = getTodayKey();

    return {
      ...defaultState,
      ...parsed,
      discoveryFilters: {
        ...defaultState.discoveryFilters,
        ...(parsed.discoveryFilters ?? {}),
      },
      customization: {
        ...defaultState.customization,
        ...(parsed.customization ?? {}),
      },
      videosWatchedToday: parsed.lastVideoRewardDate === today ? parsed.videosWatchedToday ?? 0 : 0,
      lastVideoRewardDate: parsed.lastVideoRewardDate === today ? parsed.lastVideoRewardDate ?? "" : "",
      lastDailyLikeRewardDate: parsed.lastDailyLikeRewardDate ?? "",
      unlockedProfileIds: parsed.unlockedProfileIds ?? [],
    };
  } catch {
    return defaultState;
  }
}

export function AppExperienceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoredState>(loadState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo<ExperienceState>(() => {
    return {
      language: state.language,
      discoveryFilters: state.discoveryFilters,
      ribbons: state.ribbons,
      hearts: state.hearts,
      videosWatchedToday: state.videosWatchedToday,
      isPremium: state.isPremium,
      rewindsAvailable: state.rewindsAvailable,
      swipeCount: state.swipeCount,
      customization: state.customization,
      unlockedProfileIds: state.unlockedProfileIds,
      setLanguage: (language) => setState((current) => ({ ...current, language })),
      setDiscoveryAgeRange: (minAge, maxAge) => setState((current) => ({
        ...current,
        discoveryFilters: {
          ...current.discoveryFilters,
          minAge,
          maxAge,
        },
      })),
      setDiscoveryGender: (gender) => setState((current) => ({
        ...current,
        discoveryFilters: {
          ...current.discoveryFilters,
          gender,
        },
      })),
      setDiscoveryIntentions: (intentions) => setState((current) => ({
        ...current,
        discoveryFilters: {
          ...current.discoveryFilters,
          intentions,
        },
      })),
      watchRewardVideo: () => {
      const today = getTodayKey();
      const currentVideos = state.lastVideoRewardDate === today ? state.videosWatchedToday : 0;

      if (currentVideos >= 3) {
        return { success: false, message: "Você já assistiu os 3 vídeos de hoje." };
      }

      setState((current) => {
        const normalized = normalizeRibbonsAndHearts(current.ribbons + 2, current.hearts);
        return {
          ...current,
          ribbons: normalized.ribbons,
          hearts: normalized.hearts,
          videosWatchedToday: (current.lastVideoRewardDate === today ? current.videosWatchedToday : 0) + 1,
          lastVideoRewardDate: today,
        };
      });

        return { success: true, message: "Você ganhou 2 laços." };
      },
      registerDailyLikeReward: () => {
      const today = getTodayKey();

      if (state.lastDailyLikeRewardDate === today) {
        return { success: false, message: "A recompensa diária de curtida já foi coletada hoje." };
      }

      setState((current) => {
        const normalized = normalizeRibbonsAndHearts(current.ribbons + 1, current.hearts);
        return {
          ...current,
          ribbons: normalized.ribbons,
          hearts: normalized.hearts,
          lastDailyLikeRewardDate: today,
        };
      });

        return { success: true, message: "Você ganhou 1 laço pela curtida diária." };
      },
      unlockHiddenProfile: (profileId) => {
      if (state.unlockedProfileIds.includes(profileId)) {
        return { success: true, message: "Esse perfil já está desbloqueado." };
      }

      if (state.ribbons < 50) {
        return { success: false, message: "Você precisa de 50 laços para desbloquear esse perfil." };
      }

      setState((current) => ({
        ...current,
        ribbons: current.ribbons - 50,
        unlockedProfileIds: [...current.unlockedProfileIds, profileId],
      }));

        return { success: true, message: "Perfil desbloqueado com 50 laços." };
      },
      consumeRewind: () => {
      if (state.isPremium) {
        return { success: true, message: "Rewind liberado pelo premium." };
      }

      if (state.hearts <= 0) {
        return { success: false, message: "Você precisa de um coração ou premium para voltar mais de uma vez." };
      }

      setState((current) => ({
        ...current,
        hearts: current.hearts - 1,
        rewindsAvailable: current.rewindsAvailable + 2,
      }));

        return { success: true, message: "Você trocou 1 coração por 2 rewinds." };
      },
      grantPremium: () => setState((current) => ({
        ...current,
        isPremium: true,
      })),
      incrementSwipeCount: () => {
      let shouldShowAd = false;

      setState((current) => {
        const nextCount = current.swipeCount + 1;
        shouldShowAd = nextCount % 5 === 0;
        return {
          ...current,
          swipeCount: nextCount,
        };
      });

        return shouldShowAd;
      },
      setCustomization: (customization) => setState((current) => ({
        ...current,
        customization: {
          ...current.customization,
          ...customization,
        },
      })),
    };
  }, [state]);

  return (
    <AppExperienceContext.Provider value={value}>
      {children}
    </AppExperienceContext.Provider>
  );
}

export function useAppExperience() {
  const context = useContext(AppExperienceContext);
  if (!context) {
    throw new Error("useAppExperience must be used within an AppExperienceProvider");
  }
  return context;
}
