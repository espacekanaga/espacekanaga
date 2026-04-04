import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import type { Order, OrderStatus, OrderType } from '../../types/order';

// Icon components
export function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </svg>
  );
}

export function ScissorsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="6" cy="6" r="3"/>
      <path d="M8.12 8.12 12 12"/>
      <path d="M20 4 8.12 15.88"/>
      <circle cx="6" cy="18" r="3"/>
      <path d="M14.8 14.8 20 20"/>
    </svg>
  );
}

export function ClockIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

export function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

export function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}

export function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 19-7-7 7-7"/>
      <path d="M19 12H5"/>
    </svg>
  );
}

export function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} FCFA`;
}

export function getClientPriceLabel(order: Pick<Order, 'pricingVisible' | 'prixTotal' | 'invoice'>) {
  if (order.pricingVisible) {
    return formatCurrency(order.prixTotal);
  }

  return 'Prix disponible apres validation et facture';
}

export function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const orderStatusMeta: Record<OrderStatus, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' }> = {
  en_attente: { label: 'En attente', variant: 'warning' },
  en_cours: { label: 'En cours', variant: 'info' },
  termine: { label: 'Terminee', variant: 'success' },
  livre: { label: 'Livree', variant: 'success' },
};

export const orderTypeMeta: Record<OrderType, { label: string; tone: string }> = {
  pressing: { label: 'Pressing', tone: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
  couture: { label: 'Atelier', tone: 'bg-violet-500/15 text-violet-700 dark:text-violet-300' },
};

export function ClientStatusBadge({ status }: { status: OrderStatus }) {
  const meta = orderStatusMeta[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function ClientTypeBadge({ type }: { type: OrderType }) {
  const meta = orderTypeMeta[type];
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${meta.tone}`}>{meta.label}</span>;
}

export function EmptyClientState({
  title,
  description,
  actionLabel,
  actionTo,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300/70 bg-white/60 p-8 text-center dark:border-slate-700/60 dark:bg-slate-900/30">
      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p>
      {actionLabel && actionTo ? (
        <Link
          to={actionTo}
          className="mt-5 inline-flex rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function OrderSummaryRow({ order }: { order: Order }) {
  return (
    <Link
      to={`/client/orders/${order.id}`}
      className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-4 transition hover:border-blue-400/40 hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/40 dark:hover:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-900 dark:text-slate-100">Commande #{order.id.slice(-6).toUpperCase()}</p>
          <ClientTypeBadge type={order.type} />
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Creee le {formatDateTime(order.createdAt)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <ClientStatusBadge status={order.status} />
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{getClientPriceLabel(order)}</span>
      </div>
    </Link>
  );
}
