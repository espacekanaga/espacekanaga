import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../../api/orders';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner, EmptyState } from '../../components/ui/Loading';
import type { Order } from '../../types/order';

export function CoutureDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    enCours: 0,
    termines: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCoutureOrders();
  }, []);

  const loadCoutureOrders = async () => {
    try {
      setIsLoading(true);
      const response = await ordersApi.getAll({ type: 'atelier' });
      const coutureOrders = response.data;
      setOrders(coutureOrders);
      setStats({
        total: coutureOrders.length,
        enAttente: coutureOrders.filter((o) => o.status === 'en_attente').length,
        enCours: coutureOrders.filter((o) => o.status === 'en_cours').length,
        termines: coutureOrders.filter((o) => o.status === 'termine').length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner className="py-12" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Espace Atelier Couture"
        description="Gestion des commandes de couture"
      >
        <Button onClick={() => navigate('/orders/new')}>Nouvelle commande</Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Total commandes</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">En attente</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.enAttente}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">En cours</p>
            <p className="text-2xl font-bold text-blue-400">{stats.enCours}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-400">Terminées</p>
            <p className="text-2xl font-bold text-green-400">{stats.termines}</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4">Commandes récentes</h3>
          {orders.length === 0 ? (
            <EmptyState message="Aucune commande de couture" />
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 10).map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-700/50 hover:bg-slate-800/60 cursor-pointer"
                >
                    <div>
                      <p className="font-medium">
                        #{order.id.slice(-6)} - {order.client.prenom} {order.client.nom}
                      </p>
                      <p className="text-sm text-slate-400">
                      {order.couture?.typeService === 'retouche' ? 'Retouche' : 'Sur mesure'}
                      {order.couture?.deadline && (
                        <span className="ml-2">
                          (Livraison: {new Date(order.couture.deadline).toLocaleDateString('fr-FR')})
                        </span>
                      )}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                        {order.couture?.measurement ? `${Object.keys(order.couture.measurement.data).length} mesures` : 'Sans mensurations'}
                      </span>
                      <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                        {order.couture?.modelImage ? 'Modele joint' : 'Sans image'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        order.status === 'livre'
                          ? 'success'
                          : order.status === 'en_attente'
                            ? 'warning'
                            : 'info'
                      }
                    >
                      {order.status}
                    </Badge>
                    <span className="font-medium">{order.prixTotal.toLocaleString()} FCFA</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
