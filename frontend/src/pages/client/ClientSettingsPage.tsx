import { useEffect, useState, type ReactNode } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { clientApi } from '../../api/client';

type NotificationPrefs = {
  sms: boolean;
  email: boolean;
};

const NOTIFICATION_KEY = 'kanaga_client_notifications';

export function ClientSettingsPage() {
  const { theme, setTheme } = useAuth();
  const [notifications, setNotifications] = useState<NotificationPrefs>({ sms: true, email: true });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(NOTIFICATION_KEY);
    if (raw) {
      try {
        setNotifications(JSON.parse(raw));
      } catch {
        localStorage.removeItem(NOTIFICATION_KEY);
      }
    }
  }, []);

  const updateNotifications = (next: NotificationPrefs) => {
    setNotifications(next);
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(next));
    setMessage('Preferences de notification mises a jour.');
    setError('');
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (!/^(?=.*[A-Z])(?=.*[0-9]).{8,}$/.test(passwordData.newPassword)) {
      setError('Le nouveau mot de passe doit contenir 8 caracteres, une majuscule et un chiffre.');
      return;
    }

    setIsSavingPassword(true);
    try {
      await clientApi.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Mot de passe mis a jour.');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Impossible de modifier le mot de passe');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">Parametres</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">Mon compte client</h1>
      </div>

      {message ? <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">{error}</div> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Notifications</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow
              label="Notifications SMS"
              description="Recevoir les mises a jour de commande par SMS."
              checked={notifications.sms}
              onChange={(checked) => updateNotifications({ ...notifications, sms: checked })}
            />
            <ToggleRow
              label="Notifications Email"
              description="Recevoir les confirmations et recapitulatifs par email."
              checked={notifications.email}
              onChange={(checked) => updateNotifications({ ...notifications, email: checked })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Theme</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              ['dark', 'Sombre'],
              ['light', 'Clair'],
              ['system', 'Systeme'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value as 'dark' | 'light' | 'system')}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                  theme === value ? 'border-blue-400/50 bg-blue-500/10' : 'border-slate-200/70 dark:border-slate-700/60'
                }`}
              >
                <span className="font-medium text-slate-900 dark:text-slate-100">{label}</span>
                {theme === value ? <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">Actif</span> : null}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Securite</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Field label="Mot de passe actuel">
                <input className="input-field" type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))} />
              </Field>
              <Field label="Nouveau mot de passe">
                <input className="input-field" type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))} />
              </Field>
              <Field label="Confirmer le nouveau mot de passe">
                <input className="input-field" type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))} />
              </Field>
              <Button type="submit" isLoading={isSavingPassword}>
                Mettre a jour le mot de passe
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Supprimer mon compte</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Cette action doit etre confirmee manuellement par l equipe Kanaga. Utilisez cette demande si vous souhaitez fermer votre compte.
            </p>
            {!confirmDelete ? (
              <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
                Demander la suppression
              </Button>
            ) : (
              <div className="space-y-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Confirmez la demande. Nous preparerons la suppression avec un agent Kanaga.
                </p>
                <div className="flex gap-3">
                  <a
                    href="mailto:contact@espacekanaga.com?subject=Demande%20de%20suppression%20de%20compte"
                    className="inline-flex rounded-full bg-red-600 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Confirmer par email
                  </a>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-2xl border border-slate-200/70 px-4 py-4 text-left dark:border-slate-700/60"
    >
      <div>
        <p className="font-medium text-slate-900 dark:text-slate-100">{label}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <span className={`inline-flex h-7 w-12 rounded-full p-1 transition ${checked ? 'bg-blue-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'}`}>
        <span className="h-5 w-5 rounded-full bg-white" />
      </span>
    </button>
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
