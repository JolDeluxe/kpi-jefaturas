import { Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import SafeMultilineText from '@/features/common/components/safe-multiline-text.jsx';
import { isKpiWithoutData } from '../utils/kpi-empty-state.js';
import { mapTendencia } from '../utils/tendencia-map';

const MOBILE_MEDIA_QUERY = '(max-width: 1023px)';

const dash = (value) => {
  const clean = String(value ?? '').replace(/\u2003/g, ' ').trim();
  return clean === '--' ? '' : clean;
};

const inlineValue = (value) => dash(value).replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim();

const textSizeClass = (value, base) => {
  const length = inlineValue(value).length;
  if (length > 86) return `${base}-xs`;
  if (length > 58) return `${base}-sm`;
  return '';
};

const metricSizeClass = (value) => {
  const length = inlineValue(value).length;
  if (length > 42) return 'metric-text-xs';
  if (length > 24) return 'metric-text-sm';
  return '';
};

const valueTone = (value) => {
  const clean = dash(value);
  if (!clean || clean.toUpperCase() === 'NA') return 'neutral';
  const number = Number(clean.replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(number)) return 'neutral';
  if (number >= 95) return 'good';
  if (number > 0) return 'warning';
  return 'bad';
};

export default function KpiTable({ rows }) {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_MEDIA_QUERY).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  if (isMobile) return <KpiMobileRows rows={rows} />;
  return <KpiDesktopTable rows={rows} />;
}

function KpiDesktopTable({ rows }) {
  return (
    <div className="kpi-table-wrap">
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
            {rows.map((row) => {
              const tendencia = mapTendencia(row.tendenciaRaw);
              const unavailable = isKpiWithoutData(row);
              const critical = tendencia.tone === 'bad' && !unavailable;
              const realTone = unavailable ? 'neutral' : valueTone(row.valorRealRaw);
              return (
                <tr key={row.id} className={`${critical ? 'critical' : ''} ${unavailable ? 'no-data' : ''}`.trim()}>
                  <td className="center weight"><SafeMultilineText value={dash(row.valorRaw)} /></td>
                  <td className={`kpi-name ${textSizeClass(row.kpi.nombre, 'kpi-name')}`.trim()}>
                    <SafeMultilineText value={row.kpi.nombre} />
                  </td>
                  <td className="center"><SafeMultilineText value={dash(row.resultadoRaw)} /></td>
                  <td className="center"><SafeMultilineText value={dash(row.objetivoRaw)} /></td>
                  <td className={`center value-real ${realTone}`}><SafeMultilineText value={dash(row.valorRealRaw)} /></td>
                  <td className="center score"><SafeMultilineText value={dash(row.calificacionRaw)} /></td>
                  <td className="center"><TrendIcon tendencia={tendencia} hidden={unavailable} /></td>
                  <td className="params"><SafeMultilineText value={dash(row.parametrosRaw)} /></td>
                </tr>
              );
            })}
          </tbody>
      </table>
    </div>
  );
}

function KpiMobileRows({ rows }) {
  return (
    <section className="kpi-mobile-list" aria-label="KPIs">
      {rows.map((row) => {
        const tendencia = mapTendencia(row.tendenciaRaw);
        const unavailable = isKpiWithoutData(row);
        const realTone = unavailable ? 'neutral' : valueTone(row.valorRealRaw);
        const title = inlineValue(row.kpi.nombre);
        const resultado = inlineValue(row.resultadoRaw);
        const objetivo = inlineValue(row.objetivoRaw);
        const valorReal = inlineValue(row.valorRealRaw);
        const parametros = inlineValue(row.parametrosRaw);
        const parametrosMultiline = dash(row.parametrosRaw);
        return (
          <article key={row.id} className={`kpi-mobile-row glass-card ${unavailable ? 'no-data' : ''} ${tendencia.tone === 'bad' && !unavailable ? 'critical' : ''}`}>
            <header className="kpi-mobile-card-head">
              <span className="kpi-mobile-weight glass-pill">{inlineValue(row.valorRaw)}</span>
              <strong className={textSizeClass(title, 'kpi-title')}>{title}</strong>
              <TrendIcon tendencia={tendencia} hidden={unavailable} />
            </header>
            <div className="kpi-mobile-metric-band" aria-label="Datos del KPI">
              <div className={`kpi-mobile-metric glass-control ${resultado ? '' : 'empty'} ${metricSizeClass(resultado)}`.trim()}>
                <span>Resultado</span>
                <strong>{resultado}</strong>
              </div>
              <div className={`kpi-mobile-metric glass-control ${objetivo ? '' : 'empty'} ${metricSizeClass(objetivo)}`.trim()}>
                <span>Objetivo</span>
                <strong>{objetivo}</strong>
              </div>
              <div className={`kpi-mobile-metric glass-control ${valorReal ? '' : 'empty'} ${metricSizeClass(valorReal)}`.trim()}>
                <span>Valor real</span>
                <strong className={`value-real ${realTone}`}>{valorReal}</strong>
              </div>
              <div className={`kpi-mobile-metric params glass-control ${parametros ? '' : 'empty'} ${metricSizeClass(parametros)}`.trim()}>
                <span>Parametros</span>
                <strong className="mobile-params-cell"><SafeMultilineText value={parametrosMultiline} /></strong>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function TrendIcon({ tendencia, hidden = false }) {
  if (hidden || tendencia.raw === '0' || tendencia.raw === '') return null;
  return (
    <span
      className={`trend trend-${tendencia.kind}`}
      title={`Tendencia ${tendencia.raw || 'NA'}: ${tendencia.label}`}
      role="img"
      aria-label={`Tendencia ${tendencia.raw || 'NA'}: ${tendencia.label}`}
    >
      {tendencia.icon === 'up' && <ChevronUp size={22} strokeWidth={4} />}
      {tendencia.icon === 'down' && <ChevronDown size={22} strokeWidth={4} />}
      {tendencia.icon === 'check' && <Check size={21} strokeWidth={4} />}
      {tendencia.icon === 'x' && <X size={21} strokeWidth={4} />}
    </span>
  );
}
