package com.exhibition.service;

import com.exhibition.common.ApiException;
import com.exhibition.common.Ids;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.servlet.http.HttpServletRequest;
import java.util.*;

@Service
public class CorePatchService {
    private final SqlMutationService sql;
    private final ActorService actors;
    private final JdbcTemplate jdbc;

    public CorePatchService(SqlMutationService sql, ActorService actors, JdbcTemplate jdbc) {
        this.sql = sql;
        this.actors = actors;
        this.jdbc = jdbc;
    }

    public boolean supports(String path) {
        return path.equals("/api/iam/members") || path.matches("/api/iam/employees/[^/]+") || path.matches("/api/inquiries/[^/]+")
                || path.matches("/api/registrations/records/[^/]+") || path.matches("/api/registrations/activities/[^/]+")
                || path.matches("/api/products/[^/]+") || path.matches("/api/exhibitors/[^/]+") || path.matches("/api/reviews/[^/]+");
    }

    @Transactional
    public Map<String, Object> patch(String path, Map<String, Object> body, HttpServletRequest request) {
        Map<String, Object> actor = actors.employee(request);
        if (actor == null) throw new ApiException(401, "请先登录");
        if (path.equals("/api/iam/members")) return member(body, actor);
        String id = last(path);
        if (path.startsWith("/api/iam/employees/")) return simple("employee_accounts", id, body, "status");
        if (path.startsWith("/api/inquiries/")) return inquiry(id, body, actor);
        if (path.startsWith("/api/registrations/records/")) return registration(id, body, actor);
        if (path.startsWith("/api/registrations/activities/"))
            return simple("registration_activities", id, body, "status");
        if (path.startsWith("/api/products/"))
            return versioned("products", "product_versions", "product_id", id, body, actor, "PRODUCT");
        if (path.startsWith("/api/exhibitors/"))
            return versioned("event_exhibitors", "exhibitor_profile_versions", "event_exhibitor_id", id, body, actor, "EXHIBITOR_PROFILE");
        if (path.startsWith("/api/reviews/")) return review(id, body, actor);
        throw new ApiException(404, "接口不存在");
    }

    private Map<String, Object> member(Map<String, Object> body, Map<String, Object> actor) {
        if (!actors.isGroupAdmin(actor)) throw new ApiException(403, "需要集团管理员权限");
        String id = text(body, "memberId");
        if (id == null) throw new ApiException(400, "成员和角色必填");
        List<String> permissions = permissions(text(body, "roleCode"));
        sql.update("event_members", id, body, map("permissionsJson", jsonArray(permissions)));
        return map("memberId", id, "roleCode", body.get("roleCode"), "permissions", permissions, "isReviewer", Boolean.TRUE.equals(body.get("isReviewer")));
    }

    private Map<String, Object> inquiry(String id, Map<String, Object> body, Map<String, Object> actor) {
        Map<String, Object> row = sql.row("inquiries", id);
        if (row == null) throw new ApiException(404, "询盘不存在");
        String status = text(body, "status");
        if (status == null) status = text(body, "action");
        sql.update("inquiries", id, body, map("status", status, "handledBy", actor.get("name"), "handledAt", Ids.now()));
        return map("id", id, "status", status, "handledBy", actor.get("name"));
    }

    private Map<String, Object> registration(String id, Map<String, Object> body, Map<String, Object> actor) {
        Map<String, Object> row = sql.row("registration_records", id);
        if (row == null) throw new ApiException(404, "报名记录不存在");
        String action = text(body, "action"), status;
        if ("APPROVE".equals(action)) status = "APPROVED";
        else if ("REJECT".equals(action) || "RETURN".equals(action)) status = "REJECTED";
        else if ("CHECKIN".equals(action)) status = "CHECKED_IN";
        else throw new ApiException(400, "缺少处理动作");
        sql.update("registration_records", id, body, map("status", status, "reviewerName", actor.get("name"), "reviewedAt", Ids.now(), "checkedInAt", "CHECKED_IN".equals(status) ? Ids.now() : null));
        return map("id", id, "status", status, "reviewerName", actor.get("name"));
    }

    private Map<String, Object> versioned(String mainTable, String versionTable, String foreignKey, String id, Map<String, Object> body, Map<String, Object> actor, String objectType) {
        Map<String, Object> row = sql.row(mainTable, id);
        if (row == null) throw new ApiException(404, "业务对象不存在");
        String action = text(body, "action");
        if ("CREATE_VERSION".equals(action) || "SUBMIT".equals(action)) {
            String versionId = sql.insert(versionTable, versionTable.startsWith("product") ? "product-version" : "exhibitor-profile", body, map(toCamel(foreignKey), id, "eventId", row.get("eventId"), "reviewStatus", "PENDING", "submittedBy", actor.get("name")));
            sql.insert("review_tasks", "review", map("eventId", row.get("eventId"), "module", objectType, "objectType", objectType, "objectId", id, "versionId", versionId, "title", objectType + " 新版本", "submitterName", actor.get("name"), "submittedAt", Ids.now()), map("status", "PENDING"));
            return map("id", id, "versionId", versionId, "status", "PENDING");
        }
        String status = "WITHDRAW".equals(action) ? "DRAFT" : text(body, "publishStatus");
        sql.update(mainTable, id, body, map("publishStatus", status));
        return map("id", id, "status", status);
    }

    private Map<String, Object> review(String id, Map<String, Object> body, Map<String, Object> actor) {
        Map<String, Object> task = sql.row("review_tasks", id);
        if (task == null) throw new ApiException(404, "审核任务不存在");
        if (!"PENDING".equals(task.get("status"))) throw new ApiException(409, "该任务已经处理，不能重复审核");
        String decision = text(body, "decision");
        if (!Arrays.asList("APPROVED", "RETURNED").contains(decision)) throw new ApiException(400, "缺少审核结论");
        if (String.valueOf(task.get("submitterName")).equals(actor.get("name")))
            throw new ApiException(409, "提交人与审核人必须为不同员工");
        sql.update("review_tasks", id, body, map("status", decision, "reviewerName", actor.get("name"), "decidedAt", Ids.now(), "reason", body.get("reason")));
        applyDecision(task, decision, actor);
        return map("id", id, "status", decision, "reviewerName", actor.get("name"), "decidedAt", Ids.now());
    }

    private void applyDecision(Map<String, Object> task, String decision, Map<String, Object> actor) {
        boolean approved = "APPROVED".equals(decision);
        String type = String.valueOf(task.get("objectType")), objectId = String.valueOf(task.get("objectId")), versionId = task.get("versionId") == null ? null : String.valueOf(task.get("versionId"));
        if ("REGISTRATION".equals(type))
            sql.update("registration_records", objectId, Collections.emptyMap(), map("status", approved ? "APPROVED" : "REJECTED", "reviewerName", actor.get("name")));
        else if ("EVENT_EXHIBITOR".equals(type))
            sql.update("event_exhibitors", objectId, Collections.emptyMap(), map("qualificationStatus", approved ? "APPROVED" : "RETURNED"));
        else if ("EXHIBITOR_PROFILE".equals(type))
            publishVersion("exhibitor_profile_versions", "event_exhibitors", versionId, objectId, approved);
        else if ("PRODUCT".equals(type)) publishVersion("product_versions", "products", versionId, objectId, approved);
        else if ("PORTAL_PAGE".equals(type))
            publishVersion("portal_page_versions", "portal_pages", versionId, objectId, approved);
        else if ("CONTENT_ITEM".equals(type))
            publishVersion("content_versions", "content_items", versionId, objectId, approved);
        else if ("DOCUMENT_ITEM".equals(type))
            sql.update("document_items", objectId, Collections.emptyMap(), map("status", approved ? "PUBLISHED" : "RETURNED", "approvedBy", actor.get("name"), "publishedAt", approved ? Ids.now() : null));
        else if ("DEMAND_SUPPLY_POST".equals(type))
            sql.update("demand_supply_posts", objectId, Collections.emptyMap(), map("reviewStatus", approved ? "PUBLISHED" : "RETURNED", "approvedBy", actor.get("name")));
        else if ("MESSAGE_TASK".equals(type))
            sql.update("message_tasks", objectId, Collections.emptyMap(), map("status", approved ? "APPROVED" : "RETURNED", "reviewerName", actor.get("name")));
        else if ("SENSITIVE_EXPORT".equals(type))
            sql.update("sensitive_export_requests", objectId, Collections.emptyMap(), map("status", decision, "reviewedByName", actor.get("name"), "reviewedAt", Ids.now()));
    }

    private void publishVersion(String versionTable, String mainTable, String versionId, String objectId, boolean approved) {
        if (versionId != null)
            sql.update(versionTable, versionId, Collections.emptyMap(), map("reviewStatus", approved ? "PUBLISHED" : "RETURNED", "publishedAt", approved ? Ids.now() : null));
        if (approved)
            sql.update(mainTable, objectId, Collections.emptyMap(), map("currentVersionId", versionId, "status", "PUBLISHED", "publishStatus", "PUBLISHED"));
    }

    private Map<String, Object> simple(String table, String id, Map<String, Object> body, String responseField) {
        if (sql.row(table, id) == null) throw new ApiException(404, "业务对象不存在");
        sql.update(table, id, body, Collections.emptyMap());
        return map("id", id, responseField, body.get(responseField));
    }

    private String last(String path) {
        return path.substring(path.lastIndexOf('/') + 1);
    }

    private String text(Map<String, Object> body, String key) {
        Object value = body == null ? null : body.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private String toCamel(String value) {
        StringBuilder out = new StringBuilder();
        boolean upper = false;
        for (char c : value.toCharArray()) {
            if (c == '_') {
                upper = true;
                continue;
            }
            out.append(upper ? Character.toUpperCase(c) : c);
            upper = false;
        }
        return out.toString();
    }

    private List<String> permissions(String role) {
        if ("EVENT_ADMIN".equals(role)) return Arrays.asList("event.*", "review.*", "portal.withdraw");
        if ("CONTENT_EDITOR".equals(role)) return Arrays.asList("portal.edit", "content.edit", "review.submit");
        if ("REVIEWER".equals(role)) return Arrays.asList("review.approve", "review.return");
        if ("OPERATIONS".equals(role))
            return Arrays.asList("registration.manage", "exhibitor.manage", "checkin.execute");
        return Arrays.asList("event.analytics.view", "export.default");
    }

    private String jsonArray(List<String> values) {
        StringBuilder value = new StringBuilder("[");
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) value.append(',');
            value.append('"').append(values.get(i)).append('"');
        }
        return value.append(']').toString();
    }

    private Map<String, Object> map(Object... items) {
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        for (int index = 0; index + 1 < items.length; index += 2)
            if (items[index + 1] != null) result.put(String.valueOf(items[index]), items[index + 1]);
        return result;
    }
}
