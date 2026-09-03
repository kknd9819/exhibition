'use client';

import { useMemo, useState } from 'react';
import type { RegistrationField, RegistrationFieldType, RegistrationFormSchema } from '@/lib/registration-types';

type Activity = {
  id: string; name: string; description: string; timezone: string;
  startAt: string | null; endAt: string | null; registrationStartAt: string | null; registrationEndAt: string | null;
  quota: number; locationName: string; reviewMode: string; allowEdit: boolean; profileRecheckEnabled: boolean; showInPortal: boolean; isPrivate: boolean;
  formVersion: number; successMessage: string; status: string; form: RegistrationFormSchema;
};

type RecordItem = {
  id: string; personName: string; mobileMasked: string; emailMasked: string; country: string; organization: string; jobTitle: string;
  formVersion: number; answersJson: string; status: string; firstChannel: string; submittedAt: string; checkedInAt: string | null;
};

const tabs = [['records', '名单管理'], ['form', '报名表单'], ['settings', '高级设置'], ['checkin', '现场签到'], ['report', '数据报告']] as const;
const fieldLibrary: Array<{ type: RegistrationFieldType; label: string }> = [
  { type: 'text', label: '单行输入' }, { type: 'textarea', label: '多行输入' }, { type: 'single', label: '单选题' },
  { type: 'multiple', label: '多选题' }, { type: 'country', label: '国家/地区' }, { type: 'attachment', label: '附件上传' },
];
const statusLabel: Record<string, string> = { PENDING: '待审核', APPROVED: '已通过', REJECTED: '已退回', CHECKED_IN: '已签到' };

export function RegistrationWorkspace({ activity: initialActivity, initialRecords }: { activity: Activity; initialRecords: RecordItem[] }) {
  const [tab, setTab] = useState<(typeof tabs)[number][0]>('records');
  const [activity, setActivity] = useState(initialActivity);
  const [form, setForm] = useState(initialActivity.form);
  const [records, setRecords] = useState(initialRecords);
  const [selectedFieldId, setSelectedFieldId] = useState(initialActivity.form.fields[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('Alpha 数据写入本地数据库，可直接执行审核和签到。');
  const selectedField = form.fields.find((field) => field.id === selectedFieldId);
  const filteredRecords = useMemo(() => records.filter((record) => `${record.personName}${record.organization}${record.mobileMasked}${record.country}`.toLowerCase().includes(query.toLowerCase())), [records, query]);
  const counts = useMemo(() => ({ total: records.length, pending: records.filter((item) => item.status === 'PENDING').length, approved: records.filter((item) => item.status === 'APPROVED').length, checkedIn: records.filter((item) => item.status === 'CHECKED_IN').length }), [records]);

  async function saveActivity(includeForm = false) {
    setMessage(includeForm ? '正在保存表单新版本…' : '正在保存活动设置…');
    const response = await fetch(`/api/registrations/activities/${activity.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...activity, form: includeForm ? form : undefined }) });
    const result = await response.json() as { error?: string; formVersion?: number; formChanged?: boolean };
    if (!response.ok) return setMessage(result.error ?? '保存失败');
    if (result.formVersion) setActivity((current) => ({ ...current, formVersion: result.formVersion! }));
    setMessage(includeForm ? `表单已保存为 V${result.formVersion}${result.formChanged ? '，旧报名继续引用原版本' : '，内容无变化'}` : '活动高级设置已保存。');
  }

  function addField(type: RegistrationFieldType) {
    const id = `field-${crypto.randomUUID()}`;
    const label = fieldLibrary.find((item) => item.type === type)?.label ?? '新字段';
    const field: RegistrationField = { id, type, label, required: false, options: type === 'single' || type === 'multiple' ? ['选项一', '选项二'] : undefined };
    setForm((current) => ({ fields: [...current.fields, field] })); setSelectedFieldId(id); setMessage('表单有修改，点击“保存表单新版本”后持久化。');
  }
  function updateField(updater: (field: RegistrationField) => RegistrationField) { setForm((current) => ({ fields: current.fields.map((field) => field.id === selectedFieldId ? updater(field) : field) })); setMessage('表单有修改，点击“保存表单新版本”后持久化。'); }
  function moveField(index: number, delta: number) { const target = index + delta; if (target < 0 || target >= form.fields.length) return; setForm((current) => { const fields = [...current.fields]; [fields[index], fields[target]] = [fields[target], fields[index]]; return { fields }; }); }
  function removeField() { if (!selectedField || selectedField.system) return setMessage('系统基础字段不能删除。'); setForm((current) => ({ fields: current.fields.filter((field) => field.id !== selectedField.id) })); setSelectedFieldId(form.fields.find((field) => field.id !== selectedField.id)?.id ?? ''); }

  async function actOnRecord(id: string, action: 'APPROVE' | 'REJECT' | 'CHECKIN') {
    const response = await fetch(`/api/registrations/records/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, reason: action === 'REJECT' ? '请核对并补全报名资料' : undefined, scope: 'ACTIVITY', method: 'MANUAL' }) });
    const result = await response.json() as { error?: string; status?: string; checkedInAt?: string };
    if (!response.ok) return setMessage(result.error ?? '处理失败');
    setRecords((current) => current.map((item) => item.id === id ? { ...item, status: result.status ?? item.status, checkedInAt: result.checkedInAt ?? item.checkedInAt } : item));
    setMessage(action === 'CHECKIN' ? '签到成功，重复签到将被拦截。' : action === 'APPROVE' ? '报名已审核通过。' : '报名已退回并记录原因。');
  }

  return <>
    <section className="subnav">{tabs.map(([key, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}</section>
    <section className="module-summary registration-summary">
      <div><span>当前活动</span><strong>{activity.name}</strong><small>{activity.reviewMode === 'STAFF_REVIEW' ? '工作人员审核' : '提交后自动通过'} · 表单 V{activity.formVersion}</small></div>
      <div><span>累计提交</span><strong>{counts.total}</strong><small>本地持久化记录</small></div><div><span>待审核</span><strong>{counts.pending}</strong><small>无处理时限</small></div><div><span>已签到</span><strong>{counts.checkedIn}</strong><small>默认仅签到</small></div>
    </section>
    <div className="review-message" role="status">{message}</div>
    {tab === 'records' ? <RecordsTab records={filteredRecords} query={query} onQuery={setQuery} onAction={actOnRecord} /> : null}
    {tab === 'form' ? <FormTab activity={activity} form={form} selectedField={selectedField} selectedFieldId={selectedFieldId} onSelect={setSelectedFieldId} onAdd={addField} onUpdate={updateField} onMove={moveField} onRemove={removeField} onSave={() => void saveActivity(true)} /> : null}
    {tab === 'settings' ? <SettingsTab activity={activity} onChange={setActivity} onSave={() => void saveActivity(false)} /> : null}
    {tab === 'checkin' ? <CheckinTab records={records} onCheckin={(id) => void actOnRecord(id, 'CHECKIN')} /> : null}
    {tab === 'report' ? <ReportTab records={records} counts={counts} /> : null}
  </>;
}

function RecordsTab({ records, query, onQuery, onAction }: { records: RecordItem[]; query: string; onQuery: (value: string) => void; onAction: (id: string, action: 'APPROVE' | 'REJECT') => void }) {
  return <section className="panel table-panel"><div className="table-toolbar"><div><input aria-label="搜索报名记录" placeholder="搜索姓名、单位、手机号、国家" value={query} onChange={(event) => onQuery(event.target.value)} /></div><span>共 {records.length} 条 · 支持逐条审核</span></div><div className="data-table-wrap"><table className="data-table"><thead><tr><th>报名人</th><th>国家/地区</th><th>单位/职位</th><th>表单版本</th><th>首次来源</th><th>提交时间</th><th>状态</th><th>操作</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td><strong>{record.personName}</strong><small>{record.mobileMasked}<br/>{record.emailMasked}</small></td><td>{record.country}</td><td>{record.organization}<small>{record.jobTitle}</small></td><td>V{record.formVersion}</td><td>{record.firstChannel}</td><td>{record.submittedAt.slice(0, 16).replace('T', ' ')}</td><td><span className={`state-pill ${record.status.toLowerCase()}`}>{statusLabel[record.status] ?? record.status}</span></td><td><div className="row-actions"><button disabled={record.status !== 'PENDING'} onClick={() => onAction(record.id, 'REJECT')}>退回</button><button disabled={record.status !== 'PENDING'} onClick={() => onAction(record.id, 'APPROVE')}>通过</button></div></td></tr>)}</tbody></table></div></section>;
}

function FormTab({ activity, form, selectedField, selectedFieldId, onSelect, onAdd, onUpdate, onMove, onRemove, onSave }: { activity: Activity; form: RegistrationFormSchema; selectedField?: RegistrationField; selectedFieldId: string; onSelect: (id: string) => void; onAdd: (type: RegistrationFieldType) => void; onUpdate: (updater: (field: RegistrationField) => RegistrationField) => void; onMove: (index: number, delta: number) => void; onRemove: () => void; onSave: () => void }) {
  return <section className="registration-form-builder"><aside className="form-library"><h2>字段组件</h2>{fieldLibrary.map((item) => <button key={item.type} onClick={() => onAdd(item.type)}>＋ {item.label}</button>)}<div className="property-tip">系统字段映射人员主档；自定义字段写入报名答案快照。</div></aside><div className="form-canvas"><div className="panel-head"><div><span className="eyebrow">FORM V{activity.formVersion}</span><h2>{activity.name}</h2></div><button className="primary-button" onClick={onSave}>保存表单新版本</button></div>{form.fields.map((field, index) => <button key={field.id} className={`form-field-card ${selectedFieldId === field.id ? 'selected' : ''}`} onClick={() => onSelect(field.id)}><span>{field.required ? '*' : ''} {field.label}</span><small>{field.type}{field.system ? ' · 系统字段' : ''}</small><b onClick={(event) => { event.stopPropagation(); onMove(index, -1); }}>↑</b><b onClick={(event) => { event.stopPropagation(); onMove(index, 1); }}>↓</b></button>)}</div><aside className="form-property"><h2>字段属性</h2>{selectedField ? <><label>字段标题<input value={selectedField.label} onChange={(event) => onUpdate((field) => ({ ...field, label: event.target.value }))} /></label><label className="switch-label"><input type="checkbox" checked={selectedField.required} onChange={(event) => onUpdate((field) => ({ ...field, required: event.target.checked }))} />必填字段</label>{selectedField.options ? <label>选项（每行一个）<textarea value={selectedField.options.join('\n')} onChange={(event) => onUpdate((field) => ({ ...field, options: event.target.value.split('\n').map((item) => item.trim()).filter(Boolean) }))} /></label> : null}<button className="danger-button" disabled={selectedField.system} onClick={onRemove}>删除字段</button></> : <p>请选择字段。</p>}</aside></section>;
}

function SettingsTab({ activity, onChange, onSave }: { activity: Activity; onChange: (activity: Activity) => void; onSave: () => void }) {
  return <section className="panel registration-settings">
    <div className="panel-head"><div><span className="eyebrow">ADVANCED SETTINGS</span><h2>活动与审核规则</h2></div><button className="primary-button" onClick={onSave}>保存设置</button></div>
    <div className="settings-grid">
      <label>活动名称<input value={activity.name} onChange={(event) => onChange({ ...activity, name: event.target.value })} /></label>
      <label>时区<input value={activity.timezone} onChange={(event) => onChange({ ...activity, timezone: event.target.value })} /></label>
      <label>举办地点<input value={activity.locationName} onChange={(event) => onChange({ ...activity, locationName: event.target.value })} /></label>
      <label>名额上限<input type="number" min="1" value={activity.quota} onChange={(event) => onChange({ ...activity, quota: Number(event.target.value) })} /></label>
      <label>审核模式<select value={activity.reviewMode} onChange={(event) => onChange({ ...activity, reviewMode: event.target.value })}><option value="STAFF_REVIEW">工作人员审核</option><option value="AUTO_APPROVE">提交后自动通过</option></select></label>
      <label>活动状态<select value={activity.status} onChange={(event) => onChange({ ...activity, status: event.target.value })}><option value="DRAFT">草稿</option><option value="OPEN">开放报名</option><option value="CLOSED">已关闭</option></select></label>
      <label className="wide">活动说明<textarea value={activity.description} onChange={(event) => onChange({ ...activity, description: event.target.value })} /></label>
      <label className="wide">报名成功提示<textarea value={activity.successMessage} onChange={(event) => onChange({ ...activity, successMessage: event.target.value })} /></label>
      <label className="switch-label"><input type="checkbox" checked={activity.allowEdit} onChange={(event) => onChange({ ...activity, allowEdit: event.target.checked })} />允许用户修改报名资料</label>
      <label className="switch-label"><input type="checkbox" checked={activity.profileRecheckEnabled} onChange={(event) => onChange({ ...activity, profileRecheckEnabled: event.target.checked })} />关键资料修改后重新审核</label>
      <label className="switch-label"><input type="checkbox" checked={activity.showInPortal} onChange={(event) => onChange({ ...activity, showInPortal: event.target.checked })} />显示在公开门户</label>
      <label className="switch-label"><input type="checkbox" checked={activity.isPrivate} onChange={(event) => onChange({ ...activity, isPrivate: event.target.checked })} />私密活动</label>
      <p className="wide section-note">关键资料：姓名、手机、邮箱、单位、职位、国家/地区。开关开启时，新版本审核通过前继续使用当前有效资料。</p>
    </div>
  </section>;
}

function CheckinTab({ records, onCheckin }: { records: RecordItem[]; onCheckin: (id: string) => void }) {
  return <section className="panel"><div className="panel-head"><div><span className="eyebrow">ONSITE CHECK-IN</span><h2>工作人员签到</h2></div><span className="soft-pill">展会级 / 活动级</span></div><p className="section-note">Alpha先提供人工查询签到；二维码与工作人员手机扫码复用同一接口。</p><div className="checkin-list">{records.filter((item) => item.status === 'APPROVED' || item.status === 'CHECKED_IN').map((record) => <article key={record.id}><div><strong>{record.personName}</strong><span>{record.organization} · {record.mobileMasked}</span></div><span className={`state-pill ${record.status.toLowerCase()}`}>{statusLabel[record.status]}</span><button className="primary-button" disabled={record.status === 'CHECKED_IN'} onClick={() => onCheckin(record.id)}>{record.status === 'CHECKED_IN' ? `已签到 ${record.checkedInAt?.slice(11, 16) ?? ''}` : '确认签到'}</button></article>)}</div></section>;
}

function ReportTab({ records, counts }: { records: RecordItem[]; counts: { total: number; pending: number; approved: number; checkedIn: number } }) {
  const channels = records.reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.firstChannel]: (acc[item.firstChannel] ?? 0) + 1 }), {});
  return <section className="content-grid"><article className="panel"><div className="panel-head"><div><span className="eyebrow">FUNNEL</span><h2>报名状态漏斗</h2></div></div><div className="metric-stack"><div><span>累计提交</span><strong>{counts.total}</strong></div><div><span>审核通过</span><strong>{counts.approved + counts.checkedIn}</strong></div><div><span>已签到</span><strong>{counts.checkedIn}</strong></div></div></article><article className="panel"><div className="panel-head"><div><span className="eyebrow">CHANNEL</span><h2>首次来源</h2></div></div><div className="metric-stack">{Object.entries(channels).map(([key, value]) => <div key={key}><span>{key}</span><strong>{value}</strong></div>)}</div></article></section>;
}
