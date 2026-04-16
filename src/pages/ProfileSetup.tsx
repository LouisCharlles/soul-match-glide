import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Briefcase, GraduationCap, Heart, MapPin, Plus, Sparkles, Trash2, Upload, UserRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  deleteProfilePhoto,
  fetchInterestOptions,
  fetchMyProfile,
  fetchMyProfileOptional,
  saveMyProfile,
  uploadProfilePhoto,
} from "@/lib/api";
import {
  emptyProfileFormValues,
  getProfileCompletionPercentage,
  isProfileComplete,
  MIN_PROFILE_PHOTOS,
  profileToFormValues,
  sanitizePhotoList,
} from "@/lib/profile";
import {
  COURSE_OPTIONS,
  EDUCATION_OPTIONS,
  GENDER_OPTIONS,
  OCCUPATION_OPTIONS,
  SEXUAL_ORIENTATION_OPTIONS,
  fetchBrazilianStates,
  fetchCitiesByState,
  type BrazilianState,
} from "@/lib/publicData";
import type { AppInterest, AppProfile, ProfileFormValues } from "@/lib/types";

const inputClass = "bg-card border-white/10 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary";
const MIN_INTERESTS = 5;
const MAX_INTERESTS = 10;
const RELATIONSHIP_INTENT_OPTIONS = [
  { value: "serious", label: "Relacionamento sério" },
  { value: "casual", label: "Casual" },
  { value: "friendship", label: "Amizade" },
  { value: "exploring", label: "Descobrindo" },
];

interface EditablePhoto {
  id?: number;
  previewUrl: string;
  file?: File;
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem selecionada."));
    reader.readAsDataURL(file);
  });
}

function buildPhotoEntries(profile: AppProfile | null) {
  if (!profile || profile.photoItems.length === 0) {
    return Array.from({ length: MIN_PROFILE_PHOTOS }, () => ({ previewUrl: "" }));
  }

  const entries = profile.photoItems.map<EditablePhoto>((photo) => ({
    id: photo.id,
    previewUrl: photo.url,
  }));

  while (entries.length < MIN_PROFILE_PHOTOS) {
    entries.push({ previewUrl: "" });
  }

  return entries;
}

const ProfileSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState<ProfileFormValues>(emptyProfileFormValues);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [interestInput, setInterestInput] = useState("");
  const [interestOptions, setInterestOptions] = useState<AppInterest[]>([]);
  const [photoEntries, setPhotoEntries] = useState<EditablePhoto[]>(buildPhotoEntries(null));
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [states, setStates] = useState<BrazilianState[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isRemovingPhotoIndex, setIsRemovingPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const [loadedProfile, loadedInterests] = await Promise.all([
          fetchMyProfileOptional(),
          fetchInterestOptions(),
        ]);

        if (!isMounted) {
          return;
        }

        setInterestOptions(loadedInterests);

        if (loadedProfile) {
          setProfile(loadedProfile);
          setForm(profileToFormValues(loadedProfile));
          setPhotoEntries(buildPhotoEntries(loadedProfile));
          setHasExistingProfile(true);
          setSubmitError("");
        } else {
          setProfile(null);
          setForm(emptyProfileFormValues());
          setPhotoEntries(buildPhotoEntries(null));
          setHasExistingProfile(false);
        }
      } catch (error) {
        if (isMounted) {
          toast({
            title: "Não foi possível carregar os dados do perfil",
            description: error instanceof Error ? error.message : "Tente novamente.",
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

  useEffect(() => {
    let isMounted = true;

    const loadStates = async () => {
      try {
        const nextStates = await fetchBrazilianStates();
        if (isMounted) {
          setStates(nextStates);
        }
      } catch (error) {
        if (isMounted) {
          toast({
            title: "Não foi possível carregar os estados",
            description: error instanceof Error ? error.message : "Tente novamente em instantes.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingStates(false);
        }
      }
    };

    void loadStates();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  useEffect(() => {
    let isMounted = true;

    const loadCities = async () => {
      if (!form.state.trim()) {
        setCities([]);
        return;
      }

      setIsLoadingCities(true);

      try {
        const normalizedState = states.find((state) => (
          state.sigla.toLowerCase() === form.state.trim().toLowerCase() ||
          state.nome.toLowerCase() === form.state.trim().toLowerCase()
        ));
        const nextCities = await fetchCitiesByState(normalizedState?.sigla ?? form.state);

        if (normalizedState && normalizedState.sigla !== form.state) {
          setForm((current) => ({ ...current, state: normalizedState.sigla }));
        }

        if (isMounted) {
          setCities(nextCities);
        }
      } catch (error) {
        if (isMounted) {
          setCities([]);
          toast({
            title: "Não foi possível carregar as cidades",
            description: error instanceof Error ? error.message : "Tente novamente em instantes.",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingCities(false);
        }
      }
    };

    void loadCities();

    return () => {
      isMounted = false;
    };
  }, [form.state, states, toast]);

  const validPhotos = useMemo(
    () => sanitizePhotoList(photoEntries.map((entry) => entry.previewUrl)),
    [photoEntries],
  );

  useEffect(() => {
    setForm((current) => ({
      ...current,
      photos: validPhotos,
    }));
  }, [validPhotos]);

  const selectedInterests = useMemo(
    () => interestOptions.filter((option) => form.interestIds.includes(option.id)),
    [form.interestIds, interestOptions],
  );

  const completion = getProfileCompletionPercentage({
    ...form,
    photos: validPhotos,
  });
  const isComplete = isProfileComplete({
    ...form,
    photos: validPhotos,
  });
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const canLeaveSetup = hasExistingProfile && isComplete;

  const setField = <K extends keyof ProfileFormValues,>(field: K, value: ProfileFormValues[K]) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const addPhotoField = () => {
    setPhotoEntries((current) => [...current, { previewUrl: "" }]);
  };

  const removePhotoField = async (index: number) => {
    const entry = photoEntries[index];
    if (!entry) {
      return;
    }

    const filledEntries = photoEntries.filter((photo) => photo.previewUrl);
    const canRemoveFilledPhoto = filledEntries.length > MIN_PROFILE_PHOTOS;
    const canRemoveEmptySlot = !entry.previewUrl && photoEntries.length > MIN_PROFILE_PHOTOS;

    if (!canRemoveFilledPhoto && !canRemoveEmptySlot) {
      const message = `Seu perfil precisa manter pelo menos ${MIN_PROFILE_PHOTOS} fotos.`;
      setSubmitError(message);
      toast({
        title: "Quantidade mínima de fotos",
        description: message,
        variant: "destructive",
      });
      return;
    }

    setIsRemovingPhotoIndex(index);
    setSubmitError("");

    try {
      if (entry.id) {
        await deleteProfilePhoto(entry.id);
      }

      setPhotoEntries((current) => {
        const nextEntries = current.filter((_, currentIndex) => currentIndex !== index);
        while (nextEntries.length < MIN_PROFILE_PHOTOS) {
          nextEntries.push({ previewUrl: "" });
        }
        return nextEntries;
      });

      if (entry.id) {
        setProfile((currentProfile) => currentProfile ? ({
          ...currentProfile,
          photos: currentProfile.photos.filter((_, currentIndex) => currentIndex !== index),
          photoItems: currentProfile.photoItems.filter((photo) => photo.id !== entry.id),
        }) : currentProfile);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tente novamente.";
      setSubmitError(message);
      toast({
        title: "Não foi possível remover a foto",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsRemovingPhotoIndex(null);
    }
  };

  const handlePhotoUpload = async (index: number, file: File | null) => {
    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      toast({
        title: "Formato não suportado",
        description: "Use arquivos PNG, JPEG ou GIF.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "Cada foto deve ter no máximo 5 MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      const previewUrl = await fileToDataUrl(file);
      setSubmitError("");
      setPhotoEntries((current) => current.map((entry, currentIndex) => (
        currentIndex === index
          ? { ...entry, previewUrl, file }
          : entry
      )));
    } catch (error) {
      toast({
        title: "Não foi possível carregar a imagem",
        description: error instanceof Error ? error.message : "Selecione outra imagem.",
        variant: "destructive",
      });
    }
  };

  const toggleInterest = (interestId: number) => {
    setForm((current) => {
      const isSelected = current.interestIds.includes(interestId);

      if (isSelected) {
        return {
          ...current,
          interestIds: current.interestIds.filter((id) => id !== interestId),
        };
      }

      if (current.interestIds.length >= MAX_INTERESTS) {
        toast({
          title: "Limite de interesses atingido",
          description: `Escolha no máximo ${MAX_INTERESTS} interesses.`,
          variant: "destructive",
        });
        return current;
      }

      return {
        ...current,
        interestIds: [...current.interestIds, interestId],
      };
    });
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Informe o nome para o perfil.";
    }

    if (form.age < 18) {
      return "A idade mínima é 18 anos.";
    }

    if (!form.gender.trim()) {
      return "Selecione o gênero.";
    }

    if (!form.sexualOrientation.trim()) {
      return "Selecione a orientação sexual.";
    }

    if (!form.occupation.trim()) {
      return "Profissão é obrigatória.";
    }

    if (!form.education.trim()) {
      return "Formação é obrigatória.";
    }

    if (!form.city.trim() || !form.state.trim()) {
      return "Localização é obrigatória. Preencha cidade e estado.";
    }

    if (form.interestIds.length < MIN_INTERESTS) {
      return `Selecione pelo menos ${MIN_INTERESTS} interesses.`;
    }

    if (form.interestIds.length > MAX_INTERESTS) {
      return `Selecione no máximo ${MAX_INTERESTS} interesses.`;
    }

    if (validPhotos.length < MIN_PROFILE_PHOTOS) {
      return `Adicione pelo menos ${MIN_PROFILE_PHOTOS} fotos válidas ao perfil.`;
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setSubmitError(validationError);
      toast({
        title: "Perfil incompleto",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await saveMyProfile({
        ...form,
        photos: validPhotos,
      });

      const initialPhotoIds = new Set(profile?.photoItems.map((photo) => photo.id) ?? []);
      const keptPhotoIds = new Set<number>();

      for (const [index, entry] of photoEntries.entries()) {
        if (!entry.previewUrl) {
          continue;
        }

        if (entry.file) {
          await uploadProfilePhoto({
            file: entry.file,
            order: index,
            isPrimary: index === 0,
            photoId: entry.id,
          });
          if (entry.id) {
            keptPhotoIds.add(entry.id);
          }
          continue;
        }

        if (entry.id) {
          keptPhotoIds.add(entry.id);
        }
      }

      for (const photoId of initialPhotoIds) {
        if (!keptPhotoIds.has(photoId) && !photoEntries.some((entry) => entry.id === photoId && entry.previewUrl)) {
          await deleteProfilePhoto(photoId);
        }
      }

      const refreshedProfile = await fetchMyProfile();

      toast({
        title: hasExistingProfile ? "Perfil atualizado" : "Perfil criado com sucesso",
        description: "Seu perfil está pronto para aparecer no app.",
      });

      setProfile(refreshedProfile);
      setPhotoEntries(buildPhotoEntries(refreshedProfile));
      navigate(fromPath && fromPath !== "/app/profile-setup" ? fromPath : "/app/profile", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Revise os dados e tente novamente.";
      setSubmitError(message);
      toast({
        title: "Não foi possível salvar o perfil",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground font-body">
        Carregando editor de perfil...
      </div>
    );
  }

  const filteredInterestOptions = interestOptions.filter((interest) => (
    interest.name.toLowerCase().includes(interestInput.trim().toLowerCase())
  ));

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="skip-link">Pular para o conteúdo principal</a>
      <main id="main-content" tabIndex={-1} className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                if (canLeaveSetup) {
                  navigate("/app/profile");
                }
              }}
              className="inline-flex items-center gap-2 text-sm font-body text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
            <h1 className="font-display text-3xl text-foreground">
              {hasExistingProfile ? "Editar perfil" : "Criação obrigatória do perfil"}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground font-body">
              O backend exige uma estrutura de perfil completa. Aqui você finaliza os campos essenciais e envia as fotos do jeito certo.
            </p>
          </div>

          <div className="hidden min-w-56 rounded-2xl border border-white/10 bg-card/70 p-4 md:block">
            <div className="mb-2 flex items-center gap-2 text-sm font-body-bold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Perfil {completion}% completo
            </div>
            <Progress value={completion} className="h-2 bg-white/10" />
            <p className="mt-3 text-xs text-muted-foreground font-body">
              Fotos, profissão, formação e localização continuam entrando na checagem principal.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" aria-describedby={submitError ? "profile-setup-error" : undefined}>
          {submitError ? (
            <Alert id="profile-setup-error" variant="destructive" className="border-destructive/40 bg-destructive/5 text-foreground">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Há algo para corrigir</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          <section className="card-surface space-y-5 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-body-bold text-sm">Nome</Label>
                <Input id="name" value={form.name} onChange={(event) => setField("name", event.target.value)} className={inputClass} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age" className="font-body-bold text-sm">Idade</Label>
                <Input id="age" type="number" min={18} value={form.age} onChange={(event) => setField("age", Number(event.target.value))} className={inputClass} required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gender" className="font-body-bold text-sm">Gênero</Label>
                <Select value={form.gender} onValueChange={(value) => setField("gender", value)}>
                  <SelectTrigger id="gender" className={inputClass}>
                    <div className="flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Selecione o gênero" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sexualOrientation" className="font-body-bold text-sm">Orientação sexual</Label>
                <Select value={form.sexualOrientation} onValueChange={(value) => setField("sexualOrientation", value)}>
                  <SelectTrigger id="sexualOrientation" className={inputClass}>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Selecione a orientação" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {SEXUAL_ORIENTATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="font-body-bold text-sm">Bio opcional</Label>
              <Textarea id="bio" value={form.bio} onChange={(event) => setField("bio", event.target.value)} placeholder="Conte um pouco sobre você" className={inputClass} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationshipIntent" className="font-body-bold text-sm">Intenções</Label>
              <Select value={form.relationshipIntent} onValueChange={(value) => setField("relationshipIntent", value)}>
                <SelectTrigger id="relationshipIntent" className={inputClass}>
                  <SelectValue placeholder="Escolha sua intenção" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_INTENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="card-surface space-y-5 p-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="font-heading text-lg text-foreground">Localização e carreira</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="state" className="font-body-bold text-sm">Estado</Label>
                <Input
                  id="state"
                  value={form.state}
                  onChange={(event) => {
                    setField("state", event.target.value.toUpperCase());
                    setField("city", "");
                  }}
                  list="state-options"
                  placeholder={isLoadingStates ? "Carregando estados..." : "Busque a UF"}
                  className={inputClass}
                  required
                />
                <datalist id="state-options">
                  {states.map((state) => (
                    <option key={state.id} value={state.sigla}>{state.nome}</option>
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="font-body-bold text-sm">Cidade</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(event) => setField("city", event.target.value)}
                  list="city-options"
                  placeholder={form.state ? (isLoadingCities ? "Carregando cidades..." : "Busque sua cidade") : "Selecione o estado primeiro"}
                  className={inputClass}
                  required
                  disabled={!form.state}
                />
                <datalist id="city-options">
                  {cities.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="occupation" className="font-body-bold text-sm">Profissão</Label>
                <div className="relative">
                  <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="occupation" value={form.occupation} onChange={(event) => setField("occupation", event.target.value)} list="occupation-options" placeholder="Busque uma profissão" className={`${inputClass} pl-10`} required />
                  <datalist id="occupation-options">
                    {OCCUPATION_OPTIONS.map((occupation) => (
                      <option key={occupation} value={occupation} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="education" className="font-body-bold text-sm">Formação</Label>
                <div className="relative">
                  <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="education" value={form.education} onChange={(event) => setField("education", event.target.value)} list="education-options" placeholder="Busque o nível de formação" className={`${inputClass} pl-10`} required />
                  <datalist id="education-options">
                    {EDUCATION_OPTIONS.map((education) => (
                      <option key={education} value={education} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course" className="font-body-bold text-sm">Curso</Label>
              <Input id="course" value={form.course} onChange={(event) => setField("course", event.target.value)} list="course-options" placeholder="Busque um curso" className={inputClass} />
              <datalist id="course-options">
                {COURSE_OPTIONS.map((course) => (
                  <option key={course} value={course} />
                ))}
              </datalist>
            </div>
          </section>

          <section className="card-surface space-y-5 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-lg text-foreground">Fotos do perfil</h2>
                <p className="text-sm text-muted-foreground font-body">
                  O backend salva as fotos em `/photos/`, então cada imagem aqui vira um upload real.
                </p>
              </div>
              <Button type="button" variant="outline" onClick={addPhotoField}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar foto
              </Button>
            </div>

            <div className="space-y-3">
              {photoEntries.map((photo, index) => (
                <div key={`photo-${index}`} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-card/50 p-4 md:flex-row md:items-center">
                  <label className="group flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-background/60 md:w-40">
                    {photo.previewUrl ? (
                      <img src={photo.previewUrl} alt={`Pré-visualização da foto ${index + 1} do perfil`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                        <Upload className="h-5 w-5" />
                        <span className="px-4 text-xs font-body">PNG, JPEG ou GIF</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/gif"
                      className="sr-only"
                      aria-label={`Selecionar a foto ${index + 1}`}
                      onChange={(event) => {
                        void handlePhotoUpload(index, event.target.files?.[0] ?? null);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>

                  <div className="flex flex-1 items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-body-bold text-foreground">Foto {index + 1}</p>
                      <p className="text-xs text-muted-foreground font-body">
                        Toque para selecionar um arquivo do seu dispositivo.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => void removePhotoField(index)}
                      disabled={isRemovingPhotoIndex === index}
                    >
                      <span className="sr-only">Remover foto {index + 1}</span>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground font-body">Fotos válidas no momento: {validPhotos.length}</p>
          </section>

          <section className="card-surface space-y-5 p-6">
            <div className="space-y-2">
              <h2 className="font-heading text-lg text-foreground">Interesses</h2>
              <p className="text-sm text-muted-foreground font-body">
                Escolha até {MAX_INTERESTS} interesses existentes no banco de dados.
              </p>
            </div>

            <div className="space-y-3">
              <Input
                aria-label="Buscar interesses"
                value={interestInput}
                onChange={(event) => setInterestInput(event.target.value)}
                placeholder="Busque interesses"
                className={inputClass}
              />

              <div className="flex items-center justify-between gap-3 text-xs font-body">
                <span className="text-muted-foreground">
                  Selecionados: {form.interestIds.length}/{MAX_INTERESTS}
                </span>
                <span className="sr-only" aria-live="polite">
                  {form.interestIds.length < MIN_INTERESTS
                    ? `Faltam ${MIN_INTERESTS - form.interestIds.length} interesses para atingir o mínimo exigido.`
                    : "Quantidade mínima de interesses atingida."}
                </span>
              </div>

              <div className="flex max-h-72 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-white/10 bg-background/40 p-3">
                {filteredInterestOptions.length > 0 ? filteredInterestOptions.map((interest) => {
                  const isSelected = form.interestIds.includes(interest.id);

                  return (
                    <button
                      key={interest.id}
                      type="button"
                      onClick={() => toggleInterest(interest.id)}
                      aria-pressed={isSelected}
                      aria-label={`${isSelected ? "Remover" : "Selecionar"} interesse ${interest.name}`}
                      className={`rounded-full border px-3 py-2 text-xs font-body-bold transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.05)]"
                          : "border-red-500/35 bg-red-500/12 text-red-100 hover:border-red-400 hover:bg-red-500/20"
                      }`}
                    >
                      {interest.name}
                    </button>
                  );
                }) : interestInput.trim() ? (
                  <p className="text-sm text-muted-foreground font-body">Nenhum interesse encontrado para essa busca.</p>
                ) : interestOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-body">Nenhum interesse disponível no banco ainda.</p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedInterests.length > 0 ? selectedInterests.map((interest) => (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleInterest(interest.id)}
                    aria-label={`Remover interesse ${interest.name}`}
                    className="rounded-full border border-primary bg-primary px-3 py-1.5 text-xs font-body-bold text-primary-foreground"
                  >
                    {interest.name} ×
                  </button>
                )) : (
                  <p className="text-sm text-muted-foreground font-body">Nenhum interesse selecionado ainda.</p>
                )}
              </div>
            </div>
          </section>

          <section className="card-surface space-y-5 p-6">
            <h2 className="font-heading text-lg text-foreground">Preferências do perfil</h2>

            <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3">
              <div>
                <p className="font-body-bold text-sm text-foreground">Mostrar idade</p>
                <p className="text-xs text-muted-foreground font-body">Permite exibir sua idade no perfil.</p>
              </div>
              <Switch checked={form.showAge} onCheckedChange={(value) => setField("showAge", value)} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3">
              <div>
                <p className="font-body-bold text-sm text-foreground">Permitir videochamadas</p>
                <p className="text-xs text-muted-foreground font-body">Mantém disponível esse recurso no futuro.</p>
              </div>
              <Switch checked={form.allowVideoCalls} onCheckedChange={(value) => setField("allowVideoCalls", value)} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3">
              <div>
                <p className="font-body-bold text-sm text-foreground">Habilitar sugestões de dates</p>
                <p className="text-xs text-muted-foreground font-body">Usa sua localização para sugerir lugares de encontro.</p>
              </div>
              <Switch checked={form.allowDateSuggestions} onCheckedChange={(value) => setField("allowDateSuggestions", value)} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3">
              <div>
                <p className="font-body-bold text-sm text-foreground">Match de estudo</p>
                <p className="text-xs text-muted-foreground font-body">Permite conexões baseadas em interesses acadêmicos.</p>
              </div>
              <Switch checked={form.allowStudyMatch} onCheckedChange={(value) => setField("allowStudyMatch", value)} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3">
              <div>
                <p className="font-body-bold text-sm text-foreground">Modo invisível</p>
                <p className="text-xs text-muted-foreground font-body">Esconde seu perfil do discover enquanto estiver ativado.</p>
              </div>
              <Switch checked={form.invisibleMode} onCheckedChange={(value) => setField("invisibleMode", value)} />
            </div>
          </section>

          <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => {
              if (canLeaveSetup) {
                navigate("/app/profile");
              }
            }} disabled={!canLeaveSetup}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : hasExistingProfile ? "Salvar alterações" : "Criar perfil"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ProfileSetup;
