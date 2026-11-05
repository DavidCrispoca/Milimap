# Changelog

Todos los cambios notables de este proyecto se documentan acá.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado es [SemVer](https://semver.org/lang/es/).

Este archivo lo mantiene **Release Please** a partir de los mensajes de commit.
Para agregar una entrada, escribí un commit con `feat:` o `fix:`; no edites este
archivo a mano salvo en la sección `Unreleased`.

## [0.1.1](https://github.com/DavidCrispoca/Milimap/compare/milimap-v0.1.0...milimap-v0.1.1) (2026-11-05)


### Features

* **admin:** add admin console with events announcements spaces schedule and analytics ([c01605a](https://github.com/DavidCrispoca/Milimap/commit/c01605ab211be0320d911bcd85e283a9b0ed6b1a))
* **content:** add content store with role permissions and validation ([27f92d0](https://github.com/DavidCrispoca/Milimap/commit/27f92d0bcd9b2edc457a87e021af47e1dab117e6))
* **data:** add demo campus with two generic-measurement floors ([d5260e5](https://github.com/DavidCrispoca/Milimap/commit/d5260e58d9763f8e305ed7eb0e3fc53391dbe2d2))
* **domain:** add core types and meter-based geometry utilities ([6efc262](https://github.com/DavidCrispoca/Milimap/commit/6efc262653d723e4d2015b076878c266a1f3e735))
* **domain:** add fuzzy search qr parsing and plan validation ([ea61d14](https://github.com/DavidCrispoca/Milimap/commit/ea61d14e465e896324c49a5a3d9e50f2c3a29aec))
* **domain:** implement multi-level dijkstra routing with turn-by-turn steps ([325af53](https://github.com/DavidCrispoca/Milimap/commit/325af53c836a8746abe8ddf3e40e3184338f02c3))
* **schedule:** add csv schedule parser with room conflict detection ([9a39e15](https://github.com/DavidCrispoca/Milimap/commit/9a39e15d79fca8a5426fd28ecab9156e668f6de8))
* **ui:** add mobile app shell with design tokens and navigation ([e26cc33](https://github.com/DavidCrispoca/Milimap/commit/e26cc33823dd1e30cc168ba0b077ae15c903d37f))
* **ui:** add route demo screen with svg floor plan ([2840189](https://github.com/DavidCrispoca/Milimap/commit/28401897392ae7a7ee608748d9d894ae7b6ddeba))
* **ui:** show published events and announcements on the student home ([f3571a9](https://github.com/DavidCrispoca/Milimap/commit/f3571a9ad9c33d4f3543705b67347f5448e28541))


### Documentation

* add team guides digitization workflow and project plan ([a87af46](https://github.com/DavidCrispoca/Milimap/commit/a87af46bc5d29905b15303538fc9b0f0081b656e))
* document admin console roles persistence decisions and phase 2 results ([e444cb2](https://github.com/DavidCrispoca/Milimap/commit/e444cb25c28fc5ef93370801870eeada2ca41b21))
* document hand-drawn plan digitization flow and phase 1 results ([13e0f71](https://github.com/DavidCrispoca/Milimap/commit/13e0f71ac2ff4938a1e2a36b1981a276a236f604))
* document required github settings for branch protection and releases ([85569bf](https://github.com/DavidCrispoca/Milimap/commit/85569bf94e623e0cd77762c64464825eb2a2119a))
* move adr 11 and 12 into decisions section and mark phase 2 status ([ac04c26](https://github.com/DavidCrispoca/Milimap/commit/ac04c269ae584062fc99e241a1de5eb7cc5f640b))

## [Unreleased]

### Added

- Panel de administración en `/admin` con roles (administrador, editor, consulta).
- Gestión de eventos y anuncios con borrador, publicación y vigencia; validación Zod.
- Edición de nombres, alias y estado de espacios sin tocar la geometría.
- Importador CSV de horarios con validación por fila y detección de conflictos de salón.
- Analítica básica del contenido publicado.
- Inicio de estudiantes con eventos y anuncios publicados; "Cómo llegar" desde un evento.
- Paleta de marca tomada del logo oficial de la UMNG.

- Motor de ruteo multipiso (Dijkstra con heap binario) sobre un grafo en metros locales.
- Generador de instrucciones paso a paso en español e inglés, con colapso de tramos
  rectos y aviso de cambios de piso por escalera o ascensor.
- Búsqueda de destinos tolerante a tildes, mayúsculas y errores de tipeo.
- Parser y serializador de payload QR (`MILIMAP:v1:...`) con resolución a nodo por
  `qrKey`, para que corregir el mapa no invalide stickers ya impresos.
- Validador de coherencia de planos, compartido entre CLI, editor y tests.
- Edificio de demostración de 2 pisos y 16 espacios con medidas genéricas.
- Pantalla demo de ruteo con plano SVG, selector de piso y pasos navegables.
- CLI `validate-plans` y CLI `inspect-geojson` para validar entregas del equipo.
- README: flujo completo de digitalización de planos dibujados a mano.
- Estructura base del repositorio con Vite, React 19 y TypeScript estricto.
- Tipos del dominio (`src/domain/types.ts`) para edificios, pisos, espacios y rutas.
- Utilidades de geometría en metros locales.
- Hook de shell de la app móvil con navegación inferior de 4 pestañas.
- Design tokens en CSS (`src/styles/tokens.css`).
- Tooling de calidad: oxlint, Prettier, commitlint, husky y lint-staged.
- CI en GitHub Actions: formato, lint, typecheck, tests y build.
- Release Please para versionado automático.
- Documentación para el equipo: contribución, arquitectura, digitalización de planos
  y manual del panel de administración.

### Fixed

- Dirección de los giros invertida: un giro hacia el este se anunciaba como izquierda.
  Cubierto ahora por tests con los cuatro puntos cardinales.
