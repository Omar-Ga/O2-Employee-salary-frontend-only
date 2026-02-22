import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'
import { Login } from '@/pages/Login'
import { useAuthStore } from '@/store/auth.store'
import { Dashboard } from '@/pages/Dashboard'
import { Employees } from '@/pages/Employees'
import { Payroll } from '@/pages/Payroll'
import { Settings } from '@/pages/Settings'
import { AboutTab } from '@/components/settings/tabs/AboutTab'
import { DepartmentsTab } from '@/components/settings/tabs/DepartmentsTab'
import { ExportTab } from '@/components/settings/tabs/ExportTab'
import { ImportTab } from '@/components/settings/tabs/ImportTab'
import { PreferencesTab } from '@/components/settings/tabs/PreferencesTab'
import { Toaster } from '@/components/ui/toaster'
import '@/i18n'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((state) => state.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="settings" element={<Settings />}>
            <Route index element={<Navigate to="departments" replace />} />
            <Route path="about" element={<AboutTab />} />
            <Route path="departments" element={<DepartmentsTab />} />
            <Route path="export" element={<ExportTab />} />
            <Route path="import" element={<ImportTab />} />
            <Route path="preferences" element={<PreferencesTab />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
