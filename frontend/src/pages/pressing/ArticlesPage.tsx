import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Form';
import { LoadingSpinner, EmptyState } from '../../components/ui/Loading';
import type { PressingArticle } from '../../types/pressing';

// Données de démonstration
const mockArticles: PressingArticle[] = [
  {
    id: '1',
    nom: 'Chemise',
    categorie: 'Haut',
    description: 'Chemise en coton ou synthétique',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    nom: 'Pantalon',
    categorie: 'Bas',
    description: 'Pantalon en tissu divers',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '3',
    nom: 'Robe',
    categorie: 'Robe',
    description: 'Robe courte ou longue',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '4',
    nom: 'Veste',
    categorie: 'Veste',
    description: 'Veste légère ou mi-saison',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '5',
    nom: 'Jupe',
    categorie: 'Bas',
    description: 'Jupe courte ou longue',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
];

const categories = ['Tous', 'Haut', 'Bas', 'Robe', 'Veste'];

export function ArticlesPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [isLoading] = useState(false);

  const filteredArticles = mockArticles.filter(a => {
    const matchesSearch = a.nom.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || a.categorie === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) return <LoadingSpinner className="py-12" />;

  return (
    <div>
      <PageHeader
        title="Articles Lavables"
        description="Gestion des types d'articles pour le pressing"
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Rechercher un article..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <Link to="/pressing/articles/new">
          <Button>Nouvel article</Button>
        </Link>
      </div>

      {filteredArticles.length === 0 ? (
        <EmptyState message="Aucun article trouvé" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

function ArticleCard({ article }: { article: PressingArticle }) {
  return (
    <Card hoverable>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold">{article.nom}</h3>
          <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
            {article.categorie}
          </span>
        </div>
        <p className="text-slate-400 text-sm">{article.description}</p>
      </CardContent>
    </Card>
  );
}
