interface BadgeProps {
  category: string;
}

// A small fixed palette; a category name is hashed to one entry so the same
// category always gets the same color (deterministic, no server state needed).
const palette = [
  { bg: 'bg-amber/15', text: 'text-amber' },
  { bg: 'bg-moss/15', text: 'text-moss' },
  { bg: 'bg-ember/15', text: 'text-ember' },
  { bg: 'bg-ink/10', text: 'text-ink' },
  { bg: 'bg-amber/25', text: 'text-ink' },
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
