/**
 * Connectivity and update banners (Phase 8).
 *
 * Offline is not an error state here: the map was digitized into the bundle, so
 * navigation keeps working. The banners say that plainly and only surface when
 * the network or the installed version actually changes.
 */

import { useEffect, useRef, useState } from 'react'
import { useT } from '@/i18n'
import { useServiceWorker } from './useServiceWorker'

export function PwaStatus() {
  const { offline, updateReady, applyUpdate } = useServiceWorker()
  const t = useT()
  const wasOffline = useRef(offline)
  const [backOnline, setBackOnline] = useState(false)

  useEffect(() => {
    if (wasOffline.current && !offline) {
      setBackOnline(true)
      const timer = window.setTimeout(() => setBackOnline(false), 5000)
      wasOffline.current = offline
      return () => window.clearTimeout(timer)
    }
    wasOffline.current = offline
    return undefined
  }, [offline])

  return (
    <>
      {offline ? (
        <div className="pwa-status pwa-status--offline" role="status">
          <span className="pwa-status__icon" aria-hidden="true">
            ◌
          </span>
          <div>
            <strong>{t('pwa.offline.title')}</strong>
            <span>{t('pwa.offline.body')}</span>
          </div>
        </div>
      ) : null}

      {backOnline ? (
        <div className="pwa-status pwa-status--online" role="status">
          <span className="pwa-status__icon" aria-hidden="true">
            ✓
          </span>
          <div>
            <strong>{t('pwa.online.title')}</strong>
          </div>
        </div>
      ) : null}

      {updateReady ? (
        <div className="pwa-status pwa-status--update" role="status">
          <span className="pwa-status__icon" aria-hidden="true">
            ↻
          </span>
          <div>
            <strong>{t('pwa.update.title')}</strong>
            <span>{t('pwa.update.body')}</span>
          </div>
          <button type="button" className="btn-secondary btn--sm" onClick={applyUpdate}>
            {t('pwa.update.action')}
          </button>
        </div>
      ) : null}
    </>
  )
}
