export type PortalTheme = {
  primary: string;
  accent: string;
  surface: string;
  cornerStyle: 'rounded' | 'square';
};

export type PortalNavItem = {
  id: string;
  label: string;
  anchor: string;
  visible: boolean;
};

export type PortalSitePage = {
  id: string;
  label: string;
  path: string;
  description: string;
  visible: boolean;
};

export type PortalBlock = {
  id: string;
  type: 'hero' | 'intro' | 'stats' | 'agenda' | 'industries' | 'enterpriseList' | 'map' | 'download' | 'contact' | 'html';
  name: string;
  visible: boolean;
  props: Record<string, unknown>;
};

export type PortalDocument = {
  schemaVersion: 1;
  language: string;
  direction?: 'ltr' | 'rtl';
  translation?: {
    sourceLanguage: string;
    sourceVersionId: string;
    sourceSha256: string;
    provider: string;
    model: string;
    promptVersion: string;
    generatedByAi: boolean;
  };
  theme: PortalTheme;
  nav: PortalNavItem[];
  sitePages?: PortalSitePage[];
  blocks: PortalBlock[];
};

export const DEFAULT_PORTAL_SITE_PAGES: PortalSitePage[] = [
  { id: 'page-registration', label: '观众报名', path: '/register/reg-main', description: '读取后台指定报名活动的表单与审核规则', visible: true },
  { id: 'page-agenda', label: '完整议程', path: '/agenda', description: '读取已审核发布的议程版本', visible: true },
  { id: 'page-news', label: '新闻资讯', path: '/news', description: '读取内容资料中的已发布新闻', visible: true },
  { id: 'page-exhibitors', label: '参展企业', path: '/exhibitors', description: '读取已审核且已发布的企业与产品', visible: true },
  { id: 'page-documents', label: '资料下载', path: '/documents', description: '按公开、登录、指定报名三种权限提供资料', visible: true },
  { id: 'page-matching', label: '供需洽谈', path: '/matching', description: '读取已发布供需并提供线下面谈预约', visible: true },
];

export function parsePortalDocument(value: string | unknown): PortalDocument {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray((parsed as PortalDocument).blocks)) {
      return parsed as PortalDocument;
    }
  } catch {
    // Legacy or damaged layouts fall back to the checked-in Alpha template.
  }
  return structuredClone(DEFAULT_PORTAL_DOCUMENT);
}

export const DEFAULT_PORTAL_DOCUMENT: PortalDocument = {
  schemaVersion: 1,
  language: 'zh-CN',
  theme: { primary: '#073d34', accent: '#d86e52', surface: '#f7f4ed', cornerStyle: 'square' },
  nav: [
    { id: 'nav-about', label: '展会概况', anchor: 'about', visible: true },
    { id: 'nav-stats', label: '展会数据', anchor: 'stats', visible: true },
    { id: 'nav-agenda', label: '活动日程', anchor: 'agenda', visible: true },
    { id: 'nav-industries', label: '展品范围', anchor: 'industries', visible: true },
    { id: 'nav-contact', label: '联系我们', anchor: 'contact', visible: true },
  ],
  sitePages: structuredClone(DEFAULT_PORTAL_SITE_PAGES),
  blocks: [
    { id: 'hero-main', type: 'hero', name: '海报与展会介绍', visible: true, props: { kicker: '2026 · MOROCCO · CASABLANCA', title: '中国—非洲经贸博览会', accentTitle: '走进非洲 · 摩洛哥专场', description: '连接中国与北非市场，汇聚企业、机构与专业观众，创造线下经贸合作的新机会。', primaryLabel: '观众报名', primaryHref: '/exhibition/2026-morocco/register/reg-main', secondaryLabel: '展商入驻', secondaryHref: '#contact' } },
    { id: 'intro-main', type: 'intro', name: '展会介绍', visible: true, props: { kicker: 'ABOUT THE EVENT', title: '面向实体展会的国际经贸合作平台', body: '为推动中非经贸博览会成果落实，进一步提升博览会在非洲的品牌力和影响力，活动将在摩洛哥卡萨布兰卡举办，并组织企业展示、产业推介和线下洽谈。', facts: [{ label: '举办城市', value: '卡萨布兰卡' }, { label: '活动日期', value: '2026年6月10—12日' }, { label: '页面语言', value: '中文 · English · Français' }] } },
    { id: 'stats-main', type: 'stats', name: '数据展示', visible: true, props: { title: '展会数据', items: [{ label: '展示面积（㎡）', value: '7,000' }, { label: '参展商家', value: '250' }, { label: '专业观众', value: '15,000' }] } },
    { id: 'agenda-main', type: 'agenda', name: '会议议程', visible: true, props: { kicker: 'PROGRAMME', title: '三日议程', description: '聚焦现代产业链合作，组织政府、企业和专业机构开展推介与线下交流。', items: [{ day: '06月10日', time: '18:30—19:30', title: '开幕式暨中国—摩洛哥经贸合作对接会' }, { day: '06月11日', time: '09:30—17:30', title: '产业推介与企业对接' }, { day: '06月12日', time: '09:00—16:30', title: '项目考察与合作发布' }] } },
    { id: 'industries-main', type: 'industries', name: '展品范围', visible: true, props: { kicker: 'EXHIBITION SCOPE', title: '重点展品范围', items: ['技术装备', '整车及汽配', '医疗器械', '矿业合作', '消费品及服务贸易', '农产品及食品', '新能源', '建筑建材', '摩洛哥企业'] } },
    { id: 'enterprise-main', type: 'enterpriseList', name: '推荐企业', visible: true, props: { kicker: 'EXHIBITORS', title: '推荐参展企业', limit: 4 } },
    { id: 'map-main', type: 'map', name: '参会地址', visible: true, props: { kicker: 'VENUE', title: '卡萨布兰卡 · 摩洛哥', address: '具体展馆及交通信息由工作人员在后台维护', latitude: 33.5731, longitude: -7.5898 } },
    { id: 'contact-main', type: 'contact', name: '联系我们', visible: true, props: { kicker: 'JOIN THE EVENT', title: '报名参加摩洛哥专场', description: '公开页面可匿名浏览，报名与互动功能将根据活动规则要求登录。', primaryLabel: '进入观众报名', primaryHref: '/exhibition/2026-morocco/register/reg-main', secondaryLabel: '申请参展', secondaryHref: '#contact' } },
  ],
};
