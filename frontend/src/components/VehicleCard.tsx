import { Vehicle } from '../types';
import Badge from './Badge';
import Button from './Button';
import StockGauge from './StockGauge';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPurchase?: (vehicle: Vehicle) => void;
}

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function VehicleCard({ vehicle, onPurchase }: VehicleCardProps) {
  const soldOut = vehicle.quantity === 0;

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
    </article>
  );
}
