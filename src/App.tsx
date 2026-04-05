import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layout/MainLayout';

// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterOrgPage from './pages/auth/RegisterOrgPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// App pages
import DashboardPage from './pages/dashboard/DashboardPage';
import PatientsPage from './pages/patients/PatientsPage';
import PatientDetailPage from './pages/patients/PatientDetailPage';
import NewPatientPage from './pages/patients/NewPatientPage';
import ResultsPage from './pages/results/ResultsPage';
import NewResultPage from './pages/results/NewResultPage';
import ResultDetailPage from './pages/results/ResultDetailPage';
import PrescriptionsPage from './pages/prescriptions/PrescriptionsPage';
import NewPrescriptionPage from './pages/prescriptions/NewPrescriptionPage';
import PrescriptionDetailPage from './pages/prescriptions/PrescriptionDetailPage';
import UsersPage from './pages/users/UsersPage';
import SettingsPage from './pages/settings/SettingsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';

// Public
import ScanPage from './pages/qr/ScanPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};


const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user || user.role !== 'SUPER_ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
};

const OrgAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user || !['ORG_ADMIN', 'SUPER_ADMIN'].includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const HomeRedirect = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // If the user is a Super Admin, send them to their specific dashboard
  if (user?.role === 'SUPER_ADMIN') {
    return <Navigate to="/superadmin" replace />;
  }

  // Otherwise, show the standard Clinic Dashboard
  return <DashboardPage />;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
    <Route path="/register" element={<GuestRoute><RegisterOrgPage /></GuestRoute>} />
    <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
    <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
    <Route path="/scan/:token" element={<ScanPage />} />

    {/* Protected app */}
    <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
      <Route index element={<HomeRedirect />} />

      <Route path="patients" element={<PatientsPage />} />
      <Route path="patients/new" element={<NewPatientPage />} />
      <Route path="patients/:id" element={<PatientDetailPage />} />

      <Route path="results" element={<ResultsPage />} />
      <Route path="results/new" element={<NewResultPage />} />
      <Route path="results/:id" element={<ResultDetailPage />} />

      <Route path="prescriptions" element={<PrescriptionsPage />} />
      <Route path="prescriptions/new" element={<NewPrescriptionPage />} />
      <Route path="prescriptions/:id" element={<PrescriptionDetailPage />} />

      <Route path="notifications" element={<NotificationsPage />} />

      <Route path="users" element={<OrgAdminRoute><UsersPage /></OrgAdminRoute>} />
      <Route path="settings" element={<OrgAdminRoute><SettingsPage /></OrgAdminRoute>} />
      <Route path="superadmin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
