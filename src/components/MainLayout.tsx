import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Crown, Flame, Heart, MessageCircle, Settings, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAppExperience } from "@/contexts/AppExperienceContext";
import { getCopy } from "@/lib/copy";
import { BondingLogo } from "@/components/BondingLogo";
import { CurrencyDisplay } from "@/components/CurrencyDisplay";

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { language } = useAppExperience();
  const copy = getCopy(language);
  const mainWidthClass = location.pathname === "/app/messages" ? "max-w-7xl" : location.pathname === "/app" ? "max-w-6xl" : "max-w-4xl";

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

      <header className="sticky top-0 z-50 border-b border-white/10 glass-effect">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 pb-3 pt-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/app")}
              aria-label="Ir para a página inicial"
              className="flex min-w-0 items-center gap-3"
            >
              <BondingLogo className="h-9 w-9" />
              <div className="min-w-0 text-left">
                <span className="block font-display text-xl leading-none text-foreground">Bonding</span>
                <span className="block text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Campus dating</span>
              </div>
            </button>

            <div className="ml-auto flex items-center gap-2">
              <CurrencyDisplay />
              <button
                type="button"
                onClick={() => navigate("/app/premium")}
                className="hidden h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-sm font-body-bold text-foreground transition-colors hover:bg-white/5 sm:flex"
              >
                <Crown className="h-4 w-4 text-primary" />
                {copy.premium}
              </button>
              <button
                type="button"
                onClick={() => navigate("/app/settings")}
                aria-label={copy.navSettings}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                aria-label="Sair da conta"
                className="hidden text-sm font-body-bold text-muted-foreground transition-colors hover:text-foreground sm:block"
              >
                {copy.logout}
              </button>
            </div>
          </div>

          <nav
            id="primary-navigation"
            aria-label="Navegação principal"
            className="flex items-center gap-2 overflow-x-auto rounded-[1.35rem] border border-white/10 bg-background/35 p-1.5"
          >
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                aria-current={isActive(item.path) ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-[1rem] px-4 py-2.5 text-sm font-body-bold transition-all ${
                  isActive(item.path)
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" fill={isActive(item.path) ? "currentColor" : "none"} />
                <span>{item.label}</span>
              </button>
            ))}
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
    </div>
  );
};

export default MainLayout;
