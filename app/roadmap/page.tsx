import { AdminShell } from '@/components/admin-shell';

const items = [
  { code: 'RECEPTION-TBD-001', status: '整体待定', tone: 'pending', title: '嘉宾接待', scope: '档案、邀请、接送、住宿、陪同、行程和现场服务的对象、字段与流程均等待客户访谈。', boundary: '当前无菜单下钻和可执行接口。' },
  { code: 'NETWORK-TBD-001', status: '整体待定', tone: 'pending', title: '人脉模块', scope: '价值假设、授权方式、隐私边界和现场使用频率尚待调研。', boundary: '当前不进入公开门户和用户中心。' },
  { code: 'AI-PLAN-001', status: '二期业务入口', tone: 'approved', title: 'AI 展位导引', scope: '预留与独立“展会展位导引系统”对接的位置，后续可从本届企业、产品、文本展位和平面图建立导引索引。', boundary: '本系统当前不复制该独立项目，也不声称具备导引能力。' },
  { code: 'AI-PLAN-002', status: '草案待精调', tone: 'approved', title: 'AI 资源匹配与助手', scope: '公开资料允许进入检索索引；受限资料禁止收录。调用授权、提示词、评测和删除机制需要独立设计。', boundary: '当前不生成匹配建议，不向用户展示AI结论。' },
  { code: 'FINANCE-PLAN-001', status: '系统外处理', tone: 'neutral', title: '财务协作接口', scope: '费用、开票和收付款由现有财务系统及线下联系处理；保留未来跳转或数据交换位置。', boundary: '一期无订单、支付和钱包模式。' },
  { code: 'INTEGRATION-TBD-001', status: '服务商待定', tone: 'pending', title: '第三方服务配置', scope: '短信、邮件、微信、地图、文件预览和LLM均采用可替换适配器规划。', boundary: '当前本地验证码与翻译模拟器只用于流程验收，未配置生产密钥。' },
  { code: 'ACCOUNT-TBD-001', status: '接入方式待定', tone: 'pending', title: 'OA / SSO', scope: '内部员工当前使用手机号或邮箱验证码登录；是否接入既有OA等待确认。', boundary: '当前不展示虚构的组织层级和OA同步结果。' },
  { code: 'EXHIBITOR-TBD-001/002', status: '入口预留', tone: 'pending', title: '参展人员与证件', scope: '参展人员名单、名额、候补、审核、证件模板和打印规则仍待调研。', boundary: '当前企业工作台不出现可提交的人员或证件流程。' },
] as const;

export default function RoadmapPage() {
  return <AdminShell active="/roadmap" title="规划与集成" eyebrow="集团工作台 / 已确认边界与待定项">
    <section className="roadmap-intro"><div><span className="eyebrow">CONTROLLED ROADMAP</span><h2>只展示已确认的规划边界</h2><p>本页供访谈和需求对齐。待定模块没有业务数据写入、审核状态或模拟完成度；确认后先更新需求文档，再进入开发。</p></div><strong>{items.length} 个规划项</strong></section>
    <section className="roadmap-grid">{items.map((item) => <article className="panel" id={item.code} key={item.code}><span className="eyebrow">{item.code}</span><h2>{item.title}</h2><p>{item.scope}</p><small>{item.boundary}</small><span className={`state-pill ${item.tone}`}>{item.status}</span></article>)}</section>
  </AdminShell>;
}
