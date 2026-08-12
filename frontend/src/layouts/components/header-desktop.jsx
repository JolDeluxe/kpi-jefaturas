import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { cargosApi } from '@/features/cargos/api/cargos-api';
import {
  GLOBAL_CARGO_ID,
  GLOBAL_NAV_ITEM,
  getAreaForCargo,
  getVisibleAreas,
  shortCargoName
} from '@/features/cargos/config/cargo-nav-config.js';
import { useAuthStore } from '@/stores/auth-store';

export default function HeaderDesktop({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const logout = useAuthStore((state) => state.logout);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [cargos, setCargos] = useState([]);
  const [expandedAreaId, setExpandedAreaId] = useState(null);
  const activeCargoId = Number(searchParams.get('cargoId')) || null;
  const activeArea = getAreaForCargo(activeCargoId);
  const visibleIds = useMemo(() => new Set(cargos.map((cargo) => cargo.id)), [cargos]);
  const canSeeGlobal = visibleIds.has(GLOBAL_CARGO_ID);
  const byId = useMemo(() => new Map(cargos.map((cargo) => [cargo.id, cargo])), [cargos]);
  const areas = useMemo(() => getVisibleAreas(cargos), [cargos]);
  const expandedArea = areas.find((area) => area.id === (expandedAreaId || activeArea?.id)) || null;
  const visibleChildren = expandedArea
    ? expandedArea.childIds.map((id) => byId.get(id)).filter(Boolean)
    : [];

  useEffect(() => {
    cargosApi.visibles()
      .then(({ cargos: visibles }) => setCargos(visibles || []))
      .catch(() => setCargos([]));
  }, [user?.id]);

  useEffect(() => {
    if (location.pathname === '/dashboard') setExpandedAreaId(null);
  }, [location.pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  const goHome = () => {
    setExpandedAreaId(null);
    navigate('/dashboard');
  };

  const goCargo = (cargoId) => {
    navigate(`/dashboard/kpis?cargoId=${cargoId}`);
  };

  const selectArea = (area) => {
    setExpandedAreaId(area.id);
    if (visibleIds.has(area.id)) {
      goCargo(area.id);
      return;
    }
    const firstChild = area.childIds.find((id) => visibleIds.has(id));
    if (firstChild) goCargo(firstChild);
  };

  return (
    <div className="nav-desktop">
      <div className="nav-top">
        <button className="brand" onClick={goHome} aria-label="Ir al inicio">
          <img src="/img/01_Cuadra.webp" alt="Cuadra" />
        </button>
        <div className="user-zone">
          <span>{user?.nombre}</span>
          {!confirmLogout ? (
            <button className="logout-outline" onClick={() => setConfirmLogout(true)}>Salir</button>
          ) : (
            <div className="logout-confirm">
              <button onClick={() => setConfirmLogout(false)} disabled={loggingOut}>Cancelar</button>
              <button className="danger" onClick={handleLogout} disabled={loggingOut}>{loggingOut ? 'Saliendo...' : 'Confirmar'}</button>
            </div>
          )}
        </div>
      </div>
      <div className="nav-area-row" aria-label="Navegacion por gerencias">
        {canSeeGlobal && (
          <button
            className={`nav-global-link ${activeCargoId === GLOBAL_CARGO_ID ? 'active' : ''}`}
            onClick={() => goCargo(GLOBAL_CARGO_ID)}
          >
            {GLOBAL_NAV_ITEM.label}
          </button>
        )}
        {areas.map((area) => (
          <button
            key={area.id}
            className={activeArea?.id === area.id ? 'active' : ''}
            onClick={() => selectArea(area)}
          >
            {area.label}
          </button>
        ))}
      </div>
      {visibleChildren.length > 0 && (
        <div className="nav-submodule-row" aria-label="Departamentos">
          {visibleChildren.map((cargo) => (
            <button
              key={cargo.id}
              className={activeCargoId === cargo.id ? 'active' : ''}
              onClick={() => goCargo(cargo.id)}
            >
              {shortCargoName(cargo.nombre)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
