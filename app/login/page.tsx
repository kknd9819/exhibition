import Link from 'next/link';
import { LoginPanel } from '@/components/login-panel';
import { getCurrentSessionActor } from '@/lib/auth';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const actor = await getCurrentSessionActor();
  const { returnTo: requested } = await searchParams;
  const returnTo = requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/';
  return <main className="login-page"><section className="login-brand"><span>会</span><div><strong>会展中枢 Alpha</strong><small>GROUP EXHIBITION OPERATIONS</small></div><h1>员工验证码登录</h1><p>一期支持中国手机号和邮箱验证码。当前本地环境会直接展示测试验证码，后续替换为集团选定的短信与邮件服务商。</p>{actor ? <Link href={returnTo}>← 返回工作台</Link> : null}</section><LoginPanel currentEmployeeName={actor?.name} returnTo={returnTo}/></main>;
}
