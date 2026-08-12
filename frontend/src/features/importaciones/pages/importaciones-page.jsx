import { useEffect, useState } from 'react';
import { importacionesApi } from '../api/importaciones-api';

export default function ImportacionesPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    importacionesApi.list()
      .then(({ importaciones }) => setItems(importaciones || []))
      .catch((err) => setError(err.response?.data?.message || 'No se pudieron cargar importaciones'));
  }, []);

  return (
    <section className="dashboard-page">
      <div className="kpi-heading">
        <h1>Importaciones</h1>
      </div>
      {error && <div className="alert-error">{error}</div>}
      <div className="kpi-table-wrap">
        <table className="kpi-table">
          <thead><tr><th>Fecha</th><th>Archivo</th><th>Estado</th><th>Filas</th><th>SHA-256</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td>{item.filename}</td>
                <td className="center">{item.status}</td>
                <td className="center">{item.rowCount}</td>
                <td>{item.sha256}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
