import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ThirdPartyCookieChoice } from "@/lib/cookieConsent";

interface ThirdPartyCookieNoticeProps {
  onChoose: (choice: ThirdPartyCookieChoice) => void;
}

const ThirdPartyCookieNotice = ({ onChoose }: ThirdPartyCookieNoticeProps) => (
  <section
    role="region"
    aria-labelledby="cookie-notice-title"
    className="card-surface p-5 space-y-3 border border-primary/30"
  >
    <div className="flex items-center gap-2">
      <Cookie className="h-4 w-4 text-primary" aria-hidden="true" />
      <h2 id="cookie-notice-title" className="font-body-bold text-sm text-foreground">
        Cookies de terceiros
      </h2>
    </div>
    <p className="text-sm text-muted-foreground font-body">
      O site e o servidor do Bonding ficam em domínios diferentes. Para manter você conectado
      ao recarregar a página, usamos um cookie de sessão seguro de terceiros, usado só para
      autenticação, sem rastreamento nem publicidade.
    </p>
    <p className="text-sm text-muted-foreground font-body">
      Se recusar, o app funciona normalmente, mas você precisará entrar de novo sempre que
      recarregar ou reabrir a página.
    </p>
    <div className="flex gap-2">
      <Button type="button" className="flex-1" onClick={() => onChoose("accepted")}>
        Aceitar
      </Button>
      <Button type="button" variant="outline" className="flex-1" onClick={() => onChoose("declined")}>
        Recusar
      </Button>
    </div>
  </section>
);

export default ThirdPartyCookieNotice;
