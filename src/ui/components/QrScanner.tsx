import { useCallback, useEffect, useRef, useState } from 'react'
import { T } from '../../i18n/de'

/**
 * Kamera-Scanner für die QR-Paarung. Nutzt – wo vorhanden – das native
 * `BarcodeDetector` (Android Chrome) und fällt sonst auf `@zxing/browser`
 * zurück (iOS Safari), das nur dann nachgeladen wird. Mehrteilige Codes
 * (`FYN1|id|i|n|chunk`) werden wieder zusammengesetzt.
 */
export function QrScanner({
  onResult,
  onCancel,
  hint,
}: {
  onResult: (data: string) => void
  onCancel: () => void
  hint?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const doneRef = useRef(false)
  const framesRef = useRef<Map<number, string>>(new Map())
  const expectRef = useRef<{ id: string; n: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ got: number; total: number } | null>(null)

  const handleText = useCallback(
    (text: string) => {
      if (doneRef.current || !text.startsWith('FYN1|')) return
      const parts = text.split('|')
      const id = parts[1]
      const i = Number(parts[2])
      const n = Number(parts[3])
      const chunk = parts.slice(4).join('|')
      if (!expectRef.current || expectRef.current.id !== id) {
        expectRef.current = { id, n }
        framesRef.current = new Map()
      }
      framesRef.current.set(i, chunk)
      setProgress({ got: framesRef.current.size, total: n })
      if (framesRef.current.size < n) return
      let data = ''
      for (let k = 0; k < n; k++) {
        const c = framesRef.current.get(k)
        if (c === undefined) return
        data += c
      }
      doneRef.current = true
      onResult(data)
    },
    [onResult],
  )

  useEffect(() => {
    let cancelled = false
    let stop: () => void = () => {}

    async function run() {
      try {
        const BD = (window as unknown as { BarcodeDetector?: new (o: unknown) => { detect(v: unknown): Promise<{ rawValue: string }[]> } }).BarcodeDetector
        const video = videoRef.current
        if (!video) return
        if (BD) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          })
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop())
            return
          }
          video.srcObject = stream
          await video.play()
          const detector = new BD({ formats: ['qr_code'] })
          const id = setInterval(async () => {
            if (doneRef.current) return
            try {
              const codes = await detector.detect(video)
              for (const c of codes) handleText(c.rawValue)
            } catch {
              /* einzelnes Frame ignorieren */
            }
          }, 250)
          stop = () => {
            clearInterval(id)
            stream.getTracks().forEach((t) => t.stop())
          }
        } else {
          const { BrowserQRCodeReader } = await import('@zxing/browser')
          const reader = new BrowserQRCodeReader()
          const controls = await reader.decodeFromVideoDevice(undefined, video, (result) => {
            if (result) handleText(result.getText())
          })
          stop = () => controls.stop()
        }
      } catch (e) {
        if (!cancelled) setError(String(e))
      }
    }
    void run()
    return () => {
      cancelled = true
      stop()
    }
  }, [handleText])

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-felt-950 ring-1 ring-gold-400/40">
        <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-gold-300/70" />
      </div>
      {hint && <p className="text-center text-sm text-gold-200/70">{hint}</p>}
      {progress && progress.total > 1 && (
        <div className="text-xs text-gold-300">
          {progress.got}/{progress.total} {T.qrFrames}
        </div>
      )}
      {error && <p className="text-center text-xs text-rose-300">{T.cameraError}</p>}
      <button
        onClick={onCancel}
        className="glass rounded-xl px-5 py-2 text-sm text-gold-200/80 active:scale-[0.98]"
      >
        {T.close}
      </button>
    </div>
  )
}
