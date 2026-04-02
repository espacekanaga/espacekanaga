import type { OrderType } from '../types/order';

export interface InvoicePrefs {
  tauxTVA: number;
  notes: string;
}

const PRESSING_KEY = 'invoice_prefs_pressing';
const ATELIER_KEY = 'invoice_prefs_atelier';

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function safeParse(json: string | null): any | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function loadInvoicePrefsForOrderType(orderType: OrderType): InvoicePrefs {
  const key = orderType === 'pressing' ? PRESSING_KEY : ATELIER_KEY;
  const raw = safeParse(localStorage.getItem(key));
  const tauxTVA = typeof raw?.tauxTVA === 'number' ? clampNumber(raw.tauxTVA, 0, 100) : 18;
  const notes = typeof raw?.notes === 'string' ? raw.notes : '';
  return { tauxTVA, notes };
}

export function saveInvoicePrefsForOrderType(orderType: OrderType, prefs: InvoicePrefs) {
  const key = orderType === 'pressing' ? PRESSING_KEY : ATELIER_KEY;
  localStorage.setItem(
    key,
    JSON.stringify({
      tauxTVA: clampNumber(prefs.tauxTVA, 0, 100),
      notes: prefs.notes ?? '',
    })
  );
}

