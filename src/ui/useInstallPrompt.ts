/**
 * Install prompt (Phase 8).
 *
 * Captures the browser's `beforeinstallprompt` so we can show our own install
 * button instead of relying on the browser's subtle hint. The event only fires
 * when the PWA is installable (manifest + HTTPS + a service worker) and the user
 * has not already installed it.
 */

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallPrompt(): {
  canInstall: boolean
  install: () => void
  dismiss: () => void
} {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const onBeforeInstall = (event: Event): void => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  return {
    canInstall: deferred !== null,
    install: () => {
      if (!deferred) return
      void deferred.prompt()
      void deferred.userChoice.finally(() => setDeferred(null))
    },
    dismiss: () => setDeferred(null),
  }
}
