import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoicesApi } from '../../api/invoices';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Form';
import { PageHeader } from '../../components/ui/PageHeader';
import type { InvoiceSummary } from '../../types/invoice';

export function InvoicesListPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await invoicesApi.getAll({ search, limit: 50 });
      setInvoices(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return invoices;
    return invoices.filter((inv) => {
      const name = `${inv.order.client.prenom} ${inv.order.client.nom}`.toLowerCase();
      return inv.numero.toLowerCase().includes(s) || name.includes(s) || inv.order.client.telephone.includes(s);
    });
  }, [invoices, search]);

  return (
    <div className="space-y-6">
      <PageHeader title="Facturation" description="Liste des factures">
        <Button variant="secondary" onClick={load} disabled={isLoading}>
          Actualiser
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Rechercher (numéro, client, téléphone)"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="secondary" onClick={load} disabled={isLoading}>
              Rechercher
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400 py-8 text-center">Aucune facture</p>
          ) : (
            <div className="divide-y divide-slate-200/70 dark:divide-slate-700/50">
              {filtered.map((inv) => (
                <button
                  key={inv.id}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="w-full text-left py-4 flex items-center gap-4 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 px-2 rounded-lg transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{inv.numero}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full border border-slate-200/70 text-slate-700 dark:border-slate-700/50 dark:text-slate-300">
                        {inv.order.type === 'pressing' ? 'Pressing' : 'Atelier'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                      {inv.order.client.prenom} {inv.order.client.nom} • {inv.order.client.telephone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {inv.montantTTC.toLocaleString()} FCFA
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {new Date(inv.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
