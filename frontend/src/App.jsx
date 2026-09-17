import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AppLayout from './components/AppLayout.jsx'
import AuthCallbackPage from './pages/AuthCallbackPage.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import ModulePlaceholderPage from './pages/ModulePlaceholderPage.jsx'
import OwnersPage from './pages/OwnersPage.jsx'
import AnimalsPage from './pages/AnimalsPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/owners" element={<OwnersPage />} />
            <Route path="/animals" element={<AnimalsPage />} />
            <Route
              path="/visits"
              element={<ModulePlaceholderPage title="Wizyty" />}
            />
            <Route
              path="/medical"
              element={<ModulePlaceholderPage title="Dokumentacja medyczna" />}
            />
            <Route
              path="/vaccinations"
              element={<ModulePlaceholderPage title="Szczepienia" />}
            />
            <Route
              path="/prescriptions"
              element={<ModulePlaceholderPage title="Recepty" />}
            />
          </Route>
        </Route>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App