# Cómo convertir un plano dibujado a mano en datos de Milimap

Esta guía es para quien va a digitalizar el campus. **No hace falta saber programar.**
Hace falta ser meticuloso.

Al final del proceso hay un archivo que la app entiende. El objetivo es que ese archivo
sea **correcto**, no que el dibujo sea bonito.

---

## 0. La idea en una frase

> Digitalizar no es **dibujar** el plano otra vez. Es **extraer la topología**: qué
> espacios existen, cómo se conectan, y por dónde se camina.

Un plano a mano tiene muchísimo detalle que a la app no le sirve: muebles, texturas,
anotaciones, hidrantes, la posición de los árboles. Solo interesan **tres cosas**:

1. El **contorno** de cada espacio (aula, laboratorio, oficina, baño).
2. El **área transitable** (los pasillos).
3. Los **puntos de conexión vertical** (escaleras, ascensores).

Todo lo demás se descarta. Intentar replicarlo todo es la forma más rápida de no
terminar nunca.

---

## 1. Antes de tocar la computadora

### 1.1 Escanear

- **300 DPI mínimo.** Menos que eso y los números de aula no se leen.
- Escala de grises o color, PNG sin pérdida (no JPG: el JPG mete artefactos en las líneas).
- Si el plano no entra en una hoja: escanear en cuadrícula de 2×2 o 3×3, con 2 cm de
  solapamiento entre partes, y unir después.
- **Verificación:** al 100% de zoom, el número de cada salón debe leerse sin esfuerzo.

### 1.2 Corregir la perspectiva

Si es una foto y no un escaneo, la imagen va a estar torcida. Ajustala antes de
digitalizar, o las líneas no van a ser paralelas a los bordes:

- Abrir en cualquier editor de imágenes.
- Aplicar _Transformar → Perspectiva_.
- Arrastrar los 4 vértices del plano hasta las esquinas de la imagen.
- **Criterio de aceptación:** las líneas de los muros quedan paralelas a los bordes.

### 1.3 Definir la escala — **el paso más importante**

Sin escala real, todas las distancias que muestra la app son mentiras. Es el error que
más se subestima.

**Qué hacer:**

1. Ir al edificio con una cinta métrica.
2. Medir **una** longitud conocida y fácil de identificar en el plano:
   - Un pasillo largo, de muro a muro.
   - El ancho de una puerta (una puerta estándar mide ~0.90 m).
   - El ancho de un aula.
3. Anotar: _"el pasillo del piso 1, entre la escalera y el aula 105, mide 18.4 m"_.
4. Si se puede, medir **dos** longitudes en direcciones distintas (horizontal y
   vertical). Dos medidas detectan si el escaneo está estirado.

**Este dato se guarda y se usa después.** Sin él no se puede seguir.

### 1.4 Inventario de espacios

Una hoja de cálculo (Excel, Google Sheets) con una fila por espacio:

| código  | nombre                | tipo       | capacidad | piso | observaciones      |
| ------- | --------------------- | ---------- | --------- | ---- | ------------------ |
| A101    | Aula 101              | classroom  | 40        | 1    | tiene proyector    |
| A102    | Aula 102              | classroom  | 35        | 1    |                    |
| LAB-FIS | Laboratorio de Física | laboratory | 25        | 2    | acceso restringido |
| BIB     | Biblioteca            | common     | —         | 1    |                    |

**Esto es la lista de verificación.** Al final, cada fila debe tener su polígono
dibujado. Si una fila no lo tiene, falta trabajo.

### 1.5 Mapa de niveles

Otra hoja, una fila por piso:

| código | nombre   | nivel | edificio   |
| ------ | -------- | ----- | ---------- |
| P1     | Piso 1   | 1     | Edificio A |
| P2     | Piso 2   | 2     | Edificio A |
| S1     | Sótano 1 | -1    | Edificio A |

**Incluir sótanos.** Un sótano suele tener laboratorios y bodegas que la gente necesita
encontrar.

### 1.6 Marcar las conexiones verticales

En cada plano, marcar con un símbolo y un **código**:

- `ESC-A` — escalera A
- `ASC-A` — ascensor A
- `RAMPA-1` — rampa

**Regla crítica:** la escalera del piso 1 y la escalera del piso 2 que están una arriba
de la otra **llevan el mismo código**. La correspondencia entre pisos se define por
código, no por posición en la imagen.

¿Por qué? Porque dos escaneos distintos pueden tener escalas ligeramente diferentes. Si
la unión dependiera de que los píxeles coincidan, cualquier diferencia rompe la ruta. Con
un código, no.

### 1.7 Marcar entradas y puntos de QR

Anotar en el plano:

- **Entradas:** principal, peatonales, desde parqueadero, acceso de servicio.
- **Puntos QR propuestos:** entradas, esquinas de pasillo, antes de escaleras y
  ascensores, junto a recepción, puerta de auditorios.

Los QR van donde alguien se pregunta _"¿y ahora para dónde?"_.

---

## 2. Digitalizar (la parte técnica)

Hay tres caminos. Elegí según el momento del proyecto.

### Opción A — QGIS (recomendada si el panel admin todavía no existe)

QGIS es gratis, de escritorio, y —esto es lo que importa— **tiene snapping y control de
topología**.

**Por qué el snapping es crítico:** si dos polígonos que comparten un muro quedan con
los vértices separados por un píxel, aparece una "grieta". El generador de grafo no
detecta que el aula toca el pasillo, el aula queda **inalcanzable**, y hay que corregir
todo. Con snapping, los vértices se pegan solos y la grieta no existe.

**Paso a paso:**

1. Descargar QGIS desde <https://qgis.org>.
2. Proyecto nuevo. **CRS: EPSG:4326 (WGS 84)**.
3. _Raster → Georreferenciador_: cargar el plano escaneado.
   - Poner 4 puntos de control en las esquinas del edificio, con sus coordenadas reales
     (se sacan de Google Maps o del mapa de OpenStreetMap).
   - Poner 2 puntos más sobre la medida de escala del paso 1.3.
   - Transformación: _Thin Plate Spline_ (corrige mejor la distorsión del escaneo que
     _Affine_).
   - **Verificar:** la distancia entre los puntos de escala debe coincidir con la medida
     real, ±5%. Si no coincide, el georreferenciado está mal.
4. Crear las capas (todas Polygon excepto donde se indique):
   - `espacios`
   - `pasillos`
   - `verticales` — **Point**
5. **Activar snapping**: `Proyecto → Propiedades → Snapping`, tolerancia 8 px, y
   activar también el snapping entre capas.
6. Digitalizar los espacios:
   - Capa `espacios` → _Añadir entidad polígono_.
   - Trazar el contorno **interior** del aula, siguiendo el muro por dentro.
   - Rellenar atributos: `id`, `name`, `kind`, `capacity`, `floor`.
7. Digitalizar los pasillos:
   - Un pasillo = **el área donde se camina**, no el muro.
   - Si el pasillo tiene 3 m de ancho, el polígono tiene 3 m de ancho.
8. Marcar los puntos verticales (`verticales`):
   - Un punto por escalera/ascensor, con atributo `code` (`ESC-A`) y `type`
     (`stairs`/`elevator`/`ramp`).
9. **Verificar geometría:** `Vectorial → Herramientas de geometría → Comprobar validez`.
   Debe dar **0 errores**. Un polígono auto-intersectado rompe la detección de
   adyacencia.
10. Exportar: click derecho en cada capa → _Exportar → Guardar entidades como…_ →
    formato **GeoJSON**, CRS EPSG:4326.

### Opción B — web-geojson.io (más simple, sin instalar nada)

<https://geojson.io> — en el navegador.

- Traza polígonos directamente sobre la imagen (se puede cargar como referencia).
- Tiene snapping más limitado que QGIS.
- Exporta GeoJSON desde el propio sitio.

Sirve para empezar rápido. Para un campus entero, QGIS es mejor.

### Opción C — el panel de administración (cuando exista, Fase 3)

La mejor opción una vez construida: se sube el plano como imagen de fondo, se dibuja
encima con las herramientas integradas, y **valida en vivo** mientras se dibuja. Sin
conversión de formatos, sin instalar nada.

Ventaja frente a QGIS: los errores aparecen mientras trabajás, no tres horas después.

---

## 3. El formato que se entrega

Se entrega **GeoJSON**. No hace falta armar el JSON interno del proyecto: eso lo hace
el importador.

### Estructura

Un archivo por piso, o uno solo con todas las capas adentro:

```jsonc
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "layer": "espacios",
        "id": "A101",
        "name": "Aula 101",
        "kind": "classroom",
        "capacity": 40,
        "floor": "P1",
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [-74.0419, 4.6831],
            [-74.0418, 4.6831],
            [-74.0418, 4.6832],
            [-74.0419, 4.6832],
            [-74.0419, 4.6831],
          ],
        ],
      },
    },
    {
      "type": "Feature",
      "properties": { "layer": "pasillos", "id": "W-P1-NORTE" },
      "geometry": { "type": "Polygon", "coordinates": [[/* ... */]] },
    },
    {
      "type": "Feature",
      "properties": { "layer": "verticales", "id": "ESC-A", "code": "ESC-A", "type": "stairs" },
      "geometry": { "type": "Point", "coordinates": [-74.04185, 4.68315] },
    },
  ],
}
```

### Qué es obligatorio y qué no

| Campo               | ¿Obligatorio? | Nota                                                 |
| ------------------- | ------------- | ---------------------------------------------------- |
| `geometry`          | **Sí**        | El polígono o punto. Es el trabajo real.             |
| `layer`             | **Sí**        | `espacios`, `pasillos` o `verticales`.               |
| `id`                | No            | Si falta, el importador genera `esp-001`, `esp-002`… |
| `name`              | No            | Se completa después en el panel admin.               |
| `kind`              | No            | Por defecto `classroom` para espacios.               |
| `capacity`          | No            | Informativo.                                         |
| `code` (verticales) | **Sí**        | Es lo que une los pisos entre sí.                    |

**Se puede entregar geometría cruda y completar los nombres después.** Eso permite
avanzar sin frenar por la semántica.

### Unidades

- **Preferido: metros locales.** Origen en la esquina del edificio, `x` hacia el este,
  `y` hacia el norte. Es el sistema interno del proyecto y no requiere conversión.
- **También se acepta: WGS84** (grados, como los exporta QGIS). El importador detecta
  el rango de coordenadas y convierte.

Si tenés dudas, exportá en WGS84 como sale por defecto de QGIS. Se normaliza solo.

---

## 4. Verificar en el campus (no saltear)

Digitalizar sin verificar es dibujar, no mapear. Esta fase es la que convierte un
archivo en un mapa que funciona.

1. **Elegir 8–10 rutas de prueba** que cubran:
   - Mismo piso.
   - Pisos adyacentes (escalera).
   - Piso bajo → piso alto.
   - Una ruta con ascensor y otra sin.
   - Un destino en un extremo del edificio.
2. **Medir en el sitio**: distancia real y tiempo real de caminata.
3. **Comparar con lo que genera la app** (el validador imprime estos números).
4. **Tolerancia objetivo:**
   - Distancia: **±15%**
   - Tiempo: **±25%**
5. **Recorrer una muestra de espacios** para confirmar que todos existen y son
   alcanzables.
6. **Escanear los primeros QR instalados** y confirmar que cada uno lleva al nodo
   correcto.

### Cómo registrar los problemas

Un issue de GitHub por corrección, con el formato:

```
Título: Aula 205 no conecta con el pasillo este

En el piso 2, el aula 205 aparece como inalcanzable.
Al revisar, el muro este tiene puerta en el plano pero no está
marcada como paso en el polígono.

Pasos: abrir la app → escanear QR de escalera P2 → buscar "Aula 205"
Esperado: ruta de 22 m
Obtenido: "no se encontró ruta"
```

Ese nivel de detalle permite corregirlo sin volver al edificio.

---

## 5. Checklist por piso

Copiar y marcar antes de dar un piso por terminado:

```
[ ] Plano escaneado a 300 DPI, legible al 100%
[ ] Perspectiva corregida (líneas paralelas a los bordes)
[ ] Escala medida en sitio y anotada
[ ] Georreferenciado verificado (±5%)
[ ] Inventario de espacios completo (una fila por aula)
[ ] Todos los espacios del inventario tienen polígono
[ ] Pasillos dibujados como área transitable
[ ] Comprobar validez: 0 errores
[ ] Puntos verticales con código (ESC-A, ASC-A)
[ ] Los códigos coinciden entre pisos conectados
[ ] Grafo generado sin errores
[ ] 0 espacios inalcanzables
[ ] Recorrido de verificación en sitio hecho
[ ] Distancias dentro de ±15%
[ ] QR generados e instalados
[ ] Commit: feat(data): add <edificio> level <n> floor plan
```

---

## 6. Cuánto tiempo toma

| Complejidad | Pisos | Espacios | Horas estimadas |
| ----------- | ----- | -------- | --------------- |
| Sencillo    | 1     | ~10      | 3–4 h           |
| Mediano     | 3     | ~30      | 8–12 h          |
| Complejo    | 5+    | 60+      | 20–30 h         |

**Para la Sede Calle 100 completa** (~96 aulas más auditorios y zonas comunes,
distribuidas en varios edificios): **60–100 horas** de digitalización más **15–20 horas**
de verificación en sitio.

Ese es el camino crítico del proyecto. El software puede avanzar en paralelo, pero la
app no sirve sin los planos.

---

## 7. Errores comunes

| Error                                  | Consecuencia                          | Cómo evitarlo                     |
| -------------------------------------- | ------------------------------------- | --------------------------------- |
| Dibujar sin snapping                   | Aulas inalcanzables                   | Activar snapping                  |
| No medir escala                        | Distancias falsas                     | Medir con cinta antes             |
| Polígonos auto-intersectados           | Detección de adyacencia rota          | _Comprobar validez_               |
| Pasillo dibujado sobre el muro         | La ruta pasa por adentro de una pared | Dibujar el área transitable       |
| Códigos de escalera distintos por piso | No se puede cambiar de piso           | Mismo código en todos los niveles |
| Escanear a 150 DPI                     | Números ilegibles                     | 300 DPI                           |
| Digitalizar los 5 pisos de una         | Errores repetidos 5 veces             | Hacer 1 piso piloto y validar     |
| Olvidar el sótano                      | Laboratorios inencontrables           | Incluir todos los niveles         |

---

## 8. Preguntas frecuentes

**¿Tengo que dibujar los muebles, puertas y ventanas?**
No. Solo el contorno de los espacios, el área de los pasillos, y los puntos de escalera
y ascensor.

**¿Y si el plano está mal (un aula que ya no existe)?**
Digitalizá lo que hay hoy, no lo que dice el plano. El plano es una guía, el edificio es
la verdad.

**¿Puedo digitalizar pisos en paralelo con otra persona?**
Sí, un piso por persona. Coordinen los **códigos de escalera y ascensor** antes de
empezar: si dos personas usan códigos distintos para la misma escalera, no se unen.

**¿Qué pasa si me equivoco después de publicar?**
Se corrige el JSON, se commitea, y todos los QR siguen funcionando. Por eso los QR
apuntan a nodos y no a coordenadas.

**¿Necesito saber GIS?**
No para la Opción B o C. Para QGIS, alcanza con seguir los pasos de esta guía.
