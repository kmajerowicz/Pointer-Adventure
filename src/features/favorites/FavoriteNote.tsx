import { useState, useEffect, useRef } from 'react'

interface FavoriteNoteProps {
  routeId: string
  initialNote: string | null
  onSave: (routeId: string, note: string | null) => Promise<void>
}

export function FavoriteNote({ routeId, initialNote, onSave }: FavoriteNoteProps) {
  const [draft, setDraft] = useState(initialNote ?? '')
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<'saved' | 'error' | null>(null)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync draft when initialNote changes (external update)
  useEffect(() => {
    setDraft(initialNote ?? '')
  }, [initialNote])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    }
  }, [])

  const showFeedback = (type: 'saved' | 'error') => {
    setFeedback(type)
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2000)
  }

  const handleBlur = async () => {
    const changed = draft !== (initialNote ?? '')
    if (!changed) return
    setSaving(true)
    try {
      await onSave(routeId, draft || null)
      showFeedback('saved')
    } catch {
      showFeedback('error')
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
        placeholder="Dodaj prywatną notatkę..."
        className="w-full bg-bg-elevated text-text-primary text-sm rounded-lg p-3 min-h-[80px] resize-none placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <div className="h-5 mt-1">
        {saving && (
          <p className="text-xs text-text-muted">Zapisywanie...</p>
        )}
        {!saving && feedback === 'saved' && (
          <p className="text-xs text-success animate-fade-in">Zapisano</p>
        )}
        {!saving && feedback === 'error' && (
          <p className="text-xs text-error animate-fade-in">Błąd zapisu</p>
        )}
      </div>
    </div>
  )
}
