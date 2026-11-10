/**
 * QR scanner screen (Phase 5).
 *
 * Reads a Milimap QR sticker to learn "where am I", using `html5-qrcode` (WASM
 * fallback, so it works on iOS Safari and Firefox where the native
 * `BarcodeDetector` does not exist). The native detector is still preferred when
 * available via the library's `useBarCodeDetectorIfSupported` flag.
 *
 * The decision logic (what a scanned string means) is pure and lives in
 * `../scanner/flow.ts`; this component only drives the camera and renders the
 * outcome. Every valid or invalid scan is recorded to the backend analytics.
 */

import { useEffect, useRef, useState } from 'react'
import type { Html5Qrcode } from 'html5-qrcode'
import { demoCampus } from '@/data'
import type { NodeId } from '@/domain/types'
import { recordScan } from '@/backend/analytics'
import { analyzeScan, type ScanFailureReason, type ScanResult } from '../../scanner/flow'

type Phase =
  | { name: 'idle' }
  | { name: 'scanning' }
  | { name: 'manual' }
  | { name: 'result'; result: ScanResult }
  | { name: 'camera-error'; message: string }

const READER_ID = 'milimap-qr-reader'

interface ScannerScreenProps {
  /** Invoked once a scan confirms the student's location. */
  onUseOrigin: (nodeId: NodeId) => void
  /** A payload arriving from a deep link (#/qr/...), auto-analyzed on mount. */
  initialPayload?: string
}

export function ScannerScreen({ onUseOrigin, initialPayload }: ScannerScreenProps) {
  const [phase, setPhase] = useState<Phase>(() =>
    initialPayload
      ? { name: 'result', result: analyzeScan(initialPayload, demoCampus) }
      : { name: 'idle' },
  )
  const [manualCode, setManualCode] = useState(initialPayload ?? '')
  const scannerRef = useRef<Html5Qrcode | null>(null)

  // A deep-linked payload is a scan too: record it once on entry.
  useEffect(() => {
    if (initialPayload) {
      const result = analyzeScan(initialPayload, demoCampus)
      recordScan({ ok: result.status === 'confirmed', status: result.status, source: 'deeplink' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stopScanner = async (): Promise<void> => {
    const scanner = scannerRef.current
    if (!scanner) return
    try {
      if (scanner.isScanning) await scanner.stop()
    } finally {
      scanner.clear()
      scannerRef.current = null
    }
  }

  const handleDecode = async (text: string): Promise<void> => {
    const result = analyzeScan(text, demoCampus)
    recordScan({
      ok: result.status === 'confirmed',
      status: result.status,
      ...(result.status === 'confirmed' ? { nodeId: result.nodeId, level: result.level } : {}),
    })
    buzz(result.status === 'confirmed')
    await stopScanner()
    setPhase({ name: 'result', result })
  }

  const startCamera = async (): Promise<void> => {
    setPhase({ name: 'scanning' })
    try {
      // Dynamic import keeps the heavy decoder out of the initial bundle.
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode(READER_ID, {
        useBarCodeDetectorIfSupported: true,
        verbose: false,
      })
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          void handleDecode(decodedText)
        },
        () => {
          /* html5-qrcode fires this continuously while no QR is in view; ignore. */
        },
      )
    } catch (error) {
      await stopScanner()
      setPhase({
        name: 'camera-error',
        message:
          error instanceof Error && error.name === 'NotAllowedError'
            ? 'No diste permiso a la cámara. Podés escribir el código a mano.'
            : 'No se pudo abrir la cámara en este dispositivo. Probá escribiendo el código a mano.',
      })
    }
  }

  const submitManual = (): void => {
    const result = analyzeScan(manualCode, demoCampus)
    recordScan({
      ok: result.status === 'confirmed',
      status: result.status,
      source: 'manual',
    })
    buzz(result.status === 'confirmed')
    setPhase({ name: 'result', result })
  }

  // Stop the camera whenever we leave the scanning phase or unmount.
  useEffect(() => {
    return () => {
      void stopScanner()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.name])

  const backToIdle = (): void => {
    setManualCode('')
    setPhase({ name: 'idle' })
  }

  if (phase.name === 'scanning') {
    return (
      <section className="card">
        <h1 className="card__title">Escaneá el código QR</h1>
        <p className="card__body">
          Apunta al sticker de Milimap en la pared. El código está en los puntos QR.
        </p>
        <div id={READER_ID} className="qr-reader" />
        <p className="muted" style={{ marginTop: 'var(--space-3)' }}>
          Sin cámara o sin suerte:{' '}
          <button type="button" className="link-btn" onClick={backToIdle}>
            escribí el código a mano
          </button>
          .
        </p>
        <button
          type="button"
          className="btn-secondary"
          style={{ marginTop: 'var(--space-3)' }}
          onClick={backToIdle}
        >
          Cancelar
        </button>
      </section>
    )
  }

  if (phase.name === 'camera-error') {
    return (
      <section className="card card--danger">
        <h1 className="card__title">No se pudo usar la cámara</h1>
        <p className="card__body">{phase.message}</p>
        <div className="stack" style={{ marginTop: 'var(--space-3)' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setPhase({ name: 'manual' })}
          >
            Escribir código a mano
          </button>
          <button type="button" className="btn-secondary" onClick={backToIdle}>
            Volver
          </button>
        </div>
      </section>
    )
  }

  if (phase.name === 'manual') {
    return (
      <section className="card">
        <h1 className="card__title">Escribí el código</h1>
        <p className="card__body">
          El código está impreso en el sticker. Tiene la forma{' '}
          <span className="mono">MILIMAP:v1:…</span>.
        </p>
        <label className="field" style={{ marginTop: 'var(--space-3)' }}>
          <span className="field__label">Código QR</span>
          <input
            className="field__input"
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="MILIMAP:v1:EDIFICIO-DEMO:P1:N03"
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
          />
        </label>
        <div className="stack">
          <button
            type="button"
            className="btn-primary"
            disabled={manualCode.trim().length === 0}
            onClick={submitManual}
          >
            Confirmar
          </button>
          <button type="button" className="btn-secondary" onClick={backToIdle}>
            Volver
          </button>
        </div>
      </section>
    )
  }

  if (phase.name === 'result') {
    return <ScanResultCard result={phase.result} onUseOrigin={onUseOrigin} onReset={backToIdle} />
  }

  return (
    <section className="card">
      <h1 className="card__title">Escanear código QR</h1>
      <p className="card__body">
        Encontrá tu ubicación exacta dentro de la sede escaneando el sticker de la pared. Después
        podés pedir una ruta a cualquier salón.
      </p>
      <div className="stack" style={{ marginTop: 'var(--space-4)' }}>
        <button type="button" className="btn-primary" onClick={() => void startCamera()}>
          📷 Escanear con cámara
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setPhase({ name: 'manual' })}
        >
          ⌨️ Escribir código a mano
        </button>
      </div>
      <p className="muted" style={{ marginTop: 'var(--space-3)' }}>
        Probá con el código de ejemplo:{' '}
        <span className="mono">MILIMAP:v1:EDIFICIO-DEMO:P1:N03</span> (Entrada principal).
      </p>
    </section>
  )
}

function ScanResultCard({
  result,
  onUseOrigin,
  onReset,
}: {
  result: ScanResult
  onUseOrigin: (nodeId: NodeId) => void
  onReset: () => void
}) {
  if (result.status !== 'confirmed') {
    return (
      <section className="card card--danger">
        <h1 className="card__title">No pudimos leer este código</h1>
        <p className="card__body">{failureMessage(result.status)}</p>
        <div className="stack" style={{ marginTop: 'var(--space-3)' }}>
          <button type="button" className="btn-primary" onClick={onReset}>
            Intentar de nuevo
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="card">
      <p className="card__eyebrow">Ubicación confirmada</p>
      <h1 className="card__title">Estás en: {result.label}</h1>
      <p className="card__body">
        {result.levelShort} · {result.floorId}
      </p>
      <div className="pill-row">
        <span className="pill pill--brand">Nodo {result.nodeId}</span>
      </div>
      <div className="stack" style={{ marginTop: 'var(--space-4)' }}>
        <button type="button" className="btn-primary" onClick={() => onUseOrigin(result.nodeId)}>
          🎯 Buscar destino desde acá
        </button>
        <button type="button" className="btn-secondary" onClick={onReset}>
          Escanear otro código
        </button>
      </div>
    </section>
  )
}

function failureMessage(status: ScanFailureReason): string {
  switch (status) {
    case 'not_milimap':
      return 'Este código no es de Milimap. Probá con un sticker de la sede o escribí el código a mano.'
    case 'unsupported_version':
      return 'Este código usa una versión de Milimap que esta app todavía no entiende. Actualizá la app.'
    case 'malformed':
      return 'El código está incompleto o dañado. Revisá que esté completo y volvé a intentar.'
    case 'unresolved':
      return 'El código es de Milimap pero apunta a un punto que no está en este campus (probablemente el mapa todavía no lo tiene).'
    default: {
      // Exhaustiveness guard: a new failure reason must add a message here.
      const _exhaustive: never = status
      return _exhaustive
    }
  }
}

/** Short vibration on a good scan. Silently ignored where unsupported. */
function buzz(success: boolean): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(success ? 80 : 40)
    }
  } catch {
    /* haptics are optional */
  }
}
