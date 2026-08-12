import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="state-page">
      <h1>Pagina no encontrada</h1>
      <Link to="/dashboard">Volver</Link>
    </main>
  );
}
