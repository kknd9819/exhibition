'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginPanel({ currentEmployeeName, returnTo = '/' }: { currentEmployeeName?: string; returnTo?: string }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('15000000001');
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [alphaCode, setAlphaCode] = useState('');
  const [message, setMessage] = useState('可使用种子员工手机号 15000000001—15000000004，或对应邮箱。');
  async function send() { const response = await fetch('/api/auth/otp/send', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ identifier }) }); const result = await response.json() as { error?: string; challengeId?: string; alphaCode?: string; destinationMasked?: string }; if (!response.ok) return setMessage(result.error ?? '发送失败'); setChallengeId(result.challengeId ?? ''); setAlphaCode(result.alphaCode ?? ''); setCode(result.alphaCode ?? ''); setMessage(`验证码已发送到 ${result.destinationMasked}。本地测试码已自动填入。`); }
  async function verify(event: React.FormEvent) { event.preventDefault(); const response = await fetch('/api/auth/otp/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ challengeId, code }) }); const result = await response.json() as { error?: string; account?: { name: string } }; if (!response.ok) return setMessage(result.error ?? '登录失败'); setMessage(`${result.account?.name ?? '员工'}登录成功，正在进入原页面。`); setTimeout(() => { router.push(returnTo); router.refresh(); }, 350); }
  async function logout() { const response = await fetch('/api/auth/logout', { method: 'POST' }); if (!response.ok) return setMessage('退出失败，请重试'); setMessage('员工会话已退出。'); router.refresh(); }
  return <form className="login-panel" onSubmit={verify}><span className="eyebrow">LOCAL ALPHA ACCESS</span><h2>登录集团管理后台</h2>{currentEmployeeName ? <div className="alpha-code"><span>当前员工会话</span><strong>{currentEmployeeName}</strong><button type="button" onClick={logout}>退出当前员工会话</button></div> : null}<label>手机号或邮箱<input value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="手机号 / 邮箱"/></label><button type="button" onClick={send}>获取验证码</button>{challengeId ? <><label>6位验证码<input inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)}/></label><button className="primary-button" type="submit">验证并登录</button></> : null}{alphaCode ? <div className="alpha-code"><span>本地测试验证码</span><strong>{alphaCode}</strong></div> : null}<p role="status">{message}</p></form>;
}
