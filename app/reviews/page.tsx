import { desc, eq } from 'drizzle-orm';
import { AdminShell } from '@/components/admin-shell';
import { ReviewBoard } from '@/components/review-board';
import { getDb } from '@/db';
import { reviewTasks } from '@/db/schema';
import { getCurrentEventId } from '@/lib/current-event';
import { getCurrentSessionActor } from '@/lib/auth';

export default async function ReviewsPage() {
  const [tasks, actor] = await Promise.all([getDb().select().from(reviewTasks).where(eq(reviewTasks.eventId, await getCurrentEventId())).orderBy(desc(reviewTasks.submittedAt)), getCurrentSessionActor()]);
  return <AdminShell active="/reviews" title="统一审核中心" actions={<button className="ghost-button">审核记录</button>}><section className="subnav"><button className="active">我的待办</button><button>全部任务</button><button>已处理</button><button>规则配置</button></section><section className="review-rules"><div><strong>当前规则</strong><span>提交人与审核人必须为不同员工 · 一人通过即生效 · 已发布内容退回后恢复上一版本</span></div><span className="soft-pill">审计已启用</span></section><ReviewBoard initialTasks={tasks} actorName={actor?.name ?? '未登录'}/></AdminShell>;
}
