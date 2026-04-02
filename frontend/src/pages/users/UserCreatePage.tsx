import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { usersApi } from '../../api/users';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Form';

export function UserCreatePage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    password: '',
    role: 'EMPLOYEE' as 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE',
    adresse: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await usersApi.create(formData);
      showSuccess('Utilisateur créé avec succès');
      navigate('/users');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Nouvel Utilisateur">
        <Button variant="secondary" onClick={() => navigate('/users')}>
          Annuler
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Informations de l'utilisateur</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom"
                value={formData.prenom}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, prenom: e.target.value })
                }
                required
              />
              <Input
                label="Nom"
                value={formData.nom}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
                required
              />
            </div>
            <Input
              label="Téléphone (requis)"
              type="tel"
              value={formData.telephone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, telephone: e.target.value })
              }
              required
            />
            <Input
              label="Email (facultatif)"
              type="email"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <Select
              label="Rôle"
              value={formData.role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFormData({ ...formData, role: e.target.value as 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' })
              }
              options={[
                { value: 'EMPLOYEE', label: 'Employé' },
                { value: 'ADMIN', label: 'Administrateur' },
                { value: 'SUPER_ADMIN', label: 'Super Admin' },
              ]}
              required
            />
            <Input
              label="Mot de passe"
              type="password"
              value={formData.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
            <Input
              label="Adresse (facultatif)"
              value={formData.adresse}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, adresse: e.target.value })
              }
            />
            <div className="flex gap-2">
              <Button type="submit" isLoading={isLoading}>
                Créer l'utilisateur
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/users')}>
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
