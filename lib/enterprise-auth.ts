import { and, eq, gt, isNull } from 'drizzle-orm';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { getDb } from '@/db';
import { enterpriseAccounts, enterpriseIdentities, enterpriseSessions, enterprises } from '@/db/schema';
import { hashValue } from '@/lib/auth';
import { normalizePublicIdentifier } from '@/lib/public-auth';

export const ENTERPRISE_SESSION_COOKIE = 'expo_enterprise_session';
export const normalizeEnterpriseIdentifier = normalizePublicIdentifier;

async function resolveEnterpriseActor(token?: string) {
  if (!token) return null;
  const db = getDb();
  const rows = await db.select({
    sessionId: enterpriseSessions.id,
    accountId: enterpriseAccounts.id,
    enterpriseId: enterprises.id,
    enterpriseName: enterprises.nameZh,
    displayName: enterpriseAccounts.displayName,
    accountStatus: enterpriseAccounts.status,
    enterpriseStatus: enterprises.status,
    expiresAt: enterpriseSessions.expiresAt,
    rememberDays: enterpriseSessions.rememberDays,
  }).from(enterpriseSessions)
    .innerJoin(enterpriseAccounts, eq(enterpriseSessions.accountId, enterpriseAccounts.id))
    .innerJoin(enterprises, eq(enterpriseAccounts.enterpriseId, enterprises.id))
    .where(and(eq(enterpriseSessions.tokenHash, await hashValue(token)), isNull(enterpriseSessions.revokedAt), gt(enterpriseSessions.expiresAt, new Date().toISOString())))
    .limit(1);
  if (!rows.length || rows[0].accountStatus !== 'ACTIVE' || rows[0].enterpriseStatus !== 'ACTIVE') return null;
  const identities = await db.select().from(enterpriseIdentities).where(eq(enterpriseIdentities.accountId, rows[0].accountId));
  return { ...rows[0], identities };
}

export async function getEnterpriseActor(request: NextRequest) {
  return resolveEnterpriseActor(request.cookies.get(ENTERPRISE_SESSION_COOKIE)?.value);
}

export async function getCurrentEnterpriseActor() {
  const store = await cookies();
  return resolveEnterpriseActor(store.get(ENTERPRISE_SESSION_COOKIE)?.value);
}
