import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from './useAuth.js'

function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <p>Ładowanie...</p>
  }

  if (status === 'unauthenticated') {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  return <Outlet />
}

export default ProtectedRoute