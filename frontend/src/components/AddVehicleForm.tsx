import { FormEvent, useState } from 'react';
import Button from './Button';
import { VehicleInput } from '../lib/api';
import { inputClass, labelClass } from './formStyles';

interface AddVehicleFormProps {
  // Resolves on success; rejects with an Error whose message is shown inline.
  onAdd: (input: VehicleInput) => Promise<void>;
}

export default function AddVehicleForm({ onAdd }: AddVehicleFormProps) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setMake('');
    setModel('');
    setCategory('');
    setPrice('');
    setQuantity('');
  };

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
    // Quantity is optional; when omitted the backend defaults it to 0.
    let quantityNum: number | undefined;
    if (quantity.trim()) {
      quantityNum = Number(quantity);
      if (!Number.isFinite(quantityNum) || quantityNum < 0) {
        setError('Quantity must be a non-negative number.');
        return;
      }
    }

    const input: VehicleInput = {
      make: make.trim(),
      model: model.trim(),
      category: category.trim(),
      price: priceNum,
      ...(quantityNum !== undefined ? { quantity: quantityNum } : {}),
    };

    setSubmitting(true);
    try {
      await onAdd(input);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add vehicle.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mb-6 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-ink">Add vehicle</h2>
      <p className="mb-4 mt-0.5 text-xs font-medium uppercase tracking-wide text-amber">
        Admin only
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-1">
            <label htmlFor="add-make" className={labelClass}>
              Make
            </label>
            <input
              id="add-make"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className={inputClass}
              placeholder="Toyota"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="add-model" className={labelClass}>
              Model
            </label>
            <input
              id="add-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={inputClass}
              placeholder="Corolla"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="add-category" className={labelClass}>
              Category
            </label>
            <input
              id="add-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
              placeholder="Sedan"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="add-price" className={labelClass}>
              Price
            </label>
            <input
              id="add-price"
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={`${inputClass} font-mono`}
              placeholder="24500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="add-quantity" className={labelClass}>
              Quantity
            </label>
            <input
              id="add-quantity"
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={`${inputClass} font-mono`}
              placeholder="0"
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

        <div>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add vehicle'}
          </Button>
        </div>
      </form>
    </section>
  );
}
