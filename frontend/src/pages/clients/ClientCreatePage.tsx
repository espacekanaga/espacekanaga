import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import type { CreateClientRequest } from '../../types/client';
import type { Measurement } from '../../types/measurement';
import { clientTypeLabels, standardMeasurementFields } from '../../types/client';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Input, TextArea, Select } from '../../components/ui/Form';
import { Badge } from '../../components/ui/Badge';
import { clientsApi } from '../../api/clients';
import { measurementsApi } from '../../api/measurements';

export function ClientCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') as 'pressing' | 'atelier' | 'both' | null;
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [existingClients, setExistingClients] = useState<Array<{ id: string; prenom: string; nom: string; telephone: string; clientType: string }>>([]);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [existingMeasurements, setExistingMeasurements] = useState<Measurement[]>([]);

  const [formData, setFormData] = useState<CreateClientRequest>({
    prenom: '',
    nom: '',
    telephone: '',
    adresse: '',
    notes: '',
    clientType: defaultType || 'both',
    measurements: {},
  });

  // Load all clients for measurement selection
  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await clientsApi.getAll({ limit: 1000 });
        const atelierClients = response.data.filter(
          (c) => c.clientType === 'atelier' || c.clientType === 'both'
        );
        setExistingClients(atelierClients);
      } catch (err) {
        console.error('Failed to load clients:', err);
      }
    };
    loadClients();
  }, []);

  // Load measurements when a client is selected
  const handleLoadClientMeasurements = async (clientId: string) => {
    if (!clientId) {
      setExistingMeasurements([]);
      setSelectedClientId('');
      return;
    }
    setSelectedClientId(clientId);
    try {
      const measurements = await measurementsApi.getByClient(clientId);
      setExistingMeasurements(measurements);
    } catch (err) {
      console.error('Failed to load measurements:', err);
      setExistingMeasurements([]);
    }
  };

  // Apply selected measurement to form
  const handleApplyMeasurement = (measurement: Measurement) => {
    const filteredData: Record<string, number> = {};
    Object.entries(measurement.data).forEach(([key, value]) => {
      if (typeof value === 'number' && !isNaN(value)) {
        filteredData[key] = value;
      }
    });
    setFormData((prev) => ({
      ...prev,
      measurements: filteredData,
    }));
    showSuccess('Mensurations appliquées');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const filteredMeasurements: Record<string, number> = {};
      if (formData.measurements) {
        Object.entries(formData.measurements).forEach(([key, value]) => {
          if (value && value > 0) {
            filteredMeasurements[key] = Number(value);
          }
        });
      }

      const clientData: CreateClientRequest = {
        ...formData,
        measurements: Object.keys(filteredMeasurements).length > 0 ? filteredMeasurements : undefined,
      };

      console.log('[DEBUG] Sending client data:', JSON.stringify(clientData, null, 2));

      const client = await clientsApi.create(clientData);
      console.log('[DEBUG] Response from server:', JSON.stringify(client, null, 2));
      
      showSuccess('Client créé avec succès');
      navigate(`/clients/${client.id}`);
    } catch (err) {
      console.error('[DEBUG] Error creating client:', err);
      showError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMeasurementChange = (name: string, value: string) => {
    const numValue = value === '' ? 0 : Number(value);
    setFormData((prev) => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [name]: numValue,
      },
    }));
  };

  const needsMeasurements = formData.clientType === 'atelier' || formData.clientType === 'both';

  return (
    <div>
      <PageHeader title="Nouveau Client">
        <Button variant="secondary" onClick={() => navigate('/clients')}>
          Retour
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Informations du client</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Selection */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <label className="block text-sm font-medium mb-3">Service attribué *</label>
              <div className="flex flex-wrap gap-3">
                {(['pressing', 'atelier', 'both'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, clientType: type })}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      formData.clientType === type
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {clientTypeLabels[type]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {formData.clientType === 'pressing' && 'Ce client aura accès uniquement aux services de pressing'}
                {formData.clientType === 'atelier' && 'Ce client aura accès uniquement aux services d\'atelier'}
                {formData.clientType === 'both' && 'Ce client aura accès aux services de pressing et d\'atelier'}
              </p>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom *"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                required
              />
              <Input
                label="Nom *"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>
            <Input
              label="Téléphone *"
              type="tel"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              required
            />
            <Input
              label="Adresse"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
            />
            <TextArea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />

            {/* Measurements Section - Only for Atelier clients */}
            {needsMeasurements && (
              <div className="border-t border-slate-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <RulerIcon className="w-5 h-5" />
                    Mensurations
                  </h3>
                  <Badge variant="info">Atelier</Badge>
                </div>

                {/* Load existing measurements from another client */}
                <div className="bg-slate-800/30 p-4 rounded-lg mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Copier les mensurations d'un client existant (optionnel)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Select
                      value={selectedClientId}
                      onChange={(e) => handleLoadClientMeasurements(e.target.value)}
                      options={[
                        { value: '', label: 'Sélectionner un client...' },
                        ...existingClients.map((c) => ({
                          value: c.id,
                          label: `${c.prenom} ${c.nom} (${c.telephone})`,
                        })),
                      ]}
                    />
                    {existingMeasurements.length > 0 && (
                      <Select
                        value=""
                        onChange={(e) => {
                          const measurement = existingMeasurements.find((m) => m.id === e.target.value);
                          if (measurement) handleApplyMeasurement(measurement);
                        }}
                        options={[
                          { value: '', label: 'Choisir une mensuration...' },
                          ...existingMeasurements.map((m) => ({
                            value: m.id,
                            label: `Mensuration du ${new Date(m.createdAt).toLocaleDateString('fr-FR')}`,
                          })),
                        ]}
                      />
                    )}
                  </div>
                </div>

                {/* Measurement Fields */}
                <div className="bg-slate-800/30 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium">Saisir les mensurations</label>
                    <button
                      type="button"
                      onClick={() => setShowMeasurements(!showMeasurements)}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      {showMeasurements ? 'Masquer' : 'Afficher'} tous les champs
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {standardMeasurementFields.map((field) => {
                      const value = formData.measurements?.[field.name];
                      const hasValue = value && value > 0;
                      const isPrimary = ['epaule', 'poitrine', 'taille', 'hanche'].includes(field.name);
                      const shouldShow = showMeasurements || hasValue || isPrimary;

                      if (!shouldShow) return null;

                      return (
                        <div key={field.name}>
                          <label className="block text-xs text-slate-400 mb-1">
                            {field.label}
                            {isPrimary && <span className="text-red-400 ml-1">*</span>}
                          </label>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.1"
                              value={value || ''}
                              onChange={(e) => handleMeasurementChange(field.name, e.target.value)}
                              placeholder="0"
                              className="pr-8"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                              {field.unite}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-2 pt-4 border-t border-slate-700">
              <Button type="submit" isLoading={isLoading}>
                Créer le client
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/clients')}>
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function RulerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
