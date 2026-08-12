import {
  AREAS,
  GLOBAL_CARGO_ID,
  GLOBAL_NAV_ITEM,
  getAreaForCargo,
  getVisibleAreas,
  shortCargoName
} from '@/features/cargos/config/cargo-nav-config.js';

export default function CargoNavigation({ cargos, value, onChange }) {
  const visibleIds = new Set(cargos.map((cargo) => cargo.id));
  const byId = new Map(cargos.map((cargo) => [cargo.id, cargo]));
  const activeArea = getAreaForCargo(value) || AREAS.find((area) => visibleIds.has(area.id) || area.childIds.some((id) => visibleIds.has(id)));
  const areas = getVisibleAreas(cargos);
  const canSeeGlobal = visibleIds.has(GLOBAL_CARGO_ID);

  const visibleChildren = activeArea
    ? activeArea.childIds.map((id) => byId.get(id)).filter(Boolean)
    : [];

  const selectArea = (area) => {
    if (visibleIds.has(area.id)) {
      onChange(area.id);
      return;
    }
    const firstChild = area.childIds.find((id) => visibleIds.has(id));
    if (firstChild) onChange(firstChild);
  };

  return (
    <div className="cargo-nav" aria-label="Navegacion por cargos">
      {canSeeGlobal && (
        <div className="cargo-nav-global">
          <button
            className={value === GLOBAL_CARGO_ID ? 'active' : ''}
            onClick={() => onChange(GLOBAL_CARGO_ID)}
          >
            {GLOBAL_NAV_ITEM.label}
          </button>
        </div>
      )}
      <div className="cargo-nav-primary">
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
        <div className="cargo-nav-secondary">
          {visibleChildren.map((cargo) => (
            <button
              key={cargo.id}
              className={value === cargo.id ? 'active' : ''}
              onClick={() => onChange(cargo.id)}
            >
              {shortCargoName(cargo.nombre)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
