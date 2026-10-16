import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { fetchMyConsents } from "@/lib/api";

const REQUIRED_CONSENT_TYPES = ["general_terms", "privacy_policy", "research_consent"] as const;

const ConsentGateRoute = () => {
  const [isUpToDate, setIsUpToDate] = useState<boolean | undefined>(undefined);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadConsents = async () => {
      try {
        const consents = await fetchMyConsents();
        if (!isMounted) return;
        setHasLoadError(false);
        setIsUpToDate(
          REQUIRED_CONSENT_TYPES.every((type) =>
            consents.some((consent) => consent.consentType === type && consent.isUpToDate),
          ),
        );
      } catch {
        if (isMounted) setHasLoadError(true);
      }
    };

    void loadConsents();

    return () => {
      isMounted = false;
    };
  }, []);

  // Erro checado antes do loading: no erro isUpToDate continua undefined e a
  // tela ficava presa em "Verificando consentimento...".
  if (hasLoadError) {
    return <Outlet />;
  }

  if (isUpToDate === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground font-body">
        Verificando consentimento...
      </div>
    );
  }

  if (!isUpToDate) {
    return <Navigate to="/app/consent-update" replace />;
  }

  return <Outlet />;
};

export default ConsentGateRoute;
