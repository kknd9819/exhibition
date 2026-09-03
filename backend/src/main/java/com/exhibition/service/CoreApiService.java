package com.exhibition.service;

import com.exhibition.common.ApiException;
import com.exhibition.common.Ids;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.servlet.http.HttpServletRequest;
import java.util.*;

@Service
public class CoreApiService {
    private final SqlMutationService sql;
    private final ActorService actors;
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public CoreApiService(SqlMutationService sql, ActorService actors, JdbcTemplate jdbc, ObjectMapper json) {
        this.sql = sql;
        this.actors = actors;
        this.jdbc = jdbc;
        this.json = json;
    }

    public boolean supportsPost(String path) {
        return Arrays.asList("/api/iam/employees", "/api/iam/members", "/api/exhibitors", "/api/products", "/api/inquiries", "/api/reviews").contains(path)
                || path.matches("/api/registrations/activities/[^/]+/records");
    }

    @Transactional
    public Map<String, Object> post(String path, Map<String, Object> body, HttpServletRequest request) {
        if ("/api/inquiries".equals(path)) return createInquiry(body);
        if (path.matches("/api/registrations/activities/[^/]+/records")) return createRegistration(path, body, request);
        Map<String, Object> actor = requireEmployee(request);
        if ("/api/iam/employees".equals(path)) return createEmployee(body, actor);
        if ("/api/iam/members".equals(path)) return createMember(body, actor);
        if ("/api/exhibitors".equals(path)) return createExhibitor(body, actor, currentEvent(request));
        if ("/api/products".equals(path)) return createProduct(body, actor);
        if ("/api/reviews".equals(path)) return createReview(body, actor, currentEvent(request));
        throw new ApiException(404, "接口不存在");
    }

    private Map<String, Object> createEmployee(Map<String, Object> body, Map<String, Object> actor) {
        requireAdmin(actor);
        required(body, "name", "姓名、手机号和邮箱必填");
        required(body, "mobile", "姓名、手机号和邮箱必填");
        required(body, "email", "姓名、手机号和邮箱必填");
        Map<String, Object> defaults = map("status", "ACTIVE", "groupRole", "STAFF");
        String id = sql.insert("employee_accounts", "employee", body, defaults);
        return map("id", id, "status", "ACTIVE");
    }

    private Map<String, Object> createMember(Map<String, Object> body, Map<String, Object> actor) {
        requireAdmin(actor);
        required(body, "eventId", "展会、员工和角色必填");
        required(body, "accountId", "展会、员工和角色必填");
        required(body, "roleCode", "展会、员工和角色必填");
        List<String> permissions = permissions(text(body, "roleCode"));
        Map<String, Object> defaults = map("permissionsJson", toJson(permissions), "status", "ACTIVE", "joinedAt", Ids.now());
        String id = sql.insert("event_members", "member", body, defaults);
        return map("id", id, "permissions", permissions);
    }

    private Map<String, Object> createExhibitor(Map<String, Object> body, Map<String, Object> actor, String eventId) {
        required(body, "nameZh", "企业中文名、国家/地区和账号联系方式必填");
        required(body, "country", "企业中文名、国家/地区和账号联系方式必填");
        required(body, "accountContact", "企业中文名、国家/地区和账号联系方式必填");
        String enterpriseId = Ids.id("enterprise"), accountId = Ids.id("enterprise-account"), exhibitorId = Ids.id("exhibitor"), profileId = Ids.id("exhibitor-profile");
        sql.insert("enterprises", "enterprise", body, map("id", enterpriseId, "accountId", accountId, "status", "ACTIVE"));
        sql.insert("enterprise_accounts", "enterprise-account", map("id", accountId, "enterpriseId", enterpriseId, "displayName", body.get("contactName") == null ? body.get("nameZh") : body.get("contactName")), map("status", "ACTIVE"));
        String contact = text(body, "accountContact").replaceAll("[\\s()-]", "");
        String type = contact.contains("@") ? "EMAIL" : contact.startsWith("+") ? "INTL_MOBILE" : "CN_MOBILE";
        sql.insert("enterprise_identities", "enterprise-identity", map("accountId", accountId, "identityType", type, "normalizedValue", contact.toLowerCase(), "displayMasked", mask(contact), "verifiedAt", Ids.now()), Collections.emptyMap());
        sql.insert("event_exhibitors", "exhibitor", body, map("id", exhibitorId, "eventId", eventId, "enterpriseId", enterpriseId, "qualificationStatus", "PENDING", "publishStatus", "DRAFT", "source", body.get("source") == null ? "工作人员录入" : body.get("source")));
        Map<String, Object> profile = map("nameZh", body.get("nameZh"), "nameIntl", body.get("nameIntl"), "country", body.get("country"), "category", body.get("category"), "description", "", "publicContact", false);
        sql.insert("exhibitor_profile_versions", "exhibitor-profile", map("id", profileId, "eventId", eventId, "eventExhibitorId", exhibitorId, "profileJson", toJson(profile), "submittedBy", actor.get("name")), map("versionNo", 1, "reviewStatus", "PENDING"));
        createReviewTask(eventId, "参展申请", "EVENT_EXHIBITOR", exhibitorId, null, text(body, "nameZh") + " · 参展资格", actor);
        createReviewTask(eventId, "展商资料", "EXHIBITOR_PROFILE", exhibitorId, profileId, text(body, "nameZh") + " · 首次参展资料", actor);
        return map("enterpriseId", enterpriseId, "exhibitorId", exhibitorId, "profileId", profileId, "qualificationStatus", "PENDING", "publishStatus", "DRAFT");
    }

    private Map<String, Object> createProduct(Map<String, Object> body, Map<String, Object> actor) {
        required(body, "eventExhibitorId", "所属企业、产品名称和分类必填");
        required(body, "name", "所属企业、产品名称和分类必填");
        required(body, "category", "所属企业、产品名称和分类必填");
        List<Map<String, Object>> exhibitors = jdbc.queryForList("SELECT * FROM event_exhibitors WHERE id=?", body.get("eventExhibitorId"));
        if (exhibitors.isEmpty()) throw new ApiException(404, "参展企业不存在");
        String eventId = String.valueOf(exhibitors.get(0).get("event_id")), productId = Ids.id("product"), versionId = Ids.id("product-version");
        sql.insert("products", "product", body, map("id", productId, "eventId", eventId, "publishStatus", "DRAFT"));
        Map<String, Object> content = map("name", body.get("name"), "category", body.get("category"), "summary", body.get("summary"), "images", Collections.emptyList());
        sql.insert("product_versions", "product-version", map("id", versionId, "productId", productId, "contentJson", toJson(content), "submittedBy", actor.get("name")), map("reviewStatus", "PENDING", "versionNo", 1));
        createReviewTask(eventId, "产品资料", "PRODUCT", productId, versionId, text(body, "name") + " · 产品资料 V1", actor);
        jdbc.update("UPDATE event_exhibitors SET product_count=COALESCE(product_count,0)+1,updated_at=? WHERE id=?", Ids.now(), body.get("eventExhibitorId"));
        return map("productId", productId, "versionId", versionId, "status", "PENDING");
    }

    private Map<String, Object> createInquiry(Map<String, Object> body) {
        required(body, "eventExhibitorId", "参展企业、联系人和询盘内容必填");
        required(body, "customerName", "参展企业、联系人和询盘内容必填");
        required(body, "content", "参展企业、联系人和询盘内容必填");
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT event_id FROM event_exhibitors WHERE id=?", body.get("eventExhibitorId"));
        if (rows.isEmpty()) throw new ApiException(404, "参展企业不存在");
        String contact = text(body, "contact");
        String id = sql.insert("inquiries", "inquiry", body, map("eventId", rows.get(0).get("event_id"), "contactPrivate", contact, "contactMasked", mask(contact), "status", "NEW"));
        return map("id", id, "status", "NEW");
    }

    private Map<String, Object> createRegistration(String path, Map<String, Object> body, HttpServletRequest request) {
        Map<String, Object> actor = actors.publicActor(request);
        if (actor == null) throw new ApiException(401, "请先完成观众身份验证后报名");
        String activityId = path.split("/")[4];
        List<Map<String, Object>> activities = jdbc.queryForList("SELECT * FROM registration_activities WHERE id=?", activityId);
        if (activities.isEmpty() || !"OPEN".equals(activities.get(0).get("status")))
            throw new ApiException(409, "当前报名活动未开放");
        required(body, "personName", "姓名、手机、单位和国家/地区属于基础必填信息");
        required(body, "mobile", "姓名、手机、单位和国家/地区属于基础必填信息");
        required(body, "organization", "姓名、手机、单位和国家/地区属于基础必填信息");
        required(body, "country", "姓名、手机、单位和国家/地区属于基础必填信息");
        String status = "AUTO_APPROVE".equals(activities.get(0).get("review_mode")) ? "APPROVED" : "PENDING";
        String id = sql.insert("registration_records", "record", body, map("eventId", activities.get(0).get("event_id"), "activityId", activityId, "accountId", actor.get("accountId"), "mobileMasked", mask(text(body, "mobile")), "emailMasked", mask(text(body, "email")), "answersJson", toJson(body.get("answers")), "status", status, "formVersion", activities.get(0).get("form_version")));
        if ("PENDING".equals(status))
            createReviewTask(String.valueOf(activities.get(0).get("event_id")), "报名审核", "REGISTRATION", id, null, text(body, "personName") + " · 报名审核", actor);
        return map("recordId", id, "status", status, "formVersion", activities.get(0).get("form_version"), "message", activities.get(0).get("success_message"));
    }

    private Map<String, Object> createReview(Map<String, Object> body, Map<String, Object> actor, String eventId) {
        required(body, "title", "缺少审核任务信息");
        required(body, "objectId", "缺少审核任务信息");
        String id = createReviewTask(eventId, text(body, "module"), text(body, "objectType"), text(body, "objectId"), text(body, "versionId"), text(body, "title"), actor);
        return map("id", id, "status", "PENDING");
    }

    private String createReviewTask(String eventId, String module, String objectType, String objectId, String versionId, String title, Map<String, Object> actor) {
        return sql.insert("review_tasks", "review", map("eventId", eventId, "module", module, "objectType", objectType, "objectId", objectId, "versionId", versionId, "title", title, "submitterName", actor.get("name"), "submittedAt", Ids.now()), map("status", "PENDING"));
    }

    private Map<String, Object> requireEmployee(HttpServletRequest request) {
        Map<String, Object> actor = actors.employee(request);
        if (actor == null) throw new ApiException(401, "请先登录");
        return actor;
    }

    private void requireAdmin(Map<String, Object> actor) {
        if (!actors.isGroupAdmin(actor)) throw new ApiException(403, "需要集团管理员权限");
    }

    private String currentEvent(HttpServletRequest request) {
        String id = actors.cookie(request, "expo_current_event");
        return id == null ? "evt-morocco-2026" : id;
    }

    private List<String> permissions(String role) {
        if ("EVENT_ADMIN".equals(role)) return Arrays.asList("event.*", "review.*", "portal.withdraw");
        if ("CONTENT_EDITOR".equals(role)) return Arrays.asList("portal.edit", "content.edit", "review.submit");
        if ("REVIEWER".equals(role)) return Arrays.asList("review.approve", "review.return");
        if ("OPERATIONS".equals(role))
            return Arrays.asList("registration.manage", "exhibitor.manage", "checkin.execute");
        if ("DATA_VIEWER".equals(role)) return Arrays.asList("event.analytics.view", "export.default");
        throw new ApiException(400, "角色无效");
    }

    private void required(Map<String, Object> body, String key, String message) {
        if (text(body, key) == null || text(body, key).trim().isEmpty()) throw new ApiException(400, message);
    }

    private String text(Map<String, Object> body, String key) {
        Object value = body == null ? null : body.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private String mask(String value) {
        if (value == null || value.isEmpty()) return "";
        if (value.contains("@"))
            return value.substring(0, Math.min(2, value.indexOf('@'))) + "***@" + value.substring(value.indexOf('@') + 1);
        String compact = value.replaceAll("[\\s()-]", "");
        return compact.length() > 7 ? compact.substring(0, 3) + "****" + compact.substring(compact.length() - 4) : "***";
    }

    private String toJson(Object value) {
        try {
            return json.writeValueAsString(value == null ? Collections.emptyMap() : value);
        } catch (Exception exception) {
            throw new ApiException(400, "JSON 数据无效");
        }
    }

    private Map<String, Object> map(Object... items) {
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        for (int index = 0; index + 1 < items.length; index += 2)
            if (items[index + 1] != null) result.put(String.valueOf(items[index]), items[index + 1]);
        return result;
    }
}
