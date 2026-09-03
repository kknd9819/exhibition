import { getDb } from '@/db';
import { appointments, eventExhibitors, events, inquiries, messageDeliveries, messageTasks, registrationRecords } from '@/db/schema';

export async function buildAnalyticsDataset(input: { year: number; eventId?: string | null }) {
  const db = getDb();
  const [eventRows, registrations, exhibitors, inquiryRows, appointmentRows, tasks, deliveries] = await Promise.all([
    db.select().from(events), db.select().from(registrationRecords), db.select().from(eventExhibitors), db.select().from(inquiries), db.select().from(appointments), db.select().from(messageTasks), db.select().from(messageDeliveries),
  ]);
  const selectedEvents = eventRows.filter((event) => event.year === input.year && (!input.eventId || event.id === input.eventId));
  const ids = new Set(selectedEvents.map((event) => event.id));
  const scopedRegistrations = registrations.filter((row) => ids.has(row.eventId));
  const scopedExhibitors = exhibitors.filter((row) => ids.has(row.eventId));
  const scopedAppointments = appointmentRows.filter((row) => ids.has(row.eventId));
  const taskIds = new Set(tasks.filter((row) => ids.has(row.eventId)).map((row) => row.id));
  const scopedDeliveries = deliveries.filter((row) => taskIds.has(row.taskId));
  const successDeliveries = scopedDeliveries.filter((row) => row.status === 'SUCCESS').length;
  const eventMatrix = selectedEvents.map((event) => {
    const eventRegistrations = registrations.filter((row) => row.eventId === event.id);
    return { eventCode: event.code, eventName: event.name, year: event.year, status: event.status, registrationRecords: eventRegistrations.length, uniqueAccounts: new Set(eventRegistrations.map((row) => row.accountId)).size, checkedIn: eventRegistrations.filter((row) => row.status === 'CHECKED_IN').length, approvedExhibitors: exhibitors.filter((row) => row.eventId === event.id && row.qualificationStatus === 'APPROVED').length, inquiries: inquiryRows.filter((row) => row.eventId === event.id).length, appointments: appointmentRows.filter((row) => row.eventId === event.id).length };
  });
  return {
    selectedEvents,
    eventMatrix,
    metrics: [
      { code: 'registration.records', value: scopedRegistrations.length, numerator: null, denominator: null },
      { code: 'registration.unique_accounts', value: new Set(scopedRegistrations.map((row) => row.accountId)).size, numerator: null, denominator: null },
      { code: 'registration.checked_in', value: scopedRegistrations.filter((row) => row.status === 'CHECKED_IN').length, numerator: null, denominator: null },
      { code: 'exhibitor.approved', value: scopedExhibitors.filter((row) => row.qualificationStatus === 'APPROVED').length, numerator: null, denominator: null },
      { code: 'matching.appointments', value: scopedAppointments.length, numerator: null, denominator: null },
      { code: 'message.success_rate', value: scopedDeliveries.length ? successDeliveries / scopedDeliveries.length : 0, numerator: successDeliveries, denominator: scopedDeliveries.length },
    ],
  };
}

function protectCsvFormula(value: unknown) { const text = String(value ?? ''); return /^[=+\-@]/.test(text) ? `'${text}` : text; }
function csv(value: unknown) { return `"${protectCsvFormula(value).replaceAll('"', '""')}"`; }
export function analyticsReportCsv(rows: Awaited<ReturnType<typeof buildAnalyticsDataset>>['eventMatrix']) {
  const headers = ['展会编码', '展会名称', '年度', '状态', '报名记录', '去重账号', '已签到', '资格通过企业', '询盘', '预约'];
  return `\uFEFF${[headers, ...rows.map((row) => [row.eventCode, row.eventName, row.year, row.status, row.registrationRecords, row.uniqueAccounts, row.checkedIn, row.approvedExhibitors, row.inquiries, row.appointments])].map((row) => row.map(csv).join(',')).join('\r\n')}`;
}

export async function sha256Text(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
