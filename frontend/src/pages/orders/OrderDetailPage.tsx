import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ordersApi } from '../../api/orders';
import { API_ORIGIN } from '../../api/client';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Form';
import { useAuth } from '../../context/AuthContext';
import type { Order, OrderStatus } from '../../types/order';

const statusLabels: Record<OrderStatus, string> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  termine: 'Terminé',
  livre: 'Livré',
};

const statusOptions: OrderStatus[] = ['en_attente', 'en_cours', 'termine', 'livre'];

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasPressingAccess, hasAtelierAccess, isSuperAdmin } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      const data = await ordersApi.getById(id!);
      setOrder(data);
      setNewStatus(data.status);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === order?.status) return;
    try {
      setIsUpdating(true);
      await ordersApi.updateStatus(id!, { status: newStatus });
      await loadOrder();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

  const handleGenerateInvoice = async () => {
    if (!order) return;
    const canModifyLocal =
      isSuperAdmin || (order.type === 'pressing' ? hasPressingAccess : hasAtelierAccess);
    if (!canModifyLocal) return;
    try {
      setIsGeneratingInvoice(true);
      const result = await ordersApi.generateInvoice(id!);
      setInvoiceUrl(result.downloadUrl);
      alert(order.invoice ? 'Facture régénérée avec succès' : 'Facture générée avec succès');
      await loadOrder(); // Reload to get updated invoice info
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!order) return;
    const url = invoiceUrl || (order.invoice?.filePath ? `${API_ORIGIN}${order.invoice.filePath}` : null);
    const message = url 
      ? `Bonjour ${order.client.prenom},\n\nVotre facture est prête.\nMontant: ${order.prixTotal.toLocaleString()} FCFA\n\nTéléchargez votre facture ici: ${url}\n\nMerci de votre confiance.\nEspace Kanaga - Pressing & Couture`
      : `Bonjour ${order.client.prenom},\n\nVotre commande #${order.id.slice(-6)} est ${statusLabels[order.status].toLowerCase()}.\nMontant: ${order.prixTotal.toLocaleString()} FCFA\n\nEspace Kanaga - Pressing & Couture`;
    const encoded = encodeURIComponent(message);
    const cleanPhone = order.client.telephone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-12 text-gray-500">Commande non trouvée</div>;
  }

  const canModify =
    isSuperAdmin || (order.type === 'pressing' ? hasPressingAccess : hasAtelierAccess);

  return (
    <div>
      <PageHeader title={`Commande #${order.id.slice(-6)}`}>
        <Button variant="whatsapp" onClick={handleWhatsAppShare}>
          WhatsApp
        </Button>
        {order.invoice?.filePath ? (
          <>
            <Button
              variant="secondary"
              onClick={() => {
                const url = invoiceUrl || `${API_ORIGIN}${order.invoice?.filePath}`;
                if (url) window.open(url, '_blank');
              }}
            >
              Voir facture
            </Button>
            <Button onClick={handleGenerateInvoice} disabled={!canModify} isLoading={isGeneratingInvoice}>
              Régénérer facture
            </Button>
          </>
        ) : (
          <Button onClick={handleGenerateInvoice} disabled={!canModify} isLoading={isGeneratingInvoice}>
            Générer facture
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4 text-slate-900 dark:text-slate-100">Informations client</h3>
            <InfoRow label="Nom" value={`${order.client.prenom} ${order.client.nom}`} />
            <InfoRow label="Téléphone" value={order.client.telephone} />
            
            {order.createdBy && (
              <>
                <h3 className="text-lg font-medium mb-4 mt-6 text-slate-900 dark:text-slate-100">Traité par</h3>
                <InfoRow label="Employé" value={`${order.createdBy.prenom} ${order.createdBy.nom}`} />
                <InfoRow label="Rôle" value={order.createdBy.role} />
              </>
            )}
            
            <h3 className="text-lg font-medium mb-4 mt-6 text-slate-900 dark:text-slate-100">Détails commande</h3>
            <InfoRow label="Type" value={order.type === 'pressing' ? 'Pressing' : 'Couture'} />
            <InfoRow label="Date" value={new Date(order.createdAt).toLocaleDateString('fr-FR')} />
            <InfoRow label="Prix total" value={`${order.prixTotal.toLocaleString()} FCFA`} />
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Statut
              </label>
              {!canModify && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Vous n&apos;avez pas la permission de modifier cette commande.
                </p>
              )}
              <div className="flex gap-2">
                <Select
                  value={newStatus}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewStatus(e.target.value as OrderStatus)}
                  options={statusOptions.map((s) => ({ value: s, label: statusLabels[s] }))}
                  disabled={!canModify}
                />
                <Button
                  onClick={handleStatusChange}
                  isLoading={isUpdating}
                  disabled={!canModify || newStatus === order.status}
                >
                  Mettre à jour
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            {order.pressing && (
              <>
                <h3 className="text-lg font-medium mb-4 text-slate-900 dark:text-slate-100">Détails Pressing</h3>
                <InfoRow label="Type vêtement" value={order.pressing.typeVetement} />
                <InfoRow label="Quantité" value={order.pressing.quantite.toString()} />
                <InfoRow label="Service" value={order.pressing.typeService} />
                {order.pressing.instructions && (
                  <InfoRow label="Instructions" value={order.pressing.instructions} />
                )}
              </>
            )}
            {order.couture && (
              <>
                <h3 className="text-lg font-medium mb-4 text-slate-900 dark:text-slate-100">Détails Couture</h3>
                <InfoRow label="Type service" value={order.couture.typeService === 'retouche' ? 'Retouche' : 'Sur mesure'} />
                {order.couture.description && (
                  <InfoRow label="Description" value={order.couture.description} />
                )}
                {order.couture.tissu && (
                  <InfoRow label="Tissu" value={order.couture.tissu} />
                )}
                {order.couture.deadline && (
                  <InfoRow label="Deadline" value={new Date(order.couture.deadline).toLocaleDateString('fr-FR')} />
                )}
                {order.couture.measurement && (
                  <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-700/60 dark:bg-slate-900/40">
                    <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Mensurations client</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {Object.entries(order.couture.measurement.data).map(([key, value]) => (
                        <div key={key} className="rounded-xl border border-slate-200/70 bg-white px-3 py-2 dark:border-slate-700/60 dark:bg-slate-950/40">
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{key.replace(/_/g, ' ')}</p>
                          <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                    {order.couture.measurement.notes ? (
                      <p className="mt-3 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{order.couture.measurement.notes}</p>
                    ) : null}
                  </div>
                )}
                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Modele couture</p>
                  <div className="overflow-hidden rounded-2xl border border-dashed border-slate-300/70 bg-slate-50 p-4 text-center dark:border-slate-700/60 dark:bg-slate-900/40">
                    {order.couture.modelImage ? (
                      <img src={order.couture.modelImage} alt="Modele couture" className="mx-auto max-h-72 rounded-2xl object-cover" />
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">Aucune image de modele jointe.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-slate-200/70 dark:border-slate-700/50 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="whitespace-pre-line text-right font-medium text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  );
}
