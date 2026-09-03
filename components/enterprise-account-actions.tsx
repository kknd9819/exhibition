'use client';

import { useRouter } from 'next/navigation';

export function EnterpriseAccountActions() {
  const router = useRouter();

  async function logout() {
    await fetch('/api/enterprise-auth/logout', { method: 'POST' });
    router.push('/company-workspace/login');
    router.refresh();
  }

  return <button className="enterprise-logout" onClick={logout}>退出企业账号</button>;
}
