import { KeyRound, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/features/auth/api/auth-api';
import { useAuthStore } from '@/stores/auth-store';

const getMessage = (error, fallback) => error?.response?.data?.message || fallback;

export default function AccountModal({ user, onClose }) {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setSuccess('Contraseña actualizada. Inicia sesión nuevamente.');
      window.setTimeout(() => {
        setUser(null);
        navigate('/login', { replace: true });
      }, 900);
    } catch (err) {
      setError(getMessage(err, 'No se pudo cambiar la contraseña.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-modal-backdrop" role="presentation">
      <section className="account-modal glass-panel" role="dialog" aria-modal="true" aria-label="Mi cuenta">
        <header>
          <div>
            <span>Mi cuenta</span>
            <h2>{user?.username || user?.nombre}</h2>
          </div>
          <button className="users-icon-button" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>
        <div className="account-profile">
          <div><span>Usuario</span><strong>{user?.username || ''}</strong></div>
          <div><span>Puesto</span><strong>{user?.cargo?.nombre || user?.nombre}</strong></div>
          <div><span>Rol</span><strong>{user?.role}</strong></div>
        </div>
        <form className="account-password-form" onSubmit={submit}>
          <div className="account-form-title">
            <KeyRound size={16} />
            <span>Cambiar contraseña</span>
          </div>
          <label className="users-field">
            <span>Contraseña actual</span>
            <input value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} type="password" autoComplete="current-password" />
          </label>
          <label className="users-field">
            <span>Nueva contraseña</span>
            <input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" autoComplete="new-password" />
          </label>
          <label className="users-field">
            <span>Confirmar nueva contraseña</span>
            <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" />
          </label>
          {error && <p className="form-error">{error}</p>}
          {success && <p className="account-success">{success}</p>}
          <div className="users-modal-actions">
            <button type="button" className="users-button ghost" onClick={onClose}>Cancelar</button>
            <button className="users-button primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar contraseña'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
