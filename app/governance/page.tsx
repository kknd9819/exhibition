import { desc, inArray } from 'drizzle-orm';
import { AdminShell } from '@/components/admin-shell';
import { GovernanceWorkspace } from '@/components/governance-workspace';
import { getDb } from '@/db';
import { auditLogs, events, recycleBinItems } from '@/db/schema';
import { getCurrentSessionActor } from '@/lib/auth';

export default async function GovernancePage(){
  const actor=await getCurrentSessionActor();
  if(!actor)return <AdminShell active="/governance" title="治理中心"><section className="panel">请先登录。</section></AdminShell>;
  const db=getDb();
  const eventRows=await db.select().from(events).orderBy(desc(events.year));
  const allowedIds=actor.groupRole==='GROUP_ADMIN'?eventRows.map(row=>row.id):actor.memberships.map(row=>row.eventId);
  const [logs,recycle]=allowedIds.length?await Promise.all([
    db.select().from(auditLogs).where(inArray(auditLogs.eventId,allowedIds)).orderBy(desc(auditLogs.occurredAt)).limit(500),
    db.select().from(recycleBinItems).where(inArray(recycleBinItems.eventId,allowedIds)).orderBy(desc(recycleBinItems.deletedAt)).limit(300),
  ]):[[],[]];
  const groupLogs=actor.groupRole==='GROUP_ADMIN'?await db.select().from(auditLogs).orderBy(desc(auditLogs.occurredAt)).limit(500):logs;
  return <AdminShell active="/governance" title="治理中心" eyebrow="集团工作台 / 审计与回收站"><GovernanceWorkspace initialLogs={groupLogs} initialRecycleItems={recycle} events={eventRows.map(row=>({id:row.id,label:`${row.year} · ${row.shortName}`}))} canPurge={actor.groupRole==='GROUP_ADMIN'}/></AdminShell>;
}
