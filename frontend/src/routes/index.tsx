import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import HomePage from '@/pages/HomePage'
import MyRankingsPage from '@/pages/MyRankingsPage'
import CreateRankingPage from '@/pages/CreateRankingPage'
import RankingDetailPage from '@/pages/RankingDetailPage'
import RankingManagePage from '@/pages/RankingManagePage'
import SharePage from '@/pages/SharePage'
import ProfilePage from '@/pages/ProfilePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'my-rankings', element: <MyRankingsPage /> },
      { path: 'create', element: <CreateRankingPage /> },
      { path: 'ranking/:id', element: <RankingDetailPage /> },
      { path: 'ranking/:id/manage', element: <RankingManagePage /> },
      { path: 's/:code', element: <SharePage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
])
