import { useEffect, useState } from 'react';
import { usersApi } from '../api/users-api';

export default function UsersPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    usersApi.list()
      .then(({ usuarios: rows }) => setUsuarios(rows || []))
      .catch((err) => setError(err.response?.data?.message || 'No se pudieron cargar usuarios'));
  }, []);

  return (
    <section className="dashboard-page">
      <div className="kpi-heading">
        <h1>Usuarios</h1>
      </div>
      {error && <div className="alert-error">{error}</div>}
      <div className="kpi-table-wrap">
        <table className="kpi-table">
          <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Cargo</th><th>Activo</th></tr></thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td>{usuario.nombre}</td>
                <td>{usuario.email}</td>
                <td className="center">{usuario.role}</td>
                <td>{usuario.cargo ? `${usuario.cargo.id} - ${usuario.cargo.nombre}` : '--'}</td>
                <td className="center">{usuario.activo ? 'SI' : 'NO'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
