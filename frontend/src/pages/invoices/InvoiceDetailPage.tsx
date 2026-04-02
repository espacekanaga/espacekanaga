import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { invoicesApi } from '../../api/invoices';
import { API_ORIGIN } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import type { InvoiceDetail } from '../../types/invoice';

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await invoicesApi.getById(id!);
        setInvoice(data);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!invoice) {
    return <div className="text-center py-12 text-slate-600 dark:text-slate-400">Facture non trouvée</div>;
  }

  const pdfUrl =
    invoice.downloadUrl ||
    (invoice.filePath ? `${API_ORIGIN}${invoice.filePath}` : undefined);

  return (
    <div className="space-y-6">
      <PageHeader title={invoice.numero} description="Détails de la facture">
        <Button variant="secondary" onClick={() => navigate('/invoices')}>
          Retour
        </Button>
        {pdfUrl && (
          <Button onClick={() => window.open(pdfUrl, '_blank')}>Télécharger PDF</Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Client</p>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {invoice.order.client.prenom} {invoice.order.client.nom}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{invoice.order.client.telephone}</p>
            </div>

            <div className="border-t border-slate-200/70 dark:border-slate-700/50 pt-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">Commande</p>
              <Link to={`/orders/${invoice.order.id}`} className="text-blue-600 dark:text-blue-300 hover:underline">
                Voir commande #{invoice.order.id.slice(-6)}
              </Link>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Type: {invoice.order.type === 'pressing' ? 'Pressing' : 'Atelier'}
              </p>
            </div>

            {invoice.notes && invoice.notes.trim().length > 0 && (
              <div className="border-t border-slate-200/70 dark:border-slate-700/50 pt-4">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Notes</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Lignes</h3>
            <div className="space-y-3">
              {invoice.lignes.map((l, idx) => (
                <div key={idx} className="flex justify-between border-b border-slate-200/70 dark:border-slate-700/50 pb-2">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{l.description}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Qté {l.quantite} • {l.prixUnitaire.toLocaleString()} FCFA
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {l.montant.toLocaleString()} FCFA
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2 text-sm">
              <Row label="Montant HT" value={`${invoice.montantHT.toLocaleString()} FCFA`} />
              <Row label={`TVA (${invoice.tauxTVA}%)`} value={`${invoice.montantTVA.toLocaleString()} FCFA`} />
              <Row strong label="Total TTC" value={`${invoice.montantTTC.toLocaleString()} FCFA`} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      <span className={strong ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-900 dark:text-slate-100'}>
        {value}
      </span>
    </div>
  );
}

