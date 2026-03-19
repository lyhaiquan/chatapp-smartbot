import Peer from 'peerjs'

type IceServer = RTCIceServer

const defaultIceServers: IceServer[] = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
    ],
  },
]

function parseBoolean(value?: string) {
  if (value === undefined) return undefined
  return value.toLowerCase() === 'true'
}

function parsePort(value?: string) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseIceServers(): IceServer[] {
  const raw = import.meta.env.VITE_WEBRTC_ICE_SERVERS as string | undefined
  if (!raw) return defaultIceServers

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as IceServer[]
    }
  } catch (error) {
    console.warn('Invalid VITE_WEBRTC_ICE_SERVERS JSON. Falling back to default STUN servers.', error)
  }

  return defaultIceServers
}

export function getPeerOptions(): Peer.PeerJSOption {
  const host = import.meta.env.VITE_PEERJS_HOST as string | undefined
  const path = import.meta.env.VITE_PEERJS_PATH as string | undefined
  const secureFromEnv = parseBoolean(import.meta.env.VITE_PEERJS_SECURE as string | undefined)
  const port = parsePort(import.meta.env.VITE_PEERJS_PORT as string | undefined)

  const options: Peer.PeerJSOption = {
    config: {
      iceServers: parseIceServers(),
    },
  }

  if (host) {
    options.host = host
    options.secure = secureFromEnv ?? window.location.protocol === 'https:'
    if (path) options.path = path
    if (port !== undefined) options.port = port
  }

  return options
}