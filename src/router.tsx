import { createBrowserRouter } from 'react-router-dom'
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
          { path: 'favorites', element: <FavoritesList /> },
          { path: 'profile', element: <ProfileView /> },
        ],
      },
      { path: '/invite', element: <InvitePage /> },
      { path: '/auth', element: <AuthPage /> },
      { path: '/trails/:id', element: <TrailDetail /> },
      { path: '/onboarding', element: <OnboardingFlow /> },
    ],
  },
])
