import { eq } from 'drizzle-orm';
import { AdminShell } from '@/components/admin-shell';
import { getDb } from '@/db';
import { events, messageDeliveries, metricSnapshotRuns, reportRuns } from '@/db/schema';
import { getCurrentSessionActor } from '@/lib/auth';

export default async function OperationsPage(){
  const actor=await getCurrentSessionActor();
  if(actor?.groupRole!=='GROUP_ADMIN')return <AdminShell active="/operations" title="系统运行"><section className="panel">仅集团管理员可查看运行状态。</section></AdminShell>;
  const db=getDb();
  const [eventRows,failedMetrics,failedReports,deadLetters]=await Promise.all([
    db.select({id:events.id}).from(events),db.select({id:metricSnapshotRuns.id}).from(metricSnapshotRuns).where(eq(metricSnapshotRuns.status,'FAILED')),
    db.select({id:reportRuns.id}).from(reportRuns).where(eq(reportRuns.status,'FAILED')),db.select({id:messageDeliveries.id}).from(messageDeliveries).where(eq(messageDeliveries.status,'DEAD_LETTER')),
  ]);
  return <AdminShell active="/operations" title="系统运行与本地交付" eyebrow="集团工作台 / 安全、备份与可观测性">
    <section className="module-summary"><div><span>应用</span><strong>UP</strong><small>LOCAL_ALPHA</small></div><div><span>数据库</span><strong>UP</strong><small>{eventRows.length}个展会</small></div><div><span>失败统计/报表</span><strong>{failedMetrics.length+failedReports.length}</strong><small>失败不阻断主流程</small></div><div><span>消息死信</span><strong>{deadLetters.length}</strong><small>可在营销模块重试</small></div></section>
    <section className="operations-grid"><article className="panel"><span className="eyebrow">HEALTH & OBSERVABILITY</span><h2>健康摘要</h2><p>受控接口 <code>/api/operations/health-summary</code> 返回数据库、文件存储状态、失败任务和请求ID。固定SLA仍引用 <code>PERFORMANCE-TBD-001</code>。</p></article><article className="panel"><span className="eyebrow">BACKUP & RECOVERY</span><h2>本地备份演练</h2><p><code>scripts/backup-local.ps1</code> 使用 MySQL 8 工具导出结构和数据并生成SHA-256清单；<code>scripts/recovery-drill-local.ps1</code> 校验备份文件完整性与可恢复性。</p></article><article className="panel"><span className="eyebrow">SECURITY GATE</span><h2>发布前检查</h2><p><code>scripts/verify-alpha.ps1</code> 执行前后端构建、测试、依赖审计和路由冒烟。真实密钥不进入仓库。</p></article><article className="panel"><span className="eyebrow">PERFORMANCE SAMPLE</span><h2>无承诺测量</h2><p><code>scripts/measure-local.ps1</code> 输出当前设备的中位数和P95样本，只作为访谈与后续定标证据，不形成容量承诺。</p></article></section>
    <section className="panel"><div className="panel-head"><div><span className="eyebrow">PENDING DECISIONS</span><h2>保持待定的运维参数</h2></div></div><div className="operations-pending"><span>DEPLOY-TBD-001 · 正式部署位置</span><span>PERFORMANCE-TBD-001 · 容量与性能基线</span><span>BACKUP-TBD-001 · RPO/RTO、频率和保留期</span><span>AUDIT-TBD-001 · 日志、版本与回收站期限</span></div></section>
  </AdminShell>;
}
