import { useNavigate } from "react-router-dom";
import { MapPin, Briefcase, GraduationCap, Heart, Users, TrendingUp, Settings, Edit, LogOut, Plus, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentUser } from "@/data/mockData";

const Profile = () => {
  const navigate = useNavigate();

  const stats = [
    { icon: Heart, label: "Curtidas", value: "128", color: "text-primary" },
    { icon: Users, label: "Matches", value: "24", color: "text-success" },
    { icon: TrendingUp, label: "Compat.", value: "87%", color: "text-warning" },
  ];

  const photos = [...currentUser.photos, ...Array(6 - currentUser.photos.length).fill(null)];

  return (
    <div className="space-y-6 pb-8">
      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, i) => (
          <div key={i} className="aspect-square rounded-lg overflow-hidden relative group">
            {photo ? (
              <>
                <img src={photo} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-6 w-6 text-foreground" />
                </div>
              </>
            ) : (
              <div className="h-full w-full border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center bg-card hover:border-primary/50 transition-colors cursor-pointer">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="card-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl text-foreground">{currentUser.name}, {currentUser.age}</h2>
          </div>
          <button className="h-9 w-9 rounded-full bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <Edit className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground font-body">{currentUser.bio}</p>
        <div className="space-y-2">
          {[
            { icon: MapPin, text: currentUser.location },
            { icon: Briefcase, text: currentUser.occupation },
            { icon: GraduationCap, text: currentUser.education },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground font-body">
              <Icon className="h-4 w-4" />
              <span>{text}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {currentUser.interests.map((interest) => (
            <span key={interest} className="text-xs px-3 py-1.5 rounded-full bg-accent text-accent-foreground font-body-bold">
              {interest}
            </span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card-surface p-4 flex flex-col items-center gap-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <span className="font-display text-xl text-foreground">{value}</span>
            <span className="text-xs text-muted-foreground font-body">{label}</span>
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="card-surface overflow-hidden">
        {["Configurações", "Privacidade", "Notificações", "Ajuda"].map((item) => (
          <button key={item} className="w-full flex items-center gap-3 p-4 text-sm font-body text-foreground hover:bg-accent/50 transition-colors border-b border-white/5 last:border-0">
            <Settings className="h-4 w-4 text-muted-foreground" />
            {item}
          </button>
        ))}
      </div>

      <Button
        onClick={() => navigate("/")}
        variant="outline"
        className="w-full border-destructive text-destructive hover:bg-destructive/10 font-body-bold"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sair
      </Button>
    </div>
  );
};

export default Profile;
