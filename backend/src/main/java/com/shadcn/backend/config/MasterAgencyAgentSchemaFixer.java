package com.shadcn.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class MasterAgencyAgentSchemaFixer implements ApplicationRunner {

    private static final String TABLE_NAME = "master_agency_agent";
    private static final String REQUIRED_UNIQUE_INDEX = "uk_master_agency_agent_company_agent_code";

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            if (!tableExists()) {
                return;
            }

            ensureAgentCodeColumn();
            backfillMissingAgentCodes();
            ensureAgentCodeNotNull();
            dropUniquePhoneIndexes();
            ensureCompanyAgentCodeUniqueIndex();
        } catch (RuntimeException ex) {
            log.warn("Schema fix skipped: {}", ex.getMessage());
        }
    }

    private void ensureAgentCodeColumn() {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'agent_code'",
                    Integer.class,
                    TABLE_NAME
            );
            if (count != null && count > 0) {
                return;
            }
            jdbcTemplate.execute("ALTER TABLE " + TABLE_NAME + " ADD COLUMN agent_code VARCHAR(50) NULL AFTER company_code");
            log.info("Added column {}.agent_code", TABLE_NAME);
        } catch (DataAccessException ex) {
            log.warn("Failed to ensure agent_code column: {}", ex.getMessage());
        }
    }

    private void backfillMissingAgentCodes() {
        try {
            jdbcTemplate.update(
                    "UPDATE " + TABLE_NAME + " SET agent_code = CONCAT('AG-', id) WHERE agent_code IS NULL OR TRIM(agent_code) = ''"
            );
        } catch (DataAccessException ex) {
            log.warn("Failed to backfill agent_code: {}", ex.getMessage());
        }
    }

    private void ensureAgentCodeNotNull() {
        try {
            jdbcTemplate.execute("ALTER TABLE " + TABLE_NAME + " MODIFY COLUMN agent_code VARCHAR(50) NOT NULL");
        } catch (DataAccessException ex) {
            log.warn("Failed to enforce NOT NULL on agent_code: {}", ex.getMessage());
        }
    }

    private void dropUniquePhoneIndexes() {
        try {
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

                try {
                    jdbcTemplate.execute("ALTER TABLE " + TABLE_NAME + " DROP INDEX `" + normalized.replace("`", "") + "`");
                    log.info("Dropped UNIQUE index on {}.phone_no: {}", TABLE_NAME, normalized);
                } catch (DataAccessException dropEx) {
                    log.warn("Failed to drop index {} on {}: {}", normalized, TABLE_NAME, dropEx.getMessage());
                }
            }
        } catch (DataAccessException ex) {
            log.warn("Failed to drop unique phone indexes: {}", ex.getMessage());
        }
    }

    private void ensureCompanyAgentCodeUniqueIndex() {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?",
                    Integer.class,
                    TABLE_NAME,
                    REQUIRED_UNIQUE_INDEX
            );
            if (count != null && count > 0) {
                return;
            }
            jdbcTemplate.execute(
                    "ALTER TABLE " + TABLE_NAME + " ADD CONSTRAINT " + REQUIRED_UNIQUE_INDEX + " UNIQUE (company_code, agent_code)"
            );
            log.info("Added UNIQUE constraint {} on {}(company_code, agent_code)", REQUIRED_UNIQUE_INDEX, TABLE_NAME);
        } catch (DataAccessException ex) {
            log.warn("Failed to ensure unique(company_code, agent_code): {}", ex.getMessage());
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
        } catch (DataAccessException ex) {
            return false;
        }
    }
}
