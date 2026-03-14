export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
)
export const isMapboxConfigured = Boolean(import.meta.env.VITE_MAPBOX_TOKEN)
