import { eq } from 'drizzle-orm';
import { AdminShell } from '@/components/admin-shell';
import { IamWorkspace } from '@/components/iam-workspace';
import { getDb } from '@/db';
import { employeeAccounts, eventMembers, events } from '@/db/schema';

export default async function IamPage() {
  const db = getDb();
  const [employees, eventRows, memberRows] = await Promise.all([
    db.select().from(employeeAccounts), db.select().from(events),
    db.select({ id: eventMembers.id, eventId: eventMembers.eventId, eventName: events.shortName, accountId: eventMembers.accountId, employeeName: employeeAccounts.name, roleCode: eventMembers.roleCode, permissionsJson: eventMembers.permissionsJson, isReviewer: eventMembers.isReviewer, status: eventMembers.status }).from(eventMembers).innerJoin(events, eq(eventMembers.eventId, events.id)).innerJoin(employeeAccounts, eq(eventMembers.accountId, employeeAccounts.id)),
  ]);
  return <AdminShell active="/iam" title="员工账号、成员与权限" eyebrow="集团工作台 / 安全与权限"><IamWorkspace initialEmployees={employees} events={eventRows.map((item) => ({ id: item.id, name: item.shortName, year: item.year }))} initialMembers={memberRows} /></AdminShell>;
}
