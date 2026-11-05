# Milimap

Navegación indoor para la **Universidad Militar Nueva Granada — Sede Calle 100 (Bogotá)**.

El usuario escanea un código QR que está pegado en la pared, la app deduce dónde está,
y le muestra cómo llegar a un salón o zona de interés sobre un mapa 2D cenital.

> **Estado: Fase 0 completada.** El repositorio, el tooling y el esqueleto de la app
> funcionan. Las pantallas de mapa, escaneo y horario están reservadas en la navegación
> pero todavía no implementadas. Ver [`plan.md`](plan.md) para el plan completo.

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

| Comando                 | Qué hace                                                |
| ----------------------- | ------------------------------------------------------- |
| `npm run dev`           | Servidor de desarrollo con HMR                          |
| `npm run build`         | Typecheck + build de producción a `dist/`               |
| `npm run preview`       | Sirve el build de producción localmente                 |
| `npm run typecheck`     | `tsc -b --noEmit` sobre app y tools                     |
| `npm run lint`          | oxlint sobre `src/` y `tools/`                          |
| `npm run lint:fix`      | oxlint con autofix                                      |
| `npm run format`        | Prettier sobre todo el repo                             |
| `npm run format:check`  | Verifica formato sin escribir (lo usa el CI)            |
| `npm test`              | Vitest, una pasada                                      |
| `npm run test:watch`    | Vitest en modo watch                                    |
| `npm run test:coverage` | Cobertura (solo `src/domain`, `src/schedule`, `src/qr`) |

## Estructura

```
src/
├── domain/        Lógica pura: tipos, geometría, ruteo. SIN React, SIN MapLibre.
├── data/          JSON versionados: planos, catálogo, eventos, horarios. (Fase 1+)
├── map/           Render con MapLibre: fuentes, capas, cámara. (Fase 4)
├── scanner/       Lectura de QR. (Fase 5)
├── schedule/      Horario del semestre. (Fase 6)
├── admin/         Panel de administración para PC. (Fases 2-3)
├── ui/            Componentes y pantallas React.
├── styles/        Design tokens.
└── test/          Setup de Vitest.

tools/             Scripts de Node: validación, importación, generación de QR.
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
