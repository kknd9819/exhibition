import Link from 'next/link';
import { and, eq } from 'drizzle-orm';
import { PublicSiteShell } from '@/components/portal/public-site-shell';
import { getDb } from '@/db';
import { agendaVersions, agendas, events } from '@/db/schema';

type AgendaSnapshot = { name: string; timezone: string; sessions: Array<{ id: string; parentSessionId: string | null; title: string; sessionType: string; introduction: string; startAt: string; endAt: string; locationText: string; registrationActivityId: string | null; materialDocumentId: string | null; guests: Array<{ id: string; name: string; role: string; profile: Record<string, string> }> }> };

export default async function PublicAgendaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event) return <main className="portal-unavailable"><h1>展会不存在</h1></main>;
  const [agenda] = await db.select().from(agendas).where(and(eq(agendas.eventId, event.id), eq(agendas.status, 'PUBLISHED'))).limit(1);
  if (!agenda?.currentVersionId) return <PublicSiteShell event={event} currentPath="/agenda" eyebrow="PROGRAMME" fallbackTitle="活动议程" fallbackDescription="议程经工作人员审核发布后在此展示。"><section className="empty-state portal-child-empty"><h2>议程尚未发布</h2><Link href={`/exhibition/${slug}`}>返回展会首页</Link></section></PublicSiteShell>;
  const [version] = await db.select().from(agendaVersions).where(and(eq(agendaVersions.id, agenda.currentVersionId), eq(agendaVersions.reviewStatus, 'PUBLISHED'))).limit(1);
  if (!version) return <PublicSiteShell event={event} currentPath="/agenda" eyebrow="PROGRAMME" fallbackTitle="活动议程" fallbackDescription="议程经工作人员审核发布后在此展示。"><section className="empty-state portal-child-empty"><h2>议程暂不可访问</h2></section></PublicSiteShell>;
  const snapshot = JSON.parse(version.snapshotJson) as AgendaSnapshot;
  const parents = snapshot.sessions.filter((item) => !item.parentSessionId);
  return <PublicSiteShell event={event} currentPath="/agenda" eyebrow={`PROGRAMME · V${version.versionNo}`} fallbackTitle={snapshot.name} fallbackDescription={`时间按 ${snapshot.timezone} 展示，地点使用现场文字或会议室编号。`}><section className="public-agenda-list">{parents.map((parent) => <article key={parent.id}><time><strong>{parent.startAt.slice(0, 10)}</strong><span>{parent.startAt.slice(11, 16)}—{parent.endAt.slice(11, 16)}</span></time><div><span>{parent.sessionType} · {parent.locationText || '地点待定'}</span><h2>{parent.title}</h2><p>{parent.introduction}</p>{parent.guests.length ? <div className="agenda-guests">{parent.guests.map((guest) => <i key={guest.id}>{guest.name} · {guest.profile.title}</i>)}</div> : null}{snapshot.sessions.filter((item) => item.parentSessionId === parent.id).map((child) => <section key={child.id}><time>{child.startAt.slice(11, 16)}—{child.endAt.slice(11, 16)}</time><div><strong>{child.title}</strong><small>{child.locationText} {child.guests.map((guest) => guest.name).join('、')}</small></div></section>)}</div></article>)}</section></PublicSiteShell>;
}
