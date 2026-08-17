import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';

/**
 * Content editor.
 *
 * Puck and its stylesheet are behind React.lazy so they land in their own
 * chunk. That is the single most important thing on this page: imported
 * eagerly, the editor would ride along in every marketing page's bundle and
 * blow the performance budget the site publicly commits to.
 */
const AdminApp = lazy(() => import('../admin/AdminApp'));

/**
 * `reachable` is tracked separately from `configured` on purpose.
 *
 * An earlier version collapsed both into one flag, so a failed fetch rendered
 * "Admin is not configured" and sent you to edit .env - when the real problem
 * was that no API was answering at all. Two different faults deserve two
 * different messages.
 */
type Session = { reachable: boolean; configured: boolean; signedIn: boolean };

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/admin/session')
      .then(async (r) => {
        // Vite and Apache both answer an unmatched path with HTML, so a 200
        // is not proof the API replied. The content type is.
        if (!r.headers.get('content-type')?.includes('application/json')) {
          throw new Error('not-json');
        }
        return r.json();
      })
      .then((j) => {
        if (active) {
          setSession({ reachable: true, configured: !!j.configured, signedIn: !!j.signedIn });
        }
      })
      .catch(() => {
        if (active) setSession({ reachable: false, configured: false, signedIn: false });
      });
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
      setSession({ reachable: true, configured: true, signedIn: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!session) return <Shell>Checking session…</Shell>;

  if (!session.reachable) {
    return (
      <Shell>
        <h1 className="text-2xl font-extrabold">The API is not responding</h1>
        <p className="mt-4 max-w-[56ch] text-silver">
          <code className="text-gold">/api/admin/session</code> did not return JSON,
          so nothing is serving the admin routes. This is a routing problem, not
          a credentials one.
        </p>
        <ul className="mt-5 grid max-w-[56ch] gap-2.5 text-sm text-silver">
          <li>
            <b className="text-bone">In development:</b> restart{' '}
            <code className="text-gold">npm run dev</code> — the API is mounted by
            a Vite plugin, so a config change needs a restart.
          </li>
          <li>
            <b className="text-bone">In production:</b> check that cPanel&rsquo;s
            Passenger block is present in{' '}
            <code className="text-gold">dist/client/.htaccess</code> and that the
            Node app is started. A redeploy replaces{' '}
            <code className="text-gold">dist/</code> and removes it.
          </li>
        </ul>
      </Shell>
    );
  }

  if (!session.configured) {
    return (
      <Shell>
        <h1 className="text-2xl font-extrabold">Admin is not configured</h1>
        <p className="mt-4 max-w-[52ch] text-silver">
          The API is running, but no credentials are set. Generate them and put
          them in <code className="text-gold">.env</code>, then restart:
        </p>
        <pre className="mt-4 overflow-x-auto border border-gold/20 bg-ink-2 p-4 font-mono text-[12.5px] text-silver">
          node scripts/hash-password.mjs &quot;a long password&quot;
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
      <AdminApp onSignOut={() => setSession({ reachable: true, configured: true, signedIn: false })} />
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
