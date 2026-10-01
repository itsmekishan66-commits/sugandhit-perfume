import type { ReactNode } from 'react';
import Loading from '@/components/ui/Loading';
import { useApp } from '@/context/AppContext';

/** Which AppProvider fetch a route has to wait for before it can render. */
export type PageNeeds = 'products' | 'palette';

interface PageGateProps {
  needs: PageNeeds;
  label: string;
  children: ReactNode;
}

/**
 * Holds a route on the shared loading animation until the app-level fetch it depends
 * on has settled. `productsLoaded` / `paletteLoaded` are set in `AppProvider`'s `finally`
 * blocks, so a failed fetch still releases the gate and lets the page render its own
 * empty state rather than hanging here.
 *
 * Kept at the route level (see `app/routes.tsx`) because every gated page renders inside
 * `MainLayout`, whose Navbar badge counts are derived from the same `products` array.
 */
const PageGate = ({ needs, label, children }: PageGateProps) => {
  const { productsLoaded, paletteLoaded } = useApp();
  const ready = needs === 'palette' ? paletteLoaded : productsLoaded;

  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-14">
        <Loading variant="inline" className="w-55 md:w-100" label={label} />
      </div>
    );
  }

  return <>{children}</>;
};

export default PageGate;