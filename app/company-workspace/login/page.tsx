import Link from 'next/link';
import { EnterpriseLoginPanel } from '@/components/enterprise-login-panel';

export default async function EnterpriseLoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo: requested } = await searchParams; const returnTo = requested?.startsWith('/company-workspace') ? requested : '/company-workspace';
  return <main className="enterprise-login-page"><section className="enterprise-login-brand"><span className="brand-mark">企</span><strong>会展中枢 · 企业服务</strong><h2>企业参展资料、产品与询盘</h2><p>一期以PC端为主。手机端提供只读提示，后续根据企业反馈扩展移动编辑能力。</p><Link href="/exhibition/2026-morocco">查看展会公开门户 →</Link></section><EnterpriseLoginPanel returnTo={returnTo}/></main>;
}
