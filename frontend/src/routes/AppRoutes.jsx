import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import DashboardLayout from '@/layouts/dashboard-layout.jsx';
import LoginPage from '@/features/auth/pages/login-page.jsx';
import KpiDashboardPage from '@/features/kpis/pages/kpi-dashboard-page.jsx';
import NotFound from '@/pages/not-found.jsx';
import Unauthorized from '@/pages/unauthorized.jsx';
import HomeDashboard from '@/pages/home-dashboard.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import PublicRoute from './PublicRoute.jsx';
import ImportacionesPage from '@/features/importaciones/pages/importaciones-page.jsx';
import UsersPage from '@/features/usuarios/pages/users-page.jsx';
import RoleGuard from './RoleGuard.jsx';

export default function AppRoutes() {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<HomeDashboard />} />
          <Route path="/dashboard/kpis" element={<KpiDashboardPage />} />
          <Route path="/dashboard/importaciones" element={<RoleGuard roles={['ADMIN', 'DIRECCION']}><ImportacionesPage /></RoleGuard>} />
          <Route path="/dashboard/usuarios" element={<RoleGuard roles={['ADMIN']}><UsersPage /></RoleGuard>} />
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
