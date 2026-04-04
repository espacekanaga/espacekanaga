import { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Form';
import { EmptyState, LoadingSpinner } from '../../components/ui/Loading';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../api/users';
import type { User } from '../../types/auth';

export function RolesManagementPage() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await usersApi.getAll({ limit: 100 });
        setUsers(response.data);
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Erreur lors du chargement des utilisateurs');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, showError]);

  // Only Admin and SuperAdmin can access
  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.prenom.toLowerCase().includes(search.toLowerCase()) ||
    u.nom.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.telephone?.includes(search)
  );

  const handleSaveUser = async (user: User) => {
    setIsSaving(true);
    try {
      // Only send fields that can be modified based on role
      const updateData: {
        role?: 'ADMIN' | 'EMPLOYEE' | 'SUPER_ADMIN';
        isActive?: boolean;
        email?: string;
      } = {};

      // Both Admin and SuperAdmin can change role and isActive
      updateData.role = user.role;
      updateData.isActive = user.isActive;

      await usersApi.update(user.id, updateData);

      // Update local state
      setUsers(users.map(u => u.id === user.id ? user : u));
      setEditingUser(null);
      showSuccess('Utilisateur mis à jour avec succès');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      const newStatus = !user.isActive;
      await usersApi.update(user.id, { isActive: newStatus });
      setUsers(users.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
      showSuccess(`Compte ${newStatus ? 'activé' : 'désactivé'} avec succès`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut');
    }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Gestion des Rôles et Permissions"
          description="Attribuer les rôles et accès aux espaces de travail"
        />
        <div className="flex justify-center py-12">
          <LoadingSpinner className="w-8 h-8" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Gestion des Rôles et Permissions"
        description="Attribuer les rôles et accès aux espaces de travail"
      />

      <div className="mb-6">
        <Input
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState message="Aucun utilisateur trouvé" />
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <UserPermissionsCard
              key={user.id}
              user={user}
              onEdit={() => setEditingUser(user)}
              onToggleStatus={() => handleToggleUserStatus(user)}
              isSuperAdmin={isSuperAdmin}
            />
          ))}
        </div>
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
          isSaving={isSaving}
          isSuperAdmin={isSuperAdmin}
        />
      )}
    </div>
  );
}

function UserPermissionsCard({
  user,
  onEdit,
  onToggleStatus,
  isSuperAdmin
}: {
  user: User;
  onEdit: () => void;
  onToggleStatus: () => void;
  isSuperAdmin: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-medium text-lg ${
              user.isActive
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-slate-500/20 text-slate-400'
            }`}>
              {user.prenom.charAt(0)}{user.nom.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{user.prenom} {user.nom}</h3>
                {!user.isActive && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">
                    Inactif
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">{user.email || user.telephone}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                  user.role === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                  user.role === 'ADMIN' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Access indicators */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${user.accessPressing ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-slate-400">Pressing</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${user.accessAtelier ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-slate-400">Atelier</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Only SuperAdmin can see and click toggle status for other users */}
              {isSuperAdmin && user.role !== 'SUPER_ADMIN' && (
                <button
                  onClick={onToggleStatus}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    user.isActive
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                  }`}
                >
                  {user.isActive ? 'Désactiver' : 'Activer'}
                </button>
              )}
              <Button variant="outline" size="sm" onClick={onEdit}>
                Modifier
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EditUserModal({
  user,
  onClose,
  onSave,
  isSaving,
  isSuperAdmin
}: {
  user: User;
  onClose: () => void;
  onSave: (u: User) => void;
  isSaving: boolean;
  isSuperAdmin: boolean;
}) {
  const [formData, setFormData] = useState<User>({ ...user });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Modifier l&apos;utilisateur
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User info display (read-only) */}
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Utilisateur</p>
          <p className="font-medium text-slate-900 dark:text-slate-100">
            {user.prenom} {user.nom}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {user.email || user.telephone}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role - Both Admin and SuperAdmin can change */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Rôle
            </label>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              options={[
                { value: 'EMPLOYEE', label: 'Employé' },
                { value: 'ADMIN', label: 'Admin' },
                ...(isSuperAdmin ? [{ value: 'SUPER_ADMIN', label: 'Super Admin' }] : []),
              ]}
            />
            <p className="text-xs text-slate-500 mt-1">
              {formData.role === 'SUPER_ADMIN'
                ? 'Accès complet à toutes les fonctionnalités'
                : formData.role === 'ADMIN'
                ? 'Peut gérer les utilisateurs, commandes et factures'
                : 'Accès limité aux espaces de travail assignés'}
            </p>
          </div>

          {/* Account Status */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Compte actif
              </p>
              <p className="text-xs text-slate-500">
                {formData.isActive
                  ? 'L\'utilisateur peut se connecter'
                  : 'L\'utilisateur ne peut pas se connecter'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Workspace Access - Only SuperAdmin can change */}
          <div className={`${!isSuperAdmin ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Accès aux espaces
              </label>
              {!isSuperAdmin && (
                <span className="text-xs text-slate-500">(Super Admin uniquement)</span>
              )}
            </div>
            <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.accessPressing}
                  onChange={(e) => setFormData({ ...formData, accessPressing: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Accès Espace Pressing
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.accessAtelier}
                  onChange={(e) => setFormData({ ...formData, accessAtelier: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Accès Espace Atelier
                </span>
              </label>
            </div>
          </div>

          {/* Note about Super Admin restrictions */}
          {isSuperAdmin && user.role !== 'SUPER_ADMIN' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Note :</strong> En tant que Super Admin, vous ne pouvez modifier que les informations professionnelles (rôle, accès, statut). Les informations personnelles (nom, téléphone, email) ne peuvent être modifiées que par l&apos;utilisateur lui-même.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSaving}>
              Enregistrer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
