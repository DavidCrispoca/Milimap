/**
 * Install prompt (Phase 8).
 *
 * Captures `beforeinstallprompt` so we can show our own install button instead
 * of relying on the browser's subtle hint. iOS Safari never fires that event,
 * so it gets a short manual instruction instead. Dismissals are remembered for
 * a week — showing the banner again on every screen would be hostile.
 */

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface NavigatorStandalone extends Navigator {
  standalone?: boolean
}

const DISMISS_KEY = 'milimap.install.dismissed'
const DISMISS_DAYS = 7

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const date = new Date(raw)
    if (Number.isNaN(date.getTime())) return false
    const days = (Date.now() - date.getTime()) / 86_400_000
    return days < DISMISS_DAYS
  } catch {
    return false
  }
}

function isIosWithoutApp(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as NavigatorStandalone
  const ios =
    /iPad|iPhone|iPod/.test(nav.userAgent) ||
    (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)
  const standalone =
    nav.standalone === true ||
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches)
  return ios && !standalone
}

export function useInstallPrompt(): {
  canInstall: boolean
  isIos: boolean
  install: () => void
  dismiss: () => void
} {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(isDismissed)
  const [isIos] = useState(isIosWithoutApp)

  useEffect(() => {
    const onBeforeInstall = (event: Event): void => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  const dismiss = (): void => {
    try {
      localStorage.setItem(DISMISS_KEY, new Date().toISOString())
    } catch {
      // Remembering the dismissal is a nicety, not a requirement.
    }
    setDeferred(null)
    setDismissed(true)
  }

  return {
    canInstall: !dismissed && (deferred !== null || isIos),
    isIos,
    install: () => {
      if (!deferred) return
      void deferred.prompt()
      void deferred.userChoice.finally(() => {
        setDeferred(null)
        setDismissed(true)
      })
    },
    dismiss,
  }
}
