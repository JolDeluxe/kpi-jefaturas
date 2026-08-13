import { Lock, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

export default function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDesktopVideo, setShowDesktopVideo] = useState(() => window.matchMedia(DESKTOP_MEDIA_QUERY).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const update = () => setShowDesktopVideo(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate(window.matchMedia(DESKTOP_MEDIA_QUERY).matches ? '/dashboard' : '/dashboard/kpis', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      {showDesktopVideo && (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="login-bg-video"
          aria-hidden="true"
        >
          <source src="/img/fondo_desktop.mp4" type="video/mp4" />
        </video>
      )}
      <section className="login-panel">
        <div className="login-brand">
          <img src="/img/01_Cuadra.webp" alt="Cuadra" />
        </div>
        <h1>KPIs Jefaturas</h1>
        <form onSubmit={submit} className="login-form">
          <label>
            <span>Usuario</span>
            <div className="input-icon">
              <UserRound size={17} />
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                type="text"
                autoComplete="username"
                required
              />
            </div>
          </label>
          <label>
            <span>Contrasena</span>
            <div className="input-icon">
              <Lock size={17} />
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" required />
            </div>
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>
      </section>
    </main>
  );
}
