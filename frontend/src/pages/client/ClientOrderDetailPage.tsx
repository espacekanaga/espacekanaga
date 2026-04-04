import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { clientApi } from '../../api/client';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/Loading';
import type { Order, OrderStatus } from '../../types/order';
import { ClientStatusBadge, ClientTypeBadge, EmptyClientState, formatDate, formatDateTime, getClientPriceLabel } from './clientShared';

const timeline: { status: OrderStatus; label: string }[] = [
  { status: 'en_attente', label: 'Commande creee' },
  { status: 'en_cours', label: 'Prise en charge' },
  { status: 'termine', label: 'Commande prete' },
  { status: 'livre', label: 'Recuperee' },
];

export function ClientOrderDetailPage() {
  const { id = '' } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await clientApi.getOrder(id);
        setOrder(data);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Commande introuvable');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [id]);

  const currentStep = useMemo(() => {
    const index = timeline.findIndex((item) => item.status === order?.status);
    return index === -1 ? 0 : index;
  }, [order?.status]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!order) {
    return <EmptyClientState title="Commande indisponible" description={error || 'Cette commande ne vous appartient pas ou n existe plus.'} actionLabel="Retour" actionTo="/client/orders" />;
  }

  const contactWorkspaceLabel = order.type === 'pressing' ? 'le pressing' : 'l atelier';
  const contactSubject = order.type === 'pressing' ? 'Commande pressing client' : 'Commande atelier client';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">Commande</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">#{order.id.slice(-8).toUpperCase()}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ClientTypeBadge type={order.type} />
            <ClientStatusBadge status={order.status} />
          </div>
        </div>
        <Link to="/client/orders" className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Retour a mes commandes
        </Link>
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Suivi de traitement</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            {timeline.map((item, index) => {
              const active = index <= currentStep;
              return (
                <div key={item.status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`h-10 w-10 rounded-full ${active ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'} flex items-center justify-center text-sm font-black`}>
                      {index + 1}
                    </div>
                    {index < timeline.length - 1 ? <div className={`mt-2 h-12 w-px ${active ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'}`} /> : null}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {index === currentStep ? 'Etape en cours ou la plus recente.' : active ? 'Etape validee.' : 'En attente.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Details</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Info label="Date creation" value={formatDateTime(order.createdAt)} />
              <Info label="Prix / facture" value={getClientPriceLabel(order)} />
              <Info label="Derniere mise a jour" value={formatDateTime(order.updatedAt)} />
              <Info label="Facture" value={order.invoice?.filePath ? 'Disponible' : 'Pas encore generee'} />
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-700/60 dark:bg-slate-900/40">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                {order.type === 'pressing' ? 'Articles et options' : 'Description atelier'}
              </p>
              {order.type === 'pressing' ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <Info label="Article" value={order.pressing?.typeVetement || '-'} />
                  <Info label="Quantite" value={String(order.pressing?.quantite || 0)} />
                  <Info label="Service" value={order.pressing?.typeService || '-'} />
                  <Info label="Instructions" value={order.pressing?.instructions || 'Aucune'} />
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <Info label="Type de service" value={order.couture?.typeService || '-'} />
                  <Info label="Date souhaitee" value={formatDate(order.couture?.deadline)} />
                  <Info label="Tissu" value={order.couture?.tissu || 'Non precise'} />
                  <Info label="Description" value={order.couture?.description || 'Aucune description'} />
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Mensurations transmises</p>
                    {order.couture?.measurement ? (
                      <div className="mt-3 rounded-3xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-950/40">
                        <div className="grid gap-3 md:grid-cols-2">
                          {Object.entries(order.couture.measurement.data).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{key.replace(/_/g, ' ')}</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                        {order.couture.measurement.notes ? (
                          <p className="mt-4 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{order.couture.measurement.notes}</p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Aucune fiche de mensurations associee.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Photo / reference</p>
                    <div className="mt-3 overflow-hidden rounded-3xl border border-dashed border-slate-300/70 bg-white p-6 text-center dark:border-slate-700/60 dark:bg-slate-950/40">
                      {order.couture?.modelImage ? (
                        <img src={order.couture.modelImage} alt="Modele commande" className="mx-auto max-h-72 rounded-2xl object-cover" />
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Aucune photo fournie pour cette commande.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              {order.invoice?.id && (order.status === 'termine' || order.status === 'livre') ? (
                <Link
                  to={`/invoices/${order.invoice.id}`}
                  className="inline-flex rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-500/20 hover:from-blue-700 hover:to-violet-700 transition"
                >
                  Voir la facture
                </Link>
              ) : null}
              <a
                href={`mailto:contact@espacekanaga.com?subject=${encodeURIComponent(contactSubject)}`}
                className="inline-flex rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                {`Contacter ${contactWorkspaceLabel}`}
              </a>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 whitespace-pre-line text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
