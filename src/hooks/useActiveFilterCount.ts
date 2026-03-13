import { useFiltersStore } from '../stores/filters'

/**
 * Returns the number of active (non-default) filters.
 * Used to display a badge count on the filter button.
 *
 * Defaults: length=null, surface=null, water='any', difficulty=null, distance=null, marked=null
 */
export function useActiveFilterCount(): number {
  return useFiltersStore((s) => {
    let count = 0
    if (s.length !== null) count++
    if (s.surface !== null) count++
    if (s.water !== 'any') count++
    if (s.difficulty !== null) count++
    if (s.distance !== null) count++
    if (s.marked !== null) count++
    return count
  })
}
