import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ordersApi } from '../../api/orders';
import { Card, CardContent } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Form';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Badge } from '../../components/ui/Badge';
import type { Order, OrderStatus, OrderType } from '../../types/order';

const statusLabels: Record<OrderStatus, string> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  termine: 'Terminé',
  livre: 'Livré',
};

const statusVariants: Record<OrderStatus, 'warning' | 'info' | 'success' | 'default'> = {
  en_attente: 'warning',
  en_cours: 'info',
  termine: 'success',
  livre: 'default',
};

const typeLabels: Record<OrderType, string> = {
  pressing: 'Pressing',
  couture: 'Couture',
};

const typeVariants: Record<OrderType, 'info' | 'success'> = {
  pressing: 'info',
  couture: 'success',
};

export function OrdersListPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<OrderType | ''>(searchParams.get('type') as OrderType || '');

  useEffect(() => {
    loadOrders();
  }, [search, statusFilter, typeFilter]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await ordersApi.getAll({
        search,
        limit: 50,
      });
      let filtered = response.data;
      if (statusFilter) {
        filtered = filtered.filter((o) => o.status === statusFilter);
      }
      if (typeFilter) {
        filtered = filtered.filter((o) => o.type === typeFilter);
      }
      setOrders(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceDetails = (order: Order): string => {
    if (order.type === 'pressing' && order.pressing) {
      return `${order.pressing.typeService} • ${order.pressing.quantite} article(s)`;
    }
    if (order.type === 'couture' && order.couture) {
      const serviceType = order.couture.typeService === 'retouche' ? 'Retouche' : 'Sur mesure';
      return serviceType;
    }
    return '';
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
      <PageHeader title="Commandes" description="Liste des commandes">
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>Retour</Button>
        <Button onClick={() => navigate('/orders/new')}>Nouvelle commande</Button>
      </PageHeader>

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-400 mb-1">Recherche client</label>
            <Input
              placeholder="Rechercher client..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-slate-400 mb-1">Statut</label>
            <Select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as OrderStatus | '')}
              options={[
                { value: '', label: 'Tous les statuts' },
                { value: 'en_attente', label: 'En attente' },
                { value: 'en_cours', label: 'En cours' },
                { value: 'termine', label: 'Terminé' },
                { value: 'livre', label: 'Livré' },
              ]}
              className="w-full"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
            <Select
              value={typeFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value as OrderType | '')}
              options={[
                { value: '', label: 'Tous les types' },
                { value: 'pressing', label: 'Pressing' },
                { value: 'couture', label: 'Couture' },
              ]}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Aucune commande trouvée</div>
        ) : (
          orders.map((order) => (
            <Card
              key={order.id}
              onClick={() => navigate(`/orders/${order.id}`)}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-cyan-500/30"
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {(order.client.prenom?.charAt(0) || order.client.nom?.charAt(0) || '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-100 text-lg">
                      {order.client.prenom} {order.client.nom}
                    </p>
                    <p className="text-sm text-slate-400">
                      {order.client.telephone}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant={typeVariants[order.type]}>
                        {typeLabels[order.type]}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {getServiceDetails(order)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-slate-100 text-lg">{order.prixTotal.toLocaleString()} FCFA</p>
                    <p className="text-xs text-slate-500">
                      Ajouté par {order.createdBy.prenom} {order.createdBy.nom} le {new Date(order.createdAt).toLocaleDateString('fr-FR')} à {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Badge variant={statusVariants[order.status]}>
                    {statusLabels[order.status]}
                  </Badge>
                  <span className="text-slate-500 text-xl">→</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
