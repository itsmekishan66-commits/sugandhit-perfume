import Providers from './app/providers';
import AppRoutes from './app/routes';
import Toaster from './components/feedback/Toaster';

const App = () => {
  return (
    <Providers>
      <AppRoutes />
      <Toaster />
    </Providers>
  );
};

export default App;