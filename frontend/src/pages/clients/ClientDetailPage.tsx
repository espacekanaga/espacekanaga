import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../hooks/useToast';
import { useForm } from '../../hooks/useForm';
import { clientsApi } from '../../api/clients';
import { measurementsApi } from '../../api/measurements';
import { ordersApi } from '../../api/orders';
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
    <div className="pb-24">
      {/* Header avec bouton retour */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors mb-4"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span className="text-sm font-medium">Retour à la liste</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {client.prenom} {client.nom}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
              <PhoneIcon className="w-4 h-4" />
              {client.telephone}
            </p>
          </div>
          <Badge 
            variant={client.clientType === 'atelier' ? 'info' : client.clientType === 'pressing' ? 'warning' : 'success'}
            className="text-sm px-3 py-1"
          >
            {clientTypeLabels[client.clientType || 'both']}
          </Badge>
        </div>
      </div>

      {/* Tabs améliorés */}
      <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
        <nav className="flex gap-2">
          <TabButton
            active={activeTab === 'info'}
            onClick={() => setActiveTab('info')}
            label="Informations"
            icon={UserIcon}
          />
          <TabButton
            active={activeTab === 'measurements'}
            onClick={() => setActiveTab('measurements')}
            label={`Mensurations (${measurements?.length || 0})`}
            icon={RulerIcon}
          />
          <TabButton
            active={activeTab === 'orders'}
            onClick={() => setActiveTab('orders')}
            label={`Commandes (${orders?.length || 0})`}
            icon={ShoppingBagIcon}
          />
        </nav>
      </div>

      {activeTab === 'info' && (
        <Card className="shadow-sm border-slate-200 dark:border-slate-700">
          <CardContent className="p-6">
            {isEditing ? (
              <form onSubmit={form.handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </form>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
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
          <Card className="max-w-md w-full mx-4 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <TrashIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Confirmer la suppression</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Êtes-vous sûr de vouloir supprimer le client <strong className="text-slate-900 dark:text-slate-100">{client.prenom} {client.nom}</strong> ?
                Cette action est irréversible.
              </p>
              <div className="flex gap-3">
                <Button variant="danger" onClick={handleDelete} className="flex-1">
                  Supprimer
                </Button>
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer sticky avec actions */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-white/80 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 p-4 z-40">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Client créé le {new Date(client.createdAt).toLocaleDateString('fr-FR')}
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={form.handleSubmit}
                  isLoading={form.isSubmitting}
                >
                  <SaveIcon className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
                <Button
                  onClick={() => setIsEditing(true)}
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 py-3 px-4 font-medium text-sm transition-all rounded-t-lg ${
        active
          ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
          : 'border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-4 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-lg">
      <span className="text-slate-500 dark:text-slate-400 font-medium">{label}</span>
      <span className="font-semibold text-slate-900 dark:text-slate-100">{value}</span>
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
          <Card className="max-w-md w-full mx-4 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <TrashIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Confirmer la suppression</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Êtes-vous sûr de vouloir supprimer <strong className="text-slate-900 dark:text-slate-100">{selectedMeasurements.size}</strong> mensuration(s) ?
                Cette action est irréversible.
              </p>
              <div className="flex gap-3">
                <Button variant="danger" onClick={handleDeleteSelected} isLoading={isLoading} className="flex-1">
                  Supprimer
                </Button>
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
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
    <div className="space-y-3">
      {orders.length === 0 ? (
        <EmptyState message="Aucune commande" />
      ) : (
        orders.map((order) => (
          <Card
            key={order.id}
            hoverable
            onClick={() => navigate(`/orders/${order.id}`)}
            className="shadow-sm border-slate-200 dark:border-slate-700"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  order.type === 'pressing' 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                }`}>
                  {order.type === 'pressing' ? <SparklesIcon className="w-5 h-5" /> : <ScissorsIcon className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Commande #{order.id.slice(-6)}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {order.type === 'pressing' ? 'Pressing' : 'Couture'} •{' '}
                    {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
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
                <span className="font-semibold text-slate-900 dark:text-slate-100">{order.prixTotal.toLocaleString()} FCFA</span>
                <ChevronRightIcon className="w-5 h-5 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// Icons
function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function RulerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function ScissorsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4.583-7.502a2.975 2.975 0 00-.123-3.326 3.003 3.003 0 00-4.996-3.342L3 14m17-4l-4.583 7.502a2.975 2.975 0 01.123 3.326 3.003 3.003 0 004.996 3.342L21 10M9 7a3 3 0 11-6 0 3 3 0 016 0zm12 0a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
