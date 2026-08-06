import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-24">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
        Error 404
      </p>
      <h1 className="mt-5 font-display text-4xl font-extrabold tracking-[-0.035em] md:text-5xl">
        That page does not exist.
      </h1>
      <p className="mt-5 max-w-[55ch] text-silver">
        The address may be mistyped, or the page may have moved. Everything else
        is still where you left it.
      </p>
      <div className="mt-9">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 border border-gold bg-gold px-6 py-3.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-ink transition-colors duration-300 hover:bg-gold-lift"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
