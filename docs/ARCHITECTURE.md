# Arquitectura

Decisiones de diseño y, sobre todo, **por qué**. Si algo acá te parece raro, la
explicación está pensada para que puedas discutirla con argumentos, no para que la
aceptes.

---

## 1. Vista general

```
┌─────────────────────────────────────────────┐
│  UI (React)                                 │
│  src/ui, src/App.tsx                        │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  Capas de producto                          │
│  src/map      MapLibre: render               │
│  src/scanner  html5-qrcode: lectura QR       │
│  src/schedule Horario del estudiante         │
│  src/admin    Panel de administración        │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  DOMINIO (lógica pura, sin frameworks)       │
│  src/domain: tipos, geometría, grafo, ruteo  │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│  DATOS                                       │
│  src/data: JSON versionados en git           │
└─────────────────────────────────────────────┘
```

### La regla de dependencia

Las flechas apuntan **hacia el dominio, nunca al revés**.

`src/domain/` no importa React, MapLibre ni Supabase. Consecuencias concretas:

1. El motor de ruteo se testea en Node puro, sin DOM, en milisegundos.
2. Un script de CI puede validar los planos sin levantar un navegador.
3. Si mañana se hace una app nativa, `domain/` se reutiliza tal cual.

Si te encontrás queriendo importar React dentro de `domain/`, el código pertenece a
otra capa. No rompas la regla: movelo.

---

## 2. Decisiones

### ADR-001 — Web app (PWA), no React Native

**Decisión:** React + Vite, servida como PWA instalable.

**Por qué:** el requisito es "aplicación web para dispositivos móviles". Con React
Native se pierden tres cosas que son centrales acá:

- **Instalación por QR.** El usuario escanea un QR con la cámara del sistema y ya está
  usando la app. Con una app nativa necesita pasar por una tienda.
- **Deep links por URL.** "Mandame el link del Aula 305" funciona con una URL.
- **Actualización instantánea.** Corregir un salón en el mapa es un deploy, no una
  revisión de tienda.

Costo: no hay acceso a APIs nativas. Para este alcance (mapa, cámara, geolocalización
opcional) la web alcanza.

### ADR-002 — MapLibre GL JS, no Mapbox ni Leaflet

**Decisión:** MapLibre GL JS 6.

**Por qué:**

- **Contra Mapbox:** requiere token y licencia comercial. MapLibre es el fork open
  source del proyecto original, con la misma API.
- **Contra Leaflet:** renderiza canvas/DOM, no WebGL. Para capas de piso, polígonos y
  rutas con muchos vértices, MapLibre escala mejor en teléfonos de gama media.
- **A favor:** fuentes GeoJSON con `setData`, capas `fill`/`line`, control de cámara
  con `fitBounds`/`flyTo`, `pitch` y `bearing`.

### ADR-003 — Coordenadas locales en metros

**Decisión:** toda la geometría interna en metros, con origen local por edificio.
La conversión a WGS84 ocurre solo en el borde, al alimentar MapLibre.

**Por qué:** un piso mide ~50 × 30 m. En grados, dos puntos a 2 m de distancia difieren
en ~1.8e-5. Ese valor se pierde a precisión float32 en los buffers de vértices de la
GPU: el mapa "se pega" o aparecen artefactos.

Con metros locales:

- Precisión de sobra (0.001 m).
- La distancia de caminata es `hypot(dx, dy)`, sin conversiones.
- El diff de un cambio de plano se lee como un cambio de plano.
- El origen del edificio (`BuildingOrigin.lat/lng/rotation`) concentra el error de
  georreferenciación en un solo lugar.

### ADR-004 — Ruteo propio (Dijkstra), no GraphHopper

**Decisión:** implementar el grafo y el algoritmo en TypeScript.

**Por qué:** GraphHopper es un motor para red vial de OpenStreetMap. Sirve para rutas
entre ciudades, no para grafos indoor de ~100 nodos por piso. Montarlo implicaría:

- Un servicio Java corriendo.
- Latencia de red por cada ruta.
- Un modelo de datos distinto al nuestro, con traducción en el medio.

Dijkstra sobre un grafo de este tamaño resuelve en microsegundos **en el cliente**, sin
backend, y funciona offline. A\* no aporta: la heurística no compensa en grafos tan
chicos, y hace el código más difícil de verificar.

**Penalizaciones** (para que la ruta sea la que un humano tomaría):

| Tipo                      | Peso                                      |
| ------------------------- | ----------------------------------------- |
| `walkway`, `door`, `ramp` | distancia real                            |
| `stair`                   | distancia × 1.4                           |
| `elevator`                | distancia × 1.2 + 15 s de espera (≈ 21 m) |

**Comportamiento real, verificado en la demo:** para un cambio de un solo piso gana la
**escalera**, porque la espera del ascensor pesa más que el esfuerzo de subir. Eso es lo
que hace la gente.

La ruta accesible se pide explícitamente con `avoidStairs: true`; no es una preferencia
silenciosa del algoritmo. Un ruteo que siempre manda al ascensor sería peor experiencia
y además más lento.

Los valores viven en `src/domain/profile.ts` y son tuneables. La calibración definitiva
se hace después de caminar el campus real con cronómetro.

### ADR-005 — El QR apunta a un nodo, no a una coordenada

**Decisión:** payload `MILIMAP:v1:EDIFICIO-A:P1:N12`.

**Por qué:** si el QR guardara lat/lng y hubiera que corregir un metro de la posición,
habría que **reimprimir todas las etiquetas** (200 stickers). Apuntando a un nodo del
grafo, se corrige el JSON, se commitea, y los stickers impresos siguen funcionando.

Es la decisión con mejor relación beneficio/costo de todo el diseño.

### ADR-006 — Datos del mapa en Git (GitOps), no en base de datos

**Decisión:** los `floor.json` viven en el repo. El admin publica generando commit + PR.

**Por qué:**

- **Reversible:** `git revert` es un rollback perfecto y barato.
- **Auditable:** quién cambió qué y cuándo, con diff.
- **Contribuible:** la universidad puede recibir correcciones de cualquiera con un PR.
- **Sin backend propio:** el MVP no necesita servidor.

**Excepción:** analítica y eventos de escaneo sí van a Supabase. Son datos voluminosos,
de escritura continua, que no se leen ni se editan a mano.

### ADR-007 — html5-qrcode como camino principal

**Decisión:** `html5-qrcode` con detección nativa opcional.

**Por qué:** la `BarcodeDetector` API **no existe en iOS Safari ni en Firefox**. Solo
Chrome y Android la tienen. Usarla como camino principal rompe la app en iPhone.

`html5-qrcode` trae respaldo WASM (ZXing) y funciona en todos. La estrategia es:
usar `BarcodeDetector` si está disponible (más rápido), y caer a WASM si no.

**Siempre hay entrada manual del código.** Si el usuario negó el permiso de cámara, la
app no se queda sin salida.

### ADR-008 — Zod para validar datos

**Decisión:** esquemas Zod en el borde de los datos.

**Por qué:** los `floor.json` los escribe un humano (o un script). Un error de tipeo en
una referencia deja un salón inalcanzable y la app no falla ruidosamente: simplemente
no encuentra ruta. Zod convierte ese fallo silencioso en un error explícito en CI.

### ADR-009 — oxlint en lugar de ESLint

**Decisión:** oxlint (el default de `create-vite` actual).

**Por qué:** es órdenes de magnitud más rápido y no requiere configurar un ecosistema de
plugins. Contra: no hace linting con información de tipos.

**Consecuencia:** los errores de tipo son responsabilidad exclusiva de `tsc`. Por eso el
CI corre `typecheck` como paso separado y no negociable — no confiamos en el linter para
eso.

### ADR-010 — Sin router en la Fase 0

**Decisión:** navegación por estado local.

**Por qué:** hay 4 pantallas y ninguna necesita URL propia todavía. Agregar un router
ahora es una dependencia sin consumidor.

**Cuándo cambia:** Fase 6, cuando aparecen `/destino/:spaceId` y `/ruta/:origen/:destino`,
que son requisito para compartir un destino por WhatsApp.

**Nota (Fase 2):** `/admin` se resuelve con un chequeo de `window.location.pathname`
en `Root.tsx`, sin router. Es una excepción deliberada y mínima: una sola ruta, sin
parámetros. El router sigue entrando en la Fase 6.

**Cierre (Fase 6, 2026-11-10):** sustituido por ADR-013. El router de hash ya existe
(`src/router.ts`) y cubre las rutas del estudiante, incluidos los deep links de QR.
`/admin` sigue resolviéndose por `pathname`: una sola ruta, sin parámetros.

### ADR-011 — Persistencia de contenido en el navegador (Fase 2)

**Decisión:** el contenido administrable (eventos, anuncios, horarios, ediciones de
espacios) se guarda en `localStorage` mediante un store de Zustand con `persist`.

**Por qué:**

- El único proyecto de Supabase disponible en la cuenta pertenece a otro producto
  (`marketinghub`). Crear tablas ahí sería tomar una decisión sobre una base ajena.
- Un MVP académico necesita demostrar el flujo completo sin infraestructura.
- El store se diseña como un repositorio: toda mutación pasa por una acción, y la UI no
  lee `localStorage` directamente. Cambiar a Supabase implica reimplementar las acciones,
  no reescribir las pantallas.

**Costo asumido:** no hay edición concurrente entre personas, ni auditoría, ni
sincronización entre dispositivos. "Publicado" significa "publicado en este navegador".
Esto se advierte en la interfaz.

### ADR-012 — Roles y permisos aplicados en dos capas (Fase 2)

**Decisión:** tres roles (`admin`, `editor`, `viewer`) definidos en una matriz única
(`src/content/permissions.ts`). La interfaz oculta o deshabilita controles con `can()`,
y el store vuelve a verificar el permiso antes de mutar.

| Acción                                       | admin | editor | viewer |
| -------------------------------------------- | ----- | ------ | ------ |
| Crear y editar eventos y anuncios (borrador) | ✅    | ✅     | ❌     |
| Publicar eventos y anuncios                  | ✅    | ❌     | ❌     |
| Editar nombre, alias y estado de espacios    | ✅    | ✅     | ❌     |
| Importar horarios                            | ✅    | ✅     | ❌     |
| Restablecer contenido de demostración        | ✅    | ❌     | ❌     |

**Por qué dos capas:** la verificación solo en la UI se puede saltear desde la consola
del navegador. La verificación en el store es la que protege los datos, aunque hoy esté
en el cliente. Cuando exista backend, la misma matriz se traduce a políticas RLS.

**Rol no persistido:** el rol vive solo en la sesión. Si se guardara en `localStorage`,
un navegador cerrado conservaría los permisos de administrador.

**Limitación explícita:** el acceso por rol no tiene contraseña. Es suficiente para
demostrar el flujo y para separar responsabilidades dentro del equipo; no es seguridad
frente a alguien con acceso al navegador.

---

### ADR-013 — Router de hash (Fase 6) — sustituye la parte "sin router" de ADR-010

**Decisión:** navegación con un router de hash propio (`src/router.ts`, ~100 líneas):
`#/`, `#/mapa`, `#/escanear`, `#/horario`, `#/destino/:spaceId`,
`#/ruta/:origen/:destino`, `#/qr/:payload`. Acepta alias en inglés
(`#/map`, `#/scan`, …).

**Por qué ahora:** la Fase 6 necesita URLs compartibles (QRs impresos que apuntan a
`#/qr/<payload>`, "compartir destino") y deep links que sobrevivan una recarga.

**Por qué hash y no History API:** la app es una PWA estática que se sirve de
cualquier host (Vercel, Cloudflare tunnel, `vite preview`). El hash funciona sin
reglas de reescritura del servidor; `history.pushState` exigiría configurarlas en
cada host de demo.

**Por qué propio y no React Router:** 7 rutas planas sin layouts anidados ni
parámetros de búsqueda. Un `switch` sobre el hash parseado es todo lo necesario, con
tests de ida y vuelta (`src/router.test.ts`). Si aparecen rutas anidadas, se migra.

**Estado:** adoptado en la Fase 6 (2026-11-10).

---

### ADR-014 — Analítica en Supabase compartido, aislada por prefijo (Fase 5/6)

**Decisión:** los eventos de uso (escaneos, búsquedas, rutas, aperturas, selección de
horario) se escriben en `public.milimap_analytics_events` del proyecto Supabase
**existente** (`marketinghub`), no en un proyecto nuevo.

**Aislamiento:** el proyecto pertenece a otro producto con 29 tablas propias en
`public`. Milimap no toca nada de eso: su única tabla usa el prefijo `milimap_` y las
tablas nuevas que lleguen (contenido, horarios) harán lo mismo. Nunca se crea algo sin
prefijo.

**Cliente propio, no `@supabase/supabase-js`:** la app solo hace writes append-only a
PostgREST. Un `fetch` con la clave anónima evita ~40 kB de SDK en el bundle del
estudiante.

**Fire-and-forget:** las escrituras nunca bloquean ni rompen la UI: si no hay
configuración (`.env.local` ausente) o falla la red, el evento se descarta en silencio
(`console.debug`). La analítica jamás tiene prioridad sobre la navegación.

**Seguridad (MVP):** RLS con `insert`/`select` para `anon`. Sin autenticación real
todavía: cualquier visitante puede leer los eventos. Aceptado para el MVP académico y
documentado como **no apto para producción**; cuando haya login institucional, el
`select` se restringe a roles de administración.

**Clave:** se usa la clave `anon` (JWT legacy) como Bearer; la clave
`sb_publishable_` nueva no es un JWT y PostgREST la rechaza. Ambas son públicas por
diseño; el alcance real lo da RLS.

**Estado:** adoptado en las Fases 5–6 (2026-11-10); verificado end-to-end (HTTP 201,
fila visible).

---

## 3. Flujo de datos

### Al renderizar el mapa

```
floor.json (metros locales)
   → [domain/geo] proyectar a WGS84 con BuildingOrigin
   → GeoJSON FeatureCollection
   → MapLibre source
   → MapLibre layer
```

### Al calcular una ruta

```
QR escaneado → payload → nodeId de origen
Catálogo     → espacio  → anchorNodeId de destino
   → [domain/graph] Dijkstra multi-piso
   → Route { steps[], nodeIds[], totalMeters }
   → [domain/steps] instrucciones en español/inglés
   → UI + línea en el mapa
```

### Al editar el mapa (Fase 3)

```
Admin dibuja en Geoman
   → [domain/validate] validación en vivo
   → floor.json actualizado
   → commit + PR
   → CI valida
   → merge → deploy
```

---

## 4. Estructura de un piso

Un `Floor` contiene tres cosas que parecen similares pero no lo son:

| Campo             | Qué es                       | Para qué sirve                        |
| ----------------- | ---------------------------- | ------------------------------------- |
| `spaces`          | Polígonos de aulas y zonas   | **Dibujar** y para el buscador        |
| `walkways`        | Polígonos de pasillos        | **Dibujar** la superficie transitable |
| `nodes` / `edges` | Grafo de puntos y conexiones | **Calcular** la ruta                  |
| `transitions`     | Conexiones verticales        | **Cruzar** entre pisos                |

**El grafo no se dibuja: se calcula.** Se deriva de los polígonos (puntos medios de los
lados compartidos entre aula y pasillo). Por eso el admin solo dibuja espacios y
pasillos, y el grafo aparece solo.

Esto es lo que hace viable digitalizar planos a mano: dibujar 40 polígonos en vez de
colocar 200 nodos a mano.

---

## 5. Lo que NO es este proyecto

Para evitar expectativas equivocadas:

- **No es geolocalización GPS.** El GPS no funciona adentro de un edificio. La posición
  del usuario viene del QR que escanea, no del satélite.
- **No es realidad aumentada.** Es un mapa 2D cenital.
- **No es un sistema de reservas de salones.**
- **No sincroniza entre dispositivos** en el MVP: el horario vive en `localStorage`.
- **No cubre otras sedes.** Solo Calle 100.
