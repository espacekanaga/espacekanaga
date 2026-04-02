import { api } from './client';

export type InvoiceSettingsScope = 'global' | 'pressing' | 'atelier';

export interface InvoiceSettings {
  id: string;
  scope: InvoiceSettingsScope;

  companyName?: string | null;
  companyTagline?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companyNIF?: string | null;
  companyRCCM?: string | null;

  stampEnabled?: boolean | null;
  stampLine1?: string | null;
  stampLine2?: string | null;
  stampLine3?: string | null;
  stampColor?: string | null;

  footerLine1?: string | null;
  footerLine2?: string | null;

  tauxTVA?: number | null;
  notes?: string | null;
}

export interface InvoiceSettingsBundle {
  global: InvoiceSettings;
  pressing: InvoiceSettings;
  atelier: InvoiceSettings;
}

export type UpdateGlobalInvoiceSettingsRequest = Partial<
  Pick<
    InvoiceSettings,
    | 'companyName'
    | 'companyTagline'
    | 'companyAddress'
    | 'companyPhone'
    | 'companyEmail'
    | 'companyNIF'
    | 'companyRCCM'
    | 'stampEnabled'
    | 'stampLine1'
    | 'stampLine2'
    | 'stampLine3'
    | 'stampColor'
    | 'footerLine1'
    | 'footerLine2'
  >
>;

export type UpdateWorkspaceInvoiceSettingsRequest = Partial<Pick<InvoiceSettings, 'tauxTVA' | 'notes'>>;

export const invoiceSettingsApi = {
  get: async (): Promise<InvoiceSettingsBundle> => {
    const { data } = await api.get<InvoiceSettingsBundle>('/settings/invoice');
    return data;
  },

  update: async (
    scope: InvoiceSettingsScope,
    payload: UpdateGlobalInvoiceSettingsRequest | UpdateWorkspaceInvoiceSettingsRequest
  ): Promise<InvoiceSettings> => {
    const { data } = await api.put<InvoiceSettings>(`/settings/invoice/${scope}`, payload);
    return data;
  },
};

