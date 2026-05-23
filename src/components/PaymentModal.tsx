import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Copy, CreditCard, ExternalLink, Landmark, LoaderCircle, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAbacatePayBilling, createAbacatePayPix, fetchMyProfile, fetchPremiumPlans } from "@/lib/api";
import { useAppExperience } from "@/contexts/AppExperienceContext";
import type { AppPremiumPlan } from "@/lib/types";
import QRCode from "react-qr-code";
const paymentMethodMeta = {
  credit: { title: "Cartão de crédito", icon: CreditCard },
  debit: { title: "Cartão de débito", icon: Landmark },
  pix: { title: "Pix", icon: QrCode },
} as const;

type PaymentMethod = keyof typeof paymentMethodMeta;

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatCpf(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlanId?: number | null;
}

const PaymentModal = ({ isOpen, onClose, selectedPlanId }: PaymentModalProps) => {
  const { grantPremium, refreshWallet } = useAppExperience();

  const [plans, setPlans] = useState<AppPremiumPlan[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("credit");
  const [cpf, setCpf] = useState("");
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pixData, setPixData] = useState<{ qrImage: string; code: string } | null>(null);
  const [isPixPolling, setIsPixPolling] = useState(false);
  const pixPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setIsLoadingPlans(true);
    setErrorMessage("");
    setSuccessMessage("");

    fetchPremiumPlans()
      .then((nextPlans) => { if (isMounted) setPlans(nextPlans); })
      .catch((err) => { if (isMounted) setErrorMessage(err instanceof Error ? err.message : "Não foi possível carregar os planos."); })
      .finally(() => { if (isMounted) setIsLoadingPlans(false); });

    return () => { isMounted = false; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSuccessMessage("");
      setErrorMessage("");
      setPixData(null);
      setIsPixPolling(false);
      setCpf("");
      if (pixPollingRef.current) {
        clearInterval(pixPollingRef.current);
        pixPollingRef.current = null;
      }
    }
  }, [isOpen]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? plans[0] ?? null,
    [plans, selectedPlanId],
  );

  const handleClose = () => {
    if (isProcessing) {
      if (!window.confirm("Pagamento em andamento. Deseja sair mesmo assim?")) return;
    }
    onClose();
  };

  const startPixPayment = async () => {
    if (!selectedPlan || isProcessing) return;
    if (cpf.length !== 11) {
      setErrorMessage("Informe um CPF válido (11 dígitos) para continuar.");
      return;
    }
    setIsProcessing(true);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const result = await createAbacatePayPix(selectedPlan.id, cpf);
      setPixData({ qrImage: result.qr_code_image, code: result.pix_code });
      setIsPixPolling(true);
      pixPollingRef.current = setInterval(() => {
        void fetchMyProfile()
          .then((profile) => {
            if (profile.premiumTier !== "free") {
              if (pixPollingRef.current) clearInterval(pixPollingRef.current);
              setIsPixPolling(false);
              grantPremium();
              void refreshWallet();
              setSuccessMessage("Pagamento Pix confirmado! Sua assinatura Premium está ativa.");
            }
          })
          .catch(() => undefined);
      }, 3000);
      setTimeout(() => {
        if (pixPollingRef.current) {
          clearInterval(pixPollingRef.current);
          pixPollingRef.current = null;
        }
        setIsPixPolling(false);
      }, 10 * 60 * 1000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível gerar o QR Code Pix.");
    } finally {
      setIsProcessing(false);
    }
  };

  const startCardPayment = async () => {
    if (!selectedPlan || isProcessing) return;
    setIsProcessing(true);
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const result = await createAbacatePayBilling(selectedPlan.id, cpf);
      window.open(result.checkout_url, "_blank", "noopener,noreferrer");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível iniciar o checkout.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto border-white/10 bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground">Assinar Premium</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pb-2">
          {errorMessage ? (
            <Alert variant="destructive">
              <AlertTitle>Erro no pagamento</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}

          {successMessage ? (
            <Alert className="border-primary/40 bg-primary/5 text-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertTitle>Sucesso</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          ) : null}

          {isLoadingPlans ? (
            <div className="text-sm text-muted-foreground font-body">Carregando planos...</div>
          ) : selectedPlan ? (
            <>
              <div className="rounded-2xl border border-white/10 bg-background/40 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Plano selecionado</p>
                <p className="mt-1 font-heading text-xl text-foreground">{selectedPlan.name}</p>
                {selectedPlan.description ? (
                  <p className="mt-1 text-sm text-muted-foreground font-body">{selectedPlan.description}</p>
                ) : null}
                <p className="mt-2 font-body-bold text-primary">
                  {currencyFormatter.format(selectedPlan.priceMonthly)}/mês
                </p>
              </div>

              {!pixData && !successMessage ? (
                <Tabs
                  value={selectedMethod}
                  onValueChange={(v) => { setSelectedMethod(v as PaymentMethod); setErrorMessage(""); }}
                  className="space-y-3"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="credit">Crédito</TabsTrigger>
                    <TabsTrigger value="debit">Débito</TabsTrigger>
                    <TabsTrigger value="pix">Pix</TabsTrigger>
                  </TabsList>

                  {(["credit", "debit"] as const).map((method) => {
                    const meta = paymentMethodMeta[method];
                    const Icon = meta.icon;
                    return (
                      <TabsContent key={method} value={method} className="rounded-2xl border border-white/10 bg-background/40 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-foreground">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="font-heading">{meta.title}</span>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="cpf-card" className="text-sm text-muted-foreground">CPF (opcional)</Label>
                          <Input
                            id="cpf-card"
                            placeholder="00000000000"
                            value={cpf}
                            onChange={(e) => setCpf(formatCpf(e.target.value))}
                            maxLength={11}
                            inputMode="numeric"
                            className="bg-background/60"
                          />
                        </div>
                        <Button className="w-full" onClick={() => void startCardPayment()} disabled={isProcessing}>
                          {isProcessing ? (
                            <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Abrindo checkout...</>
                          ) : (
                            <>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              {`Pagar com ${meta.title.toLowerCase()}`}
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center font-body">
                          Você será redirecionado para a página segura do AbacatePay
                        </p>
                      </TabsContent>
                    );
                  })}

                  <TabsContent value="pix" className="rounded-2xl border border-white/10 bg-background/40 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-foreground">
                      <QrCode className="h-4 w-4 text-primary" />
                      <span className="font-heading">Pix</span>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="cpf-pix" className="text-sm text-muted-foreground">CPF (obrigatório para Pix)</Label>
                      <Input
                        id="cpf-pix"
                        placeholder="00000000000"
                        value={cpf}
                        onChange={(e) => setCpf(formatCpf(e.target.value))}
                        maxLength={11}
                        inputMode="numeric"
                        className="bg-background/60"
                      />
                    </div>
                    <Button className="w-full" onClick={() => void startPixPayment()} disabled={isProcessing || cpf.length !== 11}>
                      {isProcessing ? (
                        <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />Gerando QR Code...</>
                      ) : "Gerar QR Code Pix"}
                    </Button>
                  </TabsContent>
                </Tabs>
              ) : null}

              {pixData && !successMessage ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-background/40 p-4">
                    <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-white p-3 shadow-sm">
                      <QRCode
                        value={pixData.code}
                        size={160}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground font-body text-center">
                      Escaneie com o app do seu banco ou copie o código abaixo
                    </p>
                    <div className="w-full rounded-xl border border-white/10 bg-background/60 p-3 flex items-center gap-2">
                      <code className="flex-1 truncate text-xs text-foreground font-mono">{pixData.code}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void navigator.clipboard.writeText(pixData.code)}
                        className="shrink-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    {isPixPolling ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Aguardando pagamento...
                      </div>
                    ) : null}
                  </div>
                  <Button variant="outline" onClick={handleClose} className="w-full">
                    Cancelar
                  </Button>
                </div>
              ) : null}

              {successMessage ? (
                <Button className="w-full" onClick={onClose}>
                  Fechar
                </Button>
              ) : null}
            </>
          ) : (
            <Alert>
              <AlertTitle>Plano não encontrado</AlertTitle>
              <AlertDescription>Selecione um plano válido para continuar.</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
