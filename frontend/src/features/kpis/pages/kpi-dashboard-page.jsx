import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cargosApi } from '@/features/cargos/api/cargos-api';
import { dashboardApi } from '@/features/dashboard/api/dashboard-api';
import { kpisApi } from '@/features/kpis/api/kpis-api';
import { kpiSyncApi } from '@/features/kpis/api/kpi-sync-api';
import { GLOBAL_CARGO_ID } from '@/features/cargos/config/cargo-nav-config.js';
import PeriodSelector from '../components/period-selector.jsx';
import KpiTable from '../components/kpi-table.jsx';
import { PERIODOS } from '@/config/periodos';

// ─── Skeleton primitives ─────────────────────────────────────────────────────
function SkeletonBlock({ width = '100%', height = '16px', radius = '4px', style = {} }) {
  return (
    <div
      className="skeleton-block"
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}

function KpiTableSkeleton({ rows = 8 }) {
  return (
    <div className="kpi-table-wrap kpi-table-skeleton" aria-busy="true" aria-label="Cargando tabla KPI">
      <table className="kpi-table">
        <thead>
          <tr>
            <th>vK</th>
            <th>KPI ( FACTORES / INICIATIVAS DE EXITO )</th>
            <th>RESULTADO</th>
            <th>OBJETIVO</th>
            <th>VALOR REAL</th>
            <th>CALIFICACION</th>
            <th>TENDENCIA</th>
            <th>PARAMETROS</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td className="center weight"><SkeletonBlock width="32px" height="14px" style={{ margin: '0 auto' }} /></td>
              <td><SkeletonBlock width={`${60 + (i % 3) * 18}%`} height="14px" /></td>
              <td className="center"><SkeletonBlock width="60px" height="14px" style={{ margin: '0 auto' }} /></td>
              <td className="center"><SkeletonBlock width="60px" height="14px" style={{ margin: '0 auto' }} /></td>
              <td className="center"><SkeletonBlock width="70px" height="22px" style={{ margin: '0 auto' }} /></td>
              <td className="center"><SkeletonBlock width="52px" height="30px" style={{ margin: '0 auto' }} /></td>
              <td className="center"><SkeletonBlock width="32px" height="32px" radius="999px" style={{ margin: '0 auto' }} /></td>
              <td><SkeletonBlock width="80%" height="14px" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KpiMobileSkeleton({ rows = 5 }) {
  return (
    <section className="kpi-mobile-list" aria-busy="true" aria-label="Cargando KPIs">
      {Array.from({ length: rows }).map((_, i) => (
        <article key={i} className="kpi-mobile-row glass-card skeleton-card">
          <header className="kpi-mobile-card-head">
            <SkeletonBlock width="32px" height="22px" radius="999px" />
            <SkeletonBlock width={`${50 + (i % 3) * 15}%`} height="16px" />
            <SkeletonBlock width="32px" height="32px" radius="999px" />
          </header>
          <div className="kpi-mobile-metric-band">
            <SkeletonBlock width="100%" height="44px" radius="8px" />
            <SkeletonBlock width="100%" height="44px" radius="8px" />
            <SkeletonBlock width="100%" height="44px" radius="8px" />
          </div>
        </article>
      ))}
    </section>
  );
}

function KpiHeadingSkeleton() {
  return (
    <div className="kpi-heading glass-panel" aria-busy="true">
      <div>
        <SkeletonBlock width="120px" height="11px" style={{ marginBottom: '8px' }} />
        <SkeletonBlock width="220px" height="34px" />
      </div>
      <div className="kpi-heading-actions">
        <SkeletonBlock width="160px" height="34px" radius="8px" />
        <SkeletonBlock width="120px" height="38px" radius="8px" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="kpi-empty-state">
      <div className="kpi-empty-icon" aria-hidden="true">📋</div>
      <strong>Sin datos disponibles</strong>
      <p>No existen KPI para el período seleccionado.</p>
    </div>
  );
}

const MOBILE_MEDIA_QUERY = '(max-width: 1023px)';

export default function KpiDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cargos, setCargos] = useState([]);
  const [cargoId, setCargoId] = useState(null);
  const [anio, setAnio] = useState(null);
  const [anios, setAnios] = useState([]);
  const [periodo, setPeriodo] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [rows, setRows] = useState([]);
  // initialLoading = true only on first mount (skeleton full page)
  const [initialLoading, setInitialLoading] = useState(true);
  // refreshing = true when data already visible but we're re-fetching (soft overlay)
  const [refreshing, setRefreshing] = useState(false);
  const [cargosLoading, setCargosLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_MEDIA_QUERY).matches);
  const [showScrollShortcut, setShowScrollShortcut] = useState(false);
  const requestedCargoId = Number(searchParams.get('cargoId')) || null;
  // Track whether we've ever successfully loaded KPI data
  const hasDataRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MEDIA_QUERY);
    const update = () => setIsMobile(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setShowScrollShortcut(false);
      return undefined;
    }

    let rafId = 0;
    const update = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        const doc = document.documentElement;
        const scrollTop = window.scrollY || doc.scrollTop || 0;
        const maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
        const visible = maxScroll > 520 && scrollTop > 280;
        setShowScrollShortcut((current) => (current === visible ? current : visible));
      });
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [isMobile, rows.length, refreshing, anio, periodo, cargoId]);

  // ── Load visible cargos ────────────────────────────────────────────────────
  useEffect(() => {
    setCargosLoading(true);
    cargosApi.visibles()
      .then(({ cargos: visibles }) => {
        const list = visibles || [];
        setCargos(list);
        const visibleIds = new Set(list.map((cargo) => cargo.id));
        const currentCargoId = cargoId && visibleIds.has(cargoId) ? cargoId : null;
        const initialCargoId = currentCargoId
          || (requestedCargoId && visibleIds.has(requestedCargoId)
            ? requestedCargoId
            : list.find((cargo) => cargo.id === GLOBAL_CARGO_ID)?.id ?? list[0]?.id ?? null);
        setCargoId(initialCargoId);
        if (initialCargoId && initialCargoId !== requestedCargoId) {
          setSearchParams({ cargoId: String(initialCargoId) }, { replace: true });
        }
        // If no cargos, stop all loading immediately
        if (!list.length) {
          setInitialLoading(false);
          setRefreshing(false);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'No se pudieron cargar cargos');
        setInitialLoading(false);
        setRefreshing(false);
      })
      .finally(() => setCargosLoading(false));
  }, [reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync requestedCargoId → cargoId when user navigates via header ─────────
  useEffect(() => {
    if (!cargos.length || !requestedCargoId) return;
    const visibleIds = new Set(cargos.map((cargo) => cargo.id));
    if (visibleIds.has(requestedCargoId) && requestedCargoId !== cargoId) {
      setCargoId(requestedCargoId);
    }
  }, [requestedCargoId, cargos, cargoId]);

  // ── Load available years for current cargo ─────────────────────────────────
  useEffect(() => {
    if (!cargoId) return;
    kpisApi.anios({ cargoId })
      .then(({ anios: disponibles }) => {
        const list = disponibles || [];
        setAnios(list);
        setAnio((current) => (current && list.includes(current) ? current : list[0] ?? null));
        // If no years, stop loading
        if (!list.length) {
          setInitialLoading(false);
          setRefreshing(false);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'No se pudieron cargar años');
        setInitialLoading(false);
        setRefreshing(false);
      });
  }, [cargoId, reloadKey]);

  // ── Load KPI data ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!cargoId || !anio) return;

    // Decide: first time load (skeleton) or soft refresh (overlay)
    if (hasDataRef.current) {
      setRefreshing(true);
    } else {
      setInitialLoading(true);
    }

    Promise.all([
      dashboardApi.resumen({ cargoId, anio, periodo: periodo || 1 }),
      kpisApi.list({ cargoId, anio, periodo: periodo || 1 })
    ])
      .then(([resumenData, kpisData]) => {
        const disponibles = resumenData.resumen.periodosDisponibles || [];
        const requestedPeriodo = periodo || disponibles[0];
        const nextPeriodo = disponibles.includes(requestedPeriodo) ? requestedPeriodo : disponibles[0];
        setResumen(resumenData.resumen);
        setRows(nextPeriodo === requestedPeriodo ? (kpisData.rows || []) : []);
        if (nextPeriodo && nextPeriodo !== periodo) setPeriodo(nextPeriodo);
        setError('');
        hasDataRef.current = true;
      })
      .catch((err) => setError(err.response?.data?.message || 'No se pudieron cargar KPIs'))
      .finally(() => {
        setInitialLoading(false);
        setRefreshing(false);
      });
  }, [cargoId, anio, periodo, reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setSyncMessage('Actualizando...');
    try {
      const result = await kpiSyncApi.run();
      if (result.status === 'NO_CHANGES' || result.cached) {
        setSyncMessage('Ya tienes los resultados mas recientes');
      } else if (result.status === 'IMPORTED' || result.status === 'SKIPPED_DUPLICATE') {
        setSyncMessage('Resultados actualizados');
      } else if (result.status === 'SKIPPED_RUNNING' || result.reused) {
        setSyncMessage('Actualizacion en curso; se reutilizo el resultado');
      } else {
        setSyncMessage(result.message || 'Resultados actualizados');
      }
      window.dispatchEvent(new Event('kpi-data-refreshed'));
      setReloadKey((current) => current + 1);
    } catch {
      setSyncMessage('No se pudo actualizar. Se mantienen los ultimos resultados disponibles.');
    } finally {
      setSyncing(false);
    }
  };

  const periodoLabel = useMemo(() => PERIODOS.find((item) => item.id === periodo)?.label || periodo, [periodo]);
  const total = resumen?.calificacionGeneralRaw?.replace(/\u2003/g, ' ').trim() || '--';
  const isGlobalDashboard = resumen?.cargo?.id === GLOBAL_CARGO_ID;
  const cargoNombre = isGlobalDashboard ? 'MBC' : resumen?.cargo?.nombre || '';
  const hasVisibleRows = rows.length > 0 || refreshing;
  const renderSummaryFooter = (className = '') => {
    if (!hasVisibleRows) return null;
    return (
      <div className={`summary-footer ${className}`.trim()}>
        <span>{resumen?.sumaValorRaw || '--'}</span>
        <strong>TOTAL</strong>
        <span>{resumen?.sumaCalificacionRaw || '--'}</span>
      </div>
    );
  };
  const handleScrollShortcut = (direction) => {
    const doc = document.documentElement;
    const target = direction === 'up' ? 0 : doc.scrollHeight;
    window.scrollTo({ top: target, behavior: 'smooth' });
  };

  // ── Full page skeleton (first load before any data) ────────────────────────
  if (initialLoading || cargosLoading) {
    return (
      <section className="dashboard-page" aria-busy="true" aria-label="Cargando dashboard">
        <div className="control-panel glass-panel skeleton-panel">
          <SkeletonBlock width="118px" height="34px" radius="6px" />
          <SkeletonBlock width="100%" height="34px" radius="6px" />
        </div>
        <KpiHeadingSkeleton />
        {isMobile ? <KpiMobileSkeleton rows={5} /> : <KpiTableSkeleton rows={8} />}
        <div className="summary-footer skeleton-footer">
          <SkeletonBlock width="80px" height="22px" style={{ margin: '0 auto' }} />
          <SkeletonBlock width="60px" height="14px" style={{ margin: '0 auto' }} />
          <SkeletonBlock width="80px" height="22px" style={{ margin: '0 auto' }} />
        </div>
      </section>
    );
  }

  // ── No cargo available (MBC root or similar) ───────────────────────────────
  if (!cargoId && !cargosLoading) {
    return (
      <section className="dashboard-page">
        {error && <div className="alert-error">{error}</div>}
        <EmptyState />
      </section>
    );
  }

  return (
    <section className={`dashboard-page ${refreshing ? 'is-refreshing' : ''}`}>
      <div className="control-panel glass-panel">
        <label className="year-select glass-control">
          <span>Año</span>
          <select value={anio || ''} onChange={(event) => setAnio(Number(event.target.value))}>
            {anios.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
        <div className="period-control-group">
          <PeriodSelector selected={periodo} available={resumen?.periodosDisponibles || []} onChange={setPeriodo} />
        </div>
      </div>

      <div className="kpi-heading glass-panel">
        <div>
          <span className="kpi-period-context">{periodoLabel} {anio || ''}</span>
          <h2>{cargoNombre || 'KPIs'}</h2>
        </div>
        <div className="kpi-heading-actions">
          <button className="kpi-sync-button glass-control" onClick={handleManualSync} disabled={syncing}>
            <RefreshCw size={15} className={syncing ? 'spin' : ''} />
            {syncing ? 'Actualizando...' : 'Actualizar resultados'}
          </button>
          {syncMessage && <small className="kpi-sync-message">{syncMessage}</small>}
          {(rows.length > 0 || refreshing) && (
            <strong className="kpi-total-pill">
              <span>Total</span>
              {refreshing ? <span className="kpi-total-refreshing">···</span> : total}
            </strong>
          )}
        </div>
      </div>

      {error && <div className="alert-error" style={{ margin: '12px 14px 0' }}>{error}</div>}

      {/* Soft refresh indicator */}
      {refreshing && (
        <div className="kpi-refresh-banner" role="status" aria-live="polite">
          <RefreshCw size={13} className="spin" />
          Actualizando...
        </div>
      )}

      {renderSummaryFooter('summary-footer-mobile-top')}

      {/* Table / skeleton / empty */}
      {refreshing
        ? (isMobile ? <KpiMobileSkeleton rows={Math.max(rows.length, 5)} /> : <KpiTableSkeleton rows={Math.max(rows.length, 8)} />)
        : rows.length > 0
          ? <KpiTable rows={rows} />
          : !error && <EmptyState />
      }

      {renderSummaryFooter('summary-footer-desktop-bottom')}

      {showScrollShortcut && (
        <div className="kpi-scroll-fab-group" aria-label="Navegacion rapida">
          <button
            type="button"
            className="kpi-scroll-fab"
            onClick={() => handleScrollShortcut('up')}
            aria-label="Volver arriba"
          >
            <ChevronUp size={18} />
          </button>
          <button
            type="button"
            className="kpi-scroll-fab"
            onClick={() => handleScrollShortcut('down')}
            aria-label="Ir hasta abajo"
          >
            <ChevronDown size={18} />
          </button>
        </div>
      )}
    </section>
  );
}
