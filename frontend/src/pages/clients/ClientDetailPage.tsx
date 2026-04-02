import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../hooks/useToast';
import { useForm } from '../../hooks/useForm';
import { clientsApi } from '../../api/clients';
import { measurementsApi } from '../../api/measurements';
import { ordersApi } from '../../api/orders';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input, TextArea, Select } from '../../components/ui/Form';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner, EmptyState } from '../../components/ui/Loading';
import type { CreateClientRequest } from '../../types/client';
import type { Measurement } from '../../types/measurement';
import type { Order } from '../../types/order';
import { clientTypeLabels } from '../../types/client';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'measurements' | 'orders'>('info');

  const {
    data: client,
    isLoading,
    error,
    refetch,
  } = useFetch(() => clientsApi.getById(id!), {
    onError: (err) => showError(err.message),
  });

  const { data: measurements } = useFetch(
    () => measurementsApi.getByClient(id!),
    { onError: () => {} }
  );

  const { data: orders } = useFetch(
    () => ordersApi.getByClient(id!),
    { onError: () => {} }
  );

  const form = useForm<CreateClientRequest>({
    initialValues: {
      nom: '',
      prenom: '',
      telephone: '',
      adresse: '',
      notes: '',
      clientType: 'both',
    },
    onSubmit: async (values) => {
      try {
        await clientsApi.update(id!, values);
        showSuccess('Client mis à jour avec succès');
        setIsEditing(false);
        refetch();
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      }
    },
  });

  // Update form values when client data loads
  useEffect(() => {
    if (client) {
      form.setValues({
        nom: client.nom || '',
        prenom: client.prenom || '',
        telephone: client.telephone || '',
        adresse: client.adresse || '',
        notes: client.notes || '',
        clientType: client.clientType || 'both',
      });
    }
  }, [client]);

  const handleDelete = async () => {
    try {
      await clientsApi.delete(id!);
      showSuccess('Client supprimé avec succès');
      navigate('/clients');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  if (isLoading) return <LoadingSpinner className="py-12" />;
  if (error || !client) return <EmptyState message="Client non trouvé" />;

  return (
    <div>
      <PageHeader title={`${client.prenom} ${client.nom}`}>
        <div className="flex gap-2">
          <Button
            variant={isEditing ? 'secondary' : 'primary'}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Annuler' : 'Modifier'}
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            Supprimer
          </Button>
        </div>
      </PageHeader>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          <TabButton
            active={activeTab === 'info'}
            onClick={() => setActiveTab('info')}
            label="Informations"
          />
          <TabButton
            active={activeTab === 'measurements'}
            onClick={() => setActiveTab('measurements')}
            label={`Mensurations (${measurements?.length || 0})`}
          />
          <TabButton
            active={activeTab === 'orders'}
            onClick={() => setActiveTab('orders')}
            label={`Commandes (${orders?.length || 0})`}
          />
        </nav>
      </div>

      {activeTab === 'info' && (
        <Card>
          <CardContent className="p-6">
            {isEditing ? (
              <form onSubmit={form.handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Prénom *"
                    value={form.values.prenom}
                    onChange={(e) => form.handleChange('prenom', e.target.value)}
                    required
                  />
                  <Input
                    label="Nom *"
                    value={form.values.nom}
                    onChange={(e) => form.handleChange('nom', e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Téléphone *"
                  value={form.values.telephone}
                  onChange={(e) => form.handleChange('telephone', e.target.value)}
                  required
                />
                <Select
                  label="Type de client"
                  value={form.values.clientType}
                  onChange={(e) => form.handleChange('clientType', e.target.value)}
                  options={[
                    { value: 'pressing', label: 'Pressing' },
                    { value: 'atelier', label: 'Atelier' },
                    { value: 'both', label: 'Les deux' },
                  ]}
                />
                <Input
                  label="Adresse"
                  value={form.values.adresse}
                  onChange={(e) => form.handleChange('adresse', e.target.value)}
                />
                <TextArea
                  label="Notes"
                  value={form.values.notes}
                  onChange={(e) => form.handleChange('notes', e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button type="submit" isLoading={form.isSubmitting}>
                    Enregistrer
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <InfoRow label="Prénom" value={client.prenom} />
                <InfoRow label="Nom" value={client.nom} />
                <InfoRow label="Téléphone" value={client.telephone} />
                <InfoRow
                  label="Type de client"
                  value={
                    <Badge variant={client.clientType === 'atelier' ? 'info' : client.clientType === 'pressing' ? 'warning' : 'success'}>
                      {clientTypeLabels[client.clientType || 'both']}
                    </Badge>
                  }
                />
                <InfoRow label="Adresse" value={client.adresse || '-'} />
                <InfoRow label="Notes" value={client.notes || '-'} />
                <InfoRow
                  label="Date de création"
                  value={new Date(client.createdAt).toLocaleDateString('fr-FR')}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'measurements' && (
        <MeasurementsTab
          measurements={measurements || []}
          clientId={id!}
          refetchClient={refetch}
        />
      )}

      {activeTab === 'orders' && (
        <OrdersTab orders={orders || []} />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Confirmer la suppression</h3>
              <p className="text-gray-600 mb-4">
                Êtes-vous sûr de vouloir supprimer le client <strong>{client.prenom} {client.nom}</strong> ?
                Cette action est irréversible.
              </p>
              <div className="flex gap-2">
                <Button variant="danger" onClick={handleDelete}>
                  Supprimer
                </Button>
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
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

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-4 px-1 border-b-2 font-medium text-sm ${
        active
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function MeasurementsTab({
  measurements,
  clientId,
  refetchClient,
}: {
  measurements: Measurement[];
  clientId: string;
  refetchClient: () => void;
}) {
  const { showSuccess, showError } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState({
    data: {} as Record<string, number>,
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Selection state for deletion
  const [selectedMeasurements, setSelectedMeasurements] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<typeof newMeasurement | null>(null);

  const handleAddMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    setPendingSubmitData(newMeasurement);
    setShowCreateConfirm(true);
  };

  const confirmCreate = async () => {
    if (!pendingSubmitData) return;
    
    setIsLoading(true);
    try {
      await measurementsApi.create({
        clientId,
        data: pendingSubmitData.data,
        notes: pendingSubmitData.notes,
      });
      showSuccess('Mensuration ajoutée avec succès');
      setShowAddForm(false);
      setShowCreateConfirm(false);
      setNewMeasurement({ data: {}, notes: '' });
      setPendingSubmitData(null);
      refetchClient();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedMeasurements);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedMeasurements(newSelection);
  };

  const selectAll = () => {
    if (selectedMeasurements.size === measurements.length) {
      setSelectedMeasurements(new Set());
    } else {
      setSelectedMeasurements(new Set(measurements.map(m => m.id)));
    }
  };

  const handleDeleteSelected = async () => {
    setIsLoading(true);
    try {
      const deletePromises = Array.from(selectedMeasurements).map(id => 
        measurementsApi.delete(id)
      );
      await Promise.all(deletePromises);
      showSuccess(`${selectedMeasurements.size} mensuration(s) supprimée(s) avec succès`);
      setSelectedMeasurements(new Set());
      setShowDeleteConfirm(false);
      refetchClient();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMeasurementValueChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setNewMeasurement(prev => ({
      ...prev,
      data: { ...prev.data, [field]: numValue }
    }));
  };

  const measurementFields = ['epaule', 'poitrine', 'taille', 'hanche', 'longueur_manche', 'longueur_pantalon', 'tour_cou', 'tour_poignet', 'tour_cheville'];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        {selectedMeasurements.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">{selectedMeasurements.size} sélectionnée(s)</span>
            <Button 
              variant="danger" 
              size="sm" 
              onClick={() => setShowDeleteConfirm(true)}
              isLoading={isLoading}
            >
              Supprimer la sélection
            </Button>
          </div>
        )}
        <div className="flex-1"></div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Annuler' : 'Nouvelle mensuration'}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-100">Ajouter une mensuration</h3>
            <form onSubmit={handleAddMeasurement} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {measurementFields.map(field => (
                  <div key={field} className="space-y-1">
                    <label className="block text-sm font-semibold text-[#7dd3fc]">
                      {field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newMeasurement.data[field] || ''}
                      onChange={(e) => handleMeasurementValueChange(field, e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all"
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-[#7dd3fc]">Notes</label>
                <textarea
                  value={newMeasurement.notes}
                  onChange={(e) => setNewMeasurement(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800/50 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all resize-none"
                  placeholder="Notes additionnelles..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" isLoading={isLoading}>
                  Enregistrer
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-slate-100">Confirmer la suppression</h3>
              <p className="text-slate-400 mb-4">
                Êtes-vous sûr de vouloir supprimer <strong className="text-slate-200">{selectedMeasurements.size}</strong> mensuration(s) ?
                Cette action est irréversible.
              </p>
              <div className="flex gap-2">
                <Button variant="danger" onClick={handleDeleteSelected} isLoading={isLoading}>
                  Supprimer
                </Button>
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Confirmation Modal */}
      {showCreateConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2 text-slate-100">Confirmer l'ajout</h3>
              <p className="text-slate-400 mb-4">
                Voulez-vous enregistrer cette nouvelle mensuration avec <strong className="text-slate-200">{Object.keys(pendingSubmitData?.data || {}).length}</strong> mesures ?
              </p>
              <div className="flex gap-2">
                <Button onClick={confirmCreate} isLoading={isLoading}>
                  Confirmer
                </Button>
                <Button variant="secondary" onClick={() => {
                  setShowCreateConfirm(false);
                  setPendingSubmitData(null);
                }}>
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {measurements.length === 0 ? (
        <EmptyState message="Aucune mensuration enregistrée" />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <input
              type="checkbox"
              checked={selectedMeasurements.size === measurements.length && measurements.length > 0}
              onChange={selectAll}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/20"
            />
            <span className="text-sm text-slate-400">Tout sélectionner</span>
          </div>
          {measurements.map((measurement) => (
            <Card key={measurement.id} hoverable className={selectedMeasurements.has(measurement.id) ? 'ring-2 ring-cyan-500/50' : ''}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedMeasurements.has(measurement.id)}
                      onChange={() => toggleSelection(measurement.id)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/20"
                    />
                    <div>
                      <p className="font-medium text-slate-100">
                        Mensuration du {new Date(measurement.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      {measurement.notes && (
                        <p className="text-sm text-slate-500 mt-1">{measurement.notes}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="info">{Object.keys(measurement.data).length} mesures</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {Object.entries(measurement.data).map(([key, value]) => (
                    <div key={key} className="bg-slate-800/50 p-2 rounded border border-slate-700/50">
                      <span className="text-xs text-[#7dd3fc] block mb-1">{key.replace('_', ' ')}</span>
                      <p className="font-medium text-slate-100">{value} cm</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function OrdersTab({ orders }: { orders: Order[] }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      {orders.length === 0 ? (
        <EmptyState message="Aucune commande" />
      ) : (
        orders.map((order) => (
          <Card
            key={order.id}
            hoverable
            onClick={() => navigate(`/orders/${order.id}`)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Commande #{order.id.slice(-6)}</p>
                <p className="text-sm text-gray-500">
                  {order.type === 'pressing' ? 'Pressing' : 'Couture'} •{' '}
                  {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Badge
                  variant={
                    order.status === 'livre'
                      ? 'success'
                      : order.status === 'en_attente'
                        ? 'warning'
                        : 'info'
                  }
                >
                  {order.status.replace('_', ' ')}
                </Badge>
                <span className="font-medium">{order.prixTotal.toLocaleString()} FCFA</span>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
