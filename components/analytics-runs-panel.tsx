'use client';

import { useState } from 'react';

type MetricDefinition = { code: string; name: string; description: string; unit: string; version: string; ownerName: string; calculationMode: string };
type SnapshotRun = { id: string; status: string; snapshotCount: number; errorMessage: string | null; requestedByName: string; startedAt: string; completedAt: string | null };
type Snapshot = { metricCode: string; valueNumber: string; numerator: number | null; denominator: number | null; definitionVersion: string; periodStart: string; periodEnd: string; calculatedAt: string };
type ReportRun = { id: string; status: string; rowCount: number; fileName: string | null; sha256: string | null; requestedByName: string; startedAt: string; completedAt: string | null; errorMessage: string | null };

function time(value: string | null) { return value ? new Date(value).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replaceAll('/', '-') : '—'; }

export function AnalyticsRunsPanel({ year, eventId, canRun, definitions, snapshotRuns, latestSnapshots, reportRuns }: { year: number; eventId: string | null; canRun: boolean; definitions: MetricDefinition[]; snapshotRuns: SnapshotRun[]; latestSnapshots: Snapshot[]; reportRuns: ReportRun[] }) {
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('复杂指标按小时固化；失败运行留痕，并继续展示最近一次成功快照。');
  async function run(kind: 'snapshot' | 'snapshot-failure' | 'report') {
    setBusy(kind);
    const snapshot = kind.startsWith('snapshot');
    const response = await fetch(snapshot ? '/api/analytics/snapshots/run' : '/api/analytics/reports/runs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ year, eventId, simulateFailure: kind === 'snapshot-failure' }) });
    const result = await response.json() as { error?: string; snapshotCount?: number; rowCount?: number };
    setBusy('');
    if (!response.ok && response.status !== 422) return setMessage(result.error ?? '运行失败');
    if (kind === 'snapshot-failure') setMessage(`${result.error ?? '模拟失败已记录'}；页面将保留上一成功快照。`);
    else if (snapshot) setMessage(`已生成${result.snapshotCount}项小时快照。`);
    else setMessage(`运营事实报表已生成，共${result.rowCount}行。`);
    setTimeout(() => location.reload(), 650);
  }
  const definitionMap = new Map(definitions.map((item) => [item.code, item]));
  return <section className="analytics-run-section">
    <header><div><span>METRIC SNAPSHOT & REPORT RUN</span><h2>指标快照与报表运行中心</h2><p>指标口径有版本，计算运行有成功/失败记录，报表结果可校验并下载。</p></div><div className="analytics-run-actions"><button className="primary-button" disabled={!canRun || Boolean(busy)} onClick={() => run('snapshot')}>{busy === 'snapshot' ? '生成中…' : '生成小时快照'}</button><button className="ghost-button" disabled={!canRun || Boolean(busy)} onClick={() => run('snapshot-failure')}>模拟本次失败</button><button className="ghost-button" disabled={!canRun || Boolean(busy)} onClick={() => run('report')}>{busy === 'report' ? '运行中…' : '运行运营报表'}</button></div></header>
    <p className="data-asset-message" role="status">{canRun ? message : '当前账号可查看统计，但没有此范围的运行权限。'}</p>
    <div className="analytics-run-grid">
      <article className="analytics-snapshot-card"><div className="panel-head"><div><span className="eyebrow">LATEST SUCCESS</span><h3>最近成功小时快照</h3></div><span className="soft-pill">{latestSnapshots[0] ? time(latestSnapshots[0].calculatedAt) : '尚未生成'}</span></div>{latestSnapshots.length ? <div className="snapshot-metrics">{latestSnapshots.map((item) => { const definition = definitionMap.get(item.metricCode); const value = definition?.unit === '%' ? `${(Number(item.valueNumber) * 100).toFixed(1)}%` : `${item.valueNumber}${definition?.unit ?? ''}`; return <div key={item.metricCode}><span>{definition?.name ?? item.metricCode}</span><strong>{value}</strong><small>口径v{item.definitionVersion}{item.denominator !== null ? ` · ${item.numerator}/${item.denominator}` : ''}</small></div>; })}</div> : <div className="empty-state">尚无成功快照。点击“生成小时快照”建立第一份基线。</div>}</article>
      <article className="analytics-definition-card"><div className="panel-head"><div><span className="eyebrow">METRIC CATALOG</span><h3>指标定义 v1.0</h3></div><span className="soft-pill">{definitions.length}项</span></div><div className="metric-definition-list">{definitions.map((item) => <details key={item.code}><summary><span>{item.name}</span><code>{item.code}</code></summary><p>{item.description}</p><small>{item.ownerName} · {item.calculationMode} · 单位 {item.unit}</small></details>)}</div></article>
    </div>
    <div className="analytics-history-grid">
      <article><h3>快照运行记录</h3>{snapshotRuns.length ? snapshotRuns.map((item) => <div className="analytics-run-row" key={item.id}><span className={`state-pill ${item.status.toLowerCase()}`}>{item.status}</span><div><strong>{item.snapshotCount}项 · {item.requestedByName}</strong><small>{time(item.startedAt)}{item.errorMessage ? ` · ${item.errorMessage}` : ''}</small></div></div>) : <div className="empty-state">暂无运行记录</div>}</article>
      <article><h3>运营事实报表</h3>{reportRuns.length ? reportRuns.map((item) => <div className="analytics-run-row" key={item.id}><span className={`state-pill ${item.status.toLowerCase()}`}>{item.status}</span><div><strong>{item.rowCount}行 · {item.requestedByName}</strong><small>{time(item.startedAt)}{item.sha256 ? ` · SHA ${item.sha256.slice(0, 12)}…` : item.errorMessage ? ` · ${item.errorMessage}` : ''}</small></div>{item.status === 'COMPLETED' ? <a href={`/api/analytics/reports/runs/${item.id}/download`}>下载CSV</a> : null}</div>) : <div className="empty-state">暂无报表运行记录</div>}</article>
    </div>
  </section>;
}
