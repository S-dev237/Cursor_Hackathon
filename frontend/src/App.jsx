import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { AssistantProvider } from './contexts/AssistantContext.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import AssistantWidget from './components/assistant/AssistantWidget.jsx'
import PrivateRoute from './components/layout/PrivateRoute.jsx'
import Spinner from './components/ui/Spinner.jsx'

import LandingPage from './pages/LandingPage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import DomainsPage from './pages/DomainsPage.jsx'
import InstitutionsPage from './pages/InstitutionsPage.jsx'
// react-pdf est lourd → chargé à la demande
const DocumentPage = lazy(() => import('./pages/DocumentPage.jsx'))
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import SubmitPage from './pages/SubmitPage.jsx'
import MySubmissionsPage from './pages/MySubmissionsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AssistantProvider>
            <Routes>
            {/* Routes publiques */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/domains" element={<DomainsPage />} />
            <Route path="/institutions" element={<InstitutionsPage />} />
            <Route
              path="/documents/:id"
              element={
                <Suspense
                  fallback={
                    <div className="page-shell flex min-h-dvh items-center justify-center">
                      <Spinner size={32} />
                    </div>
                  }
                >
                  <DocumentPage />
                </Suspense>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Routes privées (connecté) */}
            <Route element={<PrivateRoute />}>
              <Route path="/submit" element={<SubmitPage />} />
              <Route path="/my-submissions" element={<MySubmissionsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Routes admin */}
            <Route element={<PrivateRoute adminOnly />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/queue" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <AssistantWidget />
          </AssistantProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
