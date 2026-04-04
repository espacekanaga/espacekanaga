import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clientApi, type ClientMe } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/Loading';
import type { Order } from '../../types/order';
import { ClientStatusBadge, ClientTypeBadge, EmptyClientState, OrderSummaryRow, getClientPriceLabel } from './clientShared';

export function ClientDashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ClientMe | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [me, myOrders] = await Promise.all([clientApi.getMe(), clientApi.getMyOrders({ limit: 5 })]);
        setProfile(me);
        setOrders(myOrders);
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Impossible de charger votre espace client');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const stats = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const inProgress = orders.filter((order) => order.status === 'en_attente' || order.status === 'en_cours').length;
    const completedThisMonth = orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return (order.status === 'termine' || order.status === 'livre') && createdAt.getMonth() === currentMonth && createdAt.getFullYear() === currentYear;
    }).length;

    return {
      inProgress,
      completedThisMonth,
      total: orders.length,
      invoicesReady: orders.filter((order) => Boolean(order.invoice?.filePath)).length,
    };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return <EmptyClientState title="Chargement impossible" description={error} actionLabel="Revenir au dashboard" actionTo="/client/dashboard" />;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden">
          <CardContent className="relative p-8">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-blue-600/15 via-sky-500/10 to-violet-600/15" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">Mon espace</p>
                <h1 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">Bonjour {profile?.prenom}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Retrouvez vos commandes, choisissez votre espace de service et suivez vos depots sans appeler l atelier.
                </p>
              </div>
              <Button onClick={() => navigate('/client/orders/new')}>Nouvelle commande</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Profil rapide</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Telephone</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{profile?.telephone}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{profile?.email || 'Non renseigne'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Acces</p>
              <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                {profile?.clientType === 'both' ? 'Pressing + Atelier' : profile?.clientType === 'atelier' ? 'Atelier' : 'Pressing'}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Commandes en cours" value={String(stats.inProgress)} />
        <StatCard label="Terminees ce mois" value={String(stats.completedThisMonth)} />
        <StatCard label="Total commandes" value={String(stats.total)} />
        <StatCard label="Factures disponibles" value={String(stats.invoicesReady)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {profile?.clientType !== 'atelier' ? (
          <WorkspaceCard
            title="Espace Pressing"
            description="Nettoyage, repassage, express et suivi des depots."
            href="/client/orders/new?space=pressing"
            color="from-blue-600 to-cyan-500"
          />
        ) : null}
        {profile?.clientType !== 'pressing' ? (
          <WorkspaceCard
            title="Espace Atelier"
            description="Retouches, ajustements et demandes couture sur mesure."
            href="/client/orders/new?space=atelier"
            color="from-violet-600 to-fuchsia-500"
          />
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Dernieres commandes</h2>
            <Link to="/client/orders" className="text-sm font-semibold text-blue-600 dark:text-blue-300">
              Voir tout
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {orders.length === 0 ? (
              <EmptyClientState
                title="Aucune commande"
                description="Creer votre premiere commande pour suivre votre pressing ou votre atelier en ligne."
                actionLabel="Nouvelle commande"
                actionTo="/client/orders/new"
              />
            ) : (
              orders.map((order) => <OrderSummaryRow key={order.id} order={order} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Vue rapide</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {orders.slice(0, 3).map((order) => (
              <div key={order.id} className="rounded-2xl border border-slate-200/70 p-4 dark:border-slate-700/60">
                <div className="flex items-center gap-2">
                  <ClientTypeBadge type={order.type} />
                  <ClientStatusBadge status={order.status} />
                </div>
                <p className="mt-3 font-semibold text-slate-900 dark:text-slate-100">Commande #{order.id.slice(-6).toUpperCase()}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{getClientPriceLabel(order)}</p>
              </div>
            ))}
            {orders.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-400">Aucune activite recente.</p> : null}
          </CardContent>
        </Card>
      </section>

      <button
        type="button"
        onClick={() => navigate('/client/orders/new')}
        className="fixed bottom-6 right-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-3xl text-white shadow-2xl shadow-blue-500/30 lg:hidden"
        aria-label="Nouvelle commande"
      >
        +
      </button>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{value}</p>
      </CardContent>
    </Card>
  );
}

function WorkspaceCard({
  title,
  description,
  href,
  color,
}: {
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <Link to={href}>
      <Card className="h-full overflow-hidden">
        <CardContent className={`bg-gradient-to-br ${color} p-7 text-white`}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/75">{title}</p>
          <p className="mt-5 max-w-sm text-xl font-black">{description}</p>
          <span className="mt-8 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
            Creer une commande
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
