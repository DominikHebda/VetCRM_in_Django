import { Outlet } from 'react-router-dom'

function AppLayout() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <strong>VetCRM</strong>
      </header>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
