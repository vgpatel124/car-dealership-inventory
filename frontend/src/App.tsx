import { useCallback, useEffect, useRef, useState } from 'react';
import { Vehicle } from './types';
import VehicleCard from './components/VehicleCard';
import AuthPanel from './components/AuthPanel';
import Button from './components/Button';
import SearchBar from './components/SearchBar';
import AddVehicleForm from './components/AddVehicleForm';
import EditVehicleModal from './components/EditVehicleModal';
import { useAuth } from './context/AuthContext';
import {
  listVehicles,
  searchVehicles,
  purchaseVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  restockVehicle,
  VehicleInput,
  VehicleSearchFilters,
} from './lib/api';

type View = 'inventory' | 'admin';

function Dashboard() {
  const { user, token, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // True when the current grid reflects a filtered search (so the empty state
  // can invite the user to adjust filters instead of implying an empty catalog).
  const [activeSearch, setActiveSearch] = useState(false);
  // Per-card action errors (purchase / delete / restock), keyed by vehicle id.
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [view, setView] = useState<View>('inventory');
  // Mobile-only: the ink sidebar collapses into a slide-out drawer below 640px.
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Guard: only admins can actually be in the admin view (defence in depth even
  // though the nav item is hidden for non-admins).
  const activeView: View = view === 'admin' && isAdmin ? 'admin' : 'inventory';

  const setCardError = (id: string, message: string) =>
    setCardErrors((prev) => ({ ...prev, [id]: message }));

  const clearCardError = (id: string) =>
    setCardErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });

  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listVehicles(token);
      setVehicles(data);
      setActiveSearch(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleSearch = useCallback(
    async (filters: VehicleSearchFilters) => {
      if (!token) return;
      // No filters supplied → treat as "show everything" rather than an empty search.
      if (Object.keys(filters).length === 0) {
        await loadAll();
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await searchVehicles(filters, token);
        setVehicles(data);
        setActiveSearch(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed.');
      } finally {
        setLoading(false);
      }
    },
    [token, loadAll],
  );

  // Resolves true on success so the card can show its success toast, false on
  // failure (the inline ember error below the card is set here as before).
  const handlePurchase = useCallback(
    async (vehicle: Vehicle): Promise<boolean> => {
      if (!token) return false;
      clearCardError(vehicle.id);
      try {
        const updated = await purchaseVehicle(vehicle.id, token);
        setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
        return true;
      } catch (err) {
        setCardError(vehicle.id, err instanceof Error ? err.message : 'Purchase failed.');
        return false;
      }
    },
    [token],
  );

  const handleRestock = useCallback(
    async (vehicle: Vehicle, amount: number) => {
      if (!token) return;
      clearCardError(vehicle.id);
      try {
        const updated = await restockVehicle(vehicle.id, amount, token);
        setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      } catch (err) {
        setCardError(vehicle.id, err instanceof Error ? err.message : 'Restock failed.');
      }
    },
    [token],
  );

  const handleDelete = useCallback(
    async (vehicle: Vehicle) => {
      if (!token) return;
      const confirmed = window.confirm(
        `Delete ${vehicle.make} ${vehicle.model}? This cannot be undone.`,
      );
      if (!confirmed) return;

      clearCardError(vehicle.id);
      try {
        await deleteVehicle(vehicle.id, token);
        setVehicles((prev) => prev.filter((v) => v.id !== vehicle.id));
      } catch (err) {
        setCardError(vehicle.id, err instanceof Error ? err.message : 'Delete failed.');
      }
    },
    [token],
  );

  // Add / edit throw on failure so the form and modal can show the message inline.
  const handleAdd = useCallback(
    async (input: VehicleInput) => {
      if (!token) throw new Error('You are not authenticated.');
      const created = await createVehicle(input, token);
      setVehicles((prev) => [created, ...prev]);
    },
    [token],
  );

  const handleEditSave = useCallback(
    async (id: string, patch: Partial<VehicleInput>) => {
      if (!token) throw new Error('You are not authenticated.');
      const updated = await updateVehicle(id, patch, token);
      setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
    },
    [token],
  );

  // "Search" isn't a separate resource, so its nav item just returns to the
  // Inventory view and jumps focus to the always-present filter bar.
  const goToSearch = useCallback(() => {
    setView('inventory');
    requestAnimationFrame(() => {
      const el = searchRef.current;
      if (!el) return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      el.querySelector('input')?.focus();
    });
  }, []);

  const navItems = [
    {
      key: 'inventory',
      label: 'Inventory',
      active: activeView === 'inventory',
      onClick: () => setView('inventory'),
    },
    { key: 'search', label: 'Search', active: false, onClick: goToSearch },
    // Admin item is only offered to admins.
    ...(isAdmin
      ? [
          {
            key: 'admin',
            label: 'Admin',
            active: activeView === 'admin',
            onClick: () => setView('admin'),
          },
        ]
      : []),
  ];

  // Nav buttons are shared between the desktop sidebar and the mobile drawer.
  // `onNavigate` lets the drawer close itself after a selection.
  const renderNav = (onNavigate?: () => void) => (
    <nav className="mt-10 flex flex-col gap-1">
      {navItems.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => {
            item.onClick();
            onNavigate?.();
          }}
          aria-current={item.active ? 'page' : undefined}
          className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
            item.active
              ? 'bg-white/10 text-white'
              : 'text-paper/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );

  const showEmpty = !loading && !error && vehicles.length === 0;

  // Shared vehicle-grid column rhythm: 1 col mobile → 2 (tablet) → 3 (desktop)
  // → 4 (ultrawide). Reused by the skeleton grid so the loading state matches.
  const gridClass = 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4';

  // Skeleton placeholders shown while fetching/searching so there's no blank
  // flash. `animate-pulse` is neutralised under prefers-reduced-motion.
  const renderSkeletons = () => (
    <>
      <p role="status" className="sr-only">
        Loading vehicles…
      </p>
      <section className={gridClass} aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="h-6 w-2/3 animate-pulse rounded bg-ink/10" />
                <div className="h-4 w-1/3 animate-pulse rounded-full bg-ink/10" />
              </div>
              <div className="h-6 w-16 animate-pulse rounded bg-ink/10" />
            </div>
            <div className="mx-auto h-20 w-40 animate-pulse rounded-t-full bg-ink/5" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-ink/10" />
          </div>
        ))}
      </section>
    </>
  );

  // Shared loading / error / empty / grid block. `adminControls` toggles the
  // per-card edit/delete/restock affordances so they only appear in the admin view.
  const renderVehicles = (adminControls: boolean) => (
    <>
      {loading && renderSkeletons()}

      {!loading && error && (
        <p role="alert" className="rounded-lg bg-ember/10 px-4 py-3 text-sm font-medium text-ember">
          {error}
        </p>
      )}

      {showEmpty && activeSearch && (
        <div className="rounded-2xl border border-dashed border-ink/20 bg-white/60 px-6 py-12 text-center">
          <p className="font-display text-lg font-semibold text-ink">
            No vehicles match your search
          </p>
          <p className="mt-1 text-sm text-ink/60">
            Try broadening your filters or clear them to see the full showroom.
          </p>
        </div>
      )}

      {showEmpty && !activeSearch && (
        <p className="text-sm text-ink/60">No vehicles in the showroom yet.</p>
      )}

      {!loading && !error && vehicles.length > 0 && (
        <section className={gridClass}>
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="flex flex-col gap-2">
              <VehicleCard
                vehicle={vehicle}
                onPurchase={handlePurchase}
                isAdmin={adminControls}
                onEdit={setEditing}
                onDelete={handleDelete}
                onRestock={handleRestock}
              />
              {cardErrors[vehicle.id] && (
                <p
                  role="alert"
                  className="rounded-lg bg-ember/10 px-3 py-2 text-xs font-medium text-ember"
                >
                  {cardErrors[vehicle.id]}
                </p>
              )}
            </div>
          ))}
        </section>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      {/* Desktop sidebar (≥640px). Below that it collapses into the drawer. */}
      <aside className="hidden w-60 flex-shrink-0 flex-col bg-ink px-6 py-8 text-paper sm:flex">
        <div className="font-display text-xl font-bold leading-tight">
          Dealership<span className="text-amber">.</span>
          <div className="text-sm font-normal text-paper/60">Inventory System</div>
        </div>
        {renderNav()}
        <div className="mt-auto text-xs text-paper/40">v0.1.0 · scaffold</div>
      </aside>

      {/* Mobile slide-out drawer (<640px). Only mounted while open so its nav
          buttons never sit off-screen in the tab order. */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 sm:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setSidebarOpen(false)}
            className="overlay-enter absolute inset-0 h-full w-full cursor-default bg-ink/50"
          />
          <aside className="drawer-enter absolute left-0 top-0 flex h-full w-64 flex-col bg-ink px-6 py-8 text-paper shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="font-display text-xl font-bold leading-tight">
                Dealership<span className="text-amber">.</span>
                <div className="text-sm font-normal text-paper/60">Inventory System</div>
              </div>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1.5 text-paper/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {renderNav(() => setSidebarOpen(false))}
            <div className="mt-auto text-xs text-paper/40">v0.1.0 · scaffold</div>
          </aside>
        </div>
      )}

      {/* Main canvas */}
      <main className="flex-1 px-6 py-8 md:px-10">
        {/* Mobile top bar with the hamburger toggle (<640px only). */}
        <div className="mb-6 flex items-center justify-between sm:hidden">
          <div className="font-display text-lg font-bold leading-tight text-ink">
            Dealership<span className="text-amber">.</span>
          </div>
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg border border-ink/20 p-2 text-ink transition-colors hover:bg-ink/5"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-ink">Inventory</h1>
            <p className="mt-1 text-sm text-ink/60">
              {loading
                ? 'Loading inventory…'
                : `${vehicles.length} ${vehicles.length === 1 ? 'vehicle' : 'vehicles'}${
                    activeSearch ? ' match your search' : ' in the showroom'
                  }`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-sm text-ink/60">
                {user.email}
                {isAdmin && (
                  <span className="ml-2 rounded-full bg-amber/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-ink">
                    Admin
                  </span>
                )}
              </span>
            )}
            <Button variant="secondary" onClick={logout}>
              Log out
            </Button>
          </div>
        </header>

        {activeView === 'inventory' && (
          <>
            <div ref={searchRef}>
              <SearchBar onSearch={handleSearch} onClear={loadAll} busy={loading} />
            </div>
            {renderVehicles(false)}
          </>
        )}

        {activeView === 'admin' && isAdmin && (
          <>
            <AddVehicleForm onAdd={handleAdd} />
            {renderVehicles(true)}
          </>
        )}
      </main>

      {editing && (
        <EditVehicleModal
          vehicle={editing}
          onSave={handleEditSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  const { token } = useAuth();
  return token ? <Dashboard /> : <AuthPanel />;
}
