import Link from 'next/link';
import { PublicLoginPanel } from '@/components/public-login-panel';
import { getDb } from '@/db';
import { events } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function PublicLoginPage({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{returnTo?:string}>}){const{slug}=await params;const{ returnTo:requested}=await searchParams;const[event]=await getDb().select().from(events).where(eq(events.slug,slug)).limit(1);if(!event)return <main className="portal-unavailable"><h1>展会不存在</h1></main>;const returnTo=requested?.startsWith(`/exhibition/${slug}`)?requested:`/exhibition/${slug}/me`;return <main className="public-account-page"><header><Link href={`/exhibition/${slug}`}>← 返回展会首页</Link><strong>{event.shortName}</strong></header><PublicLoginPanel eventSlug={slug} returnTo={returnTo}/></main>}
