import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

export default function HomeDashboard() {
  const navigate = useNavigate();
  const [showDesktopVideo, setShowDesktopVideo] = useState(() => window.matchMedia(DESKTOP_MEDIA_QUERY).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const update = () => {
      setShowDesktopVideo(mediaQuery.matches);
      if (!mediaQuery.matches) navigate('/dashboard/kpis', { replace: true });
    };
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, [navigate]);

  return (
    <section className="dashboard-video-home" aria-label="Inicio KPIs">
      {showDesktopVideo && (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="dashboard-bg-video"
          aria-hidden="true"
        >
          <source src="/img/fondo_desktop.mp4" type="video/mp4" />
        </video>
      )}
    </section>
  );
}
