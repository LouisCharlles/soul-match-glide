import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createReport } from "@/lib/api";
import type { AppUserProfile, ReportReason } from "@/lib/types";

const REPORT_REASON_OPTIONS: Array<{ value: ReportReason; label: string }> = [
  { value: "spam", label: "Spam" },
  { value: "fake", label: "Perfil falso" },
  { value: "abuse", label: "Abuso" },
  { value: "inappropriate", label: "Conteúdo impróprio" },
  { value: "other", label: "Outro" },
];

interface ReportUserDialogProps {
  isOpen: boolean;
  user: AppUserProfile | null;
  onClose: () => void;
  onReported?: () => void;
}

const ReportUserDialog = ({ isOpen, user, onClose, onReported }: ReportUserDialogProps) => {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const resetState = () => {
    setReason("");
    setDetails("");
    setErrorMessage("");
    setIsSubmitting(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
      onClose();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    if (!reason) {
      setErrorMessage("Selecione um motivo para enviar a denúncia.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await createReport({
        reportedUserId: user.userId,
        reason,
        details,
      });
      resetState();
      onClose();
      onReported?.();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível enviar a denúncia.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="border-white/10 bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Denunciar perfil</DialogTitle>
          <DialogDescription className="font-body">
            {user ? `Envie uma denúncia sobre ${user.name}. Nossa equipe poderá revisar esse conteúdo.` : "Selecione um perfil para denunciar."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Não foi possível enviar a denúncia</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="report-email-readonly" className="font-body-bold text-sm">Perfil</Label>
            <Input
              id="report-email-readonly"
              value={user ? `${user.name}, ${user.age}` : ""}
              disabled
              className="bg-background/50 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-reason" className="font-body-bold text-sm">Motivo</Label>
            <Select value={reason} onValueChange={(value) => setReason(value as ReportReason)}>
              <SelectTrigger id="report-reason" aria-label="Selecione o motivo da denúncia" className="bg-background/50 border-white/10">
                <SelectValue placeholder="Selecione um motivo" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-details" className="font-body-bold text-sm">Detalhes opcionais</Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Conte rapidamente o que aconteceu"
              className="min-h-28 bg-background/50 border-white/10"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !user}>
              {isSubmitting ? "Enviando..." : "Enviar denúncia"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportUserDialog;
