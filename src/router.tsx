import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { AuthLayout } from './components/layout/AuthLayout'
import { MapView, MapErrorBoundary } from './features/map'
import { TrailList } from './features/trails/TrailList'
import { TrailDetail } from './features/trails/TrailDetail'
import { InvitePage } from './features/auth/InvitePage'
import { AuthPage } from './features/auth/AuthPage'
import { OnboardingFlow } from './features/onboarding/OnboardingFlow'

const FavoritesPage = () => <div className="flex-1 flex items-center justify-center text-text-secondary">Ulubione</div>
const ProfilePage = () => <div className="flex-1 flex items-center justify-center text-text-secondary">Profil</div>

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <MapErrorBoundary><MapView /></MapErrorBoundary> },
          { path: 'trails', element: <TrailList /> },
          { path: 'favorites', element: <FavoritesPage /> },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
      { path: '/invite', element: <InvitePage /> },
      { path: '/auth', element: <AuthPage /> },
      { path: '/trails/:id', element: <TrailDetail /> },
      { path: '/onboarding', element: <OnboardingFlow /> },
    ],
  },
])
