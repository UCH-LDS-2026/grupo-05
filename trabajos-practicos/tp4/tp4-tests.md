# TP N° 4 — Reporte de Testing y Cobertura 🧪

Este documento contiene los resultados del plan de pruebas (Testing) unitario del backend y frontend de **Spot**, junto con las instrucciones para reproducir los reportes de cobertura y forzar fallos controlados para las capturas de la entrega.

---

## 1. Cobertura de Pruebas del Backend (API)

Las pruebas unitarias del backend cubren los servicios principales (promociones, canjes, visitas, reseñas, autenticación y dueños).

### Comando para correr los tests unitarios:
Desde la terminal en el directorio raíz o en `src/apps/api`, ejecutá:
```bash
pnpm test
```
o también:
```bash
npx jest --config jest.config.js
```

### Comando para generar el reporte de cobertura (Coverage):
```bash
pnpm test:coverage
```
*Esto generará un reporte en consola mostrando el porcentaje de cobertura de líneas, funciones y archivos (Statements, Branches, Functions, Lines), y creará una carpeta `coverage/` con un reporte interactivo en HTML.*

---

## 2. Cobertura de Pruebas del Frontend (App)

Las pruebas del frontend cubren los componentes visuales reutilizables como la selección de estrellas y puntuación.

### Comando para correr los tests de interfaz:
Desde la terminal en `src/apps/app`, ejecutá:
```bash
pnpm test
```

---

## 3. Guía para Forzar un Fallo en los Tests (Paso a Paso)

Para la entrega del TP4 se requiere demostrar un caso donde un test falle. Seguí estos pasos para capturar la pantalla:

1. Abrí el archivo de pruebas de canjes: [`src/apps/api/src/redemptions/redemptions.service.spec.ts`](../../src/apps/api/src/redemptions/redemptions.service.spec.ts).
2. Buscá la línea 138 (aproximadamente), donde se verifica que el código de canje generado tenga exactamente 6 caracteres:
   ```typescript
   expect(res.code).toHaveLength(6);
   ```
3. Modificá esa línea para forzar una aserción falsa (por ejemplo, cambiando `6` por `5`):
   ```typescript
   expect(res.code).toHaveLength(5);
   ```
4. Guardá el archivo y volvé a ejecutar las pruebas del backend en tu terminal:
   ```bash
   pnpm test
   ```
5. El test `"genera un código de 6 caracteres y un canje nuevo cuando no hay activo"` fallará inmediatamente en rojo, mostrando la diferencia entre lo esperado (`5`) y lo recibido (`6`).
6. **Tomá una captura de pantalla** de la consola mostrando el fallo en rojo y guardá la imagen en esta carpeta con el nombre `test-fallido.png`.
7. Revertí el cambio en el archivo de prueba (cambiando de nuevo el `5` a `6`) y guardá para que las pruebas vuelvan a quedar en verde.
