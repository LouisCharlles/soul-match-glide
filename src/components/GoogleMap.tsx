import { useEffect, useRef, useState } from "react";
import { MapPinned } from "lucide-react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || "";

let googleMapsLoader: Promise<void> | null = null;

function loadGoogleMapsSdk() {
  if (!GOOGLE_MAPS_API_KEY) {
    return Promise.reject(new Error("VITE_GOOGLE_MAPS_API_KEY não configurada."));
  }

  if (typeof window !== "undefined" && window.google?.maps) {
    return Promise.resolve();
  }

  if (!googleMapsLoader) {
    googleMapsLoader = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Não foi possível carregar o Google Maps."));
      document.head.appendChild(script);
    });
  }

  return googleMapsLoader;
}

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (element: HTMLElement, options: Record<string, unknown>) => unknown;
        Marker: new (options: Record<string, unknown>) => unknown;
      };
    };
  }
}

interface GoogleMapProps {
  latitude: number;
  longitude: number;
  title: string;
  className?: string;
}

const GoogleMap = ({ latitude, longitude, title, className = "" }: GoogleMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const renderMap = async () => {
      try {
        await loadGoogleMapsSdk();
        if (!isMounted || !containerRef.current || !window.google?.maps) {
          return;
        }

        const center = { lat: latitude, lng: longitude };
        const map = new window.google.maps.Map(containerRef.current, {
          center,
          zoom: 15,
          disableDefaultUI: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        new window.google.maps.Marker({
          map,
          position: center,
          title,
        });
        setErrorMessage("");
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : "Não foi possível renderizar o mapa.");
      }
    };

    void renderMap();

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude, title]);

  if (errorMessage) {
    return (
      <div className={`flex min-h-[260px] items-center justify-center rounded-2xl border border-white/10 bg-accent/20 p-4 text-sm text-muted-foreground ${className}`}>
        <div className="flex flex-col items-center gap-2 text-center">
          <MapPinned className="h-5 w-5 text-primary" />
          <span>{errorMessage}</span>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className={`min-h-[260px] rounded-2xl ${className}`} aria-label={`Mapa com marcador de ${title}`} />;
};

export default GoogleMap;
