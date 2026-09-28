import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BondingLogo } from "@/components/BondingLogo";
import { fetchCurrentLegalDocuments } from "@/lib/api";
import type { AppLegalDocument, LegalDocumentType } from "@/lib/types";

interface LegalDocumentPageProps {
  documentType: LegalDocumentType;
  title: string;
}

const LegalDocumentPage = ({ documentType, title }: LegalDocumentPageProps) => {
  const navigate = useNavigate();
  const [document, setDocument] = useState<AppLegalDocument | null | undefined>(undefined);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const documents = await fetchCurrentLegalDocuments();
        if (!isMounted) return;
        setDocument(documents.find((doc) => doc.documentType === documentType) ?? null);
      } catch {
        if (isMounted) setHasError(true);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [documentType]);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <main className="mx-auto w-full max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/signup")} aria-label="Voltar para o cadastro">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <BondingLogo className="h-8 w-8" />
          <h1 className="font-display text-xl text-foreground">{title}</h1>
        </div>

        <div className="card-surface p-6">
          {document === undefined && !hasError ? (
            <p className="text-muted-foreground font-body">Carregando...</p>
          ) : null}

          {hasError ? (
            <p className="text-destructive font-body">
              Não foi possível carregar este documento agora. Tente novamente mais tarde.
            </p>
          ) : null}

          {document ? (
            <>
              <p className="mb-4 text-xs text-muted-foreground font-body">
                Versão {document.versionLabel} — vigente desde{" "}
                {new Date(document.effectiveDate).toLocaleDateString("pt-BR")}
              </p>
              <pre className="whitespace-pre-wrap break-words font-body text-sm leading-relaxed text-foreground">
                {document.content}
              </pre>
            </>
          ) : null}

          {document === null ? (
            <p className="text-muted-foreground font-body">
              Este documento ainda não está disponível.
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default LegalDocumentPage;
