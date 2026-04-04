import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../api/users';
import { invoiceSettingsApi, type InvoiceSettingsBundle } from '../../api/invoiceSettings';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Input, TextArea } from '../../components/ui/Form';
import { PageHeader } from '../../components/ui/PageHeader';
import { LoadingSpinner } from '../../components/ui/Loading';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import { InvoicePreview } from '../../components/invoice/InvoicePreview';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { WorkSchedule } from '../../components/ui/WorkSchedule';

type Theme = 'dark' | 'light' | 'system';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, theme, setTheme, updateUser, hasPressingAccess, hasAtelierAccess, isSuperAdmin } = useAuth();
  const { showSuccess, showError } = useToast();

  console.log('SettingsPage render - user:', user);
  console.log('SettingsPage render - isSuperAdmin:', isSuperAdmin);

  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettingsBundle | null>(null);
  const [isLoadingInvoiceSettings, setIsLoadingInvoiceSettings] = useState(true);

  const [globalInvoiceForm, setGlobalInvoiceForm] = useState({
    companyName: '',
    companyTagline: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyNIF: '',
    companyRCCM: '',
    stampEnabled: true,
    stampLine1: '',
    stampLine2: '',
    stampLine3: '',
    stampColor: '#c41e3a',
    footerLine1: '',
    footerLine2: '',
  });

  const [pressingInvoiceForm, setPressingInvoiceForm] = useState({ tauxTVA: 18, notes: '' });
  const [atelierInvoiceForm, setAtelierInvoiceForm] = useState({ tauxTVA: 18, notes: '' });

  // Company logo state
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  // Work schedule state
  const [workSchedule, setWorkSchedule] = useState([
    { day: 'monday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
    { day: 'tuesday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
    { day: 'wednesday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
    { day: 'thursday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
    { day: 'friday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
    { day: 'saturday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
    { day: 'sunday', isOpen: false, openTime: '08:00', closeTime: '18:00' },
  ]);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  const [isSavingInvoiceGlobal, setIsSavingInvoiceGlobal] = useState(false);
  const [isSavingInvoicePressing, setIsSavingInvoicePressing] = useState(false);
  const [isSavingInvoiceAtelier, setIsSavingInvoiceAtelier] = useState(false);

  const resolvedTheme = useMemo(() => {
    if (theme !== 'system') return theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, [theme]);

  useEffect(() => {
    const load = async () => {
      setIsLoadingInvoiceSettings(true);
      try {
        const data = await invoiceSettingsApi.get();
        setInvoiceSettings(data);

        setGlobalInvoiceForm({
          companyName: data.global.companyName || '',
          companyTagline: data.global.companyTagline || '',
          companyAddress: data.global.companyAddress || '',
          companyPhone: data.global.companyPhone || '',
          companyEmail: data.global.companyEmail || '',
          companyNIF: data.global.companyNIF || '',
          companyRCCM: data.global.companyRCCM || '',
          stampEnabled: data.global.stampEnabled ?? true,
          stampLine1: data.global.stampLine1 || '',
          stampLine2: data.global.stampLine2 || '',
          stampLine3: data.global.stampLine3 || '',
          stampColor: data.global.stampColor || '#c41e3a',
          footerLine1: data.global.footerLine1 || '',
          footerLine2: data.global.footerLine2 || '',
        });

        setPressingInvoiceForm({
          tauxTVA: data.pressing.tauxTVA ?? 18,
          notes: data.pressing.notes || '',
        });
        setAtelierInvoiceForm({
          tauxTVA: data.atelier.tauxTVA ?? 18,
          notes: data.atelier.notes || '',
        });
      } catch (err) {
        showError(err instanceof Error ? err.message : 'Erreur lors du chargement des paramètres de facturation');
      } finally {
        setIsLoadingInvoiceSettings(false);
      }
    };

    load();
  }, [showError]);

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme);
    setIsSavingTheme(true);
    try {
      const updated = await usersApi.updateProfile({ theme: newTheme });
      updateUser(updated);
      showSuccess('Thème mis à jour');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du thème');
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword.length < 6) {
      showError('Le mot de passe doit faire au moins 6 caractères');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsChangingPassword(true);
    try {
      await usersApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showSuccess('Mot de passe modifié avec succès');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  /* const handleSaveInvoicePrefs = (type: 'pressing' | 'couture') => {
    try {
      const prefs = type === 'pressing' ? pressingInvoicePrefs : atelierInvoicePrefs;
      saveInvoicePrefsForOrderType(type, prefs);
      showSuccess('Paramètres de facturation enregistrés');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement');
    }
  }; */

  const canEditInvoiceGlobal = isSuperAdmin;
  const canEditInvoicePressing = isSuperAdmin || hasPressingAccess;
  const canEditInvoiceAtelier = isSuperAdmin || hasAtelierAccess;

  const handleSaveInvoiceGlobal = async () => {
    if (!canEditInvoiceGlobal) return;
    setIsSavingInvoiceGlobal(true);
    try {
      const updated = await invoiceSettingsApi.update('global', globalInvoiceForm);
      setInvoiceSettings((prev) => (prev ? { ...prev, global: updated } : prev));
      showSuccess('Informations de facture enregistrées');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement');
    } finally {
      setIsSavingInvoiceGlobal(false);
    }
  };

  const handleSaveWorkspace = async (scope: 'pressing' | 'atelier') => {
    const canEdit = scope === 'pressing' ? canEditInvoicePressing : canEditInvoiceAtelier;
    if (!canEdit) return;

    const setSaving = scope === 'pressing' ? setIsSavingInvoicePressing : setIsSavingInvoiceAtelier;
    const form = scope === 'pressing' ? pressingInvoiceForm : atelierInvoiceForm;

    setSaving(true);
    try {
      const updated = await invoiceSettingsApi.update(scope, form);
      setInvoiceSettings((prev) => (prev ? { ...prev, [scope]: updated } : prev));
      showSuccess('Paramètres de facturation enregistrés');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur lors de l’enregistrement');
    } finally {
      setSaving(false);
    }
  };

  // Guard clause for user not loaded yet - AFTER all hooks
  if (!user) return <LoadingSpinner className="py-12" />;

  return (
    <div>
      <PageHeader title="Paramètres" description="Personnalisez votre expérience">
        <Button variant="secondary" onClick={() => navigate('/')}>
          Retour
        </Button>
      </PageHeader>

      <div className="space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                <ThemeIcon className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Thème</h3>
                <p className="text-sm text-slate-400">Choisissez votre préférence d&apos;affichage</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <ThemeOption
              title="Sombre"
              description="Interface avec fond sombre"
              icon={<MoonIcon className="w-5 h-5" />}
              selected={theme === 'dark'}
              onClick={() => handleThemeChange('dark')}
              disabled={isSavingTheme}
            />
            <ThemeOption
              title="Clair"
              description="Interface avec fond clair"
              icon={<SunIcon className="w-5 h-5" />}
              selected={theme === 'light'}
              onClick={() => handleThemeChange('light')}
              disabled={isSavingTheme}
            />
            <ThemeOption
              title="Système"
              description={`Suivre les préférences du système (actuel: ${resolvedTheme === 'dark' ? 'Sombre' : 'Clair'})`}
              icon={<ComputerIcon className="w-5 h-5" />}
              selected={theme === 'system'}
              onClick={() => handleThemeChange('system')}
              disabled={isSavingTheme}
            />

            {isSavingTheme && <p className="text-xs text-slate-400 pt-2">Enregistrement...</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <ReceiptIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Facturation</h3>
                <p className="text-sm text-slate-400">Facture, cachet et valeurs par défaut</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingInvoiceSettings && (
              <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
            )}

            {!isLoadingInvoiceSettings && isSuperAdmin && (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">Informations facture</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Nom, contact, cachet et pied de page affichés sur le PDF.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleSaveInvoiceGlobal}
                    isLoading={isSavingInvoiceGlobal}
                    disabled={!canEditInvoiceGlobal}
                  >
                    Enregistrer
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Formulaire */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Nom de l'entreprise"
                        value={globalInvoiceForm.companyName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setGlobalInvoiceForm({ ...globalInvoiceForm, companyName: e.target.value })
                        }
                        disabled={!canEditInvoiceGlobal}
                      />
                      <Input
                        label="Slogan / Activite"
                        value={globalInvoiceForm.companyTagline}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setGlobalInvoiceForm({ ...globalInvoiceForm, companyTagline: e.target.value })
                        }
                        disabled={!canEditInvoiceGlobal}
                      />
                      <Input
                        label="Telephone"
                        value={globalInvoiceForm.companyPhone}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setGlobalInvoiceForm({ ...globalInvoiceForm, companyPhone: e.target.value })
                        }
                        disabled={!canEditInvoiceGlobal}
                      />
                      <Input
                        label="Email"
                        value={globalInvoiceForm.companyEmail}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setGlobalInvoiceForm({ ...globalInvoiceForm, companyEmail: e.target.value })
                        }
                        disabled={!canEditInvoiceGlobal}
                      />
                      <Input
                        label="NIF (optionnel)"
                        value={globalInvoiceForm.companyNIF}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setGlobalInvoiceForm({ ...globalInvoiceForm, companyNIF: e.target.value })
                        }
                        disabled={!canEditInvoiceGlobal}
                      />
                      <Input
                        label="RCCM (optionnel)"
                        value={globalInvoiceForm.companyRCCM}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setGlobalInvoiceForm({ ...globalInvoiceForm, companyRCCM: e.target.value })
                        }
                        disabled={!canEditInvoiceGlobal}
                      />
                    </div>

                    <TextArea
                      label="Adresse (optionnel)"
                      placeholder="Ex: Tieguena face a l'ecole fondamentale"
                      value={globalInvoiceForm.companyAddress}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setGlobalInvoiceForm({ ...globalInvoiceForm, companyAddress: e.target.value })
                      }
                      disabled={!canEditInvoiceGlobal}
                      className="min-h-[80px]"
                    />

                    {/* Logo entreprise */}
                    <div className="pt-4 border-t border-slate-200/70 dark:border-slate-700/50">
                      <p className="font-medium text-slate-900 dark:text-slate-100 mb-3">Logo de l&apos;entreprise</p>
                      <ImageUpload
                        currentImage={companyLogo}
                        onImageSelect={(file) => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setCompanyLogo(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }}
                        onImageRemove={() => setCompanyLogo(null)}
                        placeholder={globalInvoiceForm.companyName?.charAt(0) || 'E'}
                        shape="square"
                        size="md"
                      />
                    </div>
                  </div>

                  {/* Apercu */}
                  <div className="lg:sticky lg:top-4">
                    <InvoicePreview
                      companyName={globalInvoiceForm.companyName}
                      companyTagline={globalInvoiceForm.companyTagline}
                      companyPhone={globalInvoiceForm.companyPhone}
                      companyEmail={globalInvoiceForm.companyEmail}
                      companyAddress={globalInvoiceForm.companyAddress}
                      companyNIF={globalInvoiceForm.companyNIF}
                      companyRCCM={globalInvoiceForm.companyRCCM}
                      stampEnabled={globalInvoiceForm.stampEnabled}
                      stampColor={globalInvoiceForm.stampColor}
                      stampLine1={globalInvoiceForm.stampLine1}
                      stampLine2={globalInvoiceForm.stampLine2}
                      stampLine3={globalInvoiceForm.stampLine3}
                      footerLine1={globalInvoiceForm.footerLine1}
                      footerLine2={globalInvoiceForm.footerLine2}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200/70 dark:border-slate-700/50 pt-6 space-y-4">
                  <p className="font-medium text-slate-900 dark:text-slate-100">Cachet & pied de page</p>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
                          checked={globalInvoiceForm.stampEnabled}
                          onChange={(e) =>
                            setGlobalInvoiceForm({ ...globalInvoiceForm, stampEnabled: e.target.checked })
                          }
                          disabled={!canEditInvoiceGlobal}
                        />
                        Activer le cachet
                      </label>
                      <Input
                        label="Couleur du cachet (hex)"
                        placeholder="#c41e3a"
                        value={globalInvoiceForm.stampColor}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setGlobalInvoiceForm({ ...globalInvoiceForm, stampColor: e.target.value })
                        }
                        disabled={!canEditInvoiceGlobal}
                      />
                      <Input
                        label="Cachet - Ligne 1"
                        value={globalInvoiceForm.stampLine1}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setGlobalInvoiceForm({ ...globalInvoiceForm, stampLine1: e.target.value })
                        }
                        disabled={!canEditInvoiceGlobal}
                      />
                      <Input
                        label="Cachet - Ligne 2"
                        value={globalInvoiceForm.stampLine2}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setGlobalInvoiceForm({ ...globalInvoiceForm, stampLine2: e.target.value })
                        }
                        disabled={!canEditInvoiceGlobal}
                      />
                      <Input
                        label="Cachet - Ligne 3"
                        value={globalInvoiceForm.stampLine3}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setGlobalInvoiceForm({ ...globalInvoiceForm, stampLine3: e.target.value })
                        }
                        disabled={!canEditInvoiceGlobal}
                      />
                    </div>

                    <div className="space-y-3">
                      <TextArea
                        label="Footer - Ligne 1"
                        value={globalInvoiceForm.footerLine1}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setGlobalInvoiceForm({ ...globalInvoiceForm, footerLine1: e.target.value })
                        }
                        disabled={!canEditInvoiceGlobal}
                        className="min-h-[80px]"
                      />
                      <TextArea
                        label="Footer - Ligne 2"
                        value={globalInvoiceForm.footerLine2}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setGlobalInvoiceForm({ ...globalInvoiceForm, footerLine2: e.target.value })
                        }
                        disabled={!canEditInvoiceGlobal}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isLoadingInvoiceSettings && !isSuperAdmin && (
              <div className="rounded-xl border border-slate-200/70 dark:border-slate-700/50 p-4 bg-white/40 dark:bg-slate-900/20">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Informations facture</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Modifiable uniquement par le Super Admin.
                </p>
                {invoiceSettings?.global && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Entreprise</p>
                      <p className="text-slate-900 dark:text-slate-100 font-medium">
                        {invoiceSettings.global.companyName || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Email</p>
                      <p className="text-slate-900 dark:text-slate-100 font-medium">
                        {invoiceSettings.global.companyEmail || '-'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-slate-200/70 dark:border-slate-700/50 pt-6 space-y-4">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">Valeurs par défaut</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  TVA et notes appliquées lors de la génération de la facture (Pressing / Atelier).
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-xl border border-slate-200/70 dark:border-slate-700/50 p-4 bg-white/40 dark:bg-slate-900/20 space-y-3">
                  <div className="flex items-center justify-between">
                <p className="font-medium text-slate-900 dark:text-slate-100">Pressing</p>
                <Button
                  variant="secondary"
                  onClick={() => handleSaveWorkspace('pressing')}
                  disabled={!canEditInvoicePressing || isLoadingInvoiceSettings}
                  isLoading={isSavingInvoicePressing}
                >
                  Enregistrer
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="TVA (%)"
                  type="number"
                  min={0}
                  max={100}
                  value={pressingInvoiceForm.tauxTVA}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPressingInvoiceForm({ ...pressingInvoiceForm, tauxTVA: Number(e.target.value) })
                  }
                  disabled={!canEditInvoicePressing || isLoadingInvoiceSettings}
                />
              </div>
              <TextArea
                label="Notes (optionnel)"
                placeholder="Ex: Merci de votre confiance..."
                value={pressingInvoiceForm.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setPressingInvoiceForm({ ...pressingInvoiceForm, notes: e.target.value })
                }
                disabled={!canEditInvoicePressing || isLoadingInvoiceSettings}
              />
              {!canEditInvoicePressing && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Accès Pressing requis (ou Super Admin).
                </p>
              )}
            </div>

                <div className="rounded-xl border border-slate-200/70 dark:border-slate-700/50 p-4 bg-white/40 dark:bg-slate-900/20 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-900 dark:text-slate-100">Atelier</p>
                <Button
                  variant="secondary"
                  onClick={() => handleSaveWorkspace('atelier')}
                  disabled={!canEditInvoiceAtelier || isLoadingInvoiceSettings}
                  isLoading={isSavingInvoiceAtelier}
                >
                  Enregistrer
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="TVA (%)"
                  type="number"
                  min={0}
                  max={100}
                  value={atelierInvoiceForm.tauxTVA}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAtelierInvoiceForm({ ...atelierInvoiceForm, tauxTVA: Number(e.target.value) })
                  }
                  disabled={!canEditInvoiceAtelier || isLoadingInvoiceSettings}
                />
              </div>
              <TextArea
                label="Notes (optionnel)"
                placeholder="Ex: Délai de retouche..."
                value={atelierInvoiceForm.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setAtelierInvoiceForm({ ...atelierInvoiceForm, notes: e.target.value })
                }
                disabled={!canEditInvoiceAtelier || isLoadingInvoiceSettings}
              />
              {!canEditInvoiceAtelier && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Accès Atelier requis (ou Super Admin).
                </p>
              )}
            </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Compte</h3>
                <p className="text-sm text-slate-400">Informations et accès</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400">Nom</p>
                  <p className="text-slate-900 dark:text-slate-200 font-medium">
                    {user ? `${user.prenom} ${user.nom}` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Rôle</p>
                  <p className="text-slate-900 dark:text-slate-200 font-medium">{user?.role ?? '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400">Téléphone</p>
                  <p className="text-slate-900 dark:text-slate-200 font-medium">{user?.telephone ?? '-'}</p>
                </div>
                <div>
                  <p className="text-slate-400">Email</p>
                  <p className="text-slate-900 dark:text-slate-200 font-medium">{user?.email || '-'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <AccessChip label="Pressing" enabled={hasPressingAccess} />
                <AccessChip label="Atelier" enabled={hasAtelierAccess} />
              </div>

              <div className="pt-2">
                <Button variant="secondary" onClick={() => navigate('/profile')}>
                  Voir le profil
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <LockIcon className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Sécurité</h3>
                <p className="text-sm text-slate-400">Changez votre mot de passe</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <Input
                label="Mot de passe actuel"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                required
              />
              <Input
                label="Nouveau mot de passe"
                type="password"
                value={passwordData.newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                required
              />
              <Input
                label="Confirmer le nouveau mot de passe"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                required
              />
              <Button type="submit" isLoading={isChangingPassword}>
                Modifier le mot de passe
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Horaires de travail */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Horaires d&apos;ouverture</h3>
                <p className="text-sm text-slate-400">Définir les heures de travail de l&apos;entreprise</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/30">
                <WorkSchedule
                  schedule={workSchedule}
                  onChange={setWorkSchedule}
                  disabled={!isSuperAdmin}
                />
              </div>
              
              {isSuperAdmin ? (
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={async () => {
                      setIsSavingSchedule(true);
                      try {
                        // Simulate API call - replace with actual API when ready
                        await new Promise((resolve) => setTimeout(resolve, 800));
                        
                        // TODO: Replace with actual API call
                        // await workScheduleApi.save(workSchedule);
                        
                        showSuccess('Horaires enregistrés avec succès !');
                      } catch (err) {
                        showError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement des horaires');
                      } finally {
                        setIsSavingSchedule(false);
                      }
                    }}
                    isLoading={isSavingSchedule}
                    className="w-full"
                  >
                    Enregistrer les horaires
                  </Button>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Les modifications seront appliquées immédiatement
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-slate-100/50 dark:bg-slate-800/30 rounded-lg">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Seul le Super Admin peut modifier les horaires
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <InfoIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">À propos</h3>
                <p className="text-sm text-slate-400">Informations sur l&apos;application</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-200/70 dark:border-slate-700/50">
                <span className="text-slate-400">Version</span>
                <span className="text-slate-900 dark:text-slate-200">1.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-200/70 dark:border-slate-700/50">
                <span className="text-slate-400">Nom</span>
                <span className="text-slate-900 dark:text-slate-200">Espace Espace Kanaga</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Développé par</span>
                <span className="text-slate-900 dark:text-slate-200">Kanaga Team</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ThemeOption({
  title,
  description,
  icon,
  selected,
  onClick,
  disabled = false,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
        selected
          ? 'border-blue-500/50 bg-blue-500/10'
          : 'border-slate-200/70 hover:bg-slate-100/70 dark:border-slate-700/50 dark:hover:bg-slate-800/60'
      }`}
    >
      <div className={`${selected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className={`font-medium ${selected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-900 dark:text-slate-200'}`}>
          {title}
        </p>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      {selected && (
        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
          <CheckIcon className="w-3 h-3 text-white" />
        </div>
      )}
    </button>
  );
}

function AccessChip({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
        enabled
          ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300'
          : 'bg-slate-100/70 text-slate-700 border-slate-200/70 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/50'
      }`}
    >
      {label}: {enabled ? 'OK' : 'Non'}
    </span>
  );
}

function ThemeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
      />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 24.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

function ComputerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 14a4 4 0 01-8 0m8 0a4 4 0 00-8 0m8 0v2a6 6 0 01-12 0v-2m12 0a6 6 0 00-12 0m6-9a4 4 0 110 8 4 4 0 010-8z"
      />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 11c1.105 0 2 .895 2 2v2a2 2 0 11-4 0v-2c0-1.105.895-2 2-2z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 11V8a5 5 0 10-10 0v3m-1 0h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l2 2 4-4M7 2h10a2 2 0 012 2v18l-3-2-3 2-3-2-3 2-3-2V4a2 2 0 012-2z" />
    </svg>
  );
}
