'use client';

import { useEffect, useRef, useState } from 'react';
import { PortalRenderer } from '@/components/portal/portal-renderer';
import { DEFAULT_PORTAL_SITE_PAGES, type PortalBlock, type PortalDocument } from '@/lib/portal-types';

const library: Array<{ type: PortalBlock['type']; title: string; note: string }> = [
  { type: 'hero', title: '海报与展会介绍', note: '主标题、说明和报名按钮' },
  { type: 'intro', title: '图文介绍', note: '标题、正文和关键信息' },
  { type: 'stats', title: '数据展示', note: '面积、展商、观众等指标' },
  { type: 'agenda', title: '会议议程', note: '日期、时间和议程条目' },
  { type: 'industries', title: '展品范围', note: '分类网格与说明' },
  { type: 'enterpriseList', title: '推荐企业', note: '关联已审核参展企业' },
  { type: 'map', title: '参会地址', note: '地点、坐标和交通说明' },
  { type: 'download', title: '资料下载', note: '公开PDF或受限资料' },
  { type: 'contact', title: '报名与联系', note: '观众报名和申请参展入口' },
  { type: 'html', title: '自定义HTML/CSS', note: 'Alpha阶段采用受控内容' },
];

function createBlock(type: PortalBlock['type']): PortalBlock {
  const item = library.find((entry) => entry.type === type)!;
  const common = { id: `${type}-${crypto.randomUUID()}`, type, name: item.title, visible: true };
  const propsByType: Record<PortalBlock['type'], Record<string, unknown>> = {
    hero: { kicker: 'NEW SECTION', title: '新的主视觉标题', accentTitle: '补充标题', description: item.note, primaryLabel: '立即报名', primaryHref: '#contact', secondaryLabel: '了解详情', secondaryHref: '#about' },
    intro: { kicker: 'ABOUT', title: '新的图文介绍', body: item.note, facts: [] },
    stats: { title: '数据展示', items: [{ label: '示例指标', value: '100' }] },
    agenda: { kicker: 'PROGRAMME', title: '活动日程', description: item.note, items: [{ day: 'DAY 01', time: '09:00—10:00', title: '新议程' }] },
    industries: { kicker: 'SCOPE', title: '展品范围', items: ['分类一', '分类二', '分类三'] },
    enterpriseList: { kicker: 'EXHIBITORS', title: '推荐企业', limit: 4 },
    map: { kicker: 'VENUE', title: '参会地址', address: '请填写具体地址', latitude: 0, longitude: 0 },
    download: { title: '资料下载', description: '请上传PDF并配置公开或受限访问策略' },
    contact: { kicker: 'JOIN', title: '报名参加活动', description: item.note, primaryLabel: '观众报名', secondaryLabel: '申请参展' },
    html: { title: '自定义内容', description: '安全白名单功能待后续专项完善' },
  };
  return { ...common, props: propsByType[type] };
}

export function PortalBuilder({
  initialDocument,
  pageId,
  eventName,
  eventSlug,
  initialVersionId,
  initialVersionNo,
  publishedVersionNo,
  initialStatus,
  initialVersions,
  registrationActivities,
}: {
  initialDocument: PortalDocument;
  pageId: string;
  eventName: string;
  eventSlug: string;
  initialVersionId: string | null;
  initialVersionNo: number;
  publishedVersionNo: number;
  initialStatus: string;
  initialVersions: Array<{ id: string; versionNo: number; status: string; submittedBy: string | null; approvedBy: string | null; updatedAt: string }>;
  registrationActivities: Array<{ id: string; name: string }>;
}) {
  const normalizedInitial = { ...initialDocument, sitePages: initialDocument.sitePages ?? structuredClone(DEFAULT_PORTAL_SITE_PAGES) };
  const [document, setDocument] = useState(normalizedInitial);
  const [selected, setSelected] = useState(normalizedInitial.blocks[0]?.id ?? '');
  const [versionId, setVersionId] = useState<string | null>(initialVersionId);
  const [versionNo, setVersionNo] = useState(initialVersionNo);
  const [status, setStatus] = useState(initialStatus);
  const [revision, setRevision] = useState(0);
  const [message, setMessage] = useState(initialStatus === 'PENDING' ? `V${initialVersionNo} 正在审核，线上继续显示 V${publishedVersionNo}。` : `当前线上版本 V${publishedVersionNo}；编辑内容进入独立草稿。`);
  const [versions, setVersions] = useState(initialVersions);
  const [past, setPast] = useState<PortalDocument[]>([]);
  const [future, setFuture] = useState<PortalDocument[]>([]);
  const [draggedId, setDraggedId] = useState('');
  const [dropTargetId, setDropTargetId] = useState('');
  const documentRef = useRef(normalizedInitial);
  const locked = status === 'PENDING';

  async function persist(action: 'draft' | 'submit', silent = false) {
    if (locked) return;
    if (!silent) setMessage(action === 'submit' ? '正在提交审核…' : '正在保存…');
    const response = await fetch(`/api/portal/pages/${pageId}/versions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ document: documentRef.current, action, language: documentRef.current.language, versionId, changeSummary: 'Alpha门户编辑器保存' }),
    });
    const result = await response.json() as { error?: string; versionId?: string; versionNo?: number; reviewStatus?: string; publishedVersionNo?: number; submitterName?: string };
    if (!response.ok) { setMessage(result.error ?? '保存失败'); return; }
    setVersionId(result.versionId ?? null);
    setVersionNo(result.versionNo ?? versionNo);
    setStatus(result.reviewStatus ?? status);
    setVersions((current) => {
      const existing = current.find((item) => item.id === result.versionId);
      const next = { id: result.versionId ?? '', versionNo: result.versionNo ?? versionNo, status: result.reviewStatus ?? 'DRAFT', submittedBy: result.submitterName ?? '当前员工', approvedBy: existing?.approvedBy ?? null, updatedAt: new Date().toISOString() };
      return existing ? current.map((item) => item.id === next.id ? next : item) : [next, ...current];
    });
    if (action === 'submit') setMessage(`V${result.versionNo} 已提交审核，公开门户继续显示 V${result.publishedVersionNo ?? publishedVersionNo}。`);
    else setMessage(`草稿 V${result.versionNo} 已自动保存 · ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`);
  }

  useEffect(() => {
    if (revision === 0 || locked) return;
    const timer = window.setTimeout(() => { void persist('draft', true); }, 900);
    return () => window.clearTimeout(timer);
    // revision is the explicit edit clock; document/version are intentionally captured per edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision]);

  function change(mutator: (current: PortalDocument) => PortalDocument) {
    if (locked) return;
    const before = documentRef.current;
    const next = mutator(structuredClone(before));
    if (JSON.stringify(before) === JSON.stringify(next)) return;
    setPast((items) => [...items.slice(-19), structuredClone(before)]);
    setFuture([]);
    documentRef.current = next;
    setDocument(next);
    setMessage('有修改，等待自动保存…');
    setRevision((value) => value + 1);
  }
  function applyHistory(next: PortalDocument, messageText: string) { documentRef.current = next; setDocument(next); if (!next.blocks.some((item) => item.id === selected)) setSelected(next.blocks[0]?.id ?? ''); setMessage(messageText); setRevision((value) => value + 1); }
  function undo() { if (locked || !past.length) return; const previous = structuredClone(past[past.length - 1]); const current = structuredClone(documentRef.current); setPast((items) => items.slice(0, -1)); setFuture((items) => [current, ...items].slice(0, 20)); applyHistory(previous, '已撤销一步，等待自动保存…'); }
  function redo() { if (locked || !future.length) return; const next = structuredClone(future[0]); const current = structuredClone(documentRef.current); setFuture((items) => items.slice(1)); setPast((items) => [...items.slice(-19), current]); applyHistory(next, '已重做一步，等待自动保存…'); }
  function updateBlock(id: string, updater: (block: PortalBlock) => PortalBlock) { change((current) => ({ ...current, blocks: current.blocks.map((block) => block.id === id ? updater(block) : block) })); }
  function updateProp(id: string, key: string, value: unknown) { updateBlock(id, (block) => ({ ...block, props: { ...block.props, [key]: value } })); }
  function add(type: PortalBlock['type']) { const block = createBlock(type); change((current) => ({ ...current, blocks: [...current.blocks, block] })); setSelected(block.id); }
  function move(index: number, delta: number) { const target = index + delta; if (target < 0 || target >= document.blocks.length) return; change((current) => { const blocks = [...current.blocks]; [blocks[index], blocks[target]] = [blocks[target], blocks[index]]; return { ...current, blocks }; }); }
  function reorder(sourceId: string, targetId: string) { if (!sourceId || sourceId === targetId) return; change((current) => { const from = current.blocks.findIndex((item) => item.id === sourceId); const to = current.blocks.findIndex((item) => item.id === targetId); if (from < 0 || to < 0) return current; const blocks = [...current.blocks]; const [moved] = blocks.splice(from, 1); blocks.splice(to, 0, moved); return { ...current, blocks }; }); setDraggedId(''); setDropTargetId(''); }
  function duplicate(id: string) { const source = documentRef.current.blocks.find((item) => item.id === id); if (!source) return; const copy = { ...structuredClone(source), id: `${source.type}-${crypto.randomUUID()}`, name: `${source.name} 副本` }; change((current) => { const index = current.blocks.findIndex((item) => item.id === id); const blocks = [...current.blocks]; blocks.splice(index + 1, 0, copy); return { ...current, blocks }; }); setSelected(copy.id); }
  function remove(id: string) { if (document.blocks.length <= 1) return setMessage('页面至少保留一个组件。'); change((current) => ({ ...current, blocks: current.blocks.filter((block) => block.id !== id) })); setSelected(document.blocks.find((block) => block.id !== id)?.id ?? ''); }
  function updateNav(id: string, patch: Partial<PortalDocument['nav'][number]>) { change((current) => ({ ...current, nav: current.nav.map((item) => item.id === id ? { ...item, ...patch } : item) })); }
  function addNav() { const item = { id: `nav-${crypto.randomUUID()}`, label: '新导航', anchor: 'contact', visible: true }; change((current) => ({ ...current, nav: [...current.nav, item] })); }
  function removeNav(id: string) { change((current) => ({ ...current, nav: current.nav.filter((item) => item.id !== id) })); }
  function moveNav(index: number, delta: number) { const target = index + delta; if (target < 0 || target >= documentRef.current.nav.length) return; change((current) => { const nav = [...current.nav]; [nav[index], nav[target]] = [nav[target], nav[index]]; return { ...current, nav }; }); }
  function updateSitePage(id: string, patch: Partial<NonNullable<PortalDocument['sitePages']>[number]>) { change((current) => ({ ...current, sitePages: (current.sitePages ?? []).map((item) => item.id === id ? { ...item, ...patch } : item) })); }

  async function forceWithdraw() {
    if (!window.confirm(`确认强制撤回线上 V${publishedVersionNo}？系统将默认恢复上一已发布版本。`)) return;
    setMessage('正在撤回并恢复上一版本…');
    const response = await fetch(`/api/portal/pages/${pageId}/withdraw`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason: 'Alpha 演示管理员强制撤回' }),
    });
    const result = await response.json() as { error?: string; withdrawnVersionNo?: number; restoredVersionNo?: number | null };
    if (!response.ok) return setMessage(result.error ?? '撤回失败');
    setMessage(`V${result.withdrawnVersionNo} 已撤回，已恢复 V${result.restoredVersionNo ?? '空白页'}。`);
    window.setTimeout(() => window.location.reload(), 500);
  }

  const current = document.blocks.find((item) => item.id === selected);
  return <div className="alpha-builder" id="portal-page-builder">
    <div className={`builder-lock ${locked ? 'locked' : ''}`}><strong>{locked ? '审核锁定' : `编辑草稿 V${versionNo || '新'}`}</strong><span>{message}</span><div><button onClick={undo} disabled={locked || !past.length}>撤销</button><button onClick={redo} disabled={locked || !future.length}>重做</button><button onClick={() => void persist('draft')} disabled={locked}>立即保存</button><button className="primary-button" onClick={() => void persist('submit')} disabled={locked}>提交审核</button></div></div>
    <div className="builder-shell">
      <aside className="component-library"><h2>组件库</h2><p>添加后与公开门户使用同一个渲染器</p>{library.map((item) => <button key={item.type} onClick={() => add(item.type)} disabled={locked}><span>＋</span><div><strong>{item.title}</strong><small>{item.note}</small></div></button>)}</aside>
      <section className="builder-canvas"><div className="builder-status"><span>桌面预览 · /exhibition/{eventSlug}</span><span>拖动下方组件卡片排序 · {document.blocks.filter((item) => item.visible).length}/{document.blocks.length} 个显示</span></div><div className="portal-editor-preview"><PortalRenderer document={document} eventName={eventName} eventSlug={eventSlug} compact /></div><div className="builder-outline">{document.blocks.map((block,index) => <button draggable={!locked} className={`${selected === block.id ? 'selected ' : ''}${draggedId === block.id ? 'dragging ' : ''}${dropTargetId === block.id ? 'drop-target' : ''}`.trim()} onClick={() => setSelected(block.id)} onDragStart={() => { setDraggedId(block.id); setSelected(block.id); }} onDragEnter={() => setDropTargetId(block.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); reorder(draggedId, block.id); }} onDragEnd={() => { setDraggedId(''); setDropTargetId(''); }} key={block.id}><span>{block.visible ? '显示' : '隐藏'}</span><strong>{block.name}</strong><i>{block.type}</i><b aria-label={`上移${block.name}`} onClick={(event)=>{event.stopPropagation();move(index,-1)}}>↑</b><b aria-label={`下移${block.name}`} onClick={(event)=>{event.stopPropagation();move(index,1)}}>↓</b></button>)}</div></section>
      <aside className="property-panel"><h2>组件属性</h2>{current ? <><label className="switch-label"><input type="checkbox" checked={current.visible} onChange={(event)=>updateBlock(current.id, block=>({...block,visible:event.target.checked}))} disabled={locked}/>在门户中显示</label><label>组件名称<input value={current.name} onChange={(event)=>updateBlock(current.id, block=>({...block,name:event.target.value}))} disabled={locked}/></label>{typeof current.props.kicker === 'string' ? <label>栏目英文<input value={String(current.props.kicker)} onChange={(event)=>updateProp(current.id,'kicker',event.target.value)} disabled={locked}/></label> : null}{typeof current.props.title === 'string' ? <label>标题<input value={String(current.props.title)} onChange={(event)=>updateProp(current.id,'title',event.target.value)} disabled={locked}/></label> : null}{typeof current.props.accentTitle === 'string' ? <label>强调标题<input value={String(current.props.accentTitle)} onChange={(event)=>updateProp(current.id,'accentTitle',event.target.value)} disabled={locked}/></label> : null}{typeof current.props.description === 'string' ? <label>说明<textarea value={String(current.props.description)} onChange={(event)=>updateProp(current.id,'description',event.target.value)} disabled={locked}/></label> : null}{typeof current.props.body === 'string' ? <label>正文<textarea value={String(current.props.body)} onChange={(event)=>updateProp(current.id,'body',event.target.value)} disabled={locked}/></label> : null}<label>主题色<input type="color" value={document.theme.primary} onChange={(event)=>change(doc=>({...doc,theme:{...doc.theme,primary:event.target.value}}))} disabled={locked}/></label><label>强调色<input type="color" value={document.theme.accent} onChange={(event)=>change(doc=>({...doc,theme:{...doc.theme,accent:event.target.value}}))} disabled={locked}/></label><div className="property-actions"><button onClick={()=>duplicate(current.id)} disabled={locked}>复制组件</button><button className="danger-button" onClick={()=>remove(current.id)} disabled={locked}>删除组件</button></div><div className="property-tip">自动保存只更新草稿；审核通过后公开门户才切换到新版本。</div></> : <p>选择组件进行配置。</p>}<section className="nav-editor"><div><h2>门户导航</h2><button onClick={addNav} disabled={locked}>＋ 新增</button></div><p>配置公开页顶部导航；锚点填写 about、stats、agenda、industries 或 contact。</p>{document.nav.map((item,index)=><article key={item.id}><input aria-label={`导航名称${index+1}`} value={item.label} onChange={(event)=>updateNav(item.id,{label:event.target.value})} disabled={locked}/><input aria-label={`导航锚点${index+1}`} value={item.anchor} onChange={(event)=>updateNav(item.id,{anchor:event.target.value.replace(/^#/, '')})} disabled={locked}/><label><input type="checkbox" checked={item.visible} onChange={(event)=>updateNav(item.id,{visible:event.target.checked})} disabled={locked}/>显示</label><div><button aria-label={`上移导航${index+1}`} onClick={()=>moveNav(index,-1)} disabled={locked||index===0}>↑</button><button aria-label={`下移导航${index+1}`} onClick={()=>moveNav(index,1)} disabled={locked||index===document.nav.length-1}>↓</button><button aria-label={`删除导航${index+1}`} onClick={()=>removeNav(item.id)} disabled={locked}>×</button></div></article>)}</section><section className="site-page-editor"><div><h2>站点页面树</h2><span>首页装修 + 业务栏目供数</span></div><p>每个栏目使用独立URL；页面树和首页组件作为同一门户版本提交审核。</p><article className="site-page-home"><strong>首页</strong><span>组件装修</span><code>/exhibition/{eventSlug}</code></article>{(document.sitePages ?? []).map((item)=><article key={item.id}><label><input type="checkbox" checked={item.visible} onChange={(event)=>updateSitePage(item.id,{visible:event.target.checked})} disabled={locked}/>启用</label><input aria-label={`${item.label}栏目名称`} value={item.label} onChange={(event)=>updateSitePage(item.id,{label:event.target.value})} disabled={locked}/><code>/exhibition/{eventSlug}{item.path}</code>{item.id==='page-registration'?<label className="site-page-binding">绑定报名活动<select aria-label="绑定报名活动" value={item.path.replace('/register/','')} onChange={(event)=>updateSitePage(item.id,{path:`/register/${event.target.value}`})} disabled={locked||!registrationActivities.length}>{!registrationActivities.some((activity)=>item.path===`/register/${activity.id}`)&&item.path.replace('/register/','')?<option value={item.path.replace('/register/','')}>当前绑定已失效</option>:null}{registrationActivities.length?registrationActivities.map((activity)=><option key={activity.id} value={activity.id}>{activity.name}</option>):<option value="">暂无可公开报名活动</option>}</select></label>:null}<textarea aria-label={`${item.label}栏目说明`} value={item.description} onChange={(event)=>updateSitePage(item.id,{description:event.target.value})} disabled={locked}/></article>)}</section></aside>
    </div>
    <section className="portal-version-panel" id="portal-versions">
      <div><h2>版本与发布记录</h2><p>公开门户只读取“已发布”版本；管理员撤回后默认恢复上一版本。</p></div>
      <button className="danger-button" onClick={() => void forceWithdraw()} disabled={publishedVersionNo === 0 || locked}>管理员强制撤回线上 V{publishedVersionNo}</button>
      <div className="portal-version-list">{versions.map((item) => <article key={item.id}><strong>V{item.versionNo}</strong><span className={`state-pill ${item.status.toLowerCase()}`}>{item.status}</span><small>提交：{item.submittedBy ?? '—'} · 审核：{item.approvedBy ?? '—'}</small><time>{new Date(item.updatedAt).toLocaleString('zh-CN')}</time></article>)}</div>
    </section>
  </div>;
}
