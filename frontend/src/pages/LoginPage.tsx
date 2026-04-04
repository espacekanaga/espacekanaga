import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function getRedirectForRole(role?: string) {
  return role === 'CLIENT' ? '/client/dashboard' : '/dashboard';
}

export function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotValue, setForgotValue] = useState('');
  const [forgotStep, setForgotStep] = useState<'input' | 'success'>('input');
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to={getRedirectForRole(user?.role)} replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setLoginError('');
    setLoginSuccess('');

    try {
      const trimmed = identifier.trim();
      if (!trimmed) {
        setLoginError('Veuillez saisir votre email ou telephone.');
        return;
      }

      if (!password) {
        setLoginError('Veuillez saisir votre mot de passe.');
        return;
      }

      const isEmail = trimmed.includes('@');
      const loggedUser = await login(isEmail ? { email: trimmed, password } : { telephone: trimmed, password });

      setLoginSuccess(`Bienvenue ${loggedUser.prenom} ${loggedUser.nom}`.trim());
      setTimeout(() => {
        navigate(getRedirectForRole(loggedUser.role), { replace: true });
      }, 900);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        setLoginError('Identifiants invalides.');
      } else if (error?.response?.status === 403) {
        setLoginError('Compte desactive.');
      } else if (error?.response?.data?.error) {
        setLoginError(error.response.data.error);
      } else {
        setLoginError('Impossible de se connecter pour le moment.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!forgotValue.trim()) {
      setLoginError('Saisissez un email ou telephone pour la demande.');
      return;
    }
    setForgotStep('success');
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotValue('');
    setForgotStep('input');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.18),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#0f172a_50%,_#020617_100%)] px-4 py-10 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row">
        <section className="flex-1 rounded-[32px] border border-slate-800/70 bg-slate-900/70 p-8 shadow-2xl shadow-black/30">
          <Link to="/" className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
            Espace Kanaga
          </Link>
          <h1 className="mt-8 text-4xl font-black tracking-tight">Connexion a votre espace</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300">
            Connectez-vous pour suivre vos commandes, gerer vos clients ou piloter vos espaces pressing et atelier.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {['Suivi en temps reel', 'Gestion atelier', 'Commandes centralisees'].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-5 text-sm font-medium text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="w-full max-w-xl rounded-[32px] border border-slate-800/70 bg-slate-900/70 p-8 shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white">Se connecter</h2>
              <p className="mt-2 text-sm text-slate-400">Acces staff et clients.</p>
            </div>
            <Link to="/register" className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-blue-400 hover:text-white">
              Creer un compte
            </Link>
          </div>

          {loginError ? (
            <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {loginError}
            </div>
          ) : null}
          {loginSuccess ? (
            <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {loginSuccess}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-200">Email ou telephone</span>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="input-field"
                placeholder="votre@email.com ou 76123456"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-200">Mot de passe</span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="********"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  {showPassword ? 'Masquer' : 'Voir'}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between gap-4 text-sm">
              <button type="button" onClick={() => setShowForgotModal(true)} className="font-semibold text-blue-300 hover:text-blue-200">
                Mot de passe oublie ?
              </button>
              <Link to="/register" className="text-slate-400 hover:text-slate-200">
                Nouveau client ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-500/20 disabled:opacity-60"
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </section>
      </div>

      {showForgotModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/40">
            {forgotStep === 'input' ? (
              <>
                <h3 className="text-xl font-black text-white">Mot de passe oublie ?</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Saisissez votre email ou telephone. L equipe Kanaga reprendra contact pour reinitialiser votre acces.
                </p>
                <form onSubmit={handleForgotSubmit} className="mt-5 space-y-4">
                  <input className="input-field" value={forgotValue} onChange={(e) => setForgotValue(e.target.value)} placeholder="Email ou telephone" />
                  <div className="flex gap-3">
                    <button type="button" onClick={closeForgotModal} className="flex-1 rounded-full border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200">
                      Annuler
                    </button>
                    <button type="submit" className="flex-1 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white">
                      Envoyer
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">✓</div>
                <h3 className="text-xl font-black text-white">Demande envoyee</h3>
                <p className="text-sm leading-7 text-slate-400">
                  Votre demande a ete transmise a l equipe Kanaga. Vous serez contacte prochainement.
                </p>
                <button type="button" onClick={closeForgotModal} className="w-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white">
                  Retour a la connexion
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
