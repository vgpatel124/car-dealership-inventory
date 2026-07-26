import { FormEvent, useState } from 'react';
import Button from './Button';
import { VehicleSearchFilters } from '../lib/api';
import { inputClass, labelClass } from './formStyles';

interface SearchBarProps {
  onSearch: (filters: VehicleSearchFilters) => void;
  onClear: () => void;
  busy?: boolean;
}

// Explicit "Search" action (rather than debounced live search): it keeps request
// volume predictable with several combinable fields, avoids out-of-order
// responses racing each other, and makes "Clear returns to the full list"
// unambiguous. "Clear" resets the inputs and reloads the complete inventory.
export default function SearchBar({ onSearch, onClear, busy = false }: SearchBarProps) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const filters: VehicleSearchFilters = {};
    if (make.trim()) filters.make = make.trim();
    if (model.trim()) filters.model = model.trim();
    if (category.trim()) filters.category = category.trim();

    const min = Number(minPrice);
    if (minPrice.trim() && Number.isFinite(min)) filters.minPrice = min;
    const max = Number(maxPrice);
    if (maxPrice.trim() && Number.isFinite(max)) filters.maxPrice = max;

    onSearch(filters);
  };

  const handleClear = () => {
    setMake('');
    setModel('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    onClear();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-2xl border border-ink/10 bg-white p-4 shadow-sm"
      aria-label="Search and filter vehicles"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-make" className={labelClass}>
            Make
          </label>
          <input
            id="filter-make"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            className={inputClass}
            placeholder="e.g. Toyota"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-model" className={labelClass}>
            Model
          </label>
          <input
            id="filter-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className={inputClass}
            placeholder="e.g. Corolla"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-category" className={labelClass}>
            Category
          </label>
          <input
            id="filter-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
            placeholder="e.g. Sedan"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-min-price" className={labelClass}>
            Min price
          </label>
          <input
            id="filter-min-price"
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className={`${inputClass} font-mono`}
            placeholder="0"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-max-price" className={labelClass}>
            Max price
          </label>
          <input
            id="filter-max-price"
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className={`${inputClass} font-mono`}
            placeholder="Any"
          />
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <Button type="submit" variant="primary" disabled={busy}>
          Search
        </Button>
        <Button type="button" variant="secondary" onClick={handleClear} disabled={busy}>
          Clear
        </Button>
      </div>
    </form>
  );
}
