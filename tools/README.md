# `tools/`

Scripts de Node que corren **fuera** de la app (en CI o en la máquina del equipo).
No se importan desde `src/`.

Se ejecutan con `tsx`, que entiende TypeScript sin compilar:

```bash
npx tsx tools/<script>.ts
```

| Script                | Fase | Qué hace                                                                                                             | Estado    |
| --------------------- | ---- | -------------------------------------------------------------------------------------------------------------------- | --------- |
| `validate-plans.ts`   | 1    | Valida el grafo del campus: referencias rotas, nodos huérfanos, espacios inalcanzables, pisos sin conexión vertical. | ✅ Listo  |
| `inspect-geojson.ts`  | 1    | Revisa un GeoJSON del equipo antes de entregarlo: capas, áreas, propiedades faltantes, unidades y escala.            | ✅ Listo  |
| `import-handdrawn.ts` | 3    | Convierte el GeoJSON al `floor.json` interno y genera el grafo automáticamente.                                      | Pendiente |
| `generate-qrs.ts`     | 5    | Genera los PNG de QR de los puntos principales, una hoja HTML imprimible y un CSV, validando cada payload.           | ✅ Listo  |

## Uso

```bash
npm run validate:plans
npm run inspect:geojson -- src/data/inbox/edificio-a/p1.geojson
npm run gen:qr
npm run gen:qr -- --base-url=https://usuario.github.io/Milimap/
```

Los dos primeros devuelven **exit code 1** si hay errores, para que el CI bloquee el
merge. `gen:qr` también falla si un código generado no resolvería en la app.

## Regla de convivencia con `src/`

Los scripts pueden **importar código y tipos** de `src/domain/`, porque ese módulo no
tiene dependencias de navegador. Lo que **no** deben hacer es importar nada de `src/ui/`
ni de `src/map/`.

Esa es la razón por la que `src/domain/` no puede tocar React ni MapLibre: si lo
hiciera, estos scripts dejarían de poder correr en Node.
