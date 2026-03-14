import { Outlet } from 'react-router-dom'
import { BottomTabBar } from '../ui/BottomTabBar'
import { FilterTooltip } from '../../features/onboarding/FilterTooltip'

export function AppLayout() {
  return (
    <div className="flex flex-col h-full bg-bg-base">
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>
      <FilterTooltip />
      <BottomTabBar />
    </div>
  )
}
