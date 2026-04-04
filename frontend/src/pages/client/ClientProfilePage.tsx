import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { clientApi, type ClientMe } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/Loading';
import { formatDate } from './clientShared';

export function ClientProfilePage() {
  const [profile, setProfile] = useState<ClientMe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await clientApi.getMe();
        setProfile(data);
        setFormData({
          prenom: data.prenom,
          nom: data.nom,
          telephone: data.telephone,
          email: data.email || '',
          adresse: data.adresse || '',
        });
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Impossible de charger le profil');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      const updated = await clientApi.updateProfile({
        prenom: formData.prenom.trim(),
        nom: formData.nom.trim(),
        telephone: formData.telephone.trim(),
        email: formData.email.trim() || null,
        adresse: formData.adresse.trim(),
      });
      setProfile(updated);
      setMessage('Profil client mis a jour.');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Mise a jour impossible');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">Profil client</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Mes informations</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Informations personnelles</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
              <Field label="Prenom">
                <input className="input-field" value={formData.prenom} onChange={(e) => setFormData((prev) => ({ ...prev, prenom: e.target.value }))} />
              </Field>
              <Field label="Nom">
                <input className="input-field" value={formData.nom} onChange={(e) => setFormData((prev) => ({ ...prev, nom: e.target.value }))} />
              </Field>
              <Field label="Telephone">
                <input className="input-field" value={formData.telephone} onChange={(e) => setFormData((prev) => ({ ...prev, telephone: e.target.value }))} />
              </Field>
              <Field label="Email">
                <input className="input-field" type="email" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} />
              </Field>
              <div className="md:col-span-2">
                <Field label="Adresse">
                  <textarea className="input-field min-h-[110px]" value={formData.adresse} onChange={(e) => setFormData((prev) => ({ ...prev, adresse: e.target.value }))} />
                </Field>
              </div>

              {message ? <p className="md:col-span-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}
              {error ? <p className="md:col-span-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</p> : null}

              <div className="md:col-span-2">
                <Button type="submit" isLoading={isSaving}>
                  Enregistrer mon profil
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Resume du compte</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <Summary label="Type de client" value={profile?.clientType === 'both' ? 'Pressing + Atelier' : profile?.clientType === 'atelier' ? 'Atelier' : 'Pressing'} />
              <Summary label="Date de creation" value={formatDate(profile?.createdAt)} />
              <Summary label="Commandes" value="Consultez l historique complet dans Mes Commandes." />
              <Link to="/client/orders" className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                Voir mes commandes
              </Link>
            </CardContent>
          </Card>

          {profile?.clientType !== 'pressing' ? (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Mesures atelier</h2>
              </CardHeader>
              <CardContent>
                {profile?.measurements?.length ? (
                  <div className="space-y-4">
                    {profile.measurements.map((measurement) => (
                      <div key={measurement.id} className="rounded-2xl border border-slate-200/70 p-4 dark:border-slate-700/60">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Enregistrees le {formatDate(measurement.createdAt)}</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {Object.entries(measurement.data || {}).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{key.replace(/_/g, ' ')}</p>
                              <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Aucune mesure enregistree pour le moment.</p>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Preferences</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <p>Notifications preferees: SMS / Email</p>
              <p>Ces options sont disponibles dans Parametres.</p>
              <Link to="/client/settings" className="inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                Aller aux parametres
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
      {children}
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}
