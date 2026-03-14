import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { AuthLayout } from './components/layout/AuthLayout'
import { MapView, MapErrorBoundary } from './features/map'
import { TrailList } from './features/trails/TrailList'
import { TrailDetail } from './features/trails/TrailDetail'
import { FavoritesList } from './features/favorites'
import { InvitePage } from './features/auth/InvitePage'
import { AuthPage } from './features/auth/AuthPage'
import { OnboardingFlow } from './features/onboarding/OnboardingFlow'
import { ProfileView } from './features/profile'
import { LandingPage } from './features/landing'
import { useAuthStore } from './stores/auth'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((s) => s.session)
  if (!session) return <Navigate to="/app/auth" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/invite', element: <InvitePage /> },
  {
    path: '/app',
    element: <AuthLayout />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <MapErrorBoundary><MapView /></MapErrorBoundary> },
          { path: 'trails', element: <TrailList /> },
          { path: 'favorites', element: <FavoritesList /> },
          { path: 'profile', element: <ProfileView /> },
        ],
      },
      { path: 'auth', element: <AuthPage /> },
      { path: 'trails/:id', element: <TrailDetail /> },
      { path: 'onboarding', element: <ProtectedRoute><OnboardingFlow /></ProtectedRoute> },
    ],
  },
])
