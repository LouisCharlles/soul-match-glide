import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, CreditCard, Landmark, LoaderCircle, QrCode } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createStripePaymentIntent, fetchPremiumPlans } from "@/lib/api";
import type { AppPremiumPlan } from "@/lib/types";

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim() || "";

const paymentMethodMeta = {
  credit: {
    title: "Cartão de crédito",
    icon: CreditCard,
    description: "Checkout real com Stripe Payment Element.",
  },
  debit: {
    title: "Cartão de débito",
    icon: Landmark,
    description: "Usa o mesmo Payment Element e mostra os meios suportados pela sua conta Stripe.",
  },
  pix: {
    title: "Pix",
    icon: QrCode,
    description: "Quando habilitado na conta Stripe, o Payment Element também expõe Pix aqui.",
  },
} as const;

type PaymentMethod = keyof typeof paymentMethodMeta;

type StripeInstance = {
  elements: (options: { clientSecret: string; appearance?: Record<string, unknown> }) => StripeElementsInstance;
  confirmPayment: (options: {
    elements: StripeElementsInstance;
    confirmParams?: { return_url?: string };
    redirect?: "always" | "if_required";
  }) => Promise<{ error?: { message?: string }; paymentIntent?: { status?: string } }>;
};

type StripeElementsInstance = {
  create: (type: "payment", options?: Record<string, unknown>) => StripeElementInstance;
};

type StripeElementInstance = {
  mount: (selectorOrElement: string | HTMLElement) => void;
  destroy: () => void;
};

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => StripeInstance;
  }
}

let stripeScriptLoader: Promise<void> | null = null;

function loadStripeJs() {
  if (!STRIPE_PUBLISHABLE_KEY) {
    return Promise.reject(new Error("VITE_STRIPE_PUBLISHABLE_KEY não configurada."));
  }

  if (typeof window !== "undefined" && window.Stripe) {
    return Promise.resolve();
  }

  if (!stripeScriptLoader) {
    stripeScriptLoader = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Não foi possível carregar o Stripe.js."));
      document.head.appendChild(script);
    });
  }

  return stripeScriptLoader;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const elementContainerRef = useRef<HTMLDivElement>(null);
  const elementInstanceRef = useRef<StripeElementInstance | null>(null);
  const stripeRef = useRef<StripeInstance | null>(null);
  const elementsRef = useRef<StripeElementsInstance | null>(null);

  const [plans, setPlans] = useState<AppPremiumPlan[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("credit");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  const planId = Number(searchParams.get("plan"));

  useEffect(() => {
    let isMounted = true;

    const loadPlans = async () => {
      try {
        const nextPlans = await fetchPremiumPlans();
        if (!isMounted) {
          return;
        }

        setPlans(nextPlans);
        setErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : "Não foi possível carregar os planos.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === planId) ?? null,
    [planId, plans],
  );

  const mountPaymentElement = async (nextClientSecret: string) => {
    await loadStripeJs();

    if (!window.Stripe || !elementContainerRef.current) {
      throw new Error("Stripe.js não ficou disponível no navegador.");
    }

    elementInstanceRef.current?.destroy();
    elementContainerRef.current.innerHTML = "";

    const stripe = window.Stripe(STRIPE_PUBLISHABLE_KEY);
    const elements = stripe.elements({
      clientSecret: nextClientSecret,
      appearance: {
        theme: "night",
        variables: {
          colorPrimary: "#d71d29",
          colorBackground: "#101114",
          colorText: "#f7f7f8",
          colorDanger: "#ef4444",
          borderRadius: "18px",
        },
      },
    });

    const paymentElement = elements.create("payment", {
      layout: "tabs",
      defaultValues: {
        billingDetails: {
          name: "",
        },
      },
    });
    paymentElement.mount(elementContainerRef.current);

    stripeRef.current = stripe;
    elementsRef.current = elements;
    elementInstanceRef.current = paymentElement;
  };

  const startPayment = async () => {
    if (!selectedPlan || isCreatingIntent) {
      return;
    }

    setIsCreatingIntent(true);
    setSuccessMessage("");
    try {
      const response = await createStripePaymentIntent(selectedPlan.id);
      setClientSecret(response.client_secret);
      await mountPaymentElement(response.client_secret);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível criar o pagamento.");
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const confirmPayment = async () => {
    if (!stripeRef.current || !elementsRef.current || isConfirmingPayment) {
      return;
    }

    setIsConfirmingPayment(true);
    try {
      const result = await stripeRef.current.confirmPayment({
        elements: elementsRef.current,
        confirmParams: {
          return_url: `${window.location.origin}/app/premium?checkout=success`,
        },
        redirect: "if_required",
      });

      if (result.error?.message) {
        throw new Error(result.error.message);
      }

      if (result.paymentIntent?.status === "succeeded" || result.paymentIntent?.status === "processing") {
        setSuccessMessage("Pagamento iniciado com sucesso. O Stripe já recebeu a confirmação desta cobrança.");
      } else {
        setSuccessMessage("O pagamento foi enviado ao Stripe. A confirmação final pode depender do método escolhido.");
      }
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível confirmar o pagamento.");
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  useEffect(() => {
    return () => {
      elementInstanceRef.current?.destroy();
    };
  }, []);

  return (
    <section className="space-y-6 pb-8">
      <div>
        <h1 className="font-display text-3xl text-foreground">Pagamento</h1>
        <p className="mt-2 text-sm text-muted-foreground font-body">
          Checkout real com Stripe Payment Element para cartão e métodos suportados, incluindo Pix quando habilitado.
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
          <AlertTitle>Stripe conectado</AlertTitle>
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

          <Tabs
            value={selectedMethod}
            onValueChange={(value) => setSelectedMethod(value as PaymentMethod)}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="credit">Crédito</TabsTrigger>
              <TabsTrigger value="debit">Débito</TabsTrigger>
              <TabsTrigger value="pix">Pix</TabsTrigger>
            </TabsList>

            {Object.entries(paymentMethodMeta).map(([method, meta]) => {
              const Icon = meta.icon;
              return (
                <TabsContent key={method} value={method} className="card-surface space-y-4 p-5">
                  <div className="flex items-center gap-2 text-foreground">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-heading">{meta.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground font-body">{meta.description}</p>
                  <Button className="w-full" onClick={() => void startPayment()} disabled={isCreatingIntent}>
                    {isCreatingIntent ? "Preparando checkout..." : `Abrir checkout de ${meta.title.toLowerCase()}`}
                  </Button>
                </TabsContent>
              );
            })}
          </Tabs>

          {clientSecret ? (
            <div className="card-surface space-y-4 p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Stripe Payment Element</p>
                <p className="mt-2 font-heading text-xl text-foreground">Finalize a assinatura</p>
                <p className="mt-2 text-sm text-muted-foreground font-body">
                  O formulário abaixo é renderizado pelo Stripe.js usando o client secret real retornado pelo backend.
                </p>
              </div>

              <div ref={elementContainerRef} className="rounded-3xl border border-white/10 bg-background/60 p-4" />

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => void confirmPayment()} disabled={isConfirmingPayment}>
                  {isConfirmingPayment ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    "Confirmar pagamento"
                  )}
                </Button>
                <Button variant="outline" onClick={() => navigate("/app/premium")}>
                  Voltar para premium
                </Button>
              </div>
            </div>
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
