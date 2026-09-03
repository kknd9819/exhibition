import { and, eq } from 'drizzle-orm';
import Link from 'next/link';
import { PublicInquiryForm } from '@/components/public-inquiry-form';
import { PublicSiteShell } from '@/components/portal/public-site-shell';
import { getDb } from '@/db';
import { enterprises, eventExhibitors, events, exhibitorProfileVersions, products, productVersions } from '@/db/schema';
import { isSampleRecord } from '@/lib/sample-data';

type PublicProfile = { nameZh?: string; nameIntl?: string; country?: string; category?: string; description?: string };
type PublicProduct = { name?: string; category?: string; summary?: string; description?: string };
function parse<T>(source: string) { try { return JSON.parse(source) as T; } catch { return {} as T; } }

export default async function PublicExhibitorsPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ view?: string; q?: string; category?: string }> }) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event) return <main className="portal-unavailable"><h1>展会不存在</h1></main>;
  const rows = await db.select({ id: eventExhibitors.id, enterpriseNameZh: enterprises.nameZh, enterpriseNameIntl: enterprises.nameIntl, enterpriseCountry: enterprises.country, boothNo: eventExhibitors.boothNo, category: eventExhibitors.category, profileJson: exhibitorProfileVersions.profileJson })
    .from(eventExhibitors).innerJoin(enterprises, eq(eventExhibitors.enterpriseId, enterprises.id)).innerJoin(exhibitorProfileVersions, eq(eventExhibitors.currentVersionId, exhibitorProfileVersions.id))
    .where(and(eq(eventExhibitors.eventId, event.id), eq(eventExhibitors.qualificationStatus, 'APPROVED'), eq(eventExhibitors.publishStatus, 'PUBLISHED'), eq(exhibitorProfileVersions.reviewStatus, 'PUBLISHED')));
  const productRows = await db.select({ id: products.id, eventExhibitorId: products.eventExhibitorId, name: products.name, category: products.category, contentJson: productVersions.contentJson })
    .from(products).innerJoin(productVersions, eq(products.currentVersionId, productVersions.id))
    .where(and(eq(products.eventId, event.id), eq(products.publishStatus, 'PUBLISHED'), eq(productVersions.reviewStatus, 'PUBLISHED')));
  const companies = rows.map((row) => { const profile = parse<PublicProfile>(row.profileJson); const nameZh = profile.nameZh || row.enterpriseNameZh; const nameIntl = profile.nameIntl || row.enterpriseNameIntl; const description = profile.description || ''; return { id: row.id, nameZh, nameIntl, country: profile.country || row.enterpriseCountry, category: profile.category || row.category || '未分类', description, boothNo: row.boothNo, isSample: isSampleRecord(nameZh, nameIntl, description) }; });
  const companyById = new Map(companies.map((item) => [item.id, item]));
  const productItems = productRows.map((row) => { const content = parse<PublicProduct>(row.contentJson); const name = content.name || row.name; const summary = content.summary || content.description || ''; const enterprise = companyById.get(row.eventExhibitorId); return { id: row.id, eventExhibitorId: row.eventExhibitorId, name, category: content.category || row.category || '未分类', summary, enterprise, isSample: isSampleRecord(name, summary) || Boolean(enterprise?.isSample) }; });
  const view = query.view === 'products' ? 'products' : 'enterprises';
  const keyword = (query.q ?? '').trim().toLocaleLowerCase('zh-CN');
  const selectedCategory = query.category ?? '';
  const categories = [...new Set((view === 'products' ? productItems : companies).map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  const visibleCompanies = companies.filter((item) => (!selectedCategory || item.category === selectedCategory) && (!keyword || `${item.nameZh} ${item.nameIntl} ${item.country} ${item.category} ${item.boothNo ?? ''}`.toLocaleLowerCase('zh-CN').includes(keyword)));
  const visibleProducts = productItems.filter((item) => (!selectedCategory || item.category === selectedCategory) && (!keyword || `${item.name} ${item.category} ${item.summary} ${item.enterprise?.nameZh ?? ''}`.toLocaleLowerCase('zh-CN').includes(keyword)));

  return <PublicSiteShell event={event} currentPath="/exhibitors" eyebrow="OFFLINE EXHIBITION DIRECTORY" fallbackTitle="参展企业与产品" fallbackDescription="只展示已经通过资格审核和资料审核的企业与产品。">
    <section className="directory-browser">
      <nav className="directory-tabs" aria-label="展览展示类型"><Link className={view === 'enterprises' ? 'active' : ''} href={`/exhibition/${slug}/exhibitors?view=enterprises`}>企业 <b>{companies.length}</b></Link><Link className={view === 'products' ? 'active' : ''} href={`/exhibition/${slug}/exhibitors?view=products`}>产品 <b>{productItems.length}</b></Link></nav>
      <form className="directory-toolbar" method="get"><input type="hidden" name="view" value={view}/><label>关键词<input name="q" defaultValue={query.q ?? ''} placeholder={view === 'products' ? '产品名称、企业或分类' : '企业名称、国家、展位或分类'}/></label><label>展区分类<select name="category" defaultValue={selectedCategory}><option value="">全部分类</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label><button type="submit">查询</button><Link href={`/exhibition/${slug}/exhibitors?view=${view}`}>清除条件</Link></form>
      {[...companies, ...productItems].some((item) => item.isSample) ? <div className="sample-data-notice"><strong>测试数据提示</strong><span>带“测试样例”标识的企业与产品仅用于本地 Alpha 功能验收，不代表真实参展名单。</span></div> : null}
      <div className="directory-result-summary">当前显示 <strong>{view === 'products' ? visibleProducts.length : visibleCompanies.length}</strong> 条已发布记录</div>
      {view === 'enterprises' ? <section className="directory-grid exhibitor-directory-grid">{visibleCompanies.length ? visibleCompanies.map((item) => <article key={item.id}>{item.isSample ? <span className="sample-data-badge">测试样例</span> : null}<div className="enterprise-logo">{(item.nameIntl || item.nameZh).slice(0, 2).toUpperCase()}</div><span>{item.country} · {item.category}</span><h2><Link href={`/exhibition/${slug}/exhibitors/${item.id}`}>{item.nameZh}</Link></h2><p>{item.nameIntl}</p><p>{item.description || '企业已通过审核，详细资料由参展企业按本届展会独立维护。'}</p><strong>展位 {item.boothNo ?? '待分配'}</strong><Link href={`/exhibition/${slug}/exhibitors/${item.id}`}>查看企业与产品 →</Link></article>) : <div className="empty-state">没有符合条件的已发布企业</div>}</section> : <section className="directory-grid product-directory-grid">{visibleProducts.length ? visibleProducts.map((item) => <article key={item.id}>{item.isSample ? <span className="sample-data-badge">测试样例</span> : null}<span>{item.category}</span><h2><Link href={`/exhibition/${slug}/products/${item.id}`}>{item.name}</Link></h2><p>{item.summary || '产品详情由参展企业维护并经过独立审核。'}</p><strong>{item.enterprise?.nameZh ?? '参展企业'}</strong><Link href={`/exhibition/${slug}/products/${item.id}`}>查看产品详情 →</Link></article>) : <div className="empty-state">没有符合条件的已发布产品</div>}</section>}
    </section>
    {view === 'enterprises' && companies.length ? <PublicInquiryForm exhibitors={companies.map((item) => ({ id: item.id, name: item.nameZh }))}/> : null}
  </PublicSiteShell>;
}
