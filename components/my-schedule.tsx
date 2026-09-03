'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Schedule = { id: string; participantA: string; participantB: string; startAt: string; endAt: string; locationText: string };
export function MySchedule() {
  const [name,setName]=useState(''); const [rows,setRows]=useState<Schedule[]>([]); const [message,setMessage]=useState('正在读取本人已发布安排…');
  useEffect(()=>{fetch('/api/matching/my-schedule',{cache:'no-store'}).then(async response=>({ok:response.ok,body:await response.json() as {error?:string;account?:{name:string};data?:Schedule[]}})).then(({ok,body})=>{if(!ok)return setMessage(body.error??'读取失败');setName(body.account?.name??'');setRows(body.data??[]);setMessage(body.data?.length?'仅显示已审核发布且与本人相关的洽谈。':'当前没有已发布的本人洽谈安排。');}).catch(()=>setMessage('网络错误，请稍后重试。'));},[]);
  if(!name)return <section className="schedule-empty"><h1>需要员工身份</h1><p>{message}</p><Link href="/login">验证码登录</Link></section>;
  return <section className="mobile-schedule-body"><div><span>参会人</span><h1>{name}</h1><p>{message}</p></div><div className="mobile-schedule-list">{rows.map((item,index)=><article key={item.id}><span>{String(index+1).padStart(2,'0')}</span><time>{item.startAt.slice(0,10)}<strong>{item.startAt.slice(11,16)}—{item.endAt.slice(11,16)}</strong></time><div><h2>{item.participantA===name?item.participantB:item.participantA}</h2><p>{item.locationText}</p></div></article>)}</div></section>;
}
