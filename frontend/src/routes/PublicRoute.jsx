import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

export default function PublicRoute() {
  const { isAuthenticated, loading } = useAuthStore();
  if (loading) return <div className="screen-loader">Cargando...</div>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
