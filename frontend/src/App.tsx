import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
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

// Espace Atelier
import { AtelierDashboardPage } from './pages/atelier/AtelierDashboardPage';
import { FormationsPage } from './pages/atelier/FormationsPage';
import { StockTissuPage } from './pages/atelier/StockTissuPage';

// Espace Pressing
import { PressingDashboardPage } from './pages/pressing/PressingDashboardPage';
import { LaundryTypesPage } from './pages/pressing/LaundryTypesPage';
import { ArticlesPage } from './pages/pressing/ArticlesPage';

// Gestion des rôles et profil
import { RolesManagementPage } from './pages/roles/RolesManagementPage';
import { ProfilePage } from './pages/profile/ProfilePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function PressingRoute({ children }: { children: React.ReactNode }) {
  const { hasPressingAccess, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPressingAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AtelierRoute({ children }: { children: React.ReactNode }) {
  const { hasAtelierAccess, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAtelierAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard principal */}
        <Route index element={<DashboardPage />} />
        
        {/* Clients (commun) */}
        <Route path="clients" element={<ClientsListPage />} />
        <Route path="clients/new" element={<ClientCreatePage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        
        {/* Commandes (commun) */}
        <Route path="orders" element={<OrdersListPage />} />
        <Route path="orders/new" element={<OrderCreatePage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        
        {/* Espace Pressing */}
        <Route
          path="pressing"
          element={
            <PressingRoute>
              <PressingDashboardPage />
            </PressingRoute>
          }
        />
        <Route
          path="pressing/laundry-types"
          element={
            <PressingRoute>
              <LaundryTypesPage />
            </PressingRoute>
          }
        />
        <Route
          path="pressing/articles"
          element={
            <PressingRoute>
              <ArticlesPage />
            </PressingRoute>
          }
        />
        <Route
          path="pressing/orders"
          element={
            <PressingRoute>
              <OrdersListPage />
            </PressingRoute>
          }
        />
        <Route
          path="pressing/clients"
          element={
            <PressingRoute>
              <ClientsListPage />
            </PressingRoute>
          }
        />
        
        {/* Espace Atelier/Couture */}
        <Route
          path="atelier"
          element={
            <AtelierRoute>
              <AtelierDashboardPage />
            </AtelierRoute>
          }
        />
        <Route
          path="atelier/formations"
          element={
            <AtelierRoute>
              <FormationsPage />
            </AtelierRoute>
          }
        />
        <Route
          path="atelier/stock"
          element={
            <AtelierRoute>
              <StockTissuPage />
            </AtelierRoute>
          }
        />
        <Route
          path="atelier/orders"
          element={
            <AtelierRoute>
              <OrdersListPage />
            </AtelierRoute>
          }
        />
        <Route
          path="atelier/clients"
          element={
            <AtelierRoute>
              <ClientsListPage />
            </AtelierRoute>
          }
        />
        
        {/* Ancien chemin couture - redirection vers atelier */}
        <Route
          path="couture"
          element={
            <AtelierRoute>
              <AtelierDashboardPage />
            </AtelierRoute>
          }
        />
        
        {/* Admin uniquement */}
        <Route
          path="measurement-fields"
          element={
            <AdminRoute>
              <MeasurementFieldsPage />
            </AdminRoute>
          }
        />
        
        {/* Super Admin uniquement */}
        <Route
          path="users"
          element={
            <SuperAdminRoute>
              <UsersPage />
            </SuperAdminRoute>
          }
        />
        <Route
          path="users/new"
          element={
            <SuperAdminRoute>
              <UserCreatePage />
            </SuperAdminRoute>
          }
        />
        <Route
          path="users/:id"
          element={
            <SuperAdminRoute>
              <UserDetailPage />
            </SuperAdminRoute>
          }
        />
        <Route
          path="roles"
          element={
            <SuperAdminRoute>
              <RolesManagementPage />
            </SuperAdminRoute>
          }
        />
        
        {/* Profil utilisateur */}
        <Route path="profile" element={<ProfilePage />} />
        
        {/* Paramètres */}
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
