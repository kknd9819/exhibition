'use client';

import { useState } from 'react';

export type NotificationItem = { id: string; category: string; title: string; body: string; href: string | null; status: string; readAt: string | null; createdAt: string };

export function NotificationCenter({ initialItems, endpointPrefix, compact = false }: { initialItems: NotificationItem[]; endpointPrefix: string; compact?: boolean }) {
  const [items, setItems] = useState(initialItems);
  const [message, setMessage] = useState('审核结论和预约响应会进入站内通知；必要业务通知不受营销退订影响。');
  const unread = items.filter((item) => item.status === 'UNREAD').length;
  async function markRead(id: string) {
    const response = await fetch(`${endpointPrefix}/${id}`, { method: 'PATCH' }); const result = await response.json() as { error?: string; readAt?: string };
    if (!response.ok) return setMessage(result.error ?? '标记已读失败');
    setItems((current) => current.map((item) => item.id === id ? { ...item, status: 'READ', readAt: result.readAt ?? new Date().toISOString() } : item)); setMessage('通知已标记为已读。');
  }
  async function markAll() {
    const response = await fetch(`${endpointPrefix}/read-all`, { method: 'POST' }); const result = await response.json() as { error?: string; readAt?: string };
    if (!response.ok) return setMessage(result.error ?? '全部标记失败');
    setItems((current) => current.map((item) => ({ ...item, status: 'READ', readAt: item.readAt ?? result.readAt ?? new Date().toISOString() }))); setMessage('当前账号的全部通知已标记为已读。');
  }
  return <section className={`notification-center ${compact ? 'compact' : ''}`}><header><div><span>NOTIFICATIONS</span><h2>通知中心</h2><p>{unread} 条未读 · 共 {items.length} 条</p></div><button onClick={markAll} disabled={!unread}>全部标记已读</button></header><p className="notification-message" role="status">{message}</p><div className="notification-list">{items.length ? items.map((item) => <article className={item.status === 'UNREAD' ? 'unread' : ''} key={item.id}><div><span>{item.category}</span><h3>{item.title}</h3><p>{item.body}</p><small>{new Date(item.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}</small></div><div>{item.status === 'UNREAD' ? <button onClick={() => markRead(item.id)}>标记已读</button> : <span>已读</span>}{item.href ? <a href={item.href}>查看详情 →</a> : null}</div></article>) : <div className="empty-state">暂无通知。报名、资料、产品、供需和预约状态变化后会在这里出现。</div>}</div></section>;
}
