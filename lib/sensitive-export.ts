import { getDb } from '@/db';
import { enterpriseAccounts, enterpriseIdentities, enterprises, eventExhibitors, events, publicIdentities, registrationRecords } from '@/db/schema';

export type SensitiveDataset = 'PERSON_CONTACTS' | 'ENTERPRISE_CONTACTS';
export type SensitiveScope = 'CURRENT_EVENT' | 'GROUP';

export const sensitiveExportFieldOptions: Record<SensitiveDataset, Array<{ key: string; label: string; sensitive?: boolean }>> = {
  PERSON_CONTACTS: [
    { key: 'personName', label: '姓名' }, { key: 'mobile', label: '完整手机号', sensitive: true }, { key: 'email', label: '完整邮箱', sensitive: true },
    { key: 'organization', label: '单位' }, { key: 'jobTitle', label: '职务' }, { key: 'country', label: '国家/地区' },
    { key: 'eventName', label: '展会' }, { key: 'registrationStatus', label: '报名状态' }, { key: 'submittedAt', label: '报名时间' },
  ],
  ENTERPRISE_CONTACTS: [
    { key: 'enterpriseName', label: '企业中文名' }, { key: 'internationalName', label: '企业国际名' }, { key: 'country', label: '国家/地区' },
    { key: 'contactName', label: '联系人' }, { key: 'mobile', label: '完整手机号', sensitive: true }, { key: 'email', label: '完整邮箱', sensitive: true },
    { key: 'website', label: '网站' }, { key: 'eventName', label: '展会' }, { key: 'qualificationStatus', label: '参展资格' }, { key: 'boothNo', label: '展位号' },
  ],
};

function protectCsvFormula(value: unknown) {
  const text = String(value ?? '');
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function csv(value: unknown) {
  return `"${protectCsvFormula(value).replaceAll('"', '""')}"`;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function identityValue(rows: Array<{ accountId: string; identityType: string; normalizedValue: string }>, accountId: string | null, kind: 'MOBILE' | 'EMAIL') {
  if (!accountId) return '';
  const matching = rows.find((item) => item.accountId === accountId && (kind === 'MOBILE' ? item.identityType.includes('MOBILE') : item.identityType === 'EMAIL'));
  return matching?.normalizedValue ?? '';
}

export async function buildSensitiveExport(input: { dataset: SensitiveDataset; scope: SensitiveScope; eventId: string; fields: string[] }) {
  const options = sensitiveExportFieldOptions[input.dataset];
  const allowed = new Set(options.map((item) => item.key));
  const selected = input.fields.filter((field) => allowed.has(field));
  if (!selected.length) throw new Error('至少选择一个导出字段');
  const labels = new Map(options.map((item) => [item.key, item.label]));
  const db = getDb();
  const eventRows = await db.select().from(events);
  const eventMap = new Map(eventRows.map((item) => [item.id, item.name]));
  let rows: Array<Record<string, unknown>> = [];

  if (input.dataset === 'PERSON_CONTACTS') {
    const [registrations, identities] = await Promise.all([db.select().from(registrationRecords), db.select().from(publicIdentities)]);
    rows = registrations.filter((item) => input.scope === 'GROUP' || item.eventId === input.eventId).map((item) => ({
      personName: item.personName,
      mobile: identityValue(identities, item.accountId, 'MOBILE'),
      email: identityValue(identities, item.accountId, 'EMAIL'),
      organization: item.organization,
      jobTitle: item.jobTitle,
      country: item.country,
      eventName: eventMap.get(item.eventId) ?? item.eventId,
      registrationStatus: item.status,
      submittedAt: item.submittedAt,
    }));
  } else {
    const [enterpriseRows, participationRows, accountRows, identities] = await Promise.all([
      db.select().from(enterprises), db.select().from(eventExhibitors), db.select().from(enterpriseAccounts), db.select().from(enterpriseIdentities),
    ]);
    const accountByEnterprise = new Map(accountRows.map((item) => [item.enterpriseId, item.id]));
    if (input.scope === 'GROUP') {
      rows = enterpriseRows.map((enterprise) => {
        const latestParticipation = participationRows.find((item) => item.enterpriseId === enterprise.id);
        const accountId = accountByEnterprise.get(enterprise.id) ?? null;
        return { enterpriseName: enterprise.nameZh, internationalName: enterprise.nameIntl, country: enterprise.country, contactName: enterprise.contactName, mobile: identityValue(identities, accountId, 'MOBILE') || enterprise.accountContact, email: identityValue(identities, accountId, 'EMAIL') || enterprise.contactEmailMasked, website: enterprise.website, eventName: latestParticipation ? eventMap.get(latestParticipation.eventId) ?? latestParticipation.eventId : '', qualificationStatus: latestParticipation?.qualificationStatus ?? '', boothNo: latestParticipation?.boothNo ?? '' };
      });
    } else {
      rows = participationRows.filter((item) => item.eventId === input.eventId).map((participation) => {
        const enterprise = enterpriseRows.find((item) => item.id === participation.enterpriseId);
        if (!enterprise) return null;
        const accountId = accountByEnterprise.get(enterprise.id) ?? null;
        return { enterpriseName: enterprise.nameZh, internationalName: enterprise.nameIntl, country: enterprise.country, contactName: enterprise.contactName, mobile: identityValue(identities, accountId, 'MOBILE') || enterprise.accountContact, email: identityValue(identities, accountId, 'EMAIL') || enterprise.contactEmailMasked, website: enterprise.website, eventName: eventMap.get(participation.eventId) ?? participation.eventId, qualificationStatus: participation.qualificationStatus, boothNo: participation.boothNo ?? '' };
      }).filter((item): item is Record<string, unknown> => Boolean(item));
    }
  }

  const lines = [selected.map((field) => csv(labels.get(field) ?? field)).join(','), ...rows.map((row) => selected.map((field) => csv(row[field])).join(','))];
  const content = `\uFEFF${lines.join('\r\n')}`;
  const eventSlug = eventRows.find((item) => item.id === input.eventId)?.slug ?? input.eventId;
  return { content, rowCount: rows.length, sha256: await sha256(content), fileName: `sensitive-${input.dataset.toLowerCase()}-${input.scope.toLowerCase()}-${eventSlug}.csv` };
}
