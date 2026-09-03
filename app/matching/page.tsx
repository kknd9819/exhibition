import { desc, eq } from 'drizzle-orm';
import { AdminShell } from '@/components/admin-shell';
import { MatchingWorkspace } from '@/components/matching-workspace';
import { getDb } from '@/db';
import { appointments, appointmentResponses, demandSupplyPosts, meetingSchedules, scheduleBatches } from '@/db/schema';
import { getCurrentEventContext } from '@/lib/current-event';

export default async function MatchingPage() {
  const { current } = await getCurrentEventContext();
  if (!current) return <AdminShell active="/matching" title="供需、预约与人工排期"><section className="panel">请先选择展会。</section></AdminShell>;
  const db = getDb();
  const [posts, appointmentRows, responses, batches, schedules] = await Promise.all([
    db.select().from(demandSupplyPosts).where(eq(demandSupplyPosts.eventId, current.id)).orderBy(desc(demandSupplyPosts.createdAt)),
    db.select().from(appointments).where(eq(appointments.eventId, current.id)).orderBy(desc(appointments.createdAt)),
    db.select().from(appointmentResponses).orderBy(desc(appointmentResponses.createdAt)),
    db.select().from(scheduleBatches).where(eq(scheduleBatches.eventId, current.id)).orderBy(desc(scheduleBatches.createdAt)),
    db.select().from(meetingSchedules).where(eq(meetingSchedules.eventId, current.id)).orderBy(meetingSchedules.startAt),
  ]);
  return <AdminShell active="/matching" title="供需、预约与人工排期"><MatchingWorkspace event={{ id: current.id, name: current.shortName, startAt: current.startAt, endAt: current.endAt }} initialPosts={posts} initialAppointments={appointmentRows.map((item) => ({ ...item, responses: responses.filter((response) => response.appointmentId === item.id) }))} initialBatches={batches.map((item) => ({ ...item, schedules: schedules.filter((schedule) => schedule.batchId === item.id) }))}/></AdminShell>;
}
