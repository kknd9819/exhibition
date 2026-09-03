package com.exhibition.service;

import com.exhibition.common.ApiException;
import com.exhibition.common.Ids;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SqlMutationService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private final Map<String, Set<String>> columns = new ConcurrentHashMap<String, Set<String>>();

    public SqlMutationService(JdbcTemplate jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
    }

    public String insert(String table, String prefix, Map<String, Object> source, Map<String, Object> defaults) {
        Set<String> allowed = columns(table);
        Map<String, Object> values = normalize(source, allowed);
        values.putAll(normalize(defaults, allowed));
        String id = values.get("id") == null ? Ids.id(prefix) : String.valueOf(values.get("id"));
        if (allowed.contains("id")) values.put("id", id);
        addSystemValues(values, allowed);
        if (values.isEmpty()) throw new ApiException(500, "目标数据表没有可写字段");
        List<String> names = new ArrayList<String>(values.keySet());
        StringBuilder sql = new StringBuilder("INSERT INTO `").append(table).append("`(");
        StringBuilder placeholders = new StringBuilder();
        List<Object> params = new ArrayList<Object>();
        for (int index = 0; index < names.size(); index += 1) {
            if (index > 0) {
                sql.append(',');
                placeholders.append(',');
            }
            sql.append('`').append(names.get(index)).append('`');
            placeholders.append('?');
            params.add(values.get(names.get(index)));
        }
        sql.append(") VALUES(").append(placeholders).append(')');
        jdbc.update(sql.toString(), params.toArray());
        return id;
    }

    public int update(String table, String id, Map<String, Object> source, Map<String, Object> defaults) {
        Set<String> allowed = columns(table);
        Map<String, Object> values = normalize(source, allowed);
        values.putAll(normalize(defaults, allowed));
        values.remove("id");
        if (allowed.contains("updated_at")) values.put("updated_at", Ids.now());
        if (values.isEmpty()) return 0;
        StringBuilder sql = new StringBuilder("UPDATE `").append(table).append("` SET ");
        List<Object> params = new ArrayList<Object>();
        int index = 0;
        for (Map.Entry<String, Object> entry : values.entrySet()) {
            if (index++ > 0) sql.append(',');
            sql.append('`').append(entry.getKey()).append("`=?");
            params.add(entry.getValue());
        }
        sql.append(" WHERE `id`=?");
        params.add(id);
        return jdbc.update(sql.toString(), params.toArray());
    }

    public Map<String, Object> row(String table, String id) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM `" + table + "` WHERE id=? LIMIT 1", id);
        return rows.isEmpty() ? null : camel(rows.get(0));
    }

    public List<Map<String, Object>> rows(String sql, Object... args) {
        List<Map<String, Object>> source = jdbc.queryForList(sql, args);
        List<Map<String, Object>> result = new ArrayList<Map<String, Object>>(source.size());
        for (Map<String, Object> row : source) result.add(camel(row));
        return result;
    }

    public Map<String, Object> camel(Map<String, Object> row) {
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        for (Map.Entry<String, Object> entry : row.entrySet()) result.put(toCamel(entry.getKey()), entry.getValue());
        return result;
    }

    private Map<String, Object> normalize(Map<String, Object> source, Set<String> allowed) {
        if (source == null) return new LinkedHashMap<String, Object>();
        Map<String, Object> values = new LinkedHashMap<String, Object>();
        for (Map.Entry<String, Object> entry : source.entrySet()) {
            String name = toSnake(entry.getKey());
            if ("languages".equals(entry.getKey())) name = "languages_json";
            if ("countries".equals(entry.getKey())) name = "countries_json";
            if ("form".equals(entry.getKey())) name = "form_schema_json";
            if ("profile".equals(entry.getKey())) name = "profile_json";
            if (!allowed.contains(name)) continue;
            Object value = entry.getValue();
            if (value instanceof Map || value instanceof List) value = json(value);
            values.put(name, value);
        }
        return values;
    }

    private void addSystemValues(Map<String, Object> values, Set<String> allowed) {
        String now = Ids.now();
        for (String field : new String[]{"created_at", "updated_at", "occurred_at", "requested_at", "submitted_at"}) {
            if (allowed.contains(field) && !values.containsKey(field)) values.put(field, now);
        }
        if (allowed.contains("version") && !values.containsKey("version")) values.put("version", 1);
        if (allowed.contains("version_no") && !values.containsKey("version_no")) values.put("version_no", 1);
    }

    private Set<String> columns(String table) {
        if (!table.matches("^[a-z_]+$")) throw new ApiException(500, "数据表名称无效");
        Set<String> cached = columns.get(table);
        if (cached != null) return cached;
        List<String> names = jdbc.queryForList("SELECT column_name FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=?", String.class, table);
        if (names.isEmpty()) throw new ApiException(500, "目标数据表不存在：" + table);
        Set<String> result = new HashSet<String>();
        for (String name : names) result.add(name.toLowerCase(Locale.ROOT));
        columns.put(table, result);
        return result;
    }

    private String json(Object value) {
        try {
            return json.writeValueAsString(value);
        } catch (Exception exception) {
            throw new ApiException(400, "请求中的 JSON 数据无效");
        }
    }

    private String toSnake(String value) {
        return value.replaceAll("([a-z0-9])([A-Z])", "$1_$2").toLowerCase(Locale.ROOT);
    }

    private String toCamel(String value) {
        StringBuilder out = new StringBuilder();
        boolean upper = false;
        for (char item : value.toLowerCase(Locale.ROOT).toCharArray()) {
            if (item == '_') {
                upper = true;
                continue;
            }
            out.append(upper ? Character.toUpperCase(item) : item);
            upper = false;
        }
        return out.toString();
    }
}
