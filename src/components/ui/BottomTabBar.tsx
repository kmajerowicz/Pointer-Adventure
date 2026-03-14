import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Map, Route, Heart, User } from 'lucide-react'
import { useAuthStore } from '../../stores/auth'
import { AuthGateSheet } from '../../features/auth/AuthGateSheet'

const tabs = [
  { to: '/app', label: 'Mapa', icon: Map, protected: false },
  { to: '/app/trails', label: 'Trasy', icon: Route, protected: false },
  { to: '/app/favorites', label: 'Ulubione', icon: Heart, protected: true },
  { to: '/app/profile', label: 'Profil', icon: User, protected: true },
] as const

export function BottomTabBar() {
  const { session } = useAuthStore()
  const [showAuthSheet, setShowAuthSheet] = useState(false)

  return (
    <nav className="flex items-center justify-around bg-bg-surface border-t border-bg-elevated h-[var(--spacing-tab-bar)] shrink-0 px-2">
      {tabs.map(({ to, label, icon: Icon, protected: isProtected }) => {
        const isGated = isProtected && !session

        if (isGated) {
          return (
            <button
              key={to}
              onClick={() => setShowAuthSheet(true)}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[3rem] min-h-[3rem] rounded-lg transition-colors text-text-muted hover:text-text-secondary"
            >
              <Icon size={22} strokeWidth={1.8} />
              <span className="text-[0.65rem] font-medium">{label}</span>
            </button>
          )
        }

        return (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 min-w-[3rem] min-h-[3rem] rounded-lg transition-colors ${
                isActive ? 'text-accent' : 'text-text-muted hover:text-text-secondary'
              }`
            }
          >
            <Icon size={22} strokeWidth={1.8} />
            <span className="text-[0.65rem] font-medium">{label}</span>
          </NavLink>
        )
      })}

      <AuthGateSheet isOpen={showAuthSheet} onClose={() => setShowAuthSheet(false)} />
    </nav>
  )
}
