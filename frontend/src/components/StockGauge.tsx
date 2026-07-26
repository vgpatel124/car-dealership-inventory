interface StockGaugeProps {
  quantity: number;
  // Full-tank reference used to scale the needle. Defaults to a sensible max.
  capacity?: number;
  lowStockThreshold?: number;
}

// The signature visual: a fuel-gauge-style semi-circle dial (E → F) that shows
// inventory at a glance. Ember when empty, amber when low, moss when healthy —
// replacing a plain "Qty: 3" label.
export default function StockGauge({
  quantity,
  capacity,
  lowStockThreshold = 3,
}: StockGaugeProps) {
  const max = Math.max(capacity ?? 10, quantity, 1);
  const fraction = Math.min(Math.max(quantity / max, 0), 1);

  // State + color.
  let color = '#3E8F6F'; // moss (healthy)
  let label = 'In stock';
  if (quantity === 0) {
    color = '#C1443A'; // ember (empty)
    label = 'Sold out';
  } else if (quantity <= lowStockThreshold) {
    color = '#E2A63B'; // amber (low)
    label = 'Low stock';
  }

  // Geometry: semi-circle centered at the bottom-middle of the viewBox.
  const cx = 100;
  const cy = 100;
  const r = 78;

  const polar = (t: number) => {
    // t = 0 → E (points left, 180°); t = 1 → F (points right, 0°).
    const angle = Math.PI * (1 - t);
    return { x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) };
  };

  const start = polar(0);
  const end = polar(1);
  const needle = polar(fraction);
  // Pull the needle tip slightly inside the arc.
  const tip = {
    x: cx + (r - 12) * Math.cos(Math.PI * (1 - fraction)),
    y: cy - (r - 12) * Math.sin(Math.PI * (1 - fraction)),
  };

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 120"
        className="w-40"
        role="img"
        aria-label={`${label}: ${quantity} in stock`}
      >
        {/* Track (background arc). */}
        <path
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`}
          fill="none"
          stroke="#14183B"
          strokeOpacity={0.12}
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* Filled portion up to the current level. */}
        <path
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${needle.x} ${needle.y}`}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
        />
        {/* Needle. */}
        <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke="#14183B" strokeWidth={3} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={6} fill="#14183B" />
        {/* E / F endpoints. */}
        <text x="16" y="116" className="fill-ink/60" fontSize="12" fontFamily="'IBM Plex Mono', monospace">
          E
        </text>
        <text x="176" y="116" className="fill-ink/60" fontSize="12" fontFamily="'IBM Plex Mono', monospace">
          F
        </text>
      </svg>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-mono text-lg font-semibold" style={{ color }}>
          {quantity}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color }}>
          {label}
        </span>
      </div>
    </div>
  );
}
