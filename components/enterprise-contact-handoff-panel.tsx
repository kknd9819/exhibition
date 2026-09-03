'use client';

import { FormEvent, useMemo, useState } from 'react';

export type EnterpriseAccountGovernance = {
  eventExhibitorId: string; enterpriseName: string; accountId: string; displayName: string; status: string; identities: string[];
  histories: Array<{ id: string; oldIdentityMasked: string | null; newIdentityMasked: string; oldDisplayName: string | null; newDisplayName: string | null; reason: string | null; operatorName: string; verifiedAt: string }>;
};

export function EnterpriseContactHandoffPanel({ accounts, canManage }: { accounts: EnterpriseAccountGovernance[]; canManage: boolean }) {
  const [selectedId, setSelectedId] = useState(accounts[0]?.eventExhibitorId ?? '');
  const selected = useMemo(() => accounts.find((item) => item.eventExhibitorId === selectedId) ?? accounts[0], [accounts, selectedId]);
  const [form, setForm] = useState({ identifier: '', newDisplayName: '', reason: '企业确认更换本集团会展系统账号联系人' });
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('交接完成后仍保留同一个企业账号；原登录身份被替换，全部旧企业会话立即失效。');
  const [busy, setBusy] = useState(false);
  async function send() {
    if (!selected) return;
    setBusy(true);
    const response = await fetch(`/api/exhibitors/${selected.eventExhibitorId}/contact-handoff/challenge`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ identifier: form.identifier }) });
    const result = await response.json() as { error?: string; challengeId?: string; destinationMasked?: string; alphaCode?: string };
    setBusy(false);
    if (!response.ok) return setMessage(result.error ?? '验证码发送失败');
    setChallengeId(result.challengeId ?? ''); setCode(result.alphaCode ?? '');
    setMessage(`验证码已发送至 ${result.destinationMasked}；本地Alpha测试码已自动填入。`);
  }
  async function complete(event: FormEvent) {
    event.preventDefault(); if (!selected) return; setBusy(true);
    const response = await fetch(`/api/exhibitors/${selected.eventExhibitorId}/contact-handoff/complete`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ challengeId, code, newDisplayName: form.newDisplayName, reason: form.reason }) });
    const result = await response.json() as { error?: string; identityMasked?: string };
    setBusy(false);
    if (!response.ok) return setMessage(result.error ?? '联系人交接失败');
    setMessage(`交接完成，新登录身份为 ${result.identityMasked}。旧企业会话已全部撤销。`);
    setTimeout(() => location.reload(), 850);
  }
  if (!canManage) return <section className="planned-panel enterprise-handoff-denied"><span>GROUP CONTROL</span><h2>企业账号联系人交接</h2><p>企业账号跨历届复用，联系人交接会影响全部届次，仅集团管理员可查看身份摘要和执行交接。</p></section>;
  if (!accounts.length) return <section className="planned-panel enterprise-handoff-denied"><span>NO ACCOUNT</span><h2>当前展会暂无可交接企业账号</h2><p>录入企业并建立单一企业账号后，可在此执行验证式联系人交接。</p></section>;
  return <section className="enterprise-handoff-section">
    <header><div><span>ENTERPRISE ACCOUNT GOVERNANCE</span><h2>企业账号联系人交接</h2><p>同一个企业账号继续管理历届展会；新联系方式验证成功后替换旧身份并撤销旧会话。</p></div><strong>仅集团管理员</strong></header>
    <p className="data-asset-message" role="status">{message}</p>
    <div className="enterprise-handoff-layout">
      <form onSubmit={complete} className="enterprise-handoff-form">
        <label>选择本届参展企业<select value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setChallengeId(''); setCode(''); }} disabled={busy}>{accounts.map((item) => <option key={item.eventExhibitorId} value={item.eventExhibitorId}>{item.enterpriseName}</option>)}</select></label>
        <div className="handoff-current"><span>当前联系人</span><strong>{selected.displayName}</strong><small>{selected.identities.join(' / ') || '尚无登录身份'} · 账号 {selected.accountId}</small></div>
        <label>新联系人姓名<input required minLength={2} maxLength={40} value={form.newDisplayName} onChange={(event) => setForm({ ...form, newDisplayName: event.target.value })}/></label>
        <label>新手机号或邮箱<input required value={form.identifier} onChange={(event) => { setForm({ ...form, identifier: event.target.value }); setChallengeId(''); setCode(''); }} placeholder="中国/国际手机号或邮箱"/></label>
        <button type="button" onClick={send} disabled={busy || !form.identifier}>{busy ? '处理中…' : '验证新联系方式'}</button>
        {challengeId ? <label>6位验证码<input required inputMode="numeric" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)}/></label> : null}
        <label>交接原因<textarea required minLength={4} maxLength={200} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })}/></label>
        <button className="primary-button" disabled={busy || !challengeId || code.length !== 6}>确认交接并撤销旧会话</button>
      </form>
      <div className="enterprise-handoff-history"><h3>交接历史</h3>{selected.histories.length ? selected.histories.map((item) => <article key={item.id}><div><strong>{item.oldDisplayName ?? '原联系人'} → {item.newDisplayName ?? '新联系人'}</strong><span>{item.oldIdentityMasked ?? '无'} → {item.newIdentityMasked}</span></div><p>{item.reason ?? '未填写原因'}</p><small>{item.operatorName} · {new Date(item.verifiedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}</small></article>) : <div className="empty-state">暂无交接历史。首次交接完成后会显示身份摘要、操作人、原因和时间。</div>}</div>
    </div>
  </section>;
}
