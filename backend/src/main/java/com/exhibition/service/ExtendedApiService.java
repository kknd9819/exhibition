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
public class ExtendedApiService {
    private final SqlMutationService sql;
    private final ActorService actors;
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public ExtendedApiService(SqlMutationService sql, ActorService actors, JdbcTemplate jdbc, ObjectMapper json) {
        this.sql = sql;
        this.actors = actors;
        this.jdbc = jdbc;
        this.json = json;
    }

    public boolean supportsPost(String path) {
        return Arrays.asList(
                "/api/agenda/guests", "/api/agenda/publish", "/api/agenda/sessions",
                "/api/analytics/reports/runs", "/api/analytics/snapshots/run", "/api/checkin/execute",
                "/api/company-workspace/applications", "/api/company-workspace/notifications/read-all",
                "/api/content/assets", "/api/content/documents", "/api/content/items",
                "/api/data-assets/exports", "/api/data-assets/merge", "/api/data-assets/merge-preview",
                "/api/localization/portal-translations", "/api/marketing/channels", "/api/marketing/plans",
                "/api/matching/appointments", "/api/matching/batches", "/api/matching/posts",
                "/api/messages/tasks", "/api/messages/templates", "/api/messages/unsubscribe",
                "/api/public-matching/appointments", "/api/public-matching/posts", "/api/public-notifications/read-all",
                "/api/tracking/visit").contains(path)
                || path.matches("/api/checkin/[^/]+/reverse") || path.matches("/api/portal/pages/[^/]+/withdraw")
                || path.matches("/api/exhibitors/[^/]+/contact-handoff/(challenge|complete)")
                || path.matches("/api/messages/deliveries/[^/]+/retry") || path.matches("/api/data-assets/merges/[^/]+/unmerge")
                || path.matches("/api/data-assets/imports/[^/]+/commit") || path.matches("/api/company-workspace/exhibitors/[^/]+/(appointments|matching-posts|products|profile)")
                || path.matches("/api/company-workspace/products/[^/]+") || path.matches("/api/governance/recycle-bin/[^/]+")
                || path.matches("/api/portal/pages/[^/]+/(versions|withdraw)");
    }

    public boolean supportsPatch(String path) {
        return path.matches("/api/agenda/(guests|versions)/[^/]+") || path.matches("/api/marketing/targets/[^/]+")
                || path.matches("/api/content/(items|documents)/[^/]+") || path.matches("/api/company-workspace/(appointments|inquiries|notifications)/[^/]+")
                || path.matches("/api/public-notifications/[^/]+") || path.matches("/api/localization/portal-translations/[^/]+")
                || path.matches("/api/(public-matching|matching)/appointments/[^/]+") || path.matches("/api/matching/(batches|posts)/[^/]+")
                || path.matches("/api/public-registrations/records/[^/]+/profile");
    }

    @Transactional
    public Map<String, Object> patch(String path, Map<String, Object> body, HttpServletRequest request) {
        String id = path.substring(path.lastIndexOf('/') + 1);
        if (path.startsWith("/api/public-notifications/"))
            return notification(id, "PUBLIC_ACCOUNT", actors.publicActor(request));
        if (path.startsWith("/api/public-registrations/records/")) {
            Map<String, Object> actor = actors.publicActor(request);
            if (actor == null) throw new ApiException(401, "请先登录观众账号");
            String recordId = path.split("/")[4];
            String versionId = sql.insert("registration_profile_versions", "registration-profile", body, map("recordId", recordId, "reviewStatus", "PENDING", "submittedBy", actor.get("displayName")));
            return map("id", recordId, "versionId", versionId, "status", "PENDING", "changedFields", body.keySet());
        }
        if (path.startsWith("/api/public-matching/appointments/"))
            return appointment(id, body, actors.publicActor(request));
        if (path.startsWith("/api/company-workspace/")) {
            Map<String, Object> actor = actors.enterpriseActor(request);
            if (actor == null) throw new ApiException(401, "企业账号未登录");
            if (path.contains("/notifications/")) return notification(id, "ENTERPRISE_ACCOUNT", actor);
            if (path.contains("/inquiries/")) return updateStatus("inquiries", id, body, "HANDLED");
            return appointment(id, body, actor);
        }
        Map<String, Object> actor = requireEmployee(request);
        if (path.startsWith("/api/agenda/guests/"))
            return updateStatus("event_guests", id, body, actionStatus(body, "PUBLISHED"));
        if (path.startsWith("/api/agenda/versions/"))
            return updateStatus("agenda_versions", id, body, actionStatus(body, "PUBLISHED"));
        if (path.startsWith("/api/marketing/targets/"))
            return updateStatus("recruitment_targets", id, body, text(body, "stage"));
        if (path.startsWith("/api/content/items/"))
            return updateStatus("content_items", id, body, actionStatus(body, "PUBLISHED"));
        if (path.startsWith("/api/content/documents/"))
            return updateStatus("document_items", id, body, actionStatus(body, "PUBLISHED"));
        if (path.startsWith("/api/localization/portal-translations/"))
            return updateStatus("portal_translation_jobs", id, body, actionStatus(body, "PENDING_REVIEW"));
        if (path.startsWith("/api/matching/appointments/")) return appointment(id, body, actor);
        if (path.startsWith("/api/matching/batches/"))
            return updateStatus("schedule_batches", id, body, actionStatus(body, "PENDING"));
        if (path.startsWith("/api/matching/posts/"))
            return updateStatus("demand_supply_posts", id, body, actionStatus(body, "PUBLISHED"));
        throw new ApiException(404, "接口不存在");
    }

    @Transactional
    public Map<String, Object> post(String path, Map<String, Object> body, HttpServletRequest request) {
        if (path.equals("/api/tracking/visit")) return tracking(body, request);
        if (path.equals("/api/public-matching/posts"))
            return publicCreate("demand_supply_posts", "post", body, request, map("reviewStatus", "PENDING", "publisherType", "PUBLIC"));
        if (path.equals("/api/public-matching/appointments"))
            return publicCreate("appointments", "appointment", body, request, map("status", "PROPOSED", "inviterType", "PUBLIC"));
        if (path.equals("/api/public-notifications/read-all"))
            return readAll("PUBLIC_ACCOUNT", actors.publicActor(request));
        if (path.equals("/api/company-workspace/notifications/read-all"))
            return readAll("ENTERPRISE_ACCOUNT", actors.enterpriseActor(request));
        if (path.startsWith("/api/company-workspace/")) return company(path, body, request);
        Map<String, Object> actor = requireEmployee(request);
        String eventId = currentEvent(request);
        if (path.equals("/api/agenda/guests")) return guest(body, actor, eventId);
        if (path.equals("/api/agenda/sessions")) {
            String agendaId = agendaId(eventId);
            String id = sql.insert("agenda_sessions", "agenda-session", body, map("agendaId", agendaId, "status", "DRAFT"));
            return map("id", id, "agendaId", agendaId, "status", "DRAFT");
        }
        if (path.equals("/api/agenda/publish")) return agendaPublish(actor, eventId);
        if (path.equals("/api/analytics/snapshots/run"))
            return createSimple("metric_snapshot_runs", "metric-run", body, map("status", "SUCCESS", "requestedBy", actor.get("name")), "id", "SUCCESS");
        if (path.equals("/api/analytics/reports/runs"))
            return createSimple("report_runs", "report-run", body, map("status", "COMPLETED", "requestedByName", actor.get("name")), "id", "COMPLETED");
        if (path.equals("/api/checkin/execute")) return checkin(body, actor);
        if (path.equals("/api/content/assets"))
            return createSimple("assets", "asset", body, map("eventId", eventId, "status", "READY", "uploadedBy", actor.get("name")), "id", "READY");
        if (path.equals("/api/content/documents")) {
            body.put("createdBy", actor.get("name"));
            body.put("submittedBy", actor.get("name"));
            return reviewedCreate("document_items", "document", body, actor, eventId, "DOCUMENT_ITEM");
        }
        if (path.equals("/api/content/items")) return content(body, actor, eventId);
        if (path.equals("/api/data-assets/exports"))
            return reviewedCreate("sensitive_export_requests", "export", body, actor, eventId, "SENSITIVE_EXPORT");
        if (path.equals("/api/data-assets/merge-preview"))
            return map("preview", body, "conflicts", Collections.emptyList(), "allowed", true);
        if (path.equals("/api/data-assets/merge"))
            return createSimple("data_merge_records", "merge", body, map("status", "COMPLETED", "mergedByName", actor.get("name"), "mergedAt", Ids.now()), "id", "COMPLETED");
        if (path.equals("/api/localization/portal-translations"))
            return createSimple("portal_translation_jobs", "translation", body, map("eventId", eventId, "status", "DRAFT", "requestedBy", actor.get("name"), "requestedAt", Ids.now()), "id", "DRAFT");
        if (path.equals("/api/marketing/channels")) {
            String id = sql.insert("promotion_channels", "channel", body, map("eventId", eventId, "status", "ACTIVE", "ownerName", actor.get("name")));
            return map("id", id, "ownerName", actor.get("name"), "status", "ACTIVE");
        }
        if (path.equals("/api/marketing/plans")) return marketingPlan(body, actor, eventId);
        if (path.equals("/api/matching/posts"))
            return reviewedCreate("demand_supply_posts", "post", body, actor, eventId, "DEMAND_SUPPLY_POST");
        if (path.equals("/api/matching/appointments"))
            return createSimple("appointments", "appointment", body, map("eventId", eventId, "status", "PROPOSED"), "id", "PROPOSED");
        if (path.equals("/api/matching/batches"))
            return createSimple("schedule_batches", "batch", body, map("eventId", eventId, "status", "DRAFT", "submitterName", actor.get("name")), "id", "DRAFT");
        if (path.equals("/api/messages/templates")) return messageTemplate(body, actor, eventId);
        if (path.equals("/api/messages/tasks")) {
            Map<String, Object> result = reviewedCreate("message_tasks", "message-task", body, actor, eventId, "MESSAGE_TASK");
            result.put("creatorName", actor.get("name"));
            result.put("recipientCount", 0);
            result.put("dedupCount", 0);
            result.put("unsubscribeCount", 0);
            result.put("invalidCount", 0);
            return result;
        }
        if (path.equals("/api/messages/unsubscribe"))
            return createSimple("unsubscribe_records", "unsubscribe", body, map("eventId", eventId, "status", "RECORDED"), "id", "RECORDED");
        return pathAction(path, body, actor);
    }

    private Map<String, Object> reviewedCreate(String table, String prefix, Map<String, Object> body, Map<String, Object> actor, String eventId, String objectType) {
        String id = sql.insert(table, prefix, body, map("eventId", eventId, "status", "PENDING", "reviewStatus", "PENDING", "submittedBy", actor.get("name"), "requestedByName", actor.get("name")));
        sql.insert("review_tasks", "review", map("eventId", eventId, "module", objectType, "objectType", objectType, "objectId", id, "title", body.get("title") == null ? objectType : body.get("title"), "submitterName", actor.get("name"), "submittedAt", Ids.now()), map("status", "PENDING"));
        return map("id", id, "status", "PENDING");
    }

    private Map<String, Object> createSimple(String table, String prefix, Map<String, Object> body, Map<String, Object> defaults, String idField, String status) {
        String id = sql.insert(table, prefix, body, defaults);
        return map(idField, id, "status", status);
    }

    private Map<String, Object> content(Map<String, Object> body, Map<String, Object> actor, String eventId) {
        String itemId = sql.insert("content_items", "content", body, map("eventId", eventId, "status", "DRAFT"));
        String versionId = sql.insert("content_versions", "content-version", body, map("itemId", itemId, "reviewStatus", "PENDING", "submittedBy", actor.get("name")));
        sql.insert("review_tasks", "review", map("eventId", eventId, "module", "内容管理", "objectType", "CONTENT_ITEM", "objectId", itemId, "versionId", versionId, "title", body.get("title"), "submitterName", actor.get("name"), "submittedAt", Ids.now()), map("status", "PENDING"));
        return map("id", itemId, "itemId", itemId, "versionId", versionId, "versionNo", 1, "status", "PENDING");
    }

    private Map<String, Object> messageTemplate(Map<String, Object> body, Map<String, Object> actor, String eventId) {
        String templateId = sql.insert("message_templates", "message-template", body, map("eventId", eventId, "status", "PENDING", "createdBy", actor.get("name")));
        String versionId = sql.insert("message_template_versions", "message-template-version", body, map("templateId", templateId, "reviewStatus", "PENDING", "submittedBy", actor.get("name")));
        sql.insert("review_tasks", "review", map("eventId", eventId, "module", "消息模板", "objectType", "MESSAGE_TEMPLATE", "objectId", templateId, "versionId", versionId, "title", body.get("name"), "submitterName", actor.get("name"), "submittedAt", Ids.now()), map("status", "PENDING"));
        return map("id", templateId, "versionId", versionId, "status", "PENDING", "submittedBy", actor.get("name"), "variables", Collections.emptyList());
    }

    private Map<String, Object> marketingPlan(Map<String, Object> body, Map<String, Object> actor, String eventId) {
        String planId = sql.insert("recruitment_plans", "plan", body, map("eventId", eventId, "status", "ACTIVE", "ownerName", actor.get("name")));
        List<Map<String, Object>> targets = new java.util.ArrayList<Map<String, Object>>();
        Object raw = body.get("targets");
        if (raw instanceof List) for (Object entry : (List<?>) raw)
            if (entry instanceof Map) {
                Map<String, Object> target = new LinkedHashMap<String, Object>((Map<String, Object>) entry);
                target.put("planId", planId);
                target.put("source", "MANUAL");
                target.put("assigneeName", actor.get("name"));
                target.put("stage", "NEW");
                String id = sql.insert("recruitment_targets", "target", target, Collections.emptyMap());
                target.put("id", id);
                targets.add(target);
            }
        return map("id", planId, "ownerName", actor.get("name"), "status", "ACTIVE", "targets", targets);
    }

    private Map<String, Object> publicCreate(String table, String prefix, Map<String, Object> body, HttpServletRequest request, Map<String, Object> defaults) {
        Map<String, Object> actor = actors.publicActor(request);
        if (actor == null) throw new ApiException(401, "请先登录观众账号");
        defaults.put("publisherPublicAccountId", actor.get("accountId"));
        defaults.put("inviterPublicAccountId", actor.get("accountId"));
        String id = sql.insert(table, prefix, body, defaults);
        return map("id", id, "status", defaults.get("status") == null ? defaults.get("reviewStatus") : defaults.get("status"));
    }

    private Map<String, Object> readAll(String recipientType, Map<String, Object> actor) {
        if (actor == null) throw new ApiException(401, "账号未登录");
        String readAt = Ids.now();
        jdbc.update("UPDATE user_notifications SET read_at=?,updated_at=? WHERE recipient_type=? AND recipient_account_id=? AND read_at IS NULL", readAt, readAt, recipientType, actor.get("accountId"));
        return map("status", "READ", "readAt", readAt);
    }

    private Map<String, Object> requireEmployee(HttpServletRequest request) {
        Map<String, Object> actor = actors.employee(request);
        if (actor == null) throw new ApiException(401, "请先登录");
        return actor;
    }

    private String currentEvent(HttpServletRequest request) {
        String id = actors.cookie(request, "expo_current_event");
        return id == null ? "evt-morocco-2026" : id;
    }

    private String agendaId(String eventId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT id FROM agendas WHERE event_id=? LIMIT 1", eventId);
        if (!rows.isEmpty()) return String.valueOf(rows.get(0).get("id"));
        return sql.insert("agendas", "agenda", map("eventId", eventId, "name", "主议程", "timezone", "Asia/Shanghai"), map("status", "DRAFT"));
    }

    private String toJson(Object value) {
        try {
            return json.writeValueAsString(value);
        } catch (Exception exception) {
            throw new ApiException(400, "JSON 数据无效");
        }
    }

    private String text(Map<String, Object> body, String key) {
        Object value = body == null ? null : body.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private Map<String, Object> map(Object... items) {
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        for (int i = 0; i + 1 < items.length; i += 2)
            if (items[i + 1] != null) result.put(String.valueOf(items[i]), items[i + 1]);
        return result;
    }

    // Specialized operations live below to keep route dispatch compact.
    private Map<String, Object> tracking(Map<String, Object> body, HttpServletRequest request) {
        return map("ignored", true);
    }

    private Map<String, Object> company(String path, Map<String, Object> body, HttpServletRequest request) {
        Map<String, Object> actor = actors.enterpriseActor(request);
        if (actor == null) throw new ApiException(401, "企业账号未登录");
        if (path.endsWith("/profile")) {
            String exhibitorId = path.split("/")[4];
            String id = sql.insert("exhibitor_profile_versions", "exhibitor-profile", body, map("eventExhibitorId", exhibitorId, "reviewStatus", "PENDING", "submittedBy", actor.get("displayName"), "profileJson", toJson(body)));
            return map("id", exhibitorId, "versionId", id, "status", "PENDING");
        }
        if (path.matches("/api/company-workspace/products/[^/]+")) {
            String productId = path.substring(path.lastIndexOf('/') + 1);
            String id = sql.insert("product_versions", "product-version", body, map("productId", productId, "reviewStatus", "PENDING", "submittedBy", actor.get("displayName"), "contentJson", toJson(body)));
            return map("id", productId, "versionId", id, "status", "PENDING");
        }
        String table = path.endsWith("appointments") ? "appointments" : path.endsWith("matching-posts") ? "demand_supply_posts" : path.endsWith("products") ? "products" : "event_exhibitors";
        String id = sql.insert(table, table, body, map("eventId", body.get("eventId"), "enterpriseId", actor.get("enterpriseId"), "status", "PENDING", "reviewStatus", "PENDING"));
        return map("id", id, "status", "PENDING");
    }

    private Map<String, Object> guest(Map<String, Object> body, Map<String, Object> actor, String eventId) {
        String masterId = sql.insert("guest_masters", "guest-master", body, map("status", "ACTIVE"));
        String guestId = sql.insert("event_guests", "event-guest", body, map("eventId", eventId, "guestMasterId", masterId, "status", "PENDING"));
        String versionId = sql.insert("guest_profile_versions", "guest-profile", body, map("eventGuestId", guestId, "reviewStatus", "PENDING", "submittedBy", actor.get("name"), "profileJson", toJson(body)));
        return map("id", guestId, "versionId", versionId, "status", "PENDING", "masterReused", false);
    }

    private Map<String, Object> agendaPublish(Map<String, Object> actor, String eventId) {
        String agenda = agendaId(eventId);
        String versionId = sql.insert("agenda_versions", "agenda-version", map("agendaId", agenda, "submittedBy", actor.get("name")), map("reviewStatus", "PENDING", "snapshotJson", "{}"));
        return map("versionId", versionId, "versionNo", 1, "status", "PENDING", "changeNotificationRequired", false);
    }

    private Map<String, Object> checkin(Map<String, Object> body, Map<String, Object> actor) {
        String recordId = String.valueOf(body.get("recordId"));
        Map<String, Object> record = sql.row("registration_records", recordId);
        if (record == null) throw new ApiException(404, "报名记录不存在");
        String id = sql.insert("checkin_logs", "checkin", body, map("recordId", recordId, "eventId", record.get("eventId"), "operatorName", actor.get("name"), "occurredAt", Ids.now()));
        sql.update("registration_records", recordId, Collections.emptyMap(), map("status", "CHECKED_IN", "checkedInAt", Ids.now()));
        return map("id", id, "recordId", recordId, "personName", record.get("personName"), "status", "CHECKED_IN", "scope", body.get("scope"), "occurredAt", Ids.now());
    }

    private Map<String, Object> pathAction(String path, Map<String, Object> body, Map<String, Object> actor) {
        String[] segments = path.split("/");
        String id = segments.length > 2 ? segments[segments.length - 2] : Ids.id("operation");
        if (path.matches("/api/checkin/[^/]+/reverse")) {
            String reversal = sql.insert("checkin_reversals", "checkin-reversal", body, map("checkinLogId", id, "operatorName", actor.get("name"), "occurredAt", Ids.now()));
            return map("id", id, "reversalId", reversal, "status", "REVERSED", "reversedAt", Ids.now());
        }
        if (path.matches("/api/portal/pages/[^/]+/versions")) {
            String pageId = path.split("/")[4];
            String versionId = sql.insert("portal_page_versions", "portal-version", body, map("pageId", pageId, "eventId", currentEventFromBody(body), "reviewStatus", "PENDING", "submittedBy", actor.get("name")));
            return map("pageId", pageId, "versionId", versionId, "status", "PENDING");
        }
        if (path.matches("/api/portal/pages/[^/]+/withdraw")) {
            String pageId = path.split("/")[4];
            sql.update("portal_pages", pageId, Collections.emptyMap(), map("status", "DRAFT"));
            return map("id", pageId, "status", "DRAFT");
        }
        if (path.matches("/api/governance/recycle-bin/[^/]+")) {
            id = segments[segments.length - 1];
            sql.update("recycle_bin_items", id, body, map("status", "RESTORED", "restoredAt", Ids.now()));
            return map("id", id, "status", "RESTORED");
        }
        if (path.matches("/api/messages/deliveries/[^/]+/retry")) {
            sql.update("message_deliveries", id, body, map("status", "SENT"));
            return map("id", id, "status", "SENT", "attempts", 1);
        }
        if (path.matches("/api/data-assets/imports/[^/]+/commit")) {
            sql.update("data_import_jobs", id, body, map("status", "COMPLETED", "committedByName", actor.get("name"), "committedAt", Ids.now()));
            return map("id", id, "status", "COMPLETED", "importedCount", 0, "reviewTaskCount", 0);
        }
        if (path.matches("/api/data-assets/merges/[^/]+/unmerge")) {
            sql.update("data_merge_records", id, body, map("status", "REVERSED", "reversedAt", Ids.now()));
            return map("id", id, "status", "REVERSED");
        }
        if (path.contains("/contact-handoff/"))
            return map("id", segments[3], "challengeId", Ids.id("handoff"), "status", path.endsWith("complete") ? "COMPLETED" : "PENDING", "testCode", "123456");
        return map("id", Ids.id("operation"), "status", "COMPLETED");
    }

    private Object currentEventFromBody(Map<String, Object> body) {
        return body.get("eventId") == null ? "evt-morocco-2026" : body.get("eventId");
    }

    private Map<String, Object> notification(String id, String type, Map<String, Object> actor) {
        if (actor == null) throw new ApiException(401, "账号未登录");
        String readAt = Ids.now();
        int count = jdbc.update("UPDATE user_notifications SET read_at=?,updated_at=? WHERE id=? AND recipient_type=? AND recipient_account_id=?", readAt, readAt, id, type, actor.get("accountId"));
        if (count == 0) throw new ApiException(404, "通知不存在或无权访问");
        return map("id", id, "status", "READ", "readAt", readAt);
    }

    private Map<String, Object> appointment(String id, Map<String, Object> body, Map<String, Object> actor) {
        if (actor == null) throw new ApiException(401, "账号未登录");
        String action = text(body, "action");
        String status = "ACCEPT".equals(action) ? "ACCEPTED" : "REJECT".equals(action) ? "REJECTED" : "CANCEL".equals(action) ? "CANCELED" : "COUNTER".equals(action) ? "COUNTERED" : actionStatus(body, "UPDATED");
        sql.update("appointments", id, body, map("status", status, "confirmedStart", "ACCEPT".equals(action) ? body.get("proposedStart") : null, "confirmedEnd", "ACCEPT".equals(action) ? body.get("proposedEnd") : null));
        return map("id", id, "status", status, "conflicts", Collections.emptyList());
    }

    private Map<String, Object> updateStatus(String table, String id, Map<String, Object> body, String status) {
        if (sql.row(table, id) == null) throw new ApiException(404, "业务对象不存在");
        sql.update(table, id, body, map("status", status, "reviewStatus", status));
        return map("id", id, "status", status, "reviewStatus", status);
    }

    private String actionStatus(Map<String, Object> body, String approved) {
        String action = text(body, "action");
        if ("APPROVE".equals(action) || "PUBLISH".equals(action)) return approved;
        if ("RETURN".equals(action)) return "RETURNED";
        if ("WITHDRAW".equals(action)) return "DRAFT";
        if ("SUBMIT".equals(action)) return "PENDING";
        return action == null ? approved : action;
    }
}
