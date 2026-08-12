import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { cargosApi } from '@/features/cargos/api/cargos-api';
import { dashboardApi } from '@/features/dashboard/api/dashboard-api';
import { kpisApi } from '@/features/kpis/api/kpis-api';
import { GLOBAL_CARGO_ID } from '@/features/cargos/config/cargo-nav-config.js';
import PeriodSelector from '../components/period-selector.jsx';
import KpiTable from '../components/kpi-table.jsx';
import { PERIODOS } from '@/config/periodos';

export default function KpiDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cargos, setCargos] = useState([]);
  const [cargoId, setCargoId] = useState(null);
  const [anio, setAnio] = useState(null);
  const [anios, setAnios] = useState([]);
  const [periodo, setPeriodo] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestedCargoId = Number(searchParams.get('cargoId')) || null;

  useEffect(() => {
    cargosApi.visibles()
      .then(({ cargos: visibles }) => {
        setCargos(visibles);
        const visibleIds = new Set(visibles.map((cargo) => cargo.id));
        const initialCargoId = requestedCargoId && visibleIds.has(requestedCargoId)
          ? requestedCargoId
          : visibles.find((cargo) => cargo.id === GLOBAL_CARGO_ID)?.id ?? visibles.find((cargo) => cargo.id === 302)?.id ?? visibles[0]?.id ?? null;
        setCargoId(initialCargoId);
        if (initialCargoId && initialCargoId !== requestedCargoId) {
          setSearchParams({ cargoId: String(initialCargoId) }, { replace: true });
        }
      })
      .catch((err) => setError(err.response?.data?.message || 'No se pudieron cargar cargos'));
  }, []);

  useEffect(() => {
    if (!cargos.length || !requestedCargoId) return;
    const visibleIds = new Set(cargos.map((cargo) => cargo.id));
    if (visibleIds.has(requestedCargoId) && requestedCargoId !== cargoId) {
      setCargoId(requestedCargoId);
    }
  }, [requestedCargoId, cargos, cargoId]);

  useEffect(() => {
    if (!cargoId) return;
    kpisApi.anios({ cargoId })
      .then(({ anios: disponibles }) => {
        setAnios(disponibles || []);
        setAnio((current) => (current && disponibles?.includes(current) ? current : disponibles?.[0] ?? null));
      })
      .catch((err) => setError(err.response?.data?.message || 'No se pudieron cargar años'));
  }, [cargoId]);

  useEffect(() => {
    if (!cargoId || !anio) return;
    setLoading(true);
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
      })
      .catch((err) => setError(err.response?.data?.message || 'No se pudieron cargar KPIs'))
      .finally(() => setLoading(false));
  }, [cargoId, anio, periodo]);

  const periodoLabel = useMemo(() => PERIODOS.find((item) => item.id === periodo)?.label || periodo, [periodo]);
  const total = resumen?.calificacionGeneralRaw?.replace(/\u2003/g, ' ').trim() || '--';
  const isGlobalDashboard = resumen?.cargo?.id === GLOBAL_CARGO_ID;
  return (
    <section className="dashboard-page">
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
          <h2>{isGlobalDashboard ? 'MBC' : resumen?.cargo?.nombre || 'KPIs'}</h2>
        </div>
        <strong className="kpi-total-pill">
          <span>Total</span>
          {total}
        </strong>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {loading ? <div className="content-loader">Cargando KPIs...</div> : <KpiTable rows={rows} />}
      <div className="summary-footer">
        <span>{resumen?.sumaValorRaw || '--'}</span>
        <strong>TOTAL</strong>
        <span>{resumen?.sumaCalificacionRaw || '--'}</span>
      </div>
    </section>
  );
}
