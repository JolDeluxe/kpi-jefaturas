import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

export default function SystemAdminGuard({ children }) {
  const user = useAuthStore((state) => state.user);
  const isSystemAdmin = user?.role === 'ADMIN' && user?.cargoId == null;
  if (!isSystemAdmin) return <Navigate to="/unauthorized" replace />;
  return children;
}
