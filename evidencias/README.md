# Evidencias de Milimap

Capturas tomadas del sitio desplegado en GitHub Pages, no de un servidor local:

- App: https://davidcrispoca.github.io/Milimap/
- Galería de QR: https://davidcrispoca.github.io/Milimap/qrs/
- Panel: https://davidcrispoca.github.io/Milimap/#/admin

Fecha de captura: 22 de noviembre de 2026. Navegador Chromium (Playwright).

## Cómo se capturaron

- **Móvil**: viewport 390 × 844 CSS, escala 2× (PNG de 780 × 1688), `isMobile`, `hasTouch`, locale `es-CO` y zona horaria `America/Bogota`.
- **Escritorio**: viewport 1440 × 900 (y 1280 × 900 para el panel).
- La captura `07-inicio-instalar.png` usa el user-agent de Safari en iPhone para mostrar el instructivo de instalación de iOS. El resto usa el user-agent por defecto de Chromium.
- El acceso es simulado: se capturaron el ingreso con correo y contraseña, la validación de campos vacíos, el modo invitado (tres pestañas, sin horario) y la pantalla de cuenta. La sesión se sembró en `localStorage` (`milimap.session.v1`) para las capturas con sesión iniciada.
- El horario se creó con el formulario de la app: "Gestión integral de proyectos", salón `B309` (Aula B 309, piso 3), lunes de 14:00 a 17:00. Queda guardado en `milimap.schedule.v2` y es el que aparece en `10-inicio-horario.png` y en la sección de horario.
- Los estados de ubicación por QR se obtuvieron con enlaces profundos reales (`#/qr/MILIMAP:v1:umng-calle100:P1:QRD`), y la ruta con la pantalla de mapa.
- El modo sin conexión se verificó con la red desactivada en el navegador después de que el service worker (`milimap-v7`) tomara el control.

## Índice

### Acceso y cuenta

| Archivo                           | Qué muestra                                                                                           |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `01-acceso-login.png`             | Pantalla "Entra a Milimap": correo o usuario, contraseña, inicio de sesión y acceso como invitado.    |
| `02-acceso-validacion.png`        | Validación del formulario: "Escribe tu correo y tu contraseña para continuar." al enviar vacío.       |
| `03-acceso-invitado.png`          | Inicio como invitado: tres pestañas (Inicio, Mapa, Escanear) y sin la tarjeta "Mi horario".           |
| `04-acceso-horario-bloqueado.png` | Enlace directo a `#/horario` como invitado: "Inicia sesión para ver tu horario".                      |
| `05-acceso-credenciales.png`      | Ingreso abierto desde la cabecera con las credenciales del estudiante de prueba y la opción "Volver". |
| `06-cuenta.png`                   | Pantalla "Tu cuenta": sesión iniciada como Ana Lopez, cambio de cuenta y cierre de sesión.            |

### Inicio

| Archivo                         | Qué muestra                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `07-inicio-instalar.png`        | Inicio con el banner "Instalá Milimap" y el instructivo para iOS (Compartir → Agregar a pantalla de inicio). |
| `08-inicio-cabecera.png`        | Cabecera con la cuenta activa, aviso de mantenimiento y tarjeta del campus.                                  |
| `09-inicio-eventos.png`         | Sección de eventos especiales con fecha, lugar y acceso "Cómo llegar".                                       |
| `10-inicio-horario.png`         | Tarjeta "Mi horario" con la próxima clase: Gestión integral de proyectos, Aula B 309, 14:00–17:00.           |
| `11-inicio-acciones.png`        | Acciones rápidas: escanear QR y buscar un lugar ("Probar ruta").                                             |
| `12-inicio-accesibilidad.png`   | Ajustes de alto contraste, texto grande, menos animación e idioma.                                           |
| `13-inicio-pagina-completa.png` | Página de inicio completa en una sola imagen (móvil).                                                        |

### Mapa y rutas

| Archivo                       | Qué muestra                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| `14-mapa-general.png`         | Pantalla de mapa con el selector de campus/piso, rutas de ejemplo y buscador.                  |
| `15-ruta-resumen.png`         | Ruta calculada Entrada D → Aula E 101 con distancia y cantidad de pasos (sin tiempo estimado). |
| `16-ruta-plano.png`           | Plano interactivo con el recorrido dibujado y los chips de piso.                               |
| `17-ruta-pasos.png`           | Indicaciones paso a paso, sin tiempos estimados de llegada.                                    |
| `18-ruta-origen-destino.png`  | Tarjeta de origen y destino seleccionados.                                                     |
| `19-busqueda-destinos.png`    | Búsqueda de destinos (consulta "lab").                                                         |
| `20-ruta-multipiso.png`       | Ruta entre pisos (Aula 205 → Biblioteca) con cambio de nivel.                                  |
| `21-ruta-multipiso-pasos.png` | Pasos de la ruta multipiso, incluidos ascensor/escaleras.                                      |

### Escáner QR

| Archivo                               | Qué muestra                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `22-escaner-inicio.png`               | Pantalla del escáner con cámara y entrada manual, más el código de ejemplo. |
| `23-escaner-codigo-manual.png`        | Entrada manual del código `MILIMAP:v1:umng-calle100:P1:QRD`.                |
| `24-escaner-ubicacion-confirmada.png` | Resultado confirmado: "Estás en: Entrada QRD", piso y nodo.                 |
| `25-escaner-codigo-invalido.png`      | Manejo de un código que no corresponde a un punto del campus.               |
| `26-mapa-origen-por-qr.png`           | El mapa con el origen tomado del QR ("Estoy en: P1 · Entrada (QRD)").       |

### Horario

| Archivo                     | Qué muestra                                                                                         |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| `27-horario-formulario.png` | Formulario de clase diligenciado, con el aviso "Ruta disponible hasta Aula B 309 (piso 3)".         |
| `28-horario-semana.png`     | Semana con la clase guardada, sus acciones "Cómo llegar", "Editar" y "Eliminar", y "Borrar todo".   |
| `29-horario-completo.png`   | Vista completa de "Mi horario": próxima clase, formulario y semana.                                 |
| `30-horario-ruta.png`       | Ruta desde la puerta de entrada hasta Aula B 309 (112 m, 10 pasos, escaleras), sin tiempo estimado. |

### Panel de administración (escritorio)

| Archivo                    | Qué muestra                                                |
| -------------------------- | ---------------------------------------------------------- |
| `31-admin-login.png`       | Acceso simulado por rol: Administrador, Editor y Consulta. |
| `32-admin-resumen.png`     | Resumen general del panel.                                 |
| `33-admin-eventos.png`     | Gestión de eventos.                                        |
| `34-admin-anuncios.png`    | Gestión de anuncios.                                       |
| `35-admin-espacios.png`    | Gestión de espacios del campus.                            |
| `36-admin-editor-mapa.png` | Editor de mapa.                                            |
| `37-admin-horarios.png`    | Horarios del semestre.                                     |
| `38-admin-analitica.png`   | Analítica de uso.                                          |

### Códigos QR de prueba

| Archivo                       | Qué muestra                                                                |
| ----------------------------- | -------------------------------------------------------------------------- |
| `39-qrs-galeria.png`          | Galería pública con los 46 códigos QR generados para la sede.              |
| `40-qrs-galeria-completa.png` | Los 46 QR en una sola imagen (página completa).                            |
| `41-qrs-detalle.png`          | Detalle de la tarjeta de COASE: piso, enlace profundo y "Abrir en la app". |

### PWA y sin conexión

| Archivo                 | Qué muestra                                                                |
| ----------------------- | -------------------------------------------------------------------------- |
| `42-offline-inicio.png` | Inicio sin conexión, con el aviso "Sin conexión" y los datos ya guardados. |
| `43-offline-mapa.png`   | Mapa y rutas funcionando sin red gracias al service worker.                |

### Escritorio

| Archivo                          | Qué muestra                                                     |
| -------------------------------- | --------------------------------------------------------------- |
| `44-desktop-inicio.png`          | Inicio en escritorio (1440 × 900) con la sesión iniciada.       |
| `45-desktop-inicio-completa.png` | Inicio completo en escritorio.                                  |
| `46-desktop-ruta.png`            | Ruta en escritorio con el plano y las indicaciones en paralelo. |
| `47-desktop-admin.png`           | Panel de administración en escritorio.                          |

## Nota sobre la cámara

La lectura real con cámara no se puede capturar en un navegador sin dispositivo físico. Las capturas documentan la entrada manual, el deep link del QR y el resultado de ubicación; la prueba con cámara en Android/iOS sigue siendo una verificación manual pendiente.
