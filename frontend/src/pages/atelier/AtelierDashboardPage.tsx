import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/Loading';
import { ordersApi } from '../../api/orders';
import { clientsApi } from '../../api/clients';
import type { Order } from '../../types/order';

export function AtelierDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    clientsAtelier: 0,
    commandesEnCours: 0,
    commandesTerminees: 0,
    recettesJour: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      // Load orders for atelier (couture type)
      const ordersRes = await ordersApi.getAll({ limit: 1000 });
      const atelierOrders = ordersRes.data.filter((o: Order) => o.type === 'couture');

      // Load all clients and filter by those who have couture orders
      const clientsRes = await clientsApi.getAll({ limit: 1000 });
      const atelierClientIds = new Set(atelierOrders.map((o: Order) => o.clientId));
      const atelierClients = clientsRes.data.filter((c: any) => atelierClientIds.has(c.id));

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayRevenue = atelierOrders
        .filter((o: Order) => o.createdAt.startsWith(today))
        .reduce((sum: number, o: Order) => sum + o.prixTotal, 0);

      setStats({
        clientsAtelier: atelierClients.length,
        commandesEnCours: atelierOrders.filter((o: Order) => o.status === 'en_cours').length,
        commandesTerminees: atelierOrders.filter((o: Order) => o.status === 'termine').length,
        recettesJour: todayRevenue,
      });

      // Get recent orders (last 5)
      setRecentOrders(atelierOrders.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner className="py-12" />;

  return (
    <div className="space-y-6">
      {/* Header avec indicateur visuel Atelier */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-1 h-8 bg-purple-500 rounded-full"></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Espace Atelier</h1>
          <p className="text-sm text-slate-400">Tableau de bord de l'atelier de couture</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Clients Atelier"
          value={stats.clientsAtelier}
          icon={UsersIcon}
          color="blue"
        />
        <StatCard
          title="Commandes en cours"
          value={stats.commandesEnCours}
          icon={ClipboardIcon}
          color="yellow"
        />
        <StatCard
          title="Commandes terminées"
          value={stats.commandesTerminees}
          icon={CheckIcon}
          color="green"
        />
        <StatCard
          title="Recettes du jour"
          value={`${stats.recettesJour.toLocaleString()} FCFA`}
          icon={CurrencyIcon}
          color="purple"
        />
      </div>

      {/* Navigation rapide */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <QuickLinkCard
          title="Clients"
          description="Gestion des clients atelier"
          onClick={() => navigate('/clients?type=atelier')}
          icon={UsersIcon}
        />
        <QuickLinkCard
          title="Commandes"
          description="Commandes couture & retouche"
          onClick={() => navigate('/orders?type=couture')}
          icon={ClipboardIcon}
        />
        <QuickLinkCard
          title="Nouveau client"
          description="Ajouter un client atelier"
          onClick={() => navigate('/clients/new')}
          icon={PlusIcon}
        />
        <QuickLinkCard
          title="Nouvelle commande"
          description="Créer une commande atelier"
          onClick={() => navigate('/orders/new?type=couture')}
          icon={RulerIcon}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Commandes récentes */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Commandes récentes</h3>
              <Link to="/orders" className="text-sm text-blue-400 hover:text-blue-300">
                Voir tout →
              </Link>
            </div>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Aucune commande récente</p>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors"
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    {order.couture?.modelImage ? (
                      <img
                        src={order.couture.modelImage}
                        alt="Modèle"
                        className="w-16 h-16 rounded-lg object-cover border border-slate-600"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center border border-slate-600">
                        <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{order.client.prenom} {order.client.nom}</p>
                      <p className="text-sm text-slate-400">
                        {order.couture?.typeService === 'retouche' ? 'Retouche' : 'Sur mesure'} • {order.prixTotal.toLocaleString()} FCFA
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge status={order.status} />
                      <p className="text-xs text-slate-500 mt-1">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: React.FC<{className?: string}>; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    green: 'bg-green-500/20 text-green-400',
    red: 'bg-red-500/20 text-red-400',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`w-12 h-12 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="ml-4">
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLinkCard({ title, description, onClick, icon: Icon }: { title: string; description: string; onClick: () => void; icon: React.FC<{className?: string}> }) {
  return (
    <div onClick={onClick} className="cursor-pointer">
      <Card hoverable className="h-full">
        <CardContent className="p-4">
          <div className="flex items-start">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Icon className="w-5 h-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="font-medium text-slate-200">{title}</p>
              <p className="text-sm text-slate-400">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const statusClasses: Record<string, string> = {
    en_cours: 'bg-yellow-500/20 text-yellow-400',
    termine: 'bg-green-500/20 text-green-400',
    en_attente: 'bg-slate-500/20 text-slate-400',
    livre: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${statusClasses[status] || 'bg-slate-500/20 text-slate-400'}`}>
      {status.replace('_', ' ').toUpperCase()}
    </span>
  );
}

// Icons
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CurrencyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
