import { Outlet } from 'react-router-dom'
import { BottomTabBar } from '../ui/BottomTabBar'
import { FilterTooltip } from '../../features/onboarding/FilterTooltip'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

export function AppLayout() {
  const isOnline = useOnlineStatus()

  return (
    <div className={`flex flex-col h-full bg-bg-base${!isOnline ? ' pt-9' : ''}`}>
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
      <FilterTooltip />
      <BottomTabBar />
    </div>
  )
}
