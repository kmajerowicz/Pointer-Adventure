import { useState, useEffect } from 'react'

interface FavoriteNoteProps {
  routeId: string
  initialNote: string | null
  onSave: (routeId: string, note: string | null) => Promise<void>
}

export function FavoriteNote({ routeId, initialNote, onSave }: FavoriteNoteProps) {
  const [draft, setDraft] = useState(initialNote ?? '')
  const [saving, setSaving] = useState(false)

  // Sync draft when initialNote changes (external update)
  useEffect(() => {
    setDraft(initialNote ?? '')
  }, [initialNote])

  const handleBlur = async () => {
    const changed = draft !== (initialNote ?? '')
    if (!changed) return
    setSaving(true)
    try {
      await onSave(routeId, draft || null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <label className="block text-xs text-text-secondary mb-1.5 font-medium">
        Twoja notatka
      </label>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        placeholder="Dodaj prywatna notatke..."
        className="w-full bg-bg-elevated text-text-primary text-sm rounded-lg p-3 min-h-[80px] resize-none placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
      />
      {saving && (
        <p className="text-xs text-text-muted mt-1">Zapisywanie...</p>
      )}
    </div>
  )
}
