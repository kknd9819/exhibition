package com.exhibition;

import com.exhibition.common.Ids;
import com.exhibition.service.CoreApiService;
import com.exhibition.service.CorePatchService;
import com.exhibition.service.ExtendedApiService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ApiContractCoverageTest {
    @Test
    void legacyContractContains107UniqueMethodPaths() throws Exception {
        Map<String, Object> contract = contract();
        List<Map<String, String>> routes = (List<Map<String, String>>) contract.get("routes");
        Set<String> unique = new HashSet<String>();
        for (Map<String, String> route : routes) unique.add(route.get("method") + " " + route.get("path"));
        assertEquals(107, routes.size());
        assertEquals(107, unique.size());
    }

    @Test
    void everyWriteContractHasAJavaHandler() throws Exception {
        CoreApiService core = new CoreApiService(null, null, null, new ObjectMapper());
        CorePatchService patch = new CorePatchService(null, null, null);
        ExtendedApiService extended = new ExtendedApiService(null, null, null, new ObjectMapper());
        List<Map<String, String>> routes = (List<Map<String, String>>) contract().get("routes");
        for (Map<String, String> route : routes) {
            String method = route.get("method"), path = route.get("path");
            if ("POST".equals(method))
                assertTrue(explicitPost(path) || core.supportsPost(path) || extended.supportsPost(path), method + " " + path);
            if ("PATCH".equals(method))
                assertTrue(path.startsWith("/api/events/") || patch.supports(path) || extended.supportsPatch(path), method + " " + path);
        }
    }

    @Test
    void sha256MatchesFrontendSessionHash() {
        assertEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad", Ids.sha256("abc"));
    }

    private boolean explicitPost(String path) {
        return path.startsWith("/api/auth/") || path.startsWith("/api/public-auth/") || path.startsWith("/api/enterprise-auth/")
                || path.equals("/api/events") || path.matches("/api/events/[^/]+/copy") || path.equals("/api/current-event")
                || path.equals("/api/data-assets/imports");
    }

    private Map<String, Object> contract() throws Exception {
        InputStream input = getClass().getResourceAsStream("/api-contract.json");
        return new ObjectMapper().readValue(input, new TypeReference<Map<String, Object>>() {
        });
    }
}
