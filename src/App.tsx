import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Assets from './pages/Assets'
import Requests from './pages/Requests'
import Layout from './components/Layout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth()

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}

function AppRoutes() {
    const { isAuthenticated } = useAuth()

    return (
        <Routes>
            <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
            />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <Layout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="assets" element={<Assets />} />
                <Route path="requests" element={<Requests />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    )
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </ThemeProvider>
    )
}
