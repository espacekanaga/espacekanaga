import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { clientsApi } from '../../api/clients';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Form';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner, EmptyState } from '../../components/ui/Loading';
import type { Client } from '../../types/client';
import { clientTypeLabels, clientTypeColors } from '../../types/client';

export function ClientsListPage() {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pressing' | 'atelier'>('all');
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs for debounce
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showErrorRef = useRef(showError);
  showErrorRef.current = showError;

  const fetchClients = useCallback(async (searchTerm: string, type: string) => {
    setIsLoading(true);
    try {
      const response = await clientsApi.getAll({
        search: searchTerm,
        type: type === 'all' ? undefined : type as 'pressing' | 'atelier' | 'both',
        limit: 50
      });
      setClients(response.data);
    } catch (err) {
      showErrorRef.current(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search by 300ms
    searchTimeoutRef.current = setTimeout(() => {
      fetchClients(search, typeFilter);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, typeFilter, fetchClients]);

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Liste de tous les clients"
      >
        <Button variant="secondary" onClick={() => navigate('/')}>Retour</Button>
        <Button onClick={() => navigate('/clients/new')}>Nouveau client</Button>
      </PageHeader>

      <Card className="mb-6">
        <CardContent className="p-4 flex flex-wrap gap-4">
          <Input
            placeholder="Rechercher par nom ou téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | 'pressing' | 'atelier')}
            options={[
              { value: 'all', label: 'Tous les clients' },
              { value: 'pressing', label: 'Pressing' },
              { value: 'atelier', label: 'Atelier' },
            ]}
            className="max-w-xs"
          />
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : (
        <div className="space-y-2">
          {clients.length === 0 ? (
            <EmptyState message="Aucun client trouvé" />
          ) : (
            clients.map((client) => (
              <ClientListItem
                key={client.id}
                client={client}
                onClick={() => navigate(`/clients/${client.id}`)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ClientListItem({
  client,
  onClick,
}: {
  client: Client;
  onClick: () => void;
}) {
  const type = client.clientType || 'both';
  const typeLabel = clientTypeLabels[type];
  const typeColorClass = clientTypeColors[type] || 'bg-slate-100 text-slate-800';

  return (
    <Card
      hoverable
      onClick={onClick}
      className="cursor-pointer"
    >
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {client.prenom.charAt(0)}{client.nom.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-100 text-lg">
                {client.prenom} {client.nom}
              </p>
              <span className={`px-2 py-0.5 text-xs rounded-full ${typeColorClass}`}>
                {typeLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <PhoneIcon className="w-4 h-4 text-slate-400" />
              <p className="text-sm text-slate-400 font-medium">{client.telephone}</p>
            </div>
            {client.email && (
              <div className="flex items-center gap-2 mt-0.5">
                <MailIcon className="w-4 h-4 text-slate-500" />
                <p className="text-xs text-slate-500">{client.email}</p>
              </div>
            )}
          </div>
        </div>
        <div className="text-slate-500">
          <ChevronRightIcon className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
