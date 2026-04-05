import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../api/users';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../hooks/useToast';
import type { User } from '../../types/auth';

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EMPLOYEE: 'Employé',
};

export function UsersPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      await usersApi.delete(userToDelete.id);
      showSuccess('Utilisateur supprimé avec succès');
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await usersApi.getAll({ limit: 100 });
      setUsers(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Utilisateurs" description="Gestion des utilisateurs système">
        <Button onClick={() => navigate('/users/new')}>Nouvel utilisateur</Button>
      </PageHeader>

      <div className="space-y-3">
        {users.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Aucun utilisateur trouvé</div>
        ) : (
          users.map((user) => (
            <Card
              key={user.id}
              onClick={() => navigate(`/users/${user.id}`)}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg flex-shrink-0">
                    {(user.email?.charAt(0) || user.prenom?.charAt(0) || '?').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-100 text-base sm:text-lg truncate">
                      {user.prenom} {user.nom}
                      <span className="hidden sm:inline text-slate-400 font-normal text-sm ml-1">
                        {user.email && `(${user.email})`}
                      </span>
                    </p>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                      {roleLabels[user.role]} • 
                      <span className="text-slate-500 hidden sm:inline">
                        Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')} à {new Date(user.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-slate-500 sm:hidden">
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </p>
                    {user.email && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate sm:hidden">{user.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                  <Badge variant={user.isActive ? 'success' : 'danger'} className="text-xs">
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserToDelete(user);
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                  <span className="text-slate-500 text-lg sm:text-xl">→</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <TrashIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Confirmer la suppression</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Êtes-vous sûr de vouloir supprimer l'utilisateur <strong className="text-slate-900 dark:text-slate-100">{userToDelete.prenom} {userToDelete.nom}</strong> ?
                Cette action est irréversible.
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="danger" 
                  onClick={handleDelete} 
                  isLoading={isDeleting}
                  className="flex-1"
                >
                  Supprimer
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setUserToDelete(null)} 
                  className="flex-1"
                  disabled={isDeleting}
                >
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

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
