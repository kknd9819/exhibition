'use client';

import { useState } from 'react';

type Dataset = 'PERSON_CONTACTS' | 'ENTERPRISE_CONTACTS';
type FieldOption = { key: string; label: string; sensitive?: boolean };
type ExportItem = { id: string; scope: string; dataset: string; purpose: string; status: string; requestedByName: string; requestedAt: string; reviewedByName: string | null; reviewedAt: string | null; reviewReason: string | null; file: null | { fileName: string; rowCount: number; sha256: string; generatedAt: string; expiresAt: string }; downloadCount: number };
const statusText: Record<string, string> = { PENDING: '待另一员工审核', GENERATED: '文件可下载', REJECTED: '已退回', EXPIRED: '文件已过期' };

export function SensitiveExportPanel({ initialItems, fieldOptions }: { initialItems: ExportItem[]; fieldOptions: Record<Dataset, FieldOption[]> }) {
  const [dataset, setDataset] = useState<Dataset>('PERSON_CONTACTS');
  const [scope, setScope] = useState<'CURRENT_EVENT' | 'GROUP'>('CURRENT_EVENT');
  const [fields, setFields] = useState(fieldOptions.PERSON_CONTACTS.map((item) => item.key));
  const [purpose, setPurpose] = useState('甲方需求核对与现场联络测试');
  const [message, setMessage] = useState('明文手机号、邮箱等敏感字段须提交申请，由另一员工审核后生成24小时有效文件。');
  const [submitting, setSubmitting] = useState(false);
  function changeDataset(value: Dataset) { setDataset(value); setFields(fieldOptions[value].map((item) => item.key)); }
  function toggleField(key: string, checked: boolean) { setFields((current) => checked ? [...new Set([...current, key])] : current.filter((item) => item !== key)); }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSubmitting(true);
    const response = await fetch('/api/data-assets/exports', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ dataset, scope, fields, purpose }) });
    const result = await response.json() as { error?: string };
    setSubmitting(false);
    if (!response.ok) return setMessage(result.error ?? '导出申请提交失败');
    setMessage('申请已进入统一审核中心。请切换到另一名有审核权限的员工处理。');
    setTimeout(() => location.reload(), 650);
  }
  return <section className="sensitive-export-section">
    <header><div><span>CONTROLLED EXPORT</span><h2>敏感数据受控导出</h2><p>脱敏聚合统计继续在数据统计页直接下载；这里处理包含完整联系方式的明细文件。</p></div><a href="/reviews">打开统一审核中心 →</a></header>
    <p className="data-asset-message" role="status">{message}</p>
    <div className="sensitive-export-layout">
      <form onSubmit={submit} className="sensitive-export-form">
        <label>数据集<select value={dataset} onChange={(event) => changeDataset(event.target.value as Dataset)}><option value="PERSON_CONTACTS">人员联系方式</option><option value="ENTERPRISE_CONTACTS">企业联系方式</option></select></label>
        <label>范围<select value={scope} onChange={(event) => setScope(event.target.value as typeof scope)}><option value="CURRENT_EVENT">当前展会</option><option value="GROUP">集团全部展会</option></select></label>
        <fieldset><legend>导出字段</legend>{fieldOptions[dataset].map((item) => <label key={item.key} className={item.sensitive ? 'sensitive-field' : ''}><input type="checkbox" checked={fields.includes(item.key)} onChange={(event) => toggleField(item.key, event.target.checked)}/>{item.label}{item.sensitive ? <small>敏感</small> : null}</label>)}</fieldset>
        <label>导出用途<textarea required minLength={4} value={purpose} onChange={(event) => setPurpose(event.target.value)} /></label>
        <button className="primary-button" disabled={submitting || !fields.length}>{submitting ? '正在提交…' : '提交敏感导出申请'}</button>
      </form>
      <div className="sensitive-export-history">{initialItems.length ? initialItems.map((item) => <article key={item.id}>
        <div><span>{item.scope === 'GROUP' ? '集团范围' : '当前展会'} · {item.dataset === 'PERSON_CONTACTS' ? '人员联系方式' : '企业联系方式'}</span><h3>{item.purpose}</h3><p>申请：{item.requestedByName} · {item.requestedAt.slice(0, 16).replace('T', ' ')}　审核：{item.reviewedByName ?? '待审核'}</p></div>
        <strong className={`state-pill ${item.status.toLowerCase()}`}>{statusText[item.status] ?? item.status}</strong>
        {item.file ? <dl><div><dt>数据行</dt><dd>{item.file.rowCount}</dd></div><div><dt>下载次数</dt><dd>{item.downloadCount}</dd></div><div><dt>有效期至</dt><dd>{item.file.expiresAt.slice(0, 16).replace('T', ' ')}</dd></div><div><dt>SHA-256</dt><dd title={item.file.sha256}>{item.file.sha256.slice(0, 12)}…</dd></div></dl> : <p className="export-waiting">{item.status === 'REJECTED' ? `退回原因：${item.reviewReason ?? '未填写'}` : '审核通过后按当时数据快照生成文件'}</p>}
        {item.status === 'GENERATED' ? <a className="primary-button" href={`/api/data-assets/exports/${item.id}/download`}>下载受控文件</a> : null}
      </article>) : <section className="planned-panel"><span>NO REQUEST</span><h2>暂无敏感导出申请</h2><p>提交后可在此跟踪审核结论、文件有效期和下载次数。</p></section>}</div>
    </div>
  </section>;
}
