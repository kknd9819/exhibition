import { and, eq } from 'drizzle-orm';
import Link from 'next/link';
import { PublicInquiryForm } from '@/components/public-inquiry-form';
import { PublicSiteShell } from '@/components/portal/public-site-shell';
import { getDb } from '@/db';
import { enterprises, eventExhibitors, events, products, productVersions } from '@/db/schema';
import { isSampleRecord } from '@/lib/sample-data';

type PublicProduct = { name?: string; category?: string; summary?: string; description?: string; specifications?: string; application?: string };
function parse<T>(source: string) { try { return JSON.parse(source) as T; } catch { return {} as T; } }

export default async function PublicProductDetailPage({ params }: { params: Promise<{ slug: string; productId: string }> }) {
  const { slug, productId } = await params;
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event) return <main className="portal-unavailable"><h1>展会不存在</h1></main>;
  const [row] = await db.select({ id: products.id, name: products.name, category: products.category, eventExhibitorId: products.eventExhibitorId, contentJson: productVersions.contentJson, enterpriseName: enterprises.nameZh, boothNo: eventExhibitors.boothNo }).from(products).innerJoin(productVersions, eq(products.currentVersionId, productVersions.id)).innerJoin(eventExhibitors, eq(products.eventExhibitorId, eventExhibitors.id)).innerJoin(enterprises, eq(eventExhibitors.enterpriseId, enterprises.id)).where(and(eq(products.id, productId), eq(products.eventId, event.id), eq(products.publishStatus, 'PUBLISHED'), eq(productVersions.reviewStatus, 'PUBLISHED'), eq(eventExhibitors.qualificationStatus, 'APPROVED'), eq(eventExhibitors.publishStatus, 'PUBLISHED'))).limit(1);
  if (!row) return <PublicSiteShell event={event} currentPath="/exhibitors" eyebrow="PRODUCT DIRECTORY" fallbackTitle="产品资料不可访问" fallbackDescription="产品尚未发布、已经撤回或不属于当前展会。"><section className="empty-state portal-child-empty"><Link href={`/exhibition/${slug}/exhibitors?view=products`}>返回产品目录</Link></section></PublicSiteShell>;
  const content = parse<PublicProduct>(row.contentJson);
  const name = content.name || row.name;
  return <PublicSiteShell event={event} currentPath="/exhibitors" eyebrow="PRODUCT PROFILE" fallbackTitle={name} fallbackDescription={content.summary || '产品资料来自本届展会已审核发布版本。'} titleOverride={name} descriptionOverride={content.summary || '产品资料来自本届展会已审核发布版本。'}>
    <section className="public-detail-card product-detail-card">{isSampleRecord(name, content.summary, content.description, row.enterpriseName) ? <span className="sample-data-badge detail-sample-badge">测试样例 · 仅用于本地验收</span> : null}<dl><div><dt>产品分类</dt><dd>{content.category || row.category || '未分类'}</dd></div><div><dt>参展企业</dt><dd><Link href={`/exhibition/${slug}/exhibitors/${row.eventExhibitorId}`}>{row.enterpriseName}</Link></dd></div><div><dt>展位</dt><dd>{row.boothNo || '待分配'}</dd></div><div className="wide"><dt>产品说明</dt><dd>{content.description || content.summary || '企业尚未公开更多说明。'}</dd></div>{content.specifications ? <div className="wide"><dt>规格参数</dt><dd>{content.specifications}</dd></div> : null}{content.application ? <div className="wide"><dt>应用场景</dt><dd>{content.application}</dd></div> : null}</dl><Link href={`/exhibition/${slug}/exhibitors?view=products`}>← 返回产品目录</Link></section>
    <PublicInquiryForm exhibitors={[{ id: row.eventExhibitorId, name: row.enterpriseName }]}/>
  </PublicSiteShell>;
}
