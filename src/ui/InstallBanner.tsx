/**
 * Install banner (Phase 8).
 *
 * Offers to install Milimap as a home-screen app. Only appears when the browser
 * signals installability (or on iOS, where it needs a manual two-tap gesture).
 */

import { useT } from '@/i18n'
import { useInstallPrompt } from './useInstallPrompt'

export function InstallBanner() {
  const { canInstall, isIos, install, dismiss } = useInstallPrompt()
  const t = useT()

  if (!canInstall) return null

  return (
    <div className="install-banner" role="region" aria-label={t('pwa.install.title')}>
      <div className="install-banner__text">
        <strong>{t('pwa.install.title')}</strong>
        <span>{isIos ? t('pwa.install.ios') : t('pwa.install.body')}</span>
      </div>
      <div className="install-banner__actions">
        {!isIos ? (
          <button type="button" className="btn-secondary btn--sm" onClick={install}>
            {t('pwa.install.action')}
          </button>
        ) : null}
        <button type="button" className="link-btn" onClick={dismiss}>
          {t('pwa.dismiss')}
        </button>
      </div>
    </div>
  )
}
