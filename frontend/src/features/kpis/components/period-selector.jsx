import { PERIODOS } from '@/config/periodos';

const mobileLabel = (periodo) => {
  if (periodo.id >= 13 && periodo.id <= 16) return `T${periodo.id - 12}`;
  if (periodo.id === 19) return 'ACUM';
  return periodo.label;
};

const periodGroupClass = (periodoId) => {
  if (periodoId <= 12) return 'month';
  if (periodoId === 19) return 'accumulated';
  if (periodoId >= 13 && periodoId <= 16) return 'quarter';
  return 'semester';
};

const months = PERIODOS.filter((periodo) => periodo.id <= 12);
const quarters = PERIODOS.filter((periodo) => periodo.id >= 13 && periodo.id <= 16);
const semesters = PERIODOS.filter((periodo) => periodo.id >= 17 && periodo.id <= 18);

const selectValue = (selected, group) => group.some((periodo) => periodo.id === selected) ? selected : '';

const handleSelect = (event, onChange) => {
  if (!event.target.value) return;
  onChange(Number(event.target.value));
};

function PeriodSelect({ label, selected, availableSet, options, onChange }) {
  const enabledOptions = options.filter((periodo) => availableSet.has(periodo.id));
  return (
    <label className={`period-select-field glass-control ${enabledOptions.length ? '' : 'disabled'}`.trim()}>
      <span>{label}</span>
      <select
        value={selectValue(selected, enabledOptions)}
        onChange={(event) => handleSelect(event, onChange)}
        disabled={!enabledOptions.length}
      >
        <option value="">Elegir</option>
        {options.map((periodo) => (
          <option key={periodo.id} value={periodo.id} disabled={!availableSet.has(periodo.id)}>
            {mobileLabel(periodo)}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function PeriodSelector({ selected, available, onChange }) {
  const availableSet = new Set(available);
  return (
    <>
      <div className="period-strip" aria-label="Selector de periodo">
        {PERIODOS.map((periodo) => {
          const enabled = availableSet.has(periodo.id);
          return (
            <button
              key={periodo.id}
              className={`period-${periodo.id} period-${periodGroupClass(periodo.id)} ${selected === periodo.id ? 'active' : ''}`.trim()}
              disabled={!enabled}
              onClick={() => onChange(periodo.id)}
            >
              <span className="period-label-desktop">{periodo.label}</span>
              <span className="period-label-mobile">{mobileLabel(periodo)}</span>
            </button>
          );
        })}
      </div>
      <div className="period-selectors-mobile" aria-label="Selector de periodo mobile">
        <div className="period-selectors-grid">
          <PeriodSelect label="Mes" selected={selected} availableSet={availableSet} options={months} onChange={onChange} />
          <PeriodSelect label="Trim." selected={selected} availableSet={availableSet} options={quarters} onChange={onChange} />
          <PeriodSelect label="Sem." selected={selected} availableSet={availableSet} options={semesters} onChange={onChange} />
        </div>
        <button
          className={`period-accumulated-mobile glass-control ${selected === 19 ? 'active' : ''}`.trim()}
          disabled={!availableSet.has(19)}
          onClick={() => onChange(19)}
        >
          ACUMULADO
        </button>
      </div>
    </>
  );
}
