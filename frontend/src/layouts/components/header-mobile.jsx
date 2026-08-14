import { Check, CircleDot, Menu, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cargosApi } from '@/features/cargos/api/cargos-api';
import AccountModal from '@/features/auth/components/account-modal.jsx';
import {
  GLOBAL_CARGO_ID,
  GLOBAL_NAV_ITEM,
  getAreaForCargo,
  getCargoDisplayName,
  getVisibleAreas,
  hasGlobalCargo,
  isGlobalCargo,
  shortCargoName
} from '@/features/cargos/config/cargo-nav-config.js';
import { useAuthStore } from '@/stores/auth-store';

const mobileItems = [
  { id: 'usuarios', label: 'Usuarios', path: '/dashboard/usuarios', superAdminOnly: true }
];

export default function HeaderMobile({ user }) {
  const [open, setOpen] = useState(false);
  const [departmentQuery, setDepartmentQuery] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [lastChildByParent, setLastChildByParent] = useState({});
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [cargos, setCargos] = useState([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const logout = useAuthStore((state) => state.logout);
  const isSuperAdmin = user?.role === 'ADMIN' && user?.cargoId == null;
  const items = mobileItems.filter((item) => !item.superAdminOnly || isSuperAdmin);
  const activeCargoId = Number(searchParams.get('cargoId')) || null;
  const byId = useMemo(() => new Map(cargos.map((cargo) => [cargo.id, cargo])), [cargos]);
  const areas = useMemo(() => getVisibleAreas(cargos), [cargos]);
  const activeCargo = activeCargoId ? byId.get(activeCargoId) : null;
  const activeIsGlobal = isGlobalCargo(activeCargoId);
  const canSeeGlobal = hasGlobalCargo(cargos);
  const activeArea = activeCargoId ? getAreaForCargo(activeCargoId, cargos) : null;
  const selectedArea = activeIsGlobal
    ? null
    : areas.find((area) => area.id === (selectedAreaId || activeArea?.id)) || areas[0] || null;
  const selectedAreaLabel = selectedArea?.label || 'Area';
  const activeAreaLabel = activeIsGlobal ? GLOBAL_NAV_ITEM.label : activeArea?.label || selectedAreaLabel;
  const selectedLabel = activeCargo
    ? (activeIsGlobal ? 'KPIs' : activeCargo.id === activeArea?.id ? activeAreaLabel : getCargoDisplayName(activeCargo))
    : 'Seleccionar departamento';
  const showSearch = cargos.length > 7;
  const normalizedQuery = departmentQuery.trim().toLowerCase();
  const filteredCargos = cargos.filter((cargo) => {
    if (!normalizedQuery) return true;
    return `${cargo.id} ${cargo.nombre}`.toLowerCase().includes(normalizedQuery);
  });

  useEffect(() => {
    const loadCargos = () => cargosApi.visibles()
      .then(({ cargos: visibles }) => setCargos(visibles || []))
      .catch(() => setCargos([]));
    loadCargos();
    window.addEventListener('kpi-data-refreshed', loadCargos);
    return () => window.removeEventListener('kpi-data-refreshed', loadCargos);
  }, [user?.id]);

  useEffect(() => {
    if (activeIsGlobal) {
      setSelectedAreaId(null);
      return;
    }
    if (!activeArea?.id) return;
    setSelectedAreaId(activeArea.id);
  }, [activeArea?.id, activeIsGlobal]);

  useEffect(() => {
    if (!open) return undefined;
    const scrollY = window.scrollY;
    const html = document.documentElement;
    const previousHtmlOverflow = html.style.overflow;
    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousWidth = document.body.style.width;
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      html.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.width = previousWidth;
      window.scrollTo(0, scrollY);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const go = (path, { close = true } = {}) => {
    navigate(path);
    if (close) setOpen(false);
  };

  const goHome = () => {
    go('/dashboard');
  };

  const goCargo = (cargoId, { close = true } = {}) => {
    const nextArea = getAreaForCargo(cargoId, cargos);
    setSelectedAreaId(isGlobalCargo(cargoId) ? null : nextArea?.id || null);
    if (nextArea && nextArea.id !== cargoId) {
      setLastChildByParent((current) => ({ ...current, [nextArea.id]: cargoId }));
    }
    setDepartmentQuery('');
    go(`/dashboard/kpis?cargoId=${cargoId}`, { close });
  };

  const goArea = (area) => {
    setSelectedAreaId(area.id);
    const rememberedChild = lastChildByParent[area.id];
    if (rememberedChild && area.childIds.includes(rememberedChild) && byId.has(rememberedChild)) {
      goCargo(rememberedChild, { close: false });
      return;
    }
    if (byId.has(area.id)) goCargo(area.id, { close: false });
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  const mobileDrawer = open ? (
    <div className="mobile-nav-dialog" role="dialog" aria-modal="true" aria-label="Navegacion de areas">
      <button className="drawer-backdrop" onClick={() => setOpen(false)} aria-label="Cerrar menu" />
      <div className="mobile-drawer glass-panel">
        <header className="mobile-nav-head">
          <div>
            <span>Navegacion KPI</span>
            <strong>{activeIsGlobal ? GLOBAL_NAV_ITEM.label : selectedAreaLabel}</strong>
            <small>{selectedLabel}</small>
          </div>
          <button className="department-sheet-close" onClick={() => setOpen(false)} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        {showSearch && (
          <label className="department-search glass-control">
            <Search size={18} />
            <input
              value={departmentQuery}
              onChange={(event) => setDepartmentQuery(event.target.value)}
              placeholder="Buscar gerencia o departamento"
            />
          </label>
        )}

        <div className="mobile-nav-content">
          {canSeeGlobal && (
            <section className="mobile-nav-section global">
              <div className="mobile-section-title">
                <span>Global</span>
                <small>Empresa</small>
              </div>
              <button
                className={`department-item global glass-control ${activeCargoId === GLOBAL_CARGO_ID ? 'active' : ''}`}
                onClick={() => goCargo(GLOBAL_CARGO_ID)}
                aria-current={activeCargoId === GLOBAL_CARGO_ID ? 'true' : undefined}
              >
                <span>
                  <small>Vista general</small>
                  {GLOBAL_NAV_ITEM.label}
                </span>
                {activeCargoId === GLOBAL_CARGO_ID && <Check size={18} />}
              </button>
            </section>
          )}

          <section className="mobile-nav-section">
            <div className="mobile-section-title">
              <span>Gerencias</span>
              <small>{areas.length}</small>
            </div>
            <div className="area-list">
              {areas.map((area) => {
                const visibleAreaCargo = filteredCargos.some((cargo) => cargo.id === area.id);
                const visibleChildren = filteredCargos.some((cargo) => area.childIds.includes(cargo.id));
                if (!visibleAreaCargo && !visibleChildren) return null;
                const active = selectedArea?.id === area.id;
                return (
                  <button
                    key={area.id}
                    className={`glass-control ${active ? 'active' : ''}`.trim()}
                    onClick={() => goArea(area)}
                    aria-pressed={active}
                  >
                    <span>{area.label}</span>
                    {active && <CircleDot size={16} />}
                  </button>
                );
              })}
            </div>
          </section>

          {selectedArea && (
          <section className="mobile-nav-section departments">
            <div className="mobile-section-title">
              <span>Departamentos</span>
              <small>{selectedAreaLabel}</small>
            </div>
            <div className="department-list">
              {selectedArea && byId.has(selectedArea.id) && filteredCargos.some((cargo) => cargo.id === selectedArea.id) && (
                <button
                  className={`department-item manager glass-control ${activeCargoId === selectedArea.id ? 'active' : ''}`}
                  onClick={() => goCargo(selectedArea.id)}
                  aria-current={activeCargoId === selectedArea.id ? 'true' : undefined}
                >
                  <span>
                    <small>Vista general</small>
                    {selectedAreaLabel}
                  </span>
                  {activeCargoId === selectedArea.id && <Check size={18} />}
                </button>
              )}
              {selectedArea && filteredCargos
                .filter((cargo) => selectedArea.childIds.includes(cargo.id))
                .map((cargo) => {
                  const isActive = cargo.id === activeCargoId;
                  return (
                    <button
                      key={cargo.id}
                      className={`department-item glass-control ${isActive ? 'active' : ''}`}
                      onClick={() => goCargo(cargo.id)}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <span>
                        <small>Departamento</small>
                        {shortCargoName(cargo.nombre)}
                      </span>
                      {isActive && <Check size={18} />}
                    </button>
                  );
                })}
            </div>
          </section>
          )}
        </div>

        {(items.length > 0) && (
          <div className="drawer-list secondary">
            {items.map((item) => (
              <button key={item.id} onClick={() => go(item.path)}>{item.label}</button>
            ))}
          </div>
        )}

        <footer className="drawer-actions">
          <button className="drawer-user profile-trigger-mobile" onClick={() => setProfileOpen(true)}>
            <strong>{user?.username || user?.nombre}</strong>
            <span>{user?.nombre} - {user?.role}</span>
          </button>
          <button className="danger full" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? 'Cerrando sesion...' : 'Cerrar sesion'}
          </button>
        </footer>
      </div>
    </div>
  ) : null;

  return (
    <nav className="nav-mobile">
      <div className="mobile-bar">
        <button className="icon-button" onClick={() => setOpen(!open)} aria-label={open ? 'Cerrar menu' : 'Abrir menu'}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
        <button className="brand mobile" onClick={goHome} aria-label="Ir al inicio">
          <img src="/img/01_Cuadra.webp" alt="Cuadra" />
        </button>
        <div className="avatar">{user?.nombre?.charAt(0) || 'U'}</div>
      </div>
      <div className="mobile-current-context glass-surface" aria-label="Vista actual">
        <div>
          <span>{activeAreaLabel}</span>
          <strong>{selectedLabel}</strong>
        </div>
      </div>
      {mobileDrawer && createPortal(mobileDrawer, document.body)}
      {profileOpen && createPortal(<AccountModal user={user} onClose={() => setProfileOpen(false)} />, document.body)}
    </nav>
  );
}
