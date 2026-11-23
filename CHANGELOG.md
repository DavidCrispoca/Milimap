# Changelog

Todos los cambios notables de este proyecto se documentan acá.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado es [SemVer](https://semver.org/lang/es/).

Este archivo lo mantiene **Release Please** a partir de los mensajes de commit.
Para agregar una entrada, escribe un commit con `feat:` o `fix:`; no edites este
archivo a mano salvo en la sección `Unreleased`.

## [0.1.1](https://github.com/DavidCrispoca/Milimap/compare/milimap-v0.1.0...milimap-v0.1.1) (2026-11-23)


### Features

* **admin:** add admin console with events announcements spaces schedule and analytics ([c01605a](https://github.com/DavidCrispoca/Milimap/commit/c01605ab211be0320d911bcd85e283a9b0ed6b1a))
* **admin:** add SVG floor-plan map editor ([f558a2a](https://github.com/DavidCrispoca/Milimap/commit/f558a2a62a7824b64b4ca4690082bb24eaf3379d))
* **backend:** add supabase analytics client with fire-and-forget writes ([11aab66](https://github.com/DavidCrispoca/Milimap/commit/11aab665b6abe0668bbf99009eede7bad0dc8139))
* **content:** add content store with role permissions and validation ([27f92d0](https://github.com/DavidCrispoca/Milimap/commit/27f92d0bcd9b2edc457a87e021af47e1dab117e6))
* **data:** add complete floor plans and multi-level graph for calle 100 ([ad43624](https://github.com/DavidCrispoca/Milimap/commit/ad4362459c1622caac072133f008f063f1ad9e69))
* **data:** add demo campus with two generic-measurement floors ([d5260e5](https://github.com/DavidCrispoca/Milimap/commit/d5260e58d9763f8e305ed7eb0e3fc53391dbe2d2))
* **domain:** add core types and meter-based geometry utilities ([6efc262](https://github.com/DavidCrispoca/Milimap/commit/6efc262653d723e4d2015b076878c266a1f3e735))
* **domain:** add fuzzy search qr parsing and plan validation ([ea61d14](https://github.com/DavidCrispoca/Milimap/commit/ea61d14e465e896324c49a5a3d9e50f2c3a29aec))
* **domain:** implement multi-level dijkstra routing with turn-by-turn steps ([325af53](https://github.com/DavidCrispoca/Milimap/commit/325af53c836a8746abe8ddf3e40e3184338f02c3))
* **pwa:** add manifest icons and service worker for offline install ([5fc1e6f](https://github.com/DavidCrispoca/Milimap/commit/5fc1e6fafa5aab7746e89ced2ab1899ef168c220))
* **pwa:** add offline support and accessibility preferences ([c7cda07](https://github.com/DavidCrispoca/Milimap/commit/c7cda07eca7ed40c862acc9ec219a0ced8aa32a8))
* **qr:** add test QR generator and GitHub Pages workflow ([532f50f](https://github.com/DavidCrispoca/Milimap/commit/532f50fc4df91a3b8772fb22cac42a34eb6140a3))
* **qr:** include COASE in the test QR sheet ([c346614](https://github.com/DavidCrispoca/Milimap/commit/c34661423a1c32e8a765ab2802ae088a28968027))
* **router:** add hash router with deep links and destination shares ([0ac03bb](https://github.com/DavidCrispoca/Milimap/commit/0ac03bb7105698902294c6afbab0354540c1e844))
* **scanner:** add qr scan flow with camera and manual entry ([1ba876a](https://github.com/DavidCrispoca/Milimap/commit/1ba876a778fc9b66c4d6908f9126ef241fb673b7))
* **scanner:** support qr deep link payload on entry ([47189eb](https://github.com/DavidCrispoca/Milimap/commit/47189eb4eeea2d047889eba4096a1526ed4b929e))
* **schedule:** add csv schedule parser with room conflict detection ([9a39e15](https://github.com/DavidCrispoca/Milimap/commit/9a39e15d79fca8a5426fd28ecab9156e668f6de8))
* **schedule:** add current class engine and student schedule persistence ([1932311](https://github.com/DavidCrispoca/Milimap/commit/1932311882d70409a45936e2be1d5349eddffdb8))
* **schedule:** build the weekly schedule with a plain form ([38e0489](https://github.com/DavidCrispoca/Milimap/commit/38e04890acf8a8dcc7b36537d135e0e6cf03f454))
* **tools:** add cloudflare quick tunnel script for temporary demo links ([bb3b1c7](https://github.com/DavidCrispoca/Milimap/commit/bb3b1c77ed12dd048592bd1619724d2340ae0426))
* **ui:** add install prompt banner ([e819219](https://github.com/DavidCrispoca/Milimap/commit/e819219202455d7b696ed6e1acdbc98e83c22ac9))
* **ui:** add map zoom pan controls and navigation origin destination header ([3385b62](https://github.com/DavidCrispoca/Milimap/commit/3385b62b54b5d838b80a498069fccefda87db37a))
* **ui:** add mobile app shell with design tokens and navigation ([e26cc33](https://github.com/DavidCrispoca/Milimap/commit/e26cc33823dd1e30cc168ba0b077ae15c903d37f))
* **ui:** add route demo screen with svg floor plan ([2840189](https://github.com/DavidCrispoca/Milimap/commit/28401897392ae7a7ee608748d9d894ae7b6ddeba))
* **ui:** add simulated student login and guest mode ([2e38d06](https://github.com/DavidCrispoca/Milimap/commit/2e38d06b38c864cab6dade3fd5a61a098e25feca))
* **ui:** refresh visual design with umng brand system and motion ([6a2bc62](https://github.com/DavidCrispoca/Milimap/commit/6a2bc6262afcbd969c23850a547dedd32a692b22))
* **ui:** show published events and announcements on the student home ([f3571a9](https://github.com/DavidCrispoca/Milimap/commit/f3571a9ad9c33d4f3543705b67347f5448e28541))
* **ui:** wire schedule screen and hash navigation into the app ([728fc24](https://github.com/DavidCrispoca/Milimap/commit/728fc24433079756f3b6e184a70cf065a4cd9ebe))


### Bug Fixes

* **ci:** format pwa assets to pass prettier check ([68ac8a6](https://github.com/DavidCrispoca/Milimap/commit/68ac8a6c1f96e67c4e8d08287cca4a90a0205874))
* **data,ui:** refine P1 exterior layout, add vehicular street and fit map labels ([d490e49](https://github.com/DavidCrispoca/Milimap/commit/d490e49f61fd41be912c471705b229ba99793fff))
* **data,ui:** relocate P1 exterior facilities east and clamp map panning ([c9fce68](https://github.com/DavidCrispoca/Milimap/commit/c9fce68599e52c4bee6ab8df66d4e838c0d46b30))
* **data:** extend Parqueadero Principal up to Editorial Neogranadina ([f1ceb36](https://github.com/DavidCrispoca/Milimap/commit/f1ceb368dad5698495e95f54df047805ba6d051e))
* **qr:** keep hand-saved QR copies when regenerating ([e6d1ec9](https://github.com/DavidCrispoca/Milimap/commit/e6d1ec9a6e1b51615445b5bffe391ea2267c5e81))
* **schedule:** count eta across days and show weekday for next class ([dad46a9](https://github.com/DavidCrispoca/Milimap/commit/dad46a96232f931bc204603c029587bc813d84f9))


### Refactoring

* **home:** remove the completed project status section ([16e4022](https://github.com/DavidCrispoca/Milimap/commit/16e4022430c863c5ea70c666fae0de74c4c79aef))


### Documentation

* add live-site screenshots for the Milimap presentation ([39e2718](https://github.com/DavidCrispoca/Milimap/commit/39e2718cc7d6a2e32121f84120dff858f93dfa58))
* add team guides digitization workflow and project plan ([a87af46](https://github.com/DavidCrispoca/Milimap/commit/a87af46bc5d29905b15303538fc9b0f0081b656e))
* **admin-guide:** update capability status for qr schedule and analytics ([841529d](https://github.com/DavidCrispoca/Milimap/commit/841529d4da1930214ea873b2b91a7a0ca0fa8016))
* align phase 3 and 8 status with implementation ([10de75c](https://github.com/DavidCrispoca/Milimap/commit/10de75cc3064653cd4964df0d423c93538d10486))
* **architecture:** add adr-013 hash router and adr-014 supabase analytics ([e86842e](https://github.com/DavidCrispoca/Milimap/commit/e86842e27e9d2ff1439361cf422ecc627ed98563))
* **copy:** finish migrating remaining voseo to tuteo ([185c23e](https://github.com/DavidCrispoca/Milimap/commit/185c23e8857fe20e60756d8abda9cd62dc55449b))
* correct the quick actions caption in the screenshot index ([464c3d2](https://github.com/DavidCrispoca/Milimap/commit/464c3d27cce705b58a07d39cf989e7f15d75da3f))
* document admin console roles persistence decisions and phase 2 results ([e444cb2](https://github.com/DavidCrispoca/Milimap/commit/e444cb25c28fc5ef93370801870eeada2ca41b21))
* document hand-drawn plan digitization flow and phase 1 results ([13e0f71](https://github.com/DavidCrispoca/Milimap/commit/13e0f71ac2ff4938a1e2a36b1981a276a236f604))
* document required github settings for branch protection and releases ([85569bf](https://github.com/DavidCrispoca/Milimap/commit/85569bf94e623e0cd77762c64464825eb2a2119a))
* link the screenshot index from the README ([8fb531c](https://github.com/DavidCrispoca/Milimap/commit/8fb531c81c025e2ae9bc2bce5fe095d43e5cbe46))
* move adr 11 and 12 into decisions section and mark phase 2 status ([ac04c26](https://github.com/DavidCrispoca/Milimap/commit/ac04c269ae584062fc99e241a1de5eb7cc5f640b))
* **plan:** mark phases 5 6 8 status and document pending work ([dda026a](https://github.com/DavidCrispoca/Milimap/commit/dda026a1cb10dc9aa7f968fe9b56a10879bda7a5))
* **readme:** show how to scan the test QRs from a phone on the LAN ([3d55e0f](https://github.com/DavidCrispoca/Milimap/commit/3d55e0f1bba1ee33b26779251c8fb204d3a8c0f4))
* **readme:** update status banner scripts and structure for recent phases ([068bdf3](https://github.com/DavidCrispoca/Milimap/commit/068bdf3be408c4a7321b2be055e699af7e72b5ea))
* refresh screenshots after removing the project status section ([49a7a72](https://github.com/DavidCrispoca/Milimap/commit/49a7a722c5f9e4f8618b3d8e3e7a51474caa8da2))
* refresh screenshots with login, schedule form and QR sheet ([8d677c9](https://github.com/DavidCrispoca/Milimap/commit/8d677c96ccf72a02b2497578187fff02fe0ee409))

## [Unreleased]

### Added

- Inicio de sesión simulado con modo invitado: cualquier correo y contraseña
  funcionan; los invitados usan mapa, escáner y rutas, y el horario se activa al
  iniciar sesión.
- Horario personal armado con un formulario de día, hora, materia y salón, con
  edición, borrado y "Cómo llegar" cuando el salón existe en el mapa. Reemplaza la
  selección por programa/grupo y la importación de JSON.
- Panel de administración en `/admin` con roles (administrador, editor, consulta).
- Gestión de eventos y anuncios con borrador, publicación y vigencia; validación Zod.
- Edición de nombres, alias y estado de espacios sin tocar la geometría.
- Importador CSV de horarios con validación por fila y detección de conflictos de salón.
- Analítica básica del contenido publicado.
- Inicio de estudiantes con eventos y anuncios publicados; "Cómo llegar" desde un evento.
- Paleta de marca tomada del logo oficial de la UMNG.
- Generador de QR de prueba (`npm run gen:qr`) con 45 puntos de la Sede Calle 100,
  hoja imprimible, CSV y validación de cada payload contra el resolver de la app.
- Despliegue automático en GitHub Pages (`.github/workflows/deploy.yml`) con build
  relativo apto para subrutas, precache del service worker por `scope` y panel
  accesible por `#/admin`.
- Entrada `/admin/` compatible con hosting estático: redirige al panel dentro del SPA.

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

### Changed

- Las rutas muestran distancia, cantidad de pasos y plano por piso, pero ya no
  estiman tiempo de llegada: el dato dependía de una velocidad supuesta y no era
  confiable en el edificio real.

### Fixed

- Dirección de los giros invertida: un giro hacia el este se anunciaba como izquierda.
  Cubierto ahora por tests con los cuatro puntos cardinales.
- El escáner resolvía los QR contra el edificio de demostración, así que cualquier
  sticker real daba "no reconocido". Ahora resuelve contra la Sede Calle 100 y los
  ajustes del panel.
- Las entradas múltiples se nombran por su código (`Entrada QRD`) en vez de llamarlas
  todas "Entrada principal".
- El service worker ya no reemplaza el shell cacheado cuando se navega a la hoja de
  QR o al redirector de `/admin/`.
