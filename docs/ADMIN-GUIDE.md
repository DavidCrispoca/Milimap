# Manual del panel de administración

> **Estado: Fase 2 implementada** (contenido: eventos, anuncios, espacios, horarios,
> analítica básica). El editor de mapa llega en la **Fase 3**. Para abrirlo:
> `npm run dev` y entrar a `http://localhost:5173/admin`.
>
> **Limitaciones actuales:** el acceso es simulado por rol (sin contraseña) y los datos
> se guardan en el navegador donde se trabaja. La autenticación institucional y la base
> compartida llegan con el backend. Ver [`ARCHITECTURE.md`](ARCHITECTURE.md), ADR-011 y ADR-012.

---

## Para qué sirve

Es una herramienta de **escritorio** (pensada para pantalla de PC, no para teléfono)
donde una persona de la universidad puede:

| #   | Qué se hace                                        | Estado                                                                        |
| --- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | Editar el mapa: dibujar aulas, pasillos, escaleras | Pendiente — Fase 3                                                            |
| 2   | Generar e imprimir los códigos QR                  | Pendiente — la app ya escanea QRs (Fase 5); falta el generador por lotes      |
| 3   | Cargar eventos y anuncios                          | **Implementado** — Fase 2                                                     |
| 4   | Administrar el catálogo de espacios                | **Parcial** — Fase 2 (nombre, alias y estado); geometría en Fase 3            |
| 5   | Importar los horarios del semestre                 | **Implementado** — CSV (Fase 2); selección del estudiante en la app (Fase 6)  |
| 6   | Ver estadísticas de uso                            | **Parcial** — eventos reales en Supabase (Fases 5–6); el panel aún no los lee |

Las secciones de este manual que todavía no existen en pantalla están escritas como
especificación para que el equipo sepa qué va a encontrar. Cada una lo indica en su
título o en la tabla de arriba.

**El panel no es la app.** Es una herramienta interna. Corre en la misma URL, en una
ruta separada (`/admin`).

---

## Roles

| Rol      | Puede                                        | No puede           |
| -------- | -------------------------------------------- | ------------------ |
| `admin`  | Todo: mapa, contenido, usuarios, publicación | —                  |
| `editor` | Editar mapa y contenido, sin publicar        | Gestionar usuarios |
| `viewer` | Ver y exportar                               | Escribir nada      |

Se entra con **correo institucional**. No hay registro abierto: las cuentas las crea un
`admin`.

---

## 1. Editor de mapa (Fase 3)

### Flujo para agregar un aula

1. Elegir edificio y piso en el selector superior.
2. Cargar el plano escaneado como imagen de fondo (opacidad ajustable) para usarlo de guía.
3. Seleccionar la herramienta **Espacio** y dibujar el contorno sobre la imagen.
4. Completar el formulario que aparece: código, nombre, tipo, capacidad, alias.
5. El panel valida en el momento: si el aula no toca ningún pasillo, aparece en rojo.
6. **Publicar** → se crea un commit y un PR. El CI valida. Al mergear, la app se actualiza.

### Generación automática del grafo

No se colocan nodos a mano. El panel los deriva:

- Un nodo en el punto medio del lado compartido entre cada aula y el pasillo.
- Una malla de nodos a lo largo del eje de cada pasillo.
- Nodos en cada escalera, ascensor y rampa, unidos por código entre pisos.

El editor permite **ajustar** lo generado (mover un nodo, borrar una conexión), pero el
trabajo pesado lo hace solo.

### Validación en vivo

Después de cada edición, el panel corre el mismo validador que usa el CI:

```
ERROR   Espacio "A205" sin nodo de anclaje
ERROR   Nodo "n-orphan-1" no tiene ninguna arista
WARNING El grafo del piso "P2" tiene 2 componentes separadas
INFO    32 espacios · 8 pasillos · 156 nodos · 190 aristas · 3 transiciones
```

Un piso con errores **no se puede publicar**.

### Otras herramientas del editor

| Herramienta           | Para qué                               |
| --------------------- | -------------------------------------- |
| Mover / redimensionar | Corregir un aula que quedó corrida     |
| Dividir espacio       | Un aula se partió en dos               |
| Unir espacios         | Dos aulas se fusionaron                |
| Renumerar en bloque   | Cambió la numeración de un piso entero |
| Comparar versiones    | Ver qué cambió entre dos publicaciones |
| Importar GeoJSON      | Subir el trabajo hecho en QGIS         |
| Exportar GeoJSON      | Sacar el piso para editarlo afuera     |

---

## 2. Códigos QR (Fase 5)

> **Estado (2026-11-10):** el lado de lectura ya existe en la app — escáner con
> cámara, entrada manual y deep link `#/qr/<payload>`. Lo que sigue aquí (generador
> por lotes, inventario, plantilla A4) todavía no está implementado.

### Generar

1. Ir a **QR** → seleccionar los nodos donde va a haber un sticker.
2. **Generar** → descarga un ZIP con los PNG y los SVG.
3. Opcional: **plantilla A4** lista para imprimir, con el código, el nombre del lugar y
   la zona.

### Inventario

Una tabla con todos los QR:

| Código                         | Ubicación          | Estado    | Escaneos | Último uso |
| ------------------------------ | ------------------ | --------- | -------- | ---------- |
| `MILIMAP:v1:EDIFICIO-A:P1:N12` | Entrada principal  | instalado | 1 240    | hoy        |
| `MILIMAP:v1:EDIFICIO-A:P1:N18` | Escalera A         | instalado | 830      | ayer       |
| `MILIMAP:v1:EDIFICIO-B:P1:N03` | Acceso parqueadero | pendiente | 0        | —          |

Estados: `pendiente` (impreso pero no pegado), `instalado`, `retirado`.

### Si se pierde un sticker

Se reimprime desde el inventario. **El código no cambia nunca**, aunque el mapa se
corrija, porque el QR apunta a un nodo del grafo y no a una posición.

---

## 3. Eventos y anuncios

### Evento

| Campo        | Ejemplo                                                  |
| ------------ | -------------------------------------------------------- |
| Título       | Ceremonia de Graduación 2026-II                          |
| Descripción  | …                                                        |
| Inicio / fin | 11 dic 2026, 08:00 – 13:00                               |
| Lugar        | Aula Máxima (se elige del catálogo)                      |
| Categoría    | ceremony / academic / sports / cultural / administrative |
| Prioridad    | normal / high                                            |
| Imagen       | opcional                                                 |
| Publicado    | sí / no                                                  |

Al publicarse, el evento aparece en el home con un botón **"Cómo llegar"** que arma la
ruta hasta el lugar del evento.

### Anuncio

Texto corto para el home, con tipo:

- `info` — informativo
- `warning` — advertencia (obra, cierre parcial)
- `emergency` — urgente, se muestra arriba de todo

Tiene fecha de inicio y fin de vigencia: se oculta solo cuando vence.

---

## 4. Catálogo de espacios

Lista de todo lo que un usuario puede buscar, con sus alias.

**Los alias importan más de lo que parece.** Un estudiante escribe "lab fisica", no
"Laboratorio de Física". Cargar alias es lo que hace que la búsqueda funcione:

| Nombre oficial        | Alias que conviene cargar                  |
| --------------------- | ------------------------------------------ |
| Laboratorio de Física | lab fisica, física, laboratorio fisica, LF |
| Aula Máxima           | auditorio, aula magna, maxima              |
| Biblioteca            | biblioteca, bib, sala de estudio           |
| Cafetería             | cafe, cafeteria, comedor, restaurante      |

---

## 5. Horarios del semestre

### Importar

Se sube un **CSV** con las clases del término:

```csv
codigo,materia,docente,salon,dia,inicio,fin,grupo
ECON-201,Estadística I,Dr. Pérez,A101,1,08:00,09:50,A
ECON-202,Microeconomía,Dra. Gómez,A205,1,10:00,11:50,A
```

El importador:

- Valida que el salón exista en el catálogo.
- Detecta **conflictos**: dos clases en el mismo salón a la misma hora.
- Reporta las filas con problemas sin abortar todo el archivo.

### Publicar

Cada término (`2026-1`, `2026-2`) es un catálogo separado. Cambiar de semestre **no
borra** el anterior: se agrega uno nuevo. Los estudiantes que ya tenían clases
seleccionadas mantienen su horario.

---

## 6. Estadísticas

| Métrica               | Pregunta que responde               |
| --------------------- | ----------------------------------- |
| Escaneos por día      | ¿Cuánta gente usa la app?           |
| Destinos más buscados | ¿Qué salones generan más tráfico?   |
| QR más escaneados     | ¿Dónde conviene poner más stickers? |
| Rutas fallidas        | ¿Qué datos del mapa están mal?      |
| Uso por hora          | ¿Cuándo hay congestión?             |

**Las rutas fallidas son la métrica más valiosa.** Cada fallo es un pedazo de mapa que
está mal, y es la forma más rápida de encontrar errores sin recorrer el campus.

> **Estado (2026-11-10):** la app ya registra eventos de uso reales en Supabase
> (`milimap_analytics_events`: escaneos, búsquedas, rutas, aperturas, horario — ver
> ADR-014 en `ARCHITECTURE.md`). Esta página del panel todavía muestra el contenido
> guardado en el navegador; leer los eventos reales está pendiente.

---

## 7. Publicar cambios

**Hoy (Fase 2), el contenido no se publica así.** Eventos, anuncios, espacios y horarios
se guardan en el navegador donde se trabaja: "Publicar" significa "visible en este
navegador". No hay PR ni deploy de por medio, y no hay sincronización entre personas.
Ver ADR-011 en [`ARCHITECTURE.md`](ARCHITECTURE.md).

Cuando exista backend (Fase 8 en adelante), los cambios del **mapa** seguirán este flujo:

```
Editar → Validar → Publicar → PR automático → CI valida → Merge → Deploy
```

- **Nada se publica directo.** Todo pasa por revisión automática.
- Si el CI falla, el PR queda rojo y el panel muestra el error.
- Para deshacer un cambio: `git revert` del commit. Vuelve exactamente al estado
  anterior.

---

## 8. Preguntas frecuentes

Las respuestas sobre mapa, Git y QGIS describen el panel completo (Fases 2 y 3). Hoy solo
está implementada la parte de contenido; el editor de mapa llega en la Fase 3.

**¿Los cambios que hago hoy se comparten con el resto?**
No. En la Fase 2 el contenido se guarda en el navegador donde trabajás. Otra persona, en
otro equipo, no ve tus eventos ni tus anuncios. Mientras no haya backend, el contenido que
deba ver todo el mundo se carga en el equipo que se use para la demostración.

**¿Puedo editar desde el celular?**
El panel está diseñado para PC. Dibujar polígonos con el dedo es impracticable.

**¿Qué pasa si dos personas editan el mismo piso?**
Git detecta el conflicto. La segunda persona tiene que integrar los cambios. Para
evitarlo, coordinen quién edita qué piso.

**¿Necesito saber git?**
No. El panel genera los commits por vos. Pero si querés ver el historial, es público.

**¿Puedo subir el trabajo hecho en QGIS?**
Sí. El editor acepta GeoJSON. Ver `docs/PLAN-DATA.md`.
