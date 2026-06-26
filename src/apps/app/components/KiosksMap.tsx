import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { colors, radius, space } from '../theme';
import { KioskListItem } from '../lib/api';
import { useRouter } from 'expo-router';

// Hook para cargar Leaflet dinámicamente desde un CDN
function useLeaflet() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    if ((window as any).L) {
      setLoaded(true);
      return;
    }

    // Cargar estilos CSS
    let link = document.getElementById('leaflet-css') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Cargar scripts JS
    let script = document.getElementById('leaflet-js') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setLoaded(true);
      document.body.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if ((window as any).L) {
          setLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  return loaded;
}

interface KiosksMapProps {
  kiosks: KioskListItem[];
}

export default function KiosksMap({ kiosks }: KiosksMapProps) {
  const router = useRouter();
  const mapContainerRef = useRef<any>(null);
  const mapInstance = useRef<any>(null);
  const leafletLoaded = useLeaflet();
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || Platform.OS !== 'web') return;

    const L = (window as any).L;
    if (!L) return;

    // Destruir mapa previo si existe
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    // Ubicación por defecto (Mendoza) o el primer kiosco que tenga coordenadas
    let centerLat = -32.8894587;
    let centerLng = -68.8458386;

    const firstKioskWithCoords = kiosks.find((k) => k.lat != null && k.lng != null);
    if (firstKioskWithCoords && firstKioskWithCoords.lat != null && firstKioskWithCoords.lng != null) {
      centerLat = firstKioskWithCoords.lat;
      centerLng = firstKioskWithCoords.lng;
    }

    // Inicializar mapa
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
    }).setView([centerLat, centerLng], 14);

    mapInstance.current = map;

    // Capa de mapas OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Diseño CSS de los marcadores personalizados de Spot (Naranja con borde Blanco y pin)
    const markerHtml = `
      <div style="
        width: 32px;
        height: 32px;
        background-color: #ea580c;
        border: 2px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        justify-content: center;
        align-items: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 10px;
          height: 10px;
          background-color: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `;

    const spotIcon = L.divIcon({
      html: markerHtml,
      className: 'spot-custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    // Agregar marcadores para cada kiosco
    kiosks.forEach((k) => {
      if (k.lat == null || k.lng == null) return;

      const marker = L.marker([k.lat, k.lng], { icon: spotIcon }).addTo(map);

      const ratingText = k.avgRating != null
        ? `⭐ ${k.avgRating.toFixed(1)} (${k.reviewCount} reseñas)`
        : 'Sin reseñas';

      // Popup html con estilos Spot
      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 160px; padding: 4px;">
          <h3 style="margin: 0 0 4px 0; color: #1e3a8a; font-size: 14px; font-weight: 700; line-height: 1.2;">${k.name}</h3>
          <p style="margin: 0 0 4px 0; color: #718096; font-size: 12px; line-height: 1.2;">📍 ${k.address}</p>
          <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 12px; font-weight: 600;">${ratingText}</p>
          <button id="popup-btn-${k.id}" style="
            background-color: #ea580c;
            color: white;
            border: none;
            padding: 7px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 700;
            font-size: 11px;
            width: 100%;
            text-align: center;
            box-shadow: 0 2px 4px rgba(234, 88, 12, 0.2);
            transition: background-color 0.2s;
          ">Ver Kiosco</button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${k.id}`);
        if (btn) {
          btn.addEventListener('click', () => {
            router.push(`/kiosks/${k.id}`);
          });
        }
      });
    });

    setMapReady(true);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [leafletLoaded, kiosks]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>
          El mapa interactivo requiere la versión web de la plataforma.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.mapWrapper}>
      {!mapReady && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando mapa interactivo...</Text>
        </View>
      )}
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', borderRadius: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrapper: {
    flex: 1,
    margin: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
    zIndex: 10,
    gap: space.sm,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '500',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.xl,
    backgroundColor: colors.bg,
  },
  fallbackText: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 16,
    fontWeight: '500',
  },
});
