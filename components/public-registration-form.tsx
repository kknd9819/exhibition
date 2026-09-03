'use client';

import { FormEvent, useState } from 'react';
import type { RegistrationField, RegistrationFormSchema } from '@/lib/registration-types';

export function PublicRegistrationForm({ activityId, form, reviewMode, successMessage }: { activityId: string; form: RegistrationFormSchema; reviewMode: string; successMessage: string }) {
  const [values, setValues] = useState<Record<string, string | string[]>>({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState<{ recordId: string; status: string } | null>(null);

  function setValue(field: RegistrationField, value: string, checked?: boolean) {
    if (field.type === 'multiple') {
      const current = Array.isArray(values[field.id]) ? values[field.id] as string[] : [];
      setValues((state) => ({ ...state, [field.id]: checked ? [...current, value] : current.filter((item) => item !== value) }));
    } else setValues((state) => ({ ...state, [field.id]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSubmitting(true); setMessage('正在提交报名…');
    const response = await fetch(`/api/registrations/activities/${activityId}/records`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ values, channel: '展会门户' }) });
    const result = await response.json() as { error?: string; recordId?: string; status?: string; message?: string };
    setSubmitting(false);
    if (!response.ok) return setMessage(result.error ?? '报名提交失败');
    setCompleted({ recordId: result.recordId!, status: result.status! });
    setMessage(result.message ?? successMessage);
  }

  if (completed) return <section className="public-registration-result"><span>✓</span><h2>{completed.status === 'APPROVED' ? '报名成功' : '报名已提交审核'}</h2><p>{message}</p><small>报名编号：{completed.recordId}</small><a href="../..">返回展会主页</a></section>;
  return <form className="public-registration-form" onSubmit={submit}>
    <div className="registration-mode-note"><strong>{reviewMode === 'STAFF_REVIEW' ? '工作人员审核' : '提交后自动通过'}</strong><span>提交后生成独立报名记录并保留当前表单版本。</span></div>
    <div className="public-form-grid">{form.fields.map((field) => <PublicField key={field.id} field={field} value={values[field.id]} onChange={(value, checked) => setValue(field, value, checked)} />)}</div>
    <div className="public-form-consent"><label><input type="checkbox" required /> 我已阅读并同意本活动隐私说明，提交资料仅用于会展组织与服务。</label></div>
    <button className="portal-primary" type="submit" disabled={submitting}>{submitting ? '正在提交…' : '提交报名'}</button>
    <p className="public-form-message" role="status">{message}</p>
  </form>;
}

function PublicField({ field, value, onChange }: { field: RegistrationField; value?: string | string[]; onChange: (value: string, checked?: boolean) => void }) {
  if (field.type === 'single') return <fieldset className="public-field wide"><legend>{field.required ? '* ' : ''}{field.label}</legend>{field.options?.map((option) => <label key={option}><input type="radio" name={field.id} required={field.required} checked={value === option} onChange={() => onChange(option)} /> {option}</label>)}</fieldset>;
  if (field.type === 'multiple') return <fieldset className="public-field wide"><legend>{field.required ? '* ' : ''}{field.label}</legend>{field.options?.map((option) => <label key={option}><input type="checkbox" checked={Array.isArray(value) && value.includes(option)} onChange={(event) => onChange(option, event.target.checked)} /> {option}</label>)}</fieldset>;
  if (field.type === 'textarea') return <label className="public-field wide"><span>{field.required ? '* ' : ''}{field.label}</span><textarea required={field.required} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} /></label>;
  if (field.type === 'country') return <label className="public-field"><span>{field.required ? '* ' : ''}{field.label}</span><select required={field.required} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)}><option value="">请选择</option><option>中国</option><option>摩洛哥</option><option>法国</option><option>其他</option></select></label>;
  if (field.type === 'attachment') return <label className="public-field wide"><span>{field.required ? '* ' : ''}{field.label}</span><input type="text" required={field.required} placeholder="Alpha阶段填写已准备文件名，素材上传切片接入后替换" value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} /></label>;
  return <label className="public-field"><span>{field.required ? '* ' : ''}{field.label}</span><input type={field.type === 'email' ? 'email' : field.type === 'mobile' ? 'tel' : 'text'} required={field.required} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} /></label>;
}
