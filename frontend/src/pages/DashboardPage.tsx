import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner, EmptyState } from '../components/ui/Loading';
import { ordersApi } from '../api/orders';
import { clientsApi } from '../api/clients';
import type { Order } from '../types/order';
import type { Client } from '../types/client';

// Lucide Icons
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
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4.583-7.502a2.975 2.975 0 00-.123-3.326 3.003 3.003 0 00-4.996-3.342L3 14m17-4l-4.583 7.502a2.975 2.975 0 01.123 3.326 3.003 3.003 0 014.996 3.342L21 10M9 7a3 3 0 11-6 0 3 3 0 016 0zm12 0a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  activeClients: number;
  pendingOrders: number;
  monthlyRevenue: number;
  pressingOrders: number;
  coutureOrders: number;
}

export function DashboardPage() {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    todayOrders: 0,
    activeClients: 0,
    pendingOrders: 0,
    monthlyRevenue: 0,
    pressingOrders: 0,
    coutureOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recentClients, setRecentClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load orders
      const ordersResponse = await ordersApi.getAll({ limit: 100 });
      const orders = ordersResponse.data;
      
      // Load clients
      const clientsResponse = await clientsApi.getAll({ limit: 100 });
      const clients = clientsResponse.data;
      
      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = orders.filter(o => new Date(o.createdAt) >= today).length;
      const pendingOrders = orders.filter(o => o.status === 'en_attente' || o.status === 'en_cours').length;
      const pressingOrders = orders.filter(o => o.type === 'pressing').length;
      const coutureOrders = orders.filter(o => o.type === 'couture').length;
      
      // Calculate monthly revenue
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const monthlyRevenue = orders
        .filter(o => {
          const orderDate = new Date(o.createdAt);
          return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        })
        .reduce((sum, o) => sum + o.prixTotal, 0);
      
      setStats({
        totalOrders: orders.length,
        todayOrders,
        activeClients: clients.length,
        pendingOrders,
        monthlyRevenue,
        pressingOrders,
        coutureOrders,
      });
      
      setRecentOrders(orders.slice(0, 5));
      setRecentClients(clients.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  const statCards = [
    { 
      name: "Commandes du jour", 
      value: stats.todayOrders.toString(), 
      change: `+${stats.todayOrders > 0 ? stats.todayOrders : 0}`, 
      changeType: 'success' as const 
    },
    { 
      name: "Clients actifs", 
      value: stats.activeClients.toString(), 
      change: "+0", 
      changeType: 'success' as const 
    },
    { 
      name: "Commandes en cours", 
      value: stats.pendingOrders.toString(), 
      change: "À traiter", 
      changeType: 'warning' as const 
    },
    { 
      name: "Revenus du mois", 
      value: `${stats.monthlyRevenue.toLocaleString()} FCFA`, 
      change: "Ce mois", 
      changeType: 'success' as const 
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Bienvenue, ${user?.prenom || user?.email} !`}
      >
        <div className="flex gap-2">
          <Button onClick={() => navigate('/clients/new')} variant="secondary">
            + Client
          </Button>
          <Button onClick={() => navigate('/orders/new')}>
            + Commande
          </Button>
        </div>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.name} hoverable>
            <CardContent className="p-4">
              <p className="text-sm text-slate-400">{stat.name}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
              <Badge variant={stat.changeType} className="mt-2">
                {stat.change}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Workspace Summary for Admin */}
      {(isAdmin || isSuperAdmin) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card hoverable onClick={() => navigate('/pressing')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Espace Pressing</p>
                  <p className="text-2xl font-bold">{stats.pressingOrders} commandes</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <SparklesIcon className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card hoverable onClick={() => navigate('/couture')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Espace Couture</p>
                  <p className="text-2xl font-bold">{stats.coutureOrders} commandes</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
                  <ScissorsIcon className="w-6 h-6 text-violet-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Commandes récentes</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/orders')}
              >
                Voir tout →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <EmptyState message="Aucune commande" />
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-700/50 hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-medium">
                        #{order.id.slice(-6)} - {order.client.prenom} {order.client.nom}
                      </p>
                      <p className="text-sm text-slate-400">
                        {order.type === 'pressing' ? 'Pressing' : 'Couture'}
                      </p>
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
                      <span className="font-medium text-sm">
                        {order.prixTotal.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nouveaux clients</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/clients')}
              >
                Voir tout →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentClients.length === 0 ? (
              <EmptyState message="Aucun client" />
            ) : (
              <div className="space-y-2">
                {recentClients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => navigate(`/clients/${client.id}`)}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-700/50 hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 flex items-center justify-center text-white font-semibold">
                        {client.prenom.charAt(0)}{client.nom.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">
                          {client.prenom} {client.nom}
                        </p>
                        <p className="text-sm text-slate-400">{client.telephone}</p>
                      </div>
                    </div>
                    <span className="text-slate-400">→</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
