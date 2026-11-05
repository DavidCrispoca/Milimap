# Guía de contribución

Este documento es obligatorio para todo el equipo. El objetivo no es burocracia: es
que dentro de dos meses alguien pueda entender **qué** cambió **por qué** leyendo el
historial de git, y que el CI no se convierta en un juego de ruleta.

---

## 1. Preparación del entorno

```bash
npm install     # instala dependencias Y los hooks de git
npm run dev
```

`npm install` corre `husky` (script `prepare`). Si los hooks no se instalaron:

```bash
npm run prepare
```

Verificación rápida de que todo funciona antes de tocar código:

```bash
npm run lint && npm run typecheck && npm test
```

---

## 2. Convención de commits

Formato: **`tipo(scope): descripción`**

### Tipos

| Tipo       | Cuándo usarlo                                  | Versión (SemVer) |
| ---------- | ---------------------------------------------- | ---------------- |
| `feat`     | Funcionalidad nueva visible para el usuario    | MINOR            |
| `fix`      | Corrección de un bug                           | PATCH            |
| `refactor` | Reordenar código sin cambiar comportamiento    | —                |
| `perf`     | Mejora de rendimiento                          | PATCH            |
| `docs`     | Documentación, incluido `plan.md`              | —                |
| `test`     | Agregar o corregir tests                       | —                |
| `build`    | Build, bundler, dependencias de build          | —                |
| `ci`       | GitHub Actions y pipelines                     | —                |
| `chore`    | Tareas internas sin impacto (gitignore, deps)  | —                |
| `style`    | Formato, espacios, lint (sin cambio de lógica) | —                |
| `revert`   | Revertir un commit anterior                    | —                |

Si el commit **rompe** algo, agregá `!` antes de los dos puntos: `feat(domain)!: ...`.
Solo el `!` no alcanza: en el pie del mensaje explicá qué se rompe y cómo migrar.

### Scopes

`domain`, `map`, `scanner`, `admin`, `ui`, `data`, `schedule`, `events`, `qr`, `tools`,
`qa`, `deps`, `docs`, `ci`, `release`

Un scope que no esté en la lista **no rompe el commit** (es `warning`), pero usá uno
existente salvo que realmente haga falta uno nuevo. Si hace falta, agregalo a
`commitlint.config.js` en el mismo PR.

### Reglas del mensaje

- **Idioma: inglés.** Los `docs` pueden ir en español.
- **Imperativo presente:** `add`, no `added` ni `adding`.
  - Correcto: `feat(map): add floor level selector`
  - Incorrecto: `feat(map): added the floor level selector`
- **Sin punto final.**
- **Máximo 100 caracteres** en la primera línea.
- **Un commit = un cambio lógico.** Si el mensaje necesita "y", son dos commits.
- Si necesita explicación, usá el cuerpo separado por una línea en blanco:

```
feat(domain): implement multi-level dijkstra router

Transitions between floors carry a cost multiplier so the router prefers
elevators over stairs when both are available, unless the caller passes
avoidElevators.

Refs #12
```

### Comportamiento del hook

`.husky/commit-msg` corre `commitlint`. Un mensaje inválido **no se commitea**:

```
⧗   input: actualizacion del mapa
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]
```

Eso no es un bug, es el sistema funcionando. Corregí el mensaje, no lo saltees.

### Prohibido

- `git commit --no-verify` sin justificarlo en el PR.
- Agregar `Co-Authored-By` o atribución de IA.
- Commitear `.env`, claves de Supabase, o cualquier credencial.
- Mensajes tipo `wip`, `cambios`, `avances`, `fix`.

---

## 3. Ramas

`main` siempre debe estar desplegable. **No se commitea directo a `main`.**

| Prefijo     | Uso              | Ejemplo                   |
| ----------- | ---------------- | ------------------------- |
| `feat/`     | Funcionalidad    | `feat/floor-editor`       |
| `fix/`      | Bug              | `fix/qr-permission-ios`   |
| `refactor/` | Reestructuración | `refactor/routing-graph`  |
| `docs/`     | Documentación    | `docs/digitization-guide` |
| `chore/`    | Mantenimiento    | `chore/bump-vite`         |

```bash
git switch -c feat/floor-editor
```

---

## 4. Pull Requests

Todo cambio entra por PR. Pasos:

1. `git fetch origin && git rebase origin/main` — evitá merges innecesarios.
2. Commits atómicos con mensajes válidos.
3. Push de la rama.
4. Abrir PR contra `main` usando el template.
5. **Squash-merge** al aprobar. El squash conserva el historial lineal.

### Checklist que el PR debe cumplir

- [ ] `npm run lint` limpio
- [ ] `npm run typecheck` limpio
- [ ] `npm test` verde
- [ ] `npm run build` pasa
- [ ] CI verde
- [ ] `plan.md` actualizado si el cambio altera el plan
- [ ] Sin secretos en el diff
- [ ] Si toca `src/data/`, el validador de planos pasa

### Tamaño

Un PR de más de **~400 líneas** es difícil de revisar de verdad. Si el cambio es más
grande, partilo en PRs encadenados:

- PR 1: tipos y estructura
- PR 2: lógica de dominio + tests
- PR 3: UI que consume la lógica
- PR 4: integración

Cada uno referencia al anterior con `Depends on #12`.

---

## 5. Tests

- **Dominio (`src/domain/`): cobertura alta.** Es lógica pura y determinista; no hay
  excusa para no testearla.
- **UI: smoke tests.** Que renderice y que los roles accesibles existan.
- **Datos: validados por script**, no por test unitario.

`npm run test:coverage` reporta solo `src/domain`, `src/schedule` y `src/qr`, que es
donde la cobertura tiene sentido. El resto se verifica con E2E en la Fase 8.

### Nombres de test

En inglés, describiendo comportamiento observable:

```ts
it('prefers the elevator over the stairs when both connect the floors', () => {})
```

No: `it('works')`, `it('test 1')`.

---

## 6. Estilo de código

- **Prettier** manda. No discutas formato en el PR; corré `npm run format`.
- **TypeScript estricto.** `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`.
  Si necesitás `any`, justificalo en un comentario.
- **`import type`** obligatorio para tipos (`verbatimModuleSyntax` está activo).
- **No enums.** `erasableSyntaxOnly` está activo; usá uniones de strings.
- **Nombres en inglés** para código, identificadores y comentarios. El texto de UI va
  en español.
- **Comentarios: explican _por qué_, no _qué_.** El `what` ya lo dice el código.

```ts
// Mal: incrementa el contador
// Bien: usa 1.4 como penalización de escaleras para que el ascensor gane
//       cuando ambos conectan los mismos pisos
```

---

## 7. Cambios en los datos del mapa

Los `floor.json` son **fuente de verdad versionada**, no un archivo de configuración
casual. Un cambio ahí puede dejar salones inaccesibles.

- Todo cambio en `src/data/` debe pasar el validador.
- Un cambio de geometría va en su propio commit: `fix(data): connect aula 205 to east corridor`.
- **Nunca edites un piso sin haberlo verificado en sitio** (ver `docs/PLAN-DATA.md`).

---

## 8. Si algo se rompe

| Síntoma                     | Causa probable              | Solución                  |
| --------------------------- | --------------------------- | ------------------------- |
| `commit-msg` rechaza        | Mensaje fuera de convención | Corregir el mensaje       |
| `pre-commit` falla por lint | Archivo con warnings        | `npm run lint:fix`        |
| `pre-push` falla por tests  | Test rojo                   | Arreglar antes de pushear |
| Hooks no corren             | Husky no instalado          | `npm run prepare`         |
| `tsc` error de `baseUrl`    | TS 7 lo eliminó             | Usar solo `paths`         |

Si quedaste trabado más de 20 minutos, pedí ayuda. No inventes un workaround que
después haya que deshacer.
