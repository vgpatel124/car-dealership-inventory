import { useEffect, useRef, useState } from 'react';
import { Vehicle } from '../types';
import Badge from './Badge';
import Button from './Button';
import StockGauge from './StockGauge';

interface VehicleCardProps {
  vehicle: Vehicle;
  // Resolves true on a successful purchase so the card can show its toast;
  // resolves false (or rejects handled upstream) on failure — no toast then.
  onPurchase?: (vehicle: Vehicle) => void | Promise<boolean | void>;
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

  const [purchasing, setPurchasing] = useState(false);
  // Two-phase toast so both entrance and exit can animate: `mounted` controls
  // presence in the DOM, `shown` toggles the visible/hidden transition classes.
  const [toastMounted, setToastMounted] = useState(false);
  const [toastShown, setToastShown] = useState(false);
  const dismissTimer = useRef<number>();
  const unmountTimer = useRef<number>();

  useEffect(
    () => () => {
      window.clearTimeout(dismissTimer.current);
      window.clearTimeout(unmountTimer.current);
    },
    [],
  );

  const showPurchaseToast = () => {
    window.clearTimeout(dismissTimer.current);
    window.clearTimeout(unmountTimer.current);
    setToastMounted(true);
    // Flip to the visible state on the next frame so the enter transition runs.
    requestAnimationFrame(() => setToastShown(true));
    dismissTimer.current = window.setTimeout(() => {
      setToastShown(false); // play the exit transition…
      unmountTimer.current = window.setTimeout(() => setToastMounted(false), 250); // …then unmount
    }, 3000);
  };

  const handlePurchase = async () => {
    if (purchasing || soldOut) return;
    setPurchasing(true);
    try {
      const ok = await onPurchase?.(vehicle);
      // Only celebrate an actual success; a 409/failure returns false and the
      // inline ember error is surfaced by the parent instead.
      if (ok) showPurchaseToast();
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestock = () => {
    const amount = Number(restockAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    onRestock?.(vehicle, amount);
  };

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm transition duration-200 hover:border-ink/20 hover:shadow-lg motion-safe:hover:-translate-y-1">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold leading-tight text-ink">
            {vehicle.make} {vehicle.model}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge category={vehicle.category} />
            {/* Fixed ember variant — deliberately NOT a category Badge, so the
                sold-out signal never collides with the category color rotation. */}
            {soldOut && (
              <span className="inline-flex items-center rounded-full bg-ember/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-ember">
                Out of stock
              </span>
            )}
          </div>
        </div>
        <span className="font-mono text-lg font-semibold text-ink">
          {priceFormatter.format(vehicle.price)}
        </span>
      </header>

      <StockGauge quantity={vehicle.quantity} />

      <div className="flex flex-col gap-2">
        <Button
          variant="primary"
          disabled={soldOut || purchasing}
          onClick={handlePurchase}
          className="w-full"
        >
          {soldOut ? 'Sold out' : purchasing ? 'Purchasing…' : 'Purchase'}
        </Button>

        {toastMounted && (
          <div
            role="status"
            className={`rounded-lg bg-moss/10 px-3 py-2 text-center text-sm font-medium text-moss transition-all duration-200 ${
              toastShown ? 'translate-y-0 opacity-100' : '-translate-y-1 opacity-0'
            }`}
          >
            Vehicle purchased successfully.
          </div>
        )}
      </div>

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
