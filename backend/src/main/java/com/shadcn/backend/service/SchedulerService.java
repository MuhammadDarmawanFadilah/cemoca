package com.shadcn.backend.service;

import com.shadcn.backend.dto.FileManagerFolderResponse;
import com.shadcn.backend.dto.SchedulerLogResponse;
import com.shadcn.backend.exception.ValidationException;
import com.shadcn.backend.model.SchedulerLog;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.SchedulerLogRepository;
import com.shadcn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SchedulerService {

    private final UserRepository userRepository;
    private final SchedulerLogRepository schedulerLogRepository;
    private final MasterAgencyAgentService agencyAgentService;
    private final MasterPolicySalesService policySalesService;

    @Value("${scheduler.base-path:C:\\PROJEK\\CEMOCAPPS\\scheduler}")
    private String basePath;

    @Value("${scheduler.enabled:true}")
    private boolean schedulerEnabled;

    // Scheduled task runs every 6 hours by default (can be configured in hours)
    // Formula: interval-hours * 3600000 milliseconds (1 hour = 3600000 ms)
    @Scheduled(fixedDelayString = "#{${scheduler.interval-hours:6} * 3600000}", initialDelay = 60000)
    public void processScheduledImports() {
        if (!schedulerEnabled) {
            log.info("Scheduler is disabled, skipping scheduled import");
            return;
        }

        log.info("Starting scheduled import process...");
        lastRunTime = LocalDateTime.now();
        processAllPendingFiles("SCHEDULER");
        log.info("Scheduled import process completed");
    }

    public void processNow() {
        log.info("Manual process triggered");
        processAllPendingFiles("MANUAL");
    }

    private void processAllPendingFiles(String processedBy) {
        // Get all company codes from users
        List<String> companyCodes = userRepository.findAll().stream()
                .map(User::getCompanyCode)
                .filter(cc -> cc != null && !cc.isBlank())
                .distinct()
                .collect(Collectors.toList());

        log.info("Found {} unique company codes", companyCodes.size());

        for (String companyCode : companyCodes) {
            initializeFolders(companyCode);
            processCompanyFolder(companyCode, "AgencyList", processedBy);
            processCompanyFolder(companyCode, "PolicyList", processedBy);
        }
    }

    public void initializeFolders(String companyCode) {
        try {
            Path companyPath = Paths.get(basePath, companyCode);
            Path agencyPath = companyPath.resolve("AgencyList");
            Path policyPath = companyPath.resolve("PolicyList");

            Files.createDirectories(agencyPath);
            Files.createDirectories(policyPath);

            log.debug("Initialized folders for company code: {}", companyCode);
        } catch (IOException e) {
            log.error("Failed to create folders for company code: {}", companyCode, e);
        }
    }

    private void processCompanyFolder(String companyCode, String importType, String processedBy) {
        Path folderPath = Paths.get(basePath, companyCode, importType);
        
        if (!Files.exists(folderPath)) {
            return;
        }

        try (var stream = Files.list(folderPath)) {
            List<Path> excelFiles = stream
                    .filter(Files::isRegularFile)
                    .filter(p -> {
                        String name = p.getFileName().toString().toLowerCase();
                        return name.endsWith(".xlsx") || name.endsWith(".xls");
                    })
                    .collect(Collectors.toList());

            log.info("Found {} Excel files in {}/{}", excelFiles.size(), companyCode, importType);

            for (Path excelFile : excelFiles) {
                processFile(companyCode, importType, excelFile, processedBy);
            }
        } catch (IOException e) {
            log.error("Error listing files in {}/{}", companyCode, importType, e);
        }
    }

    private void processFile(String companyCode, String importType, Path filePath, String processedBy) {
        String fileName = filePath.getFileName().toString();
        log.info("Processing file: {} for company: {}, type: {}", fileName, companyCode, importType);

        SchedulerLog.SchedulerLogBuilder logBuilder = SchedulerLog.builder()
                .companyCode(companyCode)
                .importType(importType)
                .fileName(fileName)
                .filePath(filePath.toString())
                .processedBy(processedBy);

        try {
            File file = filePath.toFile();
            
            if ("AgencyList".equals(importType)) {
                var result = agencyAgentService.importExcelFromFile(companyCode, file, false, "SCHEDULER");
                
                logBuilder.status("SUCCESS")
                        .createdCount(result.createdCount())
                        .updatedCount(result.updatedCount())
                        .errorCount(result.errors() != null ? result.errors().size() : 0);
                
                if (result.errors() != null && !result.errors().isEmpty()) {
                    String errorMsg = result.errors().stream()
                            .limit(5)
                            .map(e -> String.format("Row %d, %s: %s", e.rowNumber(), e.column(), e.message()))
                            .collect(Collectors.joining("; "));
                    logBuilder.errorMessage(errorMsg);
                }
                
                moveToSuccess(filePath, companyCode, importType);
                
            } else if ("PolicyList".equals(importType)) {
                var result = policySalesService.importExcelFromFile(companyCode, file, false, "SCHEDULER");
                
                logBuilder.status("SUCCESS")
                        .createdCount(result.createdCount())
                        .updatedCount(result.updatedCount())
                        .errorCount(result.errors() != null ? result.errors().size() : 0);
                
                if (result.errors() != null && !result.errors().isEmpty()) {
                    String errorMsg = result.errors().stream()
                            .limit(5)
                            .map(e -> String.format("Row %d, %s: %s", e.rowNumber(), e.column(), e.message()))
                            .collect(Collectors.joining("; "));
                    logBuilder.errorMessage(errorMsg);
                }
                
                moveToSuccess(filePath, companyCode, importType);
            }

            log.info("Successfully processed file: {}", fileName);

        } catch (Exception e) {
            log.error("Failed to process file: {}", fileName, e);
            
            logBuilder.status("FAILED")
                    .createdCount(0)
                    .updatedCount(0)
                    .errorCount(1)
                    .errorMessage(e.getMessage());
            
            moveToFailed(filePath, companyCode, importType, e.getMessage());
        }

        schedulerLogRepository.save(logBuilder.build());
    }

    private void moveToSuccess(Path filePath, String companyCode, String importType) {
        try {
            Path successDir = Paths.get(basePath, "sukses");
            Files.createDirectories(successDir);
            
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String newFileName = companyCode + "_" + importType + "_" + timestamp + "_" + filePath.getFileName().toString();
            Path targetPath = successDir.resolve(newFileName);
            
            Files.move(filePath, targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Moved file to sukses: {}", targetPath);
        } catch (IOException e) {
            log.error("Failed to move file to sukses folder", e);
        }
    }

    private void moveToFailed(Path filePath, String companyCode, String importType, String errorMessage) {
        try {
            Path failedDir = Paths.get(basePath, "failed");
            Files.createDirectories(failedDir);
            
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String newFileName = companyCode + "_" + importType + "_" + timestamp + "_" + filePath.getFileName().toString();
            Path targetPath = failedDir.resolve(newFileName);
            
            Files.move(filePath, targetPath, StandardCopyOption.REPLACE_EXISTING);
            
            // Create error log file
            Path errorLogPath = failedDir.resolve(companyCode + "_" + importType + "_" + timestamp + "_error.txt");
            Files.writeString(errorLogPath, 
                String.format("Company Code: %s%nImport Type: %s%nFile Name: %s%nTimestamp: %s%nError:%n%s",
                    companyCode, importType, filePath.getFileName().toString(), timestamp, errorMessage));
            
            log.info("Moved file to failed: {}", targetPath);
        } catch (IOException e) {
            log.error("Failed to move file to failed folder", e);
        }
    }

    public List<FileManagerFolderResponse> getAllFolders() {
        List<String> companyCodes = userRepository.findAll().stream()
                .map(User::getCompanyCode)
                .filter(cc -> cc != null && !cc.isBlank())
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        List<FileManagerFolderResponse> responses = new ArrayList<>();

        for (String companyCode : companyCodes) {
            initializeFolders(companyCode);
            
            Path companyPath = Paths.get(basePath, companyCode);
            List<FileManagerFolderResponse.FolderInfo> folders = new ArrayList<>();

            // AgencyList folder
            folders.add(getFolderInfo(companyPath.resolve("AgencyList")));
            
            // PolicyList folder
            folders.add(getFolderInfo(companyPath.resolve("PolicyList")));

            responses.add(new FileManagerFolderResponse(
                    companyCode,
                    companyPath.toString(),
                    folders
            ));
        }

        return responses;
    }

    private FileManagerFolderResponse.FolderInfo getFolderInfo(Path folderPath) {
        String folderName = folderPath.getFileName().toString();
        List<FileManagerFolderResponse.FileInfo> files = new ArrayList<>();

        if (Files.exists(folderPath)) {
            try (var stream = Files.list(folderPath)) {
                files = stream
                        .filter(Files::isRegularFile)
                        .map(p -> {
                            try {
                                return new FileManagerFolderResponse.FileInfo(
                                        p.getFileName().toString(),
                                        p.toString(),
                                        Files.size(p),
                                        Files.getLastModifiedTime(p).toString()
                                );
                            } catch (IOException e) {
                                return null;
                            }
                        })
                        .filter(f -> f != null)
                        .collect(Collectors.toList());
            } catch (IOException e) {
                log.error("Error reading folder: {}", folderPath, e);
            }
        }

        return new FileManagerFolderResponse.FolderInfo(
                folderName,
                folderPath.toString(),
                files.size(),
                files
        );
    }

    public Page<SchedulerLogResponse> getLogs(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return schedulerLogRepository.findAllByOrderByProcessedAtDesc(pageable)
                .map(this::toResponse);
    }

    private SchedulerLogResponse toResponse(SchedulerLog log) {
        return new SchedulerLogResponse(
                log.getId(),
                log.getCompanyCode(),
                log.getImportType(),
                log.getFileName(),
                log.getFilePath(),
                log.getStatus(),
                log.getCreatedCount(),
                log.getUpdatedCount(),
                log.getErrorCount(),
                log.getErrorMessage(),
                log.getProcessedBy(),
                log.getProcessedAt()
        );
    }

    public String getBasePath() {
        return basePath;
    }

    public boolean isSchedulerEnabled() {
        return schedulerEnabled;
    }

    @Value("${scheduler.interval-hours:6}")
    private int intervalHours;

    private LocalDateTime lastRunTime;

    public int getIntervalHours() {
        return intervalHours;
    }

    public LocalDateTime getNextRunTime() {
        if (lastRunTime == null) {
            return LocalDateTime.now().plusHours(intervalHours);
        }
        return lastRunTime.plusHours(intervalHours);
    }

    public void saveUploadedFile(MultipartFile file, String companyCode, String importType) throws IOException {
        if (file.isEmpty()) {
            throw new ValidationException("File is empty");
        }

        String fileName = file.getOriginalFilename();
        if (fileName == null || (!fileName.toLowerCase().endsWith(".xlsx") && !fileName.toLowerCase().endsWith(".xls"))) {
            throw new ValidationException("Invalid file format. Only Excel files (.xlsx, .xls) are allowed");
        }

        // Initialize folder if not exists
        initializeFolders(companyCode);

        // Save file to company folder
        Path targetPath = Paths.get(basePath, companyCode, importType, fileName);
        Files.createDirectories(targetPath.getParent());
        
        // If file exists, add timestamp to avoid overwrite
        if (Files.exists(targetPath)) {
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
            String ext = fileName.substring(fileName.lastIndexOf('.'));
            fileName = nameWithoutExt + "_" + timestamp + ext;
            targetPath = Paths.get(basePath, companyCode, importType, fileName);
        }

        file.transferTo(targetPath.toFile());
        log.info("File uploaded successfully: {} to {}/{}", fileName, companyCode, importType);
    }
}
