export const GLOBAL_CARGO_ID = 1;

export const GLOBAL_NAV_ITEM = {
  id: GLOBAL_CARGO_ID,
  label: 'MBC'
};

export const shortCargoName = (nombre = '') => nombre
  .replace(/^GERENCIA DE\s+/i, '')
  .replace(/^GERENCIA\s+/i, '')
  .replace(/^JEFATURA DE\s+/i, '')
  .replace(/^JEFATURA\s+/i, '')
  .replace(/LOGISTICA/i, 'LOGISTICA')
  .trim();

export const getVisibleAreas = (cargos = []) => {
  const byId = new Map(cargos.map((cargo) => [cargo.id, cargo]));
  const childrenByParent = new Map();

  cargos.forEach((cargo) => {
    if (!cargo.parentId || cargo.parentId === GLOBAL_CARGO_ID) return;
    if (!childrenByParent.has(cargo.parentId)) childrenByParent.set(cargo.parentId, []);
    childrenByParent.get(cargo.parentId).push(cargo.id);
  });

  return cargos
    .filter((cargo) => {
      if (isGlobalCargo(cargo.id)) return false;
      if (cargo.parentId === GLOBAL_CARGO_ID || cargo.parentId == null) return true;
      return !byId.has(cargo.parentId);
    })
    .map((cargo) => ({
      id: cargo.id,
      label: shortCargoName(cargo.nombre).toUpperCase(),
      childIds: (childrenByParent.get(cargo.id) || []).sort((a, b) => a - b)
    }))
    .sort((a, b) => a.id - b.id);
};

export const isGlobalCargo = (cargoId) => Number(cargoId) === GLOBAL_CARGO_ID;

export const hasGlobalCargo = (cargos) => cargos.some((cargo) => cargo.id === GLOBAL_CARGO_ID);

export const getCargoDisplayName = (cargo) => {
  if (!cargo) return '';
  return isGlobalCargo(cargo.id) ? GLOBAL_NAV_ITEM.label : shortCargoName(cargo.nombre);
};

export const getAreaForCargo = (cargoId, cargos = []) => {
  if (isGlobalCargo(cargoId)) return null;
  const areas = getVisibleAreas(cargos);
  return areas.find((area) => area.id === cargoId || area.childIds.includes(cargoId)) || null;
};
