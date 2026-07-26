import { FormEvent, useState } from 'react';
import { Vehicle } from '../types';
import { VehicleInput } from '../lib/api';
import Button from './Button';

interface EditVehicleModalProps {
  vehicle: Vehicle;
  // Resolves on success (modal then closes); rejects with an Error shown inline.
  onSave: (id: string, patch: Partial<VehicleInput>) => Promise<void>;
  onClose: () => void;
}

const inputClass =
  'rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40';
const labelClass = 'text-xs font-medium text-ink/60';

// A small modal for editing a vehicle. Prefilled from the current record; only
// changed fields are sent as a partial PUT.
export default function EditVehicleModal({ vehicle, onSave, onClose }: EditVehicleModalProps) {
  const [make, setMake] = useState(vehicle.make);
  const [model, setModel] = useState(vehicle.model);
  const [category, setCategory] = useState(vehicle.category);
  const [price, setPrice] = useState(String(vehicle.price));
  const [quantity, setQuantity] = useState(String(vehicle.quantity));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!make.trim() || !model.trim() || !category.trim()) {
      setError('Make, model and category are required.');
      return;
    }
    const priceNum = Number(price);
    if (!price.trim() || !Number.isFinite(priceNum) || priceNum < 0) {
      setError('Price must be a non-negative number.');
      return;
    }
    const quantityNum = Number(quantity);
    if (!quantity.trim() || !Number.isFinite(quantityNum) || quantityNum < 0) {
      setError('Quantity must be a non-negative number.');
      return;
    }

    // Send only the fields that actually changed.
    const patch: Partial<VehicleInput> = {};
    if (make.trim() !== vehicle.make) patch.make = make.trim();
    if (model.trim() !== vehicle.model) patch.model = model.trim();
    if (category.trim() !== vehicle.category) patch.category = category.trim();
    if (priceNum !== vehicle.price) patch.price = priceNum;
    if (quantityNum !== vehicle.quantity) patch.quantity = quantityNum;

    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      await onSave(vehicle.id, patch);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-vehicle-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-ink/10 bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="edit-vehicle-title" className="font-display text-lg font-semibold text-ink">
          Edit vehicle
        </h2>
        <p className="mb-4 mt-0.5 text-sm text-ink/60">
          {vehicle.make} {vehicle.model}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="edit-make" className={labelClass}>
                Make
              </label>
              <input id="edit-make" value={make} onChange={(e) => setMake(e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="edit-model" className={labelClass}>
                Model
              </label>
              <input id="edit-model" value={model} onChange={(e) => setModel(e.target.value)} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="edit-category" className={labelClass}>
                Category
              </label>
              <input
                id="edit-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="edit-price" className={labelClass}>
                Price
              </label>
              <input
                id="edit-price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="edit-quantity" className={labelClass}>
                Quantity
              </label>
              <input
                id="edit-quantity"
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-ember/10 px-3 py-2 text-sm font-medium text-ember"
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
