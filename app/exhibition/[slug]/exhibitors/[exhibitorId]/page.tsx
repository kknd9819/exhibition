import { and, eq } from 'drizzle-orm';
import Link from 'next/link';
import { PublicInquiryForm } from '@/components/public-inquiry-form';
import { PublicSiteShell } from '@/components/portal/public-site-shell';
import { getDb } from '@/db';
import { enterprises, eventExhibitors, events, exhibitorProfileVersions, products, productVersions } from '@/db/schema';
import { isSampleRecord } from '@/lib/sample-data';

type PublicProfile = { nameZh?: string; nameIntl?: string; country?: string; category?: string; description?: string; website?: string; address?: string };
type PublicProduct = { name?: string; category?: string; summary?: string; description?: string };
function parse<T>(source: string) { try { return JSON.parse(source) as T; } catch { return {} as T; } }

export default async function PublicExhibitorDetailPage({ params }: { params: Promise<{ slug: string; exhibitorId: string }> }) {
  const { slug, exhibitorId } = await params;
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event) return <main className="portal-unavailable"><h1>展会不存在</h1></main>;
  const [row] = await db.select({ id: eventExhibitors.id, nameZh: enterprises.nameZh, nameIntl: enterprises.nameIntl, country: enterprises.country, industry: enterprises.industry, website: enterprises.website, address: enterprises.address, boothNo: eventExhibitors.boothNo, category: eventExhibitors.category, profileJson: exhibitorProfileVersions.profileJson }).from(eventExhibitors).innerJoin(enterprises, eq(eventExhibitors.enterpriseId, enterprises.id)).innerJoin(exhibitorProfileVersions, eq(eventExhibitors.currentVersionId, exhibitorProfileVersions.id)).where(and(eq(eventExhibitors.id, exhibitorId), eq(eventExhibitors.eventId, event.id), eq(eventExhibitors.qualificationStatus, 'APPROVED'), eq(eventExhibitors.publishStatus, 'PUBLISHED'), eq(exhibitorProfileVersions.reviewStatus, 'PUBLISHED'))).limit(1);
  if (!row) return <PublicSiteShell event={event} currentPath="/exhibitors" eyebrow="EXHIBITOR DIRECTORY" fallbackTitle="企业资料不可访问" fallbackDescription="企业尚未发布、已经撤回或不属于当前展会。"><section className="empty-state portal-child-empty"><Link href={`/exhibition/${slug}/exhibitors`}>返回企业目录</Link></section></PublicSiteShell>;
  const profile = parse<PublicProfile>(row.profileJson);
  const productRows = await db.select({ id: products.id, name: products.name, category: products.category, contentJson: productVersions.contentJson }).from(products).innerJoin(productVersions, eq(products.currentVersionId, productVersions.id)).where(and(eq(products.eventExhibitorId, row.id), eq(products.publishStatus, 'PUBLISHED'), eq(productVersions.reviewStatus, 'PUBLISHED')));
  const productItems = productRows.map((item) => ({ ...item, ...parse<PublicProduct>(item.contentJson) }));
  const name = profile.nameZh || row.nameZh;
  return <PublicSiteShell event={event} currentPath="/exhibitors" eyebrow="EXHIBITOR PROFILE" fallbackTitle={name} fallbackDescription={profile.description || '企业公开资料来自本届展会已审核发布版本。'} titleOverride={name} descriptionOverride={profile.description || '企业公开资料来自本届展会已审核发布版本。'}>
    <section className="public-detail-card">{isSampleRecord(name, profile.nameIntl, profile.description) ? <span className="sample-data-badge detail-sample-badge">测试样例 · 仅用于本地验收</span> : null}<div className="enterprise-logo">{(profile.nameIntl || row.nameIntl || name).slice(0, 2).toUpperCase()}</div><dl><div><dt>国际名称</dt><dd>{profile.nameIntl || row.nameIntl || '—'}</dd></div><div><dt>国家/地区</dt><dd>{profile.country || row.country}</dd></div><div><dt>展区分类</dt><dd>{profile.category || row.category || row.industry || '未分类'}</dd></div><div><dt>展位</dt><dd>{row.boothNo || '待分配'}</dd></div><div><dt>官网</dt><dd>{profile.website || row.website || '未公开'}</dd></div><div><dt>地址</dt><dd>{profile.address || row.address || '未公开'}</dd></div></dl><Link href={`/exhibition/${slug}/exhibitors`}>← 返回企业与产品目录</Link></section>
    <section className="detail-related"><header><span>PRODUCTS</span><h2>已发布产品</h2></header><div className="directory-grid">{productItems.length ? productItems.map((item) => <article key={item.id}><span>{item.category}</span><h2><Link href={`/exhibition/${slug}/products/${item.id}`}>{item.name}</Link></h2><p>{item.summary || item.description || '产品资料已经独立审核发布。'}</p><Link href={`/exhibition/${slug}/products/${item.id}`}>查看详情 →</Link></article>) : <div className="empty-state">该企业暂无已发布产品</div>}</div></section>
    <PublicInquiryForm exhibitors={[{ id: row.id, name }]}/>
  </PublicSiteShell>;
}
