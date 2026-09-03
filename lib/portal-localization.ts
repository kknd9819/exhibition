import type { PortalBlock, PortalDocument } from '@/lib/portal-types';

export const languageMeta: Record<string, { label: string; short: string; direction: 'ltr' | 'rtl' }> = {
  'zh-CN': { label: '中文', short: '中', direction: 'ltr' },
  en: { label: 'English', short: 'EN', direction: 'ltr' },
  fr: { label: 'Français', short: 'FR', direction: 'ltr' },
  ar: { label: 'العربية', short: 'AR', direction: 'rtl' },
};

const exact: Record<string, Record<string, string>> = {
  en: {
    '展会概况': 'About', '展会数据': 'Event data', '活动日程': 'Programme', '展品范围': 'Exhibition scope', '联系我们': 'Contact us',
    '中国—非洲经贸博览会': 'China–Africa Economic and Trade Expo', '走进非洲 · 摩洛哥专场': 'Into Africa · Morocco Session',
    '连接中国与北非市场，汇聚企业、机构与专业观众，创造线下经贸合作的新机会。': 'Connecting China with North African markets and bringing together companies, institutions and professional visitors for new face-to-face trade opportunities.',
    '观众报名': 'Visitor registration', '展商入驻': 'Exhibitor application', '面向实体展会的国际经贸合作平台': 'An international trade platform built for an in-person exhibition',
    '为推动中非经贸博览会成果落实，进一步提升博览会在非洲的品牌力和影响力，活动将在摩洛哥卡萨布兰卡举办，并组织企业展示、产业推介和线下洽谈。': 'The event in Casablanca advances China–Africa Expo outcomes through company showcases, industry promotion and scheduled face-to-face meetings.',
    '举办城市': 'Host city', '卡萨布兰卡': 'Casablanca', '活动日期': 'Event dates', '页面语言': 'Languages', '展示面积（㎡）': 'Exhibition area (m²)', '参展商家': 'Exhibitors', '专业观众': 'Professional visitors',
    '三日议程': 'Three-day programme', '重点展品范围': 'Priority sectors', '推荐参展企业': 'Featured exhibitors', '参会地址': 'Venue', '报名参加摩洛哥专场': 'Join the Morocco session', '进入观众报名': 'Register as a visitor', '申请参展': 'Apply to exhibit',
    '聚焦现代产业链合作，组织政府、企业和专业机构开展推介与线下交流。': 'Focusing on modern industrial-chain cooperation through presentations and face-to-face exchanges among governments, companies and professional institutions.',
    '开幕式暨中国—摩洛哥经贸合作对接会': 'Opening ceremony and China–Morocco trade matchmaking', '产业推介与企业对接': 'Industry promotion and business matchmaking', '项目考察与合作发布': 'Project visits and cooperation announcements',
    '具体展馆及交通信息由工作人员在后台维护': 'Venue and transport details are maintained by event staff.', '公开页面可匿名浏览，报名与互动功能将根据活动规则要求登录。': 'Public pages can be viewed anonymously; registration and interaction require sign-in according to event rules.', '资料下载': 'Downloads', '请上传PDF并配置公开或受限访问策略': 'Upload a PDF and configure public or restricted access.',
    '中文 · English · Français': '中文 · English · Français',
    '技术装备': 'Industrial equipment', '整车及汽配': 'Vehicles and auto parts', '医疗器械': 'Medical devices', '矿业合作': 'Mining cooperation', '消费品及服务贸易': 'Consumer goods and services', '农产品及食品': 'Agriculture and food', '新能源': 'New energy', '建筑建材': 'Construction materials', '摩洛哥企业': 'Moroccan companies',
  },
  fr: {
    '展会概况': 'Présentation', '展会数据': 'Chiffres clés', '活动日程': 'Programme', '展品范围': "Secteurs d’exposition", '联系我们': 'Nous contacter',
    '中国—非洲经贸博览会': 'Exposition économique et commerciale Chine–Afrique', '走进非洲 · 摩洛哥专场': 'En Afrique · Édition Maroc',
    '连接中国与北非市场，汇聚企业、机构与专业观众，创造线下经贸合作的新机会。': "Relier la Chine aux marchés d’Afrique du Nord et réunir entreprises, institutions et visiteurs professionnels pour de nouvelles coopérations en présentiel.",
    '观众报名': 'Inscription visiteurs', '展商入驻': 'Devenir exposant', '面向实体展会的国际经贸合作平台': 'Une plateforme internationale dédiée aux salons professionnels en présentiel',
    '为推动中非经贸博览会成果落实，进一步提升博览会在非洲的品牌力和影响力，活动将在摩洛哥卡萨布兰卡举办，并组织企业展示、产业推介和线下洽谈。': "Organisé à Casablanca, l’événement valorise les résultats de l’Exposition Chine–Afrique à travers des présentations d’entreprises, des promotions sectorielles et des rendez-vous en présentiel.",
    '举办城市': 'Ville hôte', '卡萨布兰卡': 'Casablanca', '活动日期': 'Dates', '页面语言': 'Langues', '展示面积（㎡）': "Surface d’exposition (m²)", '参展商家': 'Exposants', '专业观众': 'Visiteurs professionnels',
    '三日议程': 'Programme sur trois jours', '重点展品范围': 'Secteurs prioritaires', '推荐参展企业': 'Exposants recommandés', '参会地址': 'Lieu', '报名参加摩洛哥专场': "Participer à l’édition Maroc", '进入观众报名': "S’inscrire comme visiteur", '申请参展': 'Demander un stand',
    '聚焦现代产业链合作，组织政府、企业和专业机构开展推介与线下交流。': 'Le programme réunit gouvernements, entreprises et institutions professionnelles autour des chaînes industrielles modernes et des échanges en présentiel.',
    '开幕式暨中国—摩洛哥经贸合作对接会': 'Cérémonie d’ouverture et rencontres économiques Chine–Maroc', '产业推介与企业对接': 'Présentation sectorielle et rencontres B2B', '项目考察与合作发布': 'Visites de projets et annonces de coopération',
    '具体展馆及交通信息由工作人员在后台维护': "Les informations sur le lieu et les transports sont mises à jour par l’équipe de l’événement.", '公开页面可匿名浏览，报名与互动功能将根据活动规则要求登录。': "Les pages publiques sont accessibles sans compte ; l’inscription et les interactions nécessitent une connexion selon les règles de l’événement.", '资料下载': 'Téléchargements', '请上传PDF并配置公开或受限访问策略': "Téléversez un PDF et configurez un accès public ou restreint.",
    '中文 · English · Français': '中文 · English · Français', '摩洛哥': 'Maroc',
    '技术装备': 'Équipements industriels', '整车及汽配': 'Véhicules et pièces automobiles', '医疗器械': 'Dispositifs médicaux', '矿业合作': 'Coopération minière', '消费品及服务贸易': 'Biens de consommation et services', '农产品及食品': 'Agriculture et alimentation', '新能源': 'Énergies nouvelles', '建筑建材': 'Construction et matériaux', '摩洛哥企业': 'Entreprises marocaines',
  },
  ar: {
    '展会概况': 'عن المعرض', '展会数据': 'بيانات المعرض', '活动日程': 'البرنامج', '展品范围': 'مجالات العرض', '联系我们': 'اتصل بنا',
    '中国—非洲经贸博览会': 'المعرض الاقتصادي والتجاري الصيني الأفريقي', '走进非洲 · 摩洛哥专场': 'إلى أفريقيا · دورة المغرب',
    '连接中国与北非市场，汇聚企业、机构与专业观众，创造线下经贸合作的新机会。': 'ربط الصين بأسواق شمال أفريقيا وجمع الشركات والمؤسسات والزوار المهنيين لخلق فرص تعاون تجاري جديدة وجهاً لوجه.',
    '观众报名': 'تسجيل الزوار', '展商入驻': 'طلب العارضين', '面向实体展会的国际经贸合作平台': 'منصة دولية للتعاون التجاري في معرض حضوري',
    '举办城市': 'المدينة المضيفة', '卡萨布兰卡': 'الدار البيضاء', '活动日期': 'تاريخ الفعالية', '页面语言': 'لغات الصفحة', '展示面积（㎡）': 'مساحة العرض (م²)', '参展商家': 'العارضون', '专业观众': 'الزوار المهنيون',
    '三日议程': 'برنامج ثلاثة أيام', '重点展品范围': 'القطاعات الرئيسية', '推荐参展企业': 'عارضون مختارون', '参会地址': 'الموقع', '报名参加摩洛哥专场': 'شارك في دورة المغرب', '进入观众报名': 'تسجيل الزوار', '申请参展': 'طلب المشاركة',
    '聚焦现代产业链合作，组织政府、企业和专业机构开展推介与线下交流。': 'يركز البرنامج على تعاون سلاسل الصناعة الحديثة ويجمع الحكومات والشركات والمؤسسات المهنية في عروض ولقاءات حضورية.',
    '开幕式暨中国—摩洛哥经贸合作对接会': 'حفل الافتتاح ولقاءات الأعمال الصينية المغربية', '产业推介与企业对接': 'عرض القطاعات ولقاءات الشركات', '项目考察与合作发布': 'زيارات المشاريع وإعلانات التعاون',
    '具体展馆及交通信息由工作人员在后台维护': 'يحدّث فريق الفعالية معلومات القاعة ووسائل النقل.', '公开页面可匿名浏览，报名与互动功能将根据活动规则要求登录。': 'يمكن تصفح الصفحات العامة دون حساب، بينما يتطلب التسجيل والتفاعل تسجيل الدخول وفق قواعد الفعالية.', '资料下载': 'التنزيلات', '请上传PDF并配置公开或受限访问策略': 'حمّل ملف PDF وحدد الوصول العام أو المقيّد.',
    '中文 · English · Français': '中文 · English · Français', '摩洛哥': 'المغرب',
    '技术装备': 'المعدات الصناعية', '整车及汽配': 'المركبات وقطع الغيار', '医疗器械': 'الأجهزة الطبية', '新能源': 'الطاقة الجديدة', '建筑建材': 'البناء ومواد البناء', '摩洛哥企业': 'الشركات المغربية',
  },
};

const translatedKeys = new Set(['title', 'accentTitle', 'description', 'body', 'label', 'value', 'day', 'time', 'address', 'primaryLabel', 'secondaryLabel', 'name']);
const longTextKeys = new Set(['description', 'body']);

function translateText(value: string, language: string) {
  if (!value.trim() || /^https?:|^#|^\/|^#[0-9a-f]{3,8}$/i.test(value)) return value;
  if (!/[\u3400-\u9fff]/.test(value)) return value;
  const fullDate = value.match(/^(\d{4})年(\d{1,2})月(\d{1,2})[—-](\d{1,2})日$/);
  if (fullDate) return language === 'fr' ? `${fullDate[3]}–${fullDate[4]} juin ${fullDate[1]}` : language === 'ar' ? `${fullDate[3]}–${fullDate[4]} يونيو ${fullDate[1]}` : `${fullDate[1]}-${fullDate[2].padStart(2, '0')}-${fullDate[3].padStart(2, '0')}—${fullDate[1]}-${fullDate[2].padStart(2, '0')}-${fullDate[4].padStart(2, '0')}`;
  const monthDay = value.match(/^(\d{1,2})月(\d{1,2})日$/);
  if (monthDay) return language === 'fr' ? `${monthDay[2]} juin` : language === 'ar' ? `${monthDay[2]} يونيو` : `Jun ${monthDay[2]}`;
  const dictionary = exact[language] ?? {};
  if (dictionary[value]) return dictionary[value];
  let translated = value;
  for (const [source, target] of Object.entries(dictionary).sort((a, b) => b[0].length - a[0].length)) translated = translated.split(source).join(target);
  if (translated !== value) return translated;
  const prefix = language === 'fr' ? 'Traduction IA : ' : language === 'ar' ? 'ترجمة آلية: ' : 'AI translation: ';
  return `${prefix}${value}`;
}

function translateValue(value: unknown, language: string, key = ''): unknown {
  if (typeof value === 'string') return translatedKeys.has(key) ? translateText(value, language) : value;
  if (Array.isArray(value)) return value.map((item) => typeof item === 'string' ? translateText(item, language) : translateValue(item, language));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([childKey, child]) => [childKey, translateValue(child, language, childKey)]));
  return value;
}

function translateBlock(block: PortalBlock, language: string): PortalBlock {
  const props = translateValue(block.props, language) as Record<string, unknown>;
  const aiFields = Object.keys(block.props).filter((key) => longTextKeys.has(key) && typeof block.props[key] === 'string' && String(block.props[key]).length >= 24);
  return { ...block, name: translateText(block.name, language), props: { ...props, __aiTranslatedFields: aiFields } };
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function localAiTranslatePortal(source: PortalDocument, sourceVersionId: string, targetLanguage: string) {
  const sourceSha256 = await sha256(JSON.stringify(source));
  const meta = languageMeta[targetLanguage] ?? { direction: 'ltr' as const };
  const document: PortalDocument = {
    ...structuredClone(source),
    language: targetLanguage,
    direction: meta.direction,
    translation: { sourceLanguage: source.language, sourceVersionId, sourceSha256, provider: 'LOCAL_ALPHA_SIMULATOR', model: 'alpha-dictionary-v1', promptVersion: 'portal-v1', generatedByAi: true },
    nav: source.nav.map((item) => ({ ...item, label: translateText(item.label, targetLanguage) })),
    blocks: source.blocks.map((block) => translateBlock(block, targetLanguage)),
  };
  return { document, sourceSha256, provider: 'LOCAL_ALPHA_SIMULATOR', model: 'alpha-dictionary-v1', promptVersion: 'portal-v1' };
}
