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

  if (profile === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground font-body">
        Verificando perfil...
      </div>
    );
  }

  if (hasLoadError) {
    return <Outlet />;
  }

  if (!profile || !isProfileComplete(profileToFormValues(profile))) {
    return <Navigate to="/app/profile-setup" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProfileCompletionRoute;
