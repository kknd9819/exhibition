import Link from 'next/link';
import { and, desc, eq } from 'drizzle-orm';
import { PublicMatchingClient } from '@/components/public-matching-client';
import { PublicSiteShell } from '@/components/portal/public-site-shell';
import { getDb } from '@/db';
import { appointments, demandSupplyPosts, enterprises, eventExhibitors, eventFeatures, events } from '@/db/schema';
import { getCurrentPublicActor } from '@/lib/public-auth';

export default async function PublicMatchingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event) return <main className="portal-unavailable"><h1>展会不存在</h1></main>;
  const [feature] = await db.select().from(eventFeatures).where(and(eq(eventFeatures.eventId, event.id), eq(eventFeatures.featureCode, 'MATCHING'))).limit(1);
  if (!feature?.enabled) return <PublicSiteShell event={event} currentPath="/matching" eyebrow="BUSINESS MATCHING" fallbackTitle="供需与线下面谈" fallbackDescription="该功能由展会工作人员按届开启。"><section className="empty-state portal-child-empty"><h2>供需与预约尚未开放</h2><Link href={`/exhibition/${slug}`}>返回展会首页</Link></section></PublicSiteShell>;
  const actor = await getCurrentPublicActor();
  const [posts, exhibitorRows, ownAppointments] = await Promise.all([
    db.select().from(demandSupplyPosts).where(eq(demandSupplyPosts.eventId, event.id)).orderBy(desc(demandSupplyPosts.createdAt)),
    db.select({ id: enterprises.id, name: enterprises.nameZh, boothNo: eventExhibitors.boothNo }).from(eventExhibitors).innerJoin(enterprises, eq(eventExhibitors.enterpriseId, enterprises.id)).where(and(eq(eventExhibitors.eventId, event.id), eq(eventExhibitors.qualificationStatus, 'APPROVED'), eq(eventExhibitors.publishStatus, 'PUBLISHED'))),
    actor ? db.select().from(appointments).where(and(eq(appointments.eventId, event.id), eq(appointments.inviterPublicAccountId, actor.accountId))).orderBy(desc(appointments.createdAt)) : Promise.resolve([]),
  ]);
  return <PublicSiteShell event={event} currentPath="/matching" eyebrow="SUPPLY · DEMAND · OFFLINE MEETINGS" fallbackTitle="供需与线下面谈" fallbackDescription="公开供需先审核；预约由被邀请企业接受后生效，并执行时间冲突检查。"><PublicMatchingClient eventId={event.id} eventSlug={slug} eventStart={event.startAt} loggedIn={Boolean(actor)} posts={posts.filter((item) => item.reviewStatus === 'PUBLISHED')} ownPosts={actor ? posts.filter((item) => item.publisherPublicAccountId === actor.accountId) : []} enterprises={exhibitorRows} appointments={ownAppointments}/></PublicSiteShell>;
}
