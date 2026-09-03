package com.exhibition.service;

import com.exhibition.common.Ids;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ActorService {
    public static final String EMPLOYEE_COOKIE = "expo_alpha_session";
    public static final String PUBLIC_COOKIE = "expo_public_session";
    public static final String ENTERPRISE_COOKIE = "expo_enterprise_session";
    private final JdbcTemplate jdbc;

    public ActorService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Object> employee(HttpServletRequest request) {
        String token = cookie(request, EMPLOYEE_COOKIE);
        if (token == null) return null;
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT s.id sessionId,a.id accountId,a.name,a.group_role groupRole,a.status,s.expires_at expiresAt " +
                        "FROM login_sessions s JOIN employee_accounts a ON a.id=s.account_id " +
                        "WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? LIMIT 1", Ids.sha256(token), Ids.now());
        if (rows.isEmpty() || !"ACTIVE".equals(rows.get(0).get("status"))) return null;
        Map<String, Object> actor = new LinkedHashMap<String, Object>(rows.get(0));
        actor.put("memberships", jdbc.queryForList("SELECT event_id eventId,role_code roleCode,permissions_json permissionsJson,is_reviewer isReviewer FROM event_members WHERE account_id=? AND status='ACTIVE'", actor.get("accountId")));
        return actor;
    }

    public Map<String, Object> publicActor(HttpServletRequest request) {
        String token = cookie(request, PUBLIC_COOKIE);
        if (token == null) return null;
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT s.id sessionId,a.id accountId,a.display_name displayName,a.status,s.expires_at expiresAt,s.remember_days rememberDays " +
                        "FROM public_sessions s JOIN public_accounts a ON a.id=s.account_id " +
                        "WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? LIMIT 1", Ids.sha256(token), Ids.now());
        if (rows.isEmpty() || !"ACTIVE".equals(rows.get(0).get("status"))) return null;
        Map<String, Object> actor = new LinkedHashMap<String, Object>(rows.get(0));
        actor.put("identities", jdbc.queryForList("SELECT * FROM public_identities WHERE account_id=?", actor.get("accountId")));
        return actor;
    }

    public Map<String, Object> enterpriseActor(HttpServletRequest request) {
        String token = cookie(request, ENTERPRISE_COOKIE);
        if (token == null) return null;
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT s.id sessionId,a.id accountId,e.id enterpriseId,e.name_zh enterpriseName,a.display_name displayName," +
                        "a.status accountStatus,e.status enterpriseStatus,s.expires_at expiresAt,s.remember_days rememberDays " +
                        "FROM enterprise_sessions s JOIN enterprise_accounts a ON a.id=s.account_id JOIN enterprises e ON e.id=a.enterprise_id " +
                        "WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? LIMIT 1", Ids.sha256(token), Ids.now());
        if (rows.isEmpty() || !"ACTIVE".equals(rows.get(0).get("accountStatus")) || !"ACTIVE".equals(rows.get(0).get("enterpriseStatus")))
            return null;
        Map<String, Object> actor = new LinkedHashMap<String, Object>(rows.get(0));
        actor.put("identities", jdbc.queryForList("SELECT * FROM enterprise_identities WHERE account_id=?", actor.get("accountId")));
        return actor;
    }

    public boolean isGroupAdmin(Map<String, Object> actor) {
        return actor != null && "GROUP_ADMIN".equals(actor.get("groupRole"));
    }

    public String cookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) if (name.equals(cookie.getName())) return cookie.getValue();
        return null;
    }

    public Map<String, Object> emptyActor() {
        return Collections.emptyMap();
    }
}
