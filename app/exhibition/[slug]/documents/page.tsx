import Link from 'next/link';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { PublicSiteShell } from '@/components/portal/public-site-shell';
import { documentItems, events, registrationRecords } from '@/db/schema';
import { getCurrentPublicActor } from '@/lib/public-auth';

const accessLabels: Record<string, string> = { PUBLIC: '公开下载', LOGIN: '登录后下载', REGISTERED: '完成指定报名后下载' };

export default async function PublicDocumentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event) return <main className="portal-unavailable"><h1>展会不存在</h1></main>;
  const rows = await db.select().from(documentItems).where(and(eq(documentItems.eventId, event.id), eq(documentItems.status, 'PUBLISHED'))).orderBy(desc(documentItems.publishedAt));
  const actor=await getCurrentPublicActor();const registrations=actor?await db.select().from(registrationRecords).where(and(eq(registrationRecords.accountId,actor.accountId),inArray(registrationRecords.status,['PENDING','APPROVED','CHECKED_IN']))):[];
  return <PublicSiteShell event={event} currentPath="/documents" eyebrow="DOCUMENT CENTER" fallbackTitle="资料下载" fallbackDescription="文件发布与访问权限均由后台审核配置，下载行为留存审计记录。"><section className="directory-grid">{rows.length ? rows.map(item => {const registered=item.registrationActivityId&&registrations.some(record=>record.activityId===item.registrationActivityId);const allowed=item.accessMode==='PUBLIC'||item.accessMode==='LOGIN'&&Boolean(actor)||item.accessMode==='REGISTERED'&&Boolean(registered);const href=allowed?`/api/content/documents/${item.id}/download`:actor&&item.registrationActivityId?`/exhibition/${slug}/register/${item.registrationActivityId}`:`/exhibition/${slug}/login?returnTo=/exhibition/${slug}/documents`;return <article key={item.id}><span>{accessLabels[item.accessMode] ?? item.accessMode}</span><h2>{item.title}</h2><p>发布于 {item.publishedAt?.slice(0, 10) ?? '—'}</p><Link href={href}>{allowed?'下载 PDF →':actor?'报名后解锁 →':'登录后继续 →'}</Link></article>}) : <div className="empty-state">暂无已发布资料</div>}</section></PublicSiteShell>;
}
