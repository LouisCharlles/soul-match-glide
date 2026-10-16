import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { fetchMyProfileOptional } from "@/lib/api";
import { isProfileComplete, profileToFormValues } from "@/lib/profile";
import type { AppProfile } from "@/lib/types";

const ProfileCompletionRoute = () => {
  const location = useLocation();
  const [profile, setProfile] = useState<AppProfile | null | undefined>(undefined);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const nextProfile = await fetchMyProfileOptional();
        if (isMounted) {
          setHasLoadError(false);
          setProfile(nextProfile);
        }
      } catch {
        if (isMounted) {
          setHasLoadError(true);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  // Erro checado antes do loading: no erro o profile continua undefined e a
  // tela ficava presa em "Verificando perfil...".
  if (hasLoadError) {
    return <Outlet />;
  }

  if (profile === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground font-body">
        Verificando perfil...
      </div>
    );
  }

  if (!profile || !isProfileComplete(profileToFormValues(profile))) {
    return <Navigate to="/app/profile-setup" replace state={{ from: location }} />;
  }

  if (!profile.verified) {
    return <Navigate to="/app/verify" replace />;
  }

  return <Outlet />;
};

export default ProfileCompletionRoute;
