import Link from 'next/link';
import { and, count, desc, eq } from 'drizzle-orm';
import { AdminShell } from '@/components/admin-shell';
import { getDb } from '@/db';
import { checkinLogs, eventExhibitors, registrationRecords, reviewTasks } from '@/db/schema';
import { getCurrentEventContext } from '@/lib/current-event';
import { getCurrentSessionActor, hasEventPermission } from '@/lib/auth';

export default async function Home() {
  const [{ current }, actor] = await Promise.all([getCurrentEventContext(), getCurrentSessionActor()]);
  const db = getDb();
  const eventId = current?.id ?? '';
  const [registrationCount, exhibitorCount, publicExhibitorCount, pendingCount, checkinCount, pendingTasks] = await Promise.all([
    db.select({ value: count() }).from(registrationRecords).where(eq(registrationRecords.eventId, eventId)),
    db.select({ value: count() }).from(eventExhibitors).where(eq(eventExhibitors.eventId, eventId)),
    db.select({ value: count() }).from(eventExhibitors).where(and(eq(eventExhibitors.eventId, eventId), eq(eventExhibitors.qualificationStatus, 'APPROVED'), eq(eventExhibitors.publishStatus, 'PUBLISHED'))),
    db.select({ value: count() }).from(reviewTasks).where(and(eq(reviewTasks.eventId, eventId), eq(reviewTasks.status, 'PENDING'))),
    db.select({ value: count() }).from(checkinLogs).where(eq(checkinLogs.eventId, eventId)),
    db.select().from(reviewTasks).where(and(eq(reviewTasks.eventId, eventId), eq(reviewTasks.status, 'PENDING'))).orderBy(desc(reviewTasks.submittedAt)).limit(3),
  ]);
  const metrics = [
    { label: '报名记录', value: String(registrationCount[0]?.value ?? 0), note: '当前展会实际记录', trend: '实时' },
    { label: '参展企业', value: String(exhibitorCount[0]?.value ?? 0), note: `门户可见 ${publicExhibitorCount[0]?.value ?? 0} 家`, trend: '实时' },
    { label: '待审核', value: String(pendingCount[0]?.value ?? 0), note: '当前展会统一队列', trend: '需处理' },
    { label: '签到记录', value: String(checkinCount[0]?.value ?? 0), note: '活动与展会级日志', trend: '累计' },
  ];
  const tasks = pendingTasks.map((task, index) => ({ title: task.title, meta: `${task.module} · ${task.submitterName}提交`, state: task.reviewerName ? '审核中' : '待领取', tone: ['amber', 'blue', 'green'][index % 3] }));
  const allowed = (permission: string) => hasEventPermission(actor, eventId, permission);
  const canManageEvents = actor?.groupRole === 'GROUP_ADMIN' || allowed('event.manage');
  const canEditPortal = allowed('portal.edit');
  const canManageRegistration = allowed('registration.manage') || allowed('event.manage');
  const canManageExhibitors = allowed('exhibitor.manage') || allowed('event.manage');
  const canReview = allowed('review.submit') || allowed('review.approve') || allowed('review.return');
  return (
    <AdminShell active="/" title="项目运营总览" actions={<><Link className="ghost-button button-link" href={`/exhibition/${current?.slug ?? '2026-morocco'}`}>预览门户</Link>{canEditPortal ? <Link className="primary-button button-link" href="/portal-editor">＋ 编辑门户</Link> : null}</>}>
      <div className="notice">
        <div className="notice-icon">!</div>
        <div><strong>{current?.shortName ?? '当前展会'} · {current?.status ?? '未选择'}</strong><span>当前有 {pendingCount[0]?.value ?? 0} 项任务等待审核；门户、报名和企业数据均按当前展会读取。当前本地数据库含测试样例记录。</span></div>
        {canReview ? <Link href="/reviews">查看发布检查</Link> : null}
      </div>
      <section className="metric-grid" aria-label="关键指标">
        {metrics.map((item) => <article className="metric-card" key={item.label}><div className="metric-head"><span>{item.label}</span><b>{item.trend}</b></div><strong className="metric-value">{item.value}</strong><span className="metric-note">{item.note}</span></article>)}
      </section>
      <section className="content-grid">
        <article className="panel progress-panel">
          <div className="panel-head"><div><span className="eyebrow">VERIFIED DATA</span><h2>当前展会数据边界</h2></div>{canManageEvents ? <Link className="text-button" href="/events">查看展会资料 →</Link> : null}</div>
          <div className="verified-list">
            <div><span>展会状态</span><strong>{current?.status ?? '未设置'}</strong></div>
            <div><span>举办时间</span><strong>{current ? `${current.startAt.slice(0, 10)} 至 ${current.endAt.slice(0, 10)}` : '未设置'}</strong></div>
            <div><span>门户公开企业</span><strong>{publicExhibitorCount[0]?.value ?? 0} 家</strong></div>
            <div><span>待审核任务</span><strong>{pendingCount[0]?.value ?? 0} 项</strong></div>
          </div>
          <p className="verified-note">本面板只呈现数据库中的当前值。项目计划、阶段百分比和节点日期尚未接入，因此不再展示模拟进度。</p>
        </article>
        <article className="panel review-panel">
          <div className="panel-head"><div><span className="eyebrow">REVIEW QUEUE</span><h2>审核待办</h2></div><span className="count-badge">{pendingCount[0]?.value ?? 0}</span></div>
          <div className="task-list">{tasks.length ? tasks.map((task) => <div className="task" key={task.title}><span className={`status-dot ${task.tone}`} /><span className="task-copy"><strong>{task.title}</strong><small>{task.meta}</small></span><span className="task-state">{task.state}</span></div>) : <div className="task"><span className="status-dot green"/><span className="task-copy"><strong>当前没有待审核任务</strong><small>切换展会后将读取对应队列</small></span></div>}</div>
          {canReview ? <Link className="full-button button-link" href="/reviews">进入统一审核中心</Link> : null}
        </article>
      </section>
      <section className="quick-grid" aria-label="快速入口">
        {canEditPortal ? <Link href="/portal-editor"><span>▦</span><div><strong>装修门户</strong><small>编辑首页与子页面入口</small></div><b>→</b></Link> : null}
        {canManageRegistration ? <Link href="/registrations"><span>◎</span><div><strong>报名管理</strong><small>表单、审核与名单</small></div><b>→</b></Link> : null}
        {canManageExhibitors ? <Link href="/exhibitors"><span>◇</span><div><strong>企业工作台</strong><small>资料、产品与参展记录</small></div><b>→</b></Link> : null}
      </section>
    </AdminShell>
  );
}
