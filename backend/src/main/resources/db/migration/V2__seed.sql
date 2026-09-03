-- Converted Alpha seed data
SET NAMES utf8mb4;
INSERT IGNORE INTO events (id,code,slug,name,short_name,`year`,city,country,timezone,start_at,end_at,status,owner_name,version,created_at,updated_at) VALUES
('evt-morocco-2026','CFE-MA-2026','2026-morocco','2026年中国-非洲经贸博览会走进非洲（摩洛哥专场）','摩洛哥专场',2026,'卡萨布兰卡','摩洛哥','Africa/Casablanca','2026-11-18T09:00:00+01:00','2026-11-20T18:00:00+01:00','PREPARING','李敏',3,'2026-08-20T09:00:00+08:00','2026-08-28T10:30:00+08:00');

UPDATE events SET owner_account_id='employee-limin',event_type='EXHIBITION',venue_text='卡萨布兰卡国际会展中心',languages_json='["zh-CN","en","fr","ar"]' WHERE id='evt-morocco-2026';

INSERT IGNORE INTO employee_accounts (id,name,mobile,email,status,last_login_at,created_at,updated_at) VALUES
('employee-limin','李敏','15000000001','limin@example.local','ACTIVE',NULL,'2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00'),
('employee-wangshan','王珊','15000000002','wangshan@example.local','ACTIVE',NULL,'2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00'),
('employee-zhaoqiang','赵强','15000000003','zhaoqiang@example.local','ACTIVE',NULL,'2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00'),
('employee-chenwei','陈伟','15000000004','chenwei@example.local','ACTIVE',NULL,'2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00');

UPDATE employee_accounts SET group_role='GROUP_ADMIN' WHERE id='employee-limin';

INSERT IGNORE INTO event_members (id,event_id,account_id,role_code,permissions_json,is_reviewer,status,joined_at,created_at,updated_at) VALUES
('member-morocco-limin','evt-morocco-2026','employee-limin','EVENT_ADMIN','["event.*","review.*","portal.withdraw"]',1,'ACTIVE','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00'),
('member-morocco-wangshan','evt-morocco-2026','employee-wangshan','CONTENT_EDITOR','["portal.edit","content.edit","review.submit"]',0,'ACTIVE','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00'),
('member-morocco-zhaoqiang','evt-morocco-2026','employee-zhaoqiang','REVIEWER','["review.approve","review.return"]',1,'ACTIVE','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00'),
('member-morocco-chenwei','evt-morocco-2026','employee-chenwei','OPERATIONS','["registration.manage","exhibitor.manage","checkin.execute"]',0,'ACTIVE','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00');

INSERT IGNORE INTO event_features (id,event_id,feature_code,enabled,config_json,updated_by,created_at,updated_at) VALUES
('feature-morocco-portal','evt-morocco-2026','PORTAL',1,'{}','李敏','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00'),
('feature-morocco-registration','evt-morocco-2026','REGISTRATION',1,'{}','李敏','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00'),
('feature-morocco-exhibitor','evt-morocco-2026','EXHIBITOR',1,'{}','李敏','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00'),
('feature-morocco-matching','evt-morocco-2026','MATCHING',0,'{"mode":"TBD"}','李敏','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00');

INSERT IGNORE INTO registration_activities (id,event_id,name,review_mode,form_version,status,created_at,updated_at) VALUES
('reg-main','evt-morocco-2026','专业观众报名','STAFF_REVIEW',3,'OPEN','2026-08-20T09:30:00+08:00','2026-08-28T10:00:00+08:00');

UPDATE registration_activities SET
description='面向专业观众、采购商和合作机构开放的线下活动报名。',
timezone='Africa/Casablanca',
start_at='2026-11-18T09:00:00+01:00',
end_at='2026-11-20T18:00:00+01:00',
registration_start_at='2026-08-20T09:00:00+08:00',
registration_end_at='2026-11-17T18:00:00+01:00',
quota=15000,
location_name='卡萨布兰卡 · 摩洛哥',
allow_edit=1,
show_in_portal=1,
is_private=0,
form_schema_json='{"fields":[{"id":"name","type":"text","label":"姓名","required":true,"system":true},{"id":"mobile","type":"mobile","label":"手机号码","required":true,"system":true},{"id":"email","type":"email","label":"电子邮箱","required":true,"system":true},{"id":"organization","type":"text","label":"公司名称","required":true,"system":true},{"id":"jobTitle","type":"text","label":"职位","required":true,"system":true},{"id":"country","type":"country","label":"国家/地区","required":true,"system":true},{"id":"interest","type":"single","label":"重点关注领域","required":true,"options":["技术装备","整车及汽配","医疗器械","新能源","消费品及服务贸易"]},{"id":"needs","type":"textarea","label":"合作需求","required":false}]}',
success_message='报名已提交。审核结果将通过您选择的联系方式通知。',
notification_json='{"registration":true,"review":true,"checkin":true,"reminder":true}'
WHERE id='reg-main';

INSERT IGNORE INTO registration_form_versions (id,activity_id,version_no,schema_json,change_summary,created_by,status,created_at,updated_at)
SELECT 'reg-form-v3','reg-main',3,form_schema_json,'Alpha初始专业观众报名表单','王珊','ACTIVE','2026-08-28T10:00:00+08:00','2026-08-28T10:00:00+08:00'
FROM registration_activities WHERE id='reg-main';

INSERT IGNORE INTO portal_pages VALUES
('page-home','evt-morocco-2026','home','展会首页','HOME','PUBLISHED','pv-home-2',2,'2026-08-20T10:00:00+08:00','2026-08-28T09:00:00+08:00');

INSERT IGNORE INTO portal_page_versions VALUES
('pv-home-2','evt-morocco-2026','page-home',2,'zh-CN','[{"type":"hero","title":"中非经贸合作的新通道"},{"type":"stats"},{"type":"agenda"},{"type":"map"}]','更新主视觉和报名入口','PUBLISHED','王珊','赵强','2026-08-27T16:00:00+08:00','2026-08-27T14:00:00+08:00','2026-08-27T16:00:00+08:00');

INSERT IGNORE INTO review_tasks VALUES
('review-001','evt-morocco-2026','门户内容','PORTAL_PAGE','page-home','pv-home-3','首页法语版本更新','王珊',NULL,'PENDING',NULL,'2026-08-28T09:20:00+08:00',NULL,'2026-08-28T09:20:00+08:00','2026-08-28T09:20:00+08:00'),
('review-002','evt-morocco-2026','展商资料','EVENT_EXHIBITOR','exhibitor-002',NULL,'Atlas Green 展商资料变更','陈伟',NULL,'PENDING',NULL,'2026-08-28T10:05:00+08:00',NULL,'2026-08-28T10:05:00+08:00','2026-08-28T10:05:00+08:00');

INSERT IGNORE INTO registration_records (id,event_id,activity_id,account_id,person_name,mobile_masked,country,organization,status,first_channel,submitted_at,version,created_at,updated_at) VALUES
('person-001','evt-morocco-2026','reg-main','account-001','张明','138****2048','中国','华南智能制造有限公司','APPROVED','微信公众号','2026-08-26T14:30:00+08:00',1,'2026-08-26T14:30:00+08:00','2026-08-27T09:10:00+08:00'),
('person-002','evt-morocco-2026','reg-main','account-002','Yasmine El Amrani','+212 6** *** 218','摩洛哥','Maghreb Trade Partners','PENDING','展会门户','2026-08-28T08:42:00+08:00',1,'2026-08-28T08:42:00+08:00','2026-08-28T08:42:00+08:00'),
('person-003','evt-morocco-2026','reg-main','account-003','刘青','186****7721','中国','湘非供应链服务有限公司','CHECKED_IN','定向邀请','2026-08-25T11:18:00+08:00',2,'2026-08-25T11:18:00+08:00','2026-08-28T10:18:00+08:00');

INSERT IGNORE INTO enterprises (id,name_zh,name_intl,country,registration_no,account_contact,status,created_at,updated_at) VALUES
('enterprise-001','华南智能制造有限公司','South China Intelligent Manufacturing Co., Ltd.','中国','CN-DEMO-001','138****2048','ACTIVE','2026-08-21T09:00:00+08:00','2026-08-27T09:00:00+08:00'),
('enterprise-002','阿特拉斯绿色科技','Atlas Green Technologies','摩洛哥','MA-DEMO-002','+212 6** *** 889','ACTIVE','2026-08-22T10:00:00+08:00','2026-08-28T09:50:00+08:00');

INSERT IGNORE INTO event_exhibitors (id,event_id,enterprise_id,qualification_status,publish_status,product_count,booth_no,source,version,created_at,updated_at) VALUES
('exhibitor-001','evt-morocco-2026','enterprise-001','APPROVED','PUBLISHED',6,'A-018','企业自助填报',2,'2026-08-21T09:30:00+08:00','2026-08-27T09:00:00+08:00'),
('exhibitor-002','evt-morocco-2026','enterprise-002','PENDING','PUBLISHED',4,'B-006','工作人员录入',3,'2026-08-22T10:30:00+08:00','2026-08-28T10:05:00+08:00');

UPDATE enterprises SET account_id='enterprise-account-001',industry='智能制造',contact_name='企业联络员A',contact_email_masked='co***@example.cn',website='https://example.cn',address='中国湖南长沙' WHERE id='enterprise-001';
UPDATE enterprises SET account_id='enterprise-account-002',industry='新能源',contact_name='企业联络员B',contact_email_masked='at***@example.ma',website='https://example.ma',address='摩洛哥卡萨布兰卡' WHERE id='enterprise-002';
UPDATE event_exhibitors SET category='技术装备',description='提供智能制造设备、工业自动化和跨境项目合作方案。',current_version_id='exhibitor-profile-001-v2' WHERE id='exhibitor-001';
UPDATE event_exhibitors SET category='新能源',description='面向北非市场的绿色能源技术与本地合作服务。',current_version_id=NULL,publish_status='DRAFT' WHERE id='exhibitor-002';

INSERT IGNORE INTO exhibitor_profile_versions VALUES
('exhibitor-profile-001-v2','evt-morocco-2026','exhibitor-001',2,'{"nameZh":"华南智能制造有限公司","nameIntl":"South China Intelligent Manufacturing Co., Ltd.","category":"技术装备","country":"中国","description":"提供智能制造设备、工业自动化和跨境项目合作方案。","publicContact":false}','PUBLISHED','企业账号','赵强','2026-08-27T09:00:00+08:00','2026-08-26T09:00:00+08:00','2026-08-27T09:00:00+08:00'),
('exhibitor-profile-002-v2','evt-morocco-2026','exhibitor-002',2,'{"nameZh":"阿特拉斯绿色科技","nameIntl":"Atlas Green Technologies","category":"新能源","country":"摩洛哥","description":"面向北非市场的绿色能源技术与本地合作服务。","publicContact":false}','PUBLISHED','工作人员','赵强','2026-08-27T10:00:00+08:00','2026-08-26T10:00:00+08:00','2026-08-27T10:00:00+08:00');

UPDATE exhibitor_profile_versions SET review_status='PENDING',approved_by=NULL,published_at=NULL WHERE id='exhibitor-profile-002-v2';

INSERT IGNORE INTO products VALUES
('product-001','evt-morocco-2026','exhibitor-001','工业协作机器人','技术装备','PUBLISHED','product-001-v1','2026-08-26T09:00:00+08:00','2026-08-27T09:00:00+08:00'),
('product-002','evt-morocco-2026','exhibitor-002','微电网储能系统','新能源','PUBLISHED','product-002-v1','2026-08-26T10:00:00+08:00','2026-08-27T10:00:00+08:00');

INSERT IGNORE INTO product_versions VALUES
('product-001-v1','product-001',1,'{"name":"工业协作机器人","category":"技术装备","summary":"适用于柔性制造和现场演示的协作机器人方案。","images":[]}','PUBLISHED','企业账号','赵强','2026-08-27T09:00:00+08:00','2026-08-26T09:00:00+08:00','2026-08-27T09:00:00+08:00'),
('product-002-v1','product-002',1,'{"name":"微电网储能系统","category":"新能源","summary":"面向园区和离网场景的模块化储能方案。","images":[]}','PUBLISHED','企业账号','赵强','2026-08-27T10:00:00+08:00','2026-08-26T10:00:00+08:00','2026-08-27T10:00:00+08:00');

INSERT IGNORE INTO inquiries (id,event_id,event_exhibitor_id,product_id,customer_name,contact_masked,content,status,handled_by,handled_at,created_at,updated_at) VALUES
('inquiry-001','evt-morocco-2026','exhibitor-001','product-001','Alpha采购访客','139****5678','希望在展会现场进一步了解交付周期和本地服务。','NEW',NULL,NULL,'2026-08-28T09:00:00+08:00','2026-08-28T09:00:00+08:00');

UPDATE inquiries SET contact_private='13900005678' WHERE id='inquiry-001' AND contact_private='';
UPDATE inquiries SET contact_private='buyer@example.com' WHERE id='inquiry-3c852bd2-0995-4b9e-9a04-2f9c0526ea1e' AND contact_private='';


INSERT IGNORE INTO agendas (id,event_id,name,timezone,status,current_version_id,created_at,updated_at)
SELECT 'agenda-morocco-main','evt-morocco-2026','大会日程','Africa/Casablanca','DRAFT',NULL,'2026-08-28T00:00:00.000Z','2026-08-28T00:00:00.000Z'
WHERE EXISTS (SELECT 1 FROM events WHERE id='evt-morocco-2026');

INSERT IGNORE INTO enterprise_accounts (id,enterprise_id,display_name,status,last_login_at,created_at,updated_at)
SELECT account_id,id,CASE WHEN contact_name='' THEN name_zh ELSE contact_name END,'ACTIVE',NULL,created_at,updated_at
FROM enterprises WHERE account_id IS NOT NULL;

INSERT IGNORE INTO enterprise_identities (id,account_id,identity_type,normalized_value,display_masked,verified_at,created_at) VALUES
('enterprise-identity-demo-cn','enterprise-account-001','CN_MOBILE','13800002048','138****2048','2026-08-28T00:00:00.000Z','2026-08-28T00:00:00.000Z'),
('enterprise-identity-demo-ma','enterprise-account-002','INTL_MOBILE','+212600000889','+212 *** 889','2026-08-28T00:00:00.000Z','2026-08-28T00:00:00.000Z');

INSERT IGNORE INTO events (id,code,slug,name,short_name,`year`,city,country,timezone,start_at,end_at,status,owner_name,owner_account_id,event_type,venue_text,languages_json,version,created_at,updated_at) VALUES
('evt-africa-2025-history','CFE-AF-2025-HISTORY','2025-africa-history','2025年中国—非洲经贸合作交流活动（历史演示）','非洲经贸交流活动',2025,'内罗毕','肯尼亚','Africa/Nairobi','2025-09-18T09:00:00+03:00','2025-09-19T18:00:00+03:00','ARCHIVED','李敏','employee-limin','INTERNAL_ACTIVITY','内罗毕会议中心','["zh-CN","en"]',1,'2025-01-10T00:00:00.000Z','2025-10-01T00:00:00.000Z');

INSERT IGNORE INTO event_exhibitors (id,event_id,enterprise_id,qualification_status,publish_status,category,description,current_version_id,product_count,booth_no,source,version,created_at,updated_at) VALUES
('exhibitor-001-history','evt-africa-2025-history','enterprise-001','APPROVED','PUBLISHED','技术装备','2025届独立参展资料，用于验证企业账号历届管理。','exhibitor-profile-001-history-v1',1,'H-012','历史数据直接录入',1,'2025-02-01T00:00:00.000Z','2025-09-20T00:00:00.000Z');

INSERT IGNORE INTO exhibitor_profile_versions (id,event_id,event_exhibitor_id,version_no,profile_json,review_status,submitted_by,approved_by,published_at,created_at,updated_at) VALUES
('exhibitor-profile-001-history-v1','evt-africa-2025-history','exhibitor-001-history',1,'{"nameZh":"华南智能制造有限公司","nameIntl":"South China Intelligent Manufacturing Co., Ltd.","category":"技术装备","country":"中国","description":"2025届独立参展资料，用于验证历届展会事实隔离。","website":"https://example.cn","publicContact":false}','PUBLISHED','企业账号：企业联络员A','赵强','2025-03-01T00:00:00.000Z','2025-02-01T00:00:00.000Z','2025-03-01T00:00:00.000Z');

INSERT IGNORE INTO products (id,event_id,event_exhibitor_id,name,category,publish_status,current_version_id,created_at,updated_at) VALUES
('product-001-history','evt-africa-2025-history','exhibitor-001-history','柔性制造单元（2025届）','技术装备','PUBLISHED','product-001-history-v1','2025-02-02T00:00:00.000Z','2025-03-02T00:00:00.000Z');

INSERT IGNORE INTO product_versions (id,product_id,version_no,content_json,review_status,submitted_by,approved_by,published_at,created_at,updated_at) VALUES
('product-001-history-v1','product-001-history',1,'{"name":"柔性制造单元（2025届）","category":"技术装备","summary":"仅属于2025届的独立产品资料。","images":[]}','PUBLISHED','企业账号：企业联络员A','赵强','2025-03-02T00:00:00.000Z','2025-02-02T00:00:00.000Z','2025-03-02T00:00:00.000Z');

INSERT IGNORE INTO registration_access_codes (id,record_id,code,status,issued_at,updated_at)
SELECT CONCAT('access-', id),id,CONCAT('EXPO-', UPPER(SUBSTR(REPLACE(UUID(),'-',''),1,16))),'ACTIVE',created_at,updated_at FROM registration_records;

INSERT INTO registration_profile_versions (
  id, record_id, version_no, values_json, changed_fields_json, review_status,
  submitted_by, approved_by, review_reason, published_at, created_at, updated_at
)
SELECT
  CONCAT('registration-profile-initial-', id),
  id,
  version,
  answers_json,
  '[]',
  CASE WHEN status IN ('APPROVED', 'CHECKED_IN') THEN 'PUBLISHED' WHEN status = 'REJECTED' THEN 'RETURNED' ELSE 'PENDING' END,
  person_name,
  NULL,
  review_reason,
  CASE WHEN status IN ('APPROVED', 'CHECKED_IN') THEN updated_at ELSE NULL END,
  created_at,
  updated_at
FROM registration_records;

UPDATE demand_supply_posts
SET publisher_enterprise_id = (SELECT id FROM enterprises WHERE enterprises.name_zh = demand_supply_posts.publisher_name LIMIT 1)
WHERE publisher_enterprise_id IS NULL;

UPDATE appointments
SET inviter_enterprise_id = (SELECT id FROM enterprises WHERE enterprises.name_zh = appointments.inviter_name LIMIT 1),
    invitee_enterprise_id = (SELECT id FROM enterprises WHERE enterprises.name_zh = appointments.invitee_name LIMIT 1)
WHERE inviter_enterprise_id IS NULL OR invitee_enterprise_id IS NULL;

INSERT IGNORE INTO person_masters (id, display_name, status, merged_into_person_id, created_at, updated_at)
SELECT CONCAT('person-master-', id), display_name, 'ACTIVE', NULL, created_at, updated_at FROM public_accounts;

UPDATE public_accounts SET person_master_id = CONCAT('person-master-', id) WHERE person_master_id IS NULL;

INSERT IGNORE INTO metric_definitions VALUES ('registration.records','报名记录','当前范围内报名事实总数；重复报名保留','条','GROUP_AND_EVENT','HOURLY','1.0','数据运营','ACTIVE','2026-08-29T00:00:00.000Z','2026-08-29T00:00:00.000Z');

INSERT IGNORE INTO metric_definitions VALUES ('registration.unique_accounts','去重报名账号','按公众账号ID去重的报名人数','人','GROUP_AND_EVENT','HOURLY','1.0','数据运营','ACTIVE','2026-08-29T00:00:00.000Z','2026-08-29T00:00:00.000Z');

INSERT IGNORE INTO metric_definitions VALUES ('registration.checked_in','已签到报名','当前状态为CHECKED_IN的报名事实','条','GROUP_AND_EVENT','HOURLY','1.0','现场运营','ACTIVE','2026-08-29T00:00:00.000Z','2026-08-29T00:00:00.000Z');

INSERT IGNORE INTO metric_definitions VALUES ('exhibitor.approved','资格通过企业','参展资格状态为APPROVED的本届企业事实','家','GROUP_AND_EVENT','HOURLY','1.0','展商运营','ACTIVE','2026-08-29T00:00:00.000Z','2026-08-29T00:00:00.000Z');

INSERT IGNORE INTO metric_definitions VALUES ('matching.appointments','预约记录','当前范围内全部线下面谈预约事实','条','GROUP_AND_EVENT','HOURLY','1.0','合作洽谈','ACTIVE','2026-08-29T00:00:00.000Z','2026-08-29T00:00:00.000Z');

INSERT IGNORE INTO metric_definitions VALUES ('message.success_rate','消息成功率','成功回执数除以全部回执数；无回执时为0','%','GROUP_AND_EVENT','HOURLY','1.0','消息运营','ACTIVE','2026-08-29T00:00:00.000Z','2026-08-29T00:00:00.000Z');

INSERT IGNORE INTO report_definitions VALUES ('report-event-operations','EVENT_OPERATIONS_SNAPSHOT','展会运营事实对照表','按年度或展会输出报名、账号、签到、企业、询盘与预约','GROUP_AND_EVENT','CSV','["eventCode","eventName","`year`","status","registrationRecords","uniqueAccounts","checkedIn","approvedExhibitors","inquiries","appointments"]','ACTIVE','数据运营','2026-08-29T00:00:00.000Z','2026-08-29T00:00:00.000Z');
