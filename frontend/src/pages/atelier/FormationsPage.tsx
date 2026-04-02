import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Form';
import { LoadingSpinner, EmptyState } from '../../components/ui/Loading';
import type { Formation } from '../../types/atelier';

// Données de démonstration
const mockFormations: Formation[] = [
  {
    id: '1',
    titre: 'Couture Débutant',
    description: 'Apprenez les bases de la couture',
    niveau: 'DEBUTANT',
    dureeHeures: 20,
    prix: 25000,
    maxParticipants: 10,
    dateDebut: '2024-02-01',
    dateFin: '2024-02-15',
    active: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    titre: 'Patronnage Avancé',
    description: 'Création de patrons complexes',
    niveau: 'AVANCE',
    dureeHeures: 30,
    prix: 40000,
    maxParticipants: 8,
    dateDebut: '2024-03-01',
    dateFin: '2024-03-20',
    active: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

export function FormationsPage() {
  const [search, setSearch] = useState('');
  const [isLoading] = useState(false);

  const filteredFormations = mockFormations.filter(f =>
    f.titre.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner className="py-12" />;

  return (
    <div>
      <PageHeader
        title="Formations"
        description="Gestion des formations en couture"
      />

      <div className="flex justify-between items-center mb-6">
        <Input
          placeholder="Rechercher une formation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Link to="/atelier/formations/new">
          <Button>Nouvelle formation</Button>
        </Link>
      </div>

      {filteredFormations.length === 0 ? (
        <EmptyState message="Aucune formation trouvée" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFormations.map((formation) => (
            <FormationCard key={formation.id} formation={formation} />
          ))}
        </div>
      )}
    </div>
  );
}

function FormationCard({ formation }: { formation: Formation }) {
  const niveauColors: Record<string, string> = {
    DEBUTANT: 'bg-green-500/20 text-green-400',
    INTERMEDIAIRE: 'bg-yellow-500/20 text-yellow-400',
    AVANCE: 'bg-red-500/20 text-red-400',
  };

  return (
    <Card hoverable>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold">{formation.titre}</h3>
          <span className={`px-2 py-1 text-xs rounded-full ${niveauColors[formation.niveau]}`}>
            {formation.niveau}
          </span>
        </div>
        <p className="text-slate-400 text-sm mb-4">{formation.description}</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Durée:</span>
            <span>{formation.dureeHeures} heures</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Prix:</span>
            <span className="font-medium">{formation.prix.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Participants max:</span>
            <span>{formation.maxParticipants}</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500">
            Du {new Date(formation.dateDebut!).toLocaleDateString()} au {new Date(formation.dateFin!).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
