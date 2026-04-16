import { X } from "lucide-react";
import { motion } from "framer-motion";

interface AdCardProps {
  onClose: () => void;
}

export function AdCard({ onClose }: AdCardProps) {
  const mockAds = [
    {
      title: 'Novo Restaurante no Centro',
      description: 'Venha conhecer o melhor da culinária italiana!',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      cta: 'Saiba Mais',
    },
    {
      title: 'Academia FitLife',
      description: 'Primeira semana grátis! Matricule-se já',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      cta: 'Experimente',
    },
    {
      title: 'Café Aroma',
      description: '20% de desconto em todos os cafés especiais',
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
      cta: 'Ver Oferta',
    },
  ];

  const randomAd = mockAds[Math.floor(Math.random() * mockAds.length)];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-sm bg-card rounded-2xl overflow-hidden border border-border shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="absolute top-3 left-3 z-10 px-2 py-1 bg-black/50 rounded text-xs text-white font-bold">
          ANÚNCIO
        </div>

        <div className="relative h-64 bg-secondary">
          <img src={randomAd.image} alt={randomAd.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-black" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {randomAd.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {randomAd.description}
            </p>
          </div>

          <button className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-full font-bold transition-all">
            {randomAd.cta}
          </button>

          <button
            onClick={onClose}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Continuar para o próximo perfil
          </button>
        </div>
      </div>
    </motion.div>
  );
}
