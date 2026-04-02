import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../hooks/useToast';
import { useForm } from '../../hooks/useForm';
import { usersApi, type UpdateUserRequest } from '../../api/users';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Form';
import { LoadingSpinner, EmptyState } from '../../components/ui/Loading';
import { Badge } from '../../components/ui/Badge';

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EMPLOYEE: 'Employé',
};

const roleOptions = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'EMPLOYEE', label: 'Employé' },
];

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useFetch(() => usersApi.getById(id!), {
    onError: (err) => showError(err.message),
  });

  const form = useForm<UpdateUserRequest & Record<string, unknown>>({
    initialValues: {
      email: user?.email || '',
      role: user?.role || 'EMPLOYEE',
      isActive: user?.isActive ?? true,
    },
    onSubmit: async (values) => {
      try {
        await usersApi.update(id!, values);
        showSuccess('Utilisateur mis à jour avec succès');
        setIsEditing(false);
        refetch();
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      }
    },
  });

  const handleDelete = async () => {
    try {
      await usersApi.delete(id!);
      showSuccess('Utilisateur supprimé avec succès');
      navigate('/users');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  if (isLoading) return <LoadingSpinner className="py-12" />;
  if (error || !user) return <EmptyState message="Utilisateur non trouvé" />;

  return (
    <div>
      <PageHeader title={`${user.prenom} ${user.nom}`}>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/users')}>
            ← Retour
          </Button>
          <Button
            variant={isEditing ? 'secondary' : 'primary'}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Annuler' : 'Modifier'}
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            Supprimer
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              {isEditing ? (
                <form onSubmit={form.handleSubmit} className="space-y-4">
                  <Input
                    label="Email"
                    type="email"
                    value={form.values.email}
                    onChange={(e) => form.handleChange('email', e.target.value)}
                  />
                  <Select
                    label="Rôle"
                    value={form.values.role}
                    onChange={(e) => form.handleChange('role', e.target.value)}
                    options={roleOptions}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={form.values.isActive}
                      onChange={(e) => form.handleChange('isActive', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700">
                      Compte actif
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" isLoading={form.isSubmitting}>
                      Enregistrer
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                      Annuler
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <InfoRow label="Prénom" value={user.prenom} />
                  <InfoRow label="Nom" value={user.nom} />
                  <InfoRow label="Téléphone" value={user.telephone} />
                  <InfoRow label="Email" value={user.email || '-'} />
                  <InfoRow label="Adresse" value={user.adresse || '-'} />
                  <InfoRow
                    label="Rôle"
                    value={
                      <Badge variant={user.role === 'SUPER_ADMIN' ? 'danger' : user.role === 'ADMIN' ? 'warning' : 'default'}>
                        {roleLabels[user.role]}
                      </Badge>
                    }
                  />
                  <InfoRow
                    label="Statut"
                    value={
                      <Badge variant={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    }
                  />
                  <InfoRow
                    label="Accès Pressing"
                    value={user.accessPressing ? 'Oui' : 'Non'}
                  />
                  <InfoRow
                    label="Accès Atelier"
                    value={user.accessAtelier ? 'Oui' : 'Non'}
                  />
                  <InfoRow
                    label="Thème"
                    value={(user as any).theme || 'dark'}
                  />
                  <InfoRow
                    label="Date de création"
                    value={new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Actions rapides</h3>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full" onClick={() => navigate('/users')}>
                  Retour à la liste
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Confirmer la suppression</h3>
              <p className="text-gray-600 mb-4">
                Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{user.prenom} {user.nom}</strong> ?
                Cette action est irréversible.
              </p>
              <div className="flex gap-2">
                <Button variant="danger" onClick={handleDelete}>
                  Supprimer
                </Button>
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-slate-700/50 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-100">{value}</span>
    </div>
  );
}
