import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../api/users';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Form';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

type Theme = 'dark' | 'light' | 'system';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, theme, setTheme, updateUser, hasPressingAccess, hasAtelierAccess } = useAuth();
  const { showSuccess, showError } = useToast();

  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const resolvedTheme = useMemo(() => {
    if (theme !== 'system') return theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, [theme]);

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

  return (
    <div>
      <PageHeader title="Paramètres" description="Personnalisez votre expérience">
        <Button variant="secondary" onClick={() => navigate('/')}>
          Retour
        </Button>
      </PageHeader>

      <div className="space-y-6 max-w-2xl">
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
                <span className="text-slate-900 dark:text-slate-200">Espace Kanaga ERP</span>
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
