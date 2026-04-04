import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { clientApi, type ClientMe } from '../../api/client';
import { Card, CardContent } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/Loading';
import { useToast } from '../../hooks/useToast';
import { standardMeasurementFields } from '../../types/client';

type WizardStep = 1 | 2 | 3 | 4;
type ClientSpace = 'pressing' | 'atelier';
type MeasurementMode = 'saved' | 'new';

const pressingBasePrices: Record<string, number> = { chemise: 2500, pantalon: 3000, robe: 4500, complet: 7000 };
const atelierBasePrices: Record<string, number> = { ourlet: 2000, ajustement: 3500, reparation: 4000, sur_mesure: 12000 };
const atelierServiceLabels: Record<string, string> = { ourlet: 'Ourlet', ajustement: 'Ajustement', reparation: 'Reparation', sur_mesure: 'Sur mesure' };

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

function formatMeasurementLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ClientOrderCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showError, showSuccess } = useToast();
  const [profile, setProfile] = useState<ClientMe | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [step, setStep] = useState<WizardStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [space, setSpace] = useState<ClientSpace>('pressing');
  const [modelPreview, setModelPreview] = useState('');
  const [formData, setFormData] = useState({
    article: 'chemise',
    quantity: 1,
    service: 'standard',
    express: false,
    repassage: false,
    instructions: '',
    atelierService: 'ourlet',
    atelierDescription: '',
    desiredDate: '',
    tissu: '',
    modelReference: '',
    modelNotes: '',
    modelImage: null as File | null,
    measurementMode: 'new' as MeasurementMode,
    selectedMeasurementId: '',
    measurementNotes: '',
    measurementValues: {} as Record<string, string>,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const me = await clientApi.getMe();
        setProfile(me);

        const preset = searchParams.get('space');
        if (preset === 'atelier' || preset === 'pressing') {
          setSpace(preset);
        } else if (me.clientType === 'atelier') {
          setSpace('atelier');
        }

        if (me.measurements?.length) {
          setFormData((prev) => ({
            ...prev,
            measurementMode: 'saved',
            selectedMeasurementId: me.measurements?.[0]?.id ?? '',
          }));
        }
      } catch {
        showError("Impossible de charger votre profil client");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    void load();
  }, [searchParams, showError]);

  useEffect(() => {
    if (!formData.modelImage) {
      setModelPreview('');
      return;
    }

    const preview = URL.createObjectURL(formData.modelImage);
    setModelPreview(preview);

    return () => URL.revokeObjectURL(preview);
  }, [formData.modelImage]);

  const estimate = useMemo(() => {
    if (space === 'pressing') {
      const base = pressingBasePrices[formData.article] || 2500;
      return base * formData.quantity + (formData.express ? 1500 : 0) + (formData.repassage ? 500 : 0);
    }

    const base = atelierBasePrices[formData.atelierService] || 2500;
    return base + (formData.modelImage || formData.modelReference ? 1000 : 0);
  }, [formData.article, formData.atelierService, formData.express, formData.modelImage, formData.modelReference, formData.quantity, formData.repassage, space]);

  const canUsePressing = profile?.clientType !== 'atelier';
  const canUseAtelier = profile?.clientType !== 'pressing';
  const savedMeasurements = profile?.measurements ?? [];

  const measurementFields = useMemo(() => {
    const known = new Map(standardMeasurementFields.map((field) => [field.name, field]));
    savedMeasurements.forEach((measurement) => {
      Object.keys(measurement.data || {}).forEach((key) => {
        if (!known.has(key)) {
          known.set(key, { name: key, label: formatMeasurementLabel(key), unite: 'cm' });
        }
      });
    });
    return Array.from(known.values());
  }, [savedMeasurements]);

  const selectedMeasurement = useMemo(
    () => savedMeasurements.find((measurement) => measurement.id === formData.selectedMeasurementId) ?? null,
    [formData.selectedMeasurementId, savedMeasurements]
  );

  const filledMeasurementCount = useMemo(
    () => Object.values(formData.measurementValues).filter((value) => value.trim().length > 0).length,
    [formData.measurementValues]
  );

  const validateStep = () => {
    const nextErrors: Record<string, string> = {};

    if (step === 1) {
      if (space === 'pressing' && !canUsePressing) nextErrors.space = "Cet espace n est pas disponible pour votre compte";
      if (space === 'atelier' && !canUseAtelier) nextErrors.space = "Cet espace n est pas disponible pour votre compte";
    }

    if (step === 2) {
      if (space === 'pressing') {
        if (!formData.article) nextErrors.article = 'Choisissez un article';
        if (formData.quantity < 1) nextErrors.quantity = 'Quantite invalide';
      } else {
        if (!formData.atelierDescription.trim()) nextErrors.atelierDescription = 'Ajoutez une description detaillee';
        if (formData.measurementMode === 'saved' && !formData.selectedMeasurementId) nextErrors.selectedMeasurementId = 'Selectionnez une fiche de mensurations';
        if (formData.measurementMode === 'new' && filledMeasurementCount === 0) nextErrors.measurementValues = 'Ajoutez au moins une mesure pour l atelier';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((current) => Math.min(4, current + 1) as WizardStep);
  };

  const prev = () => setStep((current) => Math.max(1, current - 1) as WizardStep);

  const handleMeasurementValueChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      measurementValues: {
        ...prev.measurementValues,
        [field]: value,
      },
    }));
  };

  const handleCreateOrder = async () => {
    setIsSubmitting(true);
    setErrors({});

    try {
      let modelImageBase64: string | undefined;
      if (formData.modelImage) {
        modelImageBase64 = await fileToBase64(formData.modelImage);
      }

      const measurementData = Object.fromEntries(
        Object.entries(formData.measurementValues).filter(([, value]) => value.trim().length > 0)
      );

      const order = await clientApi.createOrder(
        space === 'pressing'
          ? {
              type: 'pressing',
              prixTotal: estimate,
              pressing: {
                typeVetement: formData.article,
                quantite: formData.quantity,
                typeService: formData.service,
                instructions: [formData.instructions, formData.express ? 'Express' : '', formData.repassage ? 'Repassage inclus' : ''].filter(Boolean).join(' | '),
              },
            }
          : {
              type: 'couture',
              prixTotal: estimate,
              couture: {
                typeService: formData.atelierService === 'sur_mesure' ? 'sur_mesure' : 'retouche',
                description: formData.atelierDescription.trim(),
                modelReference: formData.modelReference.trim() || undefined,
                modelNotes: formData.modelNotes.trim() || undefined,
                tissu: formData.tissu.trim() || undefined,
                deadline: formData.desiredDate || undefined,
                modelImage: modelImageBase64,
                measurementId: formData.measurementMode === 'saved' ? formData.selectedMeasurementId || undefined : undefined,
                measurementData: formData.measurementMode === 'new' ? measurementData : undefined,
                measurementNotes: formData.measurementMode === 'new' ? formData.measurementNotes.trim() || undefined : undefined,
              },
            }
      );

      setCreatedOrderId(order.id);
      setStep(4);
      showSuccess('Commande transmise a l atelier');
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Creation de commande impossible';
      setErrors({ submit: message });
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">Nouvelle commande</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Commande client complete</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            Creez une demande pressing ou un dossier couture avec modele et mensurations transmis a l equipe admin.
          </p>
        </div>
        <Link to="/client/orders" className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Retour a mes commandes
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className={`rounded-2xl border px-4 py-4 ${step === item ? 'border-blue-400/50 bg-blue-500/10' : 'border-slate-200/70 dark:border-slate-700/60'}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Etape {item}</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                    {item === 1 && 'Choisir l espace'}
                    {item === 2 && 'Constituer le dossier'}
                    {item === 3 && 'Recapitulatif'}
                    {item === 4 && 'Confirmation'}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6 p-6">
            {step === 1 ? (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">Choisir l espace</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <SpaceCard title="Pressing" description="Chemises, pantalons, robes et services express." active={space === 'pressing'} disabled={!canUsePressing} onClick={() => setSpace('pressing')} />
                  <SpaceCard title="Atelier couture" description="Retouches, sur mesure, modele et mensurations." active={space === 'atelier'} disabled={!canUseAtelier} onClick={() => setSpace('atelier')} />
                </div>
                {errors.space ? <p className="text-sm text-red-500">{errors.space}</p> : null}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-950 dark:text-white">Constituer la commande</h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {space === 'pressing' ? 'Choisissez les articles et options de traitement.' : 'Joignez les infos dont l atelier a besoin pour lancer la fabrication.'}
                  </p>
                </div>

                {space === 'pressing' ? (
                  <div className="grid gap-5 md:grid-cols-2">
                    <InputWrap label="Article" error={errors.article}>
                      <select className="input-field" value={formData.article} onChange={(e) => setFormData((prev) => ({ ...prev, article: e.target.value }))}>
                        <option value="chemise">Chemise</option>
                        <option value="pantalon">Pantalon</option>
                        <option value="robe">Robe</option>
                        <option value="complet">Complet</option>
                      </select>
                    </InputWrap>

                    <InputWrap label="Quantite" error={errors.quantity}>
                      <input className="input-field" type="number" min={1} value={formData.quantity} onChange={(e) => setFormData((prev) => ({ ...prev, quantity: Number(e.target.value) }))} />
                    </InputWrap>

                    <InputWrap label="Type de service">
                      <select className="input-field" value={formData.service} onChange={(e) => setFormData((prev) => ({ ...prev, service: e.target.value }))}>
                        <option value="standard">Standard</option>
                        <option value="delicat">Delicat</option>
                        <option value="premium">Premium</option>
                      </select>
                    </InputWrap>

                    <div className="grid gap-3">
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200/70 p-3 dark:border-slate-700/60">
                        <input type="checkbox" checked={formData.express} onChange={(e) => setFormData((prev) => ({ ...prev, express: e.target.checked }))} />
                        <span className="text-sm text-slate-700 dark:text-slate-200">Option express</span>
                      </label>
                      <label className="flex items-center gap-3 rounded-2xl border border-slate-200/70 p-3 dark:border-slate-700/60">
                        <input type="checkbox" checked={formData.repassage} onChange={(e) => setFormData((prev) => ({ ...prev, repassage: e.target.checked }))} />
                        <span className="text-sm text-slate-700 dark:text-slate-200">Repassage inclus</span>
                      </label>
                    </div>

                    <div className="md:col-span-2">
                      <InputWrap label="Instructions">
                        <textarea className="input-field min-h-[110px]" value={formData.instructions} onChange={(e) => setFormData((prev) => ({ ...prev, instructions: e.target.value }))} />
                      </InputWrap>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-5 md:grid-cols-2">
                      <InputWrap label="Type de demande atelier">
                        <select className="input-field" value={formData.atelierService} onChange={(e) => setFormData((prev) => ({ ...prev, atelierService: e.target.value }))}>
                          <option value="ourlet">Ourlet</option>
                          <option value="ajustement">Ajustement</option>
                          <option value="reparation">Reparation</option>
                          <option value="sur_mesure">Sur mesure</option>
                        </select>
                      </InputWrap>
                      <InputWrap label="Date souhaitee">
                        <input className="input-field" type="date" value={formData.desiredDate} onChange={(e) => setFormData((prev) => ({ ...prev, desiredDate: e.target.value }))} />
                      </InputWrap>
                    </div>

                    <InputWrap label="Description detaillee" error={errors.atelierDescription}>
                      <textarea className="input-field min-h-[140px]" value={formData.atelierDescription} onChange={(e) => setFormData((prev) => ({ ...prev, atelierDescription: e.target.value }))} placeholder="Expliquez la coupe, la retouche, la forme ou la finition attendue..." />
                    </InputWrap>

                    <div className="grid gap-5 md:grid-cols-2">
                      <InputWrap label="Tissu / matiere">
                        <input className="input-field" value={formData.tissu} onChange={(e) => setFormData((prev) => ({ ...prev, tissu: e.target.value }))} placeholder="Bazin, soie, lin, wax..." />
                      </InputWrap>
                      <InputWrap label="Reference du modele">
                        <input className="input-field" value={formData.modelReference} onChange={(e) => setFormData((prev) => ({ ...prev, modelReference: e.target.value }))} placeholder="Ex: Boubou homme col italien" />
                      </InputWrap>
                    </div>

                    <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-700/60 dark:bg-slate-900/40">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="lg:max-w-xl">
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Modele couture</p>
                          <h3 className="mt-2 text-lg font-bold text-slate-950 dark:text-white">Photo et consignes de reference</h3>
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">La photo du modele part avec la commande et reste visible dans le dashboard admin.</p>
                        </div>
                        <label className="inline-flex cursor-pointer rounded-full border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-700 dark:border-blue-500/40 dark:text-blue-300">
                          Ajouter une photo
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => setFormData((prev) => ({ ...prev, modelImage: e.target.files?.[0] ?? null }))} />
                        </label>
                      </div>

                      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                        <InputWrap label="Consignes sur le modele">
                          <textarea className="input-field min-h-[120px]" value={formData.modelNotes} onChange={(e) => setFormData((prev) => ({ ...prev, modelNotes: e.target.value }))} placeholder="Manches, col, poches, doublure, finition..." />
                        </InputWrap>

                        <div className="rounded-3xl border border-dashed border-slate-300/70 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-950/40">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Apercu modele</p>
                          <div className="mt-4 flex min-h-[220px] items-center justify-center overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900">
                            {modelPreview ? <img src={modelPreview} alt="Modele couture" className="h-full max-h-[220px] w-full rounded-2xl object-cover" /> : <p className="px-4 text-center text-sm text-slate-500 dark:text-slate-400">Aucune photo fournie.</p>}
                          </div>
                          {formData.modelImage ? (
                            <button type="button" onClick={() => setFormData((prev) => ({ ...prev, modelImage: null }))} className="mt-3 text-sm font-semibold text-red-500">
                              Retirer la photo
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-700/60 dark:bg-slate-900/40">
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Mensurations</p>
                        <h3 className="text-lg font-bold text-slate-950 dark:text-white">Choisir ou saisir une fiche</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">Les mesures sont rattachees a la commande pour traitement par l equipe admin.</p>
                      </div>

                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <ModeCard title="Utiliser mes mensurations enregistrees" description={`${savedMeasurements.length} fiche(s) disponible(s)`} active={formData.measurementMode === 'saved'} disabled={savedMeasurements.length === 0} onClick={() => setFormData((prev) => ({ ...prev, measurementMode: 'saved', selectedMeasurementId: prev.selectedMeasurementId || savedMeasurements[0]?.id || '' }))} />
                        <ModeCard title="Saisir une nouvelle fiche" description="Envoyer une nouvelle serie de mesures" active={formData.measurementMode === 'new'} onClick={() => setFormData((prev) => ({ ...prev, measurementMode: 'new' }))} />
                      </div>

                      {formData.measurementMode === 'saved' ? (
                        <div className="mt-5 space-y-3">
                          {savedMeasurements.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">Aucune mensuration enregistree. Passez sur "Saisir une nouvelle fiche".</p>
                          ) : (
                            savedMeasurements.map((measurement) => (
                              <button key={measurement.id} type="button" onClick={() => setFormData((prev) => ({ ...prev, selectedMeasurementId: measurement.id }))} className={`w-full rounded-2xl border p-4 text-left transition ${formData.selectedMeasurementId === measurement.id ? 'border-blue-400/60 bg-blue-500/10' : 'border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-950/40'}`}>
                                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">Fiche du {new Date(measurement.createdAt).toLocaleDateString('fr-FR')}</p>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                      {Object.keys(measurement.data || {}).length} mesures
                                      {measurement.notes ? ` - ${measurement.notes}` : ''}
                                    </p>
                                  </div>
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    {formData.selectedMeasurementId === measurement.id ? 'Selectionnee' : 'Choisir'}
                                  </span>
                                </div>
                              </button>
                            ))
                          )}
                          {errors.selectedMeasurementId ? <p className="text-sm text-red-500">{errors.selectedMeasurementId}</p> : null}
                        </div>
                      ) : (
                        <div className="mt-5 space-y-5">
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {measurementFields.map((field) => (
                              <InputWrap key={field.name} label={`${field.label}${field.unite ? ` (${field.unite})` : ''}`}>
                                <input className="input-field" inputMode="decimal" value={formData.measurementValues[field.name] || ''} onChange={(e) => handleMeasurementValueChange(field.name, e.target.value)} placeholder="0" />
                              </InputWrap>
                            ))}
                          </div>
                          <InputWrap label="Notes de mensurations" error={errors.measurementValues}>
                            <textarea className="input-field min-h-[110px]" value={formData.measurementNotes} onChange={(e) => setFormData((prev) => ({ ...prev, measurementNotes: e.target.value }))} placeholder="Ex: prise avec chaussures, marge de confort, tissu non extensible..." />
                          </InputWrap>
                          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{filledMeasurementCount} mesure(s) renseignee(s)</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">Recapitulatif</h2>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-700/60 dark:bg-slate-900/40">
                  <dl className="grid gap-4 md:grid-cols-2">
                    <Summary label="Espace" value={space === 'pressing' ? 'Pressing' : 'Atelier couture'} />
                    <Summary label="Tarification" value="Le prix sera confirme apres traitement et emission de la facture." />
                    {space === 'pressing' ? (
                      <>
                        <Summary label="Article" value={formData.article} />
                        <Summary label="Quantite" value={String(formData.quantity)} />
                        <Summary label="Service" value={formData.service} />
                        <Summary label="Options" value={[formData.express ? 'Express' : '', formData.repassage ? 'Repassage' : ''].filter(Boolean).join(', ') || 'Aucune'} />
                        <Summary label="Instructions" value={formData.instructions || 'Aucune'} />
                      </>
                    ) : (
                      <>
                        <Summary label="Type atelier" value={atelierServiceLabels[formData.atelierService] || formData.atelierService} />
                        <Summary label="Date souhaitee" value={formData.desiredDate || 'Non precisee'} />
                        <Summary label="Tissu" value={formData.tissu || 'Non precise'} />
                        <Summary label="Reference modele" value={formData.modelReference || 'Non precisee'} />
                        <Summary label="Photo du modele" value={formData.modelImage ? 'Photo jointe' : 'Aucune photo'} />
                        <Summary label="Mensurations" value={formData.measurementMode === 'saved' ? (selectedMeasurement ? `Fiche du ${new Date(selectedMeasurement.createdAt).toLocaleDateString('fr-FR')}` : 'Aucune fiche selectionnee') : `${filledMeasurementCount} mesure(s) nouvelles`} />
                        <Summary label="Description" value={formData.atelierDescription || '-'} />
                      </>
                    )}
                  </dl>
                </div>

                {space === 'atelier' && selectedMeasurement ? <MeasurementSnapshot title="Mensurations selectionnees" data={selectedMeasurement.data} notes={selectedMeasurement.notes || undefined} /> : null}
                {space === 'atelier' && formData.measurementMode === 'new' ? <MeasurementSnapshot title="Nouvelle fiche a transmettre" data={Object.fromEntries(Object.entries(formData.measurementValues).filter(([, value]) => value.trim().length > 0))} notes={formData.measurementNotes || undefined} /> : null}
                {errors.submit ? <p className="text-sm text-red-500">{errors.submit}</p> : null}
                <button type="button" onClick={handleCreateOrder} disabled={isSubmitting} className="inline-flex rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-500/20 disabled:opacity-60">
                  {isSubmitting ? 'Creation en cours...' : 'Confirmer la commande'}
                </button>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-5 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6">
                <h2 className="text-2xl font-black text-emerald-700 dark:text-emerald-200">Commande creee avec succes</h2>
                <p className="text-sm text-emerald-700 dark:text-emerald-100">
                  Votre numero de commande est <strong>#{createdOrderId.slice(-6).toUpperCase()}</strong>.
                  {space === 'atelier' ? ' Le dossier modele + mensurations est visible par l equipe admin.' : ''}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => navigate(`/client/orders/${createdOrderId}`)} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-emerald-700">
                    Suivre la commande
                  </button>
                  <button type="button" onClick={() => navigate('/client/dashboard')} className="rounded-full border border-emerald-200/40 px-5 py-3 text-sm font-semibold text-emerald-700 dark:text-white">
                    Retour au dashboard
                  </button>
                </div>
              </div>
            ) : null}

            {step < 4 ? (
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button type="button" onClick={prev} disabled={step === 1} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200">
                  Retour
                </button>
                {step < 3 ? (
                  <button type="button" onClick={next} className="rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-500/20">
                    Continuer
                  </button>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SpaceCard({ title, description, active, disabled, onClick }: { title: string; description: string; active: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`rounded-3xl border p-5 text-left transition ${active ? 'border-blue-400/60 bg-blue-500/10' : 'border-slate-200/70 bg-white/70 dark:border-slate-700/60 dark:bg-slate-900/40'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
      <p className="text-lg font-bold text-slate-950 dark:text-slate-100">{title}</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </button>
  );
}

function ModeCard({ title, description, active, disabled, onClick }: { title: string; description: string; active: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`rounded-2xl border p-4 text-left transition ${active ? 'border-blue-400/60 bg-blue-500/10' : 'border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-950/40'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
      <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p>
    </button>
  );
}

function InputWrap({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      {children}
      {error ? <span className="mt-2 block text-sm text-red-500">{error}</span> : null}
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-2 whitespace-pre-line text-sm font-medium text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

function MeasurementSnapshot({ title, data, notes }: { title: string; data: Record<string, string | number>; notes?: string }) {
  const entries = Object.entries(data);

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-700/60 dark:bg-slate-900/40">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{title}</p>
      {entries.length ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {entries.map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3 dark:border-slate-700/60 dark:bg-slate-950/40">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{formatMeasurementLabel(key)}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Aucune mesure renseignee.</p>
      )}
      {notes ? <p className="mt-4 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{notes}</p> : null}
    </div>
  );
}
