import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { measurementFieldsApi } from '../../api/measurements';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import type { MeasurementField } from '../../types/measurement';

export function MeasurementFieldsPage() {
  const navigate = useNavigate();
  const [fields, setFields] = useState<MeasurementField[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      setIsLoading(true);
      const response = await measurementFieldsApi.getAll({ limit: 100 });
      setFields(response.data);
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
      <PageHeader title="Champs de Mensuration" description="Configuration des mensurations">
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>Retour</Button>
        <Button onClick={() => navigate('/measurement-fields/new')}>Nouveau champ</Button>
      </PageHeader>

      <div className="space-y-2">
        {fields.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucun champ de mensuration configuré
          </div>
        ) : (
          fields.map((field) => (
            <Card
              key={field.id}
              onClick={() => navigate(`/measurement-fields/${field.id}`)}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{field.label}</p>
                  <p className="text-sm text-gray-500">
                    {field.name} • {field.type === 'number' ? 'Numérique' : 'Texte'}
                    {field.unite && ` • Unité: ${field.unite}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={field.isActive ? 'success' : 'default'}>
                    {field.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                  <span className="text-gray-400">→</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
