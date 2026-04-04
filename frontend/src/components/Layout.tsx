import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { ToastProvider, ToastContainer } from './ui/Toast';

type NavigationItem = {
  name: string;
  href: string;
  icon: ({ className }: { className?: string }) => ReactElement;
};

export function Layout() {
  const { user, logout, isSuperAdmin, isAdmin, isClient, hasPressingAccess, hasAtelierAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  const isClientRoute = location.pathname.startsWith('/client');
  const homeHref = isClientRoute ? '/client/dashboard' : '/dashboard';
  const profileHref = isClientRoute ? '/client/profile' : '/profile';
  const settingsHref = isClientRoute ? '/client/settings' : '/settings';

  const adminNavigation = useMemo<NavigationItem[]>(
    () => [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      { name: 'Clients', href: '/clients', icon: UsersIcon },
      { name: 'Commandes', href: '/orders', icon: ShoppingBagIcon },
      ...((hasPressingAccess || hasAtelierAccess || isSuperAdmin) ? [{ name: 'Facturation', href: '/invoices', icon: ReceiptIcon }] : []),
      ...(isAdmin ? [
        { name: 'Espace Pressing', href: '/pressing', icon: SparklesIcon },
        { name: 'Espace Atelier', href: '/atelier', icon: ScissorsIcon },
      ] : []),
      ...(isSuperAdmin ? [{ name: 'Utilisateurs', href: '/users', icon: UserCogIcon }] : []),
      ...(isSuperAdmin ? [{ name: 'Roles & Permissions', href: '/roles', icon: ShieldIcon }] : []),
    ],
    [hasAtelierAccess, hasPressingAccess, isAdmin, isSuperAdmin]
  );

  const clientNavigation = useMemo<NavigationItem[]>(
    () => [
      { name: 'Mon Espace', href: '/client/dashboard', icon: HomeIcon },
      { name: 'Mes Commandes', href: '/client/orders', icon: ShoppingBagIcon },
      { name: 'Espace Pressing', href: '/client/pressing', icon: SparklesIcon },
      { name: 'Espace Atelier', href: '/client/atelier', icon: ScissorsIcon },
      { name: 'Mon Profil', href: '/client/profile', icon: UserIcon },
      { name: 'Parametres', href: '/client/settings', icon: CogIcon },
    ],
    []
  );

  const navigation = isClientRoute ? clientNavigation : adminNavigation;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isOutsideDesktop = desktopDropdownRef.current && !desktopDropdownRef.current.contains(target);
      const isOutsideMobile = mobileDropdownRef.current && !mobileDropdownRef.current.contains(target);
      if (isOutsideDesktop && isOutsideMobile) {
        setIsProfileDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const headerTitle = navigation.find((item) => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`))?.name
    || (isClientRoute ? 'Mon Espace' : 'Dashboard');

  return (
    <ToastProvider value={toast}>
      <div className="min-h-screen text-slate-900 dark:text-slate-50">
        {isMobileMenuOpen ? (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={closeMobileMenu} />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200/70 bg-white/85 backdrop-blur-xl transition-transform duration-200 dark:border-slate-700/50 dark:bg-slate-900/95 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}
        >
          <div className="flex h-16 items-center border-b border-slate-200/70 px-6 dark:border-slate-700/50">
            <Link to={homeHref} className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-500">
              Espace Kanaga
            </Link>
          </div>

          <nav className="space-y-1 p-4">
            {navigation.map((item) => {
              const active = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? 'border border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200/70 bg-white/85 p-4 dark:border-slate-700/50 dark:bg-slate-900/95">
            <button
              onClick={handleLogout}
              className="flex w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
            >
              <LogoutIcon className="mr-3 h-5 w-5" />
              Deconnexion
            </button>
          </div>
        </aside>

        <header className="hidden fixed left-72 right-0 top-0 z-30 h-16 items-center justify-between border-b border-slate-200/70 bg-white/70 px-6 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/80 lg:flex">
          <div className="flex items-center gap-4">
            <div className="font-semibold text-slate-900 dark:text-slate-100">{headerTitle}</div>
            <Link 
              to="/" 
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
            >
              <HomeIcon className="w-4 h-4" />
              Accueil
            </Link>
          </div>

          <div className="relative" ref={desktopDropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen((value) => !value)}
              className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{user?.prenom} {user?.nom}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{isClient ? 'Mon Espace' : user?.email || user?.telephone}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 font-medium text-white">
                {(user?.email?.charAt(0) || user?.prenom?.charAt(0) || '?').toUpperCase()}
              </div>
              <ChevronDownIcon className={`h-4 w-4 text-slate-500 transition-transform dark:text-slate-400 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileDropdownOpen ? (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{user?.prenom} {user?.nom}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{user?.role}</p>
                </div>
                <div className="py-1">
                  <Link to={profileHref} onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50">
                    <UserIcon className="mr-3 h-4 w-4" />
                    Mon Profil
                  </Link>
                  <Link to={settingsHref} onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50">
                    <CogIcon className="mr-3 h-4 w-4" />
                    Parametres
                  </Link>
                </div>
                <div className="mt-1 border-t border-slate-200 pt-1 dark:border-slate-700">
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-red-500 hover:bg-slate-100 dark:text-red-400 dark:hover:bg-slate-700/50"
                  >
                    <LogoutIcon className="mr-3 h-4 w-4" />
                    Deconnexion
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/70 bg-white/70 px-4 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/80 lg:hidden">
          <div className="flex items-center gap-2">
            <button onClick={() => setIsMobileMenuOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800/60" aria-label="Ouvrir le menu">
              <MenuIcon className="h-6 w-6" />
            </button>
            <Link to={homeHref} className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
              {isClientRoute ? 'Mon Espace' : 'Espace Kanaga'}
            </Link>
          </div>
          
          <Link 
            to="/" 
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <HomeIcon className="w-5 h-5" />
          </Link>

          <div className="relative" ref={mobileDropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen((value) => !value)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-medium text-white">
                {(user?.email?.charAt(0) || user?.prenom?.charAt(0) || '?').toUpperCase()}
              </div>
              <ChevronDownIcon className={`h-4 w-4 text-slate-500 transition-transform dark:text-slate-400 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isProfileDropdownOpen ? (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.prenom} {user?.nom}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{user?.email || user?.telephone}</p>
                  <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">{user?.role}</p>
                </div>
                <div className="py-1">
                  <Link to={profileHref} onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50">
                    <UserIcon className="mr-3 h-4 w-4" />
                    Mon Profil
                  </Link>
                  <Link to={settingsHref} onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50">
                    <CogIcon className="mr-3 h-4 w-4" />
                    Parametres
                  </Link>
                </div>
                <div className="mt-1 border-t border-slate-200 pt-1 dark:border-slate-700">
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-red-500 hover:bg-slate-100 dark:text-red-400 dark:hover:bg-slate-700/50"
                  >
                    <LogoutIcon className="mr-3 h-4 w-4" />
                    Deconnexion
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:ml-72 lg:p-8 lg:pt-24">
          <Outlet />
        </main>

        <ToastContainer />
      </div>
    </ToastProvider>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2 7-7 7 7 2 2M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function UserCogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
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

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
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

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function CogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}
