import {
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  Pencil,
  Power,
  PowerOff,
  Search,
  ShieldCheck,
  Trash2,
  X
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { usersApi } from '../api/users-api';

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' }
];

const ROLE_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'DIRECCION', label: 'Direccion' },
  { value: 'GERENTE', label: 'Gerencia' },
  { value: 'JEFE', label: 'Jefatura' }
];

const HIDDEN_PASSWORD = '••••••••••';
const PASSWORD_VISIBLE_MS = 120000;

const getMessage = (error, fallback) => error?.response?.data?.message || fallback;

const isSystemAdminUser = (usuario) => usuario?.role === 'ADMIN' && usuario?.cargoId == null;

function CredentialModal({ modal, onClose, onSubmit, busy }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  const title = {
    password: 'Editar contraseña',
    deactivate: 'Desactivar cuenta',
    activate: 'Activar cuenta',
    delete: 'Eliminar cuenta'
  }[modal.type];

  const submit = (event) => {
    event.preventDefault();
    setFormError('');

    if (modal.type === 'password') {
      if (!password || password !== confirmPassword) {
        setFormError('Las contraseñas no coinciden.');
        return;
      }
      onSubmit({ password });
      return;
    }

    onSubmit();
  };

  return (
    <div className="users-modal-backdrop" role="presentation">
      <section className="users-modal glass-panel" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <div>
            <span>{modal.user?.username}</span>
            <h2>{title}</h2>
          </div>
          <button className="users-icon-button" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        {modal.type === 'password' && (
          <form onSubmit={submit} className="users-modal-body">
            <label className="users-field">
              <span>Nueva contraseña</span>
              <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="new-password" />
            </label>
            <label className="users-field">
              <span>Confirmar contraseña</span>
              <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" autoComplete="new-password" />
            </label>
            {formError && <p className="form-error">{formError}</p>}
            <div className="users-modal-actions">
              <button type="button" className="users-button ghost" onClick={onClose}>Cancelar</button>
              <button className="users-button primary" disabled={busy}>{busy ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        )}

        {(modal.type === 'deactivate' || modal.type === 'activate' || modal.type === 'delete') && (
          <form onSubmit={submit} className="users-modal-body">
            <p className="users-confirm-copy">
              {modal.type === 'deactivate' && 'El usuario no podra iniciar sesion. La cuenta y su contraseña se conservan.'}
              {modal.type === 'activate' && 'El usuario podra iniciar sesion nuevamente con su contraseña actual.'}
              {modal.type === 'delete' && 'Esta accion elimina una cuenta manual no vinculada a cargo.'}
            </p>
            <div className="users-modal-actions">
              <button type="button" className="users-button ghost" onClick={onClose}>Cancelar</button>
              <button className={`users-button ${modal.type === 'delete' || modal.type === 'deactivate' ? 'danger' : 'primary'}`} disabled={busy}>
                {busy ? 'Procesando...' : modal.type === 'activate' ? 'Activar' : modal.type === 'delete' ? 'Eliminar' : 'Desactivar'}
              </button>
            </div>
          </form>
        )}

      </section>
    </div>
  );
}

function ExportConfirmModal({ loading, onCancel, onConfirm }) {
  return (
    <div className="users-modal-backdrop" role="presentation">
      <section className="users-modal glass-panel" role="dialog" aria-modal="true" aria-label="Exportar credenciales">
        <header>
          <div>
            <span>Exportar</span>
            <h2>Credenciales del sistema</h2>
          </div>
          <button className="users-icon-button" onClick={onCancel} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>
        <div className="users-modal-body">
          <p className="users-confirm-copy">El archivo contendra las contraseñas visibles de todas las cuentas.</p>
          <div className="users-modal-actions">
            <button type="button" className="users-button ghost" onClick={onCancel}>Cancelar</button>
            <button type="button" className="users-button primary" onClick={onConfirm} disabled={loading}>
              {loading ? 'Exportando...' : 'Exportar'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function UserActions({
  usuario,
  currentUser,
  revealedPassword,
  busy,
  variant = 'mobile',
  onReveal,
  onHide,
  onCopyUser,
  onCopyPassword,
  onCopyCredentials,
  onEdit,
  onToggleActive,
  onDelete
}) {
  const self = currentUser?.id === usuario.id;
  const canDelete = usuario.cargoId == null && !isSystemAdminUser(usuario) && !self;
  const secondaryActions = (
    <>
      {revealedPassword && (
        <>
          <button className="users-action secondary" onClick={() => onCopyCredentials(usuario, revealedPassword)}><Copy size={14} /> Credenciales</button>
          <button className="users-action secondary" onClick={() => onHide(usuario.id)}><EyeOff size={14} /> Ocultar</button>
        </>
      )}
      {!self && (
        <button className="users-action secondary" onClick={() => onToggleActive(usuario)}>
          {usuario.activo ? <PowerOff size={14} /> : <Power size={14} />}
          {usuario.activo ? 'Desactivar' : 'Activar'}
        </button>
      )}
      {canDelete && (
        <button className="users-action muted-danger" onClick={() => onDelete(usuario)}><Trash2 size={14} /> Eliminar</button>
      )}
    </>
  );

  if (variant === 'desktop') {
    return (
      <div className="users-actions desktop">
        <button className="users-action" onClick={() => onCopyUser(usuario)}><Copy size={14} /> Usuario</button>
        {revealedPassword ? (
          <button className="users-action" onClick={() => onCopyPassword(usuario, revealedPassword)}><Copy size={14} /> Contraseña</button>
        ) : (
          <button className="users-action" onClick={() => onReveal(usuario)} disabled={!usuario.passwordAvailable || busy}>
            <Eye size={14} /> {busy ? 'Mostrando...' : 'Mostrar'}
          </button>
        )}
        <button className="users-action secondary" onClick={() => onEdit(usuario)}><Pencil size={14} /> Editar</button>
        <details className="users-more">
          <summary aria-label="Mas acciones">•••</summary>
          <div className="users-more-menu">{secondaryActions}</div>
        </details>
      </div>
    );
  }

  return (
    <div className="users-actions">
      <button className="users-action" onClick={() => onCopyUser(usuario)}><Copy size={14} /> Usuario</button>
      {revealedPassword ? (
        <>
          <button className="users-action" onClick={() => onCopyPassword(usuario, revealedPassword)}><Copy size={14} /> Contraseña</button>
          <button className="users-action" onClick={() => onCopyCredentials(usuario, revealedPassword)}><Copy size={14} /> Credenciales</button>
          <button className="users-icon-button" onClick={() => onHide(usuario.id)} aria-label="Ocultar contraseña"><EyeOff size={16} /></button>
        </>
      ) : (
        <button className="users-action" onClick={() => onReveal(usuario)} disabled={!usuario.passwordAvailable || busy}>
          <Eye size={14} /> {busy ? 'Mostrando...' : 'Mostrar'}
        </button>
      )}
      <button className="users-action secondary" onClick={() => onEdit(usuario)}><Pencil size={14} /> Editar</button>
      {!self && (
        <button className="users-action secondary" onClick={() => onToggleActive(usuario)}>
          {usuario.activo ? <PowerOff size={14} /> : <Power size={14} />}
          {usuario.activo ? 'Desactivar' : 'Activar'}
        </button>
      )}
      {canDelete && (
        <button className="users-action muted-danger" onClick={() => onDelete(usuario)}><Trash2 size={14} /> Eliminar</button>
      )}
    </div>
  );
}

export default function UsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [revealedPasswords, setRevealedPasswords] = useState({});
  const [allPasswordsVisible, setAllPasswordsVisible] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [modal, setModal] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exportConfirmOpen, setExportConfirmOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const timers = useRef(new Map());
  const isSystemAdmin = currentUser?.role === 'ADMIN' && currentUser?.cargoId == null;

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { usuarios: rows } = await usersApi.list();
      setUsuarios(rows || []);
    } catch (err) {
      setError(getMessage(err, 'No se pudieron cargar usuarios.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    return () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    };
  }, []);

  const notify = (message) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 2300);
  };

  const updateUser = (usuario) => {
    setUsuarios((rows) => rows.map((row) => (row.id === usuario.id ? usuario : row)));
  };

  const clearPasswordTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
  };

  const hideAllPasswords = () => {
    clearPasswordTimers();
    setRevealedPasswords({});
    setAllPasswordsVisible(false);
    notify('Contraseñas ocultas');
  };

  const hidePassword = (id) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setRevealedPasswords((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setAllPasswordsVisible(false);
  };

  const rememberPassword = (id, password) => {
    hidePassword(id);
    setRevealedPasswords((current) => ({ ...current, [id]: password }));
    const timer = window.setTimeout(() => hidePassword(id), PASSWORD_VISIBLE_MS);
    timers.current.set(id, timer);
  };

  const copyText = async (text, message) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    notify(message);
  };

  const copyUser = (usuario) => copyText(usuario.username || '', 'Usuario copiado');
  const copyPassword = (usuario, password) => copyText(password, 'Contraseña copiada');
  const copyCredentials = (usuario, password) => copyText(`Usuario: ${usuario.username}\nContraseña: ${password}`, 'Credenciales copiadas');

  const revealAllPasswords = async () => {
    if (allPasswordsVisible) {
      hideAllPasswords();
      return;
    }
    setBulkLoading(true);
    setError('');
    try {
      const { usuarios: rows } = await usersApi.revealAllPasswords();
      clearPasswordTimers();
      setRevealedPasswords(
        (rows || []).reduce((acc, row) => {
          acc[row.id] = row.password;
          return acc;
        }, {})
      );
      setAllPasswordsVisible(true);
      notify('Contraseñas visibles');
    } catch (err) {
      setError(getMessage(err, 'No se pudieron revelar las credenciales.'));
      hideAllPasswords();
    } finally {
      setBulkLoading(false);
    }
  };

  const exportCredentials = async () => {
    setExportLoading(true);
    setError('');
    try {
      const blob = await usersApi.exportCredentials();
      const date = new Date().toISOString().slice(0, 10);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `usuarios-kpi-mbc-${date}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      notify('Archivo exportado');
      setExportConfirmOpen(false);
    } catch (err) {
      setError(getMessage(err, 'No se pudo exportar el archivo.'));
    } finally {
      setExportLoading(false);
    }
  };

  const revealPassword = async (usuario) => {
    if (!usuario.passwordAvailable) return;
    setBusyId(usuario.id);
    setError('');
    try {
      const { password } = await usersApi.revealPassword(usuario.id);
      rememberPassword(usuario.id, password);
      notify('Contraseña visible temporalmente');
    } catch (err) {
      setError(getMessage(err, 'No se pudo revelar la contraseña.'));
    } finally {
      setBusyId('');
    }
  };

  const closeModal = () => {
    setModal(null);
  };

  const submitModal = async (payload) => {
    const { user, type } = modal;
    setBusyId(user.id);
    setError('');
    try {
      if (type === 'password') {
        const { usuario } = await usersApi.changePassword(user.id, payload.password);
        updateUser(usuario);
        setRevealedPasswords((current) => (
          current[user.id] ? { ...current, [user.id]: payload.password } : current
        ));
        notify('Contraseña cambiada');
        closeModal();
      }
      if (type === 'deactivate' || type === 'activate') {
        const { usuario } = type === 'deactivate'
          ? await usersApi.deactivate(user.id)
          : await usersApi.activate(user.id);
        updateUser(usuario);
        notify(type === 'deactivate' ? 'Cuenta desactivada' : 'Cuenta activada');
        closeModal();
      }
      if (type === 'delete') {
        await usersApi.delete(user.id);
        setUsuarios((rows) => rows.filter((row) => row.id !== user.id));
        notify('Cuenta eliminada');
        closeModal();
      }
    } catch (err) {
      setError(getMessage(err, 'No se pudo completar la accion.'));
    } finally {
      setBusyId('');
    }
  };

  const summary = useMemo(() => ({
    total: usuarios.length,
    active: usuarios.filter((usuario) => usuario.activo).length,
    inactive: usuarios.filter((usuario) => !usuario.activo).length
  }), [usuarios]);

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return usuarios.filter((usuario) => {
      if (statusFilter === 'active' && !usuario.activo) return false;
      if (statusFilter === 'inactive' && usuario.activo) return false;
      if (roleFilter !== 'all' && usuario.role !== roleFilter) return false;
      if (!normalized) return true;
      return [
        usuario.username,
        usuario.nombre,
        usuario.role,
        usuario.cargoId,
        usuario.cargo?.nombre
      ].filter(Boolean).join(' ').toLowerCase().includes(normalized);
    });
  }, [usuarios, query, statusFilter, roleFilter]);

  const renderPassword = (usuario) => {
    const revealed = revealedPasswords[usuario.id];
    if (revealed) return <span className="users-password visible">{revealed}</span>;
    if (!usuario.passwordAvailable) return <span className="users-password unavailable">Contraseña no recuperable</span>;
    return <span className="users-password">{HIDDEN_PASSWORD}</span>;
  };

  const renderIdentity = (usuario) => (
    <div className="users-identity">
      <strong>{usuario.username}</strong>
      <span>{isSystemAdminUser(usuario) ? 'Administrador del sistema' : usuario.nombre}</span>
    </div>
  );

  return (
    <section className="dashboard-page users-page">
      <div className="users-header glass-panel">
        <div>
          <span className="eyebrow">Administracion</span>
          <h1>Usuarios</h1>
          <p>Administración de cuentas por puesto</p>
        </div>
        {isSystemAdmin && (
          <div className="users-header-actions">
            <button className="users-button ghost" onClick={revealAllPasswords} disabled={bulkLoading}>
              {allPasswordsVisible ? <EyeOff size={15} /> : <Eye size={15} />}
              {bulkLoading ? 'Cargando...' : allPasswordsVisible ? 'Ocultar todas' : 'Ver todas'}
            </button>
            <button className="users-button primary" onClick={() => setExportConfirmOpen(true)}><Download size={15} /> Exportar</button>
          </div>
        )}
        <div className="users-summary" aria-label="Resumen de usuarios">
          <div><span>Total</span><strong>{summary.total}</strong></div>
          <div><span>Activos</span><strong>{summary.active}</strong></div>
          <div><span>Inactivos</span><strong>{summary.inactive}</strong></div>
        </div>
      </div>

      <div className="users-toolbar glass-panel">
        <label className="users-search glass-control">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar usuario, puesto o cargo" />
        </label>
        <div className="users-filter-group" aria-label="Estado">
          {STATUS_FILTERS.map((filter) => (
            <button key={filter.value} className={statusFilter === filter.value ? 'active' : ''} onClick={() => setStatusFilter(filter.value)}>
              {filter.label}
            </button>
          ))}
        </div>
        <div className="users-filter-group role" aria-label="Rol">
          {ROLE_FILTERS.map((filter) => (
            <button key={filter.value} className={roleFilter === filter.value ? 'active' : ''} onClick={() => setRoleFilter(filter.value)}>
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className="users-feedback" role="status">
          <Check size={15} />
          {feedback}
        </div>
      )}

      {error && (
        <div className="alert-error users-alert">
          {error}
          <button onClick={() => setError('')} aria-label="Cerrar error"><X size={15} /></button>
        </div>
      )}

      {loading ? (
        <div className="users-list-shell glass-panel">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="users-skeleton" />)}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="users-empty glass-panel">No hay usuarios que coincidan con la busqueda.</div>
      ) : (
        <>
          <div className="users-list-shell users-desktop-list glass-panel">
            <div className="users-table-head">
              <span>Usuario</span>
              <span>Puesto</span>
              <span>Cargo</span>
              <span>Rol</span>
              <span>Estado</span>
              <span>Contraseña</span>
              <span>Acciones</span>
            </div>
            {filteredUsers.map((usuario) => (
              <article key={usuario.id} className={`users-row ${usuario.activo ? '' : 'inactive'}`.trim()}>
                {renderIdentity(usuario)}
                <div className="users-position">{isSystemAdminUser(usuario) ? 'Sin cargo funcional' : usuario.cargo?.nombre || usuario.nombre}</div>
                <div className="users-cargo">{usuario.cargoId ?? 'N/A'}</div>
                <div><span className={`users-role role-${usuario.role.toLowerCase()}`}><ShieldCheck size={13} />{usuario.role}</span></div>
                <div><span className={`users-status ${usuario.activo ? 'active' : 'inactive'}`}>{usuario.activo ? 'Activo' : 'Inactivo'}</span></div>
                <div>{renderPassword(usuario)}</div>
                <UserActions
                  usuario={usuario}
                  currentUser={currentUser}
                  revealedPassword={revealedPasswords[usuario.id]}
                  busy={busyId === usuario.id}
                  variant="desktop"
                  onReveal={revealPassword}
                  onHide={hidePassword}
                  onCopyUser={copyUser}
                  onCopyPassword={copyPassword}
                  onCopyCredentials={copyCredentials}
                  onEdit={(user) => setModal({ type: 'password', user })}
                  onToggleActive={(user) => setModal({ type: user.activo ? 'deactivate' : 'activate', user })}
                  onDelete={(user) => setModal({ type: 'delete', user })}
                />
              </article>
            ))}
          </div>

          <div className="users-mobile-list">
            {filteredUsers.map((usuario) => (
              <article key={usuario.id} className={`users-card glass-card ${usuario.activo ? '' : 'inactive'}`.trim()}>
                <header>
                  {renderIdentity(usuario)}
                  <span className={`users-status ${usuario.activo ? 'active' : 'inactive'}`}>{usuario.activo ? 'Activo' : 'Inactivo'}</span>
                </header>
                <div className="users-card-meta">
                  <span>{isSystemAdminUser(usuario) ? 'Sin cargo funcional' : `Cargo ${usuario.cargoId}`}</span>
                  <span>{usuario.role}</span>
                </div>
                <div className="users-mobile-password">
                  <span>Contraseña</span>
                  {renderPassword(usuario)}
                </div>
                <UserActions
                  usuario={usuario}
                  currentUser={currentUser}
                  revealedPassword={revealedPasswords[usuario.id]}
                  busy={busyId === usuario.id}
                  variant="mobile"
                  onReveal={revealPassword}
                  onHide={hidePassword}
                  onCopyUser={copyUser}
                  onCopyPassword={copyPassword}
                  onCopyCredentials={copyCredentials}
                  onEdit={(user) => setModal({ type: 'password', user })}
                  onToggleActive={(user) => setModal({ type: user.activo ? 'deactivate' : 'activate', user })}
                  onDelete={(user) => setModal({ type: 'delete', user })}
                />
              </article>
            ))}
          </div>
        </>
      )}

      {modal && (
        <CredentialModal
          modal={modal}
          onClose={closeModal}
          onSubmit={submitModal}
          busy={busyId === modal.user?.id}
        />
      )}
      {exportConfirmOpen && (
        <ExportConfirmModal
          loading={exportLoading}
          onCancel={() => setExportConfirmOpen(false)}
          onConfirm={exportCredentials}
        />
      )}
    </section>
  );
}
