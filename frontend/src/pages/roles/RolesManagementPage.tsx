import { useState } from 'react';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Form';
import { EmptyState } from '../../components/ui/Loading';
import { useAuth } from '../../context/AuthContext';
import type { User } from '../../types/auth';

// Données de démonstration
const mockUsers: User[] = [
  {
    id: '1',
    prenom: 'Admin',
    nom: 'Principal',
    telephone: '0123456789',
    email: 'admin@kanaga.com',
    role: 'ADMIN',
    isActive: true,
    accessPressing: true,
    accessAtelier: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    prenom: 'Employé',
    nom: 'Pressing',
    telephone: '0987654321',
    email: 'employe@kanaga.com',
    role: 'EMPLOYEE',
    isActive: true,
    accessPressing: true,
    accessAtelier: false,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

export function RolesManagementPage() {
  const { isSuperAdmin } = useAuth();
  const { showSuccess } = useToast();
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">Accès réservé au Super Admin</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.prenom.toLowerCase().includes(search.toLowerCase()) ||
    u.nom.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveUser = (user: User) => {
    setUsers(users.map(u => u.id === user.id ? user : u));
    setEditingUser(null);
    showSuccess('Utilisateur mis à jour');
  };

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
            />
          ))}
        </div>
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}

function UserPermissionsCard({ user, onEdit }: { user: User; onEdit: () => void }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-medium text-lg">
              {user.prenom.charAt(0)}{user.nom.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold">{user.prenom} {user.nom}</h3>
              <p className="text-sm text-slate-400">{user.email || user.telephone}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                user.role === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                user.role === 'ADMIN' ? 'bg-blue-500/20 text-blue-400' :
                'bg-slate-500/20 text-slate-400'
              }`}>
                {user.role}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${user.accessPressing ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-slate-400">Pressing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${user.accessAtelier ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-slate-400">Atelier</span>
            </div>
            <Button variant="outline" size="sm" onClick={onEdit}>
              Modifier
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EditUserModal({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (u: User) => void }) {
  const [formData, setFormData] = useState<User>({ ...user });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4">Modifier les permissions</h2>
        <p className="text-slate-400 mb-4">{formData.prenom} {formData.nom}</p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Rôle</label>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              options={[
                { value: 'EMPLOYEE', label: 'Employé' },
                { value: 'ADMIN', label: 'Admin' },
                { value: 'SUPER_ADMIN', label: 'Super Admin' },
              ]}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="accessPressing"
              checked={formData.accessPressing}
              onChange={(e) => setFormData({ ...formData, accessPressing: e.target.checked })}
              className="w-4 h-4 rounded border-slate-600"
            />
            <label htmlFor="accessPressing" className="text-sm">Accès Espace Pressing</label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="accessAtelier"
              checked={formData.accessAtelier}
              onChange={(e) => setFormData({ ...formData, accessAtelier: e.target.checked })}
              className="w-4 h-4 rounded border-slate-600"
            />
            <label htmlFor="accessAtelier" className="text-sm">Accès Espace Atelier</label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-slate-600"
            />
            <label htmlFor="isActive" className="text-sm">Compte actif</label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => onSave(formData)}>Enregistrer</Button>
        </div>
      </div>
    </div>
  );
}
