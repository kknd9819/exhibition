package com.exhibition.controller;

import com.exhibition.common.ApiException;
import com.exhibition.common.Ids;
import com.exhibition.service.ActorService;
import com.exhibition.service.SqlMutationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.util.*;

@RestController
@RequestMapping("/api/data-assets/imports")
public class ImportController {
    private final ActorService actors;
    private final SqlMutationService sql;
    private final ObjectMapper json;

    public ImportController(ActorService actors, SqlMutationService sql, ObjectMapper json) {
        this.actors = actors;
        this.sql = sql;
        this.json = json;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> upload(@RequestParam("file") MultipartFile file, HttpServletRequest request) throws Exception {
        Map<String, Object> actor = actors.employee(request);
        if (actor == null) throw new ApiException(401, "请先登录");
        if (file.isEmpty() || file.getOriginalFilename() == null) throw new ApiException(400, "请选择Excel文件");
        if (!file.getOriginalFilename().toLowerCase().endsWith(".xlsx"))
            throw new ApiException(400, "仅支持.xlsx工作簿，请使用系统模板");
        if (file.getSize() > 2L * 1024 * 1024) throw new ApiException(413, "文件不能超过2MB");
        List<Map<String, String>> rows = new ArrayList<Map<String, String>>();
        List<Map<String, Object>> errors = new ArrayList<Map<String, Object>>();
        try (XSSFWorkbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getNumberOfSheets() == 0 ? null : workbook.getSheetAt(0);
            if (sheet == null) throw new ApiException(422, "工作簿没有数据页");
            DataFormatter formatter = new DataFormatter();
            Row header = sheet.getRow(0);
            if (header == null) throw new ApiException(422, "工作簿缺少表头");
            List<String> headers = new ArrayList<String>();
            for (Cell cell : header) headers.add(formatter.formatCellValue(cell).trim());
            for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum() && rows.size() < 51; rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null) continue;
                Map<String, String> item = new LinkedHashMap<String, String>();
                boolean any = false;
                for (int column = 0; column < headers.size(); column++) {
                    String value = formatter.formatCellValue(row.getCell(column)).trim();
                    item.put(headers.get(column), value);
                    any |= !value.isEmpty();
                }
                if (any) rows.add(item);
            }
            if (rows.size() > 50) errors.add(error(0, "FILE", "单批最多50行"));
            if (rows.isEmpty()) errors.add(error(0, "FILE", "工作簿没有可导入数据"));
        } catch (ApiException exception) {
            throw exception;
        } catch (Exception exception) {
            errors.add(error(0, "FILE", "工作簿无法解析，请重新下载模板填写"));
        }
        String status = errors.isEmpty() ? "VALIDATED" : "INVALID";
        String eventId = actors.cookie(request, "expo_current_event");
        if (eventId == null) eventId = "evt-morocco-2026";
        Map<String, Object> values = new LinkedHashMap<String, Object>();
        values.put("eventId", eventId);
        values.put("importType", "ENTERPRISE_EXHIBITOR");
        values.put("sourceFileName", file.getOriginalFilename());
        values.put("sourceSha256", Ids.sha256(file.getBytes()));
        values.put("status", status);
        values.put("rowCount", rows.size());
        values.put("validCount", errors.isEmpty() ? rows.size() : 0);
        values.put("errorCount", errors.size());
        values.put("rowsJson", json.writeValueAsString(errors.isEmpty() ? rows : Collections.emptyList()));
        values.put("errorsJson", json.writeValueAsString(errors));
        values.put("requestedByAccountId", actor.get("accountId"));
        values.put("requestedByName", actor.get("name"));
        values.put("validatedAt", Ids.now());
        String id = sql.insert("data_import_jobs", "data-import", values, Collections.emptyMap());
        Map<String, Object> response = new LinkedHashMap<String, Object>();
        response.put("id", id);
        response.put("status", status);
        response.put("rowCount", rows.size());
        response.put("validCount", errors.isEmpty() ? rows.size() : 0);
        response.put("errorCount", errors.size());
        response.put("errors", errors);
        return ResponseEntity.status(errors.isEmpty() ? 201 : 422).body(response);
    }

    private Map<String, Object> error(int row, String field, String message) {
        Map<String, Object> value = new LinkedHashMap<String, Object>();
        value.put("rowNumber", row);
        value.put("field", field);
        value.put("code", "INVALID");
        value.put("message", message);
        return value;
    }
}
