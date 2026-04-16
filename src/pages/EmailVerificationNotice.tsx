import { MailCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BondingLogo } from "@/components/BondingLogo";
import { getCopy } from "@/lib/copy";
import { useAppExperience } from "@/contexts/AppExperienceContext";

const EmailVerificationNotice = () => {
  const navigate = useNavigate();
  const { language } = useAppExperience();
  const copy = getCopy(language);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-[2rem] border border-white/10 bg-card/90 p-8 text-center shadow-2xl">
        <div className="mx-auto flex w-fit items-center gap-3">
          <BondingLogo className="h-12 w-12" />
          <span className="font-display text-3xl text-foreground">Bonding</span>
        </div>

        <div className="mt-8 inline-flex rounded-full bg-primary/10 p-4">
          <MailCheck className="h-8 w-8 text-primary" />
        </div>

        <h1 className="mt-6 font-display text-3xl text-foreground">{copy.verificationTitle}</h1>
        <p className="mt-3 text-sm text-muted-foreground font-body">
          {copy.verificationDescription}
        </p>

        <div className="mt-8 space-y-3">
          <Button className="w-full" onClick={() => navigate("/")}>
            Ir para login
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate("/signup")}>
            Criar outra conta
          </Button>
        </div>
      </section>
    </main>
  );
};

export default EmailVerificationNotice;
