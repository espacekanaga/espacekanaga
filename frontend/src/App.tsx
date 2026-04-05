import { Suspense, lazy, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsListPage } from './pages/clients/ClientsListPage';
import { ClientDetailPage } from './pages/clients/ClientDetailPage';
import { ClientCreatePage } from './pages/clients/ClientCreatePage';
import { OrdersListPage } from './pages/orders/OrdersListPage';
import { OrderDetailPage } from './pages/orders/OrderDetailPage';
import { OrderCreatePage } from './pages/orders/OrderCreatePage';
import { MeasurementFieldsPage } from './pages/measurements/MeasurementFieldsPage';
import { UsersPage } from './pages/users/UsersPage';
import { UserCreatePage } from './pages/users/UserCreatePage';
import { UserDetailPage } from './pages/users/UserDetailPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { InvoicesListPage } from './pages/invoices/InvoicesListPage';
import { InvoiceDetailPage } from './pages/invoices/InvoiceDetailPage';
import { AtelierDashboardPage } from './pages/atelier/AtelierDashboardPage';
import { FormationsPage } from './pages/atelier/FormationsPage';
import { StockTissuPage } from './pages/atelier/StockTissuPage';
import { PressingDashboardPage } from './pages/pressing/PressingDashboardPage';
import { LaundryTypesPage } from './pages/pressing/LaundryTypesPage';
import { ArticlesPage } from './pages/pressing/ArticlesPage';
import { RolesManagementPage } from './pages/roles/RolesManagementPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { PricingManagementPage } from './pages/settings/PricingManagementPage';

const ClientDashboardPage = lazy(() => import('./pages/client/ClientDashboardPage').then((module) => ({ default: module.ClientDashboardPage })));
const ClientOrdersPage = lazy(() => import('./pages/client/ClientOrdersPage').then((module) => ({ default: module.ClientOrdersPage })));
const ClientOrderCreatePage = lazy(() => import('./pages/client/ClientOrderCreatePage').then((module) => ({ default: module.ClientOrderCreatePage })));
const ClientOrderDetailPage = lazy(() => import('./pages/client/ClientOrderDetailPage').then((module) => ({ default: module.ClientOrderDetailPage })));
const ClientProfilePage = lazy(() => import('./pages/client/ClientProfilePage').then((module) => ({ default: module.ClientProfilePage })));
const ClientSettingsPage = lazy(() => import('./pages/client/ClientSettingsPage').then((module) => ({ default: module.ClientSettingsPage })));
const ClientPressingPage = lazy(() => import('./pages/client/ClientPressingPage').then((module) => ({ default: module.ClientPressingPage })));
const ClientAtelierPage = lazy(() => import('./pages/client/ClientAtelierPage').then((module) => ({ default: module.ClientAtelierPage })));

function RouteSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
    </div>
  );
}

function StaffRoute() {
  const { isAuthenticated, isLoading, isClient } = useAuth();

  if (isLoading) return <RouteSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isClient) return <Navigate to="/client/dashboard" replace />;

  return <Outlet />;
}

function AdminRoute() {
  const { isAdmin, isAuthenticated, isLoading, isClient } = useAuth();

  if (isLoading) return <RouteSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isClient) return <Navigate to="/client/dashboard" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

function SuperAdminRoute() {
  const { isSuperAdmin, isAuthenticated, isLoading, isClient } = useAuth();

  if (isLoading) return <RouteSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isClient) return <Navigate to="/client/dashboard" replace />;
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

function PressingRoute() {
  const { hasPressingAccess, isAuthenticated, isLoading, isClient } = useAuth();

  if (isLoading) return <RouteSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isClient) return <Navigate to="/client/dashboard" replace />;
  if (!hasPressingAccess) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

function AtelierRoute() {
  const { hasAtelierAccess, isAuthenticated, isLoading, isClient } = useAuth();

  if (isLoading) return <RouteSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isClient) return <Navigate to="/client/dashboard" replace />;
  if (!hasAtelierAccess) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

function ClientRoute() {
  const { isClient, isSuperAdmin, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <RouteSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isClient && !isSuperAdmin) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteSpinner />}>{children}</Suspense>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<StaffRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsListPage />} />
          <Route path="/clients/new" element={<ClientCreatePage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/orders" element={<OrdersListPage />} />
          <Route path="/orders/new" element={<OrderCreatePage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/pricing" element={<PricingManagementPage />} />
          <Route path="/invoices" element={<InvoicesListPage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />

          <Route element={<PressingRoute />}>
            <Route path="/pressing" element={<PressingDashboardPage />} />
            <Route path="/pressing/laundry-types" element={<LaundryTypesPage />} />
            <Route path="/pressing/articles" element={<ArticlesPage />} />
            <Route path="/pressing/orders" element={<OrdersListPage />} />
            <Route path="/pressing/clients" element={<ClientsListPage />} />
          </Route>

          <Route element={<AtelierRoute />}>
            <Route path="/atelier" element={<AtelierDashboardPage />} />
            <Route path="/atelier/formations" element={<FormationsPage />} />
            <Route path="/atelier/stock" element={<StockTissuPage />} />
            <Route path="/atelier/orders" element={<OrdersListPage />} />
            <Route path="/atelier/clients" element={<ClientsListPage />} />
            <Route path="/couture" element={<Navigate to="/atelier" replace />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/measurement-fields" element={<MeasurementFieldsPage />} />
          </Route>

          <Route element={<SuperAdminRoute />}>
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/new" element={<UserCreatePage />} />
            <Route path="/users/:id" element={<UserDetailPage />} />
            <Route path="/roles" element={<RolesManagementPage />} />
          </Route>
        </Route>
      </Route>

      <Route element={<ClientRoute />}>
        <Route element={<Layout />}>
          <Route path="/client" element={<Navigate to="/client/dashboard" replace />} />
          <Route path="/client/dashboard" element={<LazyPage><ClientDashboardPage /></LazyPage>} />
          <Route path="/client/orders" element={<LazyPage><ClientOrdersPage /></LazyPage>} />
          <Route path="/client/orders/new" element={<LazyPage><ClientOrderCreatePage /></LazyPage>} />
          <Route path="/client/orders/:id" element={<LazyPage><ClientOrderDetailPage /></LazyPage>} />
          <Route path="/client/pressing" element={<LazyPage><ClientPressingPage /></LazyPage>} />
          <Route path="/client/atelier" element={<LazyPage><ClientAtelierPage /></LazyPage>} />
          <Route path="/client/profile" element={<LazyPage><ClientProfilePage /></LazyPage>} />
          <Route path="/client/settings" element={<LazyPage><ClientSettingsPage /></LazyPage>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
