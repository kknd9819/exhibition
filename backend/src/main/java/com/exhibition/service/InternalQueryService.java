package com.exhibition.service;

import com.exhibition.common.ApiException;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class InternalQueryService {
    private static final Pattern TABLE_REFERENCE = Pattern.compile("(?i)\\b(?:from|join)\\s+[\\\"`]?(\\w+)[\\\"`]?");
    private static final Pattern QUOTED_IDENTIFIER = Pattern.compile("\\\"([A-Za-z_][A-Za-z0-9_]*)\\\"");
    private final JdbcTemplate jdbc;
    private final Set<String> whitelist = new HashSet<String>();

    public InternalQueryService(JdbcTemplate jdbc) throws Exception {
        this.jdbc = jdbc;
        BufferedReader reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource("db/migration/table-whitelist.txt").getInputStream(), StandardCharsets.UTF_8));
        String line;
        while ((line = reader.readLine()) != null)
            if (!line.trim().isEmpty()) whitelist.add(line.trim().toLowerCase(Locale.ROOT));
    }

    public List<List<Object>> query(String sql, List<Object> params) {
        validate(sql);
        String mysqlSql = QUOTED_IDENTIFIER.matcher(sql).replaceAll("`$1`");
        return jdbc.query(mysqlSql, params == null ? new Object[0] : params.toArray(), (ResultSet resultSet) -> {
            List<List<Object>> rows = new ArrayList<List<Object>>();
            ResultSetMetaData metadata = resultSet.getMetaData();
            int count = metadata.getColumnCount();
            while (resultSet.next()) {
                List<Object> row = new ArrayList<Object>(count);
                for (int index = 1; index <= count; index += 1) row.add(resultSet.getObject(index));
                rows.add(row);
            }
            return rows;
        });
    }

    private void validate(String sql) {
        if (sql == null) throw new ApiException(400, "缺少查询语句");
        String normalized = sql.trim().toLowerCase(Locale.ROOT);
        if (!normalized.startsWith("select ") || normalized.contains(";") || normalized.contains("--") || normalized.contains("/*")) {
            throw new ApiException(400, "内部数据通道仅允许单条 SELECT 查询");
        }
        Matcher matcher = TABLE_REFERENCE.matcher(sql);
        boolean found = false;
        while (matcher.find()) {
            found = true;
            if (!whitelist.contains(matcher.group(1).toLowerCase(Locale.ROOT)))
                throw new ApiException(403, "查询包含未登记的数据表");
        }
        if (!found) throw new ApiException(400, "查询缺少业务数据表");
    }
}
