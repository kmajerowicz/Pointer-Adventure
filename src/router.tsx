import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'

const MapPage = () => <div className="flex-1 flex items-center justify-center text-text-secondary">Mapa</div>
const TrailsPage = () => <div className="flex-1 flex items-center justify-center text-text-secondary">Trasy</div>
const FavoritesPage = () => <div className="flex-1 flex items-center justify-center text-text-secondary">Ulubione</div>
const ProfilePage = () => <div className="flex-1 flex items-center justify-center text-text-secondary">Profil</div>
const InvitePage = () => <div className="flex-1 flex items-center justify-center text-text-secondary">Zaproszenie</div>
const AuthPage = () => <div className="flex-1 flex items-center justify-center text-text-secondary">Logowanie</div>

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <MapPage /> },
      { path: 'trails', element: <TrailsPage /> },
      { path: 'favorites', element: <FavoritesPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  { path: '/invite', element: <InvitePage /> },
  { path: '/auth', element: <AuthPage /> },
])
