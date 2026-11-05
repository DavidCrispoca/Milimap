# Buzón de planos (`inbox`)

Acá se dejan los GeoJSON que produce el equipo al digitalizar los planos dibujados a mano.

**Nada de esta carpeta se usa todavía en la app.** Es una zona de entrega: los archivos
se revisan, se corrigen y recién entonces se convierten en datos del mapa (Fase 3).

## Estructura

```
src/data/inbox/
└── <edificio>/
    ├── p1.geojson
    ├── p2.geojson
    └── sotano.geojson
```

Un archivo por piso. El nombre del archivo no es importante, pero el nombre de la
carpeta sí: es el edificio.

## Cómo revisar un archivo antes de entregarlo

```bash
npm run inspect:geojson -- src/data/inbox/edificio-a/p1.geojson
```

El inspector reporta:

- cuántos espacios, pasillos y puntos verticales hay,
- el área de cada polígono (para detectar dibujos enanos o gigantes),
- si falta `id`, `name` o `code`,
- si las coordenadas parecen metros o grados,
- y el tamaño de la huella del edificio, para detectar errores de escala.

Si devuelve **errores**, el archivo no está listo. Si solo devuelve advertencias, se
puede entregar y los nombres se completan después.

## Hay un ejemplo funcionando

`ejemplo/edificio-ejemplo-p1.geojson` es un archivo válido y mínimo. **Se puede copiar
como plantilla** y reemplazar los polígonos por los reales.

```bash
npm run inspect:geojson -- src/data/inbox/ejemplo/edificio-ejemplo-p1.geojson
```

## Recordatorio

Las coordenadas se expresan en **metros**, con origen en una esquina del edificio.
Los detalles están en [`docs/PLAN-DATA.md`](../../../docs/PLAN-DATA.md).
