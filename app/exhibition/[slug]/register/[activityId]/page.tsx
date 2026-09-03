import { and, eq } from 'drizzle-orm';
import Link from 'next/link';
import { PublicRegistrationForm } from '@/components/public-registration-form';
import { PublicSiteShell } from '@/components/portal/public-site-shell';
import { getDb } from '@/db';
import { events, registrationActivities } from '@/db/schema';
import { parseRegistrationForm } from '@/lib/registration-types';
import { getCurrentPublicActor } from '@/lib/public-auth';

export default async function PublicRegistrationPage({ params }: { params: Promise<{ slug: string; activityId: string }> }) {
  const { slug, activityId } = await params;
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event) return <main className="portal-unavailable"><h1>展会不存在</h1></main>;
  const [activity] = await db.select().from(registrationActivities).where(and(eq(registrationActivities.id, activityId), eq(registrationActivities.eventId, event.id))).limit(1);
  if (!activity || activity.status !== 'OPEN' || !activity.showInPortal) return <main className="portal-unavailable"><h1>报名暂未开放</h1><Link href={`/exhibition/${slug}`}>返回展会主页</Link></main>;
  const publicActor = await getCurrentPublicActor();
  return <PublicSiteShell event={event} currentPath={`/register/${activity.id}`} eyebrow="OFFLINE EVENT REGISTRATION" fallbackTitle={activity.name} fallbackDescription={activity.description}>
    <section className="registration-facts"><dl><div><dt>活动时间</dt><dd>{activity.startAt?.slice(0, 16).replace('T', ' ') ?? '待公布'}</dd></div><div><dt>活动地点</dt><dd>{activity.locationName || '待公布'}</dd></div><div><dt>名额上限</dt><dd>{activity.quota.toLocaleString('zh-CN')}</dd></div><div><dt>审核方式</dt><dd>{activity.reviewMode === 'AUTO' ? '提交后自动通过' : '工作人员审核'}</dd></div></dl></section>
    {publicActor?<PublicRegistrationForm activityId={activity.id} form={parseRegistrationForm(activity.formSchemaJson)} reviewMode={activity.reviewMode} successMessage={activity.successMessage} />:<section className="registration-login-gate"><h2>请先验证观众身份</h2><p>报名记录将与已验证手机号、邮箱或微信身份关联，用于后续查看状态和访问指定资料。</p><Link className="portal-primary button-link" href={`/exhibition/${slug}/login?returnTo=/exhibition/${slug}/register/${activity.id}`}>登录并继续报名</Link></section>}
  </PublicSiteShell>;
}
