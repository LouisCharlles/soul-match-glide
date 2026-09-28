import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BondingLogo } from "@/components/BondingLogo";
import { Button } from "@/components/ui/button";
import ConsentCheckbox from "@/components/legal/ConsentCheckbox";
import { useToast } from "@/hooks/use-toast";
import { fetchCurrentLegalDocuments, submitConsent } from "@/lib/api";
import type { AppLegalDocument, ConsentType } from "@/lib/types";

const ConsentUpdate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<AppLegalDocument[] | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    fetchCurrentLegalDocuments()
      .then((docs) => {
        if (isMounted) setDocuments(docs);
      })
      .catch(() => {
        if (isMounted) setErrorMessage("Não foi possível carregar os documentos atualizados.");
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleConfirm = async () => {
    if (!documents || documents.length === 0) return;
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const documentTypeToConsentType: Record<AppLegalDocument["documentType"], ConsentType> = {
        terms_of_use: "general_terms",
        privacy_policy: "privacy_policy",
        research_consent: "research_consent",
      };
      for (const document of documents) {
        const consentType = documentTypeToConsentType[document.documentType];
        await submitConsent({ consentType, documentVersionId: document.id });
      }
      toast({ title: "Consentimento atualizado", description: "Obrigado por revisar os termos." });
      navigate("/app", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tente novamente.";
      setErrorMessage(message);
      toast({ title: "Não foi possível registrar seu consentimento", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <main className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <BondingLogo className="h-16 w-16" />
          <h1 className="w-full font-display text-2xl text-foreground tracking-tight text-center">
            Nossos termos foram atualizados
          </h1>
          <p className="text-center text-muted-foreground text-sm font-body">
            Para continuar usando o Bonding, revise e aceite a versão mais recente dos nossos
            Termos de Uso e Política de Privacidade.
          </p>
        </div>

        <div className="card-surface p-6 space-y-4">
          {errorMessage ? (
            <Alert variant="destructive" className="border-destructive/40 bg-destructive/5 text-foreground">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ops</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <ConsentCheckbox
            checked={accepted}
            onCheckedChange={setAccepted}
            disabled={!documents || documents.length === 0}
          />

          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || !accepted || !documents || documents.length === 0}
            className="w-full font-body-bold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? "Enviando..." : "Aceitar e continuar"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ConsentUpdate;
