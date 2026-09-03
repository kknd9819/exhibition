import Link from 'next/link';
import { and, eq } from 'drizzle-orm';
import { PublicSiteShell } from '@/components/portal/public-site-shell';
import { getDb } from '@/db';
import { contentItems, contentVersions, events } from '@/db/schema';

export default async function PublicNewsDetailPage({ params }: { params: Promise<{ slug: string; contentSlug: string }> }) {
  const { slug, contentSlug } = await params;
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event) return <main className="portal-unavailable"><h1>展会不存在</h1></main>;
  const [item] = await db.select().from(contentItems).where(and(eq(contentItems.eventId, event.id), eq(contentItems.slug, contentSlug), eq(contentItems.status, 'PUBLISHED'))).limit(1);
  if (!item?.currentVersionId) return <PublicSiteShell event={event} currentPath="/news" eyebrow="NEWSROOM" fallbackTitle="内容尚未发布" fallbackDescription="该内容没有可公开访问的审核版本。"><section className="empty-state portal-child-empty"><Link href={`/exhibition/${slug}/news`}>返回新闻列表</Link></section></PublicSiteShell>;
  const [version] = await db.select().from(contentVersions).where(and(eq(contentVersions.id, item.currentVersionId), eq(contentVersions.reviewStatus, 'PUBLISHED'))).limit(1);
  if (!version) return <PublicSiteShell event={event} currentPath="/news" eyebrow="NEWSROOM" fallbackTitle="内容暂不可访问" fallbackDescription="已发布版本不存在或已经撤回。"><section className="empty-state portal-child-empty"><Link href={`/exhibition/${slug}/news`}>返回新闻列表</Link></section></PublicSiteShell>;
  return <PublicSiteShell event={event} currentPath="/news" eyebrow={`NEWS · V${version.versionNo}`} fallbackTitle={version.title} fallbackDescription={version.summary} titleOverride={version.title} descriptionOverride={version.summary}><article className="public-news-article"><Link href={`/exhibition/${slug}/news`}>← 返回新闻列表</Link><p className="article-summary">{version.summary}</p><div className="article-body">{version.body.split('\n').map((paragraph, index) => paragraph ? <p key={index}>{paragraph}</p> : <br key={index}/>)}</div><small>发布时间：{version.publishedAt ?? '已发布'}</small></article></PublicSiteShell>;
}
