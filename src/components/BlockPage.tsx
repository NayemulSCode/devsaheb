import type { ReactNode } from 'react';
import Blocks from './blocks';
import { useRouteData } from '../lib/page-data';
import type { PageContent } from '../content/schema';

/**
 * A page edited through /admin, with its coded original kept as a fallback.
 *
 * The fallback is not dead weight. If the JSON is missing, fails to parse, or
 * the fetch on a client-side navigation fails, the page renders what it always
 * did rather than going blank - the same bargain Home made before this existed.
 *
 * A route only appears in the admin's picker when it has a `contentPath`, so
 * adding one here and a matching file under content/ is the whole conversion.
 */
export default function BlockPage({ fallback }: { fallback: ReactNode }) {
  const data = useRouteData<PageContent>();
  return <main>{data?.content?.length ? <Blocks data={data} /> : fallback}</main>;
}
