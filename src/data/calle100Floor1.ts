/**
 * Real Floor 1 data for Universidad Militar Nueva Granada (Sede Calle 100, Bogota).
 *
 * Digitized from hand-drawn campus plans:
 * - MapasDibujados/PrimerPiso ABCD.jpeg (Wings A, B, C, D, corridors & classrooms)
 * - MapasDibujados/PrimerPiso E.jpeg (Wing E, interconnecting corridors & facilities)
 * - MapasDibujados/Significado colores.jpeg (Semantic labels, faculties & offices)
 *
 * Units: meters, origin at south-west building reference corner (+x east, +y north).
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

export const CALLE100_BUILDING_ID = 'umng-calle100'
export const CALLE100_FLOOR1_ID = 'umng-calle100-p1'

export const calle100Building: Building = {
  id: CALLE100_BUILDING_ID,
  name: 'UMNG Sede Calle 100',
  aliases: ['Sede Calle 100', 'Calle 100', 'UMNG Bogotá'],
  campus: 'calle-100',
  origin: {
    lat: 4.683094,
    lng: -74.041943,
    rotation: 0,
  },
  levels: [CALLE100_FLOOR1_ID],
}

function rect(x1: number, y1: number, x2: number, y2: number): LocalPoint[] {
  return [
    { x: x1, y: y1 },
    { x: x2, y: y1 },
    { x: x2, y: y2 },
    { x: x1, y: y2 },
  ]
}

interface RoomDefinition {
  id: string
  name: string
  kind: SpaceKind
  polygon: LocalPoint[]
  door: LocalPoint
  corridorNodeId: string
  aliases: string[]
  keywords: string[]
  capacity?: number
  restricted?: boolean
}

const ROOM_DEFINITIONS: RoomDefinition[] = [
  // --- South corridor rooms (Ing. Mecatrónica, Aulas C101 & B101, Fac. Ciencias Económicas) ---
  {
    id: 'ING-MECATRONICA',
    name: 'Programa Ingeniería Mecatrónica',
    kind: 'office',
    polygon: rect(18, 0, 32, 4),
    door: { x: 25, y: 4 },
    corridorNodeId: 'south.25',
    aliases: ['Ing Mecatronica', 'Mecatronica'],
    keywords: ['ingenieria', 'robotica', 'mecatronica'],
  },
  {
    id: 'AULA-C101',
    name: 'Aula C 101',
    kind: 'classroom',
    polygon: rect(32, 0, 42, 4),
    door: { x: 37, y: 4 },
    corridorNodeId: 'south.37',
    aliases: ['Aula C101', 'C101', 'C 101'],
    keywords: ['salon', 'clase', 'bloque c'],
    capacity: 45,
  },
  {
    id: 'AULA-B101',
    name: 'Aula B 101',
    kind: 'classroom',
    polygon: rect(48, 0, 58, 4),
    door: { x: 53, y: 4 },
    corridorNodeId: 'south.53',
    aliases: ['Aula B101', 'B101', 'B 101'],
    keywords: ['salon', 'clase', 'bloque b'],
    capacity: 45,
  },
  {
    id: 'POST-RIES-SUR',
    name: 'Postgrados Fac. de R.I.E.S',
    kind: 'office',
    polygon: rect(58, 0, 66, 4),
    door: { x: 62, y: 4 },
    corridorNodeId: 'south.62',
    aliases: ['Postgrados RIES', 'RIES'],
    keywords: ['relaciones internacionales', 'postgrados'],
  },
  {
    id: 'OFICINA-ACREDITACION-ECONOMIA',
    name: 'Oficina de Acreditación Fac. Ciencias Económicas',
    kind: 'office',
    polygon: rect(66, 0, 74, 4),
    door: { x: 70, y: 4 },
    corridorNodeId: 'south.70',
    aliases: ['Acreditacion Economia'],
    keywords: ['acreditacion', 'economia', 'calidad'],
  },
  {
    id: 'POST-ECONOMIA-SUR',
    name: 'Postgrados Facultad Ciencias Económicas',
    kind: 'office',
    polygon: rect(74, 0, 84, 4),
    door: { x: 79, y: 4 },
    corridorNodeId: 'south.79',
    aliases: ['Postgrados Economia'],
    keywords: ['postgrados', 'economia'],
  },

  // --- Wing D: Facultad de Ingeniería (West) ---
  {
    id: 'ING-CIVIL',
    name: 'Programa Ingeniería Civil',
    kind: 'office',
    polygon: rect(2, 8, 14, 17),
    door: { x: 14, y: 12.5 },
    corridorNodeId: 'wingD.13',
    aliases: ['Ing Civil', 'Civil'],
    keywords: ['ingenieria', 'civil', 'estructuras'],
  },
  {
    id: 'ING-INDUSTRIAL',
    name: 'Programa Ingeniería Industrial',
    kind: 'office',
    polygon: rect(2, 17, 14, 26),
    door: { x: 14, y: 21.5 },
    corridorNodeId: 'wingD.22',
    aliases: ['Ing Industrial', 'Industrial'],
    keywords: ['ingenieria', 'industrial', 'procesos'],
  },
  {
    id: 'VICEDEC-ING',
    name: 'Vicedecanatura Fac. Ingeniería',
    kind: 'office',
    polygon: rect(2, 26, 14, 35),
    door: { x: 14, y: 30.5 },
    corridorNodeId: 'wingD.31',
    aliases: ['Vicedecanatura Ingenieria'],
    keywords: ['vicedecanatura', 'ingenieria'],
  },
  {
    id: 'POSG-ING',
    name: 'Dirección Posgrados Fac. Ingeniería',
    kind: 'office',
    polygon: rect(2, 35, 14, 44),
    door: { x: 14, y: 39.5 },
    corridorNodeId: 'wingD.40',
    aliases: ['Posgrados Ingenieria'],
    keywords: ['posgrados', 'maestria', 'ingenieria'],
  },
  {
    id: 'EQUIPO-MULTIFUNCIONAL',
    name: 'Equipo Multifuncional Ingeniería',
    kind: 'office',
    polygon: rect(2, 44, 14, 53),
    door: { x: 14, y: 48.5 },
    corridorNodeId: 'wingD.49',
    aliases: ['Equipo Multifuncional'],
    keywords: ['multifuncional', 'ingenieria'],
  },
  {
    id: 'DECANATURA-ING',
    name: 'Decanatura Facultad de Ingeniería',
    kind: 'office',
    polygon: rect(2, 53, 14, 62),
    door: { x: 14, y: 57.5 },
    corridorNodeId: 'wingD.58',
    aliases: ['Decanatura Ingenieria', 'Decano Ingenieria'],
    keywords: ['decanatura', 'ingenieria', 'decano'],
  },

  // --- Biblioteca Central (between Wing D and Wing C) ---
  {
    id: 'BIBLIOTECA-CENTRAL',
    name: 'Biblioteca Central',
    kind: 'common',
    polygon: rect(18, 8, 32, 62),
    door: { x: 18, y: 31 },
    corridorNodeId: 'wingD.31',
    aliases: ['Biblioteca', 'Biblio', 'Sala de Lectura'],
    keywords: ['libros', 'estudio', 'biblioteca', 'investigacion'],
    capacity: 200,
  },

  // --- Wing C: Ciencias Económicas, FRIES & Hemeroteca ---
  {
    id: 'INV-CIENCIAS-ECONOMICAS',
    name: 'Centro de Investigaciones Ciencias Económicas',
    kind: 'office',
    polygon: rect(33, 8, 40, 15),
    door: { x: 40, y: 11.5 },
    corridorNodeId: 'wingC.12',
    aliases: ['Inv Economicas', 'Investigaciones Economicas'],
    keywords: ['investigacion', 'economia'],
  },
  {
    id: 'INV-FRIES',
    name: 'Centro de Investigaciones FRIES',
    kind: 'office',
    polygon: rect(33, 15, 40, 22),
    door: { x: 40, y: 18.5 },
    corridorNodeId: 'wingC.19',
    aliases: ['Investigaciones FRIES'],
    keywords: ['investigacion', 'fries', 'relaciones internacionales'],
  },
  {
    id: 'PROG-ECONOMIA',
    name: 'Programa de Economía',
    kind: 'office',
    polygon: rect(33, 22, 40, 29),
    door: { x: 40, y: 25.5 },
    corridorNodeId: 'wingC.26',
    aliases: ['Programa Economia'],
    keywords: ['economia', 'pregrado'],
  },
  {
    id: 'DECANATURA-FRIES',
    name: 'Decanatura FRIES',
    kind: 'office',
    polygon: rect(33, 29, 40, 36),
    door: { x: 40, y: 32.5 },
    corridorNodeId: 'wingC.33',
    aliases: ['Decanatura FRIES'],
    keywords: ['decanatura', 'fries'],
  },
  {
    id: 'MAESTRIA-GESTION',
    name: 'Maestría en Gestión de Organizaciones',
    kind: 'office',
    polygon: rect(33, 36, 40, 43),
    door: { x: 40, y: 39.5 },
    corridorNodeId: 'wingC.40',
    aliases: ['Maestria Gestion Organizaciones'],
    keywords: ['maestria', 'gestion', 'organizaciones'],
  },
  {
    id: 'PROG-CONTADURIA',
    name: 'Programa Contaduría Pública',
    kind: 'office',
    polygon: rect(33, 43, 40, 50),
    door: { x: 40, y: 46.5 },
    corridorNodeId: 'wingC.47',
    aliases: ['Contaduria Publica', 'Contaduria'],
    keywords: ['contaduria', 'contable', 'programa'],
  },
  {
    id: 'VICEDEC-CIENCIAS-ECONOMICAS',
    name: 'Vicedecanatura Fac. Ciencias Económicas',
    kind: 'office',
    polygon: rect(33, 50, 40, 57),
    door: { x: 40, y: 53.5 },
    corridorNodeId: 'wingC.54',
    aliases: ['Vicedecanatura Economia'],
    keywords: ['vicedecanatura', 'economia'],
  },
  {
    id: 'EXTENSION-PROYECCION-SOCIAL-CE',
    name: 'Extensión y Proyección Social Fac. Cien. Económicas',
    kind: 'office',
    polygon: rect(33, 57, 40, 64),
    door: { x: 40, y: 60.5 },
    corridorNodeId: 'wingC.61',
    aliases: ['Extension Economia', 'Proyeccion Social'],
    keywords: ['extension', 'social', 'economia'],
  },
  {
    id: 'CONSULTORIO-EMPRESARIAL',
    name: 'Consultorio Empresarial',
    kind: 'office',
    polygon: rect(33, 64, 40, 71),
    door: { x: 40, y: 67.5 },
    corridorNodeId: 'wingC.68',
    aliases: ['Consultorio Empresarial'],
    keywords: ['consultorio', 'empresarial', 'asesoria'],
  },
  {
    id: 'HEMEROTECA',
    name: 'Hemeroteca',
    kind: 'common',
    polygon: rect(44, 8, 55, 62),
    door: { x: 44, y: 33 },
    corridorNodeId: 'wingC.33',
    aliases: ['Hemeroteca', 'Sala de Revistas'],
    keywords: ['hemeroteca', 'publicaciones', 'estudio'],
  },

  // --- Central Service Area ---
  {
    id: 'RESTAURANTE-ADMIN',
    name: 'Restaurante Administrativo',
    kind: 'kitchen',
    polygon: rect(57, 8, 70, 56),
    door: { x: 70, y: 33 },
    corridorNodeId: 'wingB.33',
    aliases: ['Restaurante Admin', 'Cafeteria Admin', 'Comedor'],
    keywords: ['comida', 'restaurante', 'almuerzo'],
    capacity: 120,
  },

  // --- Wing B: Facultad de Derecho ---
  {
    id: 'SALA-PROFESORES-DERECHO',
    name: 'Sala de Profesores de Derecho',
    kind: 'office',
    polygon: rect(70, 8, 75, 16),
    door: { x: 75, y: 12 },
    corridorNodeId: 'wingB.12',
    aliases: ['Sala Profesores Derecho'],
    keywords: ['profesores', 'derecho'],
  },
  {
    id: 'POSG-DERECHO',
    name: 'Dirección Posgrado Derecho',
    kind: 'office',
    polygon: rect(70, 16, 75, 24),
    door: { x: 75, y: 20 },
    corridorNodeId: 'wingB.20',
    aliases: ['Posgrados Derecho'],
    keywords: ['posgrados', 'derecho'],
  },
  {
    id: 'JEFE-AREA-DERECHO',
    name: 'Jefe de Área de Derecho',
    kind: 'office',
    polygon: rect(70, 24, 75, 32),
    door: { x: 75, y: 28 },
    corridorNodeId: 'wingB.28',
    aliases: ['Jefe Area Derecho'],
    keywords: ['jefe', 'area', 'derecho'],
  },
  {
    id: 'VICEDEC-DERECHO',
    name: 'Vicedecanatura Fac. Derecho',
    kind: 'office',
    polygon: rect(70, 32, 75, 40),
    door: { x: 75, y: 36 },
    corridorNodeId: 'wingB.36',
    aliases: ['Vicedecanatura Derecho'],
    keywords: ['vicedecanatura', 'derecho'],
  },
  {
    id: 'OPCIONES-GRADO-DERECHO',
    name: 'Opciones de Grado Fac. Derecho',
    kind: 'office',
    polygon: rect(70, 40, 75, 48),
    door: { x: 75, y: 44 },
    corridorNodeId: 'wingB.44',
    aliases: ['Opciones Grado Derecho', 'Grados Derecho'],
    keywords: ['grado', 'tesis', 'derecho'],
  },
  {
    id: 'INV-DERECHO',
    name: 'Dirección Centro de Investigaciones FD',
    kind: 'office',
    polygon: rect(70, 48, 75, 56),
    door: { x: 75, y: 52 },
    corridorNodeId: 'wingB.52',
    aliases: ['Investigaciones Derecho', 'Centro Inv FD'],
    keywords: ['investigaciones', 'derecho'],
  },
  {
    id: 'EXT-DERECHO',
    name: 'Dirección Extensión y Proyección Social Derecho',
    kind: 'office',
    polygon: rect(70, 56, 75, 64),
    door: { x: 75, y: 60 },
    corridorNodeId: 'wingB.60',
    aliases: ['Extension Derecho'],
    keywords: ['extension', 'social', 'derecho'],
  },
  {
    id: 'DECANATURA-DERECHO',
    name: 'Decanatura Facultad de Derecho',
    kind: 'office',
    polygon: rect(79, 8, 93, 20),
    door: { x: 79, y: 14 },
    corridorNodeId: 'wingB.12',
    aliases: ['Decanatura Derecho', 'Decano Derecho'],
    keywords: ['decanatura', 'derecho'],
  },
  {
    id: 'PROF-INV-DERECHO',
    name: 'Sala de Profesores Investigadores en Derecho',
    kind: 'office',
    polygon: rect(79, 20, 93, 40),
    door: { x: 79, y: 30 },
    corridorNodeId: 'wingB.28',
    aliases: ['Profesores Investigadores Derecho'],
    keywords: ['investigadores', 'derecho', 'profesores'],
  },
  {
    id: 'PROF-DERECHO-GRANDE',
    name: 'Sala de Profesores Derecho',
    kind: 'office',
    polygon: rect(79, 40, 93, 56),
    door: { x: 79, y: 48 },
    corridorNodeId: 'wingB.48',
    aliases: ['Sala Docentes Derecho'],
    keywords: ['docentes', 'profesores', 'derecho'],
  },
  {
    id: 'BANO-BLOQUE-B',
    name: 'Baños Bloque B',
    kind: 'bathroom',
    polygon: rect(79, 56, 93, 64),
    door: { x: 79, y: 60 },
    corridorNodeId: 'wingB.60',
    aliases: ['Banos Bloque B', 'Bano B'],
    keywords: ['wc', 'bano', 'servicios'],
  },

  // --- Wing E (North Interconnecting Wing) ---
  // North side of Wing E
  {
    id: 'AULA-E102',
    name: 'Aula E 102',
    kind: 'classroom',
    polygon: rect(32, 74, 42, 85),
    door: { x: 37, y: 74 },
    corridorNodeId: 'wingE.37',
    aliases: ['Aula E102', 'E102', 'E 102'],
    keywords: ['salon', 'clase', 'bloque e'],
    capacity: 40,
  },
  {
    id: 'AULA-E101',
    name: 'Aula E 101',
    kind: 'classroom',
    polygon: rect(42, 74, 52, 85),
    door: { x: 47, y: 74 },
    corridorNodeId: 'wingE.47',
    aliases: ['Aula E101', 'E101', 'E 101'],
    keywords: ['salon', 'clase', 'bloque e'],
    capacity: 40,
  },
  {
    id: 'PROG-ADMIN-EMPRESAS',
    name: 'Programa Administración de Empresas',
    kind: 'office',
    polygon: rect(52, 74, 62, 85),
    door: { x: 57, y: 74 },
    corridorNodeId: 'wingE.57',
    aliases: ['Admin Empresas', 'Administracion de Empresas'],
    keywords: ['administracion', 'empresas', 'programa'],
  },
  {
    id: 'MEDIO-ESTUDIANTIL',
    name: 'Dirección Medio Estudiantil',
    kind: 'office',
    polygon: rect(62, 74, 74, 86),
    door: { x: 68, y: 74 },
    corridorNodeId: 'wingE.68',
    aliases: ['Medio Estudiantil', 'Bienestar'],
    keywords: ['estudiantil', 'bienestar', 'apoyo'],
  },
  {
    id: 'BANCO-ITAU',
    name: 'Servicio / Caja Banco Itaú',
    kind: 'service',
    polygon: rect(82, 74, 94, 84),
    door: { x: 88, y: 74 },
    corridorNodeId: 'wingE.88',
    aliases: ['Banco Itau', 'Caja Itau', 'Itau'],
    keywords: ['banco', 'caja', 'itau', 'dinero'],
  },
  {
    id: 'CAJERO-BBVA',
    name: 'Cajero BBVA',
    kind: 'service',
    polygon: rect(94, 74, 102, 82),
    door: { x: 98, y: 74 },
    corridorNodeId: 'wingE.98',
    aliases: ['BBVA', 'Cajero BBVA'],
    keywords: ['cajero', 'bbva', 'atm'],
  },
  {
    id: 'PLAZOLETA-ARTES',
    name: 'Plazoleta de Artes',
    kind: 'common',
    polygon: rect(104, 74, 122, 90),
    door: { x: 110, y: 74 },
    corridorNodeId: 'wingE.110',
    aliases: ['Plazoleta de Artes', 'Plazoleta Artes'],
    keywords: ['artes', 'plazoleta', 'exterior', 'encuentro'],
  },

  // South side of Wing E
  {
    id: 'BANO-E-OESTE',
    name: 'Baños Bloque E Oeste',
    kind: 'bathroom',
    // Junto a la Decanatura de Ingeniería (x 2–10, y 62–70). Movido al oeste para
    // dejar libre x=10–18 para el conector hacia el pasillo del Bloque E.
    polygon: rect(2, 62, 10, 70),
    door: { x: 10, y: 66 },
    corridorNodeId: 'wingE.10',
    aliases: ['Banos E Oeste', 'Banos Decanatura Ingenieria'],
    keywords: ['wc', 'bano', 'decanatura'],
  },
  {
    id: 'DIRECCION-ASSO',
    name: 'Dirección Programa A.S.S.O.',
    kind: 'office',
    // Corrido hacia el este para no invadir el conector (x 14–18).
    polygon: rect(18, 62, 26, 70),
    door: { x: 21, y: 70 },
    corridorNodeId: 'wingE.21',
    aliases: ['ASSO', 'Programa ASSO'],
    keywords: ['asso', 'seguridad', 'salud ocupacional'],
  },
  {
    id: 'PROG-RIEP',
    name: 'Programa R.I.E.P.',
    kind: 'office',
    polygon: rect(26, 62, 33, 70),
    door: { x: 29.5, y: 70 },
    corridorNodeId: 'wingE.29',
    aliases: ['RIEP', 'Programa RIEP'],
    keywords: ['riep', 'programa'],
  },
  {
    id: 'CONSULTORIO-FARIES',
    name: 'Consultorio de Prácticas y Pasantías FARIES',
    kind: 'office',
    polygon: rect(33, 62, 40, 70),
    door: { x: 36.5, y: 70 },
    corridorNodeId: 'wingE.37',
    aliases: ['Practicas FARIES', 'Pasantias FARIES'],
    keywords: ['pasantias', 'practicas', 'faries'],
  },
  {
    id: 'DIRECCION-SEGURIDAD',
    name: 'Dirección Programas Seguridad',
    kind: 'office',
    polygon: rect(44, 62, 50, 70),
    door: { x: 47, y: 70 },
    corridorNodeId: 'wingE.47',
    aliases: ['Programas Seguridad'],
    keywords: ['seguridad', 'programas'],
  },
  {
    id: 'COASE',
    name: 'COASE',
    kind: 'office',
    polygon: rect(50, 62, 59, 70),
    door: { x: 54.5, y: 70 },
    corridorNodeId: 'wingE.57',
    aliases: ['COASE'],
    keywords: ['coase', 'apoyo'],
  },
  {
    id: 'PROTECCION-PATRIMONIO',
    name: 'Oficina Protección del Patrimonio',
    kind: 'office',
    polygon: rect(59, 62, 66, 70),
    door: { x: 62.5, y: 70 },
    corridorNodeId: 'wingE.62',
    aliases: ['Proteccion Patrimonio'],
    keywords: ['patrimonio', 'seguridad'],
  },
  {
    id: 'SEGURIDAD-PERSONAS',
    name: 'Seguridad a Personas',
    kind: 'office',
    polygon: rect(66, 62, 73, 70),
    door: { x: 69.5, y: 70 },
    corridorNodeId: 'wingE.68',
    aliases: ['Seguridad Personas'],
    keywords: ['seguridad', 'vigilancia'],
  },

  // --- External Campus Areas ---
  {
    id: 'RECEPCION-PPAL',
    name: 'Recepción Principal',
    kind: 'service' as SpaceKind,
    polygon: rect(45, -30, 55, -20),
    door: { x: 50, y: -20 },
    corridorNodeId: 'ext-south.50',
    aliases: ['Recepcion', 'Recepcion Principal'],
    keywords: ['recepcion', 'entrada', 'acceso', 'informacion'],
  },
  {
    id: 'CARNETIZACION',
    name: 'Carnetización',
    kind: 'service' as SpaceKind,
    polygon: rect(55, -30, 65, -20),
    door: { x: 60, y: -20 },
    corridorNodeId: 'ext-south.60',
    aliases: ['Carnetizacion', 'Carnets'],
    keywords: ['carnet', 'identificacion', 'estudiante'],
  },
  {
    id: 'PLAZA-CERVANTES',
    name: 'Plaza Cervantes',
    kind: 'common' as SpaceKind,
    // Al sur de la calle vehicular, en la misma franja que Aula Máxima.
    polygon: rect(35, -26, 80, -10),
    door: { x: 54, y: -10 },
    corridorNodeId: 'ext-south.55',
    aliases: ['Plaza Cervantes', 'Plazoleta Cervantes'],
    keywords: ['plaza', 'exterior', 'encuentro', 'cervantes'],
  },
  {
    id: 'OBJETOS-PERDIDOS',
    name: 'Objetos Perdidos',
    kind: 'service' as SpaceKind,
    polygon: rect(2, -30, 10, -20),
    door: { x: 10, y: -25 },
    corridorNodeId: 'ext-south.10',
    aliases: ['Objetos Perdidos'],
    keywords: ['perdidos', 'objetos', 'recuperar'],
  },
  {
    id: 'PARQUEADERO-CICLAS',
    name: 'Parqueadero de Ciclas',
    kind: 'service' as SpaceKind,
    polygon: rect(10, -32, 28, -22),
    door: { x: 20, y: -22 },
    corridorNodeId: 'ext-south.20',
    aliases: ['Parqueadero Ciclas', 'Ciclas', 'Bicicletas'],
    keywords: ['parqueadero', 'ciclas', 'bicicleta'],
  },
  {
    id: 'AULA-MAXIMA-EXT',
    name: 'Aula Máxima',
    kind: 'auditorium' as SpaceKind,
    // Bajada hasta el borde sur de la calle vehicular; el alto se ajusta para
    // no invadir el parqueadero de ciclas (y = -22).
    polygon: rect(12, -22, 32, -10),
    door: { x: 21, y: -10 },
    corridorNodeId: 'ext-south.22',
    aliases: ['Aula Maxima', 'Auditorio Principal'],
    keywords: ['aula maxima', 'auditorio', 'eventos', 'conferencias'],
    capacity: 500,
  },
  {
    id: 'CANCHAS-DEPORTIVAS',
    name: 'Canchas Deportivas',
    kind: 'gym' as SpaceKind,
    // Se extiende hasta la mitad de Restaurante MUY (x = 136).
    polygon: rect(80, -32, 136, -10),
    door: { x: 89, y: -10 },
    corridorNodeId: 'ext-south.90',
    aliases: ['Canchas', 'Polideportivo'],
    keywords: ['canchas', 'deporte', 'futbol', 'baloncesto'],
  },
  {
    id: 'BOSQUE-COFFEE',
    name: 'Bosque Coffee',
    kind: 'kitchen' as SpaceKind,
    // Arranca justo al lado de Canchas y termina alineado con Carpa Nativos.
    polygon: rect(136, -30, 208, -4),
    door: { x: 195, y: -4 },
    corridorNodeId: 'ext-south.199',
    aliases: ['Bosque Coffee', 'Cafeteria Exterior'],
    keywords: ['cafe', 'cafeteria', 'comida', 'exterior'],
  },
  // --- East exterior strip (todo a la derecha del edificio principal, x > 122) ---
  {
    id: 'RESTAURANTE-MUY',
    name: 'Restaurante MUY',
    kind: 'kitchen' as SpaceKind,
    // Diagonal abajo-derecha de Plazoleta de Artes (x 104–122, y 74–90).
    polygon: rect(126, 52, 146, 68),
    door: { x: 126, y: 60 },
    corridorNodeId: 'ext-east.muy',
    aliases: ['Restaurante MUY', 'MUY'],
    keywords: ['restaurante', 'comida', 'almuerzo'],
  },
  {
    id: 'PLAZOLETA-COMIDA',
    name: 'Plazoleta de Comidas',
    kind: 'kitchen' as SpaceKind,
    // Arriba de Canchas Deportivas, justo antes del borde sur del edificio y
    // casi tan ancha como ellas.
    polygon: rect(80, -8, 115, 0),
    door: { x: 97, y: 0 },
    corridorNodeId: 'ext-south.90',
    aliases: ['Plazoleta Comidas', 'Food Court'],
    keywords: ['comida', 'plazoleta', 'restaurante'],
  },
  {
    id: 'PARQUEADERO-PPAL',
    name: 'Parqueadero Principal',
    kind: 'service' as SpaceKind,
    // A la derecha de Plazoleta de Artes; se extiende hacia arriba hasta quedar
    // a la altura de Editorial Neogranadina, sin cambiar su ancho (x 126–180).
    polygon: rect(126, 74, 180, 128),
    door: { x: 126, y: 82 },
    corridorNodeId: 'ext-east.parking',
    aliases: ['Parqueadero', 'Parqueadero Principal'],
    keywords: ['parqueadero', 'carros', 'vehiculos'],
  },
  {
    id: 'CAFE-LEGENDA',
    name: 'Café Legenda',
    kind: 'kitchen' as SpaceKind,
    // Arriba de Plazoleta de Artes y en la misma franja que el Hub Colaborativo.
    polygon: rect(104, 92, 122, 110),
    door: { x: 113, y: 93 },
    corridorNodeId: 'ext-north.113',
    aliases: ['Cafe Legenda', 'Legenda'],
    keywords: ['cafe', 'cafeteria', 'bebidas'],
  },
  {
    id: 'EDITORIAL-NEOGRANADINA',
    name: 'Editorial Neogranadina',
    kind: 'office' as SpaceKind,
    // Directamente arriba de Café Legenda, en la misma columna.
    polygon: rect(104, 112, 122, 128),
    door: { x: 113, y: 112 },
    corridorNodeId: 'ext-north-editorial',
    aliases: ['Editorial Neogranadina', 'Editorial'],
    keywords: ['editorial', 'publicaciones', 'libros'],
  },
  {
    id: 'CARPA-BURGER',
    name: 'Carpa Burger',
    kind: 'kitchen' as SpaceKind,
    polygon: rect(190, 70, 208, 85),
    door: { x: 190, y: 77 },
    corridorNodeId: 'ext-east.carpas',
    aliases: ['Carpa Burger', 'Hamburguesas'],
    keywords: ['hamburguesa', 'comida', 'carpa'],
  },
  {
    id: 'CARPA-DELIRIO',
    name: 'Carpa Delirio',
    kind: 'kitchen' as SpaceKind,
    polygon: rect(190, 55, 208, 70),
    door: { x: 190, y: 62 },
    corridorNodeId: 'ext-east.carpas',
    aliases: ['Carpa Delirio', 'Delirio'],
    keywords: ['comida', 'carpa', 'delirio'],
  },
  {
    id: 'CARPA-TACOS',
    name: 'Carpa Tacos',
    kind: 'kitchen' as SpaceKind,
    polygon: rect(190, 40, 208, 55),
    door: { x: 190, y: 47 },
    corridorNodeId: 'ext-east.carpas',
    aliases: ['Carpa Tacos', 'Tacos'],
    keywords: ['tacos', 'comida', 'carpa'],
  },
  {
    id: 'CARPA-NATIVOS',
    name: 'Carpa Nativos',
    kind: 'kitchen' as SpaceKind,
    polygon: rect(190, 20, 208, 40),
    door: { x: 190, y: 30 },
    corridorNodeId: 'ext-east.carpas',
    aliases: ['Carpa Nativos', 'Nativos'],
    keywords: ['comida', 'carpa', 'nativos'],
  },
  {
    id: 'POSTGRADOS-FAC',
    name: 'Escuela de Postgrados FAC',
    kind: 'office' as SpaceKind,
    polygon: rect(2, 88, 20, 115),
    door: { x: 20, y: 95 },
    corridorNodeId: 'ext-north.20',
    aliases: ['Postgrados FAC', 'Escuela Postgrados'],
    keywords: ['postgrados', 'fac', 'maestria', 'especializacion'],
  },
  {
    id: 'HUB-CREACION',
    name: 'Hub de Creación',
    kind: 'office' as SpaceKind,
    polygon: rect(28, 92, 45, 110),
    door: { x: 36, y: 93 },
    corridorNodeId: 'ext-north.36',
    aliases: ['Hub Creacion', 'Hub de Innovacion Creacion'],
    keywords: ['hub', 'innovacion', 'creacion', 'emprendimiento'],
  },
  {
    id: 'HUB-DESARROLLO',
    name: 'Hub de Desarrollo',
    kind: 'office' as SpaceKind,
    polygon: rect(45, 92, 60, 110),
    door: { x: 52, y: 93 },
    corridorNodeId: 'ext-north.52',
    aliases: ['Hub Desarrollo', 'Hub de Innovacion Desarrollo'],
    keywords: ['hub', 'innovacion', 'desarrollo', 'software'],
  },
  {
    id: 'HUB-COLABORATIVO',
    name: 'Hub Colaborativo',
    kind: 'office' as SpaceKind,
    polygon: rect(60, 92, 75, 110),
    door: { x: 67, y: 93 },
    corridorNodeId: 'ext-north.67',
    aliases: ['Hub Colaborativo', 'Hub de Innovacion Colaborativo'],
    keywords: ['hub', 'innovacion', 'colaboracion', 'trabajo'],
  },
  {
    id: 'BLOQUE-F',
    name: 'Bloque F',
    kind: 'office' as SpaceKind,
    polygon: rect(40, 116, 100, 132),
    door: { x: 70, y: 117 },
    corridorNodeId: 'ext-north-f.70',
    aliases: ['Bloque F'],
    keywords: ['bloque f', 'clases', 'facultad'],
  },
]

export function buildCalle100Floor1(): { floor: Floor; catalog: CatalogEntry[] } {
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
    const id = `c100-p1.${idSuffix}`
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

  // --- 1. SPINES (Walkable Corridors) ---
  // A. South corridor spine (y = 6, x: 6 -> 104)
  const southXCoords = [6, 10, 14, 16, 25, 37, 42, 44, 53, 62, 70, 77, 79, 85, 88, 96, 104]
  const southNodes = southXCoords.map((x) => addNode(`south.${x}`, { x, y: 6 }, 'hallway'))
  for (let i = 1; i < southNodes.length; i += 1) {
    connect(southNodes[i - 1]!, southNodes[i]!)
  }

  // B. Wing D corridor spine (x = 16, y: 6 -> 58)
  const wingDYCoords = [13, 22, 31, 40, 49, 58]
  const wingDNodes = wingDYCoords.map((y) => addNode(`wingD.${y}`, { x: 16, y }, 'hallway'))
  connect(`c100-p1.south.16`, wingDNodes[0]!)
  for (let i = 1; i < wingDNodes.length; i += 1) {
    connect(wingDNodes[i - 1]!, wingDNodes[i]!)
  }

  // C. Wing C corridor spine (Pasillo C, x = 42, y: 6 -> 72)
  const wingCYCoords = [12, 19, 26, 33, 40, 47, 54, 61, 68]
  const wingCNodes = wingCYCoords.map((y) => addNode(`wingC.${y}`, { x: 42, y }, 'hallway'))
  connect(`c100-p1.south.42`, wingCNodes[0]!)
  for (let i = 1; i < wingCNodes.length; i += 1) {
    connect(wingCNodes[i - 1]!, wingCNodes[i]!)
  }

  // D. Wing B corridor spine (Pasillo B, x = 77, y: 6 -> 72)
  const wingBYCoords = [12, 20, 28, 33, 36, 44, 48, 52, 60, 66]
  const wingBNodes = wingBYCoords.map((y) => addNode(`wingB.${y}`, { x: 77, y }, 'hallway'))
  connect(`c100-p1.south.77`, wingBNodes[0]!)
  for (let i = 1; i < wingBNodes.length; i += 1) {
    connect(wingBNodes[i - 1]!, wingBNodes[i]!)
  }

  // E. Wing E horizontal corridor spine (y = 72, x: 10 -> 115)
  const wingEXCoords = [
    10, 13, 14, 16, 21, 28, 29, 37, 42, 47, 57, 62, 68, 72, 77, 88, 98, 104, 110, 115,
  ]
  const wingENodes = wingEXCoords.map((x) => addNode(`wingE.${x}`, { x, y: 72 }, 'hallway'))
  for (let i = 1; i < wingENodes.length; i += 1) {
    connect(wingENodes[i - 1]!, wingENodes[i]!)
  }

  // Connect Vertical Corridors to Wing E Spine
  connect(wingCNodes[wingCNodes.length - 1]!, `c100-p1.wingE.42`)
  connect(wingBNodes[wingBNodes.length - 1]!, `c100-p1.wingE.77`)

  // F. North-west connector: links the library/Decanatura corridor (Wing D)
  // with the Wing E corridor without closing the passage next to the bathrooms.
  const connWingDE = addNode('conn-wingd-e', { x: 16, y: 66 }, 'junction')
  connect(`c100-p1.wingD.58`, connWingDE)
  connect(connWingDE, `c100-p1.wingE.16`)

  // --- 2. ENTRANCES & VERTICAL CORES ---
  // Entrada D (South-West)
  const entD = addNode('ent-d', { x: 10, y: 1 }, 'entrance', 'QRD')
  connect(entD, `c100-p1.south.10`, 'walkway')

  // Ascensor & Escalera D
  const ascD = addNode('asc-d', { x: 14, y: 4.5 }, 'elevator', 'ASC-D')
  connect(ascD, `c100-p1.south.14`, 'elevator')
  const escD = addNode('esc-d', { x: 3, y: 6 }, 'stair', 'ESC-D')
  connect(escD, `c100-p1.south.6`, 'stair')

  // Entrada C (South-Central)
  const entC = addNode('ent-c', { x: 44, y: 1 }, 'entrance', 'QRC')
  connect(entC, `c100-p1.south.44`, 'walkway')
  const escC = addNode('esc-c', { x: 41, y: 7.5 }, 'stair', 'ESC-C')
  connect(escC, `c100-p1.south.42`, 'stair')

  // Entrada B (South-East)
  const entB = addNode('ent-b', { x: 88, y: 1 }, 'entrance', 'QRB')
  connect(entB, `c100-p1.south.88`, 'walkway')
  const escB = addNode('esc-b', { x: 85, y: 7.5 }, 'stair', 'ESC-B')
  connect(escB, `c100-p1.south.85`, 'stair')

  // Entrada E (North)
  const entE = addNode('ent-e', { x: 28, y: 76 }, 'entrance', 'QRE')
  connect(entE, `c100-p1.wingE.28`, 'walkway')

  // Escalera & Ascensor E (North-West)
  const escEOeste = addNode('esc-e-oeste', { x: 10, y: 74 }, 'stair', 'ESC-E1')
  connect(escEOeste, `c100-p1.wingE.10`, 'stair')
  const ascE = addNode('asc-e', { x: 14, y: 74 }, 'elevator', 'ASC-E')
  connect(ascE, `c100-p1.wingE.14`, 'elevator')

  // Escaleras E Centro y Este
  const escECentro = addNode('esc-e-centro', { x: 72, y: 70 }, 'stair', 'ESC-E2')
  connect(escECentro, `c100-p1.wingE.72`, 'stair')

  // Entrada Sur-Oeste Bloque E
  const entSurOeste = addNode('ent-sur-oeste', { x: 104, y: 68 }, 'entrance', 'QRE-SO')
  connect(entSurOeste, `c100-p1.wingE.104`, 'walkway')

  // Connection towards Bloque A
  const connBloqueA = addNode('conn-bloque-a', { x: 106, y: 6 }, 'junction', 'CON-A')
  connect(connBloqueA, `c100-p1.south.104`, 'walkway')

  // --- EXTERNAL CAMPUS AREAS ---

  // Pedestrian and vehicle entrances (south, Calle 100)
  const entU = addNode('ent-u', { x: 55, y: -34 }, 'entrance', 'ENT-U')
  const entAutos = addNode('ent-autos', { x: 5, y: -34 }, 'entrance', 'ENT-AUTOS')

  // South exterior spine (y = -4, east–west)
  const extSouthXs = [5, 10, 20, 22, 50, 55, 60, 90, 125, 199]
  const extSouthNodes = extSouthXs.map((x) => addNode(`ext-south.${x}`, { x, y: -4 }, 'hallway'))
  for (let i = 1; i < extSouthNodes.length; i += 1) {
    connect(extSouthNodes[i - 1]!, extSouthNodes[i]!)
  }

  // Reception / Carnetización intermediate points (at y=-20)
  const recNode = addNode('ext-south-rec.50', { x: 50, y: -20 }, 'junction')
  const carnNode = addNode('ext-south-carn.60', { x: 60, y: -20 }, 'junction')
  connect(`c100-p1.ext-south.50`, recNode)
  connect(`c100-p1.ext-south.60`, carnNode)

  // Connect south spine to entrances
  connect(entU, `c100-p1.ext-south.55`, 'walkway')
  connect(entAutos, `c100-p1.ext-south.5`, 'walkway')

  // Connect south exterior to main building entry nodes
  connect(`c100-p1.ext-south.10`, entD, 'walkway')
  connect(`c100-p1.ext-south.55`, entC, 'walkway')
  connect(`c100-p1.ext-south.90`, entB, 'walkway')

  // East exterior nodes (Bloque A no longer exists in the drawn layout)
  addNode('ext-east.food', { x: 132, y: 16 }, 'junction') // Acceso este a la franja de comidas
  addNode('ext-east.muy', { x: 132, y: 60 }, 'junction') // Restaurante MUY
  addNode('ext-east.parking', { x: 140, y: 82 }, 'junction') // Parqueadero Principal
  addNode('ext-east.carpas', { x: 188, y: 55 }, 'junction') // Carpa food strip

  // Connect east nodes to building (via conn-bloque-a connector)
  connect(`c100-p1.conn-bloque-a`, `c100-p1.ext-east.food`, 'walkway')
  connect(`c100-p1.ext-east.food`, `c100-p1.ext-east.muy`, 'walkway')
  connect(`c100-p1.ext-east.muy`, `c100-p1.ext-east.parking`, 'walkway')
  connect(`c100-p1.ext-east.parking`, `c100-p1.ext-east.carpas`, 'walkway')

  // North exterior spine (y = 92)
  const extNorthXs = [20, 36, 52, 67, 70, 113]
  const extNorthNodes = extNorthXs.map((x) => addNode(`ext-north.${x}`, { x, y: 92 }, 'hallway'))
  for (let i = 1; i < extNorthNodes.length; i += 1) {
    connect(extNorthNodes[i - 1]!, extNorthNodes[i]!)
  }

  // Connect north spine to Entrada E
  connect(entE, `c100-p1.ext-north.36`, 'walkway')

  // Editorial Neogranadina sits directly above Café Legenda; route around the
  // café instead of through it.
  const extNorthEditorial = addNode('ext-north-editorial', { x: 124, y: 112 }, 'junction')
  connect(`c100-p1.ext-north.113`, extNorthEditorial, 'walkway')

  // Bloque F deeper north spur
  const bloqueFNode = addNode('ext-north-f.70', { x: 70, y: 116 }, 'junction')
  connect(`c100-p1.ext-north.70`, bloqueFNode, 'walkway')

  // --- 3. ROOMS & SPACES ---
  let qrCounter = 200
  for (const room of ROOM_DEFINITIONS) {
    qrCounter += 1
    const doorNodeId = addNode(`door-${room.id}`, room.door, 'door', `N${qrCounter}`)
    connect(doorNodeId, `c100-p1.${room.corridorNodeId}`, 'door')

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
      floorId: CALLE100_FLOOR1_ID,
      level: 1,
      kind: room.kind,
      active: true,
      ...(room.restricted ? { restricted: room.restricted } : {}),
    })
  }

  const floor: Floor = {
    id: CALLE100_FLOOR1_ID,
    buildingId: CALLE100_BUILDING_ID,
    level: 1,
    levelLabel: 'Piso 1',
    levelShort: 'P1',
    order: 1,
    bounds: [0, -36, 214, 134],
    spaces,
    walkways: [
      { id: 'w-south', polygon: rect(6, 4, 106, 8) },
      { id: 'w-wingD', polygon: rect(14, 6, 18, 62) },
      { id: 'w-wingC', polygon: rect(40, 6, 44, 74) },
      { id: 'w-wingB', polygon: rect(75, 6, 79, 74) },
      { id: 'w-wingE', polygon: rect(8, 70, 118, 74) },
      { id: 'w-conn-wingd-e', polygon: rect(10, 62, 18, 70) },
      { id: 'w-ext-south', polygon: rect(0, -36, 210, -2) },
      // Calle vehicular horizontal que cruza todo el campus entre Canchas
      // Deportivas y Plazoleta de Comidas; se dibuja sobre la superficie sur.
      { id: 'w-ext-south-road', kind: 'vehicular' as const, polygon: rect(0, -10, 214, -8) },
      { id: 'w-ext-east', polygon: rect(124, 2, 210, 90) },
      { id: 'w-ext-north', polygon: rect(0, 88, 124, 134) },
    ],
    nodes,
    edges,
    transitions: [], // Ground floor single-level initially
  }

  return { floor, catalog }
}

const built = buildCalle100Floor1()

export const calle100Floor1: Floor = built.floor
export const calle100Catalog: CatalogEntry[] = built.catalog
