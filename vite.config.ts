import { defineConfig, type PluginOption } from 'vite';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
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
  let devServer: import('vite').ViteDevServer | undefined;

  return {
    name: 'devsaheb-dev-api',
    apply: 'serve',

    /**
     * Injects the page's content into the dev shell.
     *
     * In production the prerender embeds this script and the client reads it
     * back on hydration. The dev server serves a bare index.html, so without
     * this every content-driven route finds nothing and renders its fallback -
     * taxonomy pages showed "This page is being written" no matter what had
     * been published. The home page hid the problem behind its coded fallback.
     *
     * The route table is loaded through Vite so there is still one source of
     * truth for which content file backs which URL, and an edit shows up on
     * the next reload with no build.
     */
    transformIndexHtml: {
      order: 'pre',
      async handler(html, ctx) {
        if (!devServer) return html;

        const url = (ctx.originalUrl ?? '/').split('?')[0] ?? '/';
        const path = url.replace(/\/+$/, '') || '/';

        try {
          const mod = await devServer.ssrLoadModule('/src/routes.tsx');
          const route = mod.routes.find(
            (r: { path: string; contentPath?: string }) => r.path === path,
          );
          if (!route?.contentPath) return html;

          const file = resolve(__dirname, 'content', `${route.contentPath}.json`);
          if (!existsSync(file)) return html;

          // Same escaping as the prerender: an unescaped </script> inside the
          // JSON would close the tag early.
          const json = readFileSync(file, 'utf8').replace(/</g, '\\u003c');
          return html.replace(
            '</body>',
            `  <script type="application/json" id="__DS_PAGE_DATA__">${json}</script>\n  </body>`,
          );
        } catch {
          // A broken route module must not take the dev server down; the page
          // just falls back as it did before.
          return html;
        }
      },
    },

    async configureServer(server) {
      devServer = server;
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
