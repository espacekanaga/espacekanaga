import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../api/users';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import type { User } from '../../types/auth';

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EMPLOYEE: 'Employé',
};

export function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

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
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {(user.email?.charAt(0) || user.prenom?.charAt(0) || '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100 text-lg">{user.prenom} {user.nom} <span className="text-slate-400 font-normal">{user.email && `(${user.email})`}</span></p>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {roleLabels[user.role]} • <span className="text-slate-500">Créé le {new Date(user.createdAt).toLocaleDateString('fr-FR')} à {new Date(user.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={user.isActive ? 'success' : 'danger'}>
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                  <span className="text-slate-500 text-xl">→</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
