package com.exhibition.controller;

import com.exhibition.common.Ids;
import com.exhibition.service.ActorService;
import com.exhibition.service.AuthService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AuthController {
    private final AuthService auth;
    private final ActorService actors;
    private final JdbcTemplate jdbc;

    public AuthController(AuthService auth, ActorService actors, JdbcTemplate jdbc) {
        this.auth = auth;
        this.actors = actors;
        this.jdbc = jdbc;
    }

    @PostMapping("/auth/otp/send")
    public Map<String, Object> sendEmployee(@RequestBody Map<String, Object> body) {
        return auth.sendEmployee(text(body, "identifier"));
    }

    @PostMapping("/auth/otp/verify")
    public ResponseEntity<Map<String, Object>> verifyEmployee(@RequestBody Map<String, Object> body) {
        return login(auth.verifyEmployee(text(body, "challengeId"), text(body, "code")), ActorService.EMPLOYEE_COOKIE);
    }

    @PostMapping("/public-auth/otp/send")
    public Map<String, Object> sendPublic(@RequestBody Map<String, Object> body) {
        return auth.sendPublic(text(body, "identifier"));
    }

    @PostMapping("/public-auth/otp/verify")
    public ResponseEntity<Map<String, Object>> verifyPublic(@RequestBody Map<String, Object> body) {
        return login(auth.verifyPublic(text(body, "challengeId"), text(body, "code"), Boolean.TRUE.equals(body.get("remember"))), ActorService.PUBLIC_COOKIE);
    }

    @PostMapping("/public-auth/wechat/simulate")
    public ResponseEntity<Map<String, Object>> wechat() {
        return login(auth.simulateWechat(), ActorService.PUBLIC_COOKIE);
    }

    @PostMapping("/enterprise-auth/otp/send")
    public Map<String, Object> sendEnterprise(@RequestBody Map<String, Object> body) {
        return auth.sendEnterprise(text(body, "identifier"));
    }

    @PostMapping("/enterprise-auth/otp/verify")
    public ResponseEntity<Map<String, Object>> verifyEnterprise(@RequestBody Map<String, Object> body) {
        return login(auth.verifyEnterprise(text(body, "challengeId"), text(body, "code"), Boolean.TRUE.equals(body.get("remember"))), ActorService.ENTERPRISE_COOKIE);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(HttpServletRequest request) {
        Map<String, Object> actor = actors.employee(request);
        return actor == null ? ResponseEntity.status(401).body(Collections.<String, Object>singletonMap("error", "请先登录")) : ResponseEntity.ok(actor);
    }

    @GetMapping("/public-auth/me")
    public ResponseEntity<Map<String, Object>> publicMe(HttpServletRequest request) {
        Map<String, Object> actor = actors.publicActor(request);
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("account", actor);
        return ResponseEntity.status(actor == null ? 401 : 200).body(result);
    }

    @GetMapping("/enterprise-auth/me")
    public ResponseEntity<Map<String, Object>> enterpriseMe(HttpServletRequest request) {
        Map<String, Object> actor = actors.enterpriseActor(request);
        return actor == null ? ResponseEntity.status(401).body(Collections.<String, Object>singletonMap("error", "企业账号未登录")) : ResponseEntity.ok(actor);
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<Map<String, Object>> logoutEmployee(HttpServletRequest request) {
        return logout(request, ActorService.EMPLOYEE_COOKIE, "login_sessions");
    }

    @PostMapping("/public-auth/logout")
    public ResponseEntity<Map<String, Object>> logoutPublic(HttpServletRequest request) {
        return logout(request, ActorService.PUBLIC_COOKIE, "public_sessions");
    }

    @PostMapping("/enterprise-auth/logout")
    public ResponseEntity<Map<String, Object>> logoutEnterprise(HttpServletRequest request) {
        return logout(request, ActorService.ENTERPRISE_COOKIE, "enterprise_sessions");
    }

    private ResponseEntity<Map<String, Object>> login(AuthService.LoginResult result, String cookie) {
        ResponseCookie responseCookie = ResponseCookie.from(cookie, result.token).httpOnly(true).sameSite("Lax").path("/").maxAge(result.maxAge).build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, responseCookie.toString()).body(result.body);
    }

    private ResponseEntity<Map<String, Object>> logout(HttpServletRequest request, String cookieName, String table) {
        String token = actors.cookie(request, cookieName);
        if (token != null)
            jdbc.update("UPDATE " + table + " SET revoked_at=? WHERE token_hash=?", Ids.now(), Ids.sha256(token));
        ResponseCookie cookie = ResponseCookie.from(cookieName, "").httpOnly(true).sameSite("Lax").path("/").maxAge(0).build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(Collections.<String, Object>singletonMap("ok", true));
    }

    private String text(Map<String, Object> body, String key) {
        Object value = body == null ? null : body.get(key);
        return value == null ? null : String.valueOf(value);
    }
}
