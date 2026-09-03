import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { AdminShell } from '@/components/admin-shell';
import { RegistrationWorkspace } from '@/components/registration-workspace';
import { getDb } from '@/db';
import { registrationActivities, registrationRecords } from '@/db/schema';
import { parseRegistrationForm } from '@/lib/registration-types';
import { getCurrentEventContext } from '@/lib/current-event';

export default async function RegistrationsPage() {
  const db = getDb();
  const { current } = await getCurrentEventContext();
  const [activity] = current ? await db.select().from(registrationActivities).where(eq(registrationActivities.eventId, current.id)).limit(1) : [];
  const records = activity ? await db.select().from(registrationRecords).where(eq(registrationRecords.activityId, activity.id)).orderBy(desc(registrationRecords.submittedAt)) : [];
  if (!activity) return <AdminShell active="/registrations" title="报名与观众管理"><section className="panel">报名活动尚未初始化。</section></AdminShell>;

  return <AdminShell active="/registrations" title="报名与观众管理" actions={current ? <Link className="primary-button button-link" href={`/exhibition/${current.slug}/register/${activity.id}`}>打开公开报名页</Link> : null}>
    <RegistrationWorkspace activity={{ ...activity, form: parseRegistrationForm(activity.formSchemaJson) }} initialRecords={records} />
  </AdminShell>;
}
