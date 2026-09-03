package com.exhibition.controller;

import com.exhibition.common.Ids;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class SystemController {
    private final JdbcTemplate jdbc;

    public SystemController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/ping")
    public Map<String, Object> ping() {
        jdbc.queryForObject("SELECT 1", Integer.class);
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("status", "UP");
        result.put("database", "MYSQL");
        result.put("checkedAt", Ids.now());
        return result;
    }
}
