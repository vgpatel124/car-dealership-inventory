import { useCallback, useEffect, useState } from 'react';
import { Vehicle } from './types';
import VehicleCard from './components/VehicleCard';
import AuthPanel from './components/AuthPanel';
import Button from './components/Button';
import { useAuth } from './context/AuthContext';
import { listVehicles, purchaseVehicle } from './lib/api';

const navItems = ['Inventory', 'Search', 'Admin'];

function Dashboard() {
  const { user, token, logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Keyed by vehicle id so a failed purchase shows a message on that card only.
  const [purchaseErrors, setPurchaseErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) return;
    let active = true;

    setLoading(true);
    setError(null);
    listVehicles(token)
      .then((data) => {
        if (active) setVehicles(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to load inventory.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const handlePurchase = useCallback(
    async (vehicle: Vehicle) => {
      if (!token) return;
      setPurchaseErrors((prev) => {
        if (!prev[vehicle.id]) return prev;
        const next = { ...prev };
        delete next[vehicle.id];
        return next;
      });

      try {
        const updated = await purchaseVehicle(vehicle.id, token);
        // Update just this vehicle in place — no full-list refetch.
        setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Purchase failed.';
        setPurchaseErrors((prev) => ({ ...prev, [vehicle.id]: message }));
      }
    },
    [token],
  );

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      {/* Sidebar */}
      <aside className="hidden w-60 flex-shrink-0 flex-col bg-ink px-6 py-8 text-paper md:flex">
        <div className="font-display text-xl font-bold leading-tight">
          Dealership<span className="text-amber">.</span>
          <div className="text-sm font-normal text-paper/60">Inventory System</div>
        </div>
        <nav className="mt-10 flex flex-col gap-1">
          {navItems.map((item, i) => (
            <a
              key={item}
              href="#"
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                i === 0 ? 'bg-white/10 text-white' : 'text-paper/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item}
            </a>
          ))}
        </nav>
        <div className="mt-auto text-xs text-paper/40">v0.1.0 · scaffold</div>
      </aside>

      {/* Main canvas */}
      <main className="flex-1 px-6 py-8 md:px-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Inventory</h1>
            <p className="mt-1 text-sm text-ink/60">
              {loading
                ? 'Loading inventory…'
                : `${vehicles.length} ${vehicles.length === 1 ? 'vehicle' : 'vehicles'} in the showroom`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user && <span className="text-sm text-ink/60">{user.email}</span>}
            <Button variant="secondary" onClick={logout}>
              Log out
            </Button>
          </div>
        </header>

        {loading && <p className="text-sm text-ink/60">Loading…</p>}

        {!loading && error && (
          <p role="alert" className="rounded-lg bg-ember/10 px-4 py-3 text-sm font-medium text-ember">
            {error}
          </p>
        )}

        {!loading && !error && vehicles.length === 0 && (
          <p className="text-sm text-ink/60">No vehicles in the showroom yet.</p>
        )}

        {!loading && !error && vehicles.length > 0 && (
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex flex-col gap-2">
                <VehicleCard vehicle={vehicle} onPurchase={handlePurchase} />
                {purchaseErrors[vehicle.id] && (
                  <p
                    role="alert"
                    className="rounded-lg bg-ember/10 px-3 py-2 text-xs font-medium text-ember"
                  >
                    {purchaseErrors[vehicle.id]}
                  </p>
                )}
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const { token } = useAuth();
  return token ? <Dashboard /> : <AuthPanel />;
}
