import { NavLink } from 'react-router-dom'
import { Map, Route, Heart, User } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Mapa', icon: Map },
  { to: '/trails', label: 'Trasy', icon: Route },
  { to: '/favorites', label: 'Ulubione', icon: Heart },
  { to: '/profile', label: 'Profil', icon: User },
] as const

export function BottomTabBar() {
  return (
    <nav className="flex items-center justify-around bg-bg-surface border-t border-bg-elevated h-[var(--spacing-tab-bar)] shrink-0 px-2">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 min-w-[3rem] min-h-[3rem] rounded-lg transition-colors ${
              isActive ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
            }`
          }
        >
          <Icon size={22} strokeWidth={1.8} />
          <span className="text-[0.65rem] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
