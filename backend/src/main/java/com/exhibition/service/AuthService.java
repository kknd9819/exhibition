package com.exhibition.service;

import com.exhibition.common.ApiException;
import com.exhibition.common.Ids;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.regex.Pattern;

@Service
public class AuthService {
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private final JdbcTemplate jdbc;
    private final boolean showOtp;

    public AuthService(JdbcTemplate jdbc, @Value("${exhibition.alpha-show-otp}") boolean showOtp) {
        this.jdbc = jdbc;
        this.showOtp = showOtp;
    }

    public Map<String, Object> sendEmployee(String identifier) {
        String normalized = normalize(identifier);
        if (normalized.isEmpty()) throw new ApiException(400, "请输入手机号或邮箱");
        List<Map<String, Object>> accounts = jdbc.queryForList("SELECT * FROM employee_accounts WHERE lower(mobile)=? OR lower(email)=? LIMIT 1", normalized, normalized);
        if (accounts.isEmpty() || !"ACTIVE".equals(accounts.get(0).get("status")))
            throw new ApiException(404, "账号不存在或已停用");
        String challengeId = Ids.id("otp");
        String code = otp();
        String now = Ids.now();
        String expiresAt = plusHours(OffsetDateTime.now(ZoneOffset.UTC), 5.0 / 60.0);
        jdbc.update("INSERT INTO otp_challenges(id,account_id,channel,destination_masked,code_hash,expires_at,attempts,created_at) VALUES(?,?,?,?,?,?,?,?)",
                challengeId, accounts.get(0).get("id"), normalized.contains("@") ? "EMAIL" : "SMS", mask(normalized), Ids.sha256(code), expiresAt, 0, now);
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("challengeId", challengeId);
        result.put("destinationMasked", mask(normalized));
        result.put("expiresIn", 300);
        if (showOtp) result.put("alphaCode", code);
        result.put("delivery", showOtp ? "LOCAL_ALPHA_DISPLAY" : "PROVIDER");
        return result;
    }

    public LoginResult verifyEmployee(String challengeId, String code) {
        if (blank(challengeId) || blank(code)) throw new ApiException(400, "验证码会话和验证码必填");
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM otp_challenges WHERE id=? LIMIT 1", challengeId);
        if (rows.isEmpty() || rows.get(0).get("consumed_at") != null) throw new ApiException(410, "验证码已失效");
        Map<String, Object> challenge = rows.get(0);
        if (String.valueOf(challenge.get("expires_at")).compareTo(Ids.now()) <= 0 || number(challenge.get("attempts")) >= 5)
            throw new ApiException(410, "验证码已过期或尝试次数过多");
        if (!Ids.sha256(code).equals(challenge.get("code_hash"))) {
            jdbc.update("UPDATE otp_challenges SET attempts=COALESCE(attempts,0)+1 WHERE id=?", challengeId);
            throw new ApiException(401, "验证码不正确");
        }
        Map<String, Object> account = jdbc.queryForMap("SELECT * FROM employee_accounts WHERE id=?", challenge.get("account_id"));
        if (!"ACTIVE".equals(account.get("status"))) throw new ApiException(403, "账号已停用");
        String token = Ids.token();
        String sessionId = Ids.id("session");
        String expiresAt = plusHours(OffsetDateTime.now(ZoneOffset.UTC), 8);
        jdbc.update("UPDATE otp_challenges SET consumed_at=? WHERE id=?", Ids.now(), challengeId);
        jdbc.update("INSERT INTO login_sessions(id,account_id,token_hash,expires_at,device,created_at,last_seen_at) VALUES(?,?,?,?,?,?,?)",
                sessionId, account.get("id"), Ids.sha256(token), expiresAt, "WEB", Ids.now(), Ids.now());
        jdbc.update("UPDATE employee_accounts SET last_login_at=?,updated_at=? WHERE id=?", Ids.now(), Ids.now(), account.get("id"));
        Map<String, Object> response = new LinkedHashMap<String, Object>();
        Map<String, Object> accountView = new LinkedHashMap<String, Object>();
        accountView.put("id", account.get("id"));
        accountView.put("name", account.get("name"));
        response.put("account", accountView);
        response.put("expiresAt", expiresAt);
        return new LoginResult(response, token, 8 * 60 * 60);
    }

    public Map<String, Object> sendPublic(String identifier) {
        Identity identity = identity(identifier);
        String challengeId = Ids.id("public-otp");
        String code = otp();
        jdbc.update("INSERT INTO public_otp_challenges(id,identity_type,normalized_value,destination_masked,code_hash,expires_at,attempt_count,created_at) VALUES(?,?,?,?,?,?,?,?)",
                challengeId, identity.type, identity.value, identity.masked, Ids.sha256(code), plusHours(OffsetDateTime.now(ZoneOffset.UTC), 5.0 / 60.0), 0, Ids.now());
        Map<String, Object> response = new LinkedHashMap<String, Object>();
        response.put("challengeId", challengeId);
        response.put("destinationMasked", identity.masked);
        response.put("expiresInSeconds", 300);
        if (showOtp) response.put("testCode", code);
        return response;
    }

    public LoginResult verifyPublic(String challengeId, String code, boolean remember) {
        Map<String, Object> challenge = challenge("public_otp_challenges", challengeId, code, "attempt_count");
        List<Map<String, Object>> identities = jdbc.queryForList("SELECT * FROM public_identities WHERE identity_type=? AND normalized_value=? LIMIT 1", challenge.get("identity_type"), challenge.get("normalized_value"));
        String accountId;
        if (identities.isEmpty()) {
            accountId = Ids.id("public-account");
            String personId = Ids.id("person-master");
            jdbc.update("INSERT INTO person_masters(id,display_name,status,created_at,updated_at) VALUES(?,?,?,?,?)", personId, challenge.get("destination_masked"), "ACTIVE", Ids.now(), Ids.now());
            jdbc.update("INSERT INTO public_accounts(id,person_master_id,display_name,status,created_at,updated_at) VALUES(?,?,?,?,?,?)", accountId, personId, challenge.get("destination_masked"), "ACTIVE", Ids.now(), Ids.now());
            jdbc.update("INSERT INTO public_identities(id,account_id,identity_type,normalized_value,display_masked,verified_at,created_at) VALUES(?,?,?,?,?,?,?)", Ids.id("public-identity"), accountId, challenge.get("identity_type"), challenge.get("normalized_value"), challenge.get("destination_masked"), Ids.now(), Ids.now());
        } else accountId = String.valueOf(identities.get(0).get("account_id"));
        jdbc.update("UPDATE public_otp_challenges SET consumed_at=? WHERE id=?", Ids.now(), challengeId);
        return createExternalSession("public_sessions", "public-session", accountId, remember, challenge.get("destination_masked"));
    }

    public Map<String, Object> sendEnterprise(String identifier) {
        Identity identity = identity(identifier);
        List<Map<String, Object>> identities = jdbc.queryForList("SELECT i.*,a.status FROM enterprise_identities i JOIN enterprise_accounts a ON a.id=i.account_id WHERE i.identity_type=? AND i.normalized_value=? LIMIT 1", identity.type, identity.value);
        if (identities.isEmpty() || !"ACTIVE".equals(identities.get(0).get("status")))
            throw new ApiException(404, "企业账号不存在或已停用");
        String challengeId = Ids.id("enterprise-otp");
        String code = otp();
        jdbc.update("INSERT INTO enterprise_otp_challenges(id,account_id,identity_type,normalized_value,destination_masked,code_hash,expires_at,attempt_count,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
                challengeId, identities.get(0).get("account_id"), identity.type, identity.value, identity.masked, Ids.sha256(code), plusHours(OffsetDateTime.now(ZoneOffset.UTC), 5.0 / 60.0), 0, Ids.now());
        Map<String, Object> response = new LinkedHashMap<String, Object>();
        response.put("challengeId", challengeId);
        response.put("destinationMasked", identity.masked);
        response.put("expiresInSeconds", 300);
        if (showOtp) response.put("testCode", code);
        return response;
    }

    public LoginResult verifyEnterprise(String challengeId, String code, boolean remember) {
        Map<String, Object> challenge = challenge("enterprise_otp_challenges", challengeId, code, "attempt_count");
        jdbc.update("UPDATE enterprise_otp_challenges SET consumed_at=? WHERE id=?", Ids.now(), challengeId);
        return createExternalSession("enterprise_sessions", "enterprise-session", String.valueOf(challenge.get("account_id")), remember, challenge.get("destination_masked"));
    }

    public LoginResult simulateWechat() {
        String accountId = Ids.id("public-account");
        String personId = Ids.id("person-master");
        String identity = Ids.id("wechat-alpha");
        jdbc.update("INSERT INTO person_masters(id,display_name,status,created_at,updated_at) VALUES(?,?,?,?,?)", personId, "微信测试用户", "ACTIVE", Ids.now(), Ids.now());
        jdbc.update("INSERT INTO public_accounts(id,person_master_id,display_name,status,created_at,updated_at) VALUES(?,?,?,?,?,?)", accountId, personId, "微信测试用户", "ACTIVE", Ids.now(), Ids.now());
        jdbc.update("INSERT INTO public_identities(id,account_id,identity_type,normalized_value,display_masked,verified_at,created_at) VALUES(?,?,?,?,?,?,?)", Ids.id("public-identity"), accountId, "WECHAT", identity, "微信授权身份", Ids.now(), Ids.now());
        LoginResult login = createExternalSession("public_sessions", "public-session", accountId, true, "微信测试用户");
        login.body.put("alphaSimulation", true);
        return login;
    }

    private LoginResult createExternalSession(String table, String prefix, String accountId, boolean remember, Object displayName) {
        String token = Ids.token();
        int seconds = remember ? 15 * 24 * 60 * 60 : 8 * 60 * 60;
        String expiresAt = plusHours(OffsetDateTime.now(ZoneOffset.UTC), seconds / 3600.0);
        jdbc.update("INSERT INTO " + table + "(id,account_id,token_hash,remember_days,expires_at,last_seen_at,created_at) VALUES(?,?,?,?,?,?,?)", Ids.id(prefix), accountId, Ids.sha256(token), remember ? 15 : 0, expiresAt, Ids.now(), Ids.now());
        Map<String, Object> body = new LinkedHashMap<String, Object>();
        body.put("accountId", accountId);
        body.put("displayName", displayName);
        body.put("expiresAt", expiresAt);
        body.put("rememberDays", remember ? 15 : 0);
        return new LoginResult(body, token, seconds);
    }

    private Map<String, Object> challenge(String table, String challengeId, String code, String attemptsColumn) {
        if (blank(challengeId) || code == null || !code.matches("^\\d{6}$"))
            throw new ApiException(400, "验证码格式不正确");
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM " + table + " WHERE id=? LIMIT 1", challengeId);
        if (rows.isEmpty() || rows.get(0).get("consumed_at") != null)
            throw new ApiException(409, "验证码不存在或已经使用");
        Map<String, Object> challenge = rows.get(0);
        if (String.valueOf(challenge.get("expires_at")).compareTo(Ids.now()) <= 0)
            throw new ApiException(410, "验证码已过期");
        if (number(challenge.get(attemptsColumn)) >= 5) throw new ApiException(429, "验证码尝试次数过多");
        if (!Ids.sha256(code).equals(challenge.get("code_hash"))) {
            jdbc.update("UPDATE " + table + " SET " + attemptsColumn + "=COALESCE(" + attemptsColumn + ",0)+1 WHERE id=?", challengeId);
            throw new ApiException(401, "验证码不正确");
        }
        return challenge;
    }

    private Identity identity(String source) {
        String value = normalize(source).replaceAll("[\\s()\\-]", "");
        if (EMAIL.matcher(value).matches())
            return new Identity("EMAIL", value, value.substring(0, Math.min(2, value.indexOf('@'))) + "***@" + value.substring(value.indexOf('@') + 1));
        if (value.matches("^1\\d{10}$"))
            return new Identity("CN_MOBILE", value, value.substring(0, 3) + "****" + value.substring(7));
        if (value.matches("^\\+[1-9]\\d{6,14}$"))
            return new Identity("INTL_MOBILE", value, value.substring(0, Math.min(4, value.length())) + " *** " + value.substring(value.length() - 3));
        throw new ApiException(400, "请输入有效的中国手机号、国际手机号或邮箱");
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private boolean blank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private long number(Object value) {
        return value == null ? 0 : Long.parseLong(String.valueOf(value));
    }

    private String otp() {
        return String.format("%06d", ThreadLocalRandom.current().nextInt(1000000));
    }

    private String mask(String value) {
        if (value.contains("@"))
            return value.substring(0, Math.min(2, value.indexOf('@'))) + "***@" + value.substring(value.indexOf('@') + 1);
        return value.length() > 7 ? value.substring(0, 3) + "****" + value.substring(value.length() - 4) : "***";
    }

    private String plusHours(OffsetDateTime dateTime, double hours) {
        return dateTime.plusSeconds((long) (hours * 3600)).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    }

    private static class Identity {
        final String type;
        final String value;
        final String masked;

        Identity(String type, String value, String masked) {
            this.type = type;
            this.value = value;
            this.masked = masked;
        }
    }

    public static class LoginResult {
        public final Map<String, Object> body;
        public final String token;
        public final int maxAge;

        public LoginResult(Map<String, Object> body, String token, int maxAge) {
            this.body = body;
            this.token = token;
            this.maxAge = maxAge;
        }
    }
}
