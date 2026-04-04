import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { clientApi } from '../../api/client';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/Loading';
import type { Order } from '../../types/order';
import { ClientStatusBadge, ClientTypeBadge, EmptyClientState, formatDateTime, getClientPriceLabel } from './clientShared';

type OrderFilter = 'all' | 'en_attente' | 'en_cours' | 'termine' | 'pressing' | 'atelier';

const filters: { value: OrderFilter; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Terminees' },
  { value: 'pressing', label: 'Pressing' },
  { value: 'atelier', label: 'Atelier' },
];

export function ClientOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await clientApi.getMyOrders();
        setOrders(data);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Impossible de charger vos commandes');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'pressing') return order.type === 'pressing';
      if (activeFilter === 'atelier') return order.type === 'couture';
      if (activeFilter === 'termine') return order.status === 'termine' || order.status === 'livre';
      return order.status === activeFilter;
    });
  }, [activeFilter, orders]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">Client</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Mes Commandes</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Consultez uniquement vos commandes et leur progression.</p>
        </div>
        <Link
          to="/client/orders/new"
          className="inline-flex rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-500/20"
        >
          Nouvelle commande
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeFilter === filter.value
                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/20'
                    : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {filteredOrders.length === 0 ? (
            <EmptyClientState
              title="Aucune commande pour ce filtre"
              description="Changez de filtre ou creez une nouvelle commande."
              actionLabel="Nouvelle commande"
              actionTo="/client/orders/new"
            />
          ) : (
            filteredOrders.map((order) => (
              <Link
                key={order.id}
                to={`/client/orders/${order.id}`}
                className="block rounded-3xl border border-slate-200/70 bg-white/70 p-5 transition hover:border-blue-400/40 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/40"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Commande #{order.id.slice(-6).toUpperCase()}</p>
                      <ClientTypeBadge type={order.type} />
                      <ClientStatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Date: {formatDateTime(order.createdAt)}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {order.type === 'pressing'
                        ? `${order.pressing?.quantite || 0} article(s) - ${order.pressing?.typeService || 'Service'}`
                        : order.couture?.description || 'Commande atelier'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 lg:block lg:text-right">
                    <p className="max-w-xs text-sm font-semibold text-slate-700 dark:text-slate-300 lg:text-right">{getClientPriceLabel(order)}</p>
                    <p className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-300">Voir detail</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
