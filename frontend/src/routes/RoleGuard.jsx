import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

export default function RoleGuard({ roles, children }) {
  const user = useAuthStore((state) => state.user);
  if (!user || !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}
