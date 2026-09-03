'use client';

import { useState } from 'react';
import type { RegistrationField, RegistrationFormSchema } from '@/lib/registration-types';

type Values = Record<string, string | string[]>;

export function PublicProfileEditor({ recordId, form, initialValues, allowEdit, recheckEnabled, pendingVersion }: { recordId: string; form: RegistrationFormSchema; initialValues: Values; allowEdit: boolean; recheckEnabled: boolean; pendingVersion: null | { versionNo: number; changedLabels: string[] } }) {
  const [values, setValues] = useState(initialValues);
  const [message, setMessage] = useState(pendingVersion ? `V${pendingVersion.versionNo} 正在审核：${pendingVersion.changedLabels.join('、')}` : '');
  const [submitting, setSubmitting] = useState(false);

  function setValue(field: RegistrationField, value: string, checked?: boolean) {
    if (field.type === 'multiple') {
      const current = Array.isArray(values[field.id]) ? values[field.id] as string[] : [];
      setValues(state => ({ ...state, [field.id]: checked ? [...current, value] : current.filter(item => item !== value) }));
    } else setValues(state => ({ ...state, [field.id]: value }));
  }

  async function save() {
    setSubmitting(true); setMessage('正在保存资料…');
    const response = await fetch(`/api/public-registrations/records/${recordId}/profile`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ values }) });
    const result = await response.json() as { error?: string; status?: string; versionNo?: number };
    setSubmitting(false);
    if (!response.ok) return setMessage(result.error ?? '资料保存失败');
    setMessage(result.status === 'PENDING' ? `V${result.versionNo} 已提交审核；当前有效资料继续使用。` : `V${result.versionNo} 已应用。`);
    window.setTimeout(() => window.location.reload(), 700);
  }

  if (!allowEdit) return <p className="profile-edit-disabled">该报名活动已关闭用户资料修改。</p>;
  return <details className="public-profile-editor">
    <summary>查看或修改报名资料</summary>
    <div className="registration-mode-note"><strong>{recheckEnabled ? '关键资料修改需审核' : '资料修改后自动应用'}</strong><span>{recheckEnabled ? '审核通过前保留当前有效版本，签到状态不受影响。' : '工作人员已关闭资料复审开关。'}</span></div>
    {pendingVersion ? <div className="profile-version-notice">待审核版本 V{pendingVersion.versionNo}：{pendingVersion.changedLabels.join('、')}</div> : null}
    <div className="public-form-grid">{form.fields.map(field => <ProfileField key={field.id} field={field} value={values[field.id]} onChange={(value, checked) => setValue(field, value, checked)} disabled={Boolean(pendingVersion)} />)}</div>
    <button type="button" className="portal-primary" disabled={submitting || Boolean(pendingVersion)} onClick={save}>{submitting ? '正在保存…' : pendingVersion ? '请等待审核' : '保存修改'}</button>
    <p className="public-form-message" role="status">{message}</p>
  </details>;
}

function ProfileField({ field, value, onChange, disabled }: { field: RegistrationField; value?: string | string[]; onChange: (value: string, checked?: boolean) => void; disabled: boolean }) {
  if (field.type === 'single') return <fieldset className="public-field wide" disabled={disabled}><legend>{field.required ? '* ' : ''}{field.label}</legend>{field.options?.map(option => <label key={option}><input type="radio" name={`${field.id}-edit`} checked={value === option} onChange={() => onChange(option)} /> {option}</label>)}</fieldset>;
  if (field.type === 'multiple') return <fieldset className="public-field wide" disabled={disabled}><legend>{field.required ? '* ' : ''}{field.label}</legend>{field.options?.map(option => <label key={option}><input type="checkbox" checked={Array.isArray(value) && value.includes(option)} onChange={event => onChange(option, event.target.checked)} /> {option}</label>)}</fieldset>;
  if (field.type === 'textarea') return <label className="public-field wide"><span>{field.required ? '* ' : ''}{field.label}</span><textarea disabled={disabled} required={field.required} value={String(value ?? '')} onChange={event => onChange(event.target.value)} /></label>;
  if (field.type === 'country') return <label className="public-field"><span>{field.required ? '* ' : ''}{field.label}</span><select disabled={disabled} required={field.required} value={String(value ?? '')} onChange={event => onChange(event.target.value)}><option value="">请选择</option><option>中国</option><option>摩洛哥</option><option>法国</option><option>其他</option></select></label>;
  return <label className="public-field"><span>{field.required ? '* ' : ''}{field.label}</span><input disabled={disabled} type={field.type === 'email' ? 'email' : field.type === 'mobile' ? 'tel' : 'text'} required={field.required} value={String(value ?? '')} onChange={event => onChange(event.target.value)} /></label>;
}
