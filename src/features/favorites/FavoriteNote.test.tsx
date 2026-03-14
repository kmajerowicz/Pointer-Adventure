import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FavoriteNote } from './FavoriteNote'

describe('FavoriteNote', () => {
  it('renders textarea with initial note value', () => {
    render(
      <FavoriteNote routeId="r1" initialNote="Moja notatka" onSave={vi.fn()} />
    )
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeDefined()
    expect((textarea as HTMLTextAreaElement).value).toBe('Moja notatka')
  })

  it('renders textarea empty when initial note is null', () => {
    render(
      <FavoriteNote routeId="r1" initialNote={null} onSave={vi.fn()} />
    )
    const textarea = screen.getByRole('textbox')
    expect((textarea as HTMLTextAreaElement).value).toBe('')
  })

  it('calls onSave on blur when content changed', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(
      <FavoriteNote routeId="r1" initialNote="Stara notatka" onSave={onSave} />
    )
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Nowa notatka' } })
    fireEvent.blur(textarea)
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('r1', 'Nowa notatka')
    })
  })

  it('does NOT call onSave on blur when content unchanged', async () => {
    const onSave = vi.fn()
    render(
      <FavoriteNote routeId="r1" initialNote="Bez zmian" onSave={onSave} />
    )
    const textarea = screen.getByRole('textbox')
    fireEvent.blur(textarea)
    await waitFor(() => {
      expect(onSave).not.toHaveBeenCalled()
    })
  })

  it('saves null when textarea is cleared (empty string)', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(
      <FavoriteNote routeId="r1" initialNote="Notatka" onSave={onSave} />
    )
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: '' } })
    fireEvent.blur(textarea)
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('r1', null)
    })
  })

  it('shows "Zapisywanie..." during save', async () => {
    let resolve: () => void
    const onSave = vi.fn().mockImplementation(() => new Promise<void>((r) => { resolve = r }))
    render(
      <FavoriteNote routeId="r1" initialNote="Stara" onSave={onSave} />
    )
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Nowa' } })
    fireEvent.blur(textarea)
    await waitFor(() => {
      expect(screen.getByText('Zapisywanie...')).toBeDefined()
    })
    resolve!()
    await waitFor(() => {
      expect(screen.queryByText('Zapisywanie...')).toBeNull()
    })
  })
})
