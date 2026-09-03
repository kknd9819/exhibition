import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { portalPages, portalPageVersions } from '@/db/schema';
import { getCurrentPublicActor } from '@/lib/public-auth';
import { DEFAULT_PORTAL_SITE_PAGES, parsePortalDocument } from '@/lib/portal-types';

type PublicEvent = { id: string; name: string; shortName: string; slug: string };

export async function PublicSiteShell({
  event,
  currentPath,
  eyebrow,
  fallbackTitle,
  fallbackDescription,
  titleOverride,
  descriptionOverride,
  children,
}: {
  event: PublicEvent;
  currentPath: string;
  eyebrow: string;
  fallbackTitle: string;
  fallbackDescription: string;
  titleOverride?: string;
  descriptionOverride?: string;
  children: ReactNode;
}) {
  const db = getDb();
  const [page] = await db.select().from(portalPages).where(and(eq(portalPages.eventId, event.id), eq(portalPages.slug, 'home'))).limit(1);
  const [version, publicActor] = await Promise.all([
    page?.currentVersionId ? db.select().from(portalPageVersions).where(and(eq(portalPageVersions.id, page.currentVersionId), eq(portalPageVersions.reviewStatus, 'PUBLISHED'))).limit(1).then((rows) => rows[0]) : Promise.resolve(undefined),
    getCurrentPublicActor(),
  ]);
  const document = version ? parsePortalDocument(version.layoutJson) : null;
  const pages = document?.sitePages ?? DEFAULT_PORTAL_SITE_PAGES;
  const current = pages.find((item) => item.path === currentPath);
  const style = {
    '--portal-green': document?.theme.primary ?? '#073d34',
    '--coral': document?.theme.accent ?? '#d86e52',
    '--portal-surface': document?.theme.surface ?? '#f7f4ed',
  } as CSSProperties;

  return <main className="public-portal public-subpage" style={style}>
    <header className="portal-header">
      <Link className="portal-logo" href={`/exhibition/${event.slug}`}><span>CA</span><div><strong>{event.shortName}</strong><small>CHINA–AFRICA ECONOMIC AND TRADE EXPO</small></div></Link>
      <nav><Link href={`/exhibition/${event.slug}`}>首页</Link>{pages.filter((item) => item.visible).map((item) => <Link className={item.path === currentPath ? 'active' : ''} href={`/exhibition/${event.slug}${item.path}`} key={item.id}>{item.label}</Link>)}</nav>
      <div className="portal-account-links"><Link href="/company-workspace/login">企业工作台</Link><Link href={publicActor ? `/exhibition/${event.slug}/me` : `/exhibition/${event.slug}/login?returnTo=/exhibition/${event.slug}${currentPath}`}>{publicActor?.displayName ?? '观众登录'}</Link></div>
    </header>
    <section className="directory-hero"><span>{eyebrow}</span><h1>{titleOverride || current?.label || fallbackTitle}</h1><p>{descriptionOverride || current?.description || fallbackDescription}</p></section>
    {children}
    <footer className="portal-footer"><div className="portal-logo"><span>CA</span><div><strong>{event.shortName}</strong><small>ALPHA · 本地测试环境</small></div></div><p>栏目内容来自后台已审核发布版本；当前环境可能包含带明确标识的测试样例记录。</p><Link href={`/exhibition/${event.slug}`}>返回展会首页</Link></footer>
  </main>;
}
