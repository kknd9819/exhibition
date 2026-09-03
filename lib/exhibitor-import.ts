import { unzipSync } from 'fflate';
import { XMLParser } from 'fast-xml-parser';
import { getDb } from '@/db';
import { enterpriseIdentities, enterprises } from '@/db/schema';
import { normalizeEnterpriseIdentifier } from '@/lib/enterprise-auth';

export const exhibitorImportHeaders = ['企业中文名*', '企业国际名', '国家/地区*', '统一/注册编号', '行业', '联系人姓名', '企业账号手机号/邮箱*', '网站', '地址', '本届参展分类*', '企业简介', '展位号'] as const;
export type ImportField = 'nameZh' | 'nameIntl' | 'country' | 'registrationNo' | 'industry' | 'contactName' | 'accountContact' | 'website' | 'address' | 'category' | 'description' | 'boothNo';
const importFields: ImportField[] = ['nameZh', 'nameIntl', 'country', 'registrationNo', 'industry', 'contactName', 'accountContact', 'website', 'address', 'category', 'description', 'boothNo'];
export type PreparedImportRow = Record<ImportField, string> & { rowNumber: number; identityType: string; identityValue: string; identityMasked: string };
export type ImportError = { rowNumber: number; field: string; code: string; message: string; value: string };

type ParsedCell = { text: string; formula: string };
const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', removeNSPrefix: true, parseTagValue: false, trimValues: false, processEntities: false });
const textDecoder = new TextDecoder();
function asArray<T>(value: T | T[] | undefined): T[] { return value === undefined ? [] : Array.isArray(value) ? value : [value]; }
function xmlText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(xmlText).join('');
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (record.t !== undefined) return xmlText(record.t);
    if (record.r !== undefined) return xmlText(record.r);
    if (record['#text'] !== undefined) return String(record['#text']);
  }
  return '';
}
function attribute(record: Record<string, unknown>, name: string) {
  return String(record[`@_${name}`] ?? Object.entries(record).find(([key]) => key.toLowerCase().endsWith(name.toLowerCase()))?.[1] ?? '');
}
function readXml(files: Record<string, Uint8Array>, path: string) {
  const bytes = files[path];
  if (!bytes) throw new Error(`缺少OpenXML文件：${path}`);
  return xmlParser.parse(textDecoder.decode(bytes)) as Record<string, unknown>;
}
function openXmlCells(bytes: Uint8Array) {
  let expandedBytes = 0;
  const allowed = new Set(['xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/sharedStrings.xml']);
  const files = unzipSync(bytes, { filter: (file) => {
    const wanted = allowed.has(file.name) || /^xl\/worksheets\/sheet\d+\.xml$/i.test(file.name);
    if (!wanted) return false;
    expandedBytes += file.originalSize;
    if (file.originalSize > 5 * 1024 * 1024 || expandedBytes > 10 * 1024 * 1024) throw new Error('工作簿解压后内容过大');
    return true;
  } });
  const workbook = readXml(files, 'xl/workbook.xml');
  const relationships = readXml(files, 'xl/_rels/workbook.xml.rels');
  const sheetRows = asArray((((workbook.workbook as Record<string, unknown>)?.sheets as Record<string, unknown>)?.sheet as Record<string, unknown> | Array<Record<string, unknown>> | undefined));
  const targetSheet = sheetRows.find((sheet) => attribute(sheet, 'name') === '企业参展导入') ?? sheetRows[0];
  if (!targetSheet) throw new Error('工作簿没有工作表');
  const relationshipId = attribute(targetSheet, 'id');
  const relationshipRows = asArray(((relationships.Relationships as Record<string, unknown>)?.Relationship as Record<string, unknown> | Array<Record<string, unknown>> | undefined));
  const relation = relationshipRows.find((item) => attribute(item, 'Id') === relationshipId);
  if (!relation) throw new Error('工作表关系不存在');
  const target = attribute(relation, 'Target').replaceAll('\\', '/').replace(/^\/?xl\//, '').replace(/^\.\//, '');
  if (target.includes('..') || !/^worksheets\/sheet\d+\.xml$/i.test(target)) throw new Error('工作表路径不合法');
  const sharedStringsFile = files['xl/sharedStrings.xml'];
  const sharedStrings = sharedStringsFile ? asArray(((xmlParser.parse(textDecoder.decode(sharedStringsFile)) as Record<string, unknown>).sst as Record<string, unknown>)?.si).map(xmlText) : [];
  const worksheet = readXml(files, `xl/${target}`);
  const rows = asArray(((((worksheet.worksheet as Record<string, unknown>)?.sheetData as Record<string, unknown>)?.row) as Record<string, unknown> | Array<Record<string, unknown>> | undefined));
  const cellMap = new Map<string, ParsedCell>();
  let maxRowNumber = 4;
  for (const row of rows) for (const cell of asArray(row.c as Record<string, unknown> | Array<Record<string, unknown>> | undefined)) {
    const reference = attribute(cell, 'r').toUpperCase();
    if (!reference) continue;
    const rowNumber = Number(reference.match(/\d+$/)?.[0] ?? 0);
    maxRowNumber = Math.max(maxRowNumber, rowNumber);
    const formula = xmlText(cell.f);
    const type = attribute(cell, 't');
    const rawValue = xmlText(cell.v);
    const text = type === 's' ? String(sharedStrings[Number(rawValue)] ?? '') : type === 'inlineStr' ? xmlText(cell.is) : rawValue;
    cellMap.set(reference, { text: text.trim(), formula: formula.trim() });
  }
  return { cellMap, maxRowNumber };
}
function columnName(columnIndex: number) {
  let value = columnIndex + 1; let result = '';
  while (value > 0) { value -= 1; result = String.fromCharCode(65 + (value % 26)) + result; value = Math.floor(value / 26); }
  return result;
}
function readCell(cellMap: Map<string, ParsedCell>, rowIndex: number, columnIndex: number) {
  return cellMap.get(`${columnName(columnIndex)}${rowIndex + 1}`) ?? { text: '', formula: '' };
}

function safeErrorValue(field: ImportField, value: string) {
  if (field !== 'accountContact') return value.slice(0, 120);
  const identity = normalizeEnterpriseIdentifier(value);
  if (identity) return identity.masked;
  if (value.includes('@')) { const [name, domain] = value.split('@'); return `${name.slice(0, 2)}***@${domain ?? ''}`; }
  return value.length > 7 ? `${value.slice(0, 3)}****${value.slice(-4)}` : value;
}

function push(errors: ImportError[], rowNumber: number, field: ImportField | 'FILE', code: string, message: string, value = '') {
  errors.push({ rowNumber, field, code, message, value: field === 'FILE' ? value.slice(0, 120) : safeErrorValue(field, value) });
}

export async function parseExhibitorWorkbook(bytes: Uint8Array) {
  const errors: ImportError[] = [];
  const { cellMap, maxRowNumber: actualRowCount } = openXmlCells(bytes);
  const actualHeaders = exhibitorImportHeaders.map((_, index) => readCell(cellMap, 3, index).text);
  exhibitorImportHeaders.forEach((expected, index) => { if (actualHeaders[index] !== expected) push(errors, 4, 'FILE', 'HEADER_MISMATCH', `第${index + 1}列表头应为“${expected}”`, actualHeaders[index]); });
  const rows: PreparedImportRow[] = [];
  const maxRow = Math.min(actualRowCount, 505);
  for (let rowNumber = 5; rowNumber <= maxRow; rowNumber += 1) {
    const cells = importFields.map((field, index) => ({ field, ...readCell(cellMap, rowNumber - 1, index) }));
    if (cells.every((cell) => !cell.text && !cell.formula)) continue;
    const raw = Object.fromEntries(cells.map((cell) => [cell.field, cell.text])) as Record<ImportField, string>;
    cells.filter((cell) => cell.formula).forEach((cell) => push(errors, rowNumber, cell.field, 'FORMULA_FORBIDDEN', '导入区不允许公式，请粘贴为值', cell.formula));
    const identity = normalizeEnterpriseIdentifier(raw.accountContact);
    const prepared: PreparedImportRow = { rowNumber, ...raw, identityType: identity?.type ?? '', identityValue: identity?.value ?? '', identityMasked: identity?.masked ?? '' };
    rows.push(prepared);
    if (raw.nameZh.length < 2 || raw.nameZh.length > 100) push(errors, rowNumber, 'nameZh', 'REQUIRED_OR_LENGTH', '企业中文名必填，长度2—100字符', raw.nameZh);
    if (!raw.country || raw.country.length > 50) push(errors, rowNumber, 'country', 'REQUIRED_OR_LENGTH', '国家/地区必填，最多50字符', raw.country);
    if (!raw.category || raw.category.length > 80) push(errors, rowNumber, 'category', 'REQUIRED_OR_LENGTH', '本届参展分类必填，最多80字符', raw.category);
    if (!identity) push(errors, rowNumber, 'accountContact', 'INVALID_IDENTITY', '请填写有效中国手机号、+国际手机号或邮箱', raw.accountContact);
    if (raw.website) { try { const url = new URL(raw.website); if (!['http:', 'https:'].includes(url.protocol)) throw new Error('scheme'); } catch { push(errors, rowNumber, 'website', 'INVALID_URL', '网站仅允许完整http://或https://地址', raw.website); } }
    const limits: Partial<Record<ImportField, number>> = { nameIntl: 150, registrationNo: 80, industry: 80, contactName: 50, address: 200, description: 1000, boothNo: 30 };
    Object.entries(limits).forEach(([field, limit]) => { const value = raw[field as ImportField]; if (value.length > limit) push(errors, rowNumber, field as ImportField, 'TOO_LONG', `最多${limit}字符`, value); });
  }
  if (actualRowCount > 505) push(errors, 0, 'FILE', 'TOO_MANY_ROWS', '单批最多500行，请拆分文件', String(actualRowCount - 4));
  if (!rows.length) push(errors, 0, 'FILE', 'NO_DATA', '第5行起没有可导入数据', '');
  if (rows.length > 50) push(errors, 0, 'FILE', 'ALPHA_BATCH_LIMIT', 'Alpha原子导入单批上限为50行', String(rows.length));
  return { rows, errors };
}

export async function validatePreparedImportRows(rows: PreparedImportRow[], existingErrors: ImportError[] = []) {
  const errors = [...existingErrors];
  const contactRows = new Map<string, number>();
  const registrationRows = new Map<string, number>();
  const nameRows = new Map<string, number>();
  for (const row of rows) {
    if (row.identityType && row.identityValue) {
      const key = `${row.identityType}:${row.identityValue}`;
      if (contactRows.has(key)) push(errors, row.rowNumber, 'accountContact', 'DUPLICATE_IN_FILE', `与第${contactRows.get(key)}行联系方式重复`, row.accountContact);
      else contactRows.set(key, row.rowNumber);
    }
    if (row.registrationNo) {
      const key = `${row.country.toLowerCase()}:${row.registrationNo.toLowerCase()}`;
      if (registrationRows.has(key)) push(errors, row.rowNumber, 'registrationNo', 'DUPLICATE_IN_FILE', `与第${registrationRows.get(key)}行注册编号重复`, row.registrationNo);
      else registrationRows.set(key, row.rowNumber);
    }
    const nameKey = `${row.country.toLowerCase()}:${row.nameZh.toLowerCase()}`;
    if (nameRows.has(nameKey)) push(errors, row.rowNumber, 'nameZh', 'DUPLICATE_NAME_IN_FILE', `与第${nameRows.get(nameKey)}行企业名称重复`, row.nameZh);
    else nameRows.set(nameKey, row.rowNumber);
  }
  const db = getDb();
  const [identityRows, enterpriseRows] = await Promise.all([db.select().from(enterpriseIdentities), db.select().from(enterprises)]);
  for (const row of rows) {
    if (row.identityType && identityRows.some((item) => item.identityType === row.identityType && item.normalizedValue === row.identityValue)) push(errors, row.rowNumber, 'accountContact', 'IDENTITY_EXISTS', '该联系方式已经绑定企业账号', row.accountContact);
    if (row.registrationNo) {
      const existing = enterpriseRows.find((item) => item.country.toLowerCase() === row.country.toLowerCase() && item.registrationNo?.toLowerCase() === row.registrationNo.toLowerCase());
      if (existing) push(errors, row.rowNumber, 'registrationNo', 'REGISTRATION_EXISTS', `注册编号已属于“${existing.nameZh}”`, row.registrationNo);
    }
    const sameName = enterpriseRows.find((item) => item.country.toLowerCase() === row.country.toLowerCase() && item.nameZh.toLowerCase() === row.nameZh.toLowerCase());
    if (sameName) push(errors, row.rowNumber, 'nameZh', 'ENTERPRISE_EXISTS', `同国家/地区已存在企业“${sameName.nameZh}”`, row.nameZh);
  }
  return errors;
}

export function importErrorsCsv(errors: ImportError[]) {
  const csv = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return `\uFEFF${[['行号', '字段', '错误代码', '说明', '原值（敏感值已脱敏）'], ...errors.map((item) => [item.rowNumber, item.field, item.code, item.message, item.value])].map((row) => row.map(csv).join(',')).join('\r\n')}`;
}
