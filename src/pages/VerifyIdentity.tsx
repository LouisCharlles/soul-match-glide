import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, BadgeCheck, Camera, RefreshCw, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createVerificationAttempt, fetchMyProfile, fetchVerificationAttempts } from "@/lib/api";
import { useCamera } from "@/hooks/useCamera";
import { getFriendlyVerificationError } from "@/lib/verificationErrors";
import type { AppVerificationAttempt } from "@/lib/types";

const VerifyIdentity = () => {
  const navigate = useNavigate();
  const camera = useCamera();
  const [hasEnoughPhotos, setHasEnoughPhotos] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSummary, setVerificationSummary] = useState<AppVerificationAttempt | null>(null);
  const [verifyError, setVerifyError] = useState("");

  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchMyProfile(), fetchVerificationAttempts()])
      .then(([profile, attempts]) => {
        if (!isMounted) return;
        setHasEnoughPhotos((profile.photos?.length ?? 0) >= 2);
        setVerificationSummary(attempts[0] ?? null);
        if (profile.verified) {
          navigate("/app", { replace: true });
        }
      })
      .catch(() => {
        if (isMounted) setHasEnoughPhotos(true); // allow on error
      });
    return () => { isMounted = false; };
  }, [navigate]);

  useEffect(() => {
    if (camera.state === "active" && camera.videoRef.current && camera.stream) {
      camera.videoRef.current.srcObject = camera.stream;
      camera.videoRef.current.play().catch(console.error);
    }
  }, [camera.state, camera.videoRef, camera.stream]);

  const handleCapture = () => {
    const file = camera.capturePhoto();
    if (!file) return;
    setIsVerifying(true);
    setVerifyError("");
    createVerificationAttempt(file)
      .then(() => fetchVerificationAttempts())
      .then((attempts) => {
        const latest = attempts[0] ?? null;
        setVerificationSummary(latest);
        if (latest?.status === "approved") {
          navigate("/app", { replace: true });
        }
      })
      .catch((error) => {
        const raw = error instanceof Error ? error.message : "";
        setVerifyError(getFriendlyVerificationError(raw));
      })
      .finally(() => setIsVerifying(false));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl text-foreground">Verificar identidade</h1>
          <p className="text-sm text-muted-foreground font-body">
            Tire uma selfie em ambiente bem iluminado, sem acessórios que escondam o rosto.
            Ela será comparada com as fotos do seu perfil.
          </p>
        </div>

        {/* Not enough photos warning */}
        {hasEnoughPhotos === false ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fotos insuficientes</AlertTitle>
            <AlertDescription>
              Você precisa de pelo menos 2 fotos no perfil antes de verificar a identidade.
            </AlertDescription>
            <Button
              className="mt-3 w-full"
              variant="outline"
              onClick={() => navigate("/app/profile-setup")}
            >
              Adicionar fotos ao perfil
            </Button>
          </Alert>
        ) : null}

        {/* No camera */}
        {camera.hasCamera === false ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              É necessário utilizar um dispositivo com câmera para prosseguir com a verificação.
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Verify error */}
        {verifyError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{verifyError}</AlertDescription>
          </Alert>
        ) : null}

        {/* Verification summary */}
        {verificationSummary && verificationSummary.status !== "approved" ? (
          <div className="card-surface p-4 space-y-1 text-sm">
            <p className="font-body-bold text-foreground">
              {verificationSummary.status === "pending" || verificationSummary.status === "review"
                ? "Verificação em análise"
                : "Verificação não aprovada"}
            </p>
            {verificationSummary.rejectionReason ? (
              <p className="text-muted-foreground">
                {getFriendlyVerificationError(verificationSummary.rejectionReason)}
              </p>
            ) : verificationSummary.status === "pending" ? (
              <p className="text-muted-foreground">Aguardando processamento. Tente tirar uma nova selfie.</p>
            ) : null}
          </div>
        ) : null}

        {verificationSummary?.status === "approved" ? (
          <Alert className="border-primary/40 bg-primary/5">
            <BadgeCheck className="h-4 w-4 text-primary" />
            <AlertTitle>Identidade verificada!</AlertTitle>
            <AlertDescription>Redirecionando...</AlertDescription>
          </Alert>
        ) : null}

        {/* Camera UI — only when enough photos and camera available */}
        {hasEnoughPhotos !== false && camera.hasCamera !== false ? (
          <div className="card-surface p-5 space-y-4">
            {camera.state === "active" ? (
              <div className="space-y-3">
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video
                  ref={camera.videoRef}
                  className="w-full rounded-2xl border border-white/10 bg-background"
                  autoPlay
                  playsInline
                  muted
                  aria-label="Prévia da câmera"
                />
                <Button className="w-full" onClick={handleCapture} disabled={isVerifying}>
                  <Camera className="mr-2 h-4 w-4" />
                  {isVerifying ? "Enviando selfie..." : "Tirar foto"}
                </Button>
              </div>
            ) : camera.state === "captured" && camera.previewUrl ? (
              <div className="space-y-3">
                <img
                  src={camera.previewUrl}
                  alt="Selfie capturada"
                  className="w-full rounded-2xl border border-white/10"
                />
                {isVerifying ? (
                  <p className="text-center text-sm text-muted-foreground font-body">Verificando identidade...</p>
                ) : (
                  <Button variant="outline" className="w-full" onClick={camera.retake}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Tirar outra foto
                  </Button>
                )}
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={() => void camera.startCamera()}
                disabled={camera.hasCamera === null}
              >
                <Camera className="mr-2 h-4 w-4" />
                Abrir câmera
              </Button>
            )}

            {camera.errorMessage ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{camera.errorMessage}</AlertDescription>
              </Alert>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default VerifyIdentity;
