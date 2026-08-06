import { Route, Routes } from 'react-router-dom';
import { routes, notFoundRoute } from './routes';
import HeadSync from './components/HeadSync';
import type { SiteConfig } from './lib/seo';
import site from '../content/site.json';

const NotFound = notFoundRoute.Component;

export default function App() {
  return (
    <>
      <HeadSync site={site as SiteConfig} />
      <Routes>
        {routes.map(({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
