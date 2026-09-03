import Link from 'next/link';
import { and, desc, eq } from 'drizzle-orm';
import { PublicSiteShell } from '@/components/portal/public-site-shell';
import { getDb } from '@/db';
import { contentItems, contentVersions, events } from '@/db/schema';

export default async function PublicNewsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event) return <main className="portal-unavailable"><h1>展会不存在</h1></main>;
  const rows = await db.select({ itemSlug: contentItems.slug, title: contentVersions.title, summary: contentVersions.summary, publishedAt: contentVersions.publishedAt }).from(contentItems).innerJoin(contentVersions, eq(contentItems.currentVersionId, contentVersions.id)).where(and(eq(contentItems.eventId, event.id), eq(contentItems.status, 'PUBLISHED'), eq(contentVersions.reviewStatus, 'PUBLISHED'))).orderBy(desc(contentVersions.publishedAt));
  return <PublicSiteShell event={event} currentPath="/news" eyebrow="NEWSROOM" fallbackTitle="新闻资讯" fallbackDescription="仅展示审核通过的当前版本，新版本审核期间持续展示上一版本。"><section className="directory-grid">{rows.length ? rows.map(item => <article key={item.itemSlug}><span>{item.publishedAt?.slice(0, 10) ?? '已发布'}</span><h2><Link href={`/exhibition/${slug}/news/${item.itemSlug}`}>{item.title}</Link></h2><p>{item.summary}</p><Link href={`/exhibition/${slug}/news/${item.itemSlug}`}>阅读全文 →</Link></article>) : <div className="empty-state">暂无已发布新闻</div>}</section></PublicSiteShell>;
}
