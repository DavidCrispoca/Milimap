/**
 * Validation for content forms.
 *
 * Zod schemas are the single definition of "a valid event" or "a valid
 * announcement". Forms validate with them before calling the store, and the
 * store validates again, so a malformed item cannot enter through any path.
 */

import { z } from 'zod'

/** `datetime-local` format: "YYYY-MM-DDTHH:MM". Lexicographic order equals time order. */
const localDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Ingresá una fecha y hora válidas.')

export const eventInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'El título necesita al menos 3 caracteres.')
      .max(120, 'El título no puede superar 120 caracteres.'),
    description: z.string().trim().max(1000, 'La descripción no puede superar 1000 caracteres.'),
    startsAt: localDateTime,
    endsAt: localDateTime,
    spaceId: z.string().nullable(),
    category: z.enum(['ceremony', 'academic', 'sports', 'cultural', 'administrative', 'emergency']),
    priority: z.enum(['low', 'normal', 'high']),
    published: z.boolean(),
  })
  .refine((value) => value.endsAt > value.startsAt, {
    message: 'La hora de fin debe ser posterior a la de inicio.',
    path: ['endsAt'],
  })

export const announcementInputSchema = z
  .object({
    message: z
      .string()
      .trim()
      .min(5, 'El mensaje necesita al menos 5 caracteres.')
      .max(240, 'El mensaje no puede superar 240 caracteres.'),
    kind: z.enum(['info', 'warning', 'emergency']),
    startsAt: localDateTime,
    endsAt: localDateTime,
    published: z.boolean(),
  })
  .refine((value) => value.endsAt > value.startsAt, {
    message: 'La vigencia debe terminar después de empezar.',
    path: ['endsAt'],
  })

export type EventInput = z.infer<typeof eventInputSchema>
export type AnnouncementInput = z.infer<typeof announcementInputSchema>

/** Turn Zod issues into a field -> message map for inline form errors. */
export function issuesToMap(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): Record<string, string> {
  const map: Record<string, string> = {}
  for (const issue of issues) {
    const field = String(issue.path[0] ?? '_form')
    if (!(field in map)) map[field] = issue.message
  }
  return map
}
