/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { and, desc, eq } from 'drizzle-orm';
import QRCode from 'qrcode';
import { NotificationCenter } from '@/components/notification-center';
import { PublicAccountActions } from '@/components/public-account-actions';
import { PublicProfileEditor } from '@/components/public-profile-editor';
import { getDb } from '@/db';
import { events, registrationAccessCodes, registrationActivities, registrationProfileVersions, registrationRecords, userNotifications } from '@/db/schema';
import { getCurrentPublicActor } from '@/lib/public-auth';
import { parseRegistrationForm } from '@/lib/registration-types';

const statusName: Record<string, string> = { PENDING: '待审核', APPROVED: '已通过', REJECTED: '已退回', CHECKED_IN: '已签到' };

function parseValues(value: string) {
  try { return JSON.parse(value) as Record<string, string | string[]>; } catch { return {}; }
}

function parseChangedFields(value: string) {
  try { return JSON.parse(value) as string[]; } catch { return []; }
}

export default async function PublicAccountPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event) return <main className="portal-unavailable"><h1>展会不存在</h1></main>;
  const actor = await getCurrentPublicActor();
  if (!actor) return <main className="public-account-page"><header><Link href={`/exhibition/${slug}`}>← 返回展会首页</Link><strong>{event.shortName}</strong></header><section className="public-account-empty"><h1>登录后查看个人中心</h1><p>报名记录、审核状态、签到状态和受限资料权限将归集到同一账号。</p><Link className="portal-primary button-link" href={`/exhibition/${slug}/login?returnTo=/exhibition/${slug}/me`}>观众登录</Link></section></main>;

  const [records, activities, allEvents, codes, profileVersions, notifications] = await Promise.all([
    db.select().from(registrationRecords).where(eq(registrationRecords.accountId, actor.accountId)),
    db.select().from(registrationActivities), db.select().from(events), db.select().from(registrationAccessCodes), db.select().from(registrationProfileVersions),
    db.select().from(userNotifications).where(and(eq(userNotifications.recipientType, 'PUBLIC_ACCOUNT'), eq(userNotifications.recipientAccountId, actor.accountId))).orderBy(desc(userNotifications.createdAt)),
  ]);
  const cards = await Promise.all(records.map(async record => {
    const activity = activities.find(item => item.id === record.activityId);
    const relatedEvent = allEvents.find(item => item.id === record.eventId);
    const access = codes.find(item => item.recordId === record.id && item.status === 'ACTIVE');
    const canShowCode = Boolean(access && ['APPROVED', 'CHECKED_IN'].includes(record.status));
    const pending = profileVersions.filter(item => item.recordId === record.id && item.reviewStatus === 'PENDING').sort((a, b) => b.versionNo - a.versionNo)[0];
    const form = parseRegistrationForm(activity?.formSchemaJson ?? '{"fields":[]}');
    const changedLabels = pending ? parseChangedFields(pending.changedFieldsJson).map(id => form.fields.find(field => field.id === id)?.label ?? id) : [];
    return {
      record, activity, relatedEvent, form, pending: pending ? { versionNo: pending.versionNo, changedLabels } : null,
      code: canShowCode ? access!.code : null,
      qr: canShowCode ? await QRCode.toDataURL(access!.code, { width: 180, margin: 1, color: { dark: '#073d34', light: '#ffffff' } }) : null,
    };
  }));
  const currentRegistration = activities.find((item) => item.eventId === event.id && item.status === 'OPEN' && item.showInPortal);

  return <main className="public-account-page">
    <header><Link href={`/exhibition/${slug}`}>← 返回展会首页</Link><div><strong>{actor.displayName}</strong><small>{actor.identities.map(identity => `${identity.identityType} · ${identity.displayMasked}`).join('　')}</small></div><PublicAccountActions loginHref={`/exhibition/${slug}/login`}/></header>
    <section className="account-hero"><span>MY EXHIBITIONS</span><h1>我的会展</h1><p>同一已验证身份可查看参加的历届展会；每次报名继续保留独立事实记录。</p></section>
    <NotificationCenter initialItems={notifications.map((item) => ({ id: item.id, category: item.category, title: item.title, body: item.body, href: item.href, status: item.status, readAt: item.readAt, createdAt: item.createdAt }))} endpointPrefix="/api/public-notifications" compact/>
    <section className="account-registration-list">{cards.length ? cards.map(({ record, activity, relatedEvent, form, pending, code, qr }) => <article className="account-registration-card" key={record.id}>
      <div><span>{relatedEvent?.year} · {relatedEvent?.shortName}</span><h2>{activity?.name ?? '报名活动'}</h2><p>{record.organization} · 提交于 {record.submittedAt.slice(0, 16).replace('T', ' ')}</p></div>
      <strong>{statusName[record.status] ?? record.status}</strong><small>报名编号 {record.id} · 当前资料 V{record.version}</small>
      {qr && code ? <section className="account-access-code"><img src={qr} alt={`${record.personName}签到二维码`}/><div><b>现场签到凭证</b><code>{code}</code><p>请向工作人员出示二维码或凭证码。默认只签到，不记录签退。</p></div></section> : <p className="credential-pending">{record.status === 'PENDING' ? '审核通过后生成可出示的签到凭证。' : record.status === 'REJECTED' ? '报名已退回，修改资料后可重新提交。' : ''}</p>}
      <PublicProfileEditor recordId={record.id} form={form} initialValues={parseValues(record.answersJson)} allowEdit={Boolean(activity?.allowEdit)} recheckEnabled={Boolean(activity?.profileRecheckEnabled)} pendingVersion={pending} />
    </article>) : <div className="empty-state">当前账号还没有报名记录。</div>}</section>
    <section className="account-actions">{currentRegistration ? <Link href={`/exhibition/${slug}/register/${currentRegistration.id}`}>报名当前展会</Link> : null}<Link href={`/exhibition/${slug}/matching`}>我的供需与预约</Link><Link href={`/exhibition/${slug}/documents`}>查看资料中心</Link><Link href={`/exhibition/${slug}/agenda`}>查看公开议程</Link></section>
  </main>;
}
