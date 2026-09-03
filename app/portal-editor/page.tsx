import { and, desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { AdminShell } from '@/components/admin-shell';
import { PortalBuilder } from '@/components/portal-builder';
import { PortalLocalizationPanel } from '@/components/portal-localization-panel';
import { getDb } from '@/db';
import { portalLanguagePublications, portalPages, portalPageVersions, portalTranslationJobs, registrationActivities } from '@/db/schema';
import { getCurrentEventContext } from '@/lib/current-event';
import { DEFAULT_PORTAL_DOCUMENT, parsePortalDocument } from '@/lib/portal-types';
import { sha256 } from '@/lib/portal-localization';

export default async function PortalEditorPage() {
  const { current } = await getCurrentEventContext();
  if (!current) return <AdminShell active="/portal-editor" title="会场门户搭建"><section className="panel">请先创建展会。</section></AdminShell>;
  const [pages, portalActivities] = await Promise.all([
    getDb().select().from(portalPages).where(eq(portalPages.eventId, current.id)),
    getDb().select().from(registrationActivities).where(and(eq(registrationActivities.eventId, current.id), eq(registrationActivities.showInPortal, true))),
  ]);
  const page = pages.find((item) => item.slug === 'home') ?? pages[0];
  if (!page) return <AdminShell active="/portal-editor" title="会场门户搭建"><section className="panel planned-panel"><span>NO PORTAL PAGE</span><h2>当前展会尚无门户页面</h2><p>可在展会复制时带入门户，或在后续“页面与导航”切片中新建首页。</p></section></AdminShell>;
  const db = getDb();
  const versions = await db.select().from(portalPageVersions).where(and(eq(portalPageVersions.pageId, page.id), eq(portalPageVersions.language, 'zh-CN'))).orderBy(desc(portalPageVersions.versionNo));
  const pending = versions.find((item) => item.reviewStatus === 'PENDING');
  const editable = versions.find((item) => item.reviewStatus === 'DRAFT' || item.reviewStatus === 'RETURNED');
  const published = versions.find((item) => item.reviewStatus === 'PUBLISHED');
  const initial = pending ?? editable ?? published;
  const document = initial ? parsePortalDocument(initial.layoutJson) : structuredClone(DEFAULT_PORTAL_DOCUMENT);
  const [translationJobs, publications, allVersions] = await Promise.all([
    db.select().from(portalTranslationJobs).where(eq(portalTranslationJobs.pageId, page.id)).orderBy(desc(portalTranslationJobs.createdAt)),
    db.select().from(portalLanguagePublications).where(eq(portalLanguagePublications.pageId, page.id)),
    db.select().from(portalPageVersions).where(eq(portalPageVersions.pageId, page.id)),
  ]);
  const publishedSourceDocument = published ? parsePortalDocument(published.layoutJson) : document;
  const publishedSourceSha256 = await sha256(JSON.stringify(publishedSourceDocument));
  const languages = JSON.parse(current.languagesJson) as string[];

  return <AdminShell active="/portal-editor" title="会场门户搭建" actions={<><Link className="ghost-button button-link" href="/reviews">审核中心</Link><Link className="primary-button button-link" href={`/exhibition/${current.slug}`}>打开已发布门户</Link></>}>
    <nav className="subnav" aria-label="门户编辑器分区"><a className="active" href="#portal-page-builder">页面装修与导航</a><a href="#portal-versions">版本与发布</a>{published ? <a href="#portal-localization">多语言</a> : null}<a href={`/exhibition/${current.slug}`}>公开页面</a></nav>
    <PortalBuilder
      initialDocument={document}
      pageId={page.id}
      eventName={current.shortName}
      eventSlug={current.slug}
      initialVersionId={initial && initial.reviewStatus !== 'PUBLISHED' ? initial.id : null}
      initialVersionNo={initial?.versionNo ?? 0}
      publishedVersionNo={published?.versionNo ?? 0}
      initialStatus={initial?.reviewStatus ?? 'NEW'}
      initialVersions={versions.map((item) => ({
        id: item.id,
        versionNo: item.versionNo,
        status: item.reviewStatus,
        submittedBy: item.submittedBy,
        approvedBy: item.approvedBy,
        updatedAt: item.updatedAt,
      }))}
      registrationActivities={portalActivities.map((item) => ({ id: item.id, name: item.name }))}
    />
    {published ? <div id="portal-localization"><PortalLocalizationPanel pageId={page.id} eventName={current.shortName} eventSlug={current.slug} sourceDocument={publishedSourceDocument} sourceSha256={publishedSourceSha256} sourceVersionNo={published.versionNo} languages={languages} initialItems={translationJobs.map((job) => { const version = allVersions.find((item) => item.id === job.resultVersionId); return { id: job.id, targetLanguage: job.targetLanguage, status: job.status, sourceVersionId: job.sourceVersionId, sourceSha256: job.sourceSha256, resultVersionId: job.resultVersionId, versionNo: version?.versionNo ?? 0, provider: job.provider, model: job.model, promptVersion: job.promptVersion, requestedBy: job.requestedBy, requestedAt: job.requestedAt, confirmedBy: job.confirmedBy, document: version ? parsePortalDocument(version.layoutJson) : null }; })} publications={publications.map((item) => ({ language: item.language, status: item.status, currentVersionId: item.currentVersionId, sourceVersionId: item.sourceVersionId, publishedBy: item.publishedBy, publishedAt: item.publishedAt }))}/></div> : null}
  </AdminShell>;
}
