import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../hooks/useToast';
import { useForm } from '../../hooks/useForm';
import { usersApi } from '../../api/users';
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

interface UserFormValues extends Record<string, unknown> {
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  adresse: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE';
  isActive: boolean;
  accessPressing: boolean;
  accessAtelier: boolean;
}

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

  const form = useForm<UserFormValues>({
    initialValues: {
      prenom: user?.prenom || '',
      nom: user?.nom || '',
      telephone: user?.telephone || '',
      email: user?.email || '',
      adresse: user?.adresse || '',
      role: user?.role || 'EMPLOYEE',
      isActive: user?.isActive ?? true,
      accessPressing: user?.accessPressing ?? false,
      accessAtelier: user?.accessAtelier ?? false,
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

  const handleEditClick = () => {
    if (!isEditing && user) {
      // Reset form with current user values when entering edit mode
      form.setValues({
        prenom: user.prenom || '',
        nom: user.nom || '',
        telephone: user.telephone || '',
        email: user.email || '',
        adresse: user.adresse || '',
        role: user.role || 'EMPLOYEE',
        isActive: user.isActive ?? true,
        accessPressing: user.accessPressing ?? false,
        accessAtelier: user.accessAtelier ?? false,
      });
    }
    setIsEditing(!isEditing);
  };

  if (isLoading) return <LoadingSpinner className="py-12" />;
  if (error || !user) return <EmptyState message="Utilisateur non trouvé" />;

  return (
    <div className="pb-20">
      {/* Header sans boutons d'action */}
      <PageHeader title={`${user.prenom} ${user.nom}`}>
        <Button variant="secondary" onClick={() => navigate('/users')}>
          ← Retour
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              {isEditing ? (
                <form onSubmit={form.handleSubmit} className="space-y-6">
                  {/* Informations personnelles - Mode édition */}
                  <div>
                    <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4">
                      Informations personnelles
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Prénom"
                        value={form.values.prenom}
                        onChange={(e) => form.handleChange('prenom', e.target.value)}
                      />
                      <Input
                        label="Nom"
                        value={form.values.nom}
                        onChange={(e) => form.handleChange('nom', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <Input
                        label="Téléphone"
                        value={form.values.telephone}
                        onChange={(e) => form.handleChange('telephone', e.target.value)}
                      />
                      <Input
                        label="Email"
                        type="email"
                        value={form.values.email}
                        onChange={(e) => form.handleChange('email', e.target.value)}
                      />
                    </div>
                    <div className="mt-4">
                      <Input
                        label="Adresse"
                        value={form.values.adresse}
                        onChange={(e) => form.handleChange('adresse', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Rôle et permissions - Mode édition */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4">
                      Rôle et permissions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Rôle"
                        value={form.values.role}
                        onChange={(e) => form.handleChange('role', e.target.value)}
                        options={roleOptions}
                      />
                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={form.values.isActive}
                          onChange={(e) => form.handleChange('isActive', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                        />
                        <label htmlFor="isActive" className="text-sm text-slate-700 dark:text-slate-300">
                          Compte actif
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="accessPressing"
                          checked={form.values.accessPressing}
                          onChange={(e) => form.handleChange('accessPressing', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                        />
                        <label htmlFor="accessPressing" className="text-sm text-slate-700 dark:text-slate-300">
                          Accès Pressing
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="accessAtelier"
                          checked={form.values.accessAtelier}
                          onChange={(e) => form.handleChange('accessAtelier', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
                        />
                        <label htmlFor="accessAtelier" className="text-sm text-slate-700 dark:text-slate-300">
                          Accès Atelier
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Autres informations - Mode édition */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4">
                      Autres informations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoRowReadOnly
                        label="Date de création"
                        value={new Date(user.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      />
                      <InfoRowReadOnly
                        label="Dernière modification"
                        value={new Date(user.updatedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      />
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Informations personnelles - Mode lecture */}
                  <div>
                    <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4">
                      Informations personnelles
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoRowReadOnly label="Prénom" value={user.prenom} />
                      <InfoRowReadOnly label="Nom" value={user.nom} />
                      <InfoRowReadOnly label="Téléphone" value={user.telephone} />
                      <InfoRowReadOnly label="Email" value={user.email || '-'} />
                      <div className="md:col-span-2">
                        <InfoRowReadOnly label="Adresse" value={user.adresse || '-'} />
                      </div>
                    </div>
                  </div>

                  {/* Rôle et permissions - Mode lecture */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4">
                      Rôle et permissions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoRowReadOnly
                        label="Rôle"
                        value={
                          <Badge variant={user.role === 'SUPER_ADMIN' ? 'danger' : user.role === 'ADMIN' ? 'warning' : 'default'}>
                            {roleLabels[user.role]}
                          </Badge>
                        }
                      />
                      <InfoRowReadOnly
                        label="Statut"
                        value={
                          <Badge variant={user.isActive ? 'success' : 'danger'}>
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        }
                      />
                      <InfoRowReadOnly
                        label="Accès Pressing"
                        value={
                          <span className={user.accessPressing ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                            {user.accessPressing ? '✓ Oui' : '✗ Non'}
                          </span>
                        }
                      />
                      <InfoRowReadOnly
                        label="Accès Atelier"
                        value={
                          <span className={user.accessAtelier ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                            {user.accessAtelier ? '✓ Oui' : '✗ Non'}
                          </span>
                        }
                      />
                    </div>
                  </div>

                  {/* Autres informations - Mode lecture */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h3 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-4">
                      Autres informations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoRowReadOnly
                        label="Thème"
                        value={
                          <span className="capitalize text-slate-800 dark:text-slate-200">
                            {(user as any).theme === 'dark' ? 'Sombre' : (user as any).theme === 'light' ? 'Clair' : 'Sombre'}
                          </span>
                        }
                      />
                      <InfoRowReadOnly
                        label="Date de création"
                        value={new Date(user.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      />
                      <InfoRowReadOnly
                        label="Dernière modification"
                        value={new Date(user.updatedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <ShoppingBagIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Commandes récentes</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Dernières activités</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-3">
                {/* Exemple de commandes */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">CMD-2024-001</p>
                      <p className="text-xs text-slate-500">24 janvier 2024</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">15 000 FCFA</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">CMD-2024-002</p>
                      <p className="text-xs text-slate-500">20 janvier 2024</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">8 500 FCFA</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">CMD-2024-003</p>
                      <p className="text-xs text-slate-500">15 janvier 2024</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">22 000 FCFA</span>
                </div>
              </div>
              <Button variant="secondary" className="w-full mt-4" onClick={() => navigate('/orders')}>
                Voir toutes les commandes
              </Button>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 text-slate-900 dark:text-slate-100">Actions rapides</h3>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full" onClick={() => navigate('/users')}>
                  Retour à la liste
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Boutons d'action en pied de page */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 z-40 lg:pl-72">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {isEditing ? 'Mode édition activé' : `Dernière mise à jour : ${new Date(user.updatedAt).toLocaleDateString('fr-FR')}`}
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                  Annuler
                </Button>
                <Button type="button" variant="primary" onClick={form.handleSubmit} isLoading={form.isSubmitting}>
                  Enregistrer
                </Button>
              </>
            ) : (
              <>
                <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                  Supprimer
                </Button>
                <Button variant="primary" onClick={handleEditClick}>
                  Modifier
                </Button>
              </>
            )}
          </div>
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

// InfoRow pour mode lecture avec texte lisible
function InfoRowReadOnly({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-slate-200 dark:border-slate-700 last:border-0 gap-1">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">{value}</span>
    </div>
  );
}

// Icons
function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-6 pb-0 ${className}`}>
      {children}
    </div>
  );
}
