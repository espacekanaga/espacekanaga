import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Form';
import { LoadingSpinner, EmptyState } from '../../components/ui/Loading';
import type { StockTissu } from '../../types/atelier';

// Données de démonstration
const mockStock: StockTissu[] = [
  {
    id: '1',
    nom: 'Coton wax africain',
    type: 'Wax',
    couleur: 'Multicolore',
    quantite: 50,
    unite: 'METRE',
    prixUnitaire: 5000,
    fournisseur: 'Fournisseur A',
    dateAchat: '2024-01-10',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-10',
  },
  {
    id: '2',
    nom: 'Satin de soie',
    type: 'Satin',
    couleur: 'Rouge',
    quantite: 15,
    unite: 'METRE',
    prixUnitaire: 8000,
    fournisseur: 'Fournisseur B',
    dateAchat: '2024-01-05',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-05',
  },
];

export function StockTissuPage() {
  const [search, setSearch] = useState('');
  const [isLoading] = useState(false);

  const filteredStock = mockStock.filter(s =>
    s.nom.toLowerCase().includes(search.toLowerCase()) ||
    s.type.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner className="py-12" />;

  return (
    <div>
      <PageHeader
        title="Stock de Tissus"
        description="Gestion de l'inventaire des tissus"
      />

      <div className="flex justify-between items-center mb-6">
        <Input
          placeholder="Rechercher un tissu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Link to="/atelier/stock/new">
          <Button>Ajouter un tissu</Button>
        </Link>
      </div>

      {filteredStock.length === 0 ? (
        <EmptyState message="Aucun tissu en stock" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStock.map((item) => (
            <StockCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function StockCard({ item }: { item: StockTissu }) {
  const isLowStock = item.quantite < 10;

  return (
    <Card hoverable className={isLowStock ? 'border-red-500/50' : ''}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold">{item.nom}</h3>
          {isLowStock && (
            <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
              Stock bas
            </span>
          )}
        </div>
        <p className="text-slate-400 text-sm mb-4">{item.type} - {item.couleur}</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Quantité:</span>
            <span className={isLowStock ? 'text-red-400 font-medium' : ''}>
              {item.quantite} {item.unite.toLowerCase()}s
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Prix unitaire:</span>
            <span>{item.prixUnitaire.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Fournisseur:</span>
            <span>{item.fournisseur || '-'}</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500">
            Acheté le {new Date(item.dateAchat!).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
