import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuthStore();
  const location = useLocation();

  if (loading) return <div className="screen-loader">Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
