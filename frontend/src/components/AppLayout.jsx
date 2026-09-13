import { NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '../auth/useAuth.js'

function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="app-brand">
          <strong>VetCRM</strong>
        </div>

        <nav className="app-navigation">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/owners">Właściciele</NavLink>
          <NavLink to="/animals">Zwierzęta</NavLink>
          <NavLink to="/visits">Wizyty</NavLink>
          <NavLink to="/medical">Dokumentacja medyczna</NavLink>
          <NavLink to="/vaccinations">Szczepienia</NavLink>
          <NavLink to="/prescriptions">Recepty</NavLink>
        </nav>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <div>
            <strong>{user?.username}</strong>
            {user?.role && <span> · {user.role}</span>}
          </div>

          <button type="button" onClick={logout}>
            Wyloguj
          </button>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout