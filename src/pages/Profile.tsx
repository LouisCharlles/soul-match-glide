import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, BadgeCheck, MapPin, Briefcase, GraduationCap, Heart, Music2, Users, TrendingUp, Settings, Edit, LogOut, Palette, Plus, Camera } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import SpotifyPreviewCard from "@/components/SpotifyPreviewCard";
import { useToast } from "@/hooks/use-toast";
import { useAppExperience } from "@/contexts/AppExperienceContext";
import { createVerificationAttempt, fetchMyProfile, fetchVerificationAttempts } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AppProfile, AppVerificationAttempt } from "@/lib/types";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { customization } = useAppExperience();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSummary, setVerificationSummary] = useState<AppVerificationAttempt | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const [nextProfile, attempts] = await Promise.all([
          fetchMyProfile(),
          fetchVerificationAttempts(),
        ]);
        if (isMounted) {
          setProfile(nextProfile);
          setVerificationSummary(attempts[0] ?? null);
          setErrorMessage("");
        }
      } catch (error) {
        if (isMounted) {
          const message = error instanceof Error ? error.message : "Tente novamente.";
          setErrorMessage(message);
          toast({
            title: "Não foi possível carregar seu perfil",
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

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center text-sm font-body text-muted-foreground">
        Carregando perfil...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center text-sm font-body text-muted-foreground">
        Seu perfil ainda não está disponível.
      </div>
    );
  }

  const stats = [
    { icon: Heart, label: "Curtidas", value: String(profile.stats.likes_sent), color: "text-primary" },
    { icon: Users, label: "Matches", value: String(profile.stats.matches), color: "text-success" },
    { icon: TrendingUp, label: "Conversas", value: String(profile.stats.conversations), color: "text-warning" },
  ];

  const photos = [...profile.photos, ...Array(Math.max(0, 6 - profile.photos.length)).fill(null)];

  return (
    <section className="space-y-6 pb-8" aria-labelledby="profile-heading">
      <h1 id="profile-heading" className="sr-only">Seu perfil</h1>
      {errorMessage ? (
        <Alert variant="destructive" className="border-destructive/40 bg-destructive/5 text-foreground">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar todos os dados</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}
      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-2" aria-label="Galeria do seu perfil">
        {photos.map((photo, i) => (
          <div key={i} className="aspect-square rounded-lg overflow-hidden relative group">
            {photo ? (
              <>
                <img src={photo} alt={`Foto ${i + 1} do seu perfil`} className="h-full w-full object-cover object-center" />
                <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-6 w-6 text-foreground" />
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/app/profile-setup")}
                aria-label={`Adicionar foto ${i + 1} ao perfil`}
                className="h-full w-full border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center bg-card hover:border-primary/50 transition-colors cursor-pointer"
              >
                <Plus className="h-6 w-6 text-muted-foreground" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="card-surface p-5 space-y-4" style={{ borderColor: `${customization.accentColor}55` }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl text-foreground">{profile.name}, {profile.age}</h2>
              {profile.verified ? <BadgeCheck className="h-5 w-5 text-primary" /> : null}
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{profile.relationshipIntent}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/app/profile-setup")}
            aria-label="Editar perfil"
            className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground font-body">{profile.bio}</p>
        <div className="space-y-2">
          {[
            { icon: MapPin, text: profile.location },
            { icon: Briefcase, text: profile.occupation },
            { icon: GraduationCap, text: profile.education },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground font-body">
              <Icon className="h-4 w-4" />
              <span>{text}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.interests.map((interest) => (
            <span key={interest} className="text-xs px-3 py-1.5 rounded-full bg-accent text-accent-foreground font-body-bold">
              {interest}
            </span>
          ))}
        </div>
      </div>

      <div className="card-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg text-foreground">Verificação do perfil</h2>
            <p className="text-sm text-muted-foreground font-body">
              Tire uma selfie em ambiente claro, sem acessórios que escondam o rosto.
            </p>
          </div>
          {profile.verified ? <BadgeCheck className="h-5 w-5 text-primary" /> : null}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-white/10 px-4 py-2 text-sm text-foreground hover:bg-accent/40">
          <input
            type="file"
            accept="image/*"
            capture="user"
            className="sr-only"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }
              setIsVerifying(true);
              try {
                await createVerificationAttempt(file);
                const attempts = await fetchVerificationAttempts();
                setVerificationSummary(attempts[0] ?? null);
                toast({
                  title: "Selfie enviada",
                  description: "A verificação foi processada e o status já foi atualizado.",
                });
              } catch (error) {
                toast({
                  title: "Não foi possível enviar a selfie",
                  description: error instanceof Error ? error.message : "Tente novamente.",
                  variant: "destructive",
                });
              } finally {
                setIsVerifying(false);
                event.currentTarget.value = "";
              }
            }}
          />
          {isVerifying ? "Enviando..." : profile.verified ? "Reenviar selfie" : "Verificar perfil"}
        </label>
        {verificationSummary ? (
          <div className="rounded-2xl border border-white/10 bg-background/40 p-4 text-sm">
            <p className="font-body-bold text-foreground">Status atual: {verificationSummary.status}</p>
            {typeof verificationSummary.score === "number" ? (
              <p className="mt-1 text-muted-foreground">
                Similaridade calculada: {(verificationSummary.score * 100).toFixed(1)}%
              </p>
            ) : null}
            {verificationSummary.rejectionReason ? (
              <p className="mt-1 text-muted-foreground">{verificationSummary.rejectionReason}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="card-surface p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4" style={{ color: customization.accentColor }} />
          <h2 className="font-heading text-lg text-foreground">Personalização</h2>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3">
          <div>
            <p className="font-body-bold text-sm text-foreground">Cor do perfil</p>
            <p className="text-xs text-muted-foreground font-body">{customization.accentColor}</p>
          </div>
          <div className="h-8 w-8 rounded-full border border-white/10" style={{ backgroundColor: customization.accentColor }} />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3">
          <div>
            <p className="font-body-bold text-sm text-foreground">GIFs no carrossel</p>
            <p className="text-xs text-muted-foreground font-body">{customization.allowGifs ? "Ativados" : "Desativados"}</p>
          </div>
          <span className="text-xs font-body-bold text-primary">{customization.allowGifs ? "ON" : "OFF"}</span>
        </div>

        {profile.spotifyTrack ? (
          <SpotifyPreviewCard track={profile.spotifyTrack} />
        ) : null}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card-surface p-4 flex flex-col items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <span className="font-display text-xl text-foreground">{value}</span>
            <span className="text-xs text-muted-foreground font-body">{label}</span>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="card-surface overflow-hidden">
        {[
          { label: "Configurações", path: "/app/settings" },
          { label: "Intenções", path: "/app/intentions" },
          { label: "Premium", path: "/app/premium" },
          { label: "Curtidas recebidas", path: "/app/likes" },
          { label: "Laços e Corações", path: "/app/currency" },
          { label: "Ajuda", path: "/app/settings" },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-3 p-4 text-sm font-body text-foreground hover:bg-accent/50 transition-colors border-b border-white/5 last:border-0"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            {item.label}
          </button>
        ))}
      </div>

      <Button
        onClick={() => {
          logout();
          navigate("/");
        }}
        variant="outline"
        className="w-full border-destructive text-destructive hover:bg-destructive/10 font-body-bold"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sair
      </Button>
    </section>
  );
};

export default Profile;
