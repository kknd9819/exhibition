package com.exhibition.controller;

import com.exhibition.common.ApiException;
import com.exhibition.service.ActorService;
import com.exhibition.service.EventService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class EventController {
    private final EventService service;
    private final ActorService actors;
    private final JdbcTemplate jdbc;

    public EventController(EventService service, ActorService actors, JdbcTemplate jdbc) {
        this.service = service;
        this.actors = actors;
        this.jdbc = jdbc;
    }

    @GetMapping("/events")
    public Map<String, Object> list() {
        return Collections.<String, Object>singletonMap("data", service.list());
    }

    @PostMapping("/events")
    public ResponseEntity<Map<String, Object>> create(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        return ResponseEntity.status(201).body(service.create(body, actors.employee(request)));
    }

    @PatchMapping("/events/{id}")
    public Map<String, Object> patch(@PathVariable String id, @RequestBody Map<String, Object> body, HttpServletRequest request) {
        return service.patch(id, body, actors.employee(request));
    }

    @PostMapping("/events/{id}/copy")
    public ResponseEntity<Map<String, Object>> copy(@PathVariable String id, @RequestBody Map<String, Object> body, HttpServletRequest request) {
        return ResponseEntity.status(201).body(service.copy(id, body, actors.employee(request)));
    }

    @PostMapping(value = "/current-event", consumes = "application/x-www-form-urlencoded")
    public ResponseEntity<Void> current(@RequestParam String eventId, @RequestParam(defaultValue = "/") String returnTo, HttpServletRequest request) {
        Map<String, Object> actor = actors.employee(request);
        if (actor == null) throw new ApiException(401, "请先登录");
        if (jdbc.queryForObject("SELECT COUNT(*) FROM events WHERE id=?", Long.class, eventId) == 0)
            throw new ApiException(404, "展会不存在");
        String safePath = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
        ResponseCookie cookie = ResponseCookie.from("expo_current_event", eventId).httpOnly(true).sameSite("Lax").path("/").maxAge(30L * 24 * 60 * 60).build();
        return ResponseEntity.status(303).location(URI.create(safePath)).header(HttpHeaders.SET_COOKIE, cookie.toString()).build();
    }

    @GetMapping("/current-event")
    public Map<String, Object> currentGet(HttpServletRequest request) {
        String eventId = actors.cookie(request, "expo_current_event");
        if (eventId == null) eventId = "evt-morocco-2026";
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM events WHERE id=? LIMIT 1", eventId);
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("event", rows.isEmpty() ? null : rows.get(0));
        return result;
    }
}
