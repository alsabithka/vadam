// Supabase client + realtime room channel setup.
//
// When the project is connected to Supabase, Make generates
// `utils/supabase/info.tsx` exporting `projectId` and `publicAnonKey`.
// We load it lazily so the app still builds and runs (in local practice
// mode) before a connection exists.

import { createClient, type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null
let configPromise: Promise<{ projectId: string; publicAnonKey: string } | null> | null = null

// `import.meta.glob` tolerates the file being absent (empty map) and picks it
// up automatically once the user connects Supabase — no dev/build resolve error.
const infoModules = import.meta.glob('../../utils/supabase/info.{ts,tsx}')

async function loadConfig() {
  if (!configPromise) {
    configPromise = (async () => {
      try {
        const key = Object.keys(infoModules)[0]
        if (!key) return null
        const info = (await infoModules[key]()) as { projectId?: string; publicAnonKey?: string }
        if (info.projectId && info.publicAnonKey) {
          return { projectId: info.projectId, publicAnonKey: info.publicAnonKey }
        }
      } catch {
        /* not connected yet */
      }
      return null
    })()
  }
  return configPromise
}

export async function isSupabaseConfigured(): Promise<boolean> {
  return (await loadConfig()) !== null
}

export async function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (cachedClient) return cachedClient
  const cfg = await loadConfig()
  if (!cfg) return null
  cachedClient = createClient(`https://${cfg.projectId}.supabase.co`, cfg.publicAnonKey, {
    realtime: { params: { eventsPerSecond: 20 } },
  })
  return cachedClient
}

/** Open a broadcast channel keyed by room code. */
export async function openRoomChannel(roomCode: string): Promise<RealtimeChannel | null> {
  const client = await getSupabaseClient()
  if (!client) return null
  return client.channel(`vadamvali:${roomCode}`, {
    config: { broadcast: { self: false }, presence: { key: crypto.randomUUID() } },
  })
}
