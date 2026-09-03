import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { CheckinConsole } from '@/components/checkin-console';
import { getDb } from '@/db';
import { checkinLogs, checkinReversals, events, registrationActivities, registrationRecords } from '@/db/schema';
import { getCurrentSessionActor, hasEventPermission } from '@/lib/auth';
import { getCurrentEventContext } from '@/lib/current-event';

export default async function CheckinPage() {
  const [{ current }, actor] = await Promise.all([getCurrentEventContext(), getCurrentSessionActor()]);
  if (!current) return <main className="checkin-gate"><h1>请先选择展会</h1><Link href="/">返回管理后台</Link></main>;
  if (!hasEventPermission(actor, current.id, 'checkin.execute')) return <main className="checkin-gate"><h1>需要现场签到权限</h1><p>请使用具备签到权限的员工账号登录。</p><Link href="/login">员工登录</Link></main>;
  const db = getDb(); const [activities, logs, reversals, records, event] = await Promise.all([db.select().from(registrationActivities).where(eq(registrationActivities.eventId, current.id)), db.select().from(checkinLogs).where(eq(checkinLogs.eventId, current.id)).orderBy(desc(checkinLogs.occurredAt)).limit(30), db.select().from(checkinReversals), db.select().from(registrationRecords).where(eq(registrationRecords.eventId, current.id)), db.select().from(events).where(eq(events.id, current.id)).limit(1)]);
  const reversed = new Set(reversals.map(item => item.checkinLogId)); const recent = logs.map(log => { const record = records.find(item => item.id === log.recordId); return { id: log.id, personName: record?.personName ?? '未知人员', organization: record?.organization ?? '', scope: log.scope, method: log.method, operatorName: log.operatorName, occurredAt: log.occurredAt, reversed: reversed.has(log.id) }; }); const activity = activities[0];
  return <main className="checkin-page"><header><Link href="/">← 管理后台</Link><div><strong>{actor?.name}</strong><small>现场工作人员</small></div></header>{activity ? <CheckinConsole eventId={current.id} eventName={event[0]?.name ?? current.name} activityId={activity.id} activityName={activity.name} initialRecent={recent} canReverse={hasEventPermission(actor, current.id, 'checkin.undo')}/> : <section className="checkin-gate"><h1>当前展会没有报名活动</h1></section>}</main>;
}
