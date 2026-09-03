'use client';

import { FormEvent, useState } from 'react';

export function PublicInquiryForm({ exhibitors }: { exhibitors: Array<{ id: string; name: string }> }) {
  const [form, setForm] = useState({ eventExhibitorId: exhibitors[0]?.id ?? '', customerName: '', contact: '', content: '' }); const [message, setMessage] = useState('');
  async function submit(event: FormEvent) { event.preventDefault(); const response = await fetch('/api/inquiries', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) }); const result = await response.json() as { error?: string; id?: string }; if (!response.ok) return setMessage(result.error ?? '询盘提交失败'); setMessage(`询盘已提交，编号：${result.id}`); setForm((current) => ({ ...current, customerName: '', contact: '', content: '' })); }
  return <form className="public-inquiry-form" onSubmit={submit}><h2>联系参展企业</h2><p>询盘将进入目标企业工作台和后台，由企业在线下联系反馈。</p><label>目标企业<select value={form.eventExhibitorId} onChange={(event) => setForm({ ...form, eventExhibitorId: event.target.value })}>{exhibitors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>您的姓名<input required value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })}/></label><label>联系方式<input required value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })}/></label><label>询盘内容<textarea required value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })}/></label><button className="portal-primary" type="submit">提交询盘</button><span role="status">{message}</span></form>;
}
