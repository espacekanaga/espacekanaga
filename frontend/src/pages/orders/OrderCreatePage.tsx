import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { ordersApi } from '../../api/orders';
import { clientsApi } from '../../api/clients';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Input, Select, TextArea } from '../../components/ui/Form';
import type { Client } from '../../types/client';
import type { CreateOrderRequest } from '../../types/order';

export function OrderCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [step, setStep] = useState<'client' | 'details' | 'new-client'>('client');
  const [formError, setFormError] = useState<string | null>(null);
  
  // Get default type from URL parameter (for atelier/pressing context)
  const defaultType = searchParams.get('type') as 'pressing' | 'couture' | null;
  
  const [formData, setFormData] = useState({
    clientId: '',
    type: defaultType || 'pressing' as 'pressing' | 'couture',
    prixTotal: 0,
    // Pressing fields
    typeVetement: '',
    quantite: 1,
    typeService: 'standard',
    instructions: '',
    // Couture fields
    typeServiceCouture: 'sur_mesure' as 'sur_mesure' | 'retouche',
    description: '',
    modelImage: null as File | null,
    tissu: '',
    deadline: '',
    // Mesures couture
    mesures: {} as Record<string, number | string>,
  });
  
  // New client form
  const [newClient, setNewClient] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    clientType: 'both' as 'pressing' | 'atelier' | 'both',
  });

  // Load clients when type is determined or changes
  useEffect(() => {
    if (formData.type) {
      loadClients();
    }
  }, [formData.type]);

  // Update new client form type when order type changes
  useEffect(() => {
    if (formData.type === 'couture') {
      setNewClient(prev => ({ ...prev, clientType: 'atelier' }));
    } else if (formData.type === 'pressing') {
      setNewClient(prev => ({ ...prev, clientType: 'pressing' }));
    }
  }, [formData.type]);

  // Redirect to client selection if no client is selected
  useEffect(() => {
    if (step === 'details' && !formData.clientId) {
      setStep('client');
    }
  }, [step, formData.clientId]);

  // Load clients based on order type
  const loadClients = async () => {
    try {
      const clientType = formData.type === 'couture' ? 'atelier' : 'pressing';
      // Backend now properly handles type filter including 'both' clients
      const response = await clientsApi.getAll({ limit: 50, type: clientType });
      setClients(response.data);
    } catch (err) {
      console.error('Failed to load clients:', err);
      showError('Erreur lors du chargement des clients');
    }
  };

  const searchClients = async (term: string) => {
    try {
      if (term.length === 0) {
        // Reload all clients if search is cleared
        await loadClients();
        return;
      }
      
      if (term.length < 2) return;
      
      // Filter clients based on order type
      const clientType = formData.type === 'couture' ? 'atelier' : 'pressing';
      // Backend now properly handles both search AND type filter together
      const response = await clientsApi.getAll({ search: term, limit: 10, type: clientType });
      setClients(response.data);
    } catch (err) {
      console.error(err);
      showError('Erreur lors de la recherche des clients');
    }
  };

  const handleClientSelect = (client: Client) => {
    setFormData({ ...formData, clientId: client.id });
    setStep('details');
  };

  const handleCreateNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const client = await clientsApi.create(newClient);
      showSuccess('Client créé avec succès');
      setFormData({ ...formData, clientId: client.id });
      setStep('details');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors de la création du client');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    // Validation
    if (!formData.clientId) {
      setFormError('Veuillez sélectionner un client');
      setIsLoading(false);
      return;
    }

    if (formData.type === 'pressing' && !formData.typeVetement) {
      setFormError('Veuillez indiquer le type de vêtement');
      setIsLoading(false);
      return;
    }

    if (formData.type === 'couture' && !formData.description) {
      setFormError('Veuillez ajouter une description');
      setIsLoading(false);
      return;
    }

    if (formData.prixTotal <= 0) {
      setFormError('Veuillez indiquer un prix valide');
      setIsLoading(false);
      return;
    }

    try {
      let orderRequest: CreateOrderRequest;
      
      // Helper to convert File to base64
      const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
      };
      
      if (formData.type === 'pressing') {
        orderRequest = {
          clientId: formData.clientId,
          type: 'pressing',
          prixTotal: formData.prixTotal,
          pressing: {
            typeVetement: formData.typeVetement,
            quantite: formData.quantite,
            typeService: formData.typeService,
            instructions: formData.instructions,
          },
        };
      } else {
        // Convert image to base64 if present
        let modelImageBase64: string | undefined;
        if (formData.modelImage) {
          modelImageBase64 = await fileToBase64(formData.modelImage);
        }
        
        orderRequest = {
          clientId: formData.clientId,
          type: 'couture',
          prixTotal: formData.prixTotal,
          couture: {
            typeService: formData.typeServiceCouture,
            description: formData.description,
            tissu: formData.tissu,
            deadline: formData.deadline || undefined,
            modelImage: modelImageBase64,
          },
        };
      }
      
      const order = await ordersApi.create(orderRequest);
      showSuccess('Commande créée avec succès');
      navigate(`/orders/${order.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création';
      setFormError(message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'new-client') {
    return (
      <div>
        <PageHeader title="Nouveau Client">
          <Button variant="secondary" onClick={() => setStep('client')}>
            Retour
          </Button>
        </PageHeader>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Informations du nouveau client</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateNewClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="newClientPrenom"
                  name="newClientPrenom"
                  label="Prénom *"
                  value={newClient.prenom}
                  onChange={(e) => setNewClient({ ...newClient, prenom: e.target.value })}
                  required
                />
                <Input
                  id="newClientNom"
                  name="newClientNom"
                  label="Nom *"
                  value={newClient.nom}
                  onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })}
                  required
                />
              </div>
              <Input
                id="newClientTelephone"
                name="newClientTelephone"
                label="Téléphone *"
                type="tel"
                value={newClient.telephone}
                onChange={(e) => setNewClient({ ...newClient, telephone: e.target.value })}
                required
              />
              <Input
                id="newClientEmail"
                name="newClientEmail"
                label="Email"
                type="email"
                value={newClient.email}
                onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
              />
              <Input
                id="newClientAdresse"
                name="newClientAdresse"
                label="Adresse"
                value={newClient.adresse}
                onChange={(e) => setNewClient({ ...newClient, adresse: e.target.value })}
              />
              <div className="flex gap-2">
                <Button type="submit" isLoading={isLoading}>
                  Créer le client
                </Button>
                <Button type="button" variant="secondary" onClick={() => setStep('client')}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'client') {
    return (
      <div>
        <PageHeader title="Nouvelle Commande - Sélection Client">
          <Button variant="secondary" onClick={() => navigate('/orders')}>
            Annuler
          </Button>
        </PageHeader>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Rechercher un client</h2>
              <Button onClick={() => setStep('new-client')} variant="secondary" size="sm">
                + Nouveau client
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Rechercher par téléphone ou nom..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                searchClients(e.target.value);
              }}
              id="clientSearch"
              name="clientSearch"
            />
            <div className="mt-4 space-y-2">
              {clients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className="p-4 rounded-lg border border-slate-700/50 cursor-pointer hover:bg-slate-800/60"
                >
                  <p className="font-medium">
                    {client.prenom} {client.nom}
                  </p>
                  <p className="text-sm text-slate-400">{client.telephone}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Nouvelle Commande - Détails">
        <Button variant="secondary" onClick={() => setStep('client')}>
          Retour
        </Button>
      </PageHeader>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {formError}
              </div>
            )}
            <Select
              id="orderType"
              name="orderType"
              label="Type de commande"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'pressing' | 'couture' })}
              options={[
                { value: 'pressing', label: 'Pressing' },
                { value: 'couture', label: 'Couture' },
              ]}
            />

            {formData.type === 'pressing' ? (
              <>
                <Input
                  id="typeVetement"
                  name="typeVetement"
                  label="Type de vêtement"
                  value={formData.typeVetement}
                  onChange={(e) => setFormData({ ...formData, typeVetement: e.target.value })}
                  required
                />
                <Input
                  id="quantite"
                  name="quantite"
                  label="Quantité"
                  type="number"
                  min={1}
                  value={formData.quantite}
                  onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) })}
                  required
                />
                <Select
                  id="typeService"
                  name="typeService"
                  label="Type de service"
                  value={formData.typeService}
                  onChange={(e) => setFormData({ ...formData, typeService: e.target.value })}
                  options={[
                    { value: 'standard', label: 'Standard' },
                    { value: 'express', label: 'Express' },
                    { value: 'premium', label: 'Premium' },
                  ]}
                />
                <TextArea
                  id="instructions"
                  name="instructions"
                  label="Instructions spéciales"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                />
              </>
            ) : (
              <>
                <Select
                  id="typeServiceCouture"
                  name="typeServiceCouture"
                  label="Type de service couture"
                  value={formData.typeServiceCouture}
                  onChange={(e) => setFormData({ ...formData, typeServiceCouture: e.target.value as 'sur_mesure' | 'retouche' })}
                  options={[
                    { value: 'sur_mesure', label: 'Sur mesure' },
                    { value: 'retouche', label: 'Retouche' },
                  ]}
                />
                
                {/* Upload image du modèle */}
                <div className="w-full">
                  <label className="input-label">Modèle (image)</label>
                  <div className="mt-2">
                    {formData.modelImage ? (
                      <div className="relative inline-block">
                        <img
                          src={URL.createObjectURL(formData.modelImage)}
                          alt="Modèle"
                          className="h-40 w-auto rounded-lg border border-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, modelImage: null })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-slate-800/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <svg className="w-8 h-8 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-slate-400">Cliquez pour ajouter une photo du modèle</p>
                          <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP</p>
                        </div>
                        <input
                          id="modelImage"
                          name="modelImage"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setFormData({ ...formData, modelImage: file });
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <TextArea
                  id="description"
                  name="description"
                  label="Description / Notes"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détails sur le modèle, ajustements souhaités..."
                />
                
                <Input
                  id="tissu"
                  name="tissu"
                  label="Type de tissu"
                  value={formData.tissu}
                  onChange={(e) => setFormData({ ...formData, tissu: e.target.value })}
                  placeholder="Coton, soie, lin, etc."
                />
                
                <Input
                  id="deadline"
                  name="deadline"
                  label="Date de livraison souhaitée"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </>
            )}

            <Input
              id="prixTotal"
              name="prixTotal"
              label="Prix total (FCFA)"
              type="number"
              min={0}
              value={formData.prixTotal}
              onChange={(e) => setFormData({ ...formData, prixTotal: parseFloat(e.target.value) })}
              required
            />

            <div className="flex gap-2">
              <Button type="submit" isLoading={isLoading}>
                Créer la commande
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/orders')}>
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
