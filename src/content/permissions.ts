/**
 * Role-based permissions for the admin console.
 *
 * Enforced twice on purpose: the UI hides or disables controls using `can()`, and
 * the content store refuses the mutation again. The UI check is for usability;
 * the store check is the one that actually protects the data.
 */

import type { Role } from './types'

export type Action =
  | 'edit_event'
  | 'publish_event'
  | 'edit_announcement'
  | 'publish_announcement'
  | 'edit_space'
  | 'import_schedule'
  | 'reset_content'

const MATRIX: Record<Role, readonly Action[]> = {
  admin: [
    'edit_event',
    'publish_event',
    'edit_announcement',
    'publish_announcement',
    'edit_space',
    'import_schedule',
    'reset_content',
  ],
  // Editors draft everything and maintain spaces and schedules, but publishing
  // a public event or announcement stays with an administrator.
  editor: ['edit_event', 'edit_announcement', 'edit_space', 'import_schedule'],
  viewer: [],
}

export function can(role: Role | null, action: Action): boolean {
  if (!role) return false
  return MATRIX[role].includes(action)
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  viewer: 'Consulta',
}
