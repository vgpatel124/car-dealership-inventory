import { Vehicle } from './types';
import VehicleCard from './components/VehicleCard';

// Seed data so the design is visible immediately (no backend needed yet).
const sampleVehicles: Vehicle[] = [
  { id: '1', make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 24500, quantity: 8 },
  { id: '2', make: 'Ford', model: 'Bronco', category: 'SUV', price: 41200, quantity: 2 },
  { id: '3', make: 'Tesla', model: 'Model 3', category: 'Electric', price: 39990, quantity: 0 },
  { id: '4', make: 'Honda', model: 'Civic', category: 'Sedan', price: 26800, quantity: 5 },
];

const navItems = ['Inventory', 'Search', 'Admin'];

export default function App() {
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
              {sampleVehicles.length} vehicles in the showroom
            </p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {sampleVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </section>
      </main>
    </div>
  );
}
