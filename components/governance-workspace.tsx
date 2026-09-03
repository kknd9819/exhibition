'use client';

import { useMemo, useState } from 'react';

type AuditRow = { id:string; eventId:string|null; actorName:string; module:string; objectType:string; objectId:string; action:string; result:string; requestId:string; occurredAt:string };
type RecycleRow = { id:string; eventId:string|null; module:string; objectType:string; objectId:string; objectLabel:string; status:string; deletedBy:string; deletedAt:string; restoredBy:string|null; restoredAt:string|null };

export function GovernanceWorkspace({ initialLogs, initialRecycleItems, events, canPurge }:{ initialLogs:AuditRow[]; initialRecycleItems:RecycleRow[]; events:Array<{id:string;label:string}>; canPurge:boolean }) {
  const [tab,setTab]=useState<'audit'|'recycle'>('audit');
  const [items,setItems]=useState(initialRecycleItems);
  const [message,setMessage]=useState('审计日志只读保存；回收站恢复会保留原对象ID、发布指针和版本链。');
  const [filters,setFilters]=useState({eventId:'',actor:'',module:'',objectType:'',action:'',from:'',to:''});
  const modules=useMemo(()=>[...new Set(initialLogs.map(row=>row.module))].sort(),[initialLogs]);
  const objectTypes=useMemo(()=>[...new Set(initialLogs.map(row=>row.objectType))].sort(),[initialLogs]);
  const visibleLogs=useMemo(()=>initialLogs.filter(row=>{
    if(filters.eventId&&row.eventId!==filters.eventId)return false;
    if(filters.actor&&!row.actorName.toLowerCase().includes(filters.actor.toLowerCase()))return false;
    if(filters.module&&row.module!==filters.module)return false;
    if(filters.objectType&&row.objectType!==filters.objectType)return false;
    if(filters.action&&!row.action.toLowerCase().includes(filters.action.toLowerCase()))return false;
    if(filters.from&&row.occurredAt<filters.from)return false;
    if(filters.to&&row.occurredAt>`${filters.to}T23:59:59.999Z`)return false;
    return true;
  }),[filters,initialLogs]);
  async function restore(item:RecycleRow){
    const response=await fetch(`/api/governance/recycle-bin/${item.id}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'RESTORE',reason:'治理中心人工恢复'})});
    const result=await response.json() as {error?:string;status?:string};
    if(!response.ok)return setMessage(result.error??'恢复失败');
    const now=new Date().toISOString();
    setItems(current=>current.map(row=>row.id===item.id?{...row,status:'RESTORED',restoredBy:'当前员工',restoredAt:now}:row));
    setMessage(`${item.objectLabel} 已恢复；请回到原模块刷新检查对象状态和公开结果。`);
  }
  async function purge(item:RecycleRow){
    const response=await fetch(`/api/governance/recycle-bin/${item.id}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'PURGE',confirmation:'PERMANENTLY DELETE'})});
    const result=await response.json() as {error?:string};
    setMessage(result.error??(response.ok?'已彻底删除':'操作失败'));
  }
  return <>
    <section className="subnav"><button className={tab==='audit'?'active':''} onClick={()=>setTab('audit')}>操作审计</button><button className={tab==='recycle'?'active':''} onClick={()=>setTab('recycle')}>回收站</button></section>
    <section className="module-summary"><div><span>可查询日志</span><strong>{initialLogs.length}</strong><small>当前权限范围</small></div><div><span>筛选结果</span><strong>{visibleLogs.length}</strong><small>人员 / 展会 / 对象 / 时间</small></div><div><span>待恢复对象</span><strong>{items.filter(i=>i.status==='TRASHED').length}</strong><small>保留原版本链</small></div><div><span>已恢复记录</span><strong>{items.filter(i=>i.status==='RESTORED').length}</strong><small>恢复操作再次审计</small></div></section>
    <div className="review-message" role="status">{message}</div>
    {tab==='audit'?<section className="panel governance-panel"><div className="panel-head"><div><span className="eyebrow">IMMUTABLE AUDIT TRAIL</span><h2>统一操作日志</h2></div><span className="soft-pill">只读 · 最近500条</span></div><div className="governance-filters"><label>展会<select value={filters.eventId} onChange={e=>setFilters({...filters,eventId:e.target.value})}><option value="">全部</option>{events.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>操作人<input value={filters.actor} onChange={e=>setFilters({...filters,actor:e.target.value})} placeholder="输入姓名"/></label><label>模块<select value={filters.module} onChange={e=>setFilters({...filters,module:e.target.value})}><option value="">全部</option>{modules.map(item=><option key={item}>{item}</option>)}</select></label><label>对象<select value={filters.objectType} onChange={e=>setFilters({...filters,objectType:e.target.value})}><option value="">全部</option>{objectTypes.map(item=><option key={item}>{item}</option>)}</select></label><label>动作<input value={filters.action} onChange={e=>setFilters({...filters,action:e.target.value})} placeholder="如 PUBLISH"/></label><label>开始日期<input type="date" value={filters.from} onChange={e=>setFilters({...filters,from:e.target.value})}/></label><label>结束日期<input type="date" value={filters.to} onChange={e=>setFilters({...filters,to:e.target.value})}/></label><button onClick={()=>setFilters({eventId:'',actor:'',module:'',objectType:'',action:'',from:'',to:''})}>清空筛选</button></div><div className="data-table-wrap"><table className="data-table"><thead><tr><th>时间 / 请求</th><th>操作人</th><th>展会</th><th>模块 / 对象</th><th>动作</th><th>结果</th></tr></thead><tbody>{visibleLogs.map(row=><tr key={row.id}><td><strong>{new Date(row.occurredAt).toLocaleString('zh-CN',{hour12:false})}</strong><small>{row.requestId.slice(0,12)}</small></td><td>{row.actorName}</td><td>{events.find(event=>event.id===row.eventId)?.label??'集团级'}</td><td><strong>{row.module}</strong><small>{row.objectType} · {row.objectId.slice(0,18)}</small></td><td>{row.action}</td><td><span className={`state-pill ${row.result.toLowerCase()}`}>{row.result}</span></td></tr>)}</tbody></table></div></section>:null}
    {tab==='recycle'?<section className="panel governance-panel"><div className="panel-head"><div><span className="eyebrow">RECYCLE BIN</span><h2>逻辑删除与恢复记录</h2></div><span className="soft-pill">彻底删除期限待定</span></div><div className="data-table-wrap"><table className="data-table"><thead><tr><th>对象</th><th>展会</th><th>删除信息</th><th>状态</th><th>恢复信息</th><th>操作</th></tr></thead><tbody>{items.length?items.map(item=><tr key={item.id}><td><strong>{item.objectLabel}</strong><small>{item.objectType} · {item.objectId.slice(0,18)}</small></td><td>{events.find(event=>event.id===item.eventId)?.label??'集团级'}</td><td><strong>{item.deletedBy}</strong><small>{new Date(item.deletedAt).toLocaleString('zh-CN',{hour12:false})}</small></td><td><span className={`state-pill ${item.status.toLowerCase()}`}>{item.status==='TRASHED'?'待恢复':'已恢复'}</span></td><td>{item.restoredBy?<><strong>{item.restoredBy}</strong><small>{item.restoredAt?new Date(item.restoredAt).toLocaleString('zh-CN',{hour12:false}):'—'}</small></>:<span>—</span>}</td><td><div className="row-actions"><button disabled={item.status!=='TRASHED'} onClick={()=>restore(item)}>恢复对象</button><button disabled={!canPurge||item.status!=='TRASHED'} title="保留期限待访谈确认" onClick={()=>purge(item)}>彻底删除</button></div></td></tr>):<tr><td colSpan={6}>暂无回收站记录。可在内容资料中将未引用素材或新闻移入回收站。</td></tr>}</tbody></table></div></section>:null}
  </>;
}
