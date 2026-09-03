import { getDb } from '@/db';
import { appointments, checkinLogs, demandSupplyPosts, enterpriseAccounts, enterprises, eventExhibitors, events, inquiries, personMasters, products, publicAccounts, publicIdentities, registrationRecords } from '@/db/schema';

export type MergeEntityType = 'PERSON' | 'ENTERPRISE';

export async function buildMergePreview(entityType: MergeEntityType, sourceId: string, targetId: string) {
  if (sourceId === targetId) throw new Error('主记录与从记录不能相同');
  const db = getDb();
  const [personRows, accountRows, identityRows, registrationRows, checkinRows, enterpriseRows, exhibitorRows, productRows, inquiryRows, postRows, appointmentRows, eventRows, enterpriseAccountRows] = await Promise.all([
    db.select().from(personMasters), db.select().from(publicAccounts), db.select().from(publicIdentities), db.select().from(registrationRecords), db.select().from(checkinLogs), db.select().from(enterprises), db.select().from(eventExhibitors), db.select().from(products), db.select().from(inquiries), db.select().from(demandSupplyPosts), db.select().from(appointments), db.select().from(events), db.select().from(enterpriseAccounts),
  ]);
  const eventName = new Map(eventRows.map(item => [item.id, `${item.year} · ${item.shortName}`]));
  if (entityType === 'PERSON') {
    const source = personRows.find(item => item.id === sourceId); const target = personRows.find(item => item.id === targetId);
    if (!source || !target) throw new Error('人员主档不存在');
    if (source.mergedIntoPersonId || source.status === 'MERGED') throw new Error('从记录已经合并');
    if (target.mergedIntoPersonId || target.status === 'MERGED') throw new Error('目标必须为有效主记录');
    const summarize = (personId: string) => {
      const accounts = accountRows.filter(item => item.personMasterId === personId); const accountIds = accounts.map(item => item.id);
      const registrations = registrationRows.filter(item => accountIds.includes(item.accountId)); const recordIds = registrations.map(item => item.id);
      const posts = postRows.filter(item => item.publisherPublicAccountId && accountIds.includes(item.publisherPublicAccountId));
      const appointmentsForPerson = appointmentRows.filter(item => (item.inviterPublicAccountId && accountIds.includes(item.inviterPublicAccountId)) || (item.inviteePublicAccountId && accountIds.includes(item.inviteePublicAccountId)));
      const eventIds = [...new Set([...registrations.map(item => item.eventId), ...posts.map(item => item.eventId), ...appointmentsForPerson.map(item => item.eventId)])];
      return { accountIds, accounts: accounts.length, identities: identityRows.filter(item => accountIds.includes(item.accountId)).length, registrations: registrations.length, checkins: checkinRows.filter(item => recordIds.includes(item.recordId)).length, posts: posts.length, appointments: appointmentsForPerson.length, events: eventIds.map(id => eventName.get(id) ?? id) };
    };
    return { entityType, source: { id: source.id, name: source.displayName, facts: summarize(source.id) }, target: { id: target.id, name: target.displayName, facts: summarize(target.id) }, strategy: { displayName: 'TARGET_WINS', identities: 'UNION', eventFacts: 'KEEP_ORIGINAL_IDS' } };
  }
  const source = enterpriseRows.find(item => item.id === sourceId); const target = enterpriseRows.find(item => item.id === targetId);
  if (!source || !target) throw new Error('企业主档不存在');
  if (source.mergedIntoEnterpriseId || source.status === 'MERGED') throw new Error('从记录已经合并');
  if (target.mergedIntoEnterpriseId || target.status === 'MERGED') throw new Error('目标必须为有效主记录');
  const summarize = (enterpriseId: string) => {
    const participations = exhibitorRows.filter(item => item.enterpriseId === enterpriseId); const exhibitorIds = participations.map(item => item.id);
    const posts = postRows.filter(item => item.publisherEnterpriseId === enterpriseId); const appointmentsForEnterprise = appointmentRows.filter(item => item.inviterEnterpriseId === enterpriseId || item.inviteeEnterpriseId === enterpriseId);
    const eventIds = [...new Set([...participations.map(item => item.eventId), ...posts.map(item => item.eventId), ...appointmentsForEnterprise.map(item => item.eventId)])];
    return { accounts: enterpriseAccountRows.filter(item => item.enterpriseId === enterpriseId).length, participations: participations.length, products: productRows.filter(item => exhibitorIds.includes(item.eventExhibitorId)).length, inquiries: inquiryRows.filter(item => exhibitorIds.includes(item.eventExhibitorId)).length, posts: posts.length, appointments: appointmentsForEnterprise.length, events: eventIds.map(id => eventName.get(id) ?? id) };
  };
  return { entityType, source: { id: source.id, name: source.nameZh, facts: summarize(source.id) }, target: { id: target.id, name: target.nameZh, facts: summarize(target.id) }, strategy: { name: 'TARGET_WINS', identifiers: 'KEEP_BOTH_AS_ALIASES', eventFacts: 'KEEP_ORIGINAL_IDS' } };
}
