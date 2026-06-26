# Integración del Mapa Interactivo de Kioscos 🗺️

Este documento describe cómo se diseñó, desarrolló e integró la vista de **mapa interactivo** para los clientes (Players) en la plataforma **Spot**.

---

## 1. Decisiones de Diseño y Arquitectura

Para implementar el mapa en una aplicación basada en **Expo Web / React Native Web** de manera estable, rápida y sin añadir peso innecesario a la compilación, se optó por una integración basada en **Leaflet y OpenStreetMap** mediante inyección dinámica de CDN.

### Beneficios de esta arquitectura:
1. **Sin dependencias nativas complejas**: Se evita el uso de librerías como `react-native-maps`, que suelen requerir configuraciones complejas para entornos web, provocando fallos en la compilación de Expo o requiriendo claves pagas de Google Maps.
2. **Carga perezosa (Lazy Loading)**: Los scripts y estilos del mapa solo se descargan de la red en el momento en que el usuario hace clic por primera vez en la pestaña "Mapa".
3. **Marcadores Personalizados con CSS puro**: En lugar de depender de URLs de imágenes para los pines del mapa (lo cual suele fallar con CDNs externos de Leaflet), se diseñaron marcadores vectoriales interactivos con HTML/CSS que se adaptan a la paleta de colores del proyecto Spot.

---

## 2. Componentes y Flujo de Datos

### A. Tipos de Datos (API Cliente)
En [`src/apps/app/lib/api.ts`](../src/apps/app/lib/api.ts) se extendió el tipo `KioskListItem` para incluir los datos de geolocalización que el servidor de NestJS ya retorna:
```typescript
export type KioskListItem = {
  // ... campos anteriores
  lat?: number | null;
  lng?: number | null;
};
```

### B. Inyección Dinámica de Leaflet (Hook en KiosksMap)
El componente [`KiosksMap.tsx`](../src/apps/app/components/KiosksMap.tsx) utiliza el hook personalizado `useLeaflet` para añadir al árbol del DOM de la página los recursos de Leaflet si no están presentes:
* **CSS**: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css`
* **JS**: `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`

### C. Instanciación del Mapa y Marcadores
Una vez cargado el script `window.L`, se crea el mapa sobre un contenedor de tipo `div` (utilizando un `ref` de React) y se renderizan los pines:
* **Centrado automático**: El mapa busca el primer kiosco con coordenadas válidas para centrar la vista; si no hay ninguno, se centra en la Ciudad de Mendoza por defecto.
* **Popups interactivos**: Cada marcador contiene un popup informativo. Al abrirse, se enlaza dinámicamente un evento de clic (`addEventListener`) al botón "Ver Kiosco", permitiendo usar el enrutador nativo de la aplicación (`expo-router`) para navegar al detalle de la ficha:
  ```typescript
  marker.on('popupopen', () => {
    const btn = document.getElementById(`popup-btn-${k.id}`);
    if (btn) {
      btn.addEventListener('click', () => {
        router.push(`/kiosks/${k.id}`);
      });
    }
  });
  ```

### D. Selector de Vistas en el Listado
En [`src/apps/app/app/kiosks/index.tsx`](../src/apps/app/app/kiosks/index.tsx) se integró un control segmentado superior que maneja el estado `viewMode` (`'list' | 'map'`):
* **Pestaña Lista**: Renderiza la lista clásica de tarjetas (`FlatList`).
* **Pestaña Mapa**: Reemplaza el listado por el componente `<KiosksMap kiosks={kiosks} />`, pasándole la lista de locales cargados por la API.

---

## 3. Pruebas y Validación

* **Tests Unitarios**: El componente fue testeado y se verificó que la integración no rompe ninguna de las pruebas unitarias de la app frontend.
* **Compatibilidad Móvil (Fallbacks)**: Si la app se ejecuta fuera de un entorno Web (por ejemplo, en un emulador nativo sin soporte DOM), el componente muestra un mensaje explicativo e instructivo de forma controlada sin provocar crasheos.
