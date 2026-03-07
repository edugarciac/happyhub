import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import AdminLayout from '../../components/admin/AdminLayout';
import { apiClient } from '../../lib/apiClient';
import toast, { Toaster } from 'react-hot-toast';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  X,
  Save,
  User,
} from 'lucide-react';

const AVAILABLE_ACTIONS = [
  { value: 'reservations:read', label: 'Reservas - Ver' },
  { value: 'reservations:write', label: 'Reservas - Crear/Editar' },
  { value: 'reservations:delete', label: 'Reservas - Eliminar' },
  { value: 'calendar:manage', label: 'Calendario - Gestionar' },
  { value: 'reviews:moderate', label: 'Reseñas - Moderar' },
  { value: 'users:read', label: 'Usuarios - Ver' },
  { value: 'users:manage', label: 'Usuarios - Gestionar' },
  { value: 'providers:read', label: 'Proveedores - Ver' },
  { value: 'providers:manage', label: 'Proveedores - Gestionar' },
  { value: 'services:read', label: 'Servicios - Ver' },
  { value: 'services:manage', label: 'Servicios - Gestionar' },
  { value: 'reports:view', label: 'Informes - Ver' },
  { value: 'payments:view', label: 'Pagos - Ver' },
  { value: 'payments:refund', label: 'Pagos - Reembolsar' },
];

const DEFAULT_POLICY_DOC = {
  Version: '2026-01-01',
  Statement: [
    {
      Effect: 'Allow',
      Action: [] as string[],
      Resource: '*',
    },
  ],
};

interface Statement {
  Effect: 'Allow' | 'Deny';
  Action: string[];
  Resource: string;
}

interface PolicyDocument {
  Version: string;
  Statement: Statement[];
}

interface Policy {
  id: number;
  policy_name: string;
  policy_document: PolicyDocument;
  created_at: string;
  created_by_name?: string;
}

interface IamUser {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
  policies: Policy[];
}

interface PolicyModalProps {
  user: IamUser;
  policy?: Policy | null;
  onClose: () => void;
  onSaved: () => void;
}

function PolicyModal({ user, policy, onClose, onSaved }: PolicyModalProps) {
  const isEdit = !!policy;
  const [policyName, setPolicyName] = useState(policy?.policy_name || '');
  const [statements, setStatements] = useState<Statement[]>(
    policy?.policy_document?.Statement || [{ Effect: 'Allow', Action: [], Resource: '*' }]
  );
  const [saving, setSaving] = useState(false);
  const [jsonMode, setJsonMode] = useState(false);
  const [rawJson, setRawJson] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Sync rawJson when switching to JSON mode
  useEffect(() => {
    if (jsonMode) {
      setRawJson(JSON.stringify({ Version: '2026-01-01', Statement: statements }, null, 2));
      setJsonError('');
    }
  }, [jsonMode]);

  const toggleAction = (stmtIndex: number, action: string) => {
    setStatements((prev) =>
      prev.map((stmt, i) => {
        if (i !== stmtIndex) return stmt;
        const has = stmt.Action.includes(action);
        return {
          ...stmt,
          Action: has ? stmt.Action.filter((a) => a !== action) : [...stmt.Action, action],
        };
      })
    );
  };

  const setEffect = (stmtIndex: number, effect: 'Allow' | 'Deny') => {
    setStatements((prev) =>
      prev.map((stmt, i) => (i === stmtIndex ? { ...stmt, Effect: effect } : stmt))
    );
  };

  const addStatement = () => {
    setStatements((prev) => [...prev, { Effect: 'Allow', Action: [], Resource: '*' }]);
  };

  const removeStatement = (index: number) => {
    setStatements((prev) => prev.filter((_, i) => i !== index));
  };

  const buildPolicyDocument = (): PolicyDocument => ({ Version: '2026-01-01', Statement: statements });

  const handleSave = async () => {
    if (!policyName.trim()) {
      toast.error('El nombre de la política es requerido');
      return;
    }

    let finalDoc: PolicyDocument;

    if (jsonMode) {
      try {
        finalDoc = JSON.parse(rawJson);
        setJsonError('');
      } catch {
        setJsonError('JSON inválido');
        return;
      }
    } else {
      if (statements.some((s) => s.Action.length === 0)) {
        toast.error('Cada declaración debe tener al menos una acción');
        return;
      }
      finalDoc = buildPolicyDocument();
    }

    try {
      setSaving(true);
      if (isEdit) {
        await apiClient.put('/api/admin/iam/policies', {
          id: policy!.id,
          policy_name: policyName,
          policy_document: finalDoc,
        });
        toast.success('Política actualizada');
      } else {
        await apiClient.post('/api/admin/iam/policies', {
          userId: user.id,
          policy_name: policyName,
          policy_document: finalDoc,
        });
        toast.success('Política creada');
      }
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Error al guardar política');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isEdit ? 'Editar Política' : 'Nueva Política Inline'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Usuario: <span className="font-medium">{user.name}</span> ({user.email})
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Policy name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la política <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              placeholder="Ej: ProveedorReservasReadOnly"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Modo de edición:</span>
            <button
              onClick={() => setJsonMode(false)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                !jsonMode ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Visual
            </button>
            <button
              onClick={() => setJsonMode(true)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                jsonMode ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              JSON
            </button>
          </div>

          {jsonMode ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Documento de política (JSON)
              </label>
              <textarea
                value={rawJson}
                onChange={(e) => {
                  setRawJson(e.target.value);
                  setJsonError('');
                }}
                rows={14}
                className={`w-full font-mono text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                  jsonError ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {jsonError && <p className="mt-1 text-xs text-red-600">{jsonError}</p>}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Declaraciones (Statements)</span>
                <button
                  onClick={addStatement}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Añadir declaración
                </button>
              </div>

              {statements.map((stmt, stmtIdx) => (
                <div key={stmtIdx} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Statement {stmtIdx + 1}
                    </span>
                    {statements.length > 1 && (
                      <button
                        onClick={() => removeStatement(stmtIdx)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Effect */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-16">Efecto:</span>
                    <button
                      onClick={() => setEffect(stmtIdx, 'Allow')}
                      className={`px-3 py-1 text-xs rounded-lg font-medium border transition-colors ${
                        stmt.Effect === 'Allow'
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-green-300'
                      }`}
                    >
                      Allow
                    </button>
                    <button
                      onClick={() => setEffect(stmtIdx, 'Deny')}
                      className={`px-3 py-1 text-xs rounded-lg font-medium border transition-colors ${
                        stmt.Effect === 'Deny'
                          ? 'bg-red-100 text-red-700 border-red-300'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-red-300'
                      }`}
                    >
                      Deny
                    </button>
                  </div>

                  {/* Actions */}
                  <div>
                    <span className="text-sm text-gray-700 block mb-2">Acciones:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {AVAILABLE_ACTIONS.map((action) => (
                        <label
                          key={action.value}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={stmt.Action.includes(action.value)}
                            onChange={() => toggleAction(stmtIdx, action.value)}
                            className="w-3.5 h-3.5 rounded text-primary-600 border-gray-300 focus:ring-primary-500"
                          />
                          <span className="text-xs text-gray-700 group-hover:text-gray-900">
                            {action.label}
                          </span>
                        </label>
                      ))}
                    </div>
                    {stmt.Action.length === 0 && (
                      <p className="mt-2 text-xs text-amber-600">Selecciona al menos una acción</p>
                    )}
                  </div>

                  {/* Resource */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700 w-20">Recurso:</span>
                    <input
                      type="text"
                      value={stmt.Resource}
                      onChange={(e) =>
                        setStatements((prev) =>
                          prev.map((s, i) => (i === stmtIdx ? { ...s, Resource: e.target.value } : s))
                        )
                      }
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear política'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminIAM() {
  const [users, setUsers] = useState<IamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [modalUser, setModalUser] = useState<IamUser | null>(null);
  const [editPolicy, setEditPolicy] = useState<Policy | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ policyId: number; policyName: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ search });
      const res = await apiClient.get(`/api/admin/iam/users?${params}`);
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeletePolicy = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.delete(`/api/admin/iam/policies?id=${deleteTarget.policyId}`);
      toast.success('Política eliminada');
      setDeleteTarget(null);
      fetchUsers();
    } catch {
      toast.error('Error al eliminar política');
    }
  };

  const openCreateModal = (user: IamUser) => {
    setEditPolicy(null);
    setModalUser(user);
  };

  const openEditModal = (user: IamUser, policy: Policy) => {
    setEditPolicy(policy);
    setModalUser(user);
  };

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700',
      provider: 'bg-blue-100 text-blue-700',
      client: 'bg-gray-100 text-gray-600',
    };
    return (
      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${styles[role] || styles.client}`}>
        {role}
      </span>
    );
  };

  return (
    <>
      <Head>
        <title>IAM - Políticas de Usuario - Admin</title>
      </Head>

      <Toaster position="top-right" />

      <AdminLayout>
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-8 h-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-gray-900">IAM - Políticas de Usuario</h1>
            </div>
            <p className="text-gray-600">
              Crea y gestiona políticas de permisos inline para usuarios individuales de la plataforma.
            </p>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Users list */}
          {loading ? (
            <div className="text-center py-16 text-gray-500">Cargando usuarios...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No se encontraron usuarios</div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => {
                const isExpanded = expandedUser === user.id;
                return (
                  <div key={user.id} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                    {/* User row */}
                    <button
                      className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                    >
                      <div className="flex-shrink-0 w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{user.name || '(sin nombre)'}</span>
                          {roleBadge(user.role)}
                          <span className="text-xs text-gray-400">
                            {user.policies.length} política{user.policies.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>

                    {/* Expanded policies */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-700">Políticas inline</h3>
                          <button
                            onClick={() => openCreateModal(user)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Crear política
                          </button>
                        </div>

                        {user.policies.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">
                            Este usuario no tiene políticas inline. Las políticas inline añaden permisos
                            adicionales sobre el rol base del usuario.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {user.policies.map((policy) => {
                              const allowStmts = policy.policy_document.Statement.filter(
                                (s) => s.Effect === 'Allow'
                              );
                              const denyStmts = policy.policy_document.Statement.filter(
                                (s) => s.Effect === 'Deny'
                              );
                              const allActions = policy.policy_document.Statement.flatMap((s) => s.Action);

                              return (
                                <div
                                  key={policy.id}
                                  className="bg-white border border-gray-200 rounded-lg p-3 flex items-start gap-3"
                                >
                                  <ShieldCheck className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-semibold text-gray-900">
                                        {policy.policy_name}
                                      </span>
                                      {allowStmts.length > 0 && (
                                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                          {allowStmts.flatMap((s) => s.Action).length} Allow
                                        </span>
                                      )}
                                      {denyStmts.length > 0 && (
                                        <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                          {denyStmts.flatMap((s) => s.Action).length} Deny
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                      {allActions.join(', ') || 'Sin acciones'}
                                    </p>
                                    {policy.created_by_name && (
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        Creada por {policy.created_by_name} ·{' '}
                                        {new Date(policy.created_at).toLocaleDateString('es-ES')}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => openEditModal(user, policy)}
                                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                      title="Editar política"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        setDeleteTarget({ policyId: policy.id, policyName: policy.policy_name })
                                      }
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Eliminar política"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AdminLayout>

      {/* Policy create/edit modal */}
      {modalUser && (
        <PolicyModal
          user={modalUser}
          policy={editPolicy}
          onClose={() => { setModalUser(null); setEditPolicy(null); }}
          onSaved={fetchUsers}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Eliminar política</h3>
            <p className="text-sm text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar la política{' '}
              <strong>{deleteTarget.policyName}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletePolicy}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
