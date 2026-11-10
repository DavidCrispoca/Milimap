/**
 * Install banner (Phase 8).
 *
 * Offers to install Milimap as a home-screen app. Only appears when the browser
 * signals installability; dismissible for the session.
 */

import { useInstallPrompt } from './useInstallPrompt'

export function InstallBanner() {
  const { canInstall, install, dismiss } = useInstallPrompt()

  if (!canInstall) return null

  return (
    <div className="install-banner" role="region" aria-label="Instalar Milimap">
      <div className="install-banner__text">
        <strong>Instalá Milimap</strong>
        <span>Tenelo en la pantalla de inicio, sin tienda.</span>
      </div>
      <div className="install-banner__actions">
        <button type="button" className="btn-secondary btn--sm" onClick={install}>
          Instalar
        </button>
        <button type="button" className="link-btn" onClick={dismiss}>
          Descartar
        </button>
      </div>
    </div>
  )
}
