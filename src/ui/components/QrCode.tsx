import QRCode from 'qrcode'
import { useEffect, useMemo, useState } from 'react'
import { T } from '../../i18n/de'

/**
 * Frames > diese Länge werden auf mehrere (animierte) QR-Codes verteilt.
 * Bewusst klein gehalten, damit jeder einzelne Code locker scannbar bleibt; der
 * Scanner sammelt die Teile über mehrere Zyklen ein.
 */
const MAX_CHARS = 360
const FRAME_MS = 1500

interface FrameSet {
  id: string
  frames: string[]
}

/** Teilt grosse Daten in scannbare Frames `FYN1|id|i|n|chunk` auf. */
function buildFrames(data: string): FrameSet {
  const id = Math.random().toString(36).slice(2, 7)
  const n = Math.max(1, Math.ceil(data.length / MAX_CHARS))
  const frames: string[] = []
  for (let i = 0; i < n; i++) {
    frames.push(`FYN1|${id}|${i}|${n}|${data.slice(i * MAX_CHARS, (i + 1) * MAX_CHARS)}`)
  }
  return { id, frames }
}

/**
 * Zeigt Daten als QR-Code. Passen sie nicht in einen Code, werden mehrere Frames
 * im Wechsel animiert – der Scanner setzt sie wieder zusammen.
 */
export function QrCode({ data, size = 248 }: { data: string; size?: number }) {
  const { frames } = useMemo(() => buildFrames(data), [data])
  const [idx, setIdx] = useState(0)
  const [url, setUrl] = useState('')

  useEffect(() => {
    setIdx(0)
    if (frames.length <= 1) return
    const t = setInterval(() => setIdx((i) => (i + 1) % frames.length), FRAME_MS)
    return () => clearInterval(t)
  }, [frames])

  useEffect(() => {
    let alive = true
    QRCode.toDataURL(frames[idx], { errorCorrectionLevel: 'L', margin: 2, width: size })
      .then((u) => alive && setUrl(u))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [frames, idx, size])

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-2xl bg-white p-2" style={{ width: size + 16, height: size + 16 }}>
        {url && <img src={url} width={size} height={size} alt="QR" className="block" />}
      </div>
      {frames.length > 1 && (
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-1">
            {frames.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-4 rounded-full ${i === idx ? 'bg-gold-400' : 'bg-gold-400/25'}`}
              />
            ))}
          </div>
          <div className="text-xs text-gold-200/60">{T.qrMultipart}</div>
        </div>
      )}
    </div>
  )
}
