import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';

/**
 * Content editor.
 *
 * Puck and its stylesheet are behind React.lazy so they land in their own
 * chunk. That is the single most important thing on this page: imported
 * eagerly, the editor would ride along in every marketing page's bundle and
 * blow the performance budget the site publicly commits to.
 */
const PuckEditor = lazy(() => import('../admin/PuckEditor'));

type Session = { configured: boolean; signedIn: boolean };

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/session')
      .then((r) => r.json())
      .then((j) => {
        if (active) setSession({ configured: !!j.configured, signedIn: !!j.signedIn });
      })
      .catch(() => active && setSession({ configured: false, signedIn: false }));
    return () => {
      active = false;
    };
  }, []);

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Sign-in failed.');
      setPassword('');
      setSession({ configured: true, signedIn: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!session) return <Shell>Checking session…</Shell>;

  if (!session.configured) {
    return (
      <Shell>
        <h1 className="text-2xl font-extrabold">Admin is not configured</h1>
        <p className="mt-4 max-w-[52ch] text-silver">
          Generate credentials and put them in <code className="text-gold">.env</code>:
        </p>
        <pre className="mt-4 overflow-x-auto border border-gold/20 bg-ink-2 p-4 font-mono text-[12.5px] text-silver">
          node scripts/hash-password.mjs &quot;your password&quot;
        </pre>
      </Shell>
    );
  }

  if (!session.signedIn) {
    return (
      <Shell>
        <h1 className="text-2xl font-extrabold">Sign in</h1>
        <form onSubmit={signIn} className="mt-6 grid max-w-sm gap-4">
          <label className="grid gap-2">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-silver-dim">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="border border-gold/25 bg-ink-2 px-4 py-3 text-bone outline-none focus-visible:border-gold"
            />
          </label>
          {error ? (
            <p role="alert" className="text-sm text-[#e0876a]">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="border border-gold bg-gold px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-ink disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </Shell>
    );
  }

  return (
    <Suspense fallback={<Shell>Loading editor…</Shell>}>
      <PuckEditor onSignOut={() => setSession({ configured: true, signedIn: false })} />
    </Suspense>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <p className="mb-8 font-mono text-[10.5px] uppercase tracking-[0.16em] text-gold">
        DevSaheb admin
      </p>
      {children}
    </main>
  );
}
