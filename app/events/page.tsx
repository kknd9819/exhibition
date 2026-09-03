import { desc } from 'drizzle-orm';
import { AdminShell } from '@/components/admin-shell';
import { EventWorkspace } from '@/components/event-workspace';
import { getDb } from '@/db';
import { employeeAccounts, eventCopyJobs, eventFeatures, eventMembers, events } from '@/db/schema';

export default async function EventsPage() {
  const db = getDb();
  const [eventRows, employees, features, members, copyJobs] = await Promise.all([
    db.select().from(events).orderBy(desc(events.year), desc(events.createdAt)),
    db.select().from(employeeAccounts),
    db.select().from(eventFeatures),
    db.select().from(eventMembers),
    db.select().from(eventCopyJobs).orderBy(desc(eventCopyJobs.createdAt)),
  ]);
  return <AdminShell active="/events" title="展会项目与生命周期" eyebrow="集团工作台 / 全部展会"><EventWorkspace initialEvents={eventRows.map((event) => ({ ...event, features: features.filter((item) => item.eventId === event.id).map((item) => ({ code: item.featureCode, enabled: item.enabled })), memberCount: members.filter((item) => item.eventId === event.id && item.status === 'ACTIVE').length }))} employees={employees} copyJobs={copyJobs.slice(0, 10)} /></AdminShell>;
}
