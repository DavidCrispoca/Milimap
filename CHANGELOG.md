# Changelog

Todos los cambios notables de este proyecto se documentan acá.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado es [SemVer](https://semver.org/lang/es/).

Este archivo lo mantiene **Release Please** a partir de los mensajes de commit.
Para agregar una entrada, escribí un commit con `feat:` o `fix:`; no edites este
archivo a mano salvo en la sección `Unreleased`.

## [Unreleased]

### Added

- Estructura base del repositorio con Vite, React 19 y TypeScript estricto.
- Tipos del dominio (`src/domain/types.ts`) para edificios, pisos, espacios y rutas.
- Utilidades de geometría en metros locales con 21 tests.
- Hook de shell de la app móvil con navegación inferior de 4 pestañas.
- Design tokens en CSS (`src/styles/tokens.css`).
- Tooling de calidad: oxlint, Prettier, commitlint, husky y lint-staged.
- CI en GitHub Actions: formato, lint, typecheck, tests y build.
- Release Please para versionado automático.
- Documentación para el equipo: contribución, arquitectura, digitalización de planos
  y manual del panel de administración.
