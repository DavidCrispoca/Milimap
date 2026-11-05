# Milimap — Plan de Proyecto

**Aplicación web móvil de navegación indoor para la Universidad Militar Nueva Granada, Sede Calle 100 (Bogotá)**

| Campo          | Valor                                                                                  |
| -------------- | -------------------------------------------------------------------------------------- |
| Repositorio    | https://github.com/DavidCrispoca/Milimap.git                                           |
| Rama principal | `main`                                                                                 |
| Alcance        | **Exclusivamente Sede Calle 100, Bogotá**                                              |
| Ubicación      | Carrera 11 # 101-80, Bogotá D.C.                                                       |
| Coordenadas    | `4.683094, -74.041943`                                                                 |
| Documento      | Este `plan.md` es la fuente de verdad. **Se actualiza con cada cambio significativo.** |

---

## 0. Reglas de operación del repositorio

Estas reglas aplican a **todo** el desarrollo. No son sugerencias.

### 0.1 Convenciones de commit (Conventional Commits)

Formato obligatorio: `tipo(scope): descripción`

**Tipos permitidos:**

| Tipo       | Cuándo                                             | Versionado |
| ---------- | -------------------------------------------------- | ---------- |
| `feat`     | Funcionalidad nueva                                | MINOR      |
| `fix`      | Corrección de bug                                  | PATCH      |
| `refactor` | Cambio de comportamiento sin alterar funcionalidad | —          |
| `perf`     | Mejora de rendimiento                              | PATCH      |
| `docs`     | Documentación (incluye este `plan.md`)             | —          |
| `test`     | Tests                                              | —          |
| `build`    | Build, dependencias, bundler                       | —          |
| `ci`       | GitHub Actions, pipelines                          | —          |
| `chore`    | Tareas internas sin impacto (deps, gitignore)      | —          |
| `style`    | Formateo, whitespace, lint (sin cambio de lógica)  | —          |

**Scopes:**

| Scope      | Área                                         |
| ---------- | -------------------------------------------- |
| `domain`   | Motor de ruteo, grafo, tipos (`src/domain/`) |
| `map`      | Render MapLibre, capas, cámara (`src/map/`)  |
| `scanner`  | Lectura de QR (`src/scanner/`)               |
| `admin`    | Panel de administración (`src/admin/`)       |
| `ui`       | Componentes de interfaz                      |
| `data`     | JSON de planos, catálogo de espacios         |
| `schedule` | Horario del semestre (`src/schedule/`)       |
| `events`   | Anuncios y eventos (`src/events/`)           |
| `tools`    | Scripts de Node (`tools/`)                   |
| `qa`       | Tooling de QA                                |
| `deps`     | Dependencias                                 |
| `docs`     | Documentación                                |

**Reglas obligatorias del mensaje:**

- Idioma: **inglés** (salvo `docs`, donde se acepta español).
- Tiempo verbal: imperativo presente — `feat(map): add floor level selector`, no `added` ni `adding`.
- Máximo ~72 caracteres en la línea de asunto.
- Sin punto final.
- Un commit = un cambio lógico. Si el mensaje necesita "y", son dos commits.

**Ejemplos válidos:**

```
feat(domain): implement multi-level dijkstra router
fix(scanner): handle missing camera permission on iOS
docs(plan): document floor digitization workflow for hand-drawn plans
feat(admin): add QR batch generator with CSV export
chore(deps): bump maplibre-gl to 6.16.0
```

**Ejemplos inválidos:**

```
Actualización del mapa          ← sin tipo, sin scope, en español
feat: cosas                    ← vago
FIX(map): add selector         ← tipo en mayúsculas
feat(map): added the selector. ← pasado + punto final
```

### 0.2 Ramas y Pull Requests

- `main` → siempre desplegable. Nunca se commitea directo a `main` salvo `docs`/`chore` triviales.
- Ramas por feature: `feat/…`, `fix/…`, `refactor/…`, `chore/…`, `docs/…`
- Ejemplo: `feat/admin-qr-generator`
- PR hacia `main`, con descripción en formato:
  ```markdown
  ## Qué cambia

  ## Por qué

  ## Cómo se verifica

  ## Capturas (si aplica)

  ## Checklist

  - [ ] Tests pasan
  - [ ] `npm run lint` limpio
  - [ ] `npm run typecheck` limpio
  - [ ] `plan.md` actualizado
  - [ ] Sin secretos ni datos personales en el diff
  ```
- **Squash-merge** en `main` → historial lineal y limpio.
- Un PR = una unidad revisable. Si pasa de ~400 líneas, dividir (ver §0.7).

### 0.3 Commits atómicos y "work unit commits"

Cada commit debe dejar el repo en estado funcional. Regla práctica:

- Un `feat` + sus tests van en el **mismo** commit.
- Un `fix` + su test de regresión van en el **mismo** commit.
- Refactors sin cambio funcional van **antes** del feature, en commit propio.

### 0.4 Versionado y releases

- SemVer (`MAJOR.MINOR.PATCH`).
- **Release Please** (action de Google, open source) calcula la versión desde los commits y genera `CHANGELOG.md` + tag + GitHub Release.
- `CHANGELOG.md` en la raíz del repo (Release Please lo requiere).
- Ramo de release: PR automático de Release Please → se revisa → se mergea.

### 0.5 Hooks y linting local (pre-commit)

Con `husky` + `lint-staged`:

| Archivo         | Hook       | Comando                             |
| --------------- | ---------- | ----------------------------------- |
| `*.ts`, `*.tsx` | pre-commit | `eslint --fix` + `prettier --write` |
| `*.ts`, `*.tsx` | pre-commit | `tsc --noEmit` (typecheck)          |
| `*.test.ts`     | pre-commit | `vitest run --related`              |
| `*`             | commit-msg | `commitlint --edit`                 |
| `*`             | pre-push   | `vitest run` + `npm run build`      |

**Ningún commit puede pasar el hook si falla.** Para saltos de emergencia: `git commit --no-verify` — pero es una excepción que debe documentarse en el PR.

### 0.6 CI/CD (GitHub Actions)

Workflows en `.github/workflows/`:

| Workflow              | Trigger                   | Qué hace                                                 |
| --------------------- | ------------------------- | -------------------------------------------------------- |
| `ci.yml`              | push + PR                 | lint, typecheck, test, build, valida JSON de planos      |
| `release-please.yml`  | push a `main`             | crea PR de release, actualiza changelog                  |
| `deploy.yml`          | tag `v*`                  | build + deploy a Vercel/Netlify                          |
| `data-validation.yml` | PR que toca `src/data/**` | corre `validate-plans.ts` y falla si la grafo queda rota |

**Branch protection en `main`:** requerir CI verde + 1 aprobación antes de merge.

### 0.7 Commits de trabajo divididos (chained PRs)

Cuando un cambio exceda ~400 líneas o tenga dependencias entre sí:

1. PR 1: cimientos (tipos + estructura)
2. PR 2: lógica de dominio (puro, testeable)
3. PR 3: capa de render
4. PR 4: integración + tests e2e

Cada PR referencia al anterior: `Depends on #12`.

### 0.8 Actualización de `plan.md`

**Regla:** `plan.md` se actualiza en el **mismo PR** que el cambio que documenta. Si el PR toca código que altera el plan, `plan.md` debe cambiar en ese PR o el CI falla.

Al final de cada fase se agrega una entrada al **Registro de Cambios** (§11).

### 0.9 `.gitignore` y archivos sensibles

Nunca commitear: `.env`, `.env.local`, credenciales de Supabase, service-role keys, `node_modules/`, `dist/`, `.DS_Store`, `*.local`.

Si algún secreto seCommitea por error: **revertir y rotar la credencial**. Un `git rm` no borra el historial.

### 0.10 Estructura del repositorio

```
Milimap/
├── .github/
│   ├── workflows/            # CI, release-please, deploy, data-validation
│   ├── ISSUE_TEMPLATE/       # templates de issues
│   └── PULL_REQUEST_TEMPLATE.md
├── .husky/                   # hooks
├── docs/
│   ├── PLAN-DATA.md          # Cómo documentar un piso nuevo
│   ├── ADMIN-GUIDE.md        # Manual del panel de administración
│   ├── CONTRIBUTING.md       # Reglas de commit y PR
│   └── ARCHITECTURE.md       # Decisiones y ADR
├── public/
│   ├── qrs/                  # QRs generados (PNG/SVG)
│   └── icons/
├── src/
│   ├── admin/                # Panel de administración (PC)
│   ├── data/                 # JSON versionados: planos, espacios, horarios
│   ├── domain/               # Lógica pura (sin React, sin MapLibre)
│   ├── events/               # Anuncios y eventos especiales
│   ├── map/                  # MapLibre: capas, fuentes, cámara
│   ├── scanner/              # Lectura de QR
│   ├── schedule/             # Horario del semestre
│   ├── ui/                   # Componentes React
│   └── App.tsx
├── tools/
│   ├── gen-qr.ts             # Genera QRs desde el catálogo
│   ├── validate-plans.ts     # Valida coherencia de la grafo
│   ├── import-handdrawn.ts   # Convierte planos a mano → GeoJSON
│   └── export-catalog.ts     # Exporta catálogo de espacios
├── plan.md                   # Este documento
├── CHANGELOG.md
├── README.md
├── package.json
└── tsconfig.json
```

### 0.11 Stack tecnológico

| Capa                 | Elección                       | Justificación                                                         |
| -------------------- | ------------------------------ | --------------------------------------------------------------------- |
| Frontend             | React 19 + TypeScript + Vite 7 | Estándar, HMR, build móvil optimizado                                 |
| Mapa                 | **MapLibre GL JS v6**          | WebGL, sin token ni licencia, render GPU                              |
| QR                   | **html5-qrcode**               | Fallback WASM (ZXing) donde no existe `BarcodeDetector`               |
| Dibujo/Edición admin | **MapLibre Geoman**            | Plugin de edición de geometría para MapLibre (crear/editar polígonos) |
| Routing              | **Dijkstra/A\* propio** en TS  | Grafo indoor por piso; un motor externo es overkill                   |
| Estado               | Zustand                        | Simple, sin boilerplate, funciona bien con selector de piso           |
| Validación           | Zod                            | Esquemas runtime para JSON de planos y payloads QR                    |
| Tests                | Vitest + Testing Library       | Rápido, compatible con Vite                                           |
| Estilos              | CSS con custom properties      | Tokens de branding separados del dominio                              |
| Auth admin           | Supabase Auth + RLS            | Roles, sin backend propio                                             |
| Persistencia admin   | Supabase Postgres              | Datos mutables (anuncios, horarios)                                   |
| Deploy               | Vercel                         | Preview por PR, CDN global                                            |
| Versiones            | Release Please                 | Automático desde commits                                              |
| Lint                 | ESLint + Prettier + commitlint | Estándar                                                              |
| Hooks                | Husky + lint-staged            | Guardas locales                                                       |

**Por qué no React Native:** el requisito es web app móvil. RN pierde instalación por QR, deep-link por destino y búsqueda. Una PWA instalable cubre el 95% del caso con una fracción del esfuerzo.

**Por qué no Mapbox:** requiere token y licencia. MapLibre es el fork open source, con las mismas capacidades.

**Por qué no GraphHopper/OpenIndoorMaps:** GraphHopper rutea calles OSM, no grafos indoor por piso. OpenIndoorMaps está en Pre-Alpha.

---

## 1. Restricciones y hallazgos verificados

Estos datos fueron comprobados contra fuentes reales durante la planificación (2026-11-05). **No re-verificar; son la base del diseño.**

### 1.1 Hallazgo crítico: no existe data indoor en OSM

Consulta directa a `api.openstreetmap.org/api/0.6/map.json` sobre el bounding box del campus (`4.683094, -74.041943` ± 0.0035/0.0025):

| Métrica                          | Resultado                                     |
| -------------------------------- | --------------------------------------------- |
| Elementos OSM totales en el bbox | 2 407                                         |
| Vías con `building=university`   | **10** (la huella del campus sí está mapeada) |
| Elementos con tag `level`        | **0**                                         |
| Elementos con `building:part`    | **0**                                         |
| Espacios con `indoor=room`       | **0**                                         |

**Conclusión:** los edificios de la UMNG están mapeados en OSM a nivel de huella, pero **no existe información de pisos, interiores ni rutas**. Este proyecto **no puede apoyarse en datos de terceros**: hay que digitalizar los planos desde cero.

Los edificios vecinos sí traen `building:levels` (Citibank 10 pisos, World Trade Center 12, Embassy of Chile), lo que confirma que la zona está bien mapeada — solo falta el interior de la UMNG.

### 1.2 Alternativas evaluadas y descartadas

| Opción                | Veredicto              | Motivo                                                                                                                                                                                       |
| --------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenIndoorMaps        | ❌ Descartada          | Pre-Alpha. No es dependencia viable.                                                                                                                                                         |
| Mappedin JS           | ❌ Descartada          | Comercial, requiere licencia de pago.                                                                                                                                                        |
| GraphHopper           | ❌ Descartada          | Diseñado para red vial OSM, no grafos indoor multi-piso. Overkill architekturale.                                                                                                            |
| `BarcodeDetector` API | ⚠️ Solo complementaria | **No existe en iOS Safari ni Firefox.** Solo Chrome/Android. Debe ser el camino rápido, no el único.                                                                                         |
| Mapbox GL JS          | ❌ Descartada          | Requiere token y licencia de pago.                                                                                                                                                           |
| Leaflet               | ⚠️ Descartada          | Render raster/canvas, sin las capacidades 3D/pitch y de GPU que da MapLibre. Para un mapa 2D top-down indoor, MapLibre da más control de capas y mejor rendimiento en móviles de gama media. |
| Turf.js               | ⚠️ Parcial             | Útil para geometría (`pointToLineDistance`, `lineIntersect`). Se usará donde aporte, no como dependencia central.                                                                            |

### 1.3 Constantes verificadas

- **Coordenadas sede:** `4.6830940, -74.0419430` (Nominatim, OSM `place=university`)
- **Dirección:** Carrera 11 # 101-80, Bogotá D.C.
- **Superficie aprox. sede Calle 100** (según UMNG): 5 520 m² aulas/auditorios, 2 213 m² laboratorios/talleres, 1 912 m² zonas de bienestar, 330 m² biblioteca/hemeroteca.
- **Aulas en sede Calle 100** (Anuario Estadístico 2015): ~96 aulas de clase y especiales, 2 auditorios, 1 Aula Máxima.
- **Overpass API no es accesible** desde el entorno de desarrollo → usar `api.openstreetmap.org/api/0.6/map.json` para extracción OSM.
- **MapLibre GL JS v6** confirmado vía documentación oficial (`/maplibre/maplibre-gl-js`). Soporta: fuentes GeoJSON, `setData`, capas `fill`/`line`, `NavigationControl` con `visualizePitch`/`visualizeRoll`, `pitch`/`bearing` en el constructor del `Map`, `fitBounds`.
- **MapLibre Geoman** confirmado como plugin de edición de geometría compatible con MapLibre.

### 1.4 El punto crítico del proyecto

El usuario tiene **planos dibujados a mano**. Toda la arquitectura de datos está diseñada para que ese material se pueda convertir de forma sistemática. Ver §7 (Procedimiento de digitalización) — es la sección más importante del plan.

---

## 2. Arquitectura conceptual

### 2.1 Flujo del usuario

```
HOME (PWA, móvil)
  ├── Banner de eventos especiales (próximos, con fecha y lugar)
  ├── "Mi horario" → clase actual / próxima + botón "Cómo llegar"
  ├── Buscar destino (sugerencias por nombre)
  └── Escanear QR ──────────────┐
                                │
                          ┌─────▼──────────────────┐
                          │ Vista del mapa 2D top  │
                          │  - selector de piso    │
                          │  - ruta resaltada      │
                          │  - instrucciones       │
                          └─────┬──────────────────┘
                                │
                          ┌─────▼──────────────────┐
                          │ Panel admin (PC)       │
                          │  - editar mapa/pisos   │
                          │  - generar QRs         │
                          │  - CRUD espacios       │
                          │  - CRUD eventos        │
                          │  - ver analítica      │
                          └────────────────────────┘
```

### 2.2 Principio de coordenadas locales en metros

**Todas las geometrías internas se expresan en metros, con origen local por piso.** Nunca en grados.

_Por qué:_ un piso de la UMNG mide ~50 × 30 m. En grados, dos puntos a 2 m de distancia difieren en ~1.8e-5°. En un buffer de vértices GPU de 32 bits, esa diferencia se pierde — el mapa "se pega" o aparecen artefactos de z-fighting. Con metros locales:

- Precisión de float32 sobrada (0.001 m de resolución).
- Las distancias de caminata se calculan directamente (`dist = √(dx²+dy²)`).
- Los JSON son legibles y diffeable en Git.
- El diff de un cambio de plano se lee como un cambio de plano, no como ruido numérico.

Conversión a WGS84 (lat/lng) solo en el punto de salida hacia MapLibre, mediante un `origin` por edificio:

```ts
// src/domain/geo.ts
export interface FloorOrigin {
  /** Punto en WGS84 que corresponde a (0,0) local, en metros */
  lat: number
  lng: number
  /** Rotación del eje Y local respecto al norte verdadero, en radianes */
  rotation: number
}
```

### 2.3 Capas de arquitectura

| Capa            | Responsabilidad                          | Puede testearse sin |
| --------------- | ---------------------------------------- | ------------------- |
| `src/domain/`   | Grafo, ruteo, geometría, tipos, búsqueda | Node.js puro        |
| `src/data/`     | Carga y validación (Zod) de JSON         | Node.js puro        |
| `src/map/`      | Render MapLibre, fuentes, capas, cámara  | Navegador           |
| `src/ui/`       | Componentes React                        | jsdom               |
| `src/admin/`    | Panel de administración                  | jsdom               |
| `src/scanner/`  | Lectura QR                               | navegador + cámara  |
| `src/schedule/` | Horario del semestre                     | Node.js puro        |
| `src/events/`   | Anuncios y eventos                       | Node.js puro        |

**La regla dura:** `src/domain/` **no importa nada** de React, MapLibre ni Supabase. Es lógica pura. Esto permite:

- Tests unitarios rápidos y deterministas.
- Reutilización futura en app nativa sin reescribir el ruteo.
- Revisión de código enfocada.

---

## 3. Modelo de datos

### 3.1 Edificio

```jsonc
// src/data/buildings/building-a.json
{
  "id": "edificio-a",
  "name": "Edificio A",
  "aliases": ["Edificio A", "Edificio Central"],
  "campus": "calle-100",
  "origin": { "lat": 4.6830940, "lng": -74.0419430, "rotation": 0 },
  "levels": ["b1", "p1", "p2", "p3"],
  "geo": {
    "type": "Feature",
    "geometry": { "type": "Polygon", "coordinates": [[[lon, lat], ...]] },
    "properties": { "kind": "building" }
  }
}
```

### 3.2 Piso (el objeto central)

```jsonc
// src/data/floors/edificio-a/p1.json
{
  "id": "edificio-a-p1",
  "buildingId": "edificio-a",
  "level": 1,
  "levelLabel": "Piso 1",
  "levelShort": "P1",
  "order": 1,                    // para ordenar el selector
  "bounds": [0, 0, 52.4, 31.8],  // [minX, minY, maxX, maxY] en metros
  "geo": { "type": "Polygon", "coordinates": [[[lon, lat], ...]] },

  "spaces": [
    {
      "id": "a-101",
      "name": "Aula 101",
      "aliases": ["Aula 101", "A101", "Aula de Sistemas"],
      "kind": "classroom",         // classroom|laboratory|office|bathroom|common|auditorium|gym|kitchen|service
      "level": 1,
      "capacity": 40,
      "anchorNodeId": "n-a-101",   // nodo del grafo al que llega el usuario
      "polygon": [[12.4, 3.1], [22.8, 3.1], [22.8, 11.5], [12.4, 11.5]]
    }
  ],

  "walkways": [
    { "id": "w-p1-norte", "polygon": [[0, 14], [52.4, 14], [52.4, 19], [0, 19]] }
  ],

  "nodes": [
    { "id": "n-a-101", "x": 17.6, "y": 12.4, "kind": "door" },
    { "id": "n-p1-hall-1", "x": 6.0, "y": 16.5, "kind": "hallway" }
  ],

  "edges": [
    { "from": "n-a-101", "to": "n-p1-hall-1", "kind": "walkway",
      "accessible": true, "distance": 12.4 }
  ],

  "transitions": [
    { "id": "t-stair-a-p1-p2", "type": "stairs",
      "fromNodeId": "n-p1-stair", "toNodeId": "n-p2-stair",
      "fromLevel": 1, "toLevel": 2, "accessible": false },
    { "id": "t-lift-a-p1-p2", "type": "elevator",
      "fromNodeId": "n-p1-lift", "toNodeId": "n-p2-lift",
      "fromLevel": 1, "toLevel": 2, "accessible": true }
  ]
}
```

**Tipos de borde (`kind`):** `walkway` | `stair` | `elevator` | `door` | `ramp`
**Tipos de nodo (`kind`):** `door` | `hallway` | `junction` | `stair` | `elevator` | `anchor` | `entrance`

### 3.3 Catálogo de destinos

```jsonc
// src/data/space-catalog.json
{
  "spaces": [
    {
      "id": "a-101",
      "name": "Aula 101",
      "aliases": ["Aula 101", "A101"],
      "buildingId": "edificio-a",
      "level": 1,
      "kind": "classroom",
      "keywords": ["sistemas", "informatica"],
      "active": true,
    },
  ],
}
```

El catálogo es **desacoplado de los pisos**: un destino puede tener ubicación física (`floorId`) y seguir visible en búsqueda aunque el JSON de piso aún no exista. Durante la fase de digitalización, esto permite publicar el catálogo progresivamente.

### 3.4 Payload de QR

Formato corto, versionado, autocontenido:

```
MILIMAP:v1:EDIFICIO-A:P1:N12
```

| Parte        | Significado                                    |
| ------------ | ---------------------------------------------- |
| `MILIMAP`    | Magic string: permite detectar QR ajenos       |
| `v1`         | Versión del formato (para migraciones futuras) |
| `EDIFICIO-A` | `buildingId`                                   |
| `P1`         | Identificador de piso                          |
| `N12`        | `nodeId` del grafo                             |

El QR apunta a un **nodo de anclaje**, no a una coordenada cruda. Si el nodo se mueve, se actualiza el JSON y **todos los QRs impresos siguen funcionando**. Es la decisión de diseño que evita reimprimir 200 etiquetas cada vez que se corrige un metro.

**Puntos QR especiales:**

```
MILIMAP:v1:EXTERNO:ENTRADA-PRINCIPAL      → punto exterior,nodepoint
MILIMAP:v1:EXTERNO:PARADERO-AUTOBUSES
MILIMAP:v1:EXTERNO:ACCESO-INTERNO
```

### 3.5 Eventos y anuncios

```jsonc
// src/data/events/events.json
{
  "events": [
    {
      "id": "ev-2026-ceremonia-graduacion",
      "title": "Ceremonia de Graduación 2026-II",
      "description": "Ceremonia de graduación de los programas de pregrado...",
      "startsAt": "2026-12-11T08:00:00-05:00",
      "endsAt": "2026-12-11T13:00:00-05:00",
      "location": {
        "type": "space", // space | building | external | campus
        "ref": "aula-maxima",
        "buildingId": "edificio-a",
        "floorId": "edificio-a-p1",
      },
      "category": "ceremony", // ceremony|academic|sports|cultural|administrative|emergency
      "priority": "high", // low|normal|high
      "imageUrl": "/events/graduacion-2026-2.jpg",
      "published": true,
      "startsInDays": 45,
    },
  ],
}
```

### 3.6 Horario del semestre

```jsonc
// src/data/schedules/facultad-ciencias-economicas-2026-2.json
{
  "id": "2026-2",
  "campus": "calle-100",
  "term": "2026-2",
  "startsOn": "2026-08-03",
  "endsOn": "2026-12-12",
  "classes": [
    {
      "id": "c-101",
      "spaceId": "a-101",
      "subject": "Estadística I",
      "code": "ECON-201",
      "teacher": "Dr. Juan Pérez",
      "weekday": 1, // 0=domingo ... 6=sábado
      "startsAt": "08:00",
      "endsAt": "09:50",
      "weeks": [1, 2, 3, 4, 5, 6, 7, 8],
      "group": "A",
    },
  ],
}
```

**Los horarios son públicos y versionados en el repo** (son información institucional). El estudiante solo **selecciona** los courses de su programa — no los crea. Esto evita inconsistencia y permite que la app funcione sin backend para la parte más valiosa.

### 3.7 Horario personal del estudiante (localStorage)

```ts
// src/schedule/types.ts
interface StudentSchedule {
  studentId?: string // opcional, para futuro sync
  termId: string // "2026-2"
  classIds: string[] // ids de "classes" en el catálogo público
  pinnedDestinationId?: string
  updatedAt: string // ISO
}
```

Se guarda en `localStorage` con clave `milimap.schedule.v1`. Incluye migración de versión y export/import a JSON (para pasar de un celular a otro).

### 3.8 Analítica (panel admin)

```jsonc
// src/data/analytics/2026-11.json
{
  "month": "2026-11",
  "qrScans": 12480,
  "uniqueDestinations": 86,
  "topDestinations": [{ "spaceId": "a-101", "scans": 1420 }],
  "topOrigins": [{ "nodeId": "n-p1-hall-1", "scans": 890 }],
  "avgStepsToArrive": 7.3,
  "failedRoutes": 42,
}
```

---

## 4. Motor de ruteo (`src/domain/`)

### 4.1 Algoritmo

**Dijkstra con pesos**, no A\*, por una razón concreta: en un campus el número de nodos es pequeño (~100 por piso, ~500 total) y la heurística de A\* no aporta beneficio apreciable. Dijkstra es más simple de verificar y de testear.

**El grafo es multi-nivel.** Los niveles se conectan mediante `transitions` (escaleras, ascensores). El algoritmo opera sobre el grafo plano: cada transición se materializa como aristas bidireccionales entre el nodo del piso origen y el nodo del piso destino, con penalización por tipo.

**Penalizaciones** (para que la ruta sea la que un humano tomaría):

| Tipo de arista | Peso base              | Notas              |
| -------------- | ---------------------- | ------------------ |
| `walkway`      | distancia real         | —                  |
| `door`         | distancia real         | —                  |
| `stair`        | distancia x 1.4        | penaliza escaleras |
| `elevator`     | distancia × 1.2 + 15 s | espera media       |
| `ramp`         | distancia real         | —                  |

La penalización por escaleras y ascensor existe por una razón de UX: el algoritmo debe _preferir_ el ascensor cuando hay uno disponible, salvo que el usuario pida ruta sin escaleras. Al multiplicar por >1, el ascensor gana siempre que exista y sea más corto en longitud.

### 4.2 Contratos

```ts
// src/domain/types.ts
export interface RouteRequest {
  originNodeId: string
  destinationNodeId: string
  avoidStairs?: boolean
  avoidElevators?: boolean
}

export interface RouteStep {
  index: number
  instruction: string // "Gire a la derecha y avance 20 m"
  instructionEn: string
  distanceMeters: number
  points: LocalPoint[] // para dibujar el segmento
  level: number
  levelLabel: string
  kind: 'start' | 'walk' | 'turn' | 'stairs' | 'elevator' | 'destination'
  transitionId?: string
}

export interface Route {
  steps: RouteStep[]
  nodeIds: string[]
  totalMeters: number
  estimatedSeconds: number
  levelsVisited: number[]
  hasStairs: boolean
  hasElevators: boolean
}
```

### 4.3 Generador de instrucciones (`steps.ts`)

Convierte la secuencia de nodos en texto legible. Usa el ángulo entre segmentos para decidir "gire a la derecha" / "gire a la izquierda" / "siga derecho".

Umbrales angulares:

| Cambio de rumbo | Instrucción                               |
| --------------- | ----------------------------------------- |
| < 25°           | "Siga recto"                              |
| 25°–60°         | "Siga ligeramente a la derecha/izquierda" |
| 60°–135°        | "Gire a la derecha/izquierda"             |
| > 135°          | "Gire 180° / dé la vuelta"                |

**Casos especiales:**

- Cambio de piso → "Suba por las escaleras al Piso 2" / "Tome el ascensor hasta el Piso 2"
- Nodo destino → "Usted ha llegado a Aula 101, a la derecha"
- Primer paso → "Salga hacia el pasillo principal"

### 4.4 Búsqueda de destinos

Algoritmo de scoring sobre `space-catalog.json`:

1. Normalizar: minúsculas, quitar tildes, quitar tildes/ñ, colapsar espacios, quitar prefijos comunes ("aula", "salon", "salón", "lab", "laboratorio").
2. Coincidencia exacta de alias → score 100.
3. Prefijo → score 80.
4. Contención → score 60.
5. Búsqueda por tokens (todos deben coincidir) → score 40.
6. Búsqueda difusa (distancia de Levenshtein ≤ 2 o trigram Jaccard) → score decreciente.
7. Desempate por distancia al origen (el destino más cercano primero).

Soporta tildes: "auditorio", "aula", "laboratório", "biblioteca" — crítico en Colombia.

### 4.5 Tests obligatorios del dominio

| Test                    | Caso                                          |
| ----------------------- | --------------------------------------------- |
| Ruta simple             | Mismo piso, sin transiciones                  |
| Ruta multi-piso         | Usa escalera                                  |
| Ruta con ascensor       | Verifica que prefiere ascensor sobre escalera |
| Ruta sin escaleras      | `avoidStairs: true` → solo ascensor           |
| Origen = destino        | Retorna ruta vacía válida                     |
| Destino inalcanzable    | Retorna error tipado, no excepción            |
| Nodo inexistente        | Error tipado                                  |
| Grafo desconectado      | Detección por `validate-plans.ts`             |
| Ordenamiento de niveles | `levelsVisited` ordenado ascendentemente      |
| Instrucciones           | Cada `turn` tiene ángulo coherente            |

---

## 5. Panel de administración (`src/admin/`)

### 5.1 Enfoque

**El panel no es "la app web de escritorio".** Es una herramienta de gestión de contenido que corre en PC, con tres pilares:

1. **Editor de mapa** — dibujar y editar pisos, espacios, pasillos, nodos.
2. **Gestión de QRs** — generar, imprimir, rastrear códigos físicas.
3. **Gestión de contenido** — espacios, eventos, horarios, analítica.

### 5.2 Editor de mapa

Tecnologías: **MapLibre GL JS + MapLibre Geoman** (plugin de edición de geometría).

**Flujo de edición de un piso:**

1. Admin selecciona edificio → piso.
2. El editor carga el `floor.json` y lo proyecta a un lienzo (taller = unidades locales, no metros exactos al principio).
3. Admin dibuja con Geoman:
   - Polígono de espacio → se crea `space` con `name`, `kind`, `aliases`, `capacity`.
   - Polígono de pasillo → se crea `walkway`.
   - Punto → se crea `node`.
   - Línea → se crea `edge` (se hace snap a nodos existentes).
4. El panel recalcula la grafo y **valida en vivo** (§5.3).
5. Guardar → genera/actualiza el `floor.json` → **commit automático** vía PR (§5.5).

**Funciones clave:**

| Función                       | Descripción                                                    |
| ----------------------------- | -------------------------------------------------------------- |
| Mover / redimensionar espacio | Geoman `change` + snap a rejilla de 0.1 m                      |
| Dividir espacio               | Corta un polígono en dos por una línea                         |
| Unir espacios                 | Fusiona polígonos adyacentes                                   |
| Renombrar en bloque           | Renombra prefijo común ("Aula 1xx" → "Aula 2xx")               |
| Numeración automática         | Asigna códigos de aula correlativos por piso                   |
| Generar grafo automático      | Deriva nodos en pasillos desde los puntos medios (modo "auto") |
| Validación en vivo            | Marca en rojo espacios sin acceso o nodos aislados             |
| Importar/exportar             | JSON ↔ GeoJSON ↔ imagen de referencia                          |
| Comparar con imagen           | Superpone una foto del plano original como guía                |
| Historial                     | Ver diff entre versiones del piso                              |

**El punto crítico: "generar grafo automático".** Dibujar a mano 500 nodos es inviable. La estrategia:

1. El admin dibuja **polígonos de espacio** y **polígonos de pasillo** (mucho más rápido que nodos).
2. El sistema genera automáticamente los **nodos** en los puntos medios de los lados compartidos entre espacio y pasillo, y en las intersecciones de pasillos.
3. El admin **ajusta** la grafo generados con snapping y edición manual donde haga falta.

Esto convierte un trabajo de 40 horas en uno de 8.

### 5.3 Validador en vivo

El mismo validador que corre en CI, ejecutado en el navegador tras cada edición:

```
ERROR   Espacio "a-101" sin nodo de anclaje
ERROR   Nodo "n-orphan-1" sin ninguna arista
ERROR   Piso "edificio-a-p1" sin transición a "edificio-a-p2"
WARNING Edge "n-4"→"n-9" cruza un muro (segmento intersecta polígono de espacio)
WARNING Espacio "b-203" inaccesible desde la entrada principal
WARNING Grafo del edificio "edificio-a" tiene 2 componentes conexas
INFO    48 espacios, 12 pasillos, 214 nodos, 268 aristas, 4 transiciones
```

Implementación en `src/domain/validate.ts` — compartida entre el editor, la CLI y el CI. **Una sola fuente de verdad** para la validación.

### 5.4 Gestión de QRs

| Función      | Descripción                                                               |
| ------------ | ------------------------------------------------------------------------- |
| Generar QR   | A partir de un `nodeId` → PNG + SVG, con logo institucional opcional      |
| Lote         | Seleccionar N nodos → generar todos, descarga ZIP                         |
| Rotular      | Plantilla A4 con código + nombre del lugar + zona (para imprimir y pegar) |
| Inventario   | Tabla de QRs: ID, ubicación, estado (`pendiente`/`instalado`/`retirado`)  |
| Rastreo      | Escaneos por QR: conteo, fecha, último uso                                |
| Recuperación | QR perdido → reimprimir desde el catálogo (nunca se rompe)                |

**Formato del QR impreso:**

```
┌──────────────────────────┐
│  ┌────────┐              │
│  │  QR    │  Punto QR    │
│  │        │  Piso 1      │
│  └────────┘  Entrada A   │
│  MILIMAP • UMNG          │
└──────────────────────────┘
```

El código impreso es **estable**: `MILIMAP:v1:EDIFICIO-A:P1:N12` no cambia aunque se mueva el nodo.

### 5.5 Gestión de contenido (CRUD)

| Entidad         | Operaciones                                                   | Validación                               |
| --------------- | ------------------------------------------------------------- | ---------------------------------------- |
| Espacios        | Crear, editar, desactivar, alias, código, capacidad, keywords | Zod + uniqueness de `id`                 |
| Edificios       | Crear, editar, origen WGS84, niveles                          | Zod                                      |
| Pisos           | Crear desde edificio, editar geometría                        | `validate.ts`                            |
| Eventos         | CRUD completo, subida de imagen, publicación                  | fechas coherentes, `location.ref` existe |
| Anuncios        | CRUD, tipo (`info`/`warning`/`emergency`), vigencia           | Zod                                      |
| Horarios        | Importar CSV, editar, publicar término                        | CSV schema + conflictos de aula          |
| Sedes/Puntos QR | CRUD, estado del sticker físico                               | FK a nodos existentes                    |

**Publicación con GitOps.** En lugar de guardar directo en la base de datos, cada cambio genera:

1. Un **commit** con el JSON actualizado.
2. Un **PR** contra `main` con la descripción del cambio.
3. CI valida la data. Si falla, el PR queda rojo y el admin ve el error.
4. Al mergear, se despliega.

**Por qué GitOps y no "guardar en base":** el dato del mapa es la fuente de verdad del producto y debe estar versionado, revisable y reversible. Un `git revert` de un commit de datos es un rollback perfecto. Además, el dato queda en el repositorio público: cualquiera puede auditar o contribuir con una corrección — que es exactamente lo que una universidad pública quiere.

**Excepción:** analítica y datos de usuario (escaneos) viven en Supabase, no en Git. Son datos voluminosos, de escritura continua y no editables a mano.

### 5.6 Autenticación y roles

- **Supabase Auth** con email institucional.
- **Roles:** `admin` (todo), `editor` (mapa y contenido, sin auth), `viewer` (solo lectura, para auditoría).
- **RLS (Row Level Security)** en Postgres: las políticas definen qué puede leer/escribir cada rol.
- Los datos de mapa editables (espacios, eventos) viven en `public/data/` del repo - **accesibles en modo lectura por todos**, editables solo con token de escritura y rol adecuado.
- La lógica de negocio crítica (validación, ruteo) vive en el frontend TypeScript — **no duplicar reglas en SQL**.

### 5.7 Analítica

Métricas que el panel muestra:

| Métrica                  | Pregunta que responde                      |
| ------------------------ | ------------------------------------------ |
| Escaneos totales         | ¿Cuánta gente lo usa?                      |
| Destinos más solicitados | ¿Qué salones generan más tráfico?          |
| QR más escaneados        | ¿Dónde poner más stickers?                 |
| Rutas fallidas           | ¿Qué datos del mapa están mal?             |
| Jerarquía de uso         | ¿Dónde navegar entre pisos?                |
| Series temporales        | Uso por día/hora → ¿cuándo hay congestión? |

Herramienta sugerida: **Metabase** montado sobre Supabase (gratis, self-hosted, panel de PC). Evita construir un dashboard a mano.

---

## 6. Home page y experiencia de usuario

### 6.1 Home (móvil)

```
┌────────────────────────────┐
│  Milimap · UMNG      [avatar]│  ← header con logo
├────────────────────────────┤
│ ┌────────────────────────┐ │
│ │ 🎓 Ceremonia Graduación│ │  ← carrusel de eventos
│ │    11 dic · Aula Máxima │ │     especiales (con fecha)
│ │    [Cómo llegar →]      │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ 🔴 AVISO:eviatorio      │ │  ← anuncios urgentes
│ │   Carrera 11 cerrado    │ │
│ └────────────────────────┘ │
├────────────────────────────┤
│  Mi horario                │
│  ┌──────────────────────┐  │
│  │ AHORA  09:50         │  │
│  │ Estadística I · A101 │  │
│  │ Termina en 10 min    │  │
│  │ [ 🎯 Cómo llegar ]   │  │
│  └──────────────────────┘  │
│  Próxima: 14:00 Lab. Física │
├────────────────────────────┤
│  [ 📷 Escanear QR ]        │  ← acción principal
│  [ 🔍 Buscar lugar ]       │
├────────────────────────────┤
│  Mapa rápido (vista previa) │
│  [🗺 Ver mapa completo]    │
├────────────────────────────┤
  Construido con Vite + React + TypeScript
└────────────────────────────┘
```

### 6.2 Vista de mapa (la pantalla principal del producto)

| Elemento               | Comportamiento                                                       |
| ---------------------- | -------------------------------------------------------------------- |
| Selector de piso       | Chips horizontales scrollables en la parte superior                  |
| Superficies            | Edificios y espacios con color por `kind`                            |
| Ruta                   | Línea gruesa resaltada en azul institucional, con puntos intermedios |
| Origen                 | Punto verde pulsante + "Usted está aquí"                             |
| Destino                | Bandera + etiqueta con nombre                                        |
| Instrucciones          | Tarjeta inferior con paso actual grande + pasos siguientes pequeños  |
| Botón "Siguiente paso" | Grande, para uso con una mano, con vibración háptica                 |
| Brújula                | Indicador de norte cuando el mapa rota                               |
| Escala                 | Barra métrica                                                        |
| Búsqueda flotante      | Ícono de lupa siempre visible                                        |

**Interacción de un solo pulgar:** el botón "Siguiente" y el selector de piso están en la zona de alcance del pulgar (parte inferior). Es crítico: en un campus, el usuario camina mirando el teléfono parcialmente.

### 6.3 Buscar destino

- Campo de texto grande.
- Sugerencias mientras escribe (debounce 150 ms).
- Filtros rápidos por categoría: Aulas / Laboratorios / Oficinas / Baños / Comedores / Bibliotecas / extraordinary.
- Búsqueda tolerante a errores: "auditorio" → "Auditorio B", "lab fisica" → "Laboratorio de Física".
- "Zonas de interés" como categoría propia: explanada,ASES, restaurante, gimnasio, enfermería,secretaría.

### 6.4 Escanear QR

1. Botón grande "Escanear QR".
2. Solicita permiso de cámara (con pantalla explicando por qué).
3. Cámara a pantalla completa con overlay de objetivo.
4. Detección → vibración + sonido → parse del payload → validación (`MILIMAP:v1`).
5. Si es válido → muestra confirmación "Usted está en: Punto QR Entrada A, Piso 1" → pide destino.
6. Si es inválido → mensaje "Este código no es de Milimap" con opción de escribir el código a mano.

**Fallbacks obligatorios:**

- Si no hay permiso de cámara → entrada manual del código.
- Si el dispositivo no soporta cámara (desktop) → buscar destino manualmente.
- Si `BarcodeDetector` no existe → `html5-qrcode` (WASM) transparentemente.

### 6.5 Horario del semestre

**Picky "Mi horario":**

1. En la primera visita, se ofrece elegir **programa** (ej. "Ingeniería Civil", "Facultad de Ciencias Económicas") y **grupo**.
2. Se precargan las clases del programa desde el catálogo público.
3. El estudiante desmarca las que no lleva (opcionalmente).
4. Se guarda localmente.
5. En el home, la tarjeta "Mi horario" muestra la clase actual y la próxima.

**Cálculo de clase actual:**

```
now = fecha/hora actual (zona America/Bogota, UTC-5)
day = now.getDay()
for each class in myClasses:
  if class.weekday !== day: skip
  if class.weeks does not include currentWeek: skip
  if now is between class.startsAt and class.endsAt → clase ACTUAL
  else if now is before class.startsAt → próxima clase
```

**Consideración importante: los horarios de la UMNG pueden cambiar por semestre.** El catálogo se versiona por término (`2026-1`, `2026-2`), así que un cambio de horario es un commit nuevo, no una migración destructiva.

### 6.6 Accesibilidad

- Contraste AA mínimo en todos los textos sobre mapa.
- Navegación por teclado completa en el panel admin.
- `aria-live` para anunciar el paso de ruta actual.
- Opción de fuente grande (el público militar incluye personal con baja visión).
- Modo de alto contraste.
- El mapa no debe ser el único portador de información: toda la ruta tiene descripción textual.

---

## 7. Procedimiento de digitalización de planos a mano

Esta es la sección **más importante** del plan. Es la que desbloquea el producto.

### 7.1 Principio rector

> **Digitalizar no es dibujar en pantalla. Es extraer información estructurada de una fuente no estructurada.**

El error clásico en proyectos de mapas indoor es intentar _reproducir el plano dibujado_ con máxima fidelidad visual. Eso es un trabajo de ilustración infinito que no aporta valor. Lo que el producto necesita es **topología**: dónde están los espacios, cómo se conectan, qué se puede caminar.

**Ejemplo concreto:** el plano a mano de un piso puede tener 8 € de detalle en la topografía. Solo nos interesan 3 cosas: los polígonos de los espacios (con su nombre), los pasillos transitables, y los puntos de conexión vertical (escaleras, ascensores). Todo lo demás —mobiliario, texturas, anotaciones,(Evento), hidrantes— se descarta.

### 7.2 Fase A — Preparación de la fuente (sin computador)

**Objetivo:** tener material digitalizable de calidad antes de tocar la pantalla.

1. **Escaneo del plano**
   - Escanear a **300 DPI mínimo** en escala de grises o color.
   - Guardar como PNG sin pérdida o TIFF.
   - Si el plano es muy grande, escanear por partes en cuadrícula de 2×2 o 3×3 con solapamiento de 2 cm, y montar en un editor de imágenes.
   - **Verificar:** que los números de aula sean legibles al 100% de zoom.

2. **Corrección de perspectiva** (si hay foto en vez de escaneo)
   - Usar Photogrammetry o una app de rectificación.
   - Alternativa simple: abrir la foto en un editor, aplicar _Transform → Perspective_, ajustar los 4 puntos a las esquinas del plano, aplicar.
   - **Criterio de aceptación:** las líneas de muro deben quedar paralelas a los bordes de la imagen.

3. **Definir la escala (métrica)**
   - Identificar en el plano una longitud conocida: un pasillo medido con cinta métrica, ancho de puerta estándar (0.90 m), ancho de aula, o un.Reference del edificio.
   - **Este es el paso que más se subestima.** Sin una escala métrica real, todo el ruteo queda mal y las distancias que se muestran al usuario son mentiras.
   - Marcar dos puntos de la escala con un overlay para trazarla después.

4. **Inventario de espacios** (hoja de cálculo)
   - Una fila por espacio. Columnas: `código`, `nombre`, `tipo`, `capacidad`, `piso`, `observaciones`.
   - Esto sirve de **lista de verificación** contra la digitalización: cada fila debe tener su polígono.

5. **Mapa de niveles** (hoja de cálculo)
   - Una fila por piso: `código de piso`, `nombre de piso`, `altura`, `edificio`, `conexiones verticales`.
   - **Debe incluir el sótano y todos los niveles**, no solo los principales.

6. **Anotar las conexiones verticales**
   - Marcar en cada plano la posición de escaleras, ascensores y rampas con un símbolo y un código: `ESC-A`, `ASC-A`.
   - **Regla crítica:** un elemento en el piso 1 con el mismo código `ESC-A` es el mismo Elemento en el piso 2. La correspondencia vertical se define por código, no por posición en la imagen. Esto hace la transición robusta ante diferencias de escala entre pisos.

7. **Anotar entradas y puntos QR**
   - Marcar: entrada principal, entradas peatonales, acceso desde parqueadero,Ascensor de servicio, puntos QR propuestos.
   - Los puntos QR se colocan en: entradas, esquinas de pasillo, antes de escaleras/ascensores, junto a reception,Ascensor de servicio, puertas de auditorios.

### 7.3 Fase B — Vectorización (la parte técnica)

**Herramientas recomendadas:**

| Herramienta                            | Uso                                | Por qué                                                        |
| -------------------------------------- | ---------------------------------- | -------------------------------------------------------------- |
| **QGIS** (gratis, desktop)             | Vectorizar manualmente con snap    | Snap a nodos,CRS management,export a GeoJSON                   |
| **Inkscape** (gratis)                  | Vectorizar el contorno             | Traza Bezier, nodos editables, export SVG -> despues a GeoJSON |
| **web-geojson.io** (web, gratis)       | Vectorizar en navegador            | Sin instalación, export directo a GeoJSON                      |
| **MapLibre Geoman + panel admin**      | Vectorizar dentro de la propia app | Flujo integrado, valida al instante                            |
| **Image Trace (Illustrator/Inkscape)** | Autotrace como borrador            | **Solo como punto de partida**, hay que limpiar                |

**Procedimiento paso a paso (con QGIS, recomendado):**

1. **Crear proyecto QGIS**
   - Nuevo proyecto → geographic CRS **WGS 84 (EPSG:4326)**.
   - Añadir la capa raster del plano escaneado (GeoTIFF georreferenciado, o PNG + georreferenciación manual con 4 puntos).

2. **Georreferenciar el plano**
   - _Raster → Georeferencer_.
   - Formato destino: GeoTIFF.
   - GCP: 4 puntos de las esquinas del edificio → se leen sus coordenadas en WGS84 desde Google Maps (o desde el footprint OSM ya disponible).
   - GCP: 2+ puntos de control sobre la **escala métrica** definida en 7.2.3 → esto fija la escala real.
   - **Verificación:** la escala del georrefinado debe coincidir con la medida real (±5%). Si no, ajustar.
   - Transformation: _Thin Plate Spline_ o _Polynomial 1_ (mejor que _Affine_ si hay distorsión de escaneo).

3. **Crear capas vectoriales**
   - `espacios` — Polygon, con EPSG:4326.
   - `pasillos` — Polygon.
   - `entradas_verticales` — Point (escaleras, ascensores).
   - `puntos_qr` — Point.
   - `edificios` — Polygon (el footprint, ya disponible en OSM — se puede importar).

4. **Digitalizar espacios**
   - Capa `espacios` → _Add Polygon Feature_.
   - **Activar snapping** (topología) a 8 px y a las capas vectoriales existentes.
   - Trazar el contorno del aula siguiendo el muro interior.
   - Atributos: `id` (código), `name`, `kind`, `capacity`, `floor_code`.
   - **Herramienta clave:** _Snapping_ con tolerancia de 8 px. Sin snap, los polígonos no comparten vértices y aparecen "grietas" — esto rompe la detección de adyacencia y por tanto el ruteo automático.
   - **Verificación:** al terminar, `Vector → Geometry Tools → Check validity`. Debe reportar 0 errores.

5. **Digitalizar pasillos**
   - Capa `pasillos` → Polygon.
   - Un pasillo = **el corridor transitable**, no el muro. Si el pasillo tiene 3 m de ancho, el polígono tiene 3 m.
   - En pasillos anchos (>4 m), **dividir en sub-pasillos** con una línea imaginaria para que la generación de nodos produzca una red útil.

6. **Digitalizar puntos de entrada vertical**
   - Capa `entradas_verticales` → Point.
   - Un punto por escalera/ascensor, con atributo `code` (`ESC-A`, `ASC-A`) y `type`.
   - **Este atributo `code` es lo que conecta los pisos.** En el piso 2, la escalera con el mismo `code` es el mismo elemento.

7. **Generar la grafo automáticamente**
   - Script `tools/import-handdrawn.ts` (o botón en el panel admin):
     1. Para cada espacio, encuentra el lado del polígono que comparte borde con un pasillo → crea un `node` en el punto medio → lo asigna como `anchorNodeId`.
     2. Para cada par de espacios adyacentes (muro compartido) → crea un `door` opcional con `accessible: false`.
     3. Genera una malla de nodos a lo largo del eje de cada pasillo (cada ~2 m) y los conecta entre sí y con los nodos de acceso a espacios.
     4. Para cada punto de `entradas_verticales`, crea los nodos `stair`/`elevator` en ese piso.
     5. Empareja los puntos verticales por `code` entre pisos → crea las `transitions`.

8. **Exportar e integrar**
   - Exportar GeoJSON por capa → convertir al `floor.json` del modelo de datos (§3.2) con un script.
   - Opcional: subir los GeoJSON al panel admin y editar ahí.

### 7.4 Alternativa vectorización desde cero (sin QGIS)

Si se prefiere trabajar 100% en el navegador:

1. `web-geojson.io` → cargar la imagen del plano → usar el trazador de polígonos con **snapping**.
2. Exportar GeoJSON por capa.
3. Convertir con `tools/import-handdrawn.ts`.

Es más rápido de aprender, pero peor para la revisión (no hay control de CRS ni de topología).

### 7.4-bis RESPUESTA DIRECTA: ¿qué tengo que entregar?

> **No hay que entregar un JSON. Hay que entregar un archivo GeoJSON, y ni siquiera eso hay que armarlo a mano.**

**Lo que realmente se entrega:**

| Formato                                | ¿Quién lo produce?                                              | Esfuerzo de quien digitaliza      |
| -------------------------------------- | --------------------------------------------------------------- | --------------------------------- |
| **Plano escaneado** (PNG/TIFF 300 DPI) | El usuario                                                      | 10 min por piso — solo escanear   |
| **GeoJSON de contornos** (3 capas)     | El usuario, con Snap                                            | 3–8 h por piso — trazar polígonos |
| `floor.json` (formato interno)         | **La herramienta lo genera**                                    | 0 — automático                    |
| Catálogo de espacios                   | **La herramienta lo genera** (del GeoJSON + hoja de inventario) | 0 — automático                    |
| Grafo de navegación                    | **La herramienta lo genera** (de los polígonos)                 | 0 — automático                    |
| QRs                                    | **La herramienta los genera**                                   | 0 — automático                    |

**El JSON interno es responsabilidad del proyecto, no del usuario.** Quien digitaliza entrega geometría (GeoJSON, un estándar abierto que cualquier herramienta GIS entiende); el script `tools/import-handdrawn.ts` la convierte al `floor.json` del modelo de datos, genera el grafo, y produce los QRs.

**Herramienta recomendada: QGIS (gratis, Windows).**

Es la opción correcta por una razón concreta: **maneja el snapping y la topología**, que es donde fallan las digitalizaciones manuales. Sin snapping, dos polígonos que comparten un muro quedan con vértices separados por 1 píxel → aparecen "grietas" → el generador de grafo no detecta que el aula toca el pasillo → el aula queda **inalcanzable** y el validador lo marca. QGIS evita eso de origen.

Alternativa si QGIS resulta demasiado pesado: **web-geojson.io** (gratis, en el navegador, sin instalar nada). Traza polígonos con snapping y exporta GeoJSON directo. Se pierde el control de CRS, pero para un campus de un solo edificio es perfectamente viable y mucho más rápido de aprender.

**Cómo integrar el GeoJSON con el proyecto — 3 vías, de más a menos automática:**

**Vía A — Panel de administración (RECOMENDADA, la que se va a usar en la práctica):**

1. El usuario abre el panel admin → edificio → piso.
2. Sube el GeoJSON (o dibuja directamente con las herramientas de dibujo).
3. El panel lo carga, valida en vivo, genera la grafo, y muestra el resultado.
4. Click en "Publicar" → genera commit + PR → CI valida → merge → la app lo muestra.
5. **El GeoJSON es un formato intermedio; la fuente de verdad es el `floor.json` en el repo.**

**Vía B — Script de importación (la más cómoda para entrega por lotes):**

```bash
npm run import:plans -- --building edificio-a --geodir ./geojson/edificio-a/
```

El script lee todos los GeoJSON de una carpeta, los convierte a `floor.json`, genera el grafo, corre el validador e imprime un reporte. Se ejecuta una vez por edificio, se commitea el resultado, y no hace falta volver a correrlo.

**Vía C — Edición manual del JSON** (solo para correcciones puntuales). El `floor.json` es JSON legible con indentación; se puede editar a mano para agregar un nodo o corregir un nombre. Está documentado en `docs/PLAN-DATA.md`.

### 7.4-ter Capas GeoJSON que hay que entregar

Un GeoJSON por capa, o un solo archivo con `FeatureCollection` y una propiedad `layer`:

```jsonc
// geojson/edificio-a/p1.geojson
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "layer": "espacios",           // espacios | pasillos | verticales | puntos_qr
        "id": "a-101",
        "name": "Aula 101",
        "kind": "classroom",           // classroom|laboratory|office|bathroom|common|auditorium|gym|kitchen|service
        "capacity": 40,
        "floor": "P1"
      },
      "geometry": { "type": "Polygon", "coordinates": [[[x, y], ...]] }
    },
    {
      "type": "Feature",
      "properties": { "layer": "pasillos", "id": "w-p1-norte" },
      "geometry": { "type": "Polygon", "coordinates": [[[x, y], ...]] }
    },
    {
      "type": "Feature",
      "properties": { "layer": "verticales", "id": "ESC-A", "code": "ESC-A", "type": "stairs" },
      "geometry": { "type": "Point", "coordinates": [x, y] }
    }
  ]
}
```

**Las coordenadas van en metros, con origen local en la esquina del edificio.** No lat/lng. Razón: los QGIS pueden medir en metros directamente si se define el CRS como un sistema local proyectado; y si se_exporta en WGS84, el script de importación lo re-proyecta a metros locales. **Ambas entradas son aceptadas** — el importador detecta la diferencia.

**El `id` y el `name` son opcionales** en el GeoJSON: si no están, el importador genera ids automaticos (`esp-001`, `esp-002`...) y el admin los renombra después en el panel. **Lo único realmente obligatorio es el dibujo del polígono.** Esto baja la barrera de entrada: se puede entregar geometría cruda y completar la semántica después.

### 7.4-cuarta Alternativa: digitalizar DENTRO de la app

Si el flujo del panel admin ya está construido (Fase 3), **no hace falta QGIS en absoluto**: se sube el plano escaneado como imagen de fondo al panel admin, y se dibuja encima con las herramientas integradas (Geoman). Es el mismo trabajo de dibujo, pero:

- Sin instalar software adicional.
- Validación en vivo (los errores aparecen mientras se dibuja).
- El resultado se publica directo.

**Ventaja clave frente a QGIS:** no hay conversión GeoJSON → `floor.json` → grafo. Se edita el `floor.json` nativo. Menos pasos, menos puntos de falla.

**Desventaja:** el panel admin es código de la Fase 3, o sea que no existe en la Fase 0. Si querés digitalizar planos _antes_ de que exista el panel, entonces QGIS o web-geojson.io es la vía.

**Recomendación final por momento del proyecto:**

| Cuándo                       | Herramienta                                                      |
| ---------------------------- | ---------------------------------------------------------------- |
| Ahora (Fases 0–2, sin panel) | **QGIS** o **web-geojson.io** → GeoJSON → `npm run import:plans` |
| Después de la Fase 3         | **El panel admin** directamente (imagen de fondo + dibujo)       |
| Correcciones puntuales       | Editar el `floor.json` a mano                                    |

### 7.5 Fase C — Validación en sitio

**El paso que garantiza que el mapa funcione.** Se hace con el campus real, con un par de personas y un cronómetro.

1. **Recorrido de verificación**
   - Elegir 8–10 pares origen/destino que cubran: mismo piso, pisos adyacentes, piso bajo → piso alto, y rutas con escalera vs. ascensor.
   - Para cada par: medir en el sitio la distancia real (cinta métrica o paso promedio de 0.75 m) y el tiempo real de caminata.
   - Comparar con lo que genera la app.
   - **Tolerancia objetivo: ±15% en distancia, ±25% en tiempo.**

2. **Verificación de que todo espacio es alcanzable**
   - El validador (`validate-plans.ts`) debe reportar 0 espacios inaccesibles.
   - Recorrer físicamente una muestra.

3. **Verificación de puntos QR**
   - Cada QR impreso debe escanearse y llevar al nodo correcto.
   - Test: escanear los 5 primeros QRs en el campus y confirmar la posición.

4. **Registro de problemas**
   - Un issue de GitHub por corrección necesaria: "Aula 205 no conecta con pasillo — falta puerta en el muro este".

### 7.6 Checklist por piso

- [ ] Plano escaneado a 300 DPI, legible
- [ ] Escala métrica definida y verificada (±5%)
- [ ] Plano georreferenciado en QGIS
- [ ] Polígonos de espacios trazados (uno por fila del inventario)
- [ ] `Check validity` → 0 errores
- [ ] Pasillos trazados (área transitable)
- [ ] Puntos verticales con código (`ESC-A`, `ASC-A`)
- [ ] Grafo generado automáticamente
- [ ] Validador: 0 errores, 0 warnings críticos
- [ ] Anuncios, espacios, pasillos, nodos, aristas, transiciones
- [ ] Recorrido de verificación en sitio (8–10 pares)
- [ ] QRs generados e instalados
- [ ] Commit: `feat(data): add edificio-a floor plan for level 1`

### 7.7 Estimación de esfuerzo de digitalización

| Tipo de plano                     | Edificios/pisos | Horas estimadas |
| --------------------------------- | --------------- | --------------- |
| Sencillo (1 piso, pocos espacios) | 1               | 3–4 h           |
| Mediano (3 pisos, 30 espacios)    | 1               | 8–12 h          |
| Complejo (5+ pisos, 60+ espacios) | 1               | 20–30 h         |

**Para la Sede Calle 100 (96 aulas + auditorios + zonas comunes, distribuidas en varios edificios):** estimar **60-100 horas** de trabajo meticuloso de digitalización + 15-20 h de verificación en sitio. Este es el **camino crítico del proyecto** y probablemente el factor que define la fecha de entrega real.

---

## 8. Fases de desarrollo

Cada fase tiene: objetivo, entregables, criterios de aceptación, y el commit/PR asociado. **La fase no se cierra hasta que sus criterios de aceptación están cumplidos.**

---

### Fase 0 — Cimientos del repositorio — ✅ COMPLETADA (2026-11-05)

**Objetivo:** repositorio funcional, con tooling de calidad activo, desde el primer commit.

> **Nota sobre el MVP:** el alcance es demostrar funcionalidad, no producción a escala.
> La Fase 0 entrega el esqueleto correcto y verificado; las pantallas de producto se
> llenan en las fases siguientes.

#### Tareas ejecutadas

| Tarea                                                                                  | Estado                                              |
| -------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Repo inicializado y vinculado a `DavidCrispoca/Milimap` (rama `main`)                  | ✅                                                  |
| Excluido del repo git del home (`Desktop/Milimap/` en `.git/info/exclude`)             | ✅                                                  |
| Scaffold con `create-vite` (React 19 + TypeScript 7)                                   | ✅                                                  |
| Dependencias de producto: `maplibre-gl`, `html5-qrcode`, `zustand`, `zod`              | ✅                                                  |
| Testing: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`      | ✅                                                  |
| Calidad: `oxlint`, `prettier`                                                          | ✅ (ver desvío D1)                                  |
| Git: `husky`, `lint-staged`, `commitlint`                                              | ✅                                                  |
| `commitlint.config.js` con tipos y scopes del proyecto                                 | ✅                                                  |
| `.prettierrc` y `.gitignore` completo                                                  | ✅                                                  |
| `tsconfig` estricto + alias `@/` (sin `baseUrl`, ver desvío D2)                        | ✅                                                  |
| `README.md`, `docs/CONTRIBUTING.md`, `CHANGELOG.md`                                    | ✅                                                  |
| `docs/ARCHITECTURE.md` (10 ADRs con justificación)                                     | ✅                                                  |
| `docs/PLAN-DATA.md` (guía de digitalización de planos a mano)                          | ✅                                                  |
| `docs/ADMIN-GUIDE.md` (especificación del panel)                                       | ✅                                                  |
| `.github/workflows/ci.yml` (formato, lint, typecheck, test, build, commitlint)         | ✅                                                  |
| `.github/workflows/release-please.yml` + config                                        | ✅                                                  |
| PR template y 2 issue templates                                                        | ✅                                                  |
| Hooks: `pre-commit` (lint-staged), `commit-msg` (commitlint), `pre-push` (tsc + tests) | ✅                                                  |
| Tipos del dominio (`src/domain/types.ts`)                                              | ✅                                                  |
| Geometría pura en metros + 21 tests                                                    | ✅                                                  |
| Shell de la app con navegación inferior y design tokens                                | ✅                                                  |
| `LICENSE`                                                                              | ❌ Omitida por decisión: proyecto académico interno |

#### Verificación ejecutada

| Comando                | Resultado                                  |
| ---------------------- | ------------------------------------------ |
| `npm run format:check` | ✅ todos los archivos formateados          |
| `npm run lint`         | ✅ 0 problemas                             |
| `npm run typecheck`    | ✅ 0 errores                               |
| `npm test`             | ✅ 21 tests en 2 archivos                  |
| `npm run build`        | ✅ 225 kB (70 kB gzip)                     |
| Servidor de desarrollo | ✅ HTTP 200, título y entrypoint correctos |

#### Desvíos respecto del plan original

**D1 — oxlint en lugar de ESLint.** `create-vite` v9 trae oxlint por defecto. Adoptarlo
evita configurar el ecosistema de plugins de ESLint 10, que es nuevo y añade riesgo sin
beneficio en un MVP. **Contrapartida:** oxlint no hace linting con información de tipos,
así que `tsc` es la única garantía de tipos y el CI lo corre como paso obligatorio
separado. Registrado en ADR-009.

**D2 — TypeScript 7 y sin `baseUrl`.** TS 7 es la reescritura nativa (Go) y **eliminó
`baseUrl`**; los `paths` se resuelven relativos al `tsconfig`. Consecuencia práctica para
el equipo: **no agregar `baseUrl` en ningún `tsconfig`**, rompe el build.

**D3 — `@maplibre/geoman` todavía no instalado.** Se agrega en la Fase 3, cuando exista
el editor. Instalarlo ahora sería una dependencia sin consumidor.

**D4 — `tools/` con scripts pendientes.** `tools/README.md` documenta los tres scripts
(`validate-plans`, `import-handdrawn`, `gen-qr`) y su fase. No se crearon stubs vacíos a
propósito: un script que no hace nada es peor que un script que no existe.

**D5 — `plan.md` vive en el repositorio.** Se movió de `~/.opencode/plan/` a la raíz del
repo para que quede versionado junto al código y su actualización sea parte del PR.

#### Criterios de aceptación

- [x] `lint`, `typecheck`, `test` y `build` pasan
- [x] Hook de commit rechaza mensajes fuera de convención
- [x] CI configurado para correr en cada PR y bloquear el merge si falla
- [x] `plan.md` vive en el repositorio y se actualiza con cada cambio
- [ ] Branch protection en `main` — **requiere acción manual en GitHub**
      (Settings → Branches → proteger `main` exigiendo el check `CI / verify`).
      No se puede hacer desde el repositorio.

#### Pendiente al cerrar la fase

- [x] Crear los commits iniciales y pushear a `origin/main` (5 commits atómicos).
- [ ] **Configurar branch protection en `main`** — acción manual en GitHub:
      Settings → Branches → Add branch protection rule para `main`, exigiendo el check
      `CI / verify`.
- [ ] **Habilitar PRs automáticos de GitHub Actions** — acción manual, necesaria para
      que Release Please funcione: Settings → Actions → General → Workflow permissions →
      marcar _Allow GitHub Actions to create and approve pull requests_. Sin esto, el
      workflow `Release Please` corre pero falla al abrir el PR de versión.
- [ ] Configurar el deploy (Vercel o GitHub Pages) — Fase 9.

> **Nota para el equipo:** los dos primeros puntos son ajustes de GitHub, no cambios de
> código. Sin ellos el CI igual protege por convención, pero no bloquea el merge
> técnicamente.

---

### Fase 1 — Dominio: motor de ruteo

**Objetivo:** el cerebro del producto funcionando y testeado, sin depender de la UI.

**Tareas:**

- [ ] `src/domain/types.ts` — todos los tipos del modelo de datos
- [ ] `src/domain/geo.ts` — geometría local ↔ WGS84, distancias, ángulos
- [ ] `src/domain/graph.ts` — construcción del grafo multi-nivel, Dijkstra
- [ [ ] `src/domain/steps.ts` — generación de instrucciones en español e inglés
- [ ] `src/domain/search.ts` — búsqueda y scoring de destinos
- [ ] `src/domain/validate.ts` — validador de coherencia de la grafo
- [ ] `src/domain/qr.ts` — parse/serialize de payload QR
- [ ] `src/data/floors/` — **2 pisos de ejemplo con datos ficticios** (Edificio Demo A)
- [ ] `src/data/space-catalog.json` — catálogo ficticio
- [ ] `tools/validate-plans.ts` — CLI que valida todos los pisos
- [ ] Tests unitarios completos del dominio

**Criterios de aceptación:**

- [ ] Tests cubren: ruta simple, multi-piso, ascensor preferido sobre escalera, `avoidStairs`, origen==destino, destino inalcanzable, nodo inexistente
- [ ] Las instrucciones en español no tienen errores de concordancia
- [ ] `validate-plans.ts` detecta los 5 tipos de error del §5.3
- [ ] Cobertura de tests del dominio > 85%
- [ ] Cero imports de React/MapLibre/Supabase en `src/domain/`

**Commits:**

```
feat(domain): add core type definitions for floors spaces and routing
feat(domain): implement local meter-based geometry utilities
feat(domain): implement multi-level dijkstra router with transitions
feat(domain): generate turn-by-turn instructions from node sequences
feat(domain): add fuzzy destination search with accent normalization
feat(domain): add graph validation for unreachable spaces and orphan nodes
feat(qr): add milimap qr payload parser and serializer
feat(data): add demo building with two levels and sample spaces
feat(tools): add cli validator for floor plan graph consistency
test(domain): add routing and search test coverage
```

---

### Fase 2 — Panel de administración: contenido (sin mapa aún)

**Objetivo:** la vía por la cual la universidad va a cargar todo el contenido. Empezar por lo que no depende de la geometría.

**Tareas:**

- [ ] Supabase: proyecto, tablas, RLS, roles
- [ ] Supabase Auth: login institucional, roles `admin`/`editor`/`viewer`
- [ ] Layout del panel (sidebar, header, routing interno)
- [ ] CRUD de espacios (tabla + formulario + validación Zod)
- [ ] CRUD de eventos con imagen y publicación
- [ ] CRUD de anuncios
- [ ] Importador de horarios desde CSV (con validación de conflictos de aula)
- [ ] Analítica: eventos y métricas agregadas
- [ ] Layout responsive (mínimo 1280 px, usable en 1366×768)

**Criterios de aceptación:**

- [ ] Un admin puede crear un evento y verlo en la app
- [ ] Un editor puede crear un espacio pero no publicar eventos
- [ ] Un viewer no puede escribir
- [ ] Importar un CSV de horarios detecta y reporta aula ocupada en conflicto
- [ ] Todas las mutaciones pasan por validación Zod en cliente y RLS en servidor

**Commits:**

```
feat(admin): scaffold admin panel layout and navigation
feat(auth): add supabase auth with role based access control
feat(admin): add space catalog CRUD with validation
feat(admin): add events and announcements management
feat(admin): add schedule CSV importer with conflict detection
feat(admin): add analytics dashboard for scan and destination metrics
```

---

### Fase 3 — Panel de administración: editor de mapa

**Objetivo:** el admin puede dibujar y editar el mapa sin tocar código.

**Tareas:**

- [ ] MapLibre Geoman: integración base (draw, edit, trash)
- [ ] Vista de edición por edificio/piso
- [ ] Draw de espacios (polígono) → crea `space` con formulario
- [ ] Draw de pasillos (polígono) → crea `walkway`
- [ ] Draw de nodos (punto) y aristas (línea) con snap
- [ ] Herramienta "generar grafo automático" desde espacios + pasillos
- [ ] Validación en vivo con resaltado de errores en el mapa
- [ ] Capas de referencia: imagen del plano escaneado como underlay con opacidad
- [ ] Importar/Exportar GeoJSON ↔ JSON del piso
- [ ] Número automático de aulas
- [ ] Renombrado en bloque
- [ ] Publicación vía PR (GitOps): commit + PR + estado
- [ ] Comparación de versiones de un piso (diff visual)

**Criterios de aceptación:**

- [ ] Un admin puede crear un aula nueva dibujándola, en menos de 2 minutos
- [ ] "Generar grafo automático" produce una red conectada y válida
- [ ] El validador en vivo marca un aula inaccesible en menos de 1 segundo tras editarla
- [ ] Guardar genera un PR con el JSON actualizado y el CI lo valida
- [ ] Un plano escaneado puede superponerse con opacidad ajustable

**Commits:**

```
feat(admin): integrate maplibre geoman for geometry editing
feat(admin): add floor editor with building and level navigation
feat(admin): add space and walkway drawing tools
feat(admin): add automatic graph generation from spaces and walkways
feat(admin): add live graph validation with error highlighting
feat(admin): add scanned plan underlay overlay for digitization
feat(admin): add gitops publish flow generating pull requests
```

---

### Fase 4 — App móvil: mapa y navegación

**Objetivo:** el usuario puede ver el mapa y navegar.

**Tareas:**

- [ ] Componente `MapView` con MapLibre (configuración base, AttributionControl, sin token)
- [ ] Fuentes GeoJSON por piso (espacios, pasillos, edificios)
- [ ] Capas: edificios / espacios por `kind` / pasillos / ruta / origen / destino / etiquetas
- [ ] Selector de piso (chips, scroll horizontal)
- [ ] Render de la ruta (LineString + markers + animación de progreso)
- [ ] Cámara: `fitBounds` al destino, `flyTo` entre pisos
- [ ] Pantalla de instrucciones paso a paso con botón "Siguiente" y háptica
- [ ] Brújula, escala, botón de recentrar
- [ ] Búsqueda de destino con sugerencias
- [ ] Vista de detalle del destino (info, capacidad, aliases)
- [ ] Manejo de "destino no encontrado" y "ruta no disponible"

**Criterios de aceptación:**

- [ ] La ruta se dibuja correctamente y se ve el recorrido completo
- [ ] Cambiar de piso durante la ruta mantiene el contexto
- [ ] Las instrucciones coinciden con lo que se ve en el mapa
- [ ] Funciona bien en un teléfono Android de gama media (clase de 2021)
- [ ] El bundle inicial < 200 KB gzip

**Commits:**

```
feat(map): add maplibre base map with geojson floor sources
feat(map): add floor level selector and camera transitions
feat(map): render route line with origin and destination markers
feat(ui): add step by step navigation screen with haptic feedback
feat(ui): add destination search with live suggestions
feat(map): add compass scale and recenter controls
perf(map): reduce initial bundle size with lazy loading
```

---

### Fase 5 — App móvil: scanner QR

**Objetivo:** el usuario llega a su ubicación escaneando.

**Tareas:**

- [ ] `html5-qrcode`: integración con `facingMode: 'environment'`
- [ ] Detección de `BarcodeDetector` nativo → usar si está disponible (más rápido)
- [ ] Fallback a `html5-qrcode` (WASM) cuando no existe
- [ ] Overlay de escaneo con guía visual
- [ ] Parse del payload + validación de versión
- [ ] Manejo de permisos: concedido / denegado / no soportado
- [ ] Entrada manual del código (fallback universal)
- [ ] Feedback háptico + sonoro al detectar
- [ ] Pantalla de confirmación de ubicación ("Usted está en: …")
- [ ] QR inválido → mensaje claro + opción de buscar destino manualmente

**Criterios de aceptación:**

- [ ] Escanea correctamente en Chrome Android, Safari iOS y Firefox
- [ ] El permiso denegado ofrece entrada manual sin romper la app
- [ ] Un QR ajeno (no Milimap) muestra el mensaje correcto
- [ ] La detección ocurre en < 1.5 s con el QR a 30 cm

**Commits:**

```
feat(scanner): add qr scanning with native and wasm fallback detection
feat(scanner): add manual code entry fallback for camera denial
feat(scanner): add scan confirmation screen showing detected location
feat(scanner): handle invalid and outdated qr payloads
```

---

### Fase 6 — Home, eventos y horario del semestre

**Objetivo:** la experiencia completa de entrada y la personalización del estudiante.

**Tareas:**

- [ ] Home con carrusel de eventos especiales (fecha, lugar, "cómo llegar")
- [ ] Banner de anuncios urgentes
- [ ] Tarjeta "Mi horario": clase actual + próxima + botón "Cómo llegar"
- [ ] Selector de programa/grupo con precarga de clases
- [ ] Persistencia en `localStorage` con versionado y migración
- [ ] Export/import del horario personal (JSON)
- [ ] Cálculo de clase actual con zona horaria `America/Bogota`
- [ ] Vista de horario semanal completo
- [ ] Deep links: `/destino/:spaceId`, `/ruta/:origin/:dest`
- [ ] Metadata Open Graph para compartir un destino

**Criterios de aceptación:**

- [ ] Un evento publicado aparece en el home con su fecha
- [ ] "Cómo llegar" desde un evento navega al mapa con origen y destino correctos
- [ ] El horario se mantiene tras recargar la página
- [ ] La clase actual se calcula correctamente a las 09:45 con una clase de 08:00–09:50
- [ ] Cambiar de semestre no rompe el horario guardado (migración)

**Commits:**

```
feat(ui): build home page with events carousel and announcements banner
feat(schedule): add semester schedule catalog and student selection flow
feat(schedule): persist student schedule with versioned local storage
feat(schedule): compute current and next class with bogota timezone
feat(ui): add weekly schedule view
feat(router): add deep links for destinations and routes
```

---

### Fase 7 — Digitalización real de los planos

**Objetivo:** tener el campus de Calle 100 real funcionando. **Fase paralela, no bloquea las anteriores.**

**Tareas:**

- [ ] Inventario de todos los espacios de la sede (hoja de cálculo)
- [ ] Escaneo de planos de cada piso (300 DPI)
- [ ] Definición de escala métrica por piso + verificación
- [ ] Georreferenciación en QGIS
- [ ] Vectorización de espacios, pasillos, puntos verticales
- [ ] Generación de grafo por piso
- [ ] Importación al repo (JSON)
- [ ] Recorrido de verificación en sitio (8–10 pares por piso)
- [ ] Generación e impresión de QRs
- [ ] Instalación física de los QRs

**Criterios de aceptación:**

- [ ] `validate-plans.ts` reporta 0 errores para todos los pisos reales
- [ ] 0 espacios inaccesibles en el campus completo
- [ ] Distancia de rutas dentro de ±15% de la real
- [ ] Todos los QRs impresos escanean correctamente
- [ ] 100% de los espacios del inventario tienen polígono

**Commits:**

```
docs(data): add scanned floor plans and space inventory for calle 100
feat(data): add edificio-a level 1 floor plan with graph
feat(data): add edificio-a level 2 floor plan with graph
feat(data): add edificio-b level 1 floor plan with graph
feat(data): add qr labels for all anchor nodes
fix(data): connect aula 205 to east corridor after field verification
```

---

### Fase 8 — PWA, offline y calidad final

**Objetivo:**app instalable y robusta.

**Tareas:**

- [ ] `manifest.json` + íconos (maskable, 192, 512)
- [ ] Service worker: cache de app shell y de JSON de planos
- [ ] Offline: la app abre y navega dentro del campus sin red
- [ ] Banner de "instalar app"
- [ ] Accesibilidad: contraste AA, navegación por teclado, `aria-live` en la ruta, fuente grande
- [ ] i18n: ES/EN completo
- [ ] Modo de alto contraste
- [ ] E2E tests con Playwright (recorrido crítico: home → QR → destino → ruta)
- [ ] Lighthouse audit (target: 90+ en mobile)
- [ ] Documentación de usuario final (guía en el sitio de la universidad)

**Criterios de aceptación:**

- [ ] La app se instala desde iOS y Android
- [ ] En modo avión, la navegación indoor funciona
- [ ] Lighthouse Performance ≥ 90 en emulación móvil
- [ ] Todo el flujo crítico pasa los tests E2E
- [ ] Sin errores de consola en el flujo principal

**Commits:**

```
feat(pwa): add web app manifest and installable icons
feat(pwa): add service worker for offline floor plan access
feat(a11y): improve contrast keyboard navigation and screen reader labels
feat(i18n): add spanish and english translations
test(e2e): add playwright tests for critical navigation flow
docs: add end user guide for students
```

---

### Fase 9 — Lanzamiento y operación

**Objetivo:** en manos de los estudiantes, con capacidad de evolución.

**Tareas:**

- [ ] Deploy a Vercel con previews por PR
- [ ] Dominio institucional (subdominio de la universidad)
- [ ] Plan de instalación de QRs: inventario, distribución por zona, responsable por edificio
- [ ] Capacitación al equipo de la universidad que administrará el contenido
- [ ] `ADMIN-GUIDE.md` actualizado y video corto
- [ ] Métricas: dashboard de analítica en marcha
- [ ] Formulario de reporte de problemas dentro de la app (para reportar datos incorrectos)
- [ ] Plan de mantenimiento del catálogo de horarios (por semestre)

**Criterios de aceptación:**

- [ ] App en producción con HTTPS
- [ ] QRs instalados en al menos el 80% de los puntos del campus
- [ ] El equipo de la universidad puede crear un evento sin asistencia técnica
- [ ] Sistema de reporte de problemas funcionando

**Commits:**

```
chore(deploy): configure vercel deployment with preview environments
docs: add admin guide for university content managers
feat(ui): add in-app problem reporting for incorrect map data
docs: add qr installation plan and campus rollout checklist
```

---

## 9. Cronograma estimado

| Fase                       | Duración        | Depende de  |
| -------------------------- | --------------- | ----------- |
| 0 — Cimientos              | 1 semana        | —           |
| 1 — Dominio                | 1–2 semanas     | 0           |
| 2 — Admin: contenido       | 2 semanas       | 0           |
| 3 — Admin: editor de mapa  | 2–3 semanas     | 1, 2        |
| 4 — App: mapa              | 2 semanas       | 1           |
| 5 — App: scanner           | 1 semana        | 4           |
| 6 — Home, eventos, horario | 2 semanas       | 2, 4        |
| 7 — Digitalización real    | **4–8 semanas** | 3 (parcial) |
| 8 — PWA y calidad          | 2 semanas       | 4, 5, 6     |
| 9 — Lanzamiento            | 2 semanas       | 7, 8        |

**Camino crítico: Fase 7.** El desarrollo de software puede avanzar en paralelo, pero **la app no es útil sin los planos reales**.

**Estimación realista de 12–18 semanas** con 1 desarrollador a tiempo completo. Con 2 personas, ~9–12 semanas.

---

## 10. Riesgos

| #   | Riesgo                                                  | Prob.       | Impacto | Mitigación                                                                                                                                                                                                                                | Dueño               |
| --- | ------------------------------------------------------- | ----------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| R1  | Los planos no son digitalizables tal cual               | Alta        | Crítico | Procedimiento §7; empezar por 1 piso piloto antes de invertir                                                                                                                                                                             | David + universidad |
| R2  | Falta la escala métrica real                            | Alta        | Alto    | Medir en sitio con cinta métrica ANTES de digitalizar                                                                                                                                                                                     | Universidad         |
| R3  | Divulgación de zonas sensibles (laboratorios, hangares) | Baja        | Crítico | **Mitigado:** campo `restricted` implementado desde el inicio (oculta del mapa público, mantiene en catálogo interno). No hay zonas restringidas en el alcance actual; la capacidad queda lista por si la universidad las designa después | Universidad + dev   |
| R4  | Los horarios cambian cada semestre                      | Alta        | Medio   | Catálogo versionado por término; migración no destructiva                                                                                                                                                                                 | Dev                 |
| R5  | iOS no soporta `BarcodeDetector`                        | **Certeza** | Alto    | `html5-qrcode` WASM como camino principal                                                                                                                                                                                                 | — (resuelto)        |
| R6  | Se subestiman las horas de digitalización               | Alta        | Alto    | Fases 0–6 con datos ficticios; budget explícito para F7                                                                                                                                                                                   | Dev + universidad   |
| R7  | La app se usa solo en la sede Calle 100                 | Media       | Bajo    | Confirmado: alcance es solo Calle 100                                                                                                                                                                                                     | — (resuelto)        |
| R8  | Rutas físicamente imposibles                            | Media       | Crítico | Validación en sitio §7.5 + reporte de problemas                                                                                                                                                                                           | Dev                 |
| R9  | Permisos de cámara en IOS son estrictos                 | Media       | Medio   | Fallback manual siempre disponible                                                                                                                                                                                                        | —                   |
| R10 | El admin no usa el panel y edita JSON a mano            | Media       | Medio   | GitOps tolera ambos flujos; documentar ambos                                                                                                                                                                                              | Dev                 |
| R11 | Soporte y mantenimiento post-lanzamiento                | Media       | Medio   | ADMIN-GUIDE + video + plan de mantenimiento por semestre                                                                                                                                                                                  | Dev + universidad   |

**Sobre R3 (seguridad):** antes de publicar el mapa, revisar con la universidad qué zonas no deben aparecer (laboratorios con equipos sensibles,hangar, bóvedas, salas de calificaciones). Implementar un flag `restricted: true` que oculte esos espacios del mapa público pero los mantenga en el catálogo interno.

---

## 11. Registro de cambios

> **Este documento se actualiza en cada PR que altere el plan.** La última sección es siempre el estado vigente.

### 2026-11-05 — v1.2 — Fase 0 completada

**Contexto:** ejecución de la Fase 0 del plan. Se pidió empezar el desarrollo con
medidas genéricas, documentando todo para trabajo en equipo, con la mira en un MVP
que demuestre funcionalidad sin pretender producción a escala.

**Estado:** Fase 0 cerrada. `lint`, `typecheck`, `test` (21 tests) y `build` en verde;
servidor de desarrollo verificado con HTTP 200.

**Cambios:**

- Repositorio inicializado y vinculado a `DavidCrispoca/Milimap`, rama `main`.
  Excluido del repositorio git del directorio home para evitar contaminación cruzada.
- Scaffold `create-vite` (React 19, TypeScript 7, Vite 8) con dependencias de producto
  (`maplibre-gl`, `html5-qrcode`, `zustand`, `zod`) y de testing.
- Tooling de calidad: oxlint, Prettier, commitlint, husky y lint-staged, con hooks
  `pre-commit`, `commit-msg` y `pre-push`.
- CI en GitHub Actions con 6 pasos de verificación y un job adicional de commitlint
  para PRs. Release Please configurado para versionado automático.
- Documentación para el equipo: `CONTRIBUTING.md`, `ARCHITECTURE.md` (10 ADRs),
  `PLAN-DATA.md` (digitalización de planos a mano) y `ADMIN-GUIDE.md`.
- Código: tipos del dominio en `src/domain/types.ts`, geometría pura en metros con
  21 tests, shell de la app con navegación inferior de 4 pestañas y design tokens.
- `plan.md` movido al repositorio para que su actualización sea parte del PR.

**Desvíos registrados:** oxlint en lugar de ESLint (D1), TypeScript 7 sin `baseUrl` (D2),
`@maplibre/geoman` diferido a Fase 3 (D3), `tools/` sin stubs vacíos (D4), `plan.md`
dentro del repo (D5). Ver sección Fase 0.

**Decisiones pendientes:**

- Herramienta definitiva de vectorización (QGIS vs. web-geojson.io vs. panel admin).
- Escala métrica real por piso.
- Dominio de despliegue.

**Próximos pasos:**

1. Commit inicial y push a `origin/main`.
2. Branch protection en `main` (acción manual en GitHub).
3. Fase 1 — motor de ruteo (Dijkstra multi-nivel) con datos de ejemplo.

---

### 2026-11-05 — v1.1 — Ajustes de alcance y flujo de digitalización

**Contexto:** segunda ronda de decisiones del usuario. Tres puntos: (1) el proyecto es académico y no sale del aula → no requiere licencia; (2) todo se maneja en metros y la escala real se entregará más adelante; (3) no hay zonas restringidas en el alcance actual. Además se pidió aclarar qué debe entregar el usuario en la digitalización.

**Cambios:**

- **§0 / stack:** se elimina la decisión pendiente de licencia. Se documenta explícitamente que el repositorio queda sin licencia por ser un proyecto académico de uso interno.
- **§7.4-bis (nueva):** respuesta directa a la pregunta "¿tengo que entregar un JSON?". **No.** El usuario entrega **GeoJSON de contornos** (o dibuja en el panel admin). El proyecto genera automáticamente el `floor.json`, la grafo, el catálogo y los QRs.
- **§7.4-ter (nueva):** especificación de las 3 capas GeoJSON (espacios, pasillos, verticales) y confirmación de que `id`/`name`/`kind` son opcionales — solo el polígono es obligatorio.
- **§7.4-cuarta (nueva):** alternativa de digitalizar directamente dentro del panel admin (imagen de fondo + Geoman), con recomendación de herramienta según el momento del proyecto.
- **§1 / §7.2.3:** se refuerza que la escala métrica sigue siendo el dato bloqueante y se convierte en acción prioritaria del registro.
- **§3.4:** se mantiene la decisión de que el QR apunte a nodos del grafo, no a coordenadas — así una corrección de geometría no invalida las etiquetas impresas.
- **R3 (riesgo de zonas sensibles):** reclassificado de "probabilidad media" a "mitigado — campo `restricted` implementado desde el inicio, sin zonas que lo usen por ahora".

**Decisiones tomadas:**

- Sin licencia en el repositorio (proyecto académico, uso interno del aula).
- Sistema de unidades: metros en todo el proyecto. El importador acepta metros locales y WGS84.
- Flujo de entrega: geometría cruda en GeoJSON → importación automática. La semántica (nombres, tipos) se completa después en el panel admin.

**Decisiones pendientes:**

- Dominio de despliegue (subdominio institucional vs. personal).
- Herramienta definitiva de vectorización (QGIS vs. web-geojson.io vs. panel admin), que depende del timing respecto a la Fase 3.
- Escala métrica real por piso.

---

### 2026-11-05 — v1.0 — Creación del plan

**Contexto:** solicitud inicial de la aplicación web de navegación indoor para la sede Calle 100 de la UMNG. Segundo pase: se agrega panel de administración, eventos en el home, horario del semestre, integración con el repo `DavidCrispoca/Milimap`, y el procedimiento de digitalización de planos a mano.

**Verificaciones realizadas:**

- Repo `DavidCrisocas/Milimap` verificado vía GitHub API: existe, público, vacío, rama `main`, sin licencia.
- Coordenadas de la sede confirmadas vía Nominatim: `4.6830940, -74.0419430`.
- OSM consultado vía `api.openstreetmap.org/api/0.6/map.json`: 10 vías `building=university`, **0 elementos con tag `level`**, 0 `indoor=room` → **no existe data indoor pública**.
- MapLibre GL JS v6 verificado vía documentación oficial.
- `html5-qrcode` verificado (`/mebjas/html5-qrcode`).
- MapLibre Geoman verificado como plugin de edición compatible con MapLibre.
- Overpass API **no accesible** desde el entorno → se documenta `api.openstreetmap.org` como vía de extracción.

**Decisiones tomadas:**

- Web app (PWA) en vez de React Native — se preserva instalación por QR y deep links.
- MapLibre GL JS en vez de Mapbox — sin token ni licencia.
- Motor de ruteo propio (Dijkstra multi-nivel) en vez de GraphHopper/OpenIndoorMaps — el campus no justifica un motor externo.
- `html5-qrcode` como camino principal de escaneo — `BarcodeDetector` no existe en iOS Safari.
- Coordenadas locales en metros — precisión y legibilidad del diff.
- QR apunta a nodos del grafo, no a coordenadas crudas — evita reimprimir etiquetas.
- GitOps para datos del mapa — versionado, reversible, auditable, contribIBLE.
- Panel admin con MapLibre Geoman + generación automática de grafo — hace viable digitalizar planos a mano.
- Horarios como catálogo público versionado; selección del estudiante local.

**Decisiones pendientes:**

- ~~Licencia del repositorio~~ → **RESUELTO: sin licencia. Proyecto académico interno, no se distribuye fuera del aula.**
- Dominio de despliegue (subdominio institucional vs. personal).
- Modelo de datos de "zonas de interés" y quién las autoriza.
- ~~Si las zonas restringidas (R3) se ocultan o se marcan~~ → **RESUELTO: se implementa el campo `restricted` desde el inicio, pero no hay zonas restringidas en el alcance actual. La capacidad queda lista por si aparece.**
- Escala métrica real por piso → pendiente de datos del usuario.

**Decisiones adicionales (2026-11-05, segunda ronda):**

- **Unidades: todo en metros.** Confirmado por el usuario. La georreferenciación y la vectorización se.Work en metros; el importador acepta tanto metros locales como WGS84 y normaliza.
- **Herramienta de digitalización:** el usuario NO entrega `floor.json`. Entrega **GeoJSON** de contornos (o dibuja en el panel admin cuando exista). El proyecto genera el `floor.json`, la grafo, el catálogo y los QRs automáticamente. Ver §7.4-bis.
- **Los datos del usuario son geometría cruda, no semántica.** El `id`, `name` y `kind` son opcionales en el GeoJSON; el importador genera ids y el panel admin permite renombrar después. Solo el polígono dibujado es obligatorio.

**Próximos pasos:**

1. Fase 0 — Cimientos del repositorio.
2. Solicitar a la universidad: planos originales (PDF/fotos), inventario de espacios con códigos, lista de puntos QR a instalar, catálogo de horarios del término, y confirmación de zonas restringidas.
3. **Preparar una medición métrica de referencia por piso** (un pasillo o ancho de puerta medido con cinta). Es el dato que desbloquea la escala de todo el trabajo de digitalización.
4. Validar el procedimiento deorcamiento con **1 piso piloto** antes de escalar a los demás.

---

## 12. Glosario

| Término                     | Significado                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Piso / Level**            | Planta del edificio. Se modela como un grafo independiente conectado por transiciones.                                                     |
| **Espacio / Space**         | Aula, laboratorio, oficina o zona con identificador propio.                                                                                |
| **Pasillo / Walkway**       | Área transitable. Es la geometría sobre la que se camina.                                                                                  |
| **Nodo / Node**             | Punto de la grafo. Puede estar en un pasillo, en una puerta o en una escalera.                                                             |
| **Arista / Edge**           | Conexión entre dos nodos.                                                                                                                  |
| **Transición / Transition** | Conexión vertical entre pisos (escalera, ascensor, rampa).                                                                                 |
| **Anclaje / Anchor**        | Nodo por el que se llega a un espacio.                                                                                                     |
| **Payload QR**              | Contenido del código QR. Formato `MILIMAP:v1:<edificio>:<piso>:<nodo>`.                                                                    |
| **GitOps**                  | Flujo donde los cambios de datos se aplican vía commit + PR, no escritura directa.                                                         |
| **WGS84**                   | Sistema de coordenadas geográficas por latitud/longitud (EPSG:4326).                                                                       |
| **EPSG:4326**               | Código CRS del datum WGS84.                                                                                                                |
| **GeoJSON**                 | Formato estándar de interchange para geometría geoespacial.                                                                                |
| **Snap**                    | Ajuste automático de un punto a una geometría cercana. Escr 필수 para evitar grietas entre polígonos.                                      |
| **Dijkstra**                | Algoritmo de camino más corto sobre grafo de pesos no negativos.                                                                           |
| **GeoJSON**                 | Formato estándar de intercambio de geometría geoespacial. **Es lo que entrega quien digitaliza**; el proyecto lo convierte a `floor.json`. |

---

## 13. Referencias

- MapLibre GL JS — https://maplibre.org/maplibre-gl-js/docs/
- MapLibre Geoman — https://geoman-io/maplibre-geoman
- html5-qrcode — https://github.com/mebjas/html5-qrcode
- Conventional Commits — https://www.conventionalcommits.org/en/v1.0.0/
- Release Please — https://github.com/googleapis/release-please
- QGIS — https://qgis.org
- Supabase — https://supabase.com/docs
- Vite — https://vite.dev
- OSM API — https://wiki.openstreetmap.org/wiki/API
- MDN: Barcode Detection API — https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API
- OpenIndoorMaps — https://github.com/openindoormaps/openindoormaps
- GraphHopper — https://github.com/graphhopper/graphhopper
