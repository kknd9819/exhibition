import type { RegistrationFormSchema } from '@/lib/registration-types';

export const DEFAULT_KEY_PROFILE_FIELDS = ['name', 'mobile', 'email', 'organization', 'jobTitle', 'country'];

export function maskProfileValue(fieldId: string, raw: string) {
  const value = raw.trim();
  if (fieldId === 'mobile') {
    if (value.includes('*')) return value;
    if (value.length <= 7) return `${value.slice(0, 2)}***${value.slice(-2)}`;
    return `${value.slice(0, 3)}****${value.slice(-4)}`;
  }
  if (fieldId === 'email') {
    if (value.includes('*')) return value;
    const [name, domain] = value.split('@');
    return domain ? `${name.slice(0, 2)}***@${domain}` : '';
  }
  return value;
}

export function sanitizeProfileValues(values: Record<string, string | string[]>, form: RegistrationFormSchema) {
  const safe: Record<string, string | string[]> = {};
  for (const field of form.fields) {
    const raw = values[field.id];
    safe[field.id] = Array.isArray(raw) ? raw.map(item => item.trim()).filter(Boolean) : maskProfileValue(field.id, String(raw ?? ''));
  }
  return safe;
}

export function validateProfileValues(values: Record<string, string | string[]>, form: RegistrationFormSchema) {
  const missing = form.fields.filter(field => field.required && (!values[field.id] || (Array.isArray(values[field.id]) && values[field.id].length === 0)));
  if (missing.length) return `请填写：${missing.map(field => field.label).join('、')}`;
  const email = String(values.email ?? '');
  if (email && !email.includes('*') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '电子邮箱格式不正确';
  return null;
}

export function changedProfileFields(current: Record<string, string | string[]>, next: Record<string, string | string[]>) {
  return Object.keys(next).filter(key => JSON.stringify(current[key] ?? '') !== JSON.stringify(next[key] ?? ''));
}

export function profileRecordPatch(values: Record<string, string | string[]>) {
  return {
    personName: String(values.name ?? '').trim(),
    mobileMasked: String(values.mobile ?? '').trim(),
    emailMasked: String(values.email ?? '').trim(),
    country: String(values.country ?? '').trim(),
    organization: String(values.organization ?? '').trim(),
    jobTitle: String(values.jobTitle ?? '').trim(),
    answersJson: JSON.stringify(values),
  };
}
