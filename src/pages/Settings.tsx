import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Music2, SlidersHorizontal, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAppExperience } from "@/contexts/AppExperienceContext";
import { fetchMyProfile, searchSpotifyTracks, updateMyProfileSettings } from "@/lib/api";
import { getCopy } from "@/lib/copy";
import type { AppProfile, AppSpotifyTrack } from "@/lib/types";

const Settings = () => {
  const navigate = useNavigate();
  const {
    language,
    discoveryFilters,
    customization,
    setLanguage,
    setDiscoveryAgeRange,
    setDiscoveryGender,
    setCustomization,
  } = useAppExperience();
  const copy = getCopy(language);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [allowDateSuggestions, setAllowDateSuggestions] = useState(false);
  const [spotifyQuery, setSpotifyQuery] = useState("");
  const [spotifyResults, setSpotifyResults] = useState<AppSpotifyTrack[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<AppSpotifyTrack | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSearchingSpotify, setIsSearchingSpotify] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const nextProfile = await fetchMyProfile();
      setProfile(nextProfile);
      setAllowDateSuggestions(nextProfile.allowDateSuggestions);
      setSelectedTrack(nextProfile.spotifyTrack);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar suas preferências.");
    } finally {
      setIsLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const safeLoadProfile = async () => {
      try {
        const nextProfile = await fetchMyProfile();
        if (!isMounted) {
          return;
        }
        setProfile(nextProfile);
        setAllowDateSuggestions(nextProfile.allowDateSuggestions);
        setSelectedTrack(nextProfile.spotifyTrack);
        setErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar suas preferências.");
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    };

    setIsLoadingProfile(true);
    void safeLoadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSpotifySearch = async () => {
    if (!spotifyQuery.trim()) {
      setSpotifyResults([]);
      return;
    }
    setIsSearchingSpotify(true);
    try {
      const results = await searchSpotifyTracks(spotifyQuery);
      setSpotifyResults(results);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível buscar músicas no Spotify.");
    } finally {
      setIsSearchingSpotify(false);
    }
  };

  const handleSaveProfilePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      const nextProfile = await updateMyProfileSettings({
        allowDateSuggestions,
        spotifyTrack: selectedTrack,
      });
      setProfile(nextProfile);
      setSelectedTrack(nextProfile.spotifyTrack);
      setSpotifyQuery("");
      setSpotifyResults([]);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível salvar suas preferências.");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  if (isLoadingProfile && !profile) {
    return (
      <section className="space-y-4 pb-8">
        <div>
          <h1 className="font-display text-3xl text-foreground">{copy.navSettings}</h1>
          <p className="mt-2 text-sm text-muted-foreground font-body">Carregando suas preferências...</p>
        </div>
        <div className="card-surface p-6 text-sm text-muted-foreground">Preparando a tela de configurações.</div>
      </section>
    );
  }

  if (!profile && errorMessage) {
    return (
      <section className="space-y-4 pb-8">
        <div>
          <h1 className="font-display text-3xl text-foreground">{copy.navSettings}</h1>
          <p className="mt-2 text-sm text-muted-foreground font-body">Não conseguimos carregar suas configurações agora.</p>
        </div>
        <Alert variant="destructive">
          <AlertTitle>Algo saiu do esperado</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        <div className="flex gap-3">
          <Button onClick={() => void loadProfile()}>Tentar novamente</Button>
          <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 pb-8">
      <div>
        <h1 className="font-display text-3xl text-foreground">{copy.navSettings}</h1>
        <p className="mt-2 text-sm text-muted-foreground font-body">
          Ajuste idioma, filtros de descoberta e suas preferências persistidas de perfil.
        </p>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Algo saiu do esperado</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="card-surface p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-lg text-foreground">Idioma do aplicativo</h2>
        </div>
        <Select value={language} onValueChange={(value) => setLanguage(value as "pt-BR" | "en-US")}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o idioma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
            <SelectItem value="en-US">English (US)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="card-surface p-5 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-lg text-foreground">Filtros de descoberta</h2>
          </div>
          <Button variant="outline" onClick={() => navigate("/app/intentions")}>
            {copy.navIntentions}
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-body">
            <span className="text-muted-foreground">Faixa etária</span>
            <span className="text-foreground">{discoveryFilters.minAge} a {discoveryFilters.maxAge} anos</span>
          </div>
          <Slider
            min={18}
            max={80}
            step={1}
            value={[discoveryFilters.minAge, discoveryFilters.maxAge]}
            onValueChange={([minAge, maxAge]) => setDiscoveryAgeRange(minAge, maxAge)}
          />
        </div>

        <div className="space-y-2">
          <Label className="font-body-bold text-sm">Quero ver</Label>
          <Select value={discoveryFilters.gender} onValueChange={(value) => setDiscoveryGender(value as "all" | "male" | "female" | "non_binary")}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha o filtro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="male">Apenas homens</SelectItem>
              <SelectItem value="female">Apenas mulheres</SelectItem>
              <SelectItem value="non_binary">Apenas não binários</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="card-surface p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-lg text-foreground">Preferências do perfil</h2>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3">
          <div>
            <p className="font-body-bold text-sm text-foreground">Sugerir date</p>
            <p className="text-xs text-muted-foreground font-body">
              Habilita sugestões de lugares entre você e um match quando ambos permitirem.
            </p>
          </div>
          <Switch
            checked={allowDateSuggestions}
            onCheckedChange={setAllowDateSuggestions}
            disabled={isLoadingProfile}
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 p-4">
          <div className="flex items-center gap-2">
            <Music2 className="h-4 w-4 text-[#1DB954]" />
            <p className="font-body-bold text-sm text-foreground">Spotify no perfil</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Pesquise uma música"
              value={spotifyQuery}
              onChange={(event) => setSpotifyQuery(event.target.value)}
            />
            <Button onClick={() => void handleSpotifySearch()} disabled={isSearchingSpotify}>
              {isSearchingSpotify ? "Buscando..." : "Buscar"}
            </Button>
          </div>

          {selectedTrack ? (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-background/40 p-3">
              {selectedTrack.imageUrl ? (
                <img src={selectedTrack.imageUrl} alt={selectedTrack.name} className="h-12 w-12 rounded-lg object-cover" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-body-bold text-foreground">{selectedTrack.name}</p>
                <p className="truncate text-xs text-muted-foreground">{selectedTrack.artist}</p>
              </div>
              <Button variant="ghost" onClick={() => setSelectedTrack(null)}>
                Remover
              </Button>
            </div>
          ) : null}

          {spotifyResults.length > 0 ? (
            <div className="space-y-2">
              {spotifyResults.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => {
                    setSelectedTrack(track);
                    setSpotifyQuery("");
                    setSpotifyResults([]);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                    selectedTrack?.id === track.id
                      ? "border-primary bg-primary/10"
                      : "border-white/10 hover:bg-accent/40"
                  }`}
                >
                  {track.imageUrl ? (
                    <img src={track.imageUrl} alt={track.name} className="h-12 w-12 rounded-lg object-cover" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-body-bold text-foreground">{track.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end">
          <Button onClick={() => void handleSaveProfilePreferences()} disabled={isSavingPreferences || isLoadingProfile || !profile}>
            {isSavingPreferences ? "Salvando..." : "Salvar preferências do perfil"}
          </Button>
        </div>
      </div>

      <div className="card-surface p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-heading text-lg text-foreground">Personalização local</h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="accent-color" className="font-body-bold text-sm">Cor do perfil</Label>
          <div className="flex items-center gap-3">
            <input
              id="accent-color"
              type="color"
              value={customization.accentColor}
              onChange={(event) => setCustomization({ accentColor: event.target.value })}
              className="h-12 w-16 cursor-pointer rounded-md border border-white/10 bg-card"
            />
            <span className="text-sm text-muted-foreground font-body">{customization.accentColor}</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3">
          <div>
            <p className="font-body-bold text-sm text-foreground">Permitir GIFs no carrossel</p>
            <p className="text-xs text-muted-foreground font-body">Habilita o uso de GIFs além das fotos no perfil.</p>
          </div>
          <Switch
            checked={customization.allowGifs}
            onCheckedChange={(checked) => setCustomization({ allowGifs: checked })}
          />
        </div>

        <div className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-muted-foreground font-body">
          <div className="flex items-center gap-2 text-foreground">
            <UserRound className="h-4 w-4 text-primary" />
            Prévia da customização
          </div>
          <p className="mt-2">
            Cor e GIFs continuam salvos localmente no app. Música e sugestões de date já são persistidas no perfil real.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Settings;
