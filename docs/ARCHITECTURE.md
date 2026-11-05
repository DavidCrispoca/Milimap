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
