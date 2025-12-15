package com.shadcn.backend.service;

import com.shadcn.backend.dto.MasterAgencyAgentImportError;
import com.shadcn.backend.dto.MasterAgencyAgentImportResult;
import com.shadcn.backend.dto.MasterAgencyAgentRequest;
import com.shadcn.backend.dto.MasterAgencyAgentResponse;
import com.shadcn.backend.exception.DuplicateResourceException;
import com.shadcn.backend.exception.ResourceNotFoundException;
import com.shadcn.backend.exception.ValidationException;
import com.shadcn.backend.model.MasterAgencyAgent;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.MasterAgencyAgentRepository;
import com.shadcn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class MasterAgencyAgentService {

    private final MasterAgencyAgentRepository repository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    private volatile boolean schemaChecked = false;

    private void ensureNoGlobalUniquePhoneIndex() {
        if (schemaChecked) {
            return;
        }
        try {
            Integer exists = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'master_agency_agent'",
                    Integer.class
            );
            if (exists == null || exists <= 0) {
                schemaChecked = true;
                return;
            }

            var indexes = jdbcTemplate.queryForList(
                    "SELECT DISTINCT INDEX_NAME " +
                            "FROM INFORMATION_SCHEMA.STATISTICS " +
                            "WHERE TABLE_SCHEMA = DATABASE() " +
                            "AND TABLE_NAME = 'master_agency_agent' " +
                            "AND COLUMN_NAME = 'phone_no' " +
                            "AND NON_UNIQUE = 0",
                    String.class
            );

            for (String indexName : indexes) {
                if (indexName == null) continue;
                String idx = indexName.trim();
                if (idx.isEmpty()) continue;
                if ("PRIMARY".equalsIgnoreCase(idx)) continue;

                try {
                    jdbcTemplate.execute("ALTER TABLE master_agency_agent DROP INDEX `" + idx.replace("`", "") + "`");
                    log.info("Dropped unexpected UNIQUE index on master_agency_agent.phone_no: {}", idx);
                } catch (DataAccessException dropEx) {
                    log.warn("Failed to drop index {} on master_agency_agent: {}", idx, dropEx.getMessage());
                }
            }
        } catch (DataAccessException ex) {
            log.warn("Schema check skipped: {}", ex.getMessage());
        } finally {
            schemaChecked = true;
        }
    }

    @Transactional(readOnly = true)
    public Page<MasterAgencyAgentResponse> findAll(
            String companyCode,
            String search,
            String fullName,
            String phoneNo,
            String rankCode,
            String createdBy,
            Boolean isActive,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {
        String normalizedCompanyCode = normalizeString(companyCode);
        if (normalizedCompanyCode == null) {
            throw new ValidationException("Company Code wajib diisi");
        }
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(direction, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        String fFullName = normalizeSearch(fullName);
        String fPhoneNo = normalizeSearch(phoneNo);
        String fRankCode = normalizeSearch(rankCode);
        String fCreatedBy = normalizeSearch(createdBy);

        boolean hasColumnFilters = fFullName != null || fPhoneNo != null || fRankCode != null || fCreatedBy != null;
        if (hasColumnFilters) {
            return repository.findWithColumnFilters(normalizedCompanyCode, fFullName, fPhoneNo, fRankCode, fCreatedBy, isActive, pageable)
                    .map(this::toResponse);
        }

        return repository.findWithFilters(normalizedCompanyCode, normalizeSearch(search), isActive, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public MasterAgencyAgentResponse findById(String companyCode, Long id) {
        String normalizedCompanyCode = normalizeString(companyCode);
        if (normalizedCompanyCode == null) {
            throw new ValidationException("Company Code wajib diisi");
        }
        MasterAgencyAgent entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data agent dengan ID " + id + " tidak ditemukan"));
        if (!normalizedCompanyCode.equalsIgnoreCase(entity.getCompanyCode())) {
            throw new ResourceNotFoundException("Data agent dengan ID " + id + " tidak ditemukan");
        }
        return toResponse(entity);
    }

    @Transactional
    public MasterAgencyAgentResponse create(String companyCode, MasterAgencyAgentRequest request, String createdBy) {
        String normalizedCompanyCode = normalizeString(companyCode);
        if (normalizedCompanyCode == null) {
            throw new ValidationException("Company Code wajib diisi");
        }
        String normalizedCreatedBy = resolveCreatedByForCompany(normalizedCompanyCode, createdBy);
        MasterAgencyAgent entity = new MasterAgencyAgent();
        applyRequest(entity, request);
        entity.setCompanyCode(normalizedCompanyCode);
        entity.setCreatedBy(normalizedCreatedBy);

        if (repository.existsByCompanyCodeAndAgentCodeIgnoreCase(normalizedCompanyCode, entity.getAgentCode())) {
            throw new DuplicateResourceException("Agent dengan Agent Code '" + entity.getAgentCode() + "' sudah terdaftar untuk Company Code ini");
        }

        MasterAgencyAgent saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public MasterAgencyAgentResponse update(String companyCode, Long id, MasterAgencyAgentRequest request) {
        String normalizedCompanyCode = normalizeString(companyCode);
        if (normalizedCompanyCode == null) {
            throw new ValidationException("Company Code wajib diisi");
        }
        MasterAgencyAgent existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data agent dengan ID " + id + " tidak ditemukan"));

        if (!normalizedCompanyCode.equalsIgnoreCase(existing.getCompanyCode())) {
            throw new ResourceNotFoundException("Data agent dengan ID " + id + " tidak ditemukan");
        }

        applyRequest(existing, request);
        existing.setCompanyCode(normalizedCompanyCode);

        if (repository.existsByCompanyCodeAndAgentCodeIgnoreCaseAndIdNot(normalizedCompanyCode, existing.getAgentCode(), id)) {
            throw new DuplicateResourceException("Agent dengan Agent Code '" + existing.getAgentCode() + "' sudah terdaftar untuk Company Code ini");
        }

        MasterAgencyAgent saved = repository.save(existing);
        return toResponse(saved);
    }

    @Transactional
    public void delete(String companyCode, Long id) {
        String normalizedCompanyCode = normalizeString(companyCode);
        if (normalizedCompanyCode == null) {
            throw new ValidationException("Company Code wajib diisi");
        }

        MasterAgencyAgent existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data agent dengan ID " + id + " tidak ditemukan"));
        if (!normalizedCompanyCode.equalsIgnoreCase(existing.getCompanyCode())) {
            throw new ResourceNotFoundException("Data agent dengan ID " + id + " tidak ditemukan");
        }

        repository.deleteById(id);
    }

    @Transactional
    public MasterAgencyAgentResponse toggleActive(String companyCode, Long id) {
        String normalizedCompanyCode = normalizeString(companyCode);
        if (normalizedCompanyCode == null) {
            throw new ValidationException("Company Code wajib diisi");
        }
        MasterAgencyAgent entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data agent dengan ID " + id + " tidak ditemukan"));

        if (!normalizedCompanyCode.equalsIgnoreCase(entity.getCompanyCode())) {
            throw new ResourceNotFoundException("Data agent dengan ID " + id + " tidak ditemukan");
        }

        entity.setIsActive(!Boolean.TRUE.equals(entity.getIsActive()));
        MasterAgencyAgent saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public MasterAgencyAgentImportResult importExcel(String companyCode, MultipartFile file, boolean removeExisting, String createdBy) {
        ensureNoGlobalUniquePhoneIndex();
        String normalizedCompanyCode = normalizeString(companyCode);
        if (normalizedCompanyCode == null) {
            return new MasterAgencyAgentImportResult(false, 0, 0, List.of(
                    new MasterAgencyAgentImportError(0, "Company Code", "Wajib diisi", companyCode)
            ));
        }

        String normalizedCreatedBy = resolveCreatedByForCompany(normalizedCompanyCode, createdBy);

        if (file == null || file.isEmpty()) {
            return new MasterAgencyAgentImportResult(false, 0, 0, List.of(new MasterAgencyAgentImportError(0, "file", "File kosong", null)));
        }

        List<MasterAgencyAgentImportError> errors = new ArrayList<>();
        int created = 0;
        int updated = 0;

        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) {
                return new MasterAgencyAgentImportResult(false, 0, 0, List.of(new MasterAgencyAgentImportError(0, "file", "Sheet tidak ditemukan", null)));
            }

            DataFormatter formatter = new DataFormatter();
            int lastRow = sheet.getLastRowNum();
            if (lastRow < 1) {
                if (removeExisting) {
                    repository.deleteByCompanyCode(normalizedCompanyCode);
                    repository.flush();
                    return new MasterAgencyAgentImportResult(true, 0, 0, List.of());
                }
                return new MasterAgencyAgentImportResult(false, 0, 0, List.of(new MasterAgencyAgentImportError(0, "file", "Data tidak ditemukan", null)));
            }

            List<MasterAgencyAgent> toSave = new ArrayList<>();
            Set<String> seenAgentCodes = new HashSet<>();

            for (int r = 1; r <= lastRow; r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                int rowNumber = r + 1;

                String agentCode = readString(formatter, row.getCell(1));
                String fullName = readString(formatter, row.getCell(2));
                String shortName = readString(formatter, row.getCell(3));
                LocalDate birthday = readDate(row.getCell(4), formatter, errors, rowNumber, "Birthday");
                String genderRaw = readString(formatter, row.getCell(5));
                String genderTitle = readString(formatter, row.getCell(6));
                String phoneNo = readString(formatter, row.getCell(7));
                String rankCode = readString(formatter, row.getCell(8));
                String rankTitle = readString(formatter, row.getCell(9));
                LocalDate appointmentDate = readDate(row.getCell(10), formatter, errors, rowNumber, "Appointment Date");

                if (isAllBlank(agentCode, fullName, shortName, genderRaw, genderTitle, phoneNo, rankCode, rankTitle) && birthday == null && appointmentDate == null) {
                    continue;
                }

                if (isBlank(agentCode)) {
                    errors.add(new MasterAgencyAgentImportError(rowNumber, "Agent Code", "Wajib diisi", agentCode));
                    continue;
                }

                String normalizedAgentCode = agentCode.trim();
                String agentKey = normalizedAgentCode.toUpperCase(Locale.ROOT);
                if (!seenAgentCodes.add(agentKey)) {
                    errors.add(new MasterAgencyAgentImportError(rowNumber, "Agent Code", "Duplikat Agent Code pada file import", agentCode));
                    continue;
                }

                if (!removeExisting && repository.existsByCompanyCodeAndAgentCodeIgnoreCase(normalizedCompanyCode, normalizedAgentCode)) {
                    errors.add(new MasterAgencyAgentImportError(rowNumber, "Agent Code", "Duplikat Agent Code untuk Company Code ini", agentCode));
                    continue;
                }

                if (isBlank(fullName)) {
                    errors.add(new MasterAgencyAgentImportError(rowNumber, "Full Name", "Wajib diisi", fullName));
                    continue;
                }

                if (isBlank(phoneNo)) {
                    errors.add(new MasterAgencyAgentImportError(rowNumber, "Phone no", "Wajib diisi", phoneNo));
                    continue;
                }

                if (isBlank(rankCode)) {
                    errors.add(new MasterAgencyAgentImportError(rowNumber, "Rank (Code)", "Wajib diisi", rankCode));
                    continue;
                }

                if (isBlank(rankTitle)) {
                    errors.add(new MasterAgencyAgentImportError(rowNumber, "Rank (Full Title)", "Wajib diisi", rankTitle));
                    continue;
                }

                String normalizedPhone = normalizePhone(phoneNo);
                if (normalizedPhone == null) {
                    errors.add(new MasterAgencyAgentImportError(rowNumber, "Phone no", "Format phone tidak valid", phoneNo));
                    continue;
                }

                MasterAgencyAgent.Gender gender = parseGender(genderRaw);
                if (gender == null) {
                    errors.add(new MasterAgencyAgentImportError(rowNumber, "Gender", "Gender harus Male atau Female", genderRaw));
                    continue;
                }

                MasterAgencyAgent entity = new MasterAgencyAgent();

                entity.setCompanyCode(normalizedCompanyCode);
                entity.setAgentCode(normalizedAgentCode);
                entity.setFullName(fullName.trim());
                entity.setShortName(normalizeString(shortName));
                entity.setBirthday(birthday);
                entity.setGender(gender);
                entity.setGenderTitle(normalizeString(genderTitle));
                entity.setPhoneNo(normalizedPhone);
                entity.setRankCode(rankCode.trim());
                entity.setRankTitle(normalizeString(rankTitle));
                entity.setAppointmentDate(appointmentDate);
                entity.setCreatedBy(normalizedCreatedBy);
                if (entity.getIsActive() == null) {
                    entity.setIsActive(true);
                }

                toSave.add(entity);
            }

            if (!errors.isEmpty()) {
                return new MasterAgencyAgentImportResult(false, 0, 0, errors);
            }

            if (removeExisting) {
                repository.deleteByCompanyCode(normalizedCompanyCode);
                repository.flush();
            }

            for (MasterAgencyAgent entity : toSave) {
                repository.save(entity);
                created++;
            }

            return new MasterAgencyAgentImportResult(true, created, updated, List.of());
        } catch (Exception e) {
            log.error("Error import excel agency list", e);
            throw new RuntimeException("Error import excel agency list: " + (e.getMessage() == null ? "Unknown error" : e.getMessage()), e);
        }
    }

    @Transactional
    public MasterAgencyAgentImportResult importApi(String companyCode, List<MasterAgencyAgentRequest> items, boolean removeExisting, String createdBy) {
        ensureNoGlobalUniquePhoneIndex();
        String normalizedCompanyCode = normalizeString(companyCode);
        if (normalizedCompanyCode == null) {
            return new MasterAgencyAgentImportResult(false, 0, 0, List.of(
                    new MasterAgencyAgentImportError(0, "Company Code", "Wajib diisi", companyCode)
            ));
        }

        String normalizedCreatedBy = resolveCreatedByForCompany(normalizedCompanyCode, createdBy);

        if (items == null || items.isEmpty()) {
            return new MasterAgencyAgentImportResult(false, 0, 0, List.of(
                    new MasterAgencyAgentImportError(0, "items", "Items kosong", null)
            ));
        }

        List<MasterAgencyAgentImportError> errors = new ArrayList<>();
        int created = 0;
        int updated = 0;

        List<MasterAgencyAgent> toSave = new ArrayList<>();
        Set<String> seenAgentCodes = new HashSet<>();

        for (int i = 0; i < items.size(); i++) {
            int rowNumber = i + 1;
            MasterAgencyAgentRequest request = items.get(i);
            if (request == null) {
                errors.add(new MasterAgencyAgentImportError(rowNumber, "item", "Item null", null));
                continue;
            }

            String agentCode = normalizeString(request.getAgentCode());
            String fullName = normalizeString(request.getFullName());
            String phoneNoRaw = normalizeString(request.getPhoneNo());
            String rankCode = normalizeString(request.getRankCode());
            String rankTitle = normalizeString(request.getRankTitle());

            if (agentCode == null) {
                errors.add(new MasterAgencyAgentImportError(rowNumber, "Agent Code", "Wajib diisi", request.getAgentCode()));
                continue;
            }

            String agentKey = agentCode.toUpperCase(Locale.ROOT);
            if (!seenAgentCodes.add(agentKey)) {
                errors.add(new MasterAgencyAgentImportError(rowNumber, "Agent Code", "Duplikat Agent Code pada data import", request.getAgentCode()));
                continue;
            }

            if (!removeExisting && repository.existsByCompanyCodeAndAgentCodeIgnoreCase(normalizedCompanyCode, agentCode)) {
                errors.add(new MasterAgencyAgentImportError(rowNumber, "Agent Code", "Duplikat Agent Code untuk Company Code ini", request.getAgentCode()));
                continue;
            }

            if (fullName == null) {
                errors.add(new MasterAgencyAgentImportError(rowNumber, "Full Name", "Wajib diisi", request.getFullName()));
                continue;
            }

            if (phoneNoRaw == null) {
                errors.add(new MasterAgencyAgentImportError(rowNumber, "Phone no", "Wajib diisi", request.getPhoneNo()));
                continue;
            }

            if (rankCode == null) {
                errors.add(new MasterAgencyAgentImportError(rowNumber, "Rank (Code)", "Wajib diisi", request.getRankCode()));
                continue;
            }

            if (rankTitle == null) {
                errors.add(new MasterAgencyAgentImportError(rowNumber, "Rank (Full Title)", "Wajib diisi", request.getRankTitle()));
                continue;
            }

            String normalizedPhone = normalizePhone(phoneNoRaw);
            if (normalizedPhone == null) {
                errors.add(new MasterAgencyAgentImportError(rowNumber, "Phone no", "Format phone tidak valid", request.getPhoneNo()));
                continue;
            }

            MasterAgencyAgent.Gender gender = parseGender(request.getGender());
            if (gender == null) {
                errors.add(new MasterAgencyAgentImportError(rowNumber, "Gender", "Gender harus Male atau Female", request.getGender()));
                continue;
            }

            MasterAgencyAgent entity = new MasterAgencyAgent();

            entity.setCompanyCode(normalizedCompanyCode);
            entity.setAgentCode(agentCode);
            entity.setFullName(fullName);
            entity.setShortName(normalizeString(request.getShortName()));
            entity.setBirthday(request.getBirthday());
            entity.setGender(gender);
            entity.setGenderTitle(normalizeString(request.getGenderTitle()));
            entity.setPhoneNo(normalizedPhone);
            entity.setRankCode(rankCode);
            entity.setRankTitle(rankTitle);
            entity.setAppointmentDate(request.getAppointmentDate());
            entity.setCreatedBy(normalizedCreatedBy);
            if (request.getIsActive() != null) {
                entity.setIsActive(request.getIsActive());
            } else if (entity.getIsActive() == null) {
                entity.setIsActive(true);
            }

            toSave.add(entity);
        }

        if (!errors.isEmpty()) {
            return new MasterAgencyAgentImportResult(false, 0, 0, errors);
        }

        if (removeExisting) {
            repository.deleteByCompanyCode(normalizedCompanyCode);
            repository.flush();
        }

        for (MasterAgencyAgent entity : toSave) {
            repository.save(entity);
            created++;
        }

        return new MasterAgencyAgentImportResult(true, created, updated, List.of());
    }

    @Transactional
    public MasterAgencyAgentImportResult importCsv(String companyCode, MultipartFile file, boolean removeExisting, String createdBy) {
        ensureNoGlobalUniquePhoneIndex();
        String normalizedCompanyCode = normalizeString(companyCode);
        if (normalizedCompanyCode == null) {
            return new MasterAgencyAgentImportResult(false, 0, 0, List.of(
                    new MasterAgencyAgentImportError(0, "Company Code", "Wajib diisi", companyCode)
            ));
        }

        String normalizedCreatedBy = resolveCreatedByForCompany(normalizedCompanyCode, createdBy);

        if (file == null || file.isEmpty()) {
            return new MasterAgencyAgentImportResult(false, 0, 0, List.of(new MasterAgencyAgentImportError(0, "file", "File kosong", null)));
        }

        List<MasterAgencyAgentImportError> errors = new ArrayList<>();
        int created = 0;
        int updated = 0;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String header = reader.readLine();
            if (header == null) {
                return new MasterAgencyAgentImportResult(false, 0, 0, List.of(new MasterAgencyAgentImportError(0, "file", "Data tidak ditemukan", null)));
            }

            List<MasterAgencyAgent> toSave = new ArrayList<>();
            Set<String> seenAgentCodes = new HashSet<>();

            String line;
            int rowNumber = 1;
            while ((line = reader.readLine()) != null) {
                rowNumber++;
                if (line.trim().isEmpty()) continue;

                List<String> cols = parseCsvLine(line);

                String agentCode = getCsv(cols, 1);
                String fullName = getCsv(cols, 2);
                String shortName = getCsv(cols, 3);
                String birthdayRaw = getCsv(cols, 4);
                String genderRaw = getCsv(cols, 5);
                String genderTitle = getCsv(cols, 6);
                String phoneNo = getCsv(cols, 7);
                String rankCode = getCsv(cols, 8);
                String rankTitle = getCsv(cols, 9);
                String appointmentRaw = getCsv(cols, 10);

                LocalDate birthday = parseCsvDate(birthdayRaw, errors, rowNumber, "Birthday");
                LocalDate appointmentDate = parseCsvDate(appointmentRaw, errors, rowNumber, "Appointment Date");

                if (isAllBlank(agentCode, fullName, shortName, genderRaw, genderTitle, phoneNo, rankCode, rankTitle) && birthday == null && appointmentDate == null) {
                    continue;
                }

                if (isBlank(agentCode)) {
                    errors.add(new MasterAgencyAgentImportError(rowNumber, "Agent Code", "Wajib diisi", agentCode));
                    continue;
                }

                String normalizedAgentCode = agentCode.trim();
                String agentKey = normalizedAgentCode.toUpperCase(Locale.ROOT);
                if (!seenAgentCodes.add(agentKey)) {
                    errors.add(new MasterAgencyAgentImportError(rowNumber, "Agent Code", "Duplikat Agent Code pada file import", agentCode));
                    continue;
                }

                if (!removeExisting && repository.existsByCompanyCodeAndAgentCodeIgnoreCase(normalizedCompanyCode, normalizedAgentCode)) {
                    errors.add(new MasterAgencyAgentImportError(rowNumber, "Agent Code", "Duplikat Agent Code untuk Company Code ini", agentCode));
                    continue;
                }

                if (isBlank(fullName)) {
                    errors.add(new MasterAgencyAgentImportError(rowNumber, "Full Name", "Wajib diisi", fullName));
                    continue;
                }

                if (isBlank(phoneNo)) {
                    errors.add(new MasterAgencyAgentImportError(rowNumber, "Phone no", "Wajib diisi", phoneNo));
                    continue;
                }

                if (isBlank(rankCode)) {
                    errors.add(new MasterAgencyAgentImportError(rowNumber, "Rank (Code)", "Wajib diisi", rankCode));
                    continue;
                }

                if (isBlank(rankTitle)) {
                    errors.add(new MasterAgencyAgentImportError(rowNumber, "Rank (Full Title)", "Wajib diisi", rankTitle));
                    continue;
                }

                String normalizedPhone = normalizePhone(phoneNo);
                if (normalizedPhone == null) {
                    errors.add(new MasterAgencyAgentImportError(rowNumber, "Phone no", "Format phone tidak valid", phoneNo));
                    continue;
                }

                MasterAgencyAgent.Gender gender = parseGender(genderRaw);
                if (gender == null) {
                    errors.add(new MasterAgencyAgentImportError(rowNumber, "Gender", "Gender harus Male atau Female", genderRaw));
                    continue;
                }

                MasterAgencyAgent entity = new MasterAgencyAgent();
                entity.setCompanyCode(normalizedCompanyCode);
                entity.setAgentCode(normalizedAgentCode);
                entity.setFullName(fullName.trim());
                entity.setShortName(normalizeString(shortName));
                entity.setBirthday(birthday);
                entity.setGender(gender);
                entity.setGenderTitle(normalizeString(genderTitle));
                entity.setPhoneNo(normalizedPhone);
                entity.setRankCode(rankCode.trim());
                entity.setRankTitle(normalizeString(rankTitle));
                entity.setAppointmentDate(appointmentDate);
                entity.setCreatedBy(normalizedCreatedBy);
                if (entity.getIsActive() == null) {
                    entity.setIsActive(true);
                }

                toSave.add(entity);
            }

            if (!errors.isEmpty()) {
                return new MasterAgencyAgentImportResult(false, 0, 0, errors);
            }

            if (removeExisting) {
                repository.deleteByCompanyCode(normalizedCompanyCode);
                repository.flush();
            }
            for (MasterAgencyAgent entity : toSave) {
                repository.save(entity);
                created++;
            }

            return new MasterAgencyAgentImportResult(true, created, updated, List.of());
        } catch (Exception e) {
            log.error("Error import csv agency list", e);
            throw new RuntimeException("Error import csv agency list: " + (e.getMessage() == null ? "Unknown error" : e.getMessage()), e);
        }
    }

    public byte[] buildExcelTemplate() {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream os = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Agency List");
            Row header = sheet.createRow(0);

            String[] cols = new String[] {
                    "No",
                    "Agent Code*",
                    "Full Name*",
                    "Short Name",
                    "Birthday (yyyy-MM-dd)",
                    "Gender* (MALE/FEMALE)",
                    "Gender Title",
                    "Phone No*",
                    "Rank Code*",
                    "Rank Full Title*",
                    "Appointment Date (yyyy-MM-dd)"
            };

            for (int i = 0; i < cols.length; i++) {
                Cell c = header.createCell(i);
                c.setCellValue(cols[i]);
            }

            Row ex = sheet.createRow(1);
            ex.createCell(0).setCellValue(1);
            ex.createCell(1).setCellValue("AG-001");
            ex.createCell(2).setCellValue("John Doe");
            ex.createCell(3).setCellValue("John");
            ex.createCell(4).setCellValue("1990-01-31");
            ex.createCell(5).setCellValue("MALE");
            ex.createCell(6).setCellValue("Mr");
            ex.createCell(7).setCellValue("+628123456789");
            ex.createCell(8).setCellValue("R1");
            ex.createCell(9).setCellValue("Rank 1");
            ex.createCell(10).setCellValue("2024-01-15");

            for (int i = 0; i < cols.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(os);
            return os.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to build template", e);
        }
    }

    public String buildCsvTemplate() {
        return String.join(
                "\n",
                "No,Agent Code*,Full Name*,Short Name,Birthday (yyyy-MM-dd),Gender* (MALE/FEMALE),Gender Title,Phone No*,Rank Code*,Rank Full Title*,Appointment Date (yyyy-MM-dd)",
                "1,AG-001,John Doe,John,1990-01-31,MALE,Mr,+628123456789,R1,Rank 1,2024-01-15"
        ) + "\n";
    }

    private void applyRequest(MasterAgencyAgent entity, MasterAgencyAgentRequest request) {
        String agentCode = normalizeString(request.getAgentCode());
        if (agentCode == null) {
            throw new ValidationException("Agent Code wajib diisi");
        }

        String fullName = normalizeString(request.getFullName());
        if (fullName == null) {
            throw new ValidationException("Full Name wajib diisi");
        }

        String phone = normalizePhone(request.getPhoneNo());
        if (phone == null) {
            throw new ValidationException("Phone no tidak valid");
        }

        String rankCode = normalizeString(request.getRankCode());
        if (rankCode == null) {
            throw new ValidationException("Rank (Code) wajib diisi");
        }

        String rankTitle = normalizeString(request.getRankTitle());
        if (rankTitle == null) {
            throw new ValidationException("Rank (Full Title) wajib diisi");
        }

        MasterAgencyAgent.Gender gender = parseGender(request.getGender());
        if (gender == null) {
            throw new ValidationException("Gender harus Male atau Female");
        }

        entity.setAgentCode(agentCode);
        entity.setFullName(fullName);
        entity.setShortName(normalizeString(request.getShortName()));
        entity.setBirthday(request.getBirthday());
        entity.setGender(gender);
        entity.setGenderTitle(normalizeString(request.getGenderTitle()));
        entity.setPhoneNo(phone);
        entity.setRankCode(rankCode);
        entity.setRankTitle(rankTitle);
        entity.setAppointmentDate(request.getAppointmentDate());

        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        } else if (entity.getIsActive() == null) {
            entity.setIsActive(true);
        }
    }

    private String normalizeSearch(String raw) {
        if (raw == null) return null;
        String v = raw.trim();
        if (v.isEmpty()) return null;
        return v;
    }

    private String normalizeString(String raw) {
        if (raw == null) return null;
        String v = raw.trim();
        return v.isEmpty() ? null : v;
    }

    private String resolveCreatedByForCompany(String normalizedCompanyCode, String providedCompanyName) {
        String provided = normalizeString(providedCompanyName);
        if (provided != null) {
            return provided;
        }
        try {
            User u = userRepository.findTopByCompanyCodeIgnoreCase(normalizedCompanyCode).orElse(null);
            if (u != null) {
                String cn = normalizeString(u.getCompanyName());
                if (cn != null) {
                    return cn;
                }
            }
        } catch (Exception ignored) {
        }
        if (normalizedCompanyCode != null) {
            return normalizedCompanyCode;
        }
        return "SYSTEM";
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private boolean isAllBlank(String... items) {
        for (String s : items) {
            if (!isBlank(s)) return false;
        }
        return true;
    }

    private MasterAgencyAgent.Gender parseGender(String raw) {
        if (raw == null) return null;
        String v = raw.trim().toUpperCase(Locale.ROOT);
        if (v.isEmpty()) return null;
        if (v.equals("MALE") || v.equals("M")) return MasterAgencyAgent.Gender.MALE;
        if (v.equals("FEMALE") || v.equals("F")) return MasterAgencyAgent.Gender.FEMALE;
        return null;
    }

    private String normalizePhone(String raw) {
        if (raw == null) return null;
        String v = raw.trim();
        if (v.isEmpty()) return null;
        v = v.replaceAll("[\\s\\-()]+", "");
        if (v.startsWith("00")) {
            v = "+" + v.substring(2);
        }
        if (v.startsWith("+") && v.length() > 1) {
            String digits = v.substring(1);
            if (!digits.matches("\\d{8,15}")) return null;
            return "+" + digits;
        }
        if (!v.matches("\\d{8,16}")) return null;
        return v;
    }

    private String readString(DataFormatter formatter, Cell cell) {
        if (cell == null) return null;
        String s = formatter.formatCellValue(cell);
        if (s == null) return null;
        String v = s.trim();
        return v.isEmpty() ? null : v;
    }

    private LocalDate readDate(Cell cell, DataFormatter formatter, List<MasterAgencyAgentImportError> errors, int rowNumber, String column) {
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                return Instant.ofEpochMilli(cell.getDateCellValue().getTime()).atZone(ZoneId.systemDefault()).toLocalDate();
            }
            String raw = formatter.formatCellValue(cell);
            if (raw == null) return null;
            String v = raw.trim();
            if (v.isEmpty()) return null;
            return parseDateFlexible(v);
        } catch (DateTimeParseException ex) {
            String raw = formatter.formatCellValue(cell);
            errors.add(new MasterAgencyAgentImportError(rowNumber, column, "Format tanggal tidak valid", raw));
            return null;
        } catch (Exception ex) {
            String raw = formatter.formatCellValue(cell);
            errors.add(new MasterAgencyAgentImportError(rowNumber, column, ex.getMessage(), raw));
            return null;
        }
    }

    private LocalDate parseDateFlexible(String v) {
        List<DateTimeFormatter> fmts = List.of(
                new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("yyyy-MM-dd").toFormatter(Locale.ROOT),
                new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("dd-MM-yyyy").toFormatter(Locale.ROOT),
                new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("d-M-yyyy").toFormatter(Locale.ROOT),
                new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("dd/MM/yyyy").toFormatter(Locale.ROOT),
                new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("d/M/yyyy").toFormatter(Locale.ROOT),
                new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("dd-MMM-yyyy").toFormatter(Locale.ROOT),
                new DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("d-MMM-yyyy").toFormatter(Locale.ROOT)
        );
        for (DateTimeFormatter fmt : fmts) {
            try {
                return LocalDate.parse(v, fmt);
            } catch (DateTimeParseException ignored) {
            }
        }
        throw new DateTimeParseException("Invalid date", v, 0);
    }

    private LocalDate parseCsvDate(String raw, List<MasterAgencyAgentImportError> errors, int rowNumber, String column) {
        String v = normalizeString(raw);
        if (v == null) return null;
        try {
            return parseDateFlexible(v);
        } catch (DateTimeParseException ex) {
            errors.add(new MasterAgencyAgentImportError(rowNumber, column, "Format tanggal tidak valid", raw));
            return null;
        } catch (Exception ex) {
            errors.add(new MasterAgencyAgentImportError(rowNumber, column, ex.getMessage(), raw));
            return null;
        }
    }

    private String getCsv(List<String> cols, int idx) {
        if (cols == null) return null;
        if (idx < 0 || idx >= cols.size()) return null;
        return normalizeString(cols.get(idx));
    }

    private List<String> parseCsvLine(String line) {
        List<String> out = new ArrayList<>();
        if (line == null) return out;

        StringBuilder cur = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (ch == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    cur.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch == ',' && !inQuotes) {
                out.add(cur.toString());
                cur.setLength(0);
            } else {
                cur.append(ch);
            }
        }
        out.add(cur.toString());
        return out;
    }

    private MasterAgencyAgentResponse toResponse(MasterAgencyAgent entity) {
        return new MasterAgencyAgentResponse(
                entity.getId(),
                entity.getAgentCode(),
                entity.getFullName(),
                entity.getShortName(),
                entity.getBirthday(),
                entity.getGender() == null ? null : entity.getGender().name(),
                entity.getGenderTitle(),
                entity.getPhoneNo(),
                entity.getRankCode(),
                entity.getRankTitle(),
                entity.getAppointmentDate(),
                entity.getIsActive(),
                entity.getCreatedBy(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
