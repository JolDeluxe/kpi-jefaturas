export const mapTendencia = (raw) => {
  const code = String(raw ?? '').trim();
  const map = {
    '0': { raw: code, label: 'NA', tone: 'neutral', kind: 'neutral', icon: 'none' },
    '1': { raw: code, label: 'Sube', tone: 'good', kind: 'green-up', icon: 'up' },
    '2': { raw: code, label: 'Baja', tone: 'good', kind: 'green-down', icon: 'down' },
    '3': { raw: code, label: 'Sin cambio', tone: 'warning', kind: 'amber', icon: 'none' },
    '4': { raw: code, label: 'Critica', tone: 'bad', kind: 'red-up', icon: 'up' },
    '5': { raw: code, label: 'Critica', tone: 'bad', kind: 'red-up', icon: 'up' },
    '6': { raw: code, label: 'Resultado logrado', tone: 'success', kind: 'green-check', icon: 'check' },
    '7': { raw: code, label: 'Resultado no logrado', tone: 'danger', kind: 'red-x', icon: 'x' }
  };
  return map[code] || { raw: code, label: code || 'NA', tone: 'neutral', kind: 'neutral', icon: 'none' };
};
