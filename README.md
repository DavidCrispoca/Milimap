# Milimap

Navegación indoor para la **Universidad Militar Nueva Granada — Sede Calle 100 (Bogotá)**.

El usuario escanea un código QR que está pegado en la pared, la app deduce dónde está,
y le muestra cómo llegar a un salón o zona de interés sobre un mapa 2D cenital.

> **Estado: núcleo de las fases sin mapa cerrado (2026-11-22).** Motor de ruteo
> (Fase 1), panel de administración (Fase 2), escáner QR (Fase 5), horario del
> semestre con deep links (Fase 6) y PWA instalable (Fase 8), con eventos de uso en
> Supabase (ADR-014). La app se publica en GitHub Pages y genera sus propios QR de
> prueba. Las fases de mapa (3, 4 y 7) esperan los planos reales que se digitalizan
> por fuera. Todo lo pendiente está detallado en el registro v1.5 de
> [`plan.md`](plan.md).

Al abrir la app se elige **iniciar sesión** (simulado: cualquier correo y contraseña
sirven) o **continuar como invitado**. Los invitados usan el mapa, el escáner y las
rutas; el horario del semestre solo se activa con sesión iniciada.

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
| `npm run gen:icons`                    | Regenera los íconos PNG del manifest de la PWA          |
| `npm run gen:qr`                       | Genera los QR de prueba en `public/qrs/` (PNG + hoja)   |
| `npm run tunnel`                       | Demo temporal con HTTPS público de Cloudflare           |

---

## Panel de administración

Se abre en `http://localhost:5173/admin` (en GitHub Pages: `<url>/#/admin`). Es una
herramienta de escritorio pensada para pantallas de 1280 px o más.

| Rol               | Qué puede hacer                                                                |
| ----------------- | ------------------------------------------------------------------------------ |
| **Administrador** | Todo, incluido publicar eventos y anuncios.                                    |
| **Editor**        | Redactar eventos y anuncios como borrador, editar espacios, importar horarios. |
| **Consulta**      | Solo ver.                                                                      |

El acceso es simulado por rol y los datos se guardan en el navegador. Ver
[`docs/ADMIN-GUIDE.md`](docs/ADMIN-GUIDE.md) y los ADR-011 y ADR-012 de
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Probar el escáner con QR reales

Los stickers físicos pueden no existir todavía, así que el repo genera sus propios
códigos de prueba a partir del grafo de la Sede Calle 100:

```bash
npm run gen:qr
```

Eso escribe `public/qrs/` con **45 códigos** (entradas, ascensores, escaleras,
biblioteca, aulas, laboratorios y auditorios), una hoja imprimible `index.html`, un
`codigos.csv` y un `README.md`. Abre esa hoja en otra pantalla y apunta la cámara
del celular desde **Escanear QR**; cada código resuelve al mismo punto que un
sticker real.

| Caso                        | Comando                                                           |
| --------------------------- | ----------------------------------------------------------------- |
| Probar con el escáner       | `npm run gen:qr`                                                  |
| Probar con la cámara nativa | `npm run gen:qr -- --base-url=https://usuario.github.io/Milimap/` |

Para probar con la cámara del celular sin esperar al deploy, sirve la app en la red
local y genera los QR apuntando a esa IP:

```bash
npm run dev -- --host
npm run gen:qr -- --base-url=http://192.168.2.18:5173/
```

Cada payload se valida contra `resolveQrNode` antes de escribir el PNG: si un
código no resolvería dentro de la app, el script falla en vez de generar un sticker
inservible. La carpeta se regenera en cada `npm run build` (`prebuild`).

---

## Despliegue en GitHub Pages

El workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) publica
`dist/` en cada push a `main`. La app es un SPA con router de hash, así que no
necesita reglas de rewrite; el build usa `base: './'` y el service worker deriva
todas sus rutas de `self.registration.scope`, por lo que funciona igual en la raíz
del dominio o bajo `/<repo>/`.

Pasos para publicar:

1. Habilitar Pages una sola vez: **Settings → Pages → Build and deployment →
   Source: GitHub Actions**. Es un clic y no se puede automatizar: la API de
   creación de sitios rechaza `GITHUB_TOKEN` (la opción `enablement` de
   `configure-pages` exige un PAT o una GitHub App).
2. Push a `main` (o ejecutar el workflow a mano).
3. La app queda en `https://<usuario>.github.io/Milimap/` y el panel en
   `https://<usuario>.github.io/Milimap/#/admin`.

El workflow calcula la URL base solo
(`https://<usuario>.github.io/<repo>/`) y con ella genera los QR, para que la
cámara nativa del teléfono abra la app directamente. Si algún día el sitio usa un
dominio propio, definir la variable de repositorio `MILIMAP_SITE_URL` con la URL
completa y el workflow la respeta.

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

Hay dos caminos. Elige uno:

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
├── content/       Contenido administrable: eventos, anuncios, horarios, permisos. (Fase 2)
├── backend/       Cliente PostgREST propio: analítica en Supabase, fire-and-forget. (ADR-014)
├── map/           Render con MapLibre: fuentes, capas, cámara. (Fase 4, pendiente)
├── scanner/       Lectura de QR: cámara, entrada manual, confirmación. (Fase 5)
├── schedule/      Parser CSV (Fase 2) y horario del semestre: clase actual, próxima. (Fase 6)
├── admin/         Panel de administración para PC. (Fase 2; editor en Fase 3).
├── ui/            Componentes y pantallas React.
├── styles/        Design tokens.
├── router.ts      Router de hash: deep links y URLs compartibles. (ADR-013)
└── test/          Setup de Vitest.

tools/             Scripts: validate-plans, inspect-geojson, gen-icons, gen-qr, tunnel.
                   Pendiente: import-handdrawn (Fase 3).
docs/              Guías del equipo.
evidencias/        Capturas del sitio en vivo y su índice (ver evidencias/README.md).
```

### La regla que no se rompe

**`src/domain/` no importa React, MapLibre ni Supabase.**

Es lo que permite testear el motor de ruteo en Node puro, en milisegundos, sin DOM.
Si necesitas React dentro de `domain/`, el código está en la capa equivocada.

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

- **[`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)** — cómo commitear, cómo abrir un PR. **Empieza acá.**
- **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** — decisiones de diseño y por qué.
- **[`docs/PLAN-DATA.md`](docs/PLAN-DATA.md)** — cómo convertir un plano dibujado a mano en datos que la app entiende.
- **[`docs/ADMIN-GUIDE.md`](docs/ADMIN-GUIDE.md)** — manual del panel de administración.
- **[`evidencias/README.md`](evidencias/README.md)** — índice de capturas del sitio en vivo (inicio, mapa, rutas, QR, panel, offline).

## Privacidad

Los datos del mapa son públicos e institucionales. La sesión es simulada y vive en
`localStorage`: se guarda el correo o usuario para mostrar tu nombre, nunca la
contraseña. El horario también vive en `localStorage` del propio dispositivo. Nada de
esto se envía a un servidor.
