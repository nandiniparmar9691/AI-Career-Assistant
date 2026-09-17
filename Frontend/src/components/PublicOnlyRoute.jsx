import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

const PublicOnlyRoute = () => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingSpinner fullscreen />

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

export default PublicOnlyRoute