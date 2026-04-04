import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Form';
import { EmptyState, LoadingSpinner } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../api/users';
import type { User } from '../../types/auth';

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EMPLOYEE: 'Employé',
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  ADMIN: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  EMPLOYEE: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};


export function RolesManagementPage() {
  const { isSuperAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();
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
      if (user.role !== 'CLIENT') {
        updateData.role = user.role;
      }
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

  // Unused function removed - status toggle now handled in UserDetailPage

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
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onClick={() => navigate(`/users/${user.id}`)}
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

function UserCard({
  user,
  onClick,
}: {
  user: User;
  onClick: () => void;
}) {
  // Calculate permission count
  const getPermissionCount = () => {
    let count = 0;
    if (user.accessPressing) count++;
    if (user.accessAtelier) count++;
    return count;
  };

  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${
              user.isActive
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
            }`}
          >
            {user.prenom.charAt(0)}
            {user.nom.charAt(0)}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {user.prenom} {user.nom}
              </h3>
              <Badge
                variant={user.isActive ? 'success' : 'danger'}
                className="text-xs px-2 py-0.5"
              >
                {user.isActive ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {user.email || user.telephone}
            </p>
          </div>

          {/* Role Badge */}
          <div className="hidden sm:block">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                roleColors[user.role]
              }`}
            >
              {roleLabels[user.role]}
            </span>
          </div>

          {/* Access Indicators */}
          <div className="hidden md:flex items-center gap-3">
            <AccessIndicator
              label="Pressing"
              enabled={user.accessPressing ?? false}
            />
            <AccessIndicator
              label="Atelier"
              enabled={user.accessAtelier ?? false}
            />
          </div>

          {/* Permission Count */}
          <div className="text-right shrink-0">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {getPermissionCount()}/2 accès
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Cliquez pour gérer
            </div>
          </div>

          {/* Arrow */}
          <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
            <ChevronRightIcon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AccessIndicator({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${
        enabled
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
      }`}
    >
      {label === 'Pressing' ? (
        <ShirtIcon className="w-3.5 h-3.5" />
      ) : (
        <ScissorsIcon className="w-3.5 h-3.5" />
      )}
      <span className="font-medium">{label}</span>
    </div>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ShirtIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 2h12l4 8v12a2 2 0 01-2 2H4a2 2 0 01-2-2V10l4-8z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20" />
    </svg>
  );
}

function ScissorsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="6" cy="6" r="3" strokeWidth={2} />
      <circle cx="6" cy="18" r="3" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
    </svg>
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
