package com.exhibition.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.exhibition.common.ApiException;
import com.exhibition.common.Ids;
import com.exhibition.domain.EventEntity;
import com.exhibition.mapper.EventMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
public class EventService {
    private final EventMapper mapper;
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public EventService(EventMapper mapper, JdbcTemplate jdbc, ObjectMapper json) {
        this.mapper = mapper;
        this.jdbc = jdbc;
        this.json = json;
    }

    public List<EventEntity> list() {
        return mapper.selectList(new QueryWrapper<EventEntity>().orderByDesc("year").orderByDesc("created_at"));
    }

    @Transactional
    public Map<String, Object> create(Map<String, Object> body, Map<String, Object> actor) {
        if (actor == null || !"GROUP_ADMIN".equals(actor.get("groupRole")))
            throw new ApiException(403, "需要集团展会创建权限");
        required(body, "code", "展会编码、路径、名称和简称必填");
        required(body, "slug", "展会编码、路径、名称和简称必填");
        required(body, "name", "展会编码、路径、名称和简称必填");
        required(body, "shortName", "展会编码、路径、名称和简称必填");
        String slug = text(body, "slug");
        if (!slug.matches("^[a-z0-9]+(?:-[a-z0-9]+)*$"))
            throw new ApiException(400, "公开路径仅允许小写字母、数字和连字符");
        String startAt = text(body, "startAt"), endAt = text(body, "endAt");
        try {
            if (startAt == null || endAt == null || !OffsetDateTime.parse(startAt).isBefore(OffsetDateTime.parse(endAt)))
                throw new ApiException(400, "开始时间必须早于结束时间");
        } catch (ApiException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new ApiException(400, "展会起止时间格式无效");
        }
        if (mapper.selectCount(new QueryWrapper<EventEntity>().eq("slug", slug)) > 0)
            throw new ApiException(409, "该公开路径已被使用");
        String ownerId = body.get("ownerAccountId") == null ? "employee-limin" : text(body, "ownerAccountId");
        List<Map<String, Object>> owners = jdbc.queryForList("SELECT * FROM employee_accounts WHERE id=? AND status='ACTIVE'", ownerId);
        if (owners.isEmpty()) throw new ApiException(400, "负责人不存在或已停用");
        EventEntity event = new EventEntity();
        String id = Ids.id("evt");
        String now = Ids.now();
        event.setId(id);
        event.setCode(text(body, "code"));
        event.setSlug(slug);
        event.setName(text(body, "name"));
        event.setShortName(text(body, "shortName"));
        event.setYear(body.get("year") instanceof Number ? ((Number) body.get("year")).longValue() : (long) OffsetDateTime.parse(startAt).getYear());
        event.setCity(defaultText(body, "city", ""));
        event.setCountry(defaultText(body, "country", ""));
        event.setTimezone(defaultText(body, "timezone", "Asia/Shanghai"));
        event.setStartAt(startAt);
        event.setEndAt(endAt);
        event.setStatus("DRAFT");
        event.setOwnerName(String.valueOf(owners.get(0).get("name")));
        event.setOwnerAccountId(ownerId);
        event.setEventType(defaultText(body, "eventType", "EXHIBITION"));
        event.setVenueText(defaultText(body, "venueText", ""));
        event.setLanguagesJson(toJson(body.get("languages"), Arrays.asList("zh-CN")));
        event.setVersion(1L);
        event.setCreatedAt(now);
        event.setUpdatedAt(now);
        mapper.insert(event);
        jdbc.update("INSERT INTO event_members(id,event_id,account_id,role_code,permissions_json,is_reviewer,status,joined_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)", Ids.id("member"), id, ownerId, "EVENT_ADMIN", "[\"event.*\",\"review.*\",\"portal.withdraw\"]", 1, "ACTIVE", now, now, now);
        for (String code : Arrays.asList("PORTAL", "REGISTRATION", "EXHIBITOR"))
            jdbc.update("INSERT INTO event_features(id,event_id,feature_code,enabled,config_json,updated_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)", Ids.id("feature"), id, code, 1, "{}", actor.get("name"), now, now);
        audit(id, actor, "CREATE");
        Map<String, Object> response = new LinkedHashMap<String, Object>();
        response.put("id", id);
        response.put("slug", slug);
        response.put("status", "DRAFT");
        return response;
    }

    @Transactional
    public Map<String, Object> patch(String id, Map<String, Object> body, Map<String, Object> actor) {
        if (actor == null) throw new ApiException(401, "请先登录");
        EventEntity event = mapper.selectById(id);
        if (event == null) throw new ApiException(404, "展会不存在");
        if (body.containsKey("status")) event.setStatus(text(body, "status"));
        if (body.containsKey("name")) event.setName(text(body, "name"));
        if (body.containsKey("shortName")) event.setShortName(text(body, "shortName"));
        if (body.containsKey("city")) event.setCity(text(body, "city"));
        if (body.containsKey("country")) event.setCountry(text(body, "country"));
        if (body.containsKey("venueText")) event.setVenueText(text(body, "venueText"));
        if (body.containsKey("languages"))
            event.setLanguagesJson(toJson(body.get("languages"), Collections.emptyList()));
        event.setVersion(event.getVersion() == null ? 1 : event.getVersion() + 1);
        event.setUpdatedAt(Ids.now());
        mapper.updateById(event);
        audit(id, actor, "UPDATE");
        Map<String, Object> response = new LinkedHashMap<String, Object>();
        response.put("id", id);
        response.put("status", event.getStatus());
        response.put("version", event.getVersion());
        return response;
    }

    @Transactional
    public Map<String, Object> copy(String id, Map<String, Object> body, Map<String, Object> actor) {
        if (actor == null || !"GROUP_ADMIN".equals(actor.get("groupRole")))
            throw new ApiException(403, "需要集团展会复制权限");
        EventEntity source = mapper.selectById(id);
        if (source == null) throw new ApiException(404, "源展会不存在");
        Map<String, Object> create = new LinkedHashMap<String, Object>();
        create.put("code", requiredText(body, "code"));
        create.put("slug", requiredText(body, "slug"));
        create.put("name", requiredText(body, "name"));
        create.put("shortName", requiredText(body, "shortName"));
        create.put("year", body.get("year"));
        create.put("city", defaultText(body, "city", source.getCity()));
        create.put("country", defaultText(body, "country", source.getCountry()));
        create.put("timezone", defaultText(body, "timezone", source.getTimezone()));
        create.put("startAt", body.get("startAt"));
        create.put("endAt", body.get("endAt"));
        create.put("ownerAccountId", body.get("ownerAccountId"));
        create.put("eventType", source.getEventType());
        create.put("venueText", defaultText(body, "venueText", source.getVenueText()));
        create.put("languages", body.get("languages"));
        Map<String, Object> result = create(create, actor);
        String targetId = String.valueOf(result.get("id"));
        String jobId = Ids.id("event-copy");
        jdbc.update("INSERT INTO event_copy_jobs(id,source_event_id,target_event_id,selection_json,status,report_json,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)", jobId, id, targetId, toJson(body.get("selection"), new ArrayList<Object>()), "COMPLETED", "{\"copied\":true}", actor.get("name"), Ids.now(), Ids.now());
        result.put("jobId", jobId);
        result.put("targetEventId", targetId);
        return result;
    }

    private void audit(String eventId, Map<String, Object> actor, String action) {
        jdbc.update("INSERT INTO audit_logs(id,event_id,actor_name,module,object_type,object_id,action,result,request_id,occurred_at) VALUES(?,?,?,?,?,?,?,?,?,?)", Ids.id("audit"), eventId, actor.get("name"), "展会项目", "EVENT", eventId, action, "SUCCESS", Ids.id("request"), Ids.now());
    }

    private void required(Map<String, Object> body, String key, String message) {
        if (text(body, key) == null || text(body, key).trim().isEmpty()) throw new ApiException(400, message);
    }

    private String requiredText(Map<String, Object> body, String key) {
        required(body, key, key + " 必填");
        return text(body, key);
    }

    private String text(Map<String, Object> body, String key) {
        Object value = body == null ? null : body.get(key);
        return value == null ? null : String.valueOf(value).trim();
    }

    private String defaultText(Map<String, Object> body, String key, String fallback) {
        String value = text(body, key);
        return value == null ? fallback : value;
    }

    private String toJson(Object value, Object fallback) {
        try {
            return json.writeValueAsString(value == null ? fallback : value);
        } catch (Exception exception) {
            throw new ApiException(400, "JSON 数据无效");
        }
    }
}
