# Evidencias de Milimap

Capturas tomadas del sitio desplegado en GitHub Pages, no de un servidor local:

- App: https://davidcrispoca.github.io/Milimap/
- Galería de QR: https://davidcrispoca.github.io/Milimap/qrs/
- Panel: https://davidcrispoca.github.io/Milimap/#/admin

Fecha de captura: 22 de noviembre de 2026. Navegador Chromium (Playwright).

## Cómo se capturaron

- **Móvil**: viewport 390 × 844 CSS, escala 2× (PNG de 780 × 1688), `isMobile`, `hasTouch`, locale `es-CO` y zona horaria `America/Bogota`.
- **Escritorio**: viewport 1440 × 900 (y 1280 × 900 para el panel).
- La captura `01-inicio-instalar.png` usa el user-agent de Safari en iPhone para mostrar el instructivo de instalación de iOS. El resto usa el user-agent por defecto de Chromium.
- Los estados de ubicación por QR se obtuvieron con enlaces profundos reales (`#/qr/MILIMAP:v1:umng-calle100:P1:QRD`), y la ruta con la pantalla de mapa.
- El modo sin conexión se verificó con la red desactivada en el navegador después de que el service worker (`milimap-v7`) tomara el control.

## Índice

### Inicio

| Archivo                         | Qué muestra                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `01-inicio-instalar.png`        | Inicio con el banner "Instalá Milimap" y el instructivo para iOS (Compartir → Agregar a pantalla de inicio). |
| `02-inicio-cabecera.png`        | Cabecera de la app, aviso de mantenimiento y tarjeta del campus activo.                                      |
| `03-inicio-eventos.png`         | Sección de eventos especiales con fecha, lugar y acceso "Cómo llegar".                                       |
| `04-inicio-horario.png`         | Tarjeta "Mi horario" con el acceso para configurar el semestre.                                              |
| `05-inicio-acciones.png`        | Acciones rápidas: escanear QR y buscar un lugar ("Probar ruta").                                             |
| `06-inicio-estado.png`          | Estado del proyecto y alcance del MVP.                                                                       |
| `07-inicio-accesibilidad.png`   | Ajustes de alto contraste, texto grande, menos animación e idioma.                                           |
| `08-inicio-pagina-completa.png` | Página de inicio completa en una sola imagen (móvil).                                                        |

### Mapa y rutas

| Archivo                       | Qué muestra                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| `09-mapa-general.png`         | Pantalla de mapa con el selector de campus/piso, rutas de ejemplo y buscador.                  |
| `10-ruta-resumen.png`         | Ruta calculada Entrada D → Aula E 101 con distancia y cantidad de pasos (sin tiempo estimado). |
| `11-ruta-plano.png`           | Plano interactivo con el recorrido dibujado y los chips de piso.                               |
| `12-ruta-pasos.png`           | Indicaciones paso a paso, sin tiempos estimados de llegada.                                    |
| `13-ruta-origen-destino.png`  | Tarjeta de origen y destino seleccionados.                                                     |
| `14-busqueda-destinos.png`    | Búsqueda de destinos (consulta "lab").                                                         |
| `15-ruta-multipiso.png`       | Ruta entre pisos (Aula 205 → Biblioteca) con cambio de nivel.                                  |
| `16-ruta-multipiso-pasos.png` | Pasos de la ruta multipiso, incluidos ascensor/escaleras.                                      |

### Escáner QR

| Archivo                               | Qué muestra                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `17-escaner-inicio.png`               | Pantalla del escáner con cámara y entrada manual, más el código de ejemplo. |
| `18-escaner-codigo-manual.png`        | Entrada manual del código `MILIMAP:v1:umng-calle100:P1:QRD`.                |
| `19-escaner-ubicacion-confirmada.png` | Resultado confirmado: "Estás en: Entrada QRD", piso y nodo.                 |
| `20-escaner-codigo-invalido.png`      | Manejo de un código que no corresponde a un punto del campus.               |
| `21-mapa-origen-por-qr.png`           | El mapa con el origen tomado del QR ("Estoy en: P1 · Entrada (QRD)").       |

### Horario

| Archivo                     | Qué muestra                                                         |
| --------------------------- | ------------------------------------------------------------------- |
| `22-horario-configurar.png` | Selector de programa y grupo para crear el horario.                 |
| `23-horario-semana.png`     | Horario guardado con la clase actual/próxima y el acceso a la ruta. |
| `24-horario-completo.png`   | Vista completa del horario semanal.                                 |

### Panel de administración (escritorio)

| Archivo                    | Qué muestra                                                |
| -------------------------- | ---------------------------------------------------------- |
| `25-admin-login.png`       | Acceso simulado por rol: Administrador, Editor y Consulta. |
| `26-admin-resumen.png`     | Resumen general del panel.                                 |
| `27-admin-eventos.png`     | Gestión de eventos.                                        |
| `28-admin-anuncios.png`    | Gestión de anuncios.                                       |
| `29-admin-espacios.png`    | Gestión de espacios del campus.                            |
| `30-admin-editor-mapa.png` | Editor de mapa.                                            |
| `31-admin-horarios.png`    | Horarios del semestre.                                     |
| `32-admin-analitica.png`   | Analítica de uso.                                          |

### Códigos QR de prueba

| Archivo                       | Qué muestra                                                                |
| ----------------------------- | -------------------------------------------------------------------------- |
| `33-qrs-galeria.png`          | Galería pública de códigos QR generados para la sede.                      |
| `34-qrs-galeria-completa.png` | Los 45 QR en una sola imagen (página completa).                            |
| `35-qrs-detalle.png`          | Detalle de una tarjeta: piso, nombre, enlace profundo y "Abrir en la app". |

### PWA y sin conexión

| Archivo                 | Qué muestra                                                                |
| ----------------------- | -------------------------------------------------------------------------- |
| `36-offline-inicio.png` | Inicio sin conexión, con el aviso "Sin conexión" y los datos ya guardados. |
| `37-offline-mapa.png`   | Mapa y rutas funcionando sin red gracias al service worker.                |

### Escritorio

| Archivo                          | Qué muestra                                                     |
| -------------------------------- | --------------------------------------------------------------- |
| `38-desktop-inicio.png`          | Inicio en escritorio (1440 × 900).                              |
| `39-desktop-inicio-completa.png` | Inicio completo en escritorio.                                  |
| `40-desktop-ruta.png`            | Ruta en escritorio con el plano y las indicaciones en paralelo. |
| `41-desktop-admin.png`           | Panel de administración en escritorio.                          |

## Nota sobre la cámara

La lectura real con cámara no se puede capturar en un navegador sin dispositivo físico. Las capturas documentan la entrada manual, el deep link del QR y el resultado de ubicación; la prueba con cámara en Android/iOS sigue siendo una verificación manual pendiente.
