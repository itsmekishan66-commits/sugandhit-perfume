import { AuthProvider } from '../context/AuthProvider';
import { useAuth } from '../context/useAuth';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import Login from '../features/auth/Login';
import AppRoutes from './routes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Screens = () => {
  const { token, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <AuthLayout>
        <Login />
      </AuthLayout>
    );
  }

  return (
    <DashboardLayout>
      <AppRoutes token={token} />
    </DashboardLayout>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-cream text-ink">
        <ToastContainer />
        <Screens />
      </div>
    </AuthProvider>
  );
};

export default App;