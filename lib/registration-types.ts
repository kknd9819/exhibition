export type RegistrationFieldType = 'text' | 'textarea' | 'mobile' | 'email' | 'country' | 'single' | 'multiple' | 'attachment';

export type RegistrationField = {
  id: string;
  type: RegistrationFieldType;
  label: string;
  required: boolean;
  system?: boolean;
  description?: string;
  options?: string[];
};

export type RegistrationFormSchema = { fields: RegistrationField[] };

export const DEFAULT_REGISTRATION_FORM: RegistrationFormSchema = {
  fields: [
    { id: 'name', type: 'text', label: '姓名', required: true, system: true },
    { id: 'mobile', type: 'mobile', label: '手机号码', required: true, system: true },
    { id: 'email', type: 'email', label: '电子邮箱', required: true, system: true },
    { id: 'organization', type: 'text', label: '公司名称', required: true, system: true },
    { id: 'jobTitle', type: 'text', label: '职位', required: true, system: true },
    { id: 'country', type: 'country', label: '国家/地区', required: true, system: true },
  ],
};

export function parseRegistrationForm(value: string): RegistrationFormSchema {
  try {
    const parsed = JSON.parse(value) as RegistrationFormSchema;
    if (Array.isArray(parsed.fields) && parsed.fields.length) return parsed;
  } catch {
    // Legacy or incomplete Alpha data falls back to the stable baseline form.
  }
  return structuredClone(DEFAULT_REGISTRATION_FORM);
}
