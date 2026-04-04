import { useMemo, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ClientType } from '../types/auth';

type Step = 1 | 2 | 3 | 4;

const clientTypeOptions: { value: ClientType; label: string; description: string }[] = [
  { value: 'pressing', label: 'Pressing', description: 'Nettoyage, repassage et suivi pressing.' },
  { value: 'atelier', label: 'Atelier / Couture', description: 'Retouches, ourlets et sur mesure.' },
  { value: 'both', label: 'Les deux', description: 'Acces complet aux deux espaces.' },
];

function validatePhone(value: string) {
  return /^\+?[0-9]{8,15}$/.test(value.replace(/\s+/g, ''));
}

function validatePassword(value: string) {
  return value.length >= 6;
}

function getPasswordStrength(value: string) {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return score;
}

function getDefaultRedirect(role?: string) {
  return role === 'CLIENT' ? '/client/dashboard' : '/';
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated, user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    clientType: 'both' as ClientType,
    acceptedTerms: false,
    password: '',
    confirmPassword: '',
  });

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordStrengthLabel = ['Tres faible', 'Faible', 'Correct', 'Bon', 'Solide'][passwordStrength];
  const progress = useMemo(() => (step / 4) * 100, [step]);

  if (isAuthenticated) {
    return <Navigate to={getDefaultRedirect(user?.role)} replace />;
  }

  const updateField = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateCurrentStep = () => {
    const nextErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.prenom.trim()) nextErrors.prenom = 'Prenom requis';
      if (!formData.nom.trim()) nextErrors.nom = 'Nom requis';
      if (!validatePhone(formData.telephone)) nextErrors.telephone = 'Numero invalide';
      if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) nextErrors.email = 'Email invalide';
    }

    if (step === 2) {
      if (!formData.clientType) nextErrors.clientType = 'Choisissez un espace';
      if (!formData.acceptedTerms) nextErrors.acceptedTerms = 'Vous devez accepter les conditions';
    }

    if (step === 3) {
      if (!validatePassword(formData.password)) {
        nextErrors.password = 'Min. 6 caracteres requis';
      }
      if (formData.password !== formData.confirmPassword) {
        nextErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    setStep((current) => Math.min(4, current + 1) as Step);
  };

  const handleBack = () => setStep((current) => Math.max(1, current - 1) as Step);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const registeredUser = await register({
        prenom: formData.prenom.trim(),
        nom: formData.nom.trim(),
        telephone: formData.telephone.trim(),
        email: formData.email.trim() || undefined,
        adresse: formData.adresse.trim() || undefined,
        clientType: formData.clientType,
        password: formData.password,
      });

      setSuccessMessage('Compte cree ! Redirection vers votre espace client...');
      setTimeout(() => {
        navigate(getDefaultRedirect(registeredUser.role), { replace: true });
      }, 2000);
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || 'Impossible de creer le compte';
      setErrors({ submit: String(message) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.18),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#0f172a_50%,_#020617_100%)] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
            Espace Kanaga
          </Link>
          <Link to="/login" className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-blue-400 hover:text-white">
            Deja un compte ?
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="rounded-[32px] border border-slate-800/70 bg-slate-900/70 p-8 shadow-2xl shadow-black/30">
            <span className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1 text-sm font-semibold text-blue-300">
              Inscription client
            </span>
            <h1 className="mt-6 text-4xl font-black tracking-tight">Creez votre espace client en 4 etapes</h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Renseignez vos informations, choisissez vos services puis activez votre acces pour suivre vos commandes.
            </p>

            <div className="mt-8 space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className={`rounded-2xl border px-4 py-4 ${step === item ? 'border-blue-400/50 bg-blue-500/10' : 'border-slate-800 bg-slate-950/50'}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Etape {item}</p>
                  <p className="mt-1 font-semibold text-white">
                    {item === 1 && 'Informations personnelles'}
                    {item === 2 && 'Type de client'}
                    {item === 3 && 'Securite'}
                    {item === 4 && 'Confirmation'}
                  </p>
                </div>
              ))}
            </div>
          </aside>

          <section className="rounded-[32px] border border-slate-800/70 bg-slate-900/70 p-8 shadow-2xl shadow-black/30">
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Progression</span>
                <span>{step}/4</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-800">
                <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 ? (
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Prenom *" error={errors.prenom}>
                    <input className="input-field" value={formData.prenom} onChange={(e) => updateField('prenom', e.target.value)} />
                  </Field>
                  <Field label="Nom *" error={errors.nom}>
                    <input className="input-field" value={formData.nom} onChange={(e) => updateField('nom', e.target.value)} />
                  </Field>
                  <Field label="Telephone *" error={errors.telephone}>
                    <input className="input-field" type="tel" placeholder="+22370000000" value={formData.telephone} onChange={(e) => updateField('telephone', e.target.value)} />
                  </Field>
                  <Field label="Email" error={errors.email}>
                    <input className="input-field" type="email" placeholder="vous@email.com" value={formData.email} onChange={(e) => updateField('email', e.target.value)} />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Adresse">
                      <textarea className="input-field min-h-[110px]" placeholder="Quartier, rue, points de repere..." value={formData.adresse} onChange={(e) => updateField('adresse', e.target.value)} />
                    </Field>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Je suis interesse par :</p>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      {clientTypeOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateField('clientType', option.value)}
                          className={`rounded-3xl border p-5 text-left transition ${
                            formData.clientType === option.value
                              ? 'border-blue-400/60 bg-blue-500/10'
                              : 'border-slate-800 bg-slate-950/50 hover:border-slate-600'
                          }`}
                        >
                          <p className="font-semibold text-white">{option.label}</p>
                          <p className="mt-2 text-sm text-slate-400">{option.description}</p>
                        </button>
                      ))}
                    </div>
                    {errors.clientType ? <p className="mt-2 text-sm text-red-400">{errors.clientType}</p> : null}
                  </div>

                  <label className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <input
                      type="checkbox"
                      checked={formData.acceptedTerms}
                      onChange={(e) => updateField('acceptedTerms', e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900"
                    />
                    <span className="text-sm text-slate-300">J accepte les conditions d utilisation et la politique de confidentialite.</span>
                  </label>
                  {errors.acceptedTerms ? <p className="text-sm text-red-400">{errors.acceptedTerms}</p> : null}
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-5">
                  <Field label="Mot de passe *" error={errors.password}>
                    <div className="relative">
                      <input
                        className="input-field pr-12"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => updateField('password', e.target.value)}
                      />
                      <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        {showPassword ? 'Masquer' : 'Voir'}
                      </button>
                    </div>
                  </Field>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Force du mot de passe</span>
                      <span className="font-semibold text-slate-200">{passwordStrengthLabel}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          className={`h-2 rounded-full ${passwordStrength >= bar ? 'bg-gradient-to-r from-blue-500 to-violet-500' : 'bg-slate-800'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <Field label="Confirmer le mot de passe *" error={errors.confirmPassword}>
                    <div className="relative">
                      <input
                        className="input-field pr-12"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => updateField('confirmPassword', e.target.value)}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        {showConfirmPassword ? 'Masquer' : 'Voir'}
                      </button>
                    </div>
                  </Field>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Recapitulatif</p>
                    <dl className="mt-4 grid gap-4 md:grid-cols-2">
                      <SummaryItem label="Prenom" value={formData.prenom} />
                      <SummaryItem label="Nom" value={formData.nom} />
                      <SummaryItem label="Telephone" value={formData.telephone} />
                      <SummaryItem label="Email" value={formData.email || 'Non renseigne'} />
                      <SummaryItem label="Type de client" value={clientTypeOptions.find((item) => item.value === formData.clientType)?.label || formData.clientType} />
                      <SummaryItem label="Adresse" value={formData.adresse || 'Non renseignee'} />
                    </dl>
                  </div>

                  {successMessage ? (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                      {successMessage}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {errors.submit ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {errors.submit}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={step === 1 || isSubmitting}
                  className="inline-flex items-center justify-center rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Retour
                </button>

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-500/20"
                  >
                    Continuer
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? 'Creation en cours...' : 'Creer mon compte'}
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-200">{label}</span>
      {children}
      {error ? <span className="mt-2 block text-sm text-red-400">{error}</span> : null}
    </label>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</dt>
      <dd className="mt-2 text-sm font-medium text-slate-100">{value}</dd>
    </div>
  );
}
