import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentEventContext } from '@/lib/current-event';
import { getCurrentSessionActor, hasEventPermission } from '@/lib/auth';
import { EventSwitcher } from '@/components/event-switcher';

type NavItem = { label: string; icon: string; href: string; access: string[] };
type NavGroup = { id: string; label: string; icon: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  { id: 'workbench', label: '工作台', icon: '⌂', items: [
    { label: '总览', icon: '⌂', href: '/', access: ['membership'] },
    { label: '展会项目', icon: '◫', href: '/events', access: ['group', 'event.manage'] },
    { label: '账号权限', icon: '♙', href: '/iam', access: ['group'] },
  ] },
  { id: 'publishing', label: '内容与发布', icon: '▦', items: [
    { label: '会场门户', icon: '▦', href: '/portal-editor', access: ['portal.edit', 'portal.withdraw'] },
    { label: '内容资料', icon: '▤', href: '/content', access: ['content.edit', 'event.manage'] },
    { label: '嘉宾议程', icon: '◷', href: '/agenda', access: ['event.manage'] },
  ] },
  { id: 'onsite', label: '报名与现场', icon: '◎', items: [
    { label: '报名活动', icon: '◎', href: '/registrations', access: ['registration.manage', 'event.manage'] },
    { label: '现场签到', icon: '⌾', href: '/checkin', access: ['checkin.execute', 'event.manage'] },
  ] },
  { id: 'business', label: '企业与洽谈', icon: '◇', items: [
    { label: '企业参展', icon: '◇', href: '/exhibitors', access: ['exhibitor.manage', 'event.manage'] },
    { label: '供需洽谈', icon: '⇄', href: '/matching', access: ['event.manage'] },
  ] },
  { id: 'growth', label: '运营与数据', icon: '▥', items: [
    { label: '营销招募', icon: '⌁', href: '/marketing', access: ['event.manage'] },
    { label: '数据资产', icon: '◉', href: '/data-assets', access: ['group'] },
    { label: '数据统计', icon: '▥', href: '/analytics', access: ['event.analytics.view', 'analytics.view'] },
  ] },
  { id: 'control', label: '审核与治理', icon: '✓', items: [
    { label: '统一审核', icon: '✓', href: '/reviews', access: ['review.submit', 'review.approve', 'review.return'] },
    { label: '治理中心', icon: '◈', href: '/governance', access: ['group'] },
  ] },
  { id: 'system', label: '系统与规划', icon: '⚙', items: [
    { label: '系统运行', icon: '⚙', href: '/operations', access: ['group'] },
    { label: '规划与集成', icon: '⋯', href: '/roadmap', access: ['group'] },
  ] },
];

const nav = navGroups.flatMap((group) => group.items);

type Actor = Awaited<ReturnType<typeof getCurrentSessionActor>>;
function canAccess(actor: Actor, eventId: string, access: string[]) {
  if (!actor) return false;
  if (actor.groupRole === 'GROUP_ADMIN') return true;
  if (access.includes('group')) return false;
  if (access.includes('membership') && actor.memberships.some((item) => item.eventId === eventId)) return true;
  return access.some((permission) => hasEventPermission(actor, eventId, permission));
}

export async function AdminShell({
  active,
  title,
  eyebrow,
  actions,
  children,
}: {
  active: string;
  title: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [eventContext, actor] = await Promise.all([getCurrentEventContext(), getCurrentSessionActor()]);
  if (!actor) redirect(`/login?returnTo=${encodeURIComponent(active || '/')}`);
  const currentEvent = eventContext.current;
  const currentEventId = currentEvent?.id ?? '';
  const activeItem = nav.find((item) => item.href === active);
  if (activeItem && active !== '/' && !canAccess(actor, currentEventId, activeItem.access)) redirect('/');
  const visibleGroups = navGroups.map((group) => ({ ...group, items: group.items.filter((item) => canAccess(actor, currentEventId, item.access)) })).filter((group) => group.items.length);
  const visibleEvents = actor.groupRole === 'GROUP_ADMIN' ? eventContext.events : eventContext.events.filter((item) => actor.memberships.some((membership) => membership.eventId === item.id));
  const initials = actor.name.slice(-2);
  return (
    <main className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">会</span>
          <div><strong>会展中枢</strong><span>EXPO OPERATIONS</span></div>
        </Link>
        <EventSwitcher events={visibleEvents.map((item) => ({ id: item.id, year: item.year, shortName: item.shortName }))} currentEventId={currentEvent?.id} returnTo={active}/>
        <nav aria-label="展会管理导航">
          {visibleGroups.map((group) => <details className="nav-group" open={group.items.some((item) => item.href === active) || (active === '/' && group.id === 'workbench')} key={group.id}>
            <summary><span aria-hidden="true">{group.icon}</span><strong>{group.label}</strong><i aria-hidden="true">⌄</i></summary>
            <div>{group.items.map((item) => <Link className={active === item.href ? 'nav-item active' : 'nav-item'} href={item.href} key={item.href}><span aria-hidden="true">{item.icon}</span>{item.label}</Link>)}</div>
          </details>)}
        </nav>
        <Link className="sidebar-foot" aria-label="打开账户与权限" href="/login">
          <div className="avatar">{initials}</div>
          <div><strong>{actor.name}</strong><span>{actor.groupRole === 'GROUP_ADMIN' ? '集团管理员' : actor.memberships.find((item) => item.eventId === currentEvent?.id)?.roleCode ?? '未加入当前展会'}</span></div>
          <span aria-hidden="true">•••</span>
        </Link>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div><span className="breadcrumb">{eyebrow ?? `集团工作台 / ${currentEvent?.year ?? '—'} / ${currentEvent?.shortName ?? '未选择'}`}</span><h1>{title}</h1></div>
          {actions ? <div className="top-actions">{actions}</div> : null}
        </header>
        {children}
      </section>
    </main>
  );
}
