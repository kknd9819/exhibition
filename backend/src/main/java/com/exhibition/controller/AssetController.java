package com.exhibition.controller;

import com.exhibition.common.ApiException;
import com.exhibition.common.Ids;
import com.exhibition.service.ActorService;
import com.exhibition.service.SqlMutationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/content")
public class AssetController {
    private final ActorService actors;
    private final SqlMutationService sql;
    private final Path storageRoot;

    public AssetController(ActorService actors, SqlMutationService sql, @Value("${exhibition.file-storage-root}") String storageRoot) {
        this.actors = actors;
        this.sql = sql;
        this.storageRoot = Paths.get(storageRoot).toAbsolutePath().normalize();
    }

    @PostMapping(value = "/assets", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> upload(@RequestParam("file") MultipartFile file, @RequestParam(defaultValue = "EVENT") String scope, HttpServletRequest request) throws Exception {
        Map<String, Object> actor = actors.employee(request);
        if (actor == null) throw new ApiException(401, "请先登录");
        if (file.isEmpty() || file.getOriginalFilename() == null) throw new ApiException(400, "请选择素材文件");
        if (file.getSize() > 25L * 1024 * 1024) throw new ApiException(413, "素材文件不能超过25MB");
        byte[] bytes = file.getBytes();
        String mime = detect(bytes);
        if (mime == null) throw new ApiException(415, "文件头与允许的 PDF、PNG、JPEG、WebP、MP4 格式不匹配");
        String id = Ids.id("asset"), extension = extension(mime), key = id + extension;
        Files.createDirectories(storageRoot);
        Path target = storageRoot.resolve(key).normalize();
        if (!target.startsWith(storageRoot)) throw new ApiException(400, "文件存储路径无效");
        Files.write(target, bytes);
        String eventId = actors.cookie(request, "expo_current_event");
        if (eventId == null) eventId = "evt-morocco-2026";
        Map<String, Object> values = map("id", id, "eventId", eventId, "scope", scope, "originalName", file.getOriginalFilename(), "storageKey", key, "assetType", "application/pdf".equals(mime) ? "DOCUMENT" : mime.startsWith("video/") ? "VIDEO" : "IMAGE", "mimeType", mime, "sizeBytes", bytes.length, "sha256", Ids.sha256(bytes), "status", "READY", "scanResult", "FORMAT_VALIDATED", "createdBy", actor.get("name"));
        sql.insert("assets", "asset", values, Collections.emptyMap());
        return ResponseEntity.status(201).body(map("id", id, "originalName", file.getOriginalFilename(), "mimeType", mime, "sizeBytes", bytes.length, "status", "READY", "scanResult", "FORMAT_VALIDATED"));
    }

    @GetMapping("/documents/{id}/download")
    public ResponseEntity<byte[]> download(@PathVariable String id, HttpServletRequest request) throws Exception {
        List<Map<String, Object>> documents = sql.rows("SELECT d.title,a.storage_key storageKey,a.mime_type mimeType FROM document_items d JOIN assets a ON a.id=d.file_asset_id WHERE d.id=? AND d.status='PUBLISHED' LIMIT 1", id);
        if (documents.isEmpty()) throw new ApiException(404, "文档不存在或尚未发布");
        Map<String, Object> item = documents.get(0);
        Path target = storageRoot.resolve(String.valueOf(item.get("storageKey"))).normalize();
        if (!target.startsWith(storageRoot) || !Files.isRegularFile(target))
            throw new ApiException(404, "文档文件不存在");
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=document-" + id + extension(String.valueOf(item.get("mimeType")))).contentType(MediaType.parseMediaType(String.valueOf(item.get("mimeType")))).body(Files.readAllBytes(target));
    }

    private String detect(byte[] value) {
        if (value.length >= 4 && value[0] == '%' && value[1] == 'P' && value[2] == 'D' && value[3] == 'F')
            return "application/pdf";
        if (value.length >= 8 && value[0] == (byte) 0x89 && value[1] == 'P' && value[2] == 'N' && value[3] == 'G')
            return "image/png";
        if (value.length >= 3 && value[0] == (byte) 0xff && value[1] == (byte) 0xd8 && value[2] == (byte) 0xff)
            return "image/jpeg";
        if (value.length >= 12 && value[0] == 'R' && value[1] == 'I' && value[2] == 'F' && value[3] == 'F' && value[8] == 'W' && value[9] == 'E' && value[10] == 'B' && value[11] == 'P')
            return "image/webp";
        if (value.length >= 12 && value[4] == 'f' && value[5] == 't' && value[6] == 'y' && value[7] == 'p')
            return "video/mp4";
        return null;
    }

    private String extension(String mime) {
        if ("application/pdf".equals(mime)) return ".pdf";
        if ("image/png".equals(mime)) return ".png";
        if ("image/jpeg".equals(mime)) return ".jpg";
        if ("image/webp".equals(mime)) return ".webp";
        if ("video/mp4".equals(mime)) return ".mp4";
        return ".bin";
    }

    private Map<String, Object> map(Object... items) {
        Map<String, Object> result = new LinkedHashMap<String, Object>();
        for (int i = 0; i + 1 < items.length; i += 2)
            if (items[i + 1] != null) result.put(String.valueOf(items[i]), items[i + 1]);
        return result;
    }
}
