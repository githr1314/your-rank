import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/hooks/useAuth'
import { MainLayout } from '@/components/layout/MainLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { AuthGuard } from '@/components/layout/AuthGuard'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import { MyRankingsPage } from '@/pages/MyRankingsPage'
import { CreateRankingPage } from '@/pages/CreateRankingPage'
import { DiscoverPage } from '@/pages/DiscoverPage'
import { RankingDetailPage } from '@/pages/RankingDetailPage'
import { SharePage } from '@/pages/SharePage'
import { RankingManagePage } from '@/pages/RankingManagePage'
import ProfilePage from '@/pages/ProfilePage'

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 bg-background">
      <h1 className="text-headline-md text-on-surface-variant">404</h1>
      <p className="text-body-md text-on-surface-variant">页面未找到</p>
    </div>
  )
}

// Share layout — clean layout without navbar
function ShareLayout() {
  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-auto">
      <Outlet />
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <DiscoverPage /> },
      { path: 'home', element: <DiscoverPage /> },
      {
        path: 'my-rankings',
        element: (
          <AuthGuard>
            <MyRankingsPage />
          </AuthGuard>
        ),
      },
      {
        path: 'create',
        element: (
          <AuthGuard>
            <CreateRankingPage />
          </AuthGuard>
        ),
      },
      {
        path: 'profile',
        element: (
          <AuthGuard>
            <ProfilePage />
          </AuthGuard>
        ),
      },
      { path: 'ranking/:id', element: <RankingDetailPage /> },
      {
        path: 'ranking/:id/manage',
        element: (
          <AuthGuard>
            <RankingManagePage />
          </AuthGuard>
        ),
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ShareLayout />,
    children: [{ path: 's/:code', element: <SharePage /> }],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(20px)',
            color: '#1a1c1c',
            fontSize: '15px',
          },
        }}
      />
    </AuthProvider>
  )
}

export default App
