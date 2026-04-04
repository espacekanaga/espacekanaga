import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

const services = [
  {
    title: 'Espace Pressing',
    description: 'Nettoyage, repassage, detachage et prise en charge rapide de vos vetements du quotidien.',
    icon: SparklesIcon,
  },
  {
    title: 'Espace Atelier',
    description: 'Retouches, ourlets, reparations et couture sur mesure depuis un seul espace client.',
    icon: ScissorsIcon,
  },
];

const steps = [
  'Creer un compte',
  'Choisir un service',
  'Deposer ou passer une commande',
  'Suivre et recuperer',
];

const pricing = {
  pressing: [
    ['Chemise', '2 500 FCFA'],
    ['Pantalon', '3 000 FCFA'],
    ['Robe', '4 500 FCFA'],
  ],
  atelier: [
    ['Ourlet simple', '2 000 FCFA'],
    ['Retouche taille', '3 500 FCFA'],
    ['Reparation zip', '4 000 FCFA'],
  ],
};

const reviews = [
  ['Awa T.', 'Commande atelier tres claire, j ai suivi ma retouche jusqu a la livraison.'],
  ['Moussa D.', 'Tres pratique pour le pressing. Les prix et les delais sont visibles avant validation.'],
  ['Sira K.', 'Interface simple sur mobile, parfait pour deposer une commande en quelques minutes.'],
];

export function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleDashboardClick = () => {
    if (user?.role === 'CLIENT') {
      navigate('/client/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_32%),radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.18),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_55%,_#ffffff_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(139,92,246,0.22),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#0f172a_45%,_#020617_100%)] dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/40 bg-white/70 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
            Espace Kanaga
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            <a href="#accueil" className="hover:text-slate-950 dark:hover:text-white">Accueil</a>
            <a href="#services" className="hover:text-slate-950 dark:hover:text-white">Services</a>
            <a href="#tarifs" className="hover:text-slate-950 dark:hover:text-white">Tarifs</a>
            <a href="#contact" className="hover:text-slate-950 dark:hover:text-white">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="hidden sm:inline text-sm text-slate-600 dark:text-slate-300">
                  {user?.prenom} {user?.nom}
                </span>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={handleDashboardClick}
                  className="rounded-full px-4 py-2"
                >
                  Mon Espace
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden text-sm font-semibold text-slate-700 transition hover:text-slate-950 dark:text-slate-200 dark:hover:text-white sm:inline-flex">
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  className="inline-flex rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100"
                >
                  Creer un compte
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section id="accueil" className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
              Pressing et atelier de couture connectes
            </span>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
              Votre Pressing & Atelier de Couture en Ligne
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
              Deposez vos vetements, commandez des retouches, suivez vos commandes et echangez avec l atelier
              depuis votre espace client.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-500/25 transition hover:translate-y-[-1px]"
              >
                Creer mon compte
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100"
              >
                Se connecter
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {['Livraison rapide', 'Prix transparents', 'Suivi en temps reel'].map((badge) => (
                <span
                  key={badge}
                  className="inline-flex rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-8 h-24 w-24 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-violet-400/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/75 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:shadow-black/30">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-400 p-5 text-white">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Pressing</p>
                  <p className="mt-10 text-2xl font-black">Vetements frais en quelques clics</p>
                </div>
                <div className="rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-400 p-5 text-white">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Atelier</p>
                  <p className="mt-10 text-2xl font-black">Retouches et couture suivies en ligne</p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950/60">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Commande active</p>
                  <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">#KAN284</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Statut: en cours de traitement</p>
                </div>
                <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950/60">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Suivi atelier</p>
                  <div className="mt-4 space-y-3">
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Essayage confirme, livraison prevue jeudi</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700 dark:text-blue-300">Services</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">Deux espaces, un seul compte client</h2>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {services.map((service) => (
              <article
                key={service.title}
                className="rounded-[28px] border border-white/70 bg-white/75 p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800/70 dark:bg-slate-900/55 dark:shadow-black/20"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                  <service.icon className="h-7 w-7" />
                </div>
                <h3 className="mt-5 text-2xl font-bold text-slate-950 dark:text-white">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{service.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-slate-200/80 bg-white/80 p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800/70 dark:bg-slate-900/60">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700 dark:text-blue-300">Comment ca marche</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">Un parcours client simple de bout en bout</h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-4">
              {steps.map((step, index) => (
                <div key={step} className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-950/60">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-sm font-black text-white">
                    {index + 1}
                  </div>
                  <p className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="tarifs" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <PricingCard title="Tarifs Pressing" rows={pricing.pressing} />
            <PricingCard title="Tarifs Atelier" rows={pricing.atelier} />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-700 dark:text-blue-300">Temoignages</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">Ce que disent vos futurs clients</h2>
            </div>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {reviews.map(([name, quote]) => (
              <article key={name} className="rounded-[28px] border border-white/70 bg-white/75 p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800/70 dark:bg-slate-900/55">
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">{quote}</p>
                <p className="mt-6 font-semibold text-slate-950 dark:text-white">{name}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer id="contact" className="border-t border-white/50 bg-white/70 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/60">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Espace Kanaga</p>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              La plateforme client pour votre pressing et votre atelier de couture.
            </p>
          </div>
          <FooterColumn title="Liens rapides" items={['Accueil', 'Services', 'Tarifs', 'Contact']} />
          <FooterColumn title="Contact" items={['+223 70 00 00 01', 'contact@espacekanaga.com', 'Bamako, Mali']} />
          <FooterColumn title="Horaires" items={['Lun - Ven: 08h00 - 18h00', 'Samedi: 09h00 - 16h00', 'Facebook | Instagram | WhatsApp']} />
        </div>
      </footer>
    </div>
  );
}

function PricingCard({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/75 p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800/70 dark:bg-slate-900/55">
      <h3 className="text-2xl font-black text-slate-950 dark:text-white">{title}</h3>
      <div className="mt-6 space-y-4">
        {rows.map(([label, price]) => (
          <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950/60">
            <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
            <span className="font-semibold text-slate-950 dark:text-white">{price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</p>
      <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function ScissorsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4.583-7.502a2.975 2.975 0 00-.123-3.326 3.003 3.003 0 00-4.996-3.342L3 14m17-4l-4.583 7.502a2.975 2.975 0 01.123 3.326 3.003 3.003 0 014.996 3.342L21 10M9 7a3 3 0 11-6 0 3 3 0 016 0zm12 0a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
