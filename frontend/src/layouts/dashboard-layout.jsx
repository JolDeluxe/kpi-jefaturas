import { Outlet } from 'react-router-dom';
import Header from './components/header.jsx';
import Footer from './components/footer.jsx';
import { useAuthStore } from '@/stores/auth-store';
import { useHeaderHeight } from '@/hooks/use-header-height.js';

export default function DashboardLayout() {
  const user = useAuthStore((state) => state.user);
  useHeaderHeight();

  return (
    <div className="app-shell">
      <header className="app-header">
        <Header user={user} />
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
