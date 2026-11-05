# Changelog

Todos los cambios notables de este proyecto se documentan acá.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado es [SemVer](https://semver.org/lang/es/).

Este archivo lo mantiene **Release Please** a partir de los mensajes de commit.
Para agregar una entrada, escribí un commit con `feat:` o `fix:`; no edites este
archivo a mano salvo en la sección `Unreleased`.

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
