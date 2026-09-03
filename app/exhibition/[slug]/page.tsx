import { and, desc, eq } from 'drizzle-orm';
import { PortalRenderer } from '@/components/portal/portal-renderer';
import { AttributionTracker } from '@/components/attribution-tracker';
import { getDb } from '@/db';
import { agendaVersions, agendas, documentItems, enterprises, eventExhibitors, events, exhibitorProfileVersions, portalLanguagePublications, portalPages, portalPageVersions } from '@/db/schema';
import { parsePortalDocument } from '@/lib/portal-types';
import { getCurrentPublicActor } from '@/lib/public-auth';

export default async function ExhibitionPortalPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ channel?: string; lang?: string }> }) {
  const { slug } = await params;
  const { channel, lang } = await searchParams;
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event) return <main className="portal-unavailable"><h1>展会页面不存在</h1><p>请检查展会路径或联系工作人员。</p></main>;

  const [page] = await db.select().from(portalPages).where(and(eq(portalPages.eventId, event.id), eq(portalPages.slug, 'home'))).limit(1);
  if (!page?.currentVersionId) return <main className="portal-unavailable"><h1>门户尚未发布</h1><p>当前只有草稿或待审核版本。</p></main>;
  const availableLanguages = JSON.parse(event.languagesJson) as string[];
  const requestedLanguage = lang && availableLanguages.includes(lang) ? lang : 'zh-CN';
  const [publication] = requestedLanguage === 'zh-CN' ? [] : await db.select().from(portalLanguagePublications).where(and(eq(portalLanguagePublications.pageId, page.id), eq(portalLanguagePublications.language, requestedLanguage))).limit(1);
  const versionId = publication?.currentVersionId ?? page.currentVersionId;
  const [version] = await db.select().from(portalPageVersions).where(eq(portalPageVersions.id, versionId)).limit(1);
  if (!version || version.reviewStatus !== 'PUBLISHED') return <main className="portal-unavailable"><h1>门户暂不可访问</h1><p>已发布版本不存在或已经撤回。</p></main>;

  const exhibitorRows = await db.select({ nameZh: enterprises.nameZh, nameIntl: enterprises.nameIntl, country: enterprises.country, boothNo: eventExhibitors.boothNo, profileJson: exhibitorProfileVersions.profileJson }).from(eventExhibitors).innerJoin(enterprises, eq(eventExhibitors.enterpriseId, enterprises.id)).innerJoin(exhibitorProfileVersions, eq(eventExhibitors.currentVersionId, exhibitorProfileVersions.id)).where(and(eq(eventExhibitors.eventId, event.id), eq(eventExhibitors.qualificationStatus, 'APPROVED'), eq(eventExhibitors.publishStatus, 'PUBLISHED'), eq(exhibitorProfileVersions.reviewStatus, 'PUBLISHED')));
  const [publicDocument] = await db.select().from(documentItems).where(and(eq(documentItems.eventId, event.id), eq(documentItems.status, 'PUBLISHED'), eq(documentItems.accessMode, 'PUBLIC'))).orderBy(desc(documentItems.publishedAt)).limit(1);
  const [publishedAgenda] = await db.select().from(agendas).where(and(eq(agendas.eventId, event.id), eq(agendas.status, 'PUBLISHED'))).limit(1);
  const [agendaVersion] = publishedAgenda?.currentVersionId ? await db.select().from(agendaVersions).where(eq(agendaVersions.id, publishedAgenda.currentVersionId)).limit(1) : [];
  const agendaSnapshot = agendaVersion ? JSON.parse(agendaVersion.snapshotJson) as { sessions: Array<{ id: string; title: string; startAt: string; endAt: string; locationText: string }> } : null;
  const document = parsePortalDocument(version.layoutJson);
  const registrationPage = document.sitePages?.find((item) => item.visible && item.path.startsWith('/register/'));
  const registrationHref = registrationPage ? `/exhibition/${slug}${registrationPage.path}` : null;
  document.blocks = document.blocks.map((block) => {
    if ((block.type === 'hero' || block.type === 'contact') && registrationHref) return { ...block, props: { ...block.props, primaryHref: registrationHref } };
    if (block.type === 'enterpriseList') return { ...block, props: { ...block.props, items: exhibitorRows.map((item) => { const profile = JSON.parse(item.profileJson) as { nameZh?: string; nameIntl?: string; country?: string }; return { name: version.language === 'zh-CN' ? (profile.nameZh || profile.nameIntl || item.nameZh || item.nameIntl) : (profile.nameIntl || profile.nameZh || item.nameIntl || item.nameZh), country: profile.country || item.country, booth: item.boothNo ?? '', href: `/exhibition/${slug}/exhibitors` }; }) } };
    if (block.type === 'agenda' && agendaSnapshot && version.language === 'zh-CN') return { ...block, props: { ...block.props, title: publishedAgenda?.name ?? '活动日程', description: '后台议程编辑器审核发布的当前版本。', items: agendaSnapshot.sessions.slice(0,6).map(item=>({day:item.startAt.slice(0,10),time:`${item.startAt.slice(11,16)}—${item.endAt.slice(11,16)}`,title:`${item.title}${item.locationText?` · ${item.locationText}`:''}`})) } };
    if (block.type === 'download' && publicDocument) return { ...block, props: version.language === 'zh-CN' ? { ...block.props, title: publicDocument.title, description: '下载工作人员审核发布的展会资料。', href: `/api/content/documents/${publicDocument.id}/download` } : { ...block.props, href: `/api/content/documents/${publicDocument.id}/download` } };
    return block;
  });
  const publicActor=await getCurrentPublicActor();
  return <><AttributionTracker eventSlug={slug} channelCode={channel} landingPage={`/exhibition/${slug}`}/><PortalRenderer document={document} eventName={event.name} eventSlug={slug} publicAccountName={publicActor?.displayName} currentLanguage={version.language} availableLanguages={availableLanguages}/></>;
}
