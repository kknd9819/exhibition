'use client';

import { useMemo, useState } from 'react';
import { PortalRenderer } from '@/components/portal/portal-renderer';
import { languageMeta } from '@/lib/portal-localization';
import type { PortalDocument } from '@/lib/portal-types';

type TranslationItem = {
  id: string; targetLanguage: string; status: string; sourceVersionId: string; sourceSha256: string; resultVersionId: string | null; versionNo: number; provider: string; model: string; promptVersion: string; requestedBy: string; requestedAt: string; confirmedBy: string | null; document: PortalDocument | null;
};
type PublicationItem = { language: string; status: string; currentVersionId: string | null; sourceVersionId: string | null; publishedBy: string | null; publishedAt: string | null };
type TextRow = { path: Array<string | number>; label: string; source: string; target: string };

const labels: Record<string, string> = { title: '标题', accentTitle: '强调标题', description: '说明', body: '正文', label: '标签', value: '值', day: '日期', time: '时间', address: '地址', primaryLabel: '主按钮', secondaryLabel: '次按钮', name: '名称' };

function getAt(value: unknown, path: Array<string | number>): unknown { return path.reduce<unknown>((current, key) => current && typeof current === 'object' ? (current as Record<string | number, unknown>)[key] : undefined, value); }
function setAt(document: PortalDocument, path: Array<string | number>, value: string) { const next = structuredClone(document); let current: unknown = next; path.slice(0, -1).forEach((key) => { current = (current as Record<string | number, unknown>)[key]; }); (current as Record<string | number, unknown>)[path[path.length - 1]] = value; return next; }
function collect(source: PortalDocument, target: PortalDocument): TextRow[] {
  const rows: TextRow[] = [];
  source.nav.forEach((item, index) => rows.push({ path: ['nav', index, 'label'], label: `导航 ${index + 1}`, source: item.label, target: String(getAt(target, ['nav', index, 'label']) ?? '') }));
  source.blocks.forEach((block, blockIndex) => {
    function walk(value: unknown, path: Array<string | number>, key = '') {
      if (typeof value === 'string') {
        if ((labels[key] || path.includes('items')) && !/^https?:|^#|^\//i.test(value)) rows.push({ path: ['blocks', blockIndex, 'props', ...path], label: `${block.name} · ${labels[key] ?? `条目 ${Number(path[path.length - 1]) + 1}`}`, source: value, target: String(getAt(target, ['blocks', blockIndex, 'props', ...path]) ?? '') });
        return;
      }
      if (Array.isArray(value)) return value.forEach((item, index) => walk(item, [...path, index], key));
      if (value && typeof value === 'object') Object.entries(value as Record<string, unknown>).forEach(([childKey, child]) => { if (childKey !== '__aiTranslatedFields') walk(child, [...path, childKey], childKey); });
    }
    walk(block.props, []);
  });
  return rows;
}

export function PortalLocalizationPanel({ pageId, eventName, eventSlug, sourceDocument, sourceSha256, sourceVersionNo, languages, initialItems, publications }: { pageId: string; eventName: string; eventSlug: string; sourceDocument: PortalDocument; sourceSha256: string; sourceVersionNo: number; languages: string[]; initialItems: TranslationItem[]; publications: PublicationItem[] }) {
  const targets = languages.filter((language) => language !== 'zh-CN' && languageMeta[language]);
  const [selectedLanguage, setSelectedLanguage] = useState(targets[0] ?? 'en');
  const [items, setItems] = useState(initialItems);
  const [message, setMessage] = useState('AI翻译只在工作人员点击后生成草稿；人工确认并提交后仍需另一员工审核。');
  const [busy, setBusy] = useState(false);
  const current = items.filter((item) => item.targetLanguage === selectedLanguage).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0];
  const publication = publications.find((item) => item.language === selectedLanguage);
  const rows = useMemo(() => current?.document ? collect(sourceDocument, current.document) : [], [current, sourceDocument]);
  const locked = !current || ['PENDING_REVIEW', 'PUBLISHED'].includes(current.status);
  const stale = Boolean((current && current.sourceSha256 !== sourceSha256) || (publication && publication.status === 'STALE'));

  async function requestTranslation() {
    setBusy(true); setMessage(`正在生成${languageMeta[selectedLanguage].label}翻译草稿…`);
    const response = await fetch('/api/localization/portal-translations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pageId, targetLanguage: selectedLanguage }) });
    const result = await response.json() as TranslationItem & { error?: string };
    setBusy(false); if (!response.ok || !result.id) return setMessage(result.error ?? '翻译草稿生成失败');
    setItems((all) => [result, ...all]); setMessage(`${languageMeta[selectedLanguage].label} V${result.versionNo} AI草稿已生成，请逐字段校对。`);
  }
  function edit(path: Array<string | number>, value: string) { if (!current?.document || locked) return; const document = setAt(current.document, path, value); setItems((all) => all.map((item) => item.id === current.id ? { ...item, document, status: item.status === 'DRAFT_AI' ? 'DRAFT_MANUAL' : item.status } : item)); setMessage('已在浏览器中修改，点击“保存人工校对”写入数据库。'); }
  async function persist(action: 'save' | 'submit') {
    if (!current?.document) return; setBusy(true); setMessage(action === 'submit' ? '正在提交翻译审核…' : '正在保存人工校对…');
    const response = await fetch(`/api/localization/portal-translations/${current.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, document: current.document }) });
    const result = await response.json() as { error?: string; status?: string; confirmedBy?: string; confirmedAt?: string };
    setBusy(false); if (!response.ok) return setMessage(result.error ?? '保存失败');
    setItems((all) => all.map((item) => item.id === current.id ? { ...item, status: result.status ?? item.status, confirmedBy: result.confirmedBy ?? item.confirmedBy } : item));
    setMessage(action === 'submit' ? '翻译版本已提交统一审核，公开页继续使用上一发布版本。' : '人工校对已保存。');
  }

  if (!targets.length) return <section className="localization-panel planned-panel"><span>LOCALIZATION</span><h2>当前展会只启用中文</h2><p>先在展会语言配置中加入目标语言，再生成翻译草稿。</p></section>;
  return <section className="localization-panel">
    <header><div><span>AI TRANSLATION · HUMAN REVIEW</span><h2>门户多语言工作台</h2><p>中文发布源 V{sourceVersionNo} · 每个目标语言分别校对、审核和发布。</p></div><div className="language-tabs">{targets.map((language) => <button className={selectedLanguage === language ? 'active' : ''} onClick={() => setSelectedLanguage(language)} key={language}>{languageMeta[language].label}</button>)}</div></header>
    <p className="localization-message" role="status">{message}</p>
    <div className="localization-toolbar"><div><strong>{languageMeta[selectedLanguage].label}</strong><span>{current ? `${current.status} · V${current.versionNo} · ${current.model}` : '尚无翻译草稿'}</span>{stale ? <b>源文已变化，需重新生成</b> : null}{publication?.currentVersionId ? <a href={`/exhibition/${eventSlug}?lang=${selectedLanguage}`} target="_blank">打开已发布版本 ↗</a> : null}</div><button onClick={requestTranslation} disabled={busy || current?.status === 'PENDING_REVIEW'}>{current ? '重新调用AI翻译' : '调用AI翻译补全'}</button><button onClick={() => persist('save')} disabled={busy || locked}>保存人工校对</button><button className="primary-button" onClick={() => persist('submit')} disabled={busy || locked || stale}>提交独立审核</button></div>
    {current?.document ? <div className="localization-layout"><div className="translation-fields"><header><strong>逐字段校对</strong><span>{rows.length} 个可翻译文本字段</span></header>{rows.map((row) => <article key={row.path.join('.')}><div><span>{row.label}</span><p>{row.source}</p></div><label><span>{languageMeta[selectedLanguage].label}</span>{row.source.length > 70 ? <textarea value={row.target} onChange={(event) => edit(row.path, event.target.value)} disabled={locked}/> : <input value={row.target} onChange={(event) => edit(row.path, event.target.value)} disabled={locked}/>}</label></article>)}</div><aside><div><strong>目标语言预览</strong><span dir={current.document.direction}>{languageMeta[selectedLanguage].label} · {current.document.direction?.toUpperCase()}</span></div><div className="localization-preview"><PortalRenderer document={current.document} eventName={eventName} eventSlug={eventSlug} compact currentLanguage={selectedLanguage} availableLanguages={languages}/></div><p>长文本保留“AI翻译”来源标注；工作人员修改后仍记录生成来源和确认人。</p></aside></div> : <div className="planned-panel"><span>NO DRAFT</span><h2>点击按钮生成首个翻译草稿</h2><p>本地Alpha适配器会记录供应方、模型、提示词版本和中文源摘要，生产阶段可替换为集团选定的LLM服务。</p></div>}
  </section>;
}
