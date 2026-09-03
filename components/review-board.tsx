'use client';

import { useState } from 'react';

type Task = { id: string; module: string; title: string; submitterName: string; submittedAt: string; status: string; reviewerName: string | null };

export function ReviewBoard({ initialTasks, actorName }: { initialTasks: Task[]; actorName: string }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [message, setMessage] = useState(`请选择一项任务处理；当前登录员工为“${actorName}”。`);
  async function decide(id: string, decision: 'APPROVED' | 'REJECTED') {
    const response = await fetch(`/api/reviews/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ decision, reason: decision === 'REJECTED' ? '请补充信息后重新提交' : undefined }) });
    const result = await response.json() as { error?: string; status?: string; reviewerName?: string };
    if (!response.ok) return setMessage(result.error ?? '处理失败');
    setTasks((current) => current.map((task) => task.id === id ? { ...task, status: result.status ?? decision, reviewerName: result.reviewerName ?? actorName } : task));
    setMessage(decision === 'APPROVED' ? '审核已通过，结论和审计记录已写入 MySQL。' : '任务已退回，线上继续显示上一已发布版本。');
  }
  return <><div className="review-message" role="status">{message}</div><div className="review-worklist">{tasks.map((task) => <article className="review-row" key={task.id}><div className="review-icon">{task.module.slice(0,1)}</div><div><span>{task.module} · {task.submittedAt.slice(0,16).replace('T',' ')}</span><h2>{task.title}</h2><p>提交人：{task.submitterName}　审核人：{task.reviewerName ?? '待领取'}</p></div><span className={`state-pill ${task.status.toLowerCase()}`}>{task.status === 'PENDING' ? '待审核' : task.status === 'APPROVED' ? '已通过' : '已退回'}</span><div className="review-actions"><button onClick={() => decide(task.id, 'REJECTED')} disabled={task.status !== 'PENDING'}>退回</button><button className="primary-button" onClick={() => decide(task.id, 'APPROVED')} disabled={task.status !== 'PENDING'}>审核通过</button></div></article>)}</div></>;
}
