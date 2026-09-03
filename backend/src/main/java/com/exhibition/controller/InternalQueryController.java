package com.exhibition.controller;

import com.exhibition.common.ApiException;
import com.exhibition.service.InternalQueryService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/internal/query")
public class InternalQueryController {
    private final InternalQueryService service;
    private final String token;

    public InternalQueryController(InternalQueryService service, @Value("${exhibition.internal-query-token}") String token) {
        this.service = service;
        this.token = token;
    }

    @PostMapping
    public Map<String, Object> query(@RequestHeader(value = "X-Internal-Query-Token", required = false) String supplied,
                                     @RequestBody QueryRequest request) {
        authorize(supplied);
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("rows", service.query(request.getSql(), request.getParams()));
        return result;
    }

    @PostMapping("/batch")
    public List<Map<String, Object>> batch(@RequestHeader(value = "X-Internal-Query-Token", required = false) String supplied,
                                           @RequestBody List<QueryRequest> requests) {
        authorize(supplied);
        if (requests == null || requests.size() > 50) throw new ApiException(400, "批量查询数量超出限制");
        List<Map<String, Object>> results = new ArrayList<Map<String, Object>>();
        for (QueryRequest request : requests)
            results.add(Collections.<String, Object>singletonMap("rows", service.query(request.getSql(), request.getParams())));
        return results;
    }

    private void authorize(String supplied) {
        if (supplied == null || !constantTimeEquals(token, supplied)) throw new ApiException(403, "内部查询凭据无效");
    }

    private boolean constantTimeEquals(String expected, String actual) {
        if (expected.length() != actual.length()) return false;
        int value = 0;
        for (int index = 0; index < expected.length(); index += 1)
            value |= expected.charAt(index) ^ actual.charAt(index);
        return value == 0;
    }

    public static class QueryRequest {
        private String sql;
        private List<Object> params = new ArrayList<Object>();
        private String method;

        public String getSql() {
            return sql;
        }

        public void setSql(String sql) {
            this.sql = sql;
        }

        public List<Object> getParams() {
            return params;
        }

        public void setParams(List<Object> params) {
            this.params = params;
        }

        public String getMethod() {
            return method;
        }

        public void setMethod(String method) {
            this.method = method;
        }
    }
}
