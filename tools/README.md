# `tools/`

Scripts de Node que corren **fuera** de la app (en CI o en la máquina del equipo).
No se importan desde `src/`.

Se ejecutan con `tsx`, que entiende TypeScript sin compilar:

```bash
npx tsx tools/<script>.ts
```

| Script                | Fase | Qué hace                                                                                                                                                                   | Estado    |
| --------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| `validate-plans.ts`   | 1    | Valida coherencia de los `floor.json`: referencias rotas, nodos huérfanos, espacios inalcanzables, pisos sin conexión vertical. Falla con exit code 1 para bloquear el CI. | Pendiente |
| `import-handdrawn.ts` | 3    | Convierte un GeoJSON de contornos (capas `espacios` / `pasillos` / `verticales`) al `floor.json` interno y genera el grafo.                                                | Pendiente |
| `gen-qr.ts`           | 5    | Genera los PNG/SVG de los QR desde el catálogo de nodos ancla, más una plantilla A4 para imprimir.                                                                         | Pendiente |

## Regla de convivencia con `src/`

Los scripts pueden **importar tipos** de `src/domain/` (`import type { Floor } from '../src/domain/types'`),
porque los tipos desaparecen en runtime. Lo que **no** deben hacer es importar
módulos con efectos de React o del navegador.

Esa es la razón por la que `src/domain/` no puede tocar React ni MapLibre: si lo
hiciera, el validador dejaría de poder correr en Node.
