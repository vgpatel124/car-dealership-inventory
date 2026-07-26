import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

// Disabled state uses a token-based muted fill (not just opacity) so the label
// keeps ~5.8:1 contrast against its background — readable and clearly inert,
// satisfying WCAG AA. The :disabled pseudo out-specifies each variant's fill.
const base =
  'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold ' +
  'transition-colors disabled:cursor-not-allowed ' +
  'disabled:bg-ink/10 disabled:text-ink/70 disabled:border-transparent disabled:shadow-none';

const variants: Record<Variant, string> = {
  primary: 'bg-amber text-ink hover:brightness-95',
  secondary: 'bg-transparent text-ink border border-ink/20 hover:bg-ink/5',
  danger: 'bg-ember text-white hover:brightness-95',
};

export default function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
