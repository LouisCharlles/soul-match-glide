import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Copy, CreditCard, ExternalLink, Landmark, LoaderCircle, QrCode } from "lucide-react";
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

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { grantPremium, refreshWallet } = useAppExperience();

  const [plans, setPlans] = useState<AppPremiumPlan[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("credit");
  const [cpf, setCpf] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pixData, setPixData] = useState<{ qrImage: string; code: string } | null>(null);
  const [isPixPolling, setIsPixPolling] = useState(false);
  const pixPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const planId = Number(searchParams.get("plan"));

  useEffect(() => {
    let isMounted = true;
    fetchPremiumPlans()
      .then((nextPlans) => { if (isMounted) { setPlans(nextPlans); setErrorMessage(""); } })
      .catch((error) => { if (isMounted) setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar os planos."); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    return () => {
      if (pixPollingRef.current) clearInterval(pixPollingRef.current);
    };
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === planId) ?? null,
    [planId, plans],
  );

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
        if (pixPollingRef.current) { clearInterval(pixPollingRef.current); pixPollingRef.current = null; }
        setIsPixPolling(false);
      }, 10 * 60 * 1000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível gerar o QR Code Pix.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="space-y-6 pb-8">
      <div>
        <h1 className="font-display text-3xl text-foreground">Pagamento</h1>
        <p className="mt-2 text-sm text-muted-foreground font-body">
          Checkout seguro via AbacatePay — cartão de crédito, débito e Pix.
        </p>
      </div>

      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível preparar o pagamento</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert className="border-primary/40 bg-primary/5 text-foreground">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertTitle>Pagamento confirmado</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="text-sm text-muted-foreground font-body">Carregando plano selecionado...</div>
      ) : selectedPlan ? (
        <>
          <div className="card-surface p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Plano selecionado</p>
            <p className="mt-2 font-heading text-2xl text-foreground">{selectedPlan.name}</p>
            <p className="mt-1 text-sm text-muted-foreground font-body">{selectedPlan.description}</p>
            <p className="mt-3 text-lg font-body-bold text-primary">
              {currencyFormatter.format(selectedPlan.priceMonthly)}/mês
            </p>
          </div>

          {!pixData && !successMessage ? (
            <Tabs
              value={selectedMethod}
              onValueChange={(v) => { setSelectedMethod(v as PaymentMethod); setErrorMessage(""); }}
              className="space-y-4"
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
                  <TabsContent key={method} value={method} className="card-surface space-y-4 p-5">
                    <div className="flex items-center gap-2 text-foreground">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="font-heading">{meta.title}</span>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`cpf-${method}`} className="text-sm text-muted-foreground">CPF (opcional)</Label>
                      <Input
                        id={`cpf-${method}`}
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
                        <><ExternalLink className="mr-2 h-4 w-4" />{`Pagar com ${meta.title.toLowerCase()}`}</>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center font-body">
                      Você será redirecionado para a página segura do AbacatePay
                    </p>
                  </TabsContent>
                );
              })}

              <TabsContent value="pix" className="card-surface space-y-4 p-5">
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
            <div className="card-surface space-y-4 p-5">
              <div className="flex flex-col items-center gap-3">
                {/* Fundo branco obrigatório para o leitor do banco conseguir ler no Dark Mode! */}
                <div className="flex h-52 w-52 items-center justify-center rounded-xl bg-white p-4 shadow-sm">
                  <QRCode
                    value={pixData.code}
                    size={180}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                </div>
                <p className="text-sm text-muted-foreground font-body text-center">
                  Escaneie com o app do seu banco ou copie o código abaixo
                </p>
                <div className="w-full rounded-xl border border-white/10 bg-background/60 p-3 flex items-center gap-2">
                  <code className="flex-1 truncate text-xs text-foreground font-mono">{pixData.code}</code>
                  <Button size="sm" variant="ghost" onClick={() => void navigator.clipboard.writeText(pixData.code)} className="shrink-0">
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
              <Button variant="outline" onClick={() => navigate("/app/premium")} className="w-full">
                Voltar para premium
              </Button>
            </div>
          ) : null}

          {successMessage ? (
            <Button className="w-full" onClick={() => navigate("/app/premium")}>
              Voltar para premium
            </Button>
          ) : null}
        </>
      ) : (
        <Alert>
          <AlertTitle>Plano não encontrado</AlertTitle>
          <AlertDescription>
            Volte para a página premium e selecione um plano válido antes de continuar.
          </AlertDescription>
        </Alert>
      )}
    </section>
  );
};

export default Payment;
