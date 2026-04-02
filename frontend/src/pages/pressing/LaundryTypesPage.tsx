import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Form';
import { LoadingSpinner, EmptyState } from '../../components/ui/Loading';
import type { PressingLaundryType } from '../../types/pressing';

// Données de démonstration
const mockLaundryTypes: PressingLaundryType[] = [
  {
    id: '1',
    nom: 'Lavage complet',
    description: 'Lavage en machine avec séchage et repassage',
    prixBase: 1500,
    dureeEstimee: 24,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    nom: 'Lavage à sec',
    description: 'Nettoyage à sec pour articles délicats',
    prixBase: 2500,
    dureeEstimee: 48,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '3',
    nom: 'Repassage',
    description: 'Repassage uniquement',
    prixBase: 500,
    dureeEstimee: 4,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

export function LaundryTypesPage() {
  const [search, setSearch] = useState('');
  const [isLoading] = useState(false);

  const filteredTypes = mockLaundryTypes.filter(t =>
    t.nom.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner className="py-12" />;

  return (
    <div>
      <PageHeader
        title="Types de Lavage"
        description="Gestion des types de lavage et services"
      />

      <div className="flex justify-between items-center mb-6">
        <Input
          placeholder="Rechercher un type de lavage..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Link to="/pressing/laundry-types/new">
          <Button>Nouveau type</Button>
        </Link>
      </div>

      {filteredTypes.length === 0 ? (
        <EmptyState message="Aucun type de lavage trouvé" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTypes.map((type) => (
            <LaundryTypeCard key={type.id} type={type} />
          ))}
        </div>
      )}
    </div>
  );
}

function LaundryTypeCard({ type }: { type: PressingLaundryType }) {
  return (
    <Card hoverable>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-2">{type.nom}</h3>
        <p className="text-slate-400 text-sm mb-4">{type.description}</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Prix de base:</span>
            <span className="font-medium">{type.prixBase.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Durée estimée:</span>
            <span>{type.dureeEstimee} heures</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
