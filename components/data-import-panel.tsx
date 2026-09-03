'use client';

import { useState } from 'react';

type ImportJob = { id: string; sourceFileName: string; sourceSha256: string; status: string; rowCount: number; validCount: number; errorCount: number; requestedByName: string; validatedAt: string; committedAt: string | null; committedByName: string | null };
type ImportError = { rowNumber: number; field: string; code: string; message: string; value: string };
const statusText: Record<string, string> = { VALIDATED: '预检查通过', INVALID: '整批未通过', IMPORTED: '已原子导入' };

export function DataImportPanel({ initialJobs }: { initialJobs: ImportJob[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('请先下载系统模板。上传后会检查全部行，任何错误都会阻止整批写入。');
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [busy, setBusy] = useState(false);
  async function validate(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return setMessage('请选择.xlsx工作簿');
    setBusy(true); setErrors([]);
    const body = new FormData(); body.append('file', file);
    const response = await fetch('/api/data-assets/imports', { method: 'POST', body });
    const result = await response.json() as { error?: string; status?: string; rowCount?: number; errorCount?: number; errors?: ImportError[] };
    setBusy(false);
    if (!response.ok && response.status !== 422) return setMessage(result.error ?? '预检查失败');
    setErrors(result.errors ?? []);
    if (result.status === 'INVALID') setMessage(`发现${result.errorCount}项错误，${result.rowCount}行数据均未导入。请下载错误明细、修正原文件后重新上传。`);
    else setMessage(`全量预检查通过：${result.rowCount}行。请核对任务后点击“确认整批导入”。`);
    setTimeout(() => location.reload(), 900);
  }
  async function commit(id: string) {
    setBusy(true);
    const response = await fetch(`/api/data-assets/imports/${id}/commit`, { method: 'POST' });
    const result = await response.json() as { error?: string; importedCount?: number; reviewTaskCount?: number };
    setBusy(false);
    if (!response.ok) return setMessage(result.error ?? '导入失败');
    setMessage(`已原子导入${result.importedCount}家企业，并生成${result.reviewTaskCount}个独立审核任务。`);
    setTimeout(() => location.reload(), 700);
  }
  return <section className="data-import-section">
    <header><div><span>ATOMIC EXCEL IMPORT</span><h2>企业及本届参展资料批量导入</h2><p>模板下载、全量预检查、错误明细、修正后重传、确认导入构成完整闭环。</p></div><a href="/templates/enterprise-exhibitor-import-template.xlsx" download>下载Excel模板</a></header>
    <p className="data-asset-message" role="status">{message}</p>
    <div className="data-import-layout">
      <form className="data-import-upload" onSubmit={validate}><label>选择Excel文件<input aria-label="选择Excel文件" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => setFile(event.target.files?.[0] ?? null)}/></label><small>仅支持系统.xlsx模板，单文件2MB以内，Alpha单批最多50行。</small><button className="primary-button" disabled={!file || busy}>{busy ? '处理中…' : '上传并全量预检查'}</button>{errors.length ? <div className="import-error-preview"><strong>前{errors.length}项错误</strong>{errors.map((item, index) => <p key={`${item.rowNumber}-${item.field}-${index}`}>第{item.rowNumber || '-'}行 · {item.field} · {item.message}</p>)}</div> : null}</form>
      <div className="data-import-jobs">{initialJobs.length ? initialJobs.map((job) => <article key={job.id}><div><span>{job.sourceFileName}</span><h3>{statusText[job.status] ?? job.status}</h3><p>{job.requestedByName} · {job.validatedAt.slice(0, 16).replace('T', ' ')} · SHA {job.sourceSha256.slice(0, 12)}…</p></div><strong className={`state-pill ${job.status.toLowerCase()}`}>{job.status === 'INVALID' ? `${job.errorCount}项错误` : `${job.rowCount}行`}</strong><dl><div><dt>读取</dt><dd>{job.rowCount}</dd></div><div><dt>有效</dt><dd>{job.validCount}</dd></div><div><dt>错误</dt><dd>{job.errorCount}</dd></div><div><dt>提交人</dt><dd>{job.committedByName ?? '未提交'}</dd></div></dl><footer>{job.errorCount ? <a href={`/api/data-assets/imports/${job.id}/errors`}>下载错误明细CSV</a> : <span>{job.committedAt ? `提交于 ${job.committedAt.slice(0, 16).replace('T', ' ')}` : '等待确认导入'}</span>}{job.status === 'VALIDATED' ? <button className="primary-button" disabled={busy} onClick={() => commit(job.id)}>确认整批导入</button> : null}</footer></article>) : <section className="planned-panel"><span>NO IMPORT</span><h2>暂无导入任务</h2><p>先下载模板并上传，原始业务表不会在预检查阶段发生变化。</p></section>}</div>
    </div>
  </section>;
}
