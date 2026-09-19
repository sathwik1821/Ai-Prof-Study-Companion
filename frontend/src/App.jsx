import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OtpVerifyPage from './pages/OtpVerifyPage'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import SpacePage from './pages/SpacePage'
import ProjectPage from './pages/ProjectPage'
import TutorPage from './pages/TutorPage'
import QuizPage from './pages/QuizPage'
import MaterialsPage from './pages/MaterialsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AdminPage from './pages/AdminPage'
import LoadingScreen from './components/LoadingScreen'
import ProfilePage from './pages/ProfilePage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') {
    toast.error('Access denied — Admin only')
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: 'var(--accent-emerald)', secondary: '#fff' } },
            error:   { iconTheme: { primary: 'var(--accent-rose)',    secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login"      element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register"   element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/verify-otp" element={<PublicRoute><OtpVerifyPage /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"                           element={<DashboardPage />} />
            <Route path="analytics"                           element={<AnalyticsPage />} />
            <Route path="profile"                             element={<ProfilePage />} />
            <Route path="admin"  element={<AdminRoute><AdminPage /></AdminRoute>} />
            <Route path="spaces/:spaceId"                     element={<SpacePage />} />
            <Route path="spaces/:spaceId/projects/:projectId" element={<ProjectPage />} />
            <Route path="spaces/:spaceId/projects/:projectId/tutor"     element={<TutorPage />} />
            <Route path="spaces/:spaceId/projects/:projectId/quiz"      element={<QuizPage />} />
            <Route path="spaces/:spaceId/projects/:projectId/materials" element={<MaterialsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
