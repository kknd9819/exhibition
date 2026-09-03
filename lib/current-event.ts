import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { getDb } from '@/db';
import { events } from '@/db/schema';
import { getCurrentSessionActor } from '@/lib/auth';

export const CURRENT_EVENT_COOKIE = 'expo_current_event';
export const DEFAULT_EVENT_ID = 'evt-morocco-2026';

export async function getCurrentEventContext() {
  const [eventRows, actor] = await Promise.all([getDb().select().from(events), getCurrentSessionActor()]);
  const cookieStore = await cookies();
  const requestedId = cookieStore.get(CURRENT_EVENT_COOKIE)?.value ?? DEFAULT_EVENT_ID;
  const accessibleRows = actor?.groupRole === 'GROUP_ADMIN' ? eventRows : actor ? eventRows.filter((item) => actor.memberships.some((membership) => membership.eventId === item.id)) : [];
  const current = accessibleRows.find((item) => item.id === requestedId) ?? accessibleRows.find((item) => item.id === DEFAULT_EVENT_ID) ?? accessibleRows[0] ?? null;
  return { current, events: accessibleRows.sort((a, b) => b.year - a.year || a.name.localeCompare(b.name, 'zh-CN')) };
}

export async function getCurrentEventId() {
  return (await getCurrentEventContext()).current?.id ?? DEFAULT_EVENT_ID;
}

export function getEventIdFromRequest(request: NextRequest) {
  return request.cookies.get(CURRENT_EVENT_COOKIE)?.value ?? DEFAULT_EVENT_ID;
}

export async function getEventById(id: string) {
  return (await getDb().select().from(events).where(eq(events.id, id)).limit(1))[0] ?? null;
}
