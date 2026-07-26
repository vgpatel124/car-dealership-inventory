import { FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

type Mode = 'login' | 'register';

// The signed-out screen: a centered card on the paper canvas offering login or
// registration. Both flows share one form; only the submit handler differs.
export default function AuthPanel() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    // Clear the register-only field so a stale mismatch error can't linger when
    // switching modes.
    setConfirmPassword('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register' && password !== confirmPassword) {
      // Frontend-only check: bail before touching the API so no request fires.
      setError("Passwords don't match");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        // Confirm Password is validation-only; the API takes { email, password }.
        await register(email, password);
      }
    } catch (err) {
      // The API layer already surfaces the backend's `message` (400/401/409),
      // so we show that text rather than a raw exception.
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 text-ink"
      // Subtle amber-over-paper wash (both existing tokens) — reads as soft
      // texture/light, not a new brand color.
      style={{
        background:
          'radial-gradient(120% 80% at 50% -10%, rgba(226, 166, 59, 0.10) 0%, rgba(246, 245, 241, 1) 55%)',
      }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          {/* Understated line-art car, matching StockGauge's stroke style, with a
              single amber accent (the headlight). */}
          <svg
            viewBox="0 0 120 64"
            className="mx-auto mb-3 h-12 w-auto"
            fill="none"
            role="img"
            aria-label="Line-art illustration of a car"
          >
            <path
              d="M8 46 L8 40 C8 36 11 35 15 35 L34 34 L45 23 C47 21 50 20 53 20 L73 20 C77 20 80 22 82 25 L91 34 L106 36 C111 37 112 40 112 43 L112 46"
              stroke="#14183B"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M40 34 L84 34 M62 20 L62 34"
              stroke="#14183B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.45"
            />
            <path
              d="M8 46 L28 46 M52 46 L76 46 M100 46 L112 46"
              stroke="#14183B"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="40" cy="46" r="9" stroke="#14183B" strokeWidth="2.5" />
            <circle cx="88" cy="46" r="9" stroke="#14183B" strokeWidth="2.5" />
            {/* Amber accent: the headlight. */}
            <circle cx="109" cy="40" r="2.5" fill="#E2A63B" />
          </svg>

          <div className="font-display text-2xl font-bold leading-tight">
            Dealership<span className="text-amber">.</span>
            <div className="text-sm font-normal text-ink/60">Inventory System</div>
          </div>

          <p className="mx-auto mt-2 max-w-xs text-sm text-ink/60">
            Manage inventory, monitor stock, and streamline vehicle sales.
          </p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <div className="mb-5 grid grid-cols-2 rounded-lg bg-ink/5 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`rounded-md py-1.5 transition-colors ${
                mode === 'login' ? 'bg-white text-ink shadow-sm' : 'text-ink/60 hover:text-ink'
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`rounded-md py-1.5 transition-colors ${
                mode === 'register' ? 'bg-white text-ink shadow-sm' : 'text-ink/60 hover:text-ink'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-ink/80">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-ink/80">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40"
                placeholder="••••••••"
              />
            </div>

            {mode === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-ink/80">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-ember/10 px-3 py-2 text-sm font-medium text-ember"
              >
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" disabled={submitting} className="w-full">
              {submitting
                ? mode === 'login'
                  ? 'Logging in…'
                  : 'Creating account…'
                : mode === 'login'
                  ? 'Log in'
                  : 'Create account'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
