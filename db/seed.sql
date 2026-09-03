INSERT OR IGNORE INTO events (id,code,slug,name,short_name,year,city,country,timezone,start_at,end_at,status,owner_name,version,created_at,updated_at) VALUES
('evt-morocco-2026','CFE-MA-2026','2026-morocco','2026年中国-非洲经贸博览会走进非洲（摩洛哥专场）','摩洛哥专场',2026,'卡萨布兰卡','摩洛哥','Africa/Casablanca','2026-11-18T09:00:00+01:00','2026-11-20T18:00:00+01:00','PREPARING','李敏',3,'2026-08-20T09:00:00+08:00','2026-08-28T10:30:00+08:00');

UPDATE events SET owner_account_id='employee-limin',event_type='EXHIBITION',venue_text='卡萨布兰卡国际会展中心',languages_json='["zh-CN","en","fr","ar"]' WHERE id='evt-morocco-2026';

INSERT OR IGNORE INTO employee_accounts (id,name,mobile,email,status,last_login_at,created_at,updated_at) VALUES
('employee-limin','李敏','15000000001','limin@example.local','ACTIVE',NULL,'2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00'),
('employee-wangshan','王珊','15000000002','wangshan@example.local','ACTIVE',NULL,'2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00'),
('employee-zhaoqiang','赵强','15000000003','zhaoqiang@example.local','ACTIVE',NULL,'2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00'),
('employee-chenwei','陈伟','15000000004','chenwei@example.local','ACTIVE',NULL,'2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00');

UPDATE employee_accounts SET group_role='GROUP_ADMIN' WHERE id='employee-limin';

INSERT OR IGNORE INTO event_members (id,event_id,account_id,role_code,permissions_json,is_reviewer,status,joined_at,created_at,updated_at) VALUES
('member-morocco-limin','evt-morocco-2026','employee-limin','EVENT_ADMIN','["event.*","review.*","portal.withdraw"]',1,'ACTIVE','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00'),
('member-morocco-wangshan','evt-morocco-2026','employee-wangshan','CONTENT_EDITOR','["portal.edit","content.edit","review.submit"]',0,'ACTIVE','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00'),
('member-morocco-zhaoqiang','evt-morocco-2026','employee-zhaoqiang','REVIEWER','["review.approve","review.return"]',1,'ACTIVE','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00'),
('member-morocco-chenwei','evt-morocco-2026','employee-chenwei','OPERATIONS','["registration.manage","exhibitor.manage","checkin.execute"]',0,'ACTIVE','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00');

INSERT OR IGNORE INTO event_features (id,event_id,feature_code,enabled,config_json,updated_by,created_at,updated_at) VALUES
('feature-morocco-portal','evt-morocco-2026','PORTAL',1,'{}','李敏','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00'),
('feature-morocco-registration','evt-morocco-2026','REGISTRATION',1,'{}','李敏','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00'),
('feature-morocco-exhibitor','evt-morocco-2026','EXHIBITOR',1,'{}','李敏','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00'),
('feature-morocco-matching','evt-morocco-2026','MATCHING',0,'{"mode":"TBD"}','李敏','2026-08-20T09:00:00+08:00','2026-08-20T09:00:00+08:00');

INSERT OR IGNORE INTO registration_activities (id,event_id,name,review_mode,form_version,status,created_at,updated_at) VALUES
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

INSERT OR IGNORE INTO registration_form_versions (id,activity_id,version_no,schema_json,change_summary,created_by,status,created_at,updated_at)
SELECT 'reg-form-v3','reg-main',3,form_schema_json,'Alpha初始专业观众报名表单','王珊','ACTIVE','2026-08-28T10:00:00+08:00','2026-08-28T10:00:00+08:00'
FROM registration_activities WHERE id='reg-main';

INSERT OR IGNORE INTO portal_pages VALUES
('page-home','evt-morocco-2026','home','展会首页','HOME','PUBLISHED','pv-home-2',2,'2026-08-20T10:00:00+08:00','2026-08-28T09:00:00+08:00');

INSERT OR IGNORE INTO portal_page_versions VALUES
('pv-home-2','evt-morocco-2026','page-home',2,'zh-CN','[{"type":"hero","title":"中非经贸合作的新通道"},{"type":"stats"},{"type":"agenda"},{"type":"map"}]','更新主视觉和报名入口','PUBLISHED','王珊','赵强','2026-08-27T16:00:00+08:00','2026-08-27T14:00:00+08:00','2026-08-27T16:00:00+08:00');

INSERT OR IGNORE INTO review_tasks VALUES
('review-001','evt-morocco-2026','门户内容','PORTAL_PAGE','page-home','pv-home-3','首页法语版本更新','王珊',NULL,'PENDING',NULL,'2026-08-28T09:20:00+08:00',NULL,'2026-08-28T09:20:00+08:00','2026-08-28T09:20:00+08:00'),
('review-002','evt-morocco-2026','展商资料','EVENT_EXHIBITOR','exhibitor-002',NULL,'Atlas Green 展商资料变更','陈伟',NULL,'PENDING',NULL,'2026-08-28T10:05:00+08:00',NULL,'2026-08-28T10:05:00+08:00','2026-08-28T10:05:00+08:00');

INSERT OR IGNORE INTO registration_records (id,event_id,activity_id,account_id,person_name,mobile_masked,country,organization,status,first_channel,submitted_at,version,created_at,updated_at) VALUES
('person-001','evt-morocco-2026','reg-main','account-001','张明','138****2048','中国','华南智能制造有限公司','APPROVED','微信公众号','2026-08-26T14:30:00+08:00',1,'2026-08-26T14:30:00+08:00','2026-08-27T09:10:00+08:00'),
('person-002','evt-morocco-2026','reg-main','account-002','Yasmine El Amrani','+212 6** *** 218','摩洛哥','Maghreb Trade Partners','PENDING','展会门户','2026-08-28T08:42:00+08:00',1,'2026-08-28T08:42:00+08:00','2026-08-28T08:42:00+08:00'),
('person-003','evt-morocco-2026','reg-main','account-003','刘青','186****7721','中国','湘非供应链服务有限公司','CHECKED_IN','定向邀请','2026-08-25T11:18:00+08:00',2,'2026-08-25T11:18:00+08:00','2026-08-28T10:18:00+08:00');

INSERT OR IGNORE INTO enterprises (id,name_zh,name_intl,country,registration_no,account_contact,status,created_at,updated_at) VALUES
('enterprise-001','华南智能制造有限公司','South China Intelligent Manufacturing Co., Ltd.','中国','CN-DEMO-001','138****2048','ACTIVE','2026-08-21T09:00:00+08:00','2026-08-27T09:00:00+08:00'),
('enterprise-002','阿特拉斯绿色科技','Atlas Green Technologies','摩洛哥','MA-DEMO-002','+212 6** *** 889','ACTIVE','2026-08-22T10:00:00+08:00','2026-08-28T09:50:00+08:00');

INSERT OR IGNORE INTO event_exhibitors (id,event_id,enterprise_id,qualification_status,publish_status,product_count,booth_no,source,version,created_at,updated_at) VALUES
('exhibitor-001','evt-morocco-2026','enterprise-001','APPROVED','PUBLISHED',6,'A-018','企业自助填报',2,'2026-08-21T09:30:00+08:00','2026-08-27T09:00:00+08:00'),
('exhibitor-002','evt-morocco-2026','enterprise-002','PENDING','PUBLISHED',4,'B-006','工作人员录入',3,'2026-08-22T10:30:00+08:00','2026-08-28T10:05:00+08:00');

UPDATE enterprises SET account_id='enterprise-account-001',industry='智能制造',contact_name='企业联络员A',contact_email_masked='co***@example.cn',website='https://example.cn',address='中国湖南长沙' WHERE id='enterprise-001';
UPDATE enterprises SET account_id='enterprise-account-002',industry='新能源',contact_name='企业联络员B',contact_email_masked='at***@example.ma',website='https://example.ma',address='摩洛哥卡萨布兰卡' WHERE id='enterprise-002';
UPDATE event_exhibitors SET category='技术装备',description='提供智能制造设备、工业自动化和跨境项目合作方案。',current_version_id='exhibitor-profile-001-v2' WHERE id='exhibitor-001';
UPDATE event_exhibitors SET category='新能源',description='面向北非市场的绿色能源技术与本地合作服务。',current_version_id=NULL,publish_status='DRAFT' WHERE id='exhibitor-002';

INSERT OR IGNORE INTO exhibitor_profile_versions VALUES
('exhibitor-profile-001-v2','evt-morocco-2026','exhibitor-001',2,'{"nameZh":"华南智能制造有限公司","nameIntl":"South China Intelligent Manufacturing Co., Ltd.","category":"技术装备","country":"中国","description":"提供智能制造设备、工业自动化和跨境项目合作方案。","publicContact":false}','PUBLISHED','企业账号','赵强','2026-08-27T09:00:00+08:00','2026-08-26T09:00:00+08:00','2026-08-27T09:00:00+08:00'),
('exhibitor-profile-002-v2','evt-morocco-2026','exhibitor-002',2,'{"nameZh":"阿特拉斯绿色科技","nameIntl":"Atlas Green Technologies","category":"新能源","country":"摩洛哥","description":"面向北非市场的绿色能源技术与本地合作服务。","publicContact":false}','PUBLISHED','工作人员','赵强','2026-08-27T10:00:00+08:00','2026-08-26T10:00:00+08:00','2026-08-27T10:00:00+08:00');

UPDATE exhibitor_profile_versions SET review_status='PENDING',approved_by=NULL,published_at=NULL WHERE id='exhibitor-profile-002-v2';

INSERT OR IGNORE INTO products VALUES
('product-001','evt-morocco-2026','exhibitor-001','工业协作机器人','技术装备','PUBLISHED','product-001-v1','2026-08-26T09:00:00+08:00','2026-08-27T09:00:00+08:00'),
('product-002','evt-morocco-2026','exhibitor-002','微电网储能系统','新能源','PUBLISHED','product-002-v1','2026-08-26T10:00:00+08:00','2026-08-27T10:00:00+08:00');

INSERT OR IGNORE INTO product_versions VALUES
('product-001-v1','product-001',1,'{"name":"工业协作机器人","category":"技术装备","summary":"适用于柔性制造和现场演示的协作机器人方案。","images":[]}','PUBLISHED','企业账号','赵强','2026-08-27T09:00:00+08:00','2026-08-26T09:00:00+08:00','2026-08-27T09:00:00+08:00'),
('product-002-v1','product-002',1,'{"name":"微电网储能系统","category":"新能源","summary":"面向园区和离网场景的模块化储能方案。","images":[]}','PUBLISHED','企业账号','赵强','2026-08-27T10:00:00+08:00','2026-08-26T10:00:00+08:00','2026-08-27T10:00:00+08:00');

INSERT OR IGNORE INTO inquiries (id,event_id,event_exhibitor_id,product_id,customer_name,contact_masked,content,status,handled_by,handled_at,created_at,updated_at) VALUES
('inquiry-001','evt-morocco-2026','exhibitor-001','product-001','Alpha采购访客','139****5678','希望在展会现场进一步了解交付周期和本地服务。','NEW',NULL,NULL,'2026-08-28T09:00:00+08:00','2026-08-28T09:00:00+08:00');

UPDATE inquiries SET contact_private='13900005678' WHERE id='inquiry-001' AND contact_private='';
UPDATE inquiries SET contact_private='buyer@example.com' WHERE id='inquiry-3c852bd2-0995-4b9e-9a04-2f9c0526ea1e' AND contact_private='';
