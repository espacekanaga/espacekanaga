interface InvoicePreviewProps {
  companyName: string;
  companyTagline: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  companyNIF: string;
  companyRCCM: string;
  stampEnabled: boolean;
  stampColor: string;
  stampLine1: string;
  stampLine2: string;
  stampLine3: string;
  footerLine1: string;
  footerLine2: string;
}

export function InvoicePreview({
  companyName,
  companyTagline,
  companyPhone,
  companyEmail,
  companyAddress,
  companyNIF,
  companyRCCM,
  stampEnabled,
  stampColor,
  stampLine1,
  stampLine2,
  stampLine3,
  footerLine1,
  footerLine2,
}: InvoicePreviewProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
      <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wide">
        Apercu de la facture
      </h4>
      
      <div className="space-y-4">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {companyName || 'Nom Entreprise'}
          </h3>
          {companyTagline && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {companyTagline}
            </p>
          )}
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 space-y-1">
            {companyAddress && <p>{companyAddress}</p>}
            {companyPhone && <p>Tel: {companyPhone}</p>}
            {companyEmail && <p>Email: {companyEmail}</p>}
            {(companyNIF || companyRCCM) && (
              <p className="text-xs">
                {companyNIF && `NIF: ${companyNIF}`}
                {companyNIF && companyRCCM && ' | '}
                {companyRCCM && `RCCM: ${companyRCCM}`}
              </p>
            )}
          </div>
        </div>

        {/* Stamp Preview */}
        {stampEnabled && (
          <div className="flex justify-center py-4">
            <div
              className="border-2 border-dashed rounded-lg px-6 py-4 text-center"
              style={{ borderColor: stampColor || '#c41e3a' }}
            >
              <p className="text-sm font-semibold" style={{ color: stampColor || '#c41e3a' }}>
                {stampLine1 || 'CACHET'}
              </p>
              {stampLine2 && (
                <p className="text-xs" style={{ color: stampColor || '#c41e3a' }}>
                  {stampLine2}
                </p>
              )}
              {stampLine3 && (
                <p className="text-xs" style={{ color: stampColor || '#c41e3a' }}>
                  {stampLine3}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center space-y-1">
            {footerLine1 && <p>{footerLine1}</p>}
            {footerLine2 && <p>{footerLine2}</p>}
            {!footerLine1 && !footerLine2 && (
              <p className="italic">Pied de page (non configure)</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
