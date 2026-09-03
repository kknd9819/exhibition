package com.exhibition;

import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.fail;

class MysqlMigrationSyntaxTest {
    @Test
    void schemaAndSeedExecuteInMysqlCompatibilityMode() throws Exception {
        try (Connection connection = DriverManager.getConnection("jdbc:h2:mem:migration;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1", "sa", "")) {
            execute(connection, "/db/migration/V1__schema.sql");
            execute(connection, "/db/migration/V2__seed.sql");
        }
    }

    private void execute(Connection connection, String resource) throws Exception {
        String script = read(resource);
        for (String raw : script.split(";")) {
            String sql = raw.replaceAll("(?m)^--.*$", "").trim();
            if (sql.isEmpty() || sql.toUpperCase().startsWith("SET NAMES")) continue;
            sql = sql.replaceAll("(?is)\\s+ENGINE=InnoDB\\s+DEFAULT CHARSET=utf8mb4\\s+COLLATE=utf8mb4_unicode_ci$", "");
            try (Statement statement = connection.createStatement()) {
                statement.execute(sql);
            } catch (Exception exception) {
                fail("Migration failed near: " + sql.substring(0, Math.min(180, sql.length())), exception);
            }
        }
    }

    private String read(String resource) throws Exception {
        InputStream input = getClass().getResourceAsStream(resource);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[8192];
        int count;
        while ((count = input.read(buffer)) >= 0) output.write(buffer, 0, count);
        return new String(output.toByteArray(), StandardCharsets.UTF_8);
    }
}
