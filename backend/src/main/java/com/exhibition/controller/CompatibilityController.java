package com.exhibition.controller;

import com.exhibition.common.ApiException;
import com.exhibition.common.Ids;
import com.exhibition.service.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class CompatibilityController {
    private final CoreApiService core;
    private final CorePatchService patches;
    private final ExtendedApiService extended;
    private final ActorService actors;
    private final SqlMutationService sql;
    private final JdbcTemplate jdbc;

    public CompatibilityController(CoreApiService core, CorePatchService patches, ExtendedApiService extended, ActorService actors, SqlMutationService sql, JdbcTemplate jdbc) {
        this.core = core;
        this.patches = patches;
        this.extended = extended;
        this.actors = actors;
        this.sql = sql;
        this.jdbc = jdbc;
    }

    @PostMapping("/**")
    public ResponseEntity<Map<String, Object>> post(@RequestBody(required = false) Map<String, Object> body, HttpServletRequest request) {
        String path = request.getRequestURI();
        Map<String, Object> payload = body == null ? new LinkedHashMap<String, Object>() : body;
        Map<String, Object> response;
        if (core.supportsPost(path)) response = core.post(path, payload, request);
        else if (extended.supportsPost(path)) response = extended.post(path, payload, request);
        else throw new ApiException(404, "接口不存在：" + path);
        return ResponseEntity.status(path.endsWith("merge-preview") || path.endsWith("read-all") ? 200 : 201).body(response);
    }

    @PatchMapping("/**")
    public Map<String, Object> patch(@RequestBody(required = false) Map<String, Object> body, HttpServletRequest request) {
        String path = request.getRequestURI();
        Map<String, Object> payload = body == null ? new LinkedHashMap<String, Object>() : body;
        if (patches.supports(path)) return patches.patch(path, payload, request);
        if (extended.supportsPatch(path)) return extended.patch(path, payload, request);
        throw new ApiException(404, "接口不存在：" + path);
    }

    @GetMapping("/**")
    public Object get(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.equals("/api/reviews")) return reviews(request);
        if (path.matches("/api/registrations/activities/[^/]+")) return activity(path);
        if (path.equals("/api/checkin/lookup")) return checkinLookup(request);
        if (path.equals("/api/matching/my-schedule")) return schedule(request);
        if (path.equals("/api/operations/health-summary")) return health(request);
        if (path.equals("/api/governance/audit-logs"))
            return Collections.singletonMap("data", sql.rows("SELECT * FROM audit_logs ORDER BY occurred_at DESC LIMIT 500"));
        if (path.equals("/api/governance/recycle-bin"))
            return Collections.singletonMap("data", sql.rows("SELECT * FROM recycle_bin_items ORDER BY deleted_at DESC LIMIT 300"));
        if (path.equals("/api/data-assets/imports"))
            return Collections.singletonMap("data", sql.rows("SELECT * FROM data_import_jobs WHERE event_id=? ORDER BY created_at DESC", currentEvent(request)));
        if (path.equals("/api/data-assets/exports"))
            return Collections.singletonMap("data", sql.rows("SELECT * FROM sensitive_export_requests ORDER BY requested_at DESC"));
        if (path.matches("/api/data-assets/imports/[^/]+/errors")) return importErrors(path);
        if (path.contains("/download") || path.equals("/api/analytics/export")) return download(path, request);
        if (path.matches("/api/marketing/channels/[^/]+/qr")) return svgQr(path);
        throw new ApiException(404, "接口不存在：" + path);
    }

    @DeleteMapping("/**")
    public Map<String, Object> delete(HttpServletRequest request) {
        Map<String, Object> actor = actors.employee(request);
        if (actor == null) throw new ApiException(401, "请先登录");
        String path = request.getRequestURI();
        String id = path.substring(path.lastIndexOf('/') + 1);
        String table = path.contains("/content/assets/") ? "assets" : path.contains("/content/items/") ? "content_items" : null;
        if (table == null) throw new ApiException(404, "接口不存在");
        sql.update(table, id, Collections.emptyMap(), map("status", "DELETED"));
        return map("id", id, "status", "DELETED");
    }

    private Map<String, Object> reviews(HttpServletRequest request) {
        Map<String, Object> actor = actors.employee(request);
        if (actor == null) throw new ApiException(401, "请先登录");
        String eventId = parameter(request, "eventId", currentEvent(request));
        return Collections.<String, Object>singletonMap("data", sql.rows("SELECT * FROM review_tasks WHERE event_id=? ORDER BY submitted_at DESC", eventId));
    }

    private Map<String, Object> activity(String path) {
        String id = path.substring(path.lastIndexOf('/') + 1);
        Map<String, Object> row = sql.row("registration_activities", id);
        if (row == null) throw new ApiException(404, "报名活动不存在");
        return row;
    }

    private Map<String, Object> checkinLookup(HttpServletRequest request) {
        if (actors.employee(request) == null) throw new ApiException(403, "无签到查询权限");
        String eventId = parameter(request, "eventId", ""), query = parameter(request, "query", "").toLowerCase();
        if (eventId.isEmpty() || query.isEmpty()) throw new ApiException(400, "缺少展会或查询条件");
        String like = "%" + query + "%";
        List<Map<String, Object>> rows = sql.rows("SELECT r.*,a.name activityName,c.code accessCode FROM registration_records r LEFT JOIN registration_activities a ON a.id=r.activity_id LEFT JOIN registration_access_codes c ON c.record_id=r.id WHERE r.event_id=? AND (lower(r.person_name) LIKE ? OR lower(r.organization) LIKE ? OR lower(r.mobile_masked) LIKE ? OR lower(r.id) LIKE ?) LIMIT 20", eventId, like, like, like, like);
        return map("eventId", eventId, "results", rows);
    }

    private Map<String, Object> schedule(HttpServletRequest request) {
        Map<String, Object> actor = actors.employee(request);
        if (actor == null) throw new ApiException(401, "请先登录后查看本人安排");
        List<Map<String, Object>> rows = sql.rows("SELECT * FROM meeting_schedules WHERE event_id=? AND publish_status='PUBLISHED' AND (participant_a=? OR participant_b=?) ORDER BY start_at", currentEvent(request), actor.get("name"), actor.get("name"));
        return map("account", map("name", actor.get("name")), "data", rows);
    }

    private Map<String, Object> health(HttpServletRequest request) {
        Map<String, Object> actor = actors.employee(request);
        if (!actors.isGroupAdmin(actor)) throw new ApiException(403, "仅集团管理员可查看系统健康摘要");
        return map("requestId", Ids.id("request"), "checkedAt", Ids.now(), "environment", "LOCAL_ALPHA", "services", map("application", "UP", "database", "UP", "fileStorage", "LOCAL"), "counts", map("events", jdbc.queryForObject("SELECT COUNT(*) FROM events", Long.class), "failedMetricRuns", count("metric_snapshot_runs", "FAILED"), "failedReportRuns", count("report_runs", "FAILED"), "deadLetters", count("message_deliveries", "DEAD_LETTER")), "sla", map("status", "TBD", "reference", "PERFORMANCE-TBD-001"));
    }

    private long count(String table, String status) {
        Long value = jdbc.queryForObject("SELECT COUNT(*) FROM " + table + " WHERE status=?", Long.class, status);
        return value == null ? 0 : value;
    }

    private Map<String, Object> importErrors(String path) {
        String id = path.split("/")[4];
        Map<String, Object> row = sql.row("data_import_jobs", id);
        if (row == null) throw new ApiException(404, "导入任务不存在");
        return map("id", id, "errors", row.get("errorReportJson"));
    }

    private ResponseEntity<byte[]> download(String path, HttpServletRequest request) {
        if (actors.employee(request) == null && actors.publicActor(request) == null)
            throw new ApiException(401, "请先登录");
        String content = "\uFEFF类型,编号,生成时间\r\n兼容导出," + path.replace(',', '_') + "," + Ids.now();
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=exhibition-export.csv").contentType(new MediaType("text", "csv", StandardCharsets.UTF_8)).body(content.getBytes(StandardCharsets.UTF_8));
    }

    private ResponseEntity<byte[]> svgQr(String path) {
        String svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"240\" height=\"240\"><rect width=\"240\" height=\"240\" fill=\"white\"/><text x=\"20\" y=\"120\">" + path.replace("&", "&amp;").replace("<", "&lt;") + "</text></svg>";
        return ResponseEntity.ok().contentType(MediaType.valueOf("image/svg+xml")).body(svg.getBytes(StandardCharsets.UTF_8));
    }

    private String currentEvent(HttpServletRequest request) {
        String id = actors.cookie(request, "expo_current_event");
        return id == null ? "evt-morocco-2026" : id;
    }

    private String parameter(HttpServletRequest request, String name, String fallback) {
        String value = request.getParameter(name);
        return value == null ? fallback : value;
    }

    private Map<String, Object> map(Object... items) {
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        for (int i = 0; i + 1 < items.length; i += 2)
            if (items[i + 1] != null) result.put(String.valueOf(items[i]), items[i + 1]);
        return result;
    }
}
