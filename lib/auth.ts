import { and, eq, gt, isNull } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { getDb } from '@/db';
import { employeeAccounts, eventMembers, loginSessions } from '@/db/schema';

export const SESSION_COOKIE = 'expo_alpha_session';

export async function hashValue(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function resolveSessionActor(token?: string) {
  if (!token) return null;
  const db = getDb();
  const tokenHash = await hashValue(token);
  const rows = await db.select({ sessionId: loginSessions.id, accountId: employeeAccounts.id, name: employeeAccounts.name, groupRole: employeeAccounts.groupRole, status: employeeAccounts.status, expiresAt: loginSessions.expiresAt }).from(loginSessions).innerJoin(employeeAccounts, eq(loginSessions.accountId, employeeAccounts.id)).where(and(eq(loginSessions.tokenHash, tokenHash), isNull(loginSessions.revokedAt), gt(loginSessions.expiresAt, new Date().toISOString()))).limit(1);
  if (!rows.length || rows[0].status !== 'ACTIVE') return null;
  const memberships = await db.select().from(eventMembers).where(and(eq(eventMembers.accountId, rows[0].accountId), eq(eventMembers.status, 'ACTIVE')));
  return { ...rows[0], memberships: memberships.map((item) => ({ eventId: item.eventId, roleCode: item.roleCode, permissions: JSON.parse(item.permissionsJson) as string[], isReviewer: item.isReviewer })) };
}

export async function getSessionActor(request: NextRequest) {
  return resolveSessionActor(request.cookies.get(SESSION_COOKIE)?.value);
}

export async function getCurrentSessionActor() {
  const cookieStore = await cookies();
  return resolveSessionActor(cookieStore.get(SESSION_COOKIE)?.value);
}

export function hasEventPermission(actor: Awaited<ReturnType<typeof getSessionActor>>, eventId: string, permission: string) {
  if (!actor) return false;
  if (actor.groupRole === 'GROUP_ADMIN') return true;
  const membership = actor.memberships.find((item) => item.eventId === eventId);
  const aliases: Record<string, string[]> = {
    'event.analytics.view': ['analytics.view'],
    'analytics.view': ['event.analytics.view'],
  };
  const accepted = new Set([permission, ...(aliases[permission] ?? [])]);
  return Boolean(membership?.permissions.some((value) => accepted.has(value) || value === 'event.*' || (value.endsWith('.*') && permission.startsWith(value.slice(0, -1)))));
}
