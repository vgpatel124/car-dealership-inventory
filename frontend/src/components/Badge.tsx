interface BadgeProps {
  category: string;
}

// A small fixed palette; a category name is hashed to one entry so the same
// category always gets the same color (deterministic, no server state needed).
// Text is ink on every chip: colored-on-tint (e.g. amber text on an amber tint)
// only reached ~1.9:1 contrast, so the category hue lives in the background and
// ink carries the label for a consistent, legible read at a glance.
const palette = [
  { bg: 'bg-amber/20', text: 'text-ink' },
  { bg: 'bg-moss/25', text: 'text-ink' },
  { bg: 'bg-ember/20', text: 'text-ink' },
  { bg: 'bg-ink/10', text: 'text-ink' },
  { bg: 'bg-amber/35', text: 'text-ink' },
];

function colorFor(category: string) {
  let hash = 0;
  for (let i = 0; i < category.length; i += 1) {
    hash = (hash * 31 + category.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}

export default function Badge({ category }: BadgeProps) {
  const { bg, text } = colorFor(category);
  return (
    <span
      className={`${bg} ${text} inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide`}
    >
      {category}
    </span>
  );
}
