import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Crown, Flame, Heart, MessageCircle, Settings, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAppExperience } from "@/contexts/AppExperienceContext";
import { getCopy } from "@/lib/copy";
import { BondingLogo } from "@/components/BondingLogo";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";
import PaymentModal from "@/components/PaymentModal";

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { language, refreshWallet } = useAppExperience();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  useEffect(() => {
    void refreshWallet();
  }, [refreshWallet]);

  const copy = getCopy(language);
  const mainWidthClass = location.pathname === "/app/messages"
    ? "max-w-7xl"
    : location.pathname === "/app"
      ? "max-w-6xl"
      : "max-w-4xl";

  const navItems = [
    { path: "/app", icon: Flame, label: copy.navDiscover },
    { path: "/app/likes", icon: Heart, label: copy.navLikes },
    { path: "/app/messages", icon: MessageCircle, label: copy.navMessages },
    { path: "/app/profile", icon: User, label: copy.navProfile },
  ];

  const isActive = (path: string) => {
    if (path === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      <a href="#main-content" className="skip-link">Pular para o conteúdo principal</a>
      <a href="#primary-navigation" className="skip-link">Pular para a navegação</a>

      <header className="sticky top-0 z-50 glass-effect">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 pb-3 pt-3 sm:px-6">
          {/* Top row: logo + actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/app")}
              aria-label="Ir para a página inicial"
              className="flex min-w-0 items-center gap-3 group"
            >
              <BondingLogo className="h-9 w-9 transition-transform group-hover:scale-105" />
              <div className="min-w-0 text-left">
                <span className="block font-display text-xl leading-none text-gradient-brand">
                  Bonding
                </span>
                <span className="block text-[10px] uppercase tracking-[0.22em] text-muted-foreground/80">
                  Os melhores se conhecem aqui
                </span>
              </div>
            </button>

            <div className="ml-auto flex items-center gap-2">
              <CurrencyDisplay />

              {/* Premium button — gradiente suave */}
              <button
                type="button"
                onClick={() => setPaymentModalOpen(true)}
                className="hidden h-9 items-center gap-2 rounded-full px-4 text-sm font-body-bold text-white transition-all hover:opacity-90 active:scale-95 sm:flex"
                style={{ background: "var(--gradient-brand)", boxShadow: "0 2px 16px rgba(236,58,146,0.3)" }}
              >
                <Crown className="h-3.5 w-3.5" />
                {copy.premium}
              </button>

              {/* Settings */}
              <button
                type="button"
                onClick={() => navigate("/app/settings")}
                aria-label={copy.navSettings}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-all hover:border-white/20 hover:bg-white/5 hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </button>

              {/* Logout */}
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                aria-label="Sair da conta"
                className="hidden text-sm font-body text-muted-foreground/70 transition-colors hover:text-foreground sm:block"
              >
                {copy.logout}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav
            id="primary-navigation"
            aria-label="Navegação principal"
            className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-white/[0.07] bg-black/20 p-1.5"
          >
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-body-bold transition-all duration-300 ${
                    active
                      ? "text-white shadow-md"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                  style={active ? {
                    background: "var(--gradient-brand)",
                    boxShadow: "0 2px 16px rgba(236,58,146,0.35)",
                  } : {}}
                >
                  <item.icon
                    className="h-4 w-4 transition-transform duration-200"
                    fill={active ? "currentColor" : "none"}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className={`mx-auto min-h-[calc(100dvh-7.5rem)] w-full ${mainWidthClass} px-4 pb-6 pt-4 sm:px-6`}
      >
        <div className="page-safe-area">
          <Outlet />
        </div>
      </main>

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
      />
    </div>
  );
};

export default MainLayout;
