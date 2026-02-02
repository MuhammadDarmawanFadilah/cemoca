package com.shadcn.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class MasterAgencyAgentSchemaFixer implements ApplicationRunner {

    private static final String TABLE_NAME = "master_agency_agent";
    private static final String KEEP_UNIQUE_INDEX = "uk_master_agency_agent_company_phone";

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            if (!tableExists()) {
                return;
            }

            List<String> uniquePhoneIndexes = jdbcTemplate.queryForList(
                    "SELECT DISTINCT INDEX_NAME " +
                            "FROM INFORMATION_SCHEMA.STATISTICS " +
                            "WHERE TABLE_SCHEMA = DATABASE() " +
                            "AND TABLE_NAME = ? " +
                            "AND COLUMN_NAME = 'phone_no' " +
                            "AND NON_UNIQUE = 0",
                    String.class,
                    TABLE_NAME
            );

            for (String indexName : uniquePhoneIndexes) {
                if (indexName == null) {
                    continue;
                }
                String normalized = indexName.trim();
                if (normalized.isEmpty()) {
                    continue;
                }

                if ("PRIMARY".equalsIgnoreCase(normalized)) {
                    continue;
                }
                if (KEEP_UNIQUE_INDEX.equalsIgnoreCase(normalized)) {
                    continue;
                }

                try {
                    jdbcTemplate.execute("ALTER TABLE " + TABLE_NAME + " DROP INDEX `" + normalized.replace("`", "") + "`");
                    log.info("Dropped unexpected UNIQUE index on {}.phone_no: {}", TABLE_NAME, normalized);
                } catch (Exception dropEx) {
                    log.warn("Failed to drop index {} on {}: {}", normalized, TABLE_NAME, dropEx.getMessage());
                }
            }
        } catch (Exception ex) {
            log.warn("Schema fix skipped: {}", ex.getMessage());
        }
    }

    private boolean tableExists() {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
                    Integer.class,
                    TABLE_NAME
            );
            return count != null && count > 0;
        } catch (Exception ex) {
            return false;
        }
    }
}
