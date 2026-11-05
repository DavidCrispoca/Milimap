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
| `gen-qr.ts`           | 5    | Genera los PNG/SVG de los QR desde el catálogo de nodos ancla, más una plantilla A4 para imprimir.                   | Pendiente |

## Uso

```bash
npm run validate:plans
npm run inspect:geojson -- src/data/inbox/edificio-a/p1.geojson
```

Ambos devuelven **exit code 1** si hay errores, así el CI puede bloquear el merge.

## Regla de convivencia con `src/`

Los scripts pueden **importar código y tipos** de `src/domain/`, porque ese módulo no
tiene dependencias de navegador. Lo que **no** deben hacer es importar nada de `src/ui/`
ni de `src/map/`.

Esa es la razón por la que `src/domain/` no puede tocar React ni MapLibre: si lo
hiciera, estos scripts dejarían de poder correr en Node.
