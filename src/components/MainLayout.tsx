import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Heart, MessageCircle, User, Flame } from "lucide-react";

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/app", icon: Flame, label: "Descobrir" },
    { path: "/app/messages", icon: MessageCircle, label: "Mensagens" },
    { path: "/app/profile", icon: User, label: "Perfil" },
  ];

  const isActive = (path: string) => {
    if (path === "/app") return location.pathname === "/app";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 h-16 glass-effect border-b border-white/10 flex items-center px-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/app")}>
          <Heart className="h-6 w-6 text-primary" fill="currentColor" />
          <span className="font-display text-xl text-foreground">Bonding</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-4">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-white/10">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                isActive(item.path) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" fill={isActive(item.path) ? "currentColor" : "none"} />
              <span className="text-xs font-body-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop Floating Nav */}
      <nav className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 glass-effect rounded-full px-2 py-2 shadow-2xl border border-white/10">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${
                isActive(item.path)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <item.icon className="h-5 w-5" fill={isActive(item.path) ? "currentColor" : "none"} />
              <span className="text-sm font-body-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Spacer for mobile nav */}
      <div className="md:hidden h-20" />
    </div>
  );
};

export default MainLayout;
