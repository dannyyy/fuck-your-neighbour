/**
 * (De)Kodierung der WebRTC-Signalisierung (SDP) für die QR-Paarung – ganz ohne
 * Server. SDP wird (falls verfügbar) per `CompressionStream('gzip')` komprimiert
 * und base64-kodiert; fehlt die API (ältere iOS-Versionen), wird unkomprimiert
 * übertragen. Die Aufteilung auf mehrere QR-Frames übernimmt die QR-Komponente.
 */

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

const hasCompression = typeof CompressionStream !== 'undefined'

async function gzip(input: string): Promise<Uint8Array> {
  const cs = new CompressionStream('gzip')
  const writer = cs.writable.getWriter()
  void writer.write(new TextEncoder().encode(input) as unknown as BufferSource)
  void writer.close()
  const ab = await new Response(cs.readable).arrayBuffer()
  return new Uint8Array(ab)
}

async function gunzip(bytes: Uint8Array): Promise<string> {
  const ds = new DecompressionStream('gzip')
  const writer = ds.writable.getWriter()
  void writer.write(bytes as unknown as BufferSource)
  void writer.close()
  const ab = await new Response(ds.readable).arrayBuffer()
  return new TextDecoder().decode(ab)
}

/** Kürzt ein SDP minimal (entfernt überflüssige a=ssrc/leere Zeilen). */
function trimSdp(sdp: string): string {
  return sdp
    .split('\r\n')
    .filter((line) => line.length > 0)
    .join('\r\n')
}

/** Kodiert eine Offer/Answer in einen kompakten String (Flag + Typ + Payload). */
export async function encodeSignal(desc: RTCSessionDescriptionInit): Promise<string> {
  const payload = JSON.stringify({ t: desc.type === 'offer' ? 'o' : 'a', s: trimSdp(desc.sdp ?? '') })
  if (hasCompression) {
    return 'g' + bytesToBase64(await gzip(payload))
  }
  return 'r' + bytesToBase64(new TextEncoder().encode(payload))
}

export async function decodeSignal(code: string): Promise<RTCSessionDescriptionInit> {
  const flag = code[0]
  const body = code.slice(1)
  const bytes = base64ToBytes(body)
  const json = flag === 'g' ? await gunzip(bytes) : new TextDecoder().decode(bytes)
  const parsed = JSON.parse(json) as { t: 'o' | 'a'; s: string }
  return { type: parsed.t === 'o' ? 'offer' : 'answer', sdp: parsed.s }
}
