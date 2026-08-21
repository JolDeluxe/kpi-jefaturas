import { Check, ChevronDown, ChevronRight, LogOut, Menu, Minus, Plus, X } from 'lucide-react';
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

export default function HeaderMobile({ user }) {
  const [open, setOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [expandedAreaId, setExpandedAreaId] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [cargos, setCargos] = useState([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const logout = useAuthStore((state) => state.logout);

  const isSuperAdmin = user?.role === 'ADMIN' && user?.cargoId == null;
  const activeCargoId = Number(searchParams.get('cargoId')) || null;
  const byId = useMemo(() => new Map(cargos.map((cargo) => [cargo.id, cargo])), [cargos]);
  const areas = useMemo(() => getVisibleAreas(cargos), [cargos]);
  const activeCargo = activeCargoId ? byId.get(activeCargoId) : null;
  const activeIsGlobal = isGlobalCargo(activeCargoId);
  const canSeeGlobal = hasGlobalCargo(cargos);
  const activeArea = activeCargoId ? getAreaForCargo(activeCargoId, cargos) : null;
  const activeAreaLabel = activeIsGlobal ? GLOBAL_NAV_ITEM.label : activeArea?.label || 'Area';
  const selectedLabel = activeCargo
    ? (activeIsGlobal ? 'KPIs' : activeCargo.id === activeArea?.id ? activeAreaLabel : getCargoDisplayName(activeCargo))
    : 'Seleccionar departamento';

  useEffect(() => {
    const loadCargos = () => cargosApi.visibles()
      .then(({ cargos: visibles }) => setCargos(visibles || []))
      .catch(() => setCargos([]));
    loadCargos();
    window.addEventListener('kpi-data-refreshed', loadCargos);
    return () => window.removeEventListener('kpi-data-refreshed', loadCargos);
  }, [user?.id]);

  useEffect(() => {
    if (open) {
      setContextOpen(false);
      setExpandedAreaId(activeIsGlobal ? null : activeArea?.id || null);
    }
  }, [open, activeIsGlobal, activeArea?.id]);

  useEffect(() => {
    if (!open && !contextOpen) return undefined;
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
      if (event.key === 'Escape') {
        setOpen(false);
        setContextOpen(false);
      }
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
  }, [open, contextOpen]);

  const go = (path, { close = true } = {}) => {
    navigate(path);
    if (close) {
      setOpen(false);
      setContextOpen(false);
    }
  };

  const goHome = () => go('/dashboard');

  const goCargo = (cargoId, { close = true } = {}) => {
    go(`/dashboard/kpis?cargoId=${cargoId}`, { close });
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  const toggleDrawer = () => {
    setOpen(!open);
    if (!open) setContextOpen(false);
  };

  const toggleContext = () => {
    setContextOpen(!contextOpen);
    if (!contextOpen) setOpen(false);
  };

  const mobileDrawer = open ? (
    <div className="mobile-nav-dialog" role="dialog" aria-modal="true" aria-label="Navegacion de areas">
      <button className="drawer-backdrop" onClick={() => setOpen(false)} aria-label="Cerrar menu" />
      <div className="mobile-drawer glass-panel">
        <div className="mobile-nav-content">
          {canSeeGlobal && (
            <button
              className={`mobile-accordion-item ${activeIsGlobal ? 'active' : ''}`}
              onClick={() => goCargo(GLOBAL_CARGO_ID)}
            >
              <span>{GLOBAL_NAV_ITEM.label}</span>
              {activeIsGlobal && <Check size={18} />}
            </button>
          )}

          {areas.map((area) => {
            const isExpanded = expandedAreaId === area.id;
            return (
              <div key={area.id} className="mobile-accordion-group">
                <button
                  className="mobile-accordion-item"
                  onClick={() => setExpandedAreaId(isExpanded ? null : area.id)}
                >
                  <span>{area.label}</span>
                  {isExpanded ? <Minus size={18} /> : <Plus size={18} />}
                </button>
                {isExpanded && (
                  <div className="mobile-accordion-body">
                    {byId.has(area.id) && (
                      <button
                        className={`mobile-accordion-child ${activeCargoId === area.id ? 'active' : ''}`}
                        onClick={() => goCargo(area.id)}
                      >
                        <span>Vista general</span>
                        {activeCargoId === area.id && <Check size={18} />}
                      </button>
                    )}
                    {cargos
                      .filter((cargo) => area.childIds.includes(cargo.id))
                      .map((cargo) => (
                        <button
                          key={cargo.id}
                          className={`mobile-accordion-child ${activeCargoId === cargo.id ? 'active' : ''}`}
                          onClick={() => goCargo(cargo.id)}
                        >
                          <span>{shortCargoName(cargo.nombre)}</span>
                          {activeCargoId === cargo.id && <Check size={18} />}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <footer className="mobile-drawer-footer-compact">
          <button className="drawer-user-compact" onClick={() => { setProfileOpen(true); setOpen(false); }}>
            <div className="avatar-small">{user?.nombre?.charAt(0) || 'U'}</div>
            <div className="user-info-compact">
              <strong>{user?.username || user?.nombre}</strong>
              <span>{user?.role === 'ADMIN' ? 'Administrador del Sistema' : user?.role}</span>
            </div>
          </button>

          {isSuperAdmin && (
            <button
              className="footer-compact-action"
              onClick={() => go('/dashboard/usuarios')}
              title="Usuarios"
            >
              Usuarios
            </button>
          )}

          <button
            className="footer-compact-action danger-text"
            onClick={handleLogout}
            disabled={loggingOut}
            title="Cerrar sesion"
          >
            <LogOut size={20} />
          </button>
        </footer>
      </div>
    </div>
  ) : null;

  return (
    <nav className="nav-mobile">
      <div className="mobile-bar">
        <button className="icon-button" onClick={toggleDrawer} aria-label={open ? 'Cerrar menu' : 'Abrir menu'}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
        <button className="brand mobile" onClick={goHome} aria-label="Ir al inicio">
          <img src="/img/01_Cuadra.webp" alt="Cuadra" />
        </button>
        <button className="avatar" onClick={() => setProfileOpen(true)}>
          {user?.nombre?.charAt(0) || 'U'}
        </button>
      </div>

      <button className="mobile-context-button glass-surface" onClick={toggleContext}>
        <div className="mobile-context-text">
          <span>{activeAreaLabel}</span>
          <strong>{selectedLabel}</strong>
        </div>
        <ChevronDown size={20} style={{ transform: contextOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {contextOpen && (
        <div className="mobile-context-wrapper">
          <div className="drawer-backdrop" onClick={() => setContextOpen(false)} />
          <div className="mobile-context-dropdown glass-panel">
            {activeIsGlobal ? (
              <>
                <button
                  className={`mobile-context-item ${activeIsGlobal ? 'active' : ''}`}
                  onClick={() => goCargo(GLOBAL_CARGO_ID)}
                >
                  <span>{GLOBAL_NAV_ITEM.label}</span>
                  {activeIsGlobal && <Check size={18} />}
                </button>

                <div className="mobile-context-divider">GERENCIAS</div>
                {areas.map(area => (
                  <button
                    key={area.id}
                    className="mobile-context-item"
                    onClick={() => goCargo(area.id)}
                  >
                    <span>{area.label}</span>
                  </button>
                ))}
              </>
            ) : (
              <>
                <div className="mobile-context-divider">VISTA GENERAL</div>
                {activeArea && byId.has(activeArea.id) && (
                  <button
                    className={`mobile-context-item ${activeCargoId === activeArea.id ? 'active' : ''}`}
                    onClick={() => goCargo(activeArea.id)}
                  >
                    <span>{activeAreaLabel}</span>
                    {activeCargoId === activeArea.id && <Check size={18} />}
                  </button>
                )}

                <div className="mobile-context-divider">JEFATURAS</div>
                {cargos
                  .filter((cargo) => activeArea?.childIds.includes(cargo.id))
                  .map((cargo) => (
                    <button
                      key={cargo.id}
                      className={`mobile-context-item ${activeCargoId === cargo.id ? 'active' : ''}`}
                      onClick={() => goCargo(cargo.id)}
                    >
                      <span>{shortCargoName(cargo.nombre)}</span>
                      {activeCargoId === cargo.id && <Check size={18} />}
                    </button>
                  ))
                }
              </>
            )}
          </div>
        </div>
      )}

      {mobileDrawer && createPortal(mobileDrawer, document.body)}
      {profileOpen && createPortal(<AccountModal user={user} onClose={() => setProfileOpen(false)} />, document.body)}
    </nav>
  );
}
