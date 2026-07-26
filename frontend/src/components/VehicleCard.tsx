import { useState } from 'react';
import { Vehicle } from '../types';
import Badge from './Badge';
import Button from './Button';
import StockGauge from './StockGauge';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPurchase?: (vehicle: Vehicle) => void;
  // Admin-only controls: rendered only when `isAdmin` is true and the matching
  // callback is provided.
  isAdmin?: boolean;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (vehicle: Vehicle) => void;
  onRestock?: (vehicle: Vehicle, amount: number) => void;
}

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function VehicleCard({
  vehicle,
  onPurchase,
  isAdmin = false,
  onEdit,
  onDelete,
  onRestock,
}: VehicleCardProps) {
  const soldOut = vehicle.quantity === 0;
  const [restockAmount, setRestockAmount] = useState('1');

  const handleRestock = () => {
    const amount = Number(restockAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    onRestock?.(vehicle, amount);
  };

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold leading-tight text-ink">
            {vehicle.make} {vehicle.model}
          </h3>
          <div className="mt-1">
            <Badge category={vehicle.category} />
          </div>
        </div>
        <span className="font-mono text-lg font-semibold text-ink">
          {priceFormatter.format(vehicle.price)}
        </span>
      </header>

      <StockGauge quantity={vehicle.quantity} />

      <Button
        variant="primary"
        disabled={soldOut}
        onClick={() => onPurchase?.(vehicle)}
        className="w-full"
      >
        {soldOut ? 'Sold out' : 'Purchase'}
      </Button>

      {isAdmin && (
        <div className="flex flex-col gap-3 border-t border-ink/10 pt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink/40">
            Admin
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => onEdit?.(vehicle)}>
              Edit
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => onDelete?.(vehicle)}>
              Delete
            </Button>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex flex-1 flex-col gap-1">
              <label
                htmlFor={`restock-${vehicle.id}`}
                className="text-xs font-medium text-ink/60"
              >
                Restock amount
              </label>
              <input
                id={`restock-${vehicle.id}`}
                type="number"
                min={1}
                value={restockAmount}
                onChange={(e) => setRestockAmount(e.target.value)}
                className="rounded-lg border border-ink/20 bg-white px-3 py-2 font-mono text-sm text-ink"
              />
            </div>
            <Button variant="secondary" onClick={handleRestock}>
              Restock
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
