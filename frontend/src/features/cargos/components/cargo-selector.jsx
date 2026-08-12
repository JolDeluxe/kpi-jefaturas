export default function CargoSelector({ cargos, value, onChange }) {
  if (cargos.length <= 1) {
    return <div className="single-cargo">{cargos[0]?.nombre || 'Sin cargo disponible'}</div>;
  }

  return (
    <label className="cargo-selector">
      <span>Cargo</span>
      <select value={value || ''} onChange={(event) => onChange(Number(event.target.value))}>
        {cargos.map((cargo) => (
          <option key={cargo.id} value={cargo.id}>
            {cargo.id} - {cargo.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}
