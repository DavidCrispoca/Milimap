# Milimap

Navegación indoor para la **Universidad Militar Nueva Granada — Sede Calle 100 (Bogotá)**.

El usuario escanea un código QR que está pegado en la pared, la app deduce dónde está,
y le muestra cómo llegar a un salón o zona de interés sobre un mapa 2D cenital.

> **Estado: Fase 2 completada.** Motor de ruteo (Fase 1) y panel de administración en
> `/admin` con eventos, anuncios, espacios, horarios por CSV y analítica básica. Los
> eventos publicados aparecen en el inicio y "Cómo llegar" abre la ruta. Ver
> [`plan.md`](plan.md).

|                 |                                                                               |
| --------------- | ----------------------------------------------------------------------------- |
| **Alcance**     | Solo Sede Calle 100. Carrera 11 # 101-80, Bogotá D.C.                         |
| **Coordenadas** | `4.683094, -74.041943`                                                        |
| **Tipo**        | MVP académico — demuestra funcionalidad, no producción a escala               |
| **Unidades**    | Metros, con origen local por edificio (nunca lat/lng en la geometría interna) |

---

## Requisitos

- **Node.js 22+** (probado en 24)
- **npm 10+** (probado en 12)

## Empezar

```bash
git clone https://github.com/DavidCrispoca/Milimap.git
cd Milimap
npm install          # también instala los hooks de git (script "prepare")
npm run dev          # http://localhost:5173
```

`server.host` está en `true`, así que la URL de red local que imprime Vite sirve para
probar en un teléfono real dentro de la misma red. **Probar en un teléfono es
obligatorio**: el producto es móvil y el emulador miente sobre el tamaño del pulgar.

## Scripts

| Comando                                | Qué hace                                                |
| -------------------------------------- | ------------------------------------------------------- |
| `npm run dev`                          | Servidor de desarrollo con HMR                          |
| `npm run build`                        | Typecheck + build de producción a `dist/`               |
| `npm run preview`                      | Sirve el build de producción localmente                 |
| `npm run typecheck`                    | `tsc -b --noEmit` sobre app y tools                     |
| `npm run lint`                         | oxlint sobre `src/` y `tools/`                          |
| `npm run lint:fix`                     | oxlint con autofix                                      |
| `npm run format`                       | Prettier sobre todo el repo                             |
| `npm run format:check`                 | Verifica formato sin escribir (lo usa el CI)            |
| `npm test`                             | Vitest, una pasada                                      |
| `npm run test:watch`                   | Vitest en modo watch                                    |
| `npm run test:coverage`                | Cobertura (solo `src/domain`, `src/schedule`, `src/qr`) |
| `npm run validate:plans`               | Valida que el grafo del campus sea coherente            |
| `npm run inspect:geojson -- <archivo>` | Revisa un GeoJSON antes de entregarlo                   |

---

## Panel de administración

Se abre en `http://localhost:5173/admin`. Es una herramienta de escritorio pensada
para pantallas de 1280 px o más.

| Rol               | Qué puede hacer                                                                |
| ----------------- | ------------------------------------------------------------------------------ |
| **Administrador** | Todo, incluido publicar eventos y anuncios.                                    |
| **Editor**        | Redactar eventos y anuncios como borrador, editar espacios, importar horarios. |
| **Consulta**      | Solo ver.                                                                      |

El acceso es simulado por rol y los datos se guardan en el navegador. Ver
[`docs/ADMIN-GUIDE.md`](docs/ADMIN-GUIDE.md) y los ADR-011 y ADR-012 de
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Digitalizar un plano dibujado a mano

Esta es la ruta completa, desde una hoja dibujada hasta datos que la app entiende.
Está pensada para que la pueda seguir alguien que **no programa**.

> **Regla de oro:** digitalizar no es dibujar el plano otra vez, es extraer **dónde
> están los espacios y cómo se conectan**. Muebles, texturas y anotaciones no sirven.

### Paso 1 — Escanear (sin computadora)

1. Escanear el plano a **300 DPI mínimo**, en PNG o TIFF (no JPG: mete artefactos).
2. Si es una foto, corregir la perspectiva hasta que los muros queden paralelos a los
   bordes de la imagen.
3. **Medir una distancia real en el edificio** con cinta métrica: un pasillo, o el
   ancho de una puerta (~0.90 m). Anotarla. Sin este dato, todas las distancias que
   muestra la app son mentiras.
4. Armar el inventario de espacios en una hoja de cálculo: código, nombre, tipo,
   capacidad, piso.

### Paso 2 — Convertir a GeoJSON

Hay dos caminos. Elegí uno:

| Herramienta                   | Cuándo                                                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **QGIS** (gratis, escritorio) | Recomendado. Tiene _snapping_, que evita el error más común: polígonos que casi se tocan y dejan un aula inalcanzable. |
| **geojson.io** (navegador)    | Más rápido de aprender, sin instalar nada.                                                                             |

Se dibujan **tres capas**:

| Capa         | Geometría | Qué es                                    |
| ------------ | --------- | ----------------------------------------- |
| `espacios`   | Polygon   | Aulas, laboratorios, oficinas, baños      |
| `pasillos`   | Polygon   | El área por donde se camina (no el muro)  |
| `verticales` | Point     | Escaleras y ascensores, con un **código** |

El código de escalera (`ESC-A`, `ASC-A`) es lo que une un piso con el siguiente:
**el mismo código en todos los pisos**. Si dos personas digitalizan pisos distintos y
usan códigos diferentes para la misma escalera, los pisos no se conectan.

### Paso 3 — Dejar los archivos en el repositorio

```
src/data/inbox/<edificio>/p1.geojson
src/data/inbox/<edificio>/p2.geojson
```

Un archivo por piso.

### Paso 4 — Revisar antes de entregar

```bash
npm run inspect:geojson -- src/data/inbox/edificio-a/p1.geojson
```

El inspector dice cuántos espacios encontró, el área de cada uno, si falta `id`, `name`
o `code`, y si la escala parece correcta. Si reporta errores, hay que corregir el
archivo. Hay un ejemplo válido para copiar en
[`src/data/inbox/ejemplo/`](src/data/inbox/ejemplo/edificio-ejemplo-p1.geojson).

### Paso 5 — Importar (Fase 3)

El comando `npm run import:plans` convierte el GeoJSON al formato interno, **genera el
grafo automáticamente** y valida el resultado. Todavía no está implementado: llega con
el editor de mapas. Mientras tanto, la carpeta `inbox/` funciona como buzón de entrega.

### Paso 6 — Verificar en el campus

Recorrer 8–10 rutas con cronómetro y comparar con lo que calcula la app.
Tolerancia objetivo: **±15 % en distancia**. Los números que no cierran son datos mal
digitalizados, no un problema del motor.

La guía completa, con el detalle de QGIS y los errores típicos, está en
[`docs/PLAN-DATA.md`](docs/PLAN-DATA.md).

---

## Estructura

```
src/
├── domain/        Lógica pura: tipos, geometría, ruteo, búsqueda, QR, validación.
│                  SIN React, SIN MapLibre.
├── data/          Datos del campus y catálogo.
│   ├── demo.ts    Edificio de prueba con medidas genéricas (40 × 24 m).
│   ├── index.ts   Punto único de acceso a los datos.
│   └── inbox/     Buzón donde el equipo deja los GeoJSON digitalizados.
├── map/           Render con MapLibre: fuentes, capas, cámara. (Fase 4)
├── scanner/       Lectura de QR. (Fase 5)
├── schedule/      Horario del semestre. (Fase 6)
├── admin/         Panel de administración para PC. (Fases 2-3)
├── ui/            Componentes y pantallas React.
├── styles/        Design tokens.
└── test/          Setup de Vitest.

tools/             Scripts de Node: validate-plans, inspect-geojson, import-handdrawn, gen-qr.
docs/              Guías del equipo.
```

### La regla que no se rompe

**`src/domain/` no importa React, MapLibre ni Supabase.**

Es lo que permite testear el motor de ruteo en Node puro, en milisegundos, sin DOM.
Si necesitás React dentro de `domain/`, el código está en la capa equivocada.

## Stack

| Pieza      | Elección                 | Por qué                                                                |
| ---------- | ------------------------ | ---------------------------------------------------------------------- |
| Build      | Vite 8                   | HMR instantáneo, build pequeño                                         |
| UI         | React 19 + TypeScript 7  | Estándar del equipo                                                    |
| Mapa       | MapLibre GL JS 6         | WebGL, sin token ni licencia (a diferencia de Mapbox)                  |
| QR         | html5-qrcode             | `BarcodeDetector` no existe en iOS Safari; esta lib trae respaldo WASM |
| Estado     | Zustand                  | Sin boilerplate para un estado pequeño                                 |
| Validación | Zod                      | Esquemas runtime para JSON de planos y payloads QR                     |
| Tests      | Vitest + Testing Library | Comparte config con Vite                                               |
| Lint       | oxlint                   | Rápido; el default actual de `create-vite`                             |
| Formato    | Prettier                 | Sin discusión de estilo                                                |
| Commits    | commitlint + husky       | Bloquea mensajes fuera de convención                                   |

## Equipo

- **[`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)** — cómo commitear, cómo abrir un PR. **Empezá acá.**
- **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** — decisiones de diseño y por qué.
- **[`docs/PLAN-DATA.md`](docs/PLAN-DATA.md)** — cómo convertir un plano dibujado a mano en datos que la app entiende.
- **[`docs/ADMIN-GUIDE.md`](docs/ADMIN-GUIDE.md)** — manual del panel de administración.

## Privacidad

Los datos del mapa son públicos e institucionales. **No se guardan datos personales
de estudiantes**: el horario vive en `localStorage` del propio dispositivo y no se
envía a ningún servidor.
