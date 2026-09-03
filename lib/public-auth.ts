import { and, eq, gt, isNull } from 'drizzle-orm';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { getDb } from '@/db';
import { publicAccounts, publicIdentities, publicSessions } from '@/db/schema';
import { hashValue } from '@/lib/auth';

export const PUBLIC_SESSION_COOKIE='expo_public_session';

export function normalizePublicIdentifier(value:string){const source=value.trim();if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(source))return{type:'EMAIL',value:source.toLowerCase(),masked:`${source.slice(0,2)}***@${source.split('@')[1]}`};const compact=source.replace(/[\s()-]/g,'');if(/^1\d{10}$/.test(compact))return{type:'CN_MOBILE',value:compact,masked:`${compact.slice(0,3)}****${compact.slice(-4)}`};if(/^\+[1-9]\d{6,14}$/.test(compact))return{type:'INTL_MOBILE',value:compact,masked:`${compact.slice(0,4)} *** ${compact.slice(-3)}`};return null;}

async function resolvePublicActor(token?:string){if(!token)return null;const db=getDb();const tokenHash=await hashValue(token);const rows=await db.select({sessionId:publicSessions.id,accountId:publicAccounts.id,displayName:publicAccounts.displayName,status:publicAccounts.status,expiresAt:publicSessions.expiresAt,rememberDays:publicSessions.rememberDays}).from(publicSessions).innerJoin(publicAccounts,eq(publicSessions.accountId,publicAccounts.id)).where(and(eq(publicSessions.tokenHash,tokenHash),isNull(publicSessions.revokedAt),gt(publicSessions.expiresAt,new Date().toISOString()))).limit(1);if(!rows.length||rows[0].status!=='ACTIVE')return null;const identities=await db.select().from(publicIdentities).where(eq(publicIdentities.accountId,rows[0].accountId));return{...rows[0],identities};}

export async function getPublicActor(request:NextRequest){return resolvePublicActor(request.cookies.get(PUBLIC_SESSION_COOKIE)?.value);}
export async function getCurrentPublicActor(){const store=await cookies();return resolvePublicActor(store.get(PUBLIC_SESSION_COOKIE)?.value);}
