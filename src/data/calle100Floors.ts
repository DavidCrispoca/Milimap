/**
 * Complete Real Campus Data for Universidad Militar Nueva Granada, Sede Calle 100 (Bogota).
 *
 * Digitized from hand-drawn plans:
 * - Piso 1 (Bloques B, C, D y E unificados, más zonas exteriores:
 *   Aula Máxima, canchas, parqueadero, Café Legenda, carpas, etc.)
 * - Piso 2 (Bloques B, C, D y E con departamentos, salas de sistemas, auditorios)
 * - Piso 3 (Bloques B, C, D y E con aulas 300, talleres, decanaturas)
 * - Piso 4 (Bloque E con aulas 400, IEEE, asuntos disciplinarios)
 * - Piso 5 (Bloque E con laboratorios de multimedia, telecomunicaciones, realidad virtual)
 *
 * Units: local meters from SW corner reference (+x east, +y north).
 */

import type {
  Building,
  CatalogEntry,
  Floor,
  GraphEdge,
  GraphNode,
  LocalPoint,
  Space,
  SpaceKind,
} from '@/domain/types'
import { CALLE100_BUILDING_ID } from './calle100Floor1'

export const CALLE100_LEVELS = [1, 2, 3, 4, 5] as const

function rect(x1: number, y1: number, x2: number, y2: number): LocalPoint[] {
  return [
    { x: x1, y: y1 },
    { x: x2, y: y1 },
    { x: x2, y: y2 },
    { x: x1, y: y2 },
  ]
}

interface RoomDef {
  id: string
  name: string
  kind: SpaceKind
  polygon: LocalPoint[]
  door: LocalPoint
  corridorNodeKey: string
  aliases: string[]
  keywords: string[]
  capacity?: number
  restricted?: boolean
}

// -------------------------------------------------------------
// PISO 2 ROOMS
// -------------------------------------------------------------
const P2_ROOMS: RoomDef[] = [
  // Wing D (Left side: classrooms & substation)
  {
    id: 'D202',
    name: 'Aula D 202',
    kind: 'classroom',
    polygon: rect(2, 45, 14, 58),
    door: { x: 14, y: 51.5 },
    corridorNodeKey: 'wingD.51',
    aliases: ['Aula D202', 'D202'],
    keywords: ['salon', 'clase', 'bloque d'],
    capacity: 40,
  },
  {
    id: 'D203',
    name: 'Aula D 203',
    kind: 'classroom',
    polygon: rect(2, 30, 14, 45),
    door: { x: 14, y: 37.5 },
    corridorNodeKey: 'wingD.37',
    aliases: ['Aula D203', 'D203'],
    keywords: ['salon', 'clase', 'bloque d'],
    capacity: 40,
  },
  {
    id: 'D204',
    name: 'Aula D 204',
    kind: 'classroom',
    polygon: rect(2, 15, 14, 30),
    door: { x: 14, y: 22.5 },
    corridorNodeKey: 'wingD.23',
    aliases: ['Aula D204', 'D204'],
    keywords: ['salon', 'clase', 'bloque d'],
    capacity: 40,
  },
  {
    id: 'SUBESTACION-P2',
    name: 'Subestación Eléctrica',
    kind: 'service',
    polygon: rect(2, 8, 14, 15),
    door: { x: 14, y: 11.5 },
    corridorNodeKey: 'wingD.12',
    aliases: ['Subestacion'],
    keywords: ['electricidad', 'servicio'],
    restricted: true,
  },
  // Wing D (Right side: departments & bathrooms)
  {
    id: 'DEPT-MATEMATICAS',
    name: 'Departamento de Matemáticas',
    kind: 'office',
    polygon: rect(18, 48, 28, 58),
    door: { x: 18, y: 53 },
    corridorNodeKey: 'wingD.51',
    aliases: ['Dept Matematicas', 'Matematicas'],
    keywords: ['matematicas', 'ciencias basicas', 'profesores'],
  },
  {
    id: 'D201',
    name: 'Aula D 201',
    kind: 'classroom',
    polygon: rect(18, 38, 28, 48),
    door: { x: 18, y: 43 },
    corridorNodeKey: 'wingD.44',
    aliases: ['Aula D201', 'D201'],
    keywords: ['salon', 'clase', 'bloque d'],
    capacity: 40,
  },
  {
    id: 'DEPT-FISICA',
    name: 'Departamento de Física',
    kind: 'office',
    polygon: rect(18, 28, 28, 38),
    door: { x: 18, y: 33 },
    corridorNodeKey: 'wingD.37',
    aliases: ['Dept Fisica', 'Fisica'],
    keywords: ['fisica', 'ciencias basicas'],
  },
  {
    id: 'DEPT-QUIMICA',
    name: 'Departamento de Química',
    kind: 'office',
    polygon: rect(18, 18, 28, 28),
    door: { x: 18, y: 23 },
    corridorNodeKey: 'wingD.23',
    aliases: ['Dept Quimica', 'Quimica'],
    keywords: ['quimica', 'ciencias basicas'],
  },
  {
    id: 'BANO-D2-H',
    name: 'Baños Hombres Bloque D P2',
    kind: 'bathroom',
    polygon: rect(18, 13, 28, 18),
    door: { x: 18, y: 15.5 },
    corridorNodeKey: 'wingD.16',
    aliases: ['Bano D P2'],
    keywords: ['wc', 'bano'],
  },
  {
    id: 'BANO-D2-M',
    name: 'Baños Mujeres Bloque D P2',
    kind: 'bathroom',
    polygon: rect(18, 8, 28, 13),
    door: { x: 18, y: 10.5 },
    corridorNodeKey: 'wingD.12',
    aliases: ['Bano D P2 Mujeres'],
    keywords: ['wc', 'bano'],
  },
  // South space: Sala de Internet 1
  {
    id: 'SALA-INTERNET-1',
    name: 'Sala de Internet 1',
    kind: 'laboratory',
    polygon: rect(26, 0, 40, 5),
    door: { x: 33, y: 5 },
    corridorNodeKey: 'south.33',
    aliases: ['Internet 1', 'Sala Internet 1'],
    keywords: ['computadores', 'internet', 'estudio'],
    capacity: 50,
  },
  // Wing C (Middle: computer labs & DEPTEC)
  {
    id: 'SS-5',
    name: 'Sala de Sistemas 5',
    kind: 'laboratory',
    polygon: rect(32, 48, 40, 58),
    door: { x: 40, y: 53 },
    corridorNodeKey: 'wingC.53',
    aliases: ['SS5', 'Sala Sistemas 5'],
    keywords: ['computadores', 'sistemas', 'laboratorio'],
    capacity: 35,
  },
  {
    id: 'SS-4',
    name: 'Sala de Sistemas 4',
    kind: 'laboratory',
    polygon: rect(32, 34, 40, 48),
    door: { x: 40, y: 41 },
    corridorNodeKey: 'wingC.41',
    aliases: ['SS4', 'Sala Sistemas 4'],
    keywords: ['computadores', 'sistemas', 'laboratorio'],
    capacity: 35,
  },
  {
    id: 'DEPTEC',
    name: 'Departamento de Tecnologías del Conocimiento DEPTEC',
    kind: 'office',
    polygon: rect(32, 20, 40, 34),
    door: { x: 40, y: 27 },
    corridorNodeKey: 'wingC.27',
    aliases: ['DEPTEC', 'Tecnologias Conocimiento'],
    keywords: ['deptec', 'tecnologia', 'conocimiento'],
  },
  {
    id: 'SALA-SISTEMAS-1',
    name: 'Sala de Sistemas 1',
    kind: 'laboratory',
    polygon: rect(32, 8, 40, 20),
    door: { x: 40, y: 14 },
    corridorNodeKey: 'wingC.14',
    aliases: ['SS1', 'Sala Sistemas 1'],
    keywords: ['computadores', 'sistemas'],
    capacity: 35,
  },
  {
    id: 'SALA-INTERNET-2',
    name: 'Sala de Internet 2',
    kind: 'laboratory',
    polygon: rect(44, 48, 54, 58),
    door: { x: 44, y: 53 },
    corridorNodeKey: 'wingC.53',
    aliases: ['Internet 2', 'Sala Internet 2'],
    keywords: ['computadores', 'internet'],
    capacity: 40,
  },
  {
    id: 'SS-3',
    name: 'Sala de Sistemas 3',
    kind: 'laboratory',
    polygon: rect(44, 34, 54, 48),
    door: { x: 44, y: 41 },
    corridorNodeKey: 'wingC.41',
    aliases: ['SS3', 'Sala Sistemas 3'],
    keywords: ['computadores', 'sistemas'],
    capacity: 35,
  },
  {
    id: 'SS-2',
    name: 'Sala de Sistemas 2',
    kind: 'laboratory',
    polygon: rect(44, 20, 54, 34),
    door: { x: 44, y: 27 },
    corridorNodeKey: 'wingC.27',
    aliases: ['SS2', 'Sala Sistemas 2'],
    keywords: ['computadores', 'sistemas'],
    capacity: 35,
  },
  {
    id: 'BANO-C2-H',
    name: 'Baños Hombres Bloque C P2',
    kind: 'bathroom',
    polygon: rect(44, 14, 54, 20),
    door: { x: 44, y: 17 },
    corridorNodeKey: 'wingC.17',
    aliases: ['Bano C P2'],
    keywords: ['wc', 'bano'],
  },
  {
    id: 'BANO-C2-M',
    name: 'Baños Mujeres Bloque C P2',
    kind: 'bathroom',
    polygon: rect(44, 8, 54, 14),
    door: { x: 44, y: 11 },
    corridorNodeKey: 'wingC.11',
    aliases: ['Bano C P2 Mujeres'],
    keywords: ['wc', 'bano'],
  },
  // South Corridor Rooms (between C and B)
  {
    id: 'P203',
    name: 'Aula P 203',
    kind: 'classroom',
    polygon: rect(56, 0, 66, 5),
    door: { x: 61, y: 5 },
    corridorNodeKey: 'south.61',
    aliases: ['Aula P203', 'P203'],
    keywords: ['salon', 'clase'],
    capacity: 40,
  },
  {
    id: 'P202',
    name: 'Aula P 202',
    kind: 'classroom',
    polygon: rect(66, 0, 76, 5),
    door: { x: 71, y: 5 },
    corridorNodeKey: 'south.71',
    aliases: ['Aula P202', 'P202'],
    keywords: ['salon', 'clase'],
    capacity: 40,
  },
  {
    id: 'P201',
    name: 'Aula P 201',
    kind: 'classroom',
    polygon: rect(76, 0, 86, 5),
    door: { x: 81, y: 5 },
    corridorNodeKey: 'south.81',
    aliases: ['Aula P201', 'P201'],
    keywords: ['salon', 'clase'],
    capacity: 40,
  },
  // Wing B (Derecho classrooms & Salón Santander)
  {
    id: 'B202',
    name: 'Aula B 202',
    kind: 'classroom',
    polygon: rect(70, 48, 75, 58),
    door: { x: 75, y: 53 },
    corridorNodeKey: 'wingB.53',
    aliases: ['Aula B202', 'B202'],
    keywords: ['salon', 'derecho'],
    capacity: 35,
  },
  {
    id: 'B204',
    name: 'Aula B 204',
    kind: 'classroom',
    polygon: rect(70, 34, 75, 48),
    door: { x: 75, y: 41 },
    corridorNodeKey: 'wingB.41',
    aliases: ['Aula B204', 'B204'],
    keywords: ['salon', 'derecho'],
    capacity: 35,
  },
  {
    id: 'B205',
    name: 'Aula B 205',
    kind: 'classroom',
    polygon: rect(70, 20, 75, 34),
    door: { x: 75, y: 27 },
    corridorNodeKey: 'wingB.27',
    aliases: ['Aula B205', 'B205'],
    keywords: ['salon', 'derecho'],
    capacity: 35,
  },
  {
    id: 'B206',
    name: 'Aula B 206',
    kind: 'classroom',
    polygon: rect(70, 8, 75, 20),
    door: { x: 75, y: 14 },
    corridorNodeKey: 'wingB.14',
    aliases: ['Aula B206', 'B206'],
    keywords: ['salon', 'derecho'],
    capacity: 35,
  },
  {
    id: 'B203',
    name: 'Aula B 203',
    kind: 'classroom',
    polygon: rect(79, 44, 93, 58),
    door: { x: 79, y: 51 },
    corridorNodeKey: 'wingB.51',
    aliases: ['Aula B203', 'B203'],
    keywords: ['salon', 'derecho'],
    capacity: 45,
  },
  {
    id: 'B201',
    name: 'Aula B 201',
    kind: 'classroom',
    polygon: rect(79, 30, 93, 44),
    door: { x: 79, y: 37 },
    corridorNodeKey: 'wingB.37',
    aliases: ['Aula B201', 'B201'],
    keywords: ['salon', 'derecho'],
    capacity: 45,
  },
  {
    id: 'SALON-SANTANDER',
    name: 'Salón General Francisco de Paula Santander',
    kind: 'auditorium',
    polygon: rect(79, 20, 93, 30),
    door: { x: 79, y: 25 },
    corridorNodeKey: 'wingB.25',
    aliases: ['Salon Santander', 'General Santander'],
    keywords: ['auditorio', 'santander', 'conferencias'],
    capacity: 80,
  },
  {
    id: 'BANO-B2-H',
    name: 'Baños Hombres Bloque B P2',
    kind: 'bathroom',
    polygon: rect(79, 14, 93, 20),
    door: { x: 79, y: 17 },
    corridorNodeKey: 'wingB.17',
    aliases: ['Bano B P2'],
    keywords: ['wc', 'bano'],
  },
  {
    id: 'BANO-B2-M',
    name: 'Baños Mujeres Bloque B P2',
    kind: 'bathroom',
    polygon: rect(79, 8, 93, 14),
    door: { x: 79, y: 11 },
    corridorNodeKey: 'wingB.11',
    aliases: ['Bano B P2 Mujeres'],
    keywords: ['wc', 'bano'],
  },
  // Wing E (North Interconnecting Wing - Piso 2)
  {
    id: 'E211',
    name: 'Aula E 211',
    kind: 'classroom',
    polygon: rect(14, 74, 24, 85),
    door: { x: 19, y: 74 },
    corridorNodeKey: 'wingE.19',
    aliases: ['Aula E211', 'E211'],
    keywords: ['salon', 'clase', 'bloque e'],
    capacity: 35,
  },
  {
    id: 'E210',
    name: 'Aula E 210',
    kind: 'classroom',
    polygon: rect(24, 74, 34, 85),
    door: { x: 29, y: 74 },
    corridorNodeKey: 'wingE.29',
    aliases: ['Aula E210', 'E210'],
    keywords: ['salon', 'clase', 'bloque e'],
    capacity: 35,
  },
  {
    id: 'E209',
    name: 'Aula E 209',
    kind: 'classroom',
    polygon: rect(34, 74, 44, 85),
    door: { x: 39, y: 74 },
    corridorNodeKey: 'wingE.39',
    aliases: ['Aula E209', 'E209'],
    keywords: ['salon', 'clase', 'bloque e'],
    capacity: 35,
  },
  {
    id: 'E208',
    name: 'Aula E 208',
    kind: 'classroom',
    polygon: rect(44, 74, 54, 85),
    door: { x: 49, y: 74 },
    corridorNodeKey: 'wingE.49',
    aliases: ['Aula E208', 'E208'],
    keywords: ['salon', 'clase', 'bloque e'],
    capacity: 35,
  },
  {
    id: 'E207',
    name: 'Aula E 207',
    kind: 'classroom',
    polygon: rect(54, 74, 64, 85),
    door: { x: 59, y: 74 },
    corridorNodeKey: 'wingE.59',
    aliases: ['Aula E207', 'E207'],
    keywords: ['salon', 'clase', 'bloque e'],
    capacity: 35,
  },
  {
    id: 'E206',
    name: 'Aula E 206',
    kind: 'classroom',
    polygon: rect(64, 74, 74, 85),
    door: { x: 69, y: 74 },
    corridorNodeKey: 'wingE.69',
    aliases: ['Aula E206', 'E206'],
    keywords: ['salon', 'clase', 'bloque e'],
    capacity: 35,
  },
  {
    id: 'E205',
    name: 'Aula E 205',
    kind: 'classroom',
    polygon: rect(74, 74, 84, 85),
    door: { x: 79, y: 74 },
    corridorNodeKey: 'wingE.79',
    aliases: ['Aula E205', 'E205'],
    keywords: ['salon', 'clase', 'bloque e'],
    capacity: 35,
  },
  {
    id: 'E204',
    name: 'Aula E 204',
    kind: 'classroom',
    polygon: rect(84, 74, 94, 85),
    door: { x: 89, y: 74 },
    corridorNodeKey: 'wingE.89',
    aliases: ['Aula E204', 'E204'],
    keywords: ['salon', 'clase', 'bloque e'],
    capacity: 35,
  },
  {
    id: 'AUD-ESTEBAN-JARAMILLO',
    name: 'Auditorio Esteban Jaramillo',
    kind: 'auditorium',
    polygon: rect(94, 74, 108, 86),
    door: { x: 101, y: 74 },
    corridorNodeKey: 'wingE.101',
    aliases: ['Auditorio Jaramillo', 'Esteban Jaramillo'],
    keywords: ['auditorio', 'conferencias', 'eventos'],
    capacity: 120,
  },
  {
    id: 'SECCION-AUDIOVISUALES',
    name: 'Sección Audiovisuales',
    kind: 'service',
    polygon: rect(108, 74, 120, 86),
    door: { x: 114, y: 74 },
    corridorNodeKey: 'wingE.114',
    aliases: ['Audiovisuales', 'Medios'],
    keywords: ['proyectores', 'camaras', 'tecnologia'],
  },
  {
    id: 'AUD-GERMAN-ARCINIEGAS',
    name: 'Auditorio Germán Arciniegas',
    kind: 'auditorium',
    polygon: rect(110, 60, 126, 74),
    door: { x: 110, y: 67 },
    corridorNodeKey: 'wingE.110',
    aliases: ['Auditorio Arciniegas', 'German Arciniegas'],
    keywords: ['auditorio', 'eventos', 'arciniegas'],
    capacity: 150,
  },
  {
    id: 'BANO-E2-OESTE',
    name: 'Baños Bloque E P2 Oeste',
    kind: 'bathroom',
    polygon: rect(10, 62, 16, 70),
    door: { x: 13, y: 70 },
    corridorNodeKey: 'wingE.13',
    aliases: ['Bano E P2 Oeste'],
    keywords: ['wc', 'bano'],
  },
  {
    id: 'E201',
    name: 'Aula E 201',
    kind: 'classroom',
    polygon: rect(16, 62, 24, 70),
    door: { x: 20, y: 70 },
    corridorNodeKey: 'wingE.20',
    aliases: ['Aula E201', 'E201'],
    keywords: ['salon', 'clase'],
    capacity: 35,
  },
  {
    id: 'E202',
    name: 'Aula E 202',
    kind: 'classroom',
    polygon: rect(24, 62, 32, 70),
    door: { x: 28, y: 70 },
    corridorNodeKey: 'wingE.28',
    aliases: ['Aula E202', 'E202'],
    keywords: ['salon', 'clase'],
    capacity: 35,
  },
  {
    id: 'E203',
    name: 'Aula E 203',
    kind: 'classroom',
    polygon: rect(32, 62, 40, 70),
    door: { x: 36, y: 70 },
    corridorNodeKey: 'wingE.36',
    aliases: ['Aula E203', 'E203'],
    keywords: ['salon', 'clase'],
    capacity: 35,
  },
  {
    id: 'BANO-E2-CENTRO',
    name: 'Baños Bloque E P2 Centro',
    kind: 'bathroom',
    polygon: rect(44, 62, 49, 70),
    door: { x: 46.5, y: 70 },
    corridorNodeKey: 'wingE.46',
    aliases: ['Bano E P2 Centro'],
    keywords: ['wc', 'bano'],
  },
  {
    id: 'AE-E201',
    name: 'Aula Especial E 201',
    kind: 'classroom',
    polygon: rect(49, 62, 62, 70),
    door: { x: 55.5, y: 70 },
    corridorNodeKey: 'wingE.55',
    aliases: ['AE E201', 'Aula Especial 201'],
    keywords: ['salon', 'especial'],
    capacity: 45,
  },
  {
    id: 'AE-E202',
    name: 'Aula Especial E 202',
    kind: 'classroom',
    polygon: rect(62, 62, 74, 70),
    door: { x: 68, y: 70 },
    corridorNodeKey: 'wingE.68',
    aliases: ['AE E202', 'Aula Especial 202'],
    keywords: ['salon', 'especial'],
    capacity: 45,
  },
]

// -------------------------------------------------------------
// PISO 3 ROOMS
// -------------------------------------------------------------
const P3_ROOMS: RoomDef[] = [
  // Wing D (Left side: 300 classrooms & Design lab)
  {
    id: 'D305',
    name: 'Aula D 305',
    kind: 'classroom',
    polygon: rect(2, 50, 14, 60),
    door: { x: 14, y: 55 },
    corridorNodeKey: 'wingD.55',
    aliases: ['Aula D305', 'D305'],
    keywords: ['salon', 'clase'],
    capacity: 40,
  },
  {
    id: 'TALLER-DISENO',
    name: 'Taller de Diseño Gráfico',
    kind: 'laboratory',
    polygon: rect(2, 35, 14, 50),
    door: { x: 14, y: 42.5 },
    corridorNodeKey: 'wingD.42',
    aliases: ['Diseno Grafico', 'Taller Diseno'],
    keywords: ['diseno', 'taller', 'laboratorio'],
    capacity: 35,
  },
  {
    id: 'D306',
    name: 'Aula D 306',
    kind: 'classroom',
    polygon: rect(2, 23, 14, 35),
    door: { x: 14, y: 29 },
    corridorNodeKey: 'wingD.29',
    aliases: ['Aula D306', 'D306'],
    keywords: ['salon', 'clase'],
    capacity: 40,
  },
  {
    id: 'D307',
    name: 'Aula D 307',
    kind: 'classroom',
    polygon: rect(2, 15, 14, 23),
    door: { x: 14, y: 19 },
    corridorNodeKey: 'wingD.19',
    aliases: ['Aula D307', 'D307'],
    keywords: ['salon', 'clase'],
    capacity: 40,
  },
  {
    id: 'D308',
    name: 'Aula D 308',
    kind: 'classroom',
    polygon: rect(2, 8, 14, 15),
    door: { x: 14, y: 11.5 },
    corridorNodeKey: 'wingD.12',
    aliases: ['Aula D308', 'D308'],
    keywords: ['salon', 'clase'],
    capacity: 40,
  },
  // Wing D (Right side)
  {
    id: 'D304',
    name: 'Aula D 304',
    kind: 'classroom',
    polygon: rect(18, 48, 28, 58),
    door: { x: 18, y: 53 },
    corridorNodeKey: 'wingD.55',
    aliases: ['Aula D304', 'D304'],
    keywords: ['salon', 'clase'],
    capacity: 40,
  },
  {
    id: 'D303',
    name: 'Aula D 303',
    kind: 'classroom',
    polygon: rect(18, 38, 28, 48),
    door: { x: 18, y: 43 },
    corridorNodeKey: 'wingD.42',
    aliases: ['Aula D303', 'D303'],
    keywords: ['salon', 'clase'],
    capacity: 40,
  },
  {
    id: 'D302',
    name: 'Aula D 302',
    kind: 'classroom',
    polygon: rect(18, 28, 28, 38),
    door: { x: 18, y: 33 },
    corridorNodeKey: 'wingD.29',
    aliases: ['Aula D302', 'D302'],
    keywords: ['salon', 'clase'],
    capacity: 40,
  },
  {
    id: 'D301',
    name: 'Aula D 301',
    kind: 'classroom',
    polygon: rect(18, 18, 28, 28),
    door: { x: 18, y: 23 },
    corridorNodeKey: 'wingD.19',
    aliases: ['Aula D301', 'D301'],
    keywords: ['salon', 'clase'],
    capacity: 40,
  },
  {
    id: 'BANO-D3-H',
    name: 'Baños Hombres Bloque D P3',
    kind: 'bathroom',
    polygon: rect(18, 13, 28, 18),
    door: { x: 18, y: 15.5 },
    corridorNodeKey: 'wingD.16',
    aliases: ['Bano D P3'],
    keywords: ['wc', 'bano'],
  },
  {
    id: 'BANO-D3-M',
    name: 'Baños Mujeres Bloque D P3',
    kind: 'bathroom',
    polygon: rect(18, 8, 28, 13),
    door: { x: 18, y: 10.5 },
    corridorNodeKey: 'wingD.12',
    aliases: ['Bano D P3 Mujeres'],
    keywords: ['wc', 'bano'],
  },
  // South space: Fac. Educación & Maestría
  {
    id: 'FAC-EDUCACION',
    name: 'Facultad de Educación y Humanidades',
    kind: 'office',
    polygon: rect(24, 0, 42, 5),
    door: { x: 33, y: 5 },
    corridorNodeKey: 'south.33',
    aliases: ['Educacion y Humanidades', 'Fac Educacion'],
    keywords: ['educacion', 'humanidades', 'facultad'],
  },
  // Wing C (C301 to C312)
  {
    id: 'C306',
    name: 'Aula C 306',
    kind: 'classroom',
    polygon: rect(32, 52, 40, 60),
    door: { x: 40, y: 56 },
    corridorNodeKey: 'wingC.56',
    aliases: ['C306'],
    keywords: ['salon'],
  },
  {
    id: 'C307',
    name: 'Aula C 307',
    kind: 'classroom',
    polygon: rect(32, 44, 40, 52),
    door: { x: 40, y: 48 },
    corridorNodeKey: 'wingC.48',
    aliases: ['C307'],
    keywords: ['salon'],
  },
  {
    id: 'C308',
    name: 'Aula C 308',
    kind: 'classroom',
    polygon: rect(32, 36, 40, 44),
    door: { x: 40, y: 40 },
    corridorNodeKey: 'wingC.40',
    aliases: ['C308'],
    keywords: ['salon'],
  },
  {
    id: 'C309',
    name: 'Aula C 309',
    kind: 'classroom',
    polygon: rect(32, 28, 40, 36),
    door: { x: 40, y: 32 },
    corridorNodeKey: 'wingC.32',
    aliases: ['C309'],
    keywords: ['salon'],
  },
  {
    id: 'C310',
    name: 'Aula C 310',
    kind: 'classroom',
    polygon: rect(32, 20, 40, 28),
    door: { x: 40, y: 24 },
    corridorNodeKey: 'wingC.24',
    aliases: ['C310'],
    keywords: ['salon'],
  },
  {
    id: 'C311',
    name: 'Aula C 311',
    kind: 'classroom',
    polygon: rect(32, 14, 40, 20),
    door: { x: 40, y: 17 },
    corridorNodeKey: 'wingC.17',
    aliases: ['C311'],
    keywords: ['salon'],
  },
  {
    id: 'C312',
    name: 'Aula C 312',
    kind: 'classroom',
    polygon: rect(32, 8, 40, 14),
    door: { x: 40, y: 11 },
    corridorNodeKey: 'wingC.11',
    aliases: ['C312'],
    keywords: ['salon'],
  },
  {
    id: 'C305',
    name: 'Aula C 305',
    kind: 'classroom',
    polygon: rect(44, 52, 54, 60),
    door: { x: 44, y: 56 },
    corridorNodeKey: 'wingC.56',
    aliases: ['C305'],
    keywords: ['salon'],
  },
  {
    id: 'C304',
    name: 'Aula C 304',
    kind: 'classroom',
    polygon: rect(44, 44, 54, 52),
    door: { x: 44, y: 48 },
    corridorNodeKey: 'wingC.48',
    aliases: ['C304'],
    keywords: ['salon'],
  },
  {
    id: 'C303',
    name: 'Aula C 303',
    kind: 'classroom',
    polygon: rect(44, 36, 54, 44),
    door: { x: 44, y: 40 },
    corridorNodeKey: 'wingC.40',
    aliases: ['C303'],
    keywords: ['salon'],
  },
  {
    id: 'C302',
    name: 'Aula C 302',
    kind: 'classroom',
    polygon: rect(44, 28, 54, 36),
    door: { x: 44, y: 32 },
    corridorNodeKey: 'wingC.32',
    aliases: ['C302'],
    keywords: ['salon'],
  },
  {
    id: 'C301',
    name: 'Aula C 301',
    kind: 'classroom',
    polygon: rect(44, 20, 54, 28),
    door: { x: 44, y: 24 },
    corridorNodeKey: 'wingC.24',
    aliases: ['C301'],
    keywords: ['salon'],
  },
  {
    id: 'BANO-C3-H',
    name: 'Baños Hombres Bloque C P3',
    kind: 'bathroom',
    polygon: rect(44, 14, 54, 20),
    door: { x: 44, y: 17 },
    corridorNodeKey: 'wingC.17',
    aliases: ['Bano C P3'],
    keywords: ['wc', 'bano'],
  },
  {
    id: 'BANO-C3-M',
    name: 'Baños Mujeres Bloque C P3',
    kind: 'bathroom',
    polygon: rect(44, 8, 54, 14),
    door: { x: 44, y: 11 },
    corridorNodeKey: 'wingC.11',
    aliases: ['Bano C P3 Mujeres'],
    keywords: ['wc', 'bano'],
  },
  // South rooms P301-P304
  {
    id: 'P304',
    name: 'Aula P 304',
    kind: 'classroom',
    polygon: rect(56, 0, 64, 5),
    door: { x: 60, y: 5 },
    corridorNodeKey: 'south.60',
    aliases: ['P304'],
    keywords: ['salon'],
  },
  {
    id: 'P303',
    name: 'Aula P 303',
    kind: 'classroom',
    polygon: rect(64, 0, 72, 5),
    door: { x: 68, y: 5 },
    corridorNodeKey: 'south.68',
    aliases: ['P303'],
    keywords: ['salon'],
  },
  {
    id: 'P302',
    name: 'Aula P 302',
    kind: 'classroom',
    polygon: rect(72, 0, 80, 5),
    door: { x: 76, y: 5 },
    corridorNodeKey: 'south.76',
    aliases: ['P302'],
    keywords: ['salon'],
  },
  {
    id: 'P301',
    name: 'Aula P 301',
    kind: 'classroom',
    polygon: rect(80, 0, 88, 5),
    door: { x: 84, y: 5 },
    corridorNodeKey: 'south.84',
    aliases: ['P301'],
    keywords: ['salon'],
  },
  // Wing B (B301 to B312)
  {
    id: 'B306',
    name: 'Aula B 306',
    kind: 'classroom',
    polygon: rect(70, 52, 75, 60),
    door: { x: 75, y: 56 },
    corridorNodeKey: 'wingB.56',
    aliases: ['B306'],
    keywords: ['salon'],
  },
  {
    id: 'B307',
    name: 'Aula B 307',
    kind: 'classroom',
    polygon: rect(70, 44, 75, 52),
    door: { x: 75, y: 48 },
    corridorNodeKey: 'wingB.48',
    aliases: ['B307'],
    keywords: ['salon'],
  },
  {
    id: 'B308',
    name: 'Aula B 308',
    kind: 'classroom',
    polygon: rect(70, 36, 75, 44),
    door: { x: 75, y: 40 },
    corridorNodeKey: 'wingB.40',
    aliases: ['B308'],
    keywords: ['salon'],
  },
  {
    id: 'B309',
    name: 'Aula B 309',
    kind: 'classroom',
    polygon: rect(70, 28, 75, 36),
    door: { x: 75, y: 32 },
    corridorNodeKey: 'wingB.32',
    aliases: ['B309'],
    keywords: ['salon'],
  },
  {
    id: 'B310',
    name: 'Aula B 310',
    kind: 'classroom',
    polygon: rect(70, 20, 75, 28),
    door: { x: 75, y: 24 },
    corridorNodeKey: 'wingB.24',
    aliases: ['B310'],
    keywords: ['salon'],
  },
  {
    id: 'B311',
    name: 'Aula B 311',
    kind: 'classroom',
    polygon: rect(70, 14, 75, 20),
    door: { x: 75, y: 17 },
    corridorNodeKey: 'wingB.17',
    aliases: ['B311'],
    keywords: ['salon'],
  },
  {
    id: 'B312',
    name: 'Aula B 312',
    kind: 'classroom',
    polygon: rect(70, 8, 75, 14),
    door: { x: 75, y: 11 },
    corridorNodeKey: 'wingB.11',
    aliases: ['B312'],
    keywords: ['salon'],
  },
  {
    id: 'B305',
    name: 'Aula B 305',
    kind: 'classroom',
    polygon: rect(79, 52, 93, 60),
    door: { x: 79, y: 56 },
    corridorNodeKey: 'wingB.56',
    aliases: ['B305'],
    keywords: ['salon'],
  },
  {
    id: 'B304',
    name: 'Aula B 304',
    kind: 'classroom',
    polygon: rect(79, 44, 93, 52),
    door: { x: 79, y: 48 },
    corridorNodeKey: 'wingB.48',
    aliases: ['B304'],
    keywords: ['salon'],
  },
  {
    id: 'B303',
    name: 'Aula B 303',
    kind: 'classroom',
    polygon: rect(79, 36, 93, 44),
    door: { x: 79, y: 40 },
    corridorNodeKey: 'wingB.40',
    aliases: ['B303'],
    keywords: ['salon'],
  },
  {
    id: 'B302',
    name: 'Aula B 302',
    kind: 'classroom',
    polygon: rect(79, 28, 93, 36),
    door: { x: 79, y: 32 },
    corridorNodeKey: 'wingB.32',
    aliases: ['B302'],
    keywords: ['salon'],
  },
  {
    id: 'B301',
    name: 'Aula B 301',
    kind: 'classroom',
    polygon: rect(79, 20, 93, 28),
    door: { x: 79, y: 24 },
    corridorNodeKey: 'wingB.24',
    aliases: ['B301'],
    keywords: ['salon'],
  },
  {
    id: 'BANO-B3-H',
    name: 'Baños Hombres Bloque B P3',
    kind: 'bathroom',
    polygon: rect(79, 14, 93, 20),
    door: { x: 79, y: 17 },
    corridorNodeKey: 'wingB.17',
    aliases: ['Bano B P3'],
    keywords: ['wc', 'bano'],
  },
  {
    id: 'BANO-B3-M',
    name: 'Baños Mujeres Bloque B P3',
    kind: 'bathroom',
    polygon: rect(79, 8, 93, 14),
    door: { x: 79, y: 11 },
    corridorNodeKey: 'wingB.11',
    aliases: ['Bano B P3 Mujeres'],
    keywords: ['wc', 'bano'],
  },
  // Wing E (North Interconnecting Wing - Piso 3)
  {
    id: 'E313',
    name: 'Aula E 313',
    kind: 'classroom',
    polygon: rect(14, 74, 26, 85),
    door: { x: 20, y: 74 },
    corridorNodeKey: 'wingE.20',
    aliases: ['E313'],
    keywords: ['salon'],
  },
  {
    id: 'E312',
    name: 'Aula E 312',
    kind: 'classroom',
    polygon: rect(26, 74, 38, 85),
    door: { x: 32, y: 74 },
    corridorNodeKey: 'wingE.32',
    aliases: ['E312'],
    keywords: ['salon'],
  },
  {
    id: 'E311',
    name: 'Aula E 311',
    kind: 'classroom',
    polygon: rect(38, 74, 50, 85),
    door: { x: 44, y: 74 },
    corridorNodeKey: 'wingE.44',
    aliases: ['E311'],
    keywords: ['salon'],
  },
  {
    id: 'E310',
    name: 'Aula E 310',
    kind: 'classroom',
    polygon: rect(50, 74, 62, 85),
    door: { x: 56, y: 74 },
    corridorNodeKey: 'wingE.56',
    aliases: ['E310'],
    keywords: ['salon'],
  },
  {
    id: 'E309',
    name: 'Aula E 309',
    kind: 'classroom',
    polygon: rect(62, 74, 74, 85),
    door: { x: 68, y: 74 },
    corridorNodeKey: 'wingE.68',
    aliases: ['E309'],
    keywords: ['salon'],
  },
  {
    id: 'E308',
    name: 'Aula E 308',
    kind: 'classroom',
    polygon: rect(74, 74, 86, 85),
    door: { x: 80, y: 74 },
    corridorNodeKey: 'wingE.80',
    aliases: ['E308'],
    keywords: ['salon'],
  },
  {
    id: 'E307',
    name: 'Aula E 307',
    kind: 'classroom',
    polygon: rect(86, 74, 98, 85),
    door: { x: 92, y: 74 },
    corridorNodeKey: 'wingE.92',
    aliases: ['E307'],
    keywords: ['salon'],
  },
  {
    id: 'E306',
    name: 'Aula E 306',
    kind: 'classroom',
    polygon: rect(98, 74, 110, 85),
    door: { x: 104, y: 74 },
    corridorNodeKey: 'wingE.104',
    aliases: ['E306'],
    keywords: ['salon'],
  },
  {
    id: 'BANO-E3-OESTE',
    name: 'Baños Bloque E P3 Oeste',
    kind: 'bathroom',
    polygon: rect(10, 62, 16, 70),
    door: { x: 13, y: 70 },
    corridorNodeKey: 'wingE.13',
    aliases: ['Bano E P3 Oeste'],
    keywords: ['wc', 'bano'],
  },
  {
    id: 'E301',
    name: 'Aula E 301',
    kind: 'classroom',
    polygon: rect(16, 62, 25, 70),
    door: { x: 20.5, y: 70 },
    corridorNodeKey: 'wingE.20',
    aliases: ['E301'],
    keywords: ['salon'],
  },
  {
    id: 'E302',
    name: 'Aula E 302',
    kind: 'classroom',
    polygon: rect(25, 62, 34, 70),
    door: { x: 29.5, y: 70 },
    corridorNodeKey: 'wingE.32',
    aliases: ['E302'],
    keywords: ['salon'],
  },
  {
    id: 'E303',
    name: 'Aula E 303',
    kind: 'classroom',
    polygon: rect(34, 62, 43, 70),
    door: { x: 38.5, y: 70 },
    corridorNodeKey: 'wingE.39',
    aliases: ['E303'],
    keywords: ['salon'],
  },
  {
    id: 'BANO-E3-CENTRO',
    name: 'Baños Bloque E P3 Centro',
    kind: 'bathroom',
    polygon: rect(46, 62, 51, 70),
    door: { x: 48.5, y: 70 },
    corridorNodeKey: 'wingE.49',
    aliases: ['Bano E P3 Centro'],
    keywords: ['wc', 'bano'],
  },
  {
    id: 'E304',
    name: 'Aula E 304',
    kind: 'classroom',
    polygon: rect(51, 62, 63, 70),
    door: { x: 57, y: 70 },
    corridorNodeKey: 'wingE.56',
    aliases: ['E304'],
    keywords: ['salon'],
  },
  {
    id: 'E305',
    name: 'Aula E 305',
    kind: 'classroom',
    polygon: rect(63, 62, 75, 70),
    door: { x: 69, y: 70 },
    corridorNodeKey: 'wingE.68',
    aliases: ['E305'],
    keywords: ['salon'],
  },
]

// -------------------------------------------------------------
// PISO 4 ROOMS (Bloque E)
// -------------------------------------------------------------
const P4_ROOMS: RoomDef[] = [
  {
    id: 'E411',
    name: 'Aula E 411',
    kind: 'classroom',
    polygon: rect(14, 74, 26, 85),
    door: { x: 20, y: 74 },
    corridorNodeKey: 'wingE.20',
    aliases: ['E411'],
    keywords: ['salon'],
  },
  {
    id: 'E410',
    name: 'Aula E 410',
    kind: 'classroom',
    polygon: rect(26, 74, 38, 85),
    door: { x: 32, y: 74 },
    corridorNodeKey: 'wingE.32',
    aliases: ['E410'],
    keywords: ['salon'],
  },
  {
    id: 'E409',
    name: 'Aula E 409',
    kind: 'classroom',
    polygon: rect(38, 74, 50, 85),
    door: { x: 44, y: 74 },
    corridorNodeKey: 'wingE.44',
    aliases: ['E409'],
    keywords: ['salon'],
  },
  {
    id: 'E408',
    name: 'Aula E 408',
    kind: 'classroom',
    polygon: rect(50, 74, 62, 85),
    door: { x: 56, y: 74 },
    corridorNodeKey: 'wingE.56',
    aliases: ['E408'],
    keywords: ['salon'],
  },
  {
    id: 'E407',
    name: 'Aula E 407',
    kind: 'classroom',
    polygon: rect(62, 74, 74, 85),
    door: { x: 68, y: 74 },
    corridorNodeKey: 'wingE.68',
    aliases: ['E407'],
    keywords: ['salon'],
  },
  {
    id: 'E406',
    name: 'Aula E 406',
    kind: 'classroom',
    polygon: rect(74, 74, 84, 85),
    door: { x: 79, y: 74 },
    corridorNodeKey: 'wingE.80',
    aliases: ['E406'],
    keywords: ['salon'],
  },
  {
    id: 'AE-E401',
    name: 'Aula Especial E 401',
    kind: 'classroom',
    polygon: rect(84, 74, 94, 85),
    door: { x: 89, y: 74 },
    corridorNodeKey: 'wingE.89',
    aliases: ['AE E401'],
    keywords: ['salon', 'especial'],
  },
  {
    id: 'E405',
    name: 'Aula E 405',
    kind: 'classroom',
    polygon: rect(94, 74, 108, 85),
    door: { x: 101, y: 74 },
    corridorNodeKey: 'wingE.104',
    aliases: ['E405'],
    keywords: ['salon'],
  },
  {
    id: 'RAMA-IEEE',
    name: 'Rama Estudiantil IEEE',
    kind: 'office',
    polygon: rect(108, 74, 118, 85),
    door: { x: 113, y: 74 },
    corridorNodeKey: 'wingE.110',
    aliases: ['IEEE', 'Rama IEEE'],
    keywords: ['ieee', 'estudiantes', 'ingenieria'],
  },
  {
    id: 'ASUNTOS-DISCIPLINARIOS',
    name: 'Sección de Asuntos Disciplinarios de Estudiantes',
    kind: 'office',
    polygon: rect(118, 74, 128, 85),
    door: { x: 120, y: 74 },
    corridorNodeKey: 'wingE.115',
    aliases: ['Asuntos Disciplinarios', 'Disciplinarios'],
    keywords: ['disciplinarios', 'estudiantes'],
  },
  {
    id: 'BANO-E4-OESTE',
    name: 'Baños Bloque E P4 Oeste',
    kind: 'bathroom',
    polygon: rect(10, 62, 16, 70),
    door: { x: 13, y: 70 },
    corridorNodeKey: 'wingE.13',
    aliases: ['Bano E P4 Oeste'],
    keywords: ['wc', 'bano'],
  },
  {
    id: 'E401',
    name: 'Aula E 401',
    kind: 'classroom',
    polygon: rect(16, 62, 26, 70),
    door: { x: 21, y: 70 },
    corridorNodeKey: 'wingE.20',
    aliases: ['E401'],
    keywords: ['salon'],
  },
  {
    id: 'E402',
    name: 'Aula E 402',
    kind: 'classroom',
    polygon: rect(26, 62, 36, 70),
    door: { x: 31, y: 70 },
    corridorNodeKey: 'wingE.32',
    aliases: ['E402'],
    keywords: ['salon'],
  },
  {
    id: 'E403',
    name: 'Aula E 403',
    kind: 'classroom',
    polygon: rect(36, 62, 46, 70),
    door: { x: 41, y: 70 },
    corridorNodeKey: 'wingE.44',
    aliases: ['E403'],
    keywords: ['salon'],
  },
  {
    id: 'BANO-E4-CENTRO',
    name: 'Baños Bloque E P4 Centro',
    kind: 'bathroom',
    polygon: rect(46, 62, 53, 70),
    door: { x: 49.5, y: 70 },
    corridorNodeKey: 'wingE.49',
    aliases: ['Bano E P4 Centro'],
    keywords: ['wc', 'bano'],
  },
  {
    id: 'E404',
    name: 'Aula E 404',
    kind: 'classroom',
    polygon: rect(53, 62, 66, 70),
    door: { x: 59.5, y: 70 },
    corridorNodeKey: 'wingE.56',
    aliases: ['E404'],
    keywords: ['salon'],
  },
  {
    id: 'AE-E402',
    name: 'Aula Especial E 402',
    kind: 'classroom',
    polygon: rect(66, 62, 80, 70),
    door: { x: 73, y: 70 },
    corridorNodeKey: 'wingE.68',
    aliases: ['AE E402'],
    keywords: ['salon', 'especial'],
  },
]

// -------------------------------------------------------------
// PISO 5 ROOMS (Bloque E)
// -------------------------------------------------------------
const P5_ROOMS: RoomDef[] = [
  {
    id: 'LAB3-MULTI',
    name: 'Lab 3 Ing. en Multimedia',
    kind: 'laboratory',
    polygon: rect(14, 74, 26, 85),
    door: { x: 20, y: 74 },
    corridorNodeKey: 'wingE.20',
    aliases: ['Lab 3 Multimedia', 'Lab Multimedia 3'],
    keywords: ['multimedia', 'laboratorio', 'ingenieria'],
    capacity: 30,
  },
  {
    id: 'LAB2-MULTI',
    name: 'Lab 2 Ing. en Multimedia',
    kind: 'laboratory',
    polygon: rect(26, 74, 38, 85),
    door: { x: 32, y: 74 },
    corridorNodeKey: 'wingE.32',
    aliases: ['Lab 2 Multimedia', 'Lab Multimedia 2'],
    keywords: ['multimedia', 'laboratorio', 'ingenieria'],
    capacity: 30,
  },
  {
    id: 'E508',
    name: 'Aula E 508',
    kind: 'classroom',
    polygon: rect(38, 74, 50, 85),
    door: { x: 44, y: 74 },
    corridorNodeKey: 'wingE.44',
    aliases: ['E508'],
    keywords: ['salon'],
  },
  {
    id: 'E507',
    name: 'Aula E 507',
    kind: 'classroom',
    polygon: rect(50, 74, 62, 85),
    door: { x: 56, y: 74 },
    corridorNodeKey: 'wingE.56',
    aliases: ['E507'],
    keywords: ['salon'],
  },
  {
    id: 'E506',
    name: 'Aula E 506',
    kind: 'classroom',
    polygon: rect(62, 74, 74, 85),
    door: { x: 68, y: 74 },
    corridorNodeKey: 'wingE.68',
    aliases: ['E506'],
    keywords: ['salon'],
  },
  {
    id: 'E505',
    name: 'Aula E 505',
    kind: 'classroom',
    polygon: rect(74, 74, 84, 85),
    door: { x: 79, y: 74 },
    corridorNodeKey: 'wingE.80',
    aliases: ['E505'],
    keywords: ['salon'],
  },
  {
    id: 'LAB-ELECTRONICA',
    name: 'Laboratorio de Electrónica y Comunicaciones',
    kind: 'laboratory',
    polygon: rect(84, 74, 94, 85),
    door: { x: 89, y: 74 },
    corridorNodeKey: 'wingE.89',
    aliases: ['Lab Electronica', 'Electronica y Comunicaciones'],
    keywords: ['electronica', 'comunicaciones', 'laboratorio'],
    capacity: 30,
  },
  {
    id: 'SALA-PROF-ING',
    name: 'Sala de Profesores de Ingeniería',
    kind: 'office',
    polygon: rect(94, 74, 108, 85),
    door: { x: 101, y: 74 },
    corridorNodeKey: 'wingE.104',
    aliases: ['Sala Profesores Ingenieria'],
    keywords: ['profesores', 'docentes', 'ingenieria'],
  },
  {
    id: 'FONDO-EMPLEADOS',
    name: 'Fondo de Empleados de la UMNG',
    kind: 'office',
    polygon: rect(108, 74, 118, 85),
    door: { x: 113, y: 74 },
    corridorNodeKey: 'wingE.110',
    aliases: ['Fondo Empleados'],
    keywords: ['fondo', 'empleados', 'credito'],
  },
  {
    id: 'DOCTORADO-INNOVACION',
    name: 'Doctorado en Innovación, Desarrollo y Organizaciones',
    kind: 'office',
    polygon: rect(118, 74, 128, 85),
    door: { x: 120, y: 74 },
    corridorNodeKey: 'wingE.115',
    aliases: ['Doctorado Innovacion'],
    keywords: ['doctorado', 'posgrados', 'innovacion'],
  },
  {
    id: 'BANO-E5-OESTE',
    name: 'Baños Bloque E P5 Oeste',
    kind: 'bathroom',
    polygon: rect(10, 62, 16, 70),
    door: { x: 13, y: 70 },
    corridorNodeKey: 'wingE.13',
    aliases: ['Bano E P5 Oeste'],
    keywords: ['wc', 'bano'],
  },
  {
    id: 'E501',
    name: 'Aula E 501',
    kind: 'classroom',
    polygon: rect(16, 62, 26, 70),
    door: { x: 21, y: 70 },
    corridorNodeKey: 'wingE.20',
    aliases: ['E501'],
    keywords: ['salon'],
  },
  {
    id: 'E502',
    name: 'Aula E 502',
    kind: 'classroom',
    polygon: rect(26, 62, 36, 70),
    door: { x: 31, y: 70 },
    corridorNodeKey: 'wingE.32',
    aliases: ['E502'],
    keywords: ['salon'],
  },
  {
    id: 'E503',
    name: 'Aula E 503',
    kind: 'classroom',
    polygon: rect(36, 62, 46, 70),
    door: { x: 41, y: 70 },
    corridorNodeKey: 'wingE.44',
    aliases: ['E503'],
    keywords: ['salon'],
  },
  {
    id: 'BANO-E5-CENTRO',
    name: 'Baños Bloque E P5 Centro',
    kind: 'bathroom',
    polygon: rect(46, 62, 53, 70),
    door: { x: 49.5, y: 70 },
    corridorNodeKey: 'wingE.49',
    aliases: ['Bano E P5 Centro'],
    keywords: ['wc', 'bano'],
  },
  {
    id: 'REALIDAD-VIRTUAL',
    name: 'Centro de Realidad Virtual',
    kind: 'laboratory',
    polygon: rect(53, 62, 66, 70),
    door: { x: 59.5, y: 70 },
    corridorNodeKey: 'wingE.56',
    aliases: ['Realidad Virtual', 'VR Lab'],
    keywords: ['vr', 'realidad virtual', 'computacion'],
    capacity: 25,
  },
  {
    id: 'LAB-REDES-TELECO',
    name: 'Laboratorio Redes en Telecomunicaciones',
    kind: 'laboratory',
    polygon: rect(66, 62, 80, 70),
    door: { x: 73, y: 70 },
    corridorNodeKey: 'wingE.68',
    aliases: ['Lab Redes', 'Telecomunicaciones'],
    keywords: ['redes', 'telecomunicaciones', 'cisco'],
    capacity: 30,
  },
]

/**
 * Build Floor 2 or 3 (which share the general Bloques B, C, D, E layout).
 */
function buildIntermediateFloor(
  level: 2 | 3,
  rooms: RoomDef[],
): { floor: Floor; catalog: CatalogEntry[] } {
  const floorId = `umng-calle100-p${level}`
  const pfx = `c100-p${level}`
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const spaces: Space[] = []
  const catalog: CatalogEntry[] = []
  const nodeIndex = new Map<string, GraphNode>()

  const addNode = (
    idSuffix: string,
    point: LocalPoint,
    kind: GraphNode['kind'],
    qrKey?: string,
  ): string => {
    const id = `${pfx}.${idSuffix}`
    const node: GraphNode = { id, point, kind, ...(qrKey ? { qrKey } : {}) }
    nodes.push(node)
    nodeIndex.set(id, node)
    return id
  }

  const connect = (
    fromId: string,
    toId: string,
    kind: GraphEdge['kind'] = 'walkway',
    accessible = true,
  ): void => {
    const a = nodeIndex.get(fromId)
    const b = nodeIndex.get(toId)
    if (!a || !b) return
    const distance = Math.hypot(b.point.x - a.point.x, b.point.y - a.point.y)
    edges.push({
      from: fromId,
      to: toId,
      kind,
      accessible,
      distance: Number(distance.toFixed(2)),
    })
  }

  // 1. Spines
  // South Corridor Spine
  const southXCoords = [3, 6, 14, 16, 25, 33, 41, 42, 53, 60, 61, 68, 71, 76, 77, 81, 84, 85, 96]
  const southNodes = southXCoords.map((x) => addNode(`south.${x}`, { x, y: 6 }, 'hallway'))
  for (let i = 1; i < southNodes.length; i += 1) {
    connect(southNodes[i - 1]!, southNodes[i]!)
  }

  // Wing D Spine
  const wingDYCoords = [12, 16, 19, 23, 29, 37, 42, 44, 51, 55]
  const wingDNodes = wingDYCoords.map((y) => addNode(`wingD.${y}`, { x: 16, y }, 'hallway'))
  connect(`${pfx}.south.16`, wingDNodes[0]!)
  for (let i = 1; i < wingDNodes.length; i += 1) {
    connect(wingDNodes[i - 1]!, wingDNodes[i]!)
  }

  // Wing C Spine (Pasillo C)
  const wingCYCoords = [11, 14, 17, 24, 27, 32, 40, 41, 48, 53, 56, 68]
  const wingCNodes = wingCYCoords.map((y) => addNode(`wingC.${y}`, { x: 42, y }, 'hallway'))
  connect(`${pfx}.south.42`, wingCNodes[0]!)
  for (let i = 1; i < wingCNodes.length; i += 1) {
    connect(wingCNodes[i - 1]!, wingCNodes[i]!)
  }

  // Wing B Spine (Pasillo B)
  const wingBYCoords = [11, 14, 17, 24, 25, 27, 32, 37, 40, 41, 48, 51, 53, 56, 68]
  const wingBNodes = wingBYCoords.map((y) => addNode(`wingB.${y}`, { x: 77, y }, 'hallway'))
  connect(`${pfx}.south.77`, wingBNodes[0]!)
  for (let i = 1; i < wingBNodes.length; i += 1) {
    connect(wingBNodes[i - 1]!, wingBNodes[i]!)
  }

  // Wing E Spine
  const wingEXCoords = [
    10, 13, 14, 19, 20, 28, 29, 32, 36, 39, 42, 44, 46, 49, 55, 56, 59, 68, 69, 72, 74, 77, 79, 80,
    89, 92, 101, 104, 110, 114, 115,
  ]
  const wingENodes = wingEXCoords.map((x) => addNode(`wingE.${x}`, { x, y: 72 }, 'hallway'))
  for (let i = 1; i < wingENodes.length; i += 1) {
    connect(wingENodes[i - 1]!, wingENodes[i]!)
  }

  // Connect Vertical Corridors to Wing E
  connect(wingCNodes[wingCNodes.length - 1]!, `${pfx}.wingE.42`)
  connect(wingBNodes[wingBNodes.length - 1]!, `${pfx}.wingE.77`)

  // North-west connector: Wing D top → Wing E (mirrors Floor 1 layout)
  const connWingDE = addNode('conn-wingd-e', { x: 16, y: 66 }, 'junction')
  connect(`${pfx}.wingD.55`, connWingDE)
  connect(connWingDE, `${pfx}.wingE.13`)

  // 2. Vertical Cores
  const escD = addNode('esc-d', { x: 3, y: 6 }, 'stair', `ESC-D-P${level}`)
  connect(escD, `${pfx}.south.6`, 'stair')
  const ascD = addNode('asc-d', { x: 14, y: 4.5 }, 'elevator', `ASC-D-P${level}`)
  connect(ascD, `${pfx}.south.14`, 'elevator')

  const escC = addNode('esc-c', { x: 41, y: 7.5 }, 'stair', `ESC-C-P${level}`)
  connect(escC, `${pfx}.south.41`, 'stair')

  const escB = addNode('esc-b', { x: 85, y: 7.5 }, 'stair', `ESC-B-P${level}`)
  connect(escB, `${pfx}.south.85`, 'stair')

  const escEOeste = addNode('esc-e-oeste', { x: 10, y: 74 }, 'stair', `ESC-E1-P${level}`)
  connect(escEOeste, `${pfx}.wingE.10`, 'stair')
  const ascE = addNode('asc-e', { x: 14, y: 74 }, 'elevator', `ASC-E-P${level}`)
  connect(ascE, `${pfx}.wingE.14`, 'elevator')

  const escECentro = addNode('esc-e-centro', { x: 72, y: 70 }, 'stair', `ESC-E2-P${level}`)
  connect(escECentro, `${pfx}.wingE.72`, 'stair')

  // 3. Rooms
  let qrCounter = level * 100
  for (const room of rooms) {
    qrCounter += 1
    const doorNodeId = addNode(`door-${room.id}`, room.door, 'door', `N${qrCounter}`)
    connect(doorNodeId, `${pfx}.${room.corridorNodeKey}`, 'door')

    spaces.push({
      id: room.id,
      name: room.name,
      aliases: room.aliases,
      kind: room.kind,
      anchorNodeId: doorNodeId,
      polygon: room.polygon,
      ...(room.capacity ? { capacity: room.capacity } : {}),
      ...(room.restricted ? { restricted: room.restricted } : {}),
    })

    catalog.push({
      id: room.id,
      name: room.name,
      aliases: room.aliases,
      keywords: room.keywords,
      buildingId: CALLE100_BUILDING_ID,
      floorId,
      level,
      kind: room.kind,
      active: true,
      ...(room.restricted ? { restricted: room.restricted } : {}),
    })
  }

  const floor: Floor = {
    id: floorId,
    buildingId: CALLE100_BUILDING_ID,
    level,
    levelLabel: `Piso ${level}`,
    levelShort: `P${level}`,
    order: level,
    bounds: [0, 0, 126, 92],
    spaces,
    walkways: [
      { id: `w-south-p${level}`, polygon: rect(3, 4, 100, 8) },
      { id: `w-wingD-p${level}`, polygon: rect(14, 6, 18, 60) },
      { id: `w-wingC-p${level}`, polygon: rect(40, 6, 44, 74) },
      { id: `w-wingB-p${level}`, polygon: rect(75, 6, 79, 74) },
      { id: `w-wingE-p${level}`, polygon: rect(8, 70, 120, 74) },
      { id: `w-conn-wingd-e-p${level}`, polygon: rect(10, 62, 18, 70) },
    ],
    nodes,
    edges,
    transitions: [], // Populated at campus assembly
  }

  return { floor, catalog }
}

/**
 * Build Floor 4 or 5 (Bloque E only).
 */
function buildUpperWingEFloor(
  level: 4 | 5,
  rooms: RoomDef[],
): { floor: Floor; catalog: CatalogEntry[] } {
  const floorId = `umng-calle100-p${level}`
  const pfx = `c100-p${level}`
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const spaces: Space[] = []
  const catalog: CatalogEntry[] = []
  const nodeIndex = new Map<string, GraphNode>()

  const addNode = (
    idSuffix: string,
    point: LocalPoint,
    kind: GraphNode['kind'],
    qrKey?: string,
  ): string => {
    const id = `${pfx}.${idSuffix}`
    const node: GraphNode = { id, point, kind, ...(qrKey ? { qrKey } : {}) }
    nodes.push(node)
    nodeIndex.set(id, node)
    return id
  }

  const connect = (
    fromId: string,
    toId: string,
    kind: GraphEdge['kind'] = 'walkway',
    accessible = true,
  ): void => {
    const a = nodeIndex.get(fromId)
    const b = nodeIndex.get(toId)
    if (!a || !b) return
    const distance = Math.hypot(b.point.x - a.point.x, b.point.y - a.point.y)
    edges.push({
      from: fromId,
      to: toId,
      kind,
      accessible,
      distance: Number(distance.toFixed(2)),
    })
  }

  // Wing E Spine
  const wingEXCoords = [10, 13, 14, 20, 32, 44, 49, 56, 68, 72, 80, 89, 104, 110, 115, 120]
  const wingENodes = wingEXCoords.map((x) => addNode(`wingE.${x}`, { x, y: 72 }, 'hallway'))
  for (let i = 1; i < wingENodes.length; i += 1) {
    connect(wingENodes[i - 1]!, wingENodes[i]!)
  }

  // Vertical Cores
  const escEOeste = addNode('esc-e-oeste', { x: 10, y: 74 }, 'stair', `ESC-E1-P${level}`)
  connect(escEOeste, `${pfx}.wingE.10`, 'stair')
  const ascE = addNode('asc-e', { x: 14, y: 74 }, 'elevator', `ASC-E-P${level}`)
  connect(ascE, `${pfx}.wingE.14`, 'elevator')

  const escECentro = addNode('esc-e-centro', { x: 72, y: 70 }, 'stair', `ESC-E2-P${level}`)
  connect(escECentro, `${pfx}.wingE.72`, 'stair')

  // Rooms
  let qrCounter = level * 100
  for (const room of rooms) {
    qrCounter += 1
    const doorNodeId = addNode(`door-${room.id}`, room.door, 'door', `N${qrCounter}`)
    connect(doorNodeId, `${pfx}.${room.corridorNodeKey}`, 'door')

    spaces.push({
      id: room.id,
      name: room.name,
      aliases: room.aliases,
      kind: room.kind,
      anchorNodeId: doorNodeId,
      polygon: room.polygon,
      ...(room.capacity ? { capacity: room.capacity } : {}),
      ...(room.restricted ? { restricted: room.restricted } : {}),
    })

    catalog.push({
      id: room.id,
      name: room.name,
      aliases: room.aliases,
      keywords: room.keywords,
      buildingId: CALLE100_BUILDING_ID,
      floorId,
      level,
      kind: room.kind,
      active: true,
      ...(room.restricted ? { restricted: room.restricted } : {}),
    })
  }

  const floor: Floor = {
    id: floorId,
    buildingId: CALLE100_BUILDING_ID,
    level,
    levelLabel: `Piso ${level}`,
    levelShort: `P${level}`,
    order: level,
    bounds: [8, 60, 130, 88],
    spaces,
    walkways: [{ id: `w-wingE-p${level}`, polygon: rect(8, 70, 122, 74) }],
    nodes,
    edges,
    transitions: [],
  }

  return { floor, catalog }
}

// -------------------------------------------------------------
// WHOLE CAMPUS BUILDER & TRANSITIONS
// -------------------------------------------------------------
import { buildCalle100Floor1 } from './calle100Floor1'

export interface BuiltCampus {
  building: Building
  floors: Floor[]
  catalog: CatalogEntry[]
}

export function buildCalle100FullCampus(): BuiltCampus {
  const p1 = buildCalle100Floor1()
  const p2 = buildIntermediateFloor(2, P2_ROOMS)
  const p3 = buildIntermediateFloor(3, P3_ROOMS)
  const p4 = buildUpperWingEFloor(4, P4_ROOMS)
  const p5 = buildUpperWingEFloor(5, P5_ROOMS)

  const floors = [p1.floor, p2.floor, p3.floor, p4.floor, p5.floor]
  const catalog = [...p1.catalog, ...p2.catalog, ...p3.catalog, ...p4.catalog, ...p5.catalog]

  // Vertical transitions link connecting vertical cores
  interface TransitionLink {
    coreId: string
    levels: number[]
    nodeSuffix: string
    type: 'stairs' | 'elevator'
  }

  const CORE_LINKS: TransitionLink[] = [
    { coreId: 'ESC-D', levels: [1, 2, 3], nodeSuffix: 'esc-d', type: 'stairs' },
    { coreId: 'ASC-D', levels: [1, 2, 3], nodeSuffix: 'asc-d', type: 'elevator' },
    { coreId: 'ESC-C', levels: [1, 2, 3], nodeSuffix: 'esc-c', type: 'stairs' },
    { coreId: 'ESC-B', levels: [1, 2, 3], nodeSuffix: 'esc-b', type: 'stairs' },
    { coreId: 'ESC-E1', levels: [1, 2, 3, 4, 5], nodeSuffix: 'esc-e-oeste', type: 'stairs' },
    { coreId: 'ASC-E', levels: [1, 2, 3, 4, 5], nodeSuffix: 'asc-e', type: 'elevator' },
    { coreId: 'ESC-E2', levels: [1, 2, 3, 4, 5], nodeSuffix: 'esc-e-centro', type: 'stairs' },
  ]

  const floorMap = new Map<number, Floor>()
  for (const floor of floors) floorMap.set(floor.level, floor)

  for (const link of CORE_LINKS) {
    for (let i = 0; i < link.levels.length - 1; i += 1) {
      const fromLvl = link.levels[i]!
      const toLvl = link.levels[i + 1]!

      const fFrom = floorMap.get(fromLvl)
      const fTo = floorMap.get(toLvl)
      if (!fFrom || !fTo) continue

      const pfxFrom = `c100-p${fromLvl}`
      const pfxTo = `c100-p${toLvl}`

      const nodeFrom = `${pfxFrom}.${link.nodeSuffix}`
      const nodeTo = `${pfxTo}.${link.nodeSuffix}`

      // Upwards transition
      fFrom.transitions.push({
        id: `trans-${link.coreId}-up-${fromLvl}-${toLvl}`,
        type: link.type,
        fromNodeId: nodeFrom,
        toNodeId: nodeTo,
        fromLevel: fromLvl,
        toLevel: toLvl,
        accessible: link.type === 'elevator',
      })

      // Downwards transition
      fTo.transitions.push({
        id: `trans-${link.coreId}-down-${toLvl}-${fromLvl}`,
        type: link.type,
        fromNodeId: nodeTo,
        toNodeId: nodeFrom,
        fromLevel: toLvl,
        toLevel: fromLvl,
        accessible: link.type === 'elevator',
      })
    }
  }

  const building: Building = {
    id: CALLE100_BUILDING_ID,
    name: 'UMNG Sede Calle 100',
    aliases: ['Sede Calle 100', 'Calle 100', 'UMNG Bogotá'],
    campus: 'calle-100',
    origin: {
      lat: 4.683094,
      lng: -74.041943,
      rotation: 0,
    },
    levels: floors.map((f) => f.id),
  }

  return { building, floors, catalog }
}

const fullBuilt = buildCalle100FullCampus()
export const calle100BuildingFull: Building = fullBuilt.building
export const calle100FloorsFull: Floor[] = fullBuilt.floors
export const calle100CatalogFull: CatalogEntry[] = fullBuilt.catalog
