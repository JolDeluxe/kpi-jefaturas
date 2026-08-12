export const GLOBAL_CARGO_ID = 1;

export const GLOBAL_NAV_ITEM = {
  id: GLOBAL_CARGO_ID,
  label: 'MBC'
};

export const AREAS = [
  { id: 100, label: 'DIRECCION', childIds: [101, 102, 103, 104] },
  { id: 200, label: 'ADMINISTRACION', childIds: [201] },
  { id: 300, label: 'OPERACIONES', childIds: [301, 302, 303, 304, 305, 306, 307, 308, 309] },
  { id: 400, label: 'CAPITAL HUMANO', childIds: [401, 402] }
];

export const shortCargoName = (nombre = '') => nombre
  .replace(/^GERENCIA DE\s+/i, '')
  .replace(/^GERENCIA\s+/i, '')
  .replace(/^JEFATURA DE\s+/i, '')
  .replace(/^JEFATURA\s+/i, '')
  .replace(/LOGISTICA/i, 'LOGISTICA')
  .trim();

export const getVisibleAreas = (cargos) => {
  const visibleIds = new Set(cargos.map((cargo) => cargo.id));
  return AREAS
    .map((area) => ({
      ...area,
      visible: visibleIds.has(area.id) || area.childIds.some((id) => visibleIds.has(id))
    }))
    .filter((area) => area.visible);
};

export const isGlobalCargo = (cargoId) => Number(cargoId) === GLOBAL_CARGO_ID;

export const hasGlobalCargo = (cargos) => cargos.some((cargo) => cargo.id === GLOBAL_CARGO_ID);

export const getCargoDisplayName = (cargo) => {
  if (!cargo) return '';
  return isGlobalCargo(cargo.id) ? GLOBAL_NAV_ITEM.label : shortCargoName(cargo.nombre);
};

export const getAreaForCargo = (cargoId) => {
  if (isGlobalCargo(cargoId)) return null;
  return AREAS.find((area) => area.id === cargoId || area.childIds.includes(cargoId));
};
