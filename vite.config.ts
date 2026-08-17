import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Mounts the real API inside the dev server.
 *
 * Without this, `npm run dev` answers /api/admin/session with index.html, the
 * JSON parse fails, and /admin reports "Admin is not configured" - which sends
 * you to fix .env when the actual problem is that dev has no API at all.
 *
 * Only /api and /media are mounted; Vite keeps every other route. Saving a
 * page still needs `npm run build` to have run once, because the validation
 * schema is read from the built SSR bundle.
 */
function devApi(): PluginOption {
  return {
    name: 'devsaheb-dev-api',
    apply: 'serve',
    async configureServer(server) {
      // server/ is plain JS with no declarations; it is Node-side code that
      // never enters the client build, so a typed shim would be noise.
      // @ts-expect-error -- untyped local module
      const { createApi } = await import('./server/api.js');
      // No media symlink in dev: dist/ may not exist, and Vite serves from the
      // project root rather than the build output.
      const { api, auth } = await createApi({ linkMedia: false });
      server.middlewares.use(api);

      if (!auth.configured) {
        server.config.logger.warn(
          '\n  [admin] ADMIN_PASSWORD_HASH / SESSION_SECRET are unset, so /admin ' +
            'will show the setup notice.\n  Generate them with: node scripts/hash-password.mjs "a long password"\n',
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
  build: {
    // The prerender step reads this manifest to resolve hashed asset URLs.
    manifest: true,
    outDir: 'dist/client',
    emptyOutDir: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
  },
});
