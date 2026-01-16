package com.shadcn.backend.service;

import java.net.URI;
import java.nio.file.Files;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.shadcn.backend.model.LearningModuleImage;
import com.shadcn.backend.model.LearningModulePdf;
import com.shadcn.backend.model.LearningModulePowerPoint;
import com.shadcn.backend.model.LearningScheduleConfig;
import com.shadcn.backend.model.LearningScheduleConfigMaterial;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.shadcn.backend.model.LearningModuleImage;
import com.shadcn.backend.model.LearningModulePdf;
import com.shadcn.backend.model.LearningModulePowerPoint;
import com.shadcn.backend.model.LearningScheduleConfig;
import com.shadcn.backend.model.LearningScheduleConfigMaterial;
import com.shadcn.backend.model.LearningScheduleHistory;
import com.shadcn.backend.model.LearningScheduleHistoryItem;
import com.shadcn.backend.model.MasterAgencyAgent;
import com.shadcn.backend.repository.LearningModuleImageRepository;
import com.shadcn.backend.repository.LearningModulePdfRepository;
import com.shadcn.backend.repository.LearningModulePowerPointRepository;
import com.shadcn.backend.repository.LearningModuleVideoRepository;
import com.shadcn.backend.repository.LearningScheduleConfigMaterialRepository;
import com.shadcn.backend.repository.LearningScheduleHistoryItemRepository;
import com.shadcn.backend.repository.LearningScheduleHistoryRepository;
import com.shadcn.backend.repository.MasterAgencyAgentRepository;
import com.shadcn.backend.repository.MasterPolicySalesRepository;
import com.shadcn.backend.repository.UserRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.shadcn.backend.model.LearningScheduleHistory;
import com.shadcn.backend.model.LearningScheduleHistoryItem;
import com.shadcn.backend.model.MasterAgencyAgent;
import com.shadcn.backend.repository.LearningModuleImageRepository;
import com.shadcn.backend.repository.LearningModulePdfRepository;
import com.shadcn.backend.repository.LearningModulePowerPointRepository;
import com.shadcn.backend.repository.LearningModuleVideoRepository;
import com.shadcn.backend.repository.LearningScheduleConfigMaterialRepository;
import com.shadcn.backend.repository.LearningScheduleHistoryItemRepository;
import com.shadcn.backend.repository.LearningScheduleHistoryRepository;
import com.shadcn.backend.repository.MasterAgencyAgentRepository;
import com.shadcn.backend.repository.MasterPolicySalesRepository;
import com.shadcn.backend.repository.UserRepository;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class LearningSchedulerExecutionService {

    private final LearningScheduleHistoryRepository historyRepository;
    private final LearningScheduleHistoryItemRepository historyItemRepository;
    private final MasterPolicySalesRepository masterPolicySalesRepository;
    private final MasterAgencyAgentRepository masterAgencyAgentRepository;
    private final UserRepository userRepository;

    private final LearningModuleVideoRepository learningModuleVideoRepository;
    private final LearningModuleImageRepository learningModuleImageRepository;
    private final LearningModulePdfRepository learningModulePdfRepository;
    private final LearningModulePowerPointRepository learningModulePowerPointRepository;

    private final LearningScheduleConfigMaterialRepository learningScheduleConfigMaterialRepository;

    private final HeyGenService heyGenService;
    private final WhatsAppService whatsAppService;
    private final DocumentFileService documentFileService;
    private final ImageService imageService;
    private final RestTemplate restTemplate;
    private final SchedulerLogService schedulerLogService;

    @Value("${learning.scheduler.default-timezone:Asia/Jakarta}")
    private String defaultTimezone;

    @Value("${app.image.base-url:}")
    private String imageBaseUrl;

    @Value("${app.document.base-url:}")
    private String documentBaseUrl;

    @Value("${learning.scheduler.heygen.avatar-name:}")
    private String heygenAvatarName;

    @Value("${learning.scheduler.heygen.avatar-id:}")
    private String heygenAvatarId;


    @Value("${learning.scheduler.heygen.max-wait-seconds:600}")
    private int heygenMaxWaitSeconds;

    @Value("${learning.scheduler.heygen.poll-interval-ms:5000}")
    private long heygenPollIntervalMs;

    @Value("${whatsapp.api.max-media-bytes}")
    private long wablasMaxMediaBytes;

    @PostConstruct
    private void validateWablasMaxMediaBytes() {
        if (wablasMaxMediaBytes <= 0) {
            throw new IllegalStateException("whatsapp.api.max-media-bytes must be > 0");
        }
    }

    @Transactional
    public LearningScheduleHistory executeConfig(LearningScheduleConfig config) {
        LearningScheduleHistory history = new LearningScheduleHistory();
        history.setConfig(config);
        history.setCompanyCode(config.getCompanyCode());
        history.setSchedulerType(config.getSchedulerType());
        history.setStartedAt(LocalDateTime.now());
        history.setStatus("PROCESSING");
        history = historyRepository.save(history);

        schedulerLogService.info(
            "EXEC_START",
            config,
            history,
            "Execution started"
        );

        int sent = 0;
        int failed = 0;
        int skipped = 0;

        try {
            String schedulerType = String.valueOf(config.getSchedulerType()).trim().toUpperCase(Locale.ROOT);
            ZoneId zoneId = ZoneId.of(normalizeTimezone(defaultTimezone));
            LocalDate today = LocalDate.now(zoneId);

            String mediaTypeValue = normalizeType(config.getMediaType());

            String companyName = resolveCompanyName(config.getCompanyCode());

                LearningScheduleConfigMaterial activeMaterial = learningScheduleConfigMaterialRepository
                    .findFirstByConfigIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(config.getId(), today, today)
                    .orElse(null);

                String effectiveLearningCode = activeMaterial != null && normalize(activeMaterial.getLearningCode()) != null
                    ? activeMaterial.getLearningCode()
                    : config.getLearningCode();

                String effectiveVideoTextTemplate = activeMaterial != null && normalize(activeMaterial.getVideoTextTemplate()) != null
                    ? activeMaterial.getVideoTextTemplate()
                    : config.getVideoTextTemplate();

                if ("VIDEO".equals(mediaTypeValue)) {
                    String code1 = activeMaterial != null && normalize(activeMaterial.getVideoLearningCode1()) != null
                            ? activeMaterial.getVideoLearningCode1()
                            : config.getVideoLearningCode1();
                    if (normalize(code1) != null) {
                        effectiveLearningCode = code1;
                    }

                    String t1 = activeMaterial != null && normalize(activeMaterial.getVideoTextTemplate1()) != null
                            ? activeMaterial.getVideoTextTemplate1()
                            : config.getVideoTextTemplate1();
                    String t2 = activeMaterial != null && normalize(activeMaterial.getVideoTextTemplate2()) != null
                            ? activeMaterial.getVideoTextTemplate2()
                            : config.getVideoTextTemplate2();
                    String t3 = activeMaterial != null && normalize(activeMaterial.getVideoTextTemplate3()) != null
                            ? activeMaterial.getVideoTextTemplate3()
                            : config.getVideoTextTemplate3();
                    String t4 = activeMaterial != null && normalize(activeMaterial.getVideoTextTemplate4()) != null
                            ? activeMaterial.getVideoTextTemplate4()
                            : config.getVideoTextTemplate4();

                    String merged = mergeVideoTemplates(t1, t2, t3, t4);
                    if (normalize(merged) != null) {
                        effectiveVideoTextTemplate = merged;
                    }
                }

                String learningName = resolveLearningName(config.getMediaType(), effectiveLearningCode);
            if ("WELCOME_NEW_JOINNER".equals(schedulerType)) {
                LocalDate targetAppointmentDate = today.minusDays(1);
                List<MasterAgencyAgent> targets = masterAgencyAgentRepository
                        .findByCompanyCodeAndAppointmentDateAndIsActiveTrue(config.getCompanyCode(), targetAppointmentDate);

                history.setTotalTargets(targets.size());
                historyRepository.save(history);

                for (MasterAgencyAgent agency : targets) {
                    LearningScheduleHistoryItem item = new LearningScheduleHistoryItem();
                    item.setHistory(history);
                    item.setAgentCode(agency.getAgentCode());
                    item.setPolicyLastDate(targetAppointmentDate);
                    item.setMediaType(config.getMediaType());
                    item.setLearningCode(effectiveLearningCode);

                    try {
                        item.setFullName(agency.getFullName());
                        item.setPhoneNo(agency.getPhoneNo());

                        Map<String, String> vars = new HashMap<>();
                        vars.put("name", safe(agency.getFullName()));
                        vars.put("agentCode", safe(agency.getAgentCode()));
                        vars.put("companyCode", safe(config.getCompanyCode()));
                        vars.put("learningCode", safe(effectiveLearningCode));
                        vars.put("companyName", safe(companyName));
                        vars.put("learningName", safe(learningName));

                        String caption = applyTemplate(config.getWaMessageTemplate(), vars);

                        Map<String, Object> waResult;

                        if ("VIDEO".equals(mediaTypeValue)) {
                            String script = applyTemplate(effectiveVideoTextTemplate, vars);
                            waResult = sendHeyGenVideoWithWablasFallback(config, agency.getPhoneNo(), caption, script);
                        } else if ("IMAGE".equals(mediaTypeValue)) {
                            LearningModuleImage img = learningModuleImageRepository.findByCodeIgnoreCase(effectiveLearningCode)
                                    .orElseThrow(() -> new RuntimeException("Learning image code not found"));
                            byte[] bytes = Files.readAllBytes(imageService.getImagePath(img.getImageFilename()));
                            String imgUrl = buildPublicUrl(normalize(imageBaseUrl), img.getImageUrl(), imageService.getImageUrl(img.getImageFilename()));
                            waResult = whatsAppService.sendImageAttachmentWithDetailsOrLink(
                                agency.getPhoneNo(),
                                caption,
                                img.getImageFilename(),
                                bytes,
                                guessImageMediaType(img.getImageFilename()),
                                imgUrl
                            );
                        } else if ("PDF".equals(mediaTypeValue)) {
                            LearningModulePdf pdf = learningModulePdfRepository.findByCodeIgnoreCase(effectiveLearningCode)
                                    .orElseThrow(() -> new RuntimeException("Learning PDF code not found"));
                            byte[] bytes = Files.readAllBytes(documentFileService.getDocumentPath(pdf.getPdfFilename()));
                            String docUrl = buildPublicUrl(normalize(documentBaseUrl), pdf.getPdfUrl(), documentFileService.getDocumentUrl(pdf.getPdfFilename()));
                            waResult = whatsAppService.sendDocumentAttachmentWithDetailsOrLink(
                                agency.getPhoneNo(),
                                caption,
                                pdf.getPdfFilename(),
                                bytes,
                                MediaType.APPLICATION_PDF,
                                docUrl
                            );
                        } else if ("PPT".equals(mediaTypeValue)) {
                            LearningModulePowerPoint ppt = learningModulePowerPointRepository.findByCodeIgnoreCase(effectiveLearningCode)
                                    .orElseThrow(() -> new RuntimeException("Learning PowerPoint code not found"));
                            byte[] bytes = Files.readAllBytes(documentFileService.getDocumentPath(ppt.getPowerPointFilename()));
                            String docUrl = buildPublicUrl(normalize(documentBaseUrl), ppt.getPowerPointUrl(), documentFileService.getDocumentUrl(ppt.getPowerPointFilename()));
                            waResult = whatsAppService.sendDocumentAttachmentWithDetailsOrLink(
                                agency.getPhoneNo(),
                                caption,
                                ppt.getPowerPointFilename(),
                                bytes,
                                MediaType.APPLICATION_OCTET_STREAM,
                                docUrl
                            );
                        } else {
                            throw new IllegalArgumentException("Unsupported media type");
                        }

                        boolean ok = (Boolean) waResult.getOrDefault("success", false);
                        String msgId = (String) waResult.get("messageId");
                        String err = (String) waResult.get("error");
                        Integer httpStatus = waResult.get("httpStatus") instanceof Number
                                ? ((Number) waResult.get("httpStatus")).intValue()
                                : null;
                        String rawResponse = waResult.get("rawResponse") == null ? null : waResult.get("rawResponse").toString();

                        if (ok) {
                            item.setWaStatus("SENT");
                            item.setWaMessageId(msgId);
                            item.setSentAt(LocalDateTime.now());
                            item.setErrorMessage(null);
                            sent++;
                        } else {
                            item.setWaStatus("FAILED");
                            item.setWaMessageId(msgId);
                            item.setErrorMessage(composeWaError(err, httpStatus, rawResponse));
                            failed++;
                        }

                    } catch (Exception ex) {
                        item.setWaStatus("FAILED");
                        item.setErrorMessage(errorToString(ex));
                        log.warn("Learning schedule send failed for agentCode={} companyCode={} configId={}: {}",
                                safe(agency.getAgentCode()), safe(config.getCompanyCode()), config.getId(), errorToString(ex));
                        failed++;
                    }

                    historyItemRepository.save(item);
                }
            } else if ("HAPPY_BIRTHDAY_NOTIFICATION".equals(schedulerType)) {
                List<MasterAgencyAgent> targets = masterAgencyAgentRepository
                        .findActiveByCompanyCodeAndBirthdayMonthDay(config.getCompanyCode(), today.getMonthValue(), today.getDayOfMonth());

                history.setTotalTargets(targets.size());
                historyRepository.save(history);

                LocalDateTime dayFrom = today.atStartOfDay();
                LocalDateTime dayTo = today.atTime(23, 59, 59);

                for (MasterAgencyAgent agency : targets) {
                    LearningScheduleHistoryItem item = new LearningScheduleHistoryItem();
                    item.setHistory(history);
                    item.setAgentCode(agency.getAgentCode());
                    item.setPolicyLastDate(today);
                    item.setMediaType(config.getMediaType());
                    item.setLearningCode(effectiveLearningCode);

                    try {
                        boolean alreadySentToday = historyItemRepository.existsSentForAgentInPeriod(
                                config.getCompanyCode(),
                                schedulerType,
                                agency.getAgentCode(),
                                dayFrom,
                                dayTo
                        );
                        if (alreadySentToday) {
                            item.setWaStatus("SKIPPED");
                            item.setErrorMessage("Already sent today");
                            skipped++;
                            historyItemRepository.save(item);
                            continue;
                        }

                        item.setFullName(agency.getFullName());
                        item.setPhoneNo(agency.getPhoneNo());

                        Map<String, String> vars = new HashMap<>();
                        vars.put("name", safe(agency.getFullName()));
                        vars.put("agentCode", safe(agency.getAgentCode()));
                        vars.put("companyCode", safe(config.getCompanyCode()));
                        vars.put("learningCode", safe(effectiveLearningCode));
                        vars.put("birthday", agency.getBirthday() == null ? "" : String.valueOf(agency.getBirthday()));
                        vars.put("age", agency.getBirthday() == null ? "" : String.valueOf(Period.between(agency.getBirthday(), today).getYears()));
                        vars.put("companyName", safe(companyName));
                        vars.put("learningName", safe(learningName));

                        String caption = applyTemplate(config.getWaMessageTemplate(), vars);

                        Map<String, Object> waResult;

                        if ("VIDEO".equals(mediaTypeValue)) {
                            String script = applyTemplate(effectiveVideoTextTemplate, vars);
                            waResult = sendHeyGenVideoWithWablasFallback(config, agency.getPhoneNo(), caption, script);
                        } else if ("IMAGE".equals(mediaTypeValue)) {
                            LearningModuleImage img = learningModuleImageRepository.findByCodeIgnoreCase(effectiveLearningCode)
                                    .orElseThrow(() -> new RuntimeException("Learning image code not found"));
                            byte[] bytes = Files.readAllBytes(imageService.getImagePath(img.getImageFilename()));
                            String imgUrl = buildPublicUrl(normalize(imageBaseUrl), img.getImageUrl(), imageService.getImageUrl(img.getImageFilename()));
                            waResult = whatsAppService.sendImageAttachmentWithDetailsOrLink(
                                    agency.getPhoneNo(),
                                    caption,
                                    img.getImageFilename(),
                                    bytes,
                                    guessImageMediaType(img.getImageFilename()),
                                    imgUrl
                            );
                        } else if ("PDF".equals(mediaTypeValue)) {
                            LearningModulePdf pdf = learningModulePdfRepository.findByCodeIgnoreCase(effectiveLearningCode)
                                    .orElseThrow(() -> new RuntimeException("Learning PDF code not found"));
                            byte[] bytes = Files.readAllBytes(documentFileService.getDocumentPath(pdf.getPdfFilename()));
                            String docUrl = buildPublicUrl(normalize(documentBaseUrl), pdf.getPdfUrl(), documentFileService.getDocumentUrl(pdf.getPdfFilename()));
                            waResult = whatsAppService.sendDocumentAttachmentWithDetailsOrLink(
                                    agency.getPhoneNo(),
                                    caption,
                                    pdf.getPdfFilename(),
                                    bytes,
                                    MediaType.APPLICATION_PDF,
                                    docUrl
                            );
                        } else if ("PPT".equals(mediaTypeValue)) {
                            LearningModulePowerPoint ppt = learningModulePowerPointRepository.findByCodeIgnoreCase(effectiveLearningCode)
                                    .orElseThrow(() -> new RuntimeException("Learning PowerPoint code not found"));
                            byte[] bytes = Files.readAllBytes(documentFileService.getDocumentPath(ppt.getPowerPointFilename()));
                            String docUrl = buildPublicUrl(normalize(documentBaseUrl), ppt.getPowerPointUrl(), documentFileService.getDocumentUrl(ppt.getPowerPointFilename()));
                            waResult = whatsAppService.sendDocumentAttachmentWithDetailsOrLink(
                                    agency.getPhoneNo(),
                                    caption,
                                    ppt.getPowerPointFilename(),
                                    bytes,
                                    MediaType.APPLICATION_OCTET_STREAM,
                                    docUrl
                            );
                        } else {
                            throw new IllegalArgumentException("Unsupported media type");
                        }

                        boolean ok = (Boolean) waResult.getOrDefault("success", false);
                        String msgId = (String) waResult.get("messageId");
                        String err = (String) waResult.get("error");
                        Integer httpStatus = waResult.get("httpStatus") instanceof Number
                                ? ((Number) waResult.get("httpStatus")).intValue()
                                : null;
                        String rawResponse = waResult.get("rawResponse") == null ? null : waResult.get("rawResponse").toString();

                        if (ok) {
                            item.setWaStatus("SENT");
                            item.setWaMessageId(msgId);
                            item.setSentAt(LocalDateTime.now());
                            item.setErrorMessage(null);
                            sent++;
                        } else {
                            item.setWaStatus("FAILED");
                            item.setWaMessageId(msgId);
                            item.setErrorMessage(composeWaError(err, httpStatus, rawResponse));
                            failed++;
                        }

                    } catch (Exception ex) {
                        item.setWaStatus("FAILED");
                        item.setErrorMessage(errorToString(ex));
                        log.warn("Learning schedule send failed for agentCode={} companyCode={} configId={}: {}",
                                safe(agency.getAgentCode()), safe(config.getCompanyCode()), config.getId(), errorToString(ex));
                        failed++;
                    }

                    historyItemRepository.save(item);
                }
            } else if ("CONGRATULATION".equals(schedulerType)) {
                LocalDate monthStart = today.withDayOfMonth(1);
                LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());

                LocalDateTime monthStartAt = monthStart.atStartOfDay();
                LocalDateTime monthEndExclusive = monthEnd.plusDays(1).atStartOfDay();

                List<MasterPolicySalesRepository.AgentPolicyCount> targets = masterPolicySalesRepository
                    .findAgentPolicyCountBetween(config.getCompanyCode(), monthStartAt, monthEndExclusive, 2);

                history.setTotalTargets(targets.size());
                historyRepository.save(history);

                LocalDateTime from = monthStart.atStartOfDay();
                LocalDateTime to = monthEnd.atTime(23, 59, 59);

                for (MasterPolicySalesRepository.AgentPolicyCount t : targets) {
                    LearningScheduleHistoryItem item = new LearningScheduleHistoryItem();
                    item.setHistory(history);
                    item.setAgentCode(t.getAgentCode());
                    item.setPolicyLastDate(monthEnd);
                    item.setMediaType(config.getMediaType());
                    item.setLearningCode(effectiveLearningCode);

                    try {
                        boolean alreadySent = historyItemRepository.existsSentForAgentInPeriod(
                                config.getCompanyCode(),
                                schedulerType,
                                t.getAgentCode(),
                                from,
                                to
                        );

                        if (alreadySent) {
                            item.setWaStatus("SKIPPED");
                            item.setErrorMessage("Already sent in current month");
                            skipped++;
                            historyItemRepository.save(item);
                            continue;
                        }

                        MasterAgencyAgent agency = masterAgencyAgentRepository
                                .findByCompanyCodeAndAgentCodeIgnoreCase(config.getCompanyCode(), t.getAgentCode())
                                .orElse(null);

                        if (agency == null) {
                            item.setWaStatus("SKIPPED");
                            item.setErrorMessage("Agent not found in Agency List");
                            skipped++;
                            historyItemRepository.save(item);
                            continue;
                        }

                        item.setFullName(agency.getFullName());
                        item.setPhoneNo(agency.getPhoneNo());

                        Map<String, String> vars = new HashMap<>();
                        vars.put("name", safe(agency.getFullName()));
                        vars.put("agentCode", safe(t.getAgentCode()));
                        vars.put("companyCode", safe(config.getCompanyCode()));
                        vars.put("learningCode", safe(effectiveLearningCode));
                        vars.put("policyCount", String.valueOf(t.getPolicyCount()));
                        vars.put("month", String.valueOf(today.getMonthValue()));
                        vars.put("year", String.valueOf(today.getYear()));
                        vars.put("companyName", safe(companyName));
                        vars.put("learningName", safe(learningName));

                        String caption = applyTemplate(config.getWaMessageTemplate(), vars);

                        Map<String, Object> waResult;

                        if ("VIDEO".equals(mediaTypeValue)) {
                            String script = applyTemplate(effectiveVideoTextTemplate, vars);
                            waResult = sendHeyGenVideoWithWablasFallback(config, agency.getPhoneNo(), caption, script);
                        } else if ("IMAGE".equals(mediaTypeValue)) {
                            LearningModuleImage img = learningModuleImageRepository.findByCodeIgnoreCase(effectiveLearningCode)
                                    .orElseThrow(() -> new RuntimeException("Learning image code not found"));
                            byte[] bytes = Files.readAllBytes(imageService.getImagePath(img.getImageFilename()));
                            String imgUrl = buildPublicUrl(normalize(imageBaseUrl), img.getImageUrl(), imageService.getImageUrl(img.getImageFilename()));
                            waResult = whatsAppService.sendImageAttachmentWithDetailsOrLink(
                                agency.getPhoneNo(),
                                caption,
                                img.getImageFilename(),
                                bytes,
                                guessImageMediaType(img.getImageFilename()),
                                imgUrl
                            );
                        } else if ("PDF".equals(mediaTypeValue)) {
                            LearningModulePdf pdf = learningModulePdfRepository.findByCodeIgnoreCase(effectiveLearningCode)
                                    .orElseThrow(() -> new RuntimeException("Learning PDF code not found"));
                            byte[] bytes = Files.readAllBytes(documentFileService.getDocumentPath(pdf.getPdfFilename()));
                            String docUrl = buildPublicUrl(normalize(documentBaseUrl), pdf.getPdfUrl(), documentFileService.getDocumentUrl(pdf.getPdfFilename()));
                            waResult = whatsAppService.sendDocumentAttachmentWithDetailsOrLink(
                                agency.getPhoneNo(),
                                caption,
                                pdf.getPdfFilename(),
                                bytes,
                                MediaType.APPLICATION_PDF,
                                docUrl
                            );
                        } else if ("PPT".equals(mediaTypeValue)) {
                            LearningModulePowerPoint ppt = learningModulePowerPointRepository.findByCodeIgnoreCase(effectiveLearningCode)
                                    .orElseThrow(() -> new RuntimeException("Learning PowerPoint code not found"));
                            byte[] bytes = Files.readAllBytes(documentFileService.getDocumentPath(ppt.getPowerPointFilename()));
                            String docUrl = buildPublicUrl(normalize(documentBaseUrl), ppt.getPowerPointUrl(), documentFileService.getDocumentUrl(ppt.getPowerPointFilename()));
                            waResult = whatsAppService.sendDocumentAttachmentWithDetailsOrLink(
                                agency.getPhoneNo(),
                                caption,
                                ppt.getPowerPointFilename(),
                                bytes,
                                MediaType.APPLICATION_OCTET_STREAM,
                                docUrl
                            );
                        } else {
                            throw new IllegalArgumentException("Unsupported media type");
                        }

                        boolean ok = (Boolean) waResult.getOrDefault("success", false);
                        String msgId = (String) waResult.get("messageId");
                        String err = (String) waResult.get("error");
                        Integer httpStatus = waResult.get("httpStatus") instanceof Number
                                ? ((Number) waResult.get("httpStatus")).intValue()
                                : null;
                        String rawResponse = waResult.get("rawResponse") == null ? null : waResult.get("rawResponse").toString();

                        if (ok) {
                            item.setWaStatus("SENT");
                            item.setWaMessageId(msgId);
                            item.setSentAt(LocalDateTime.now());
                            item.setErrorMessage(null);
                            sent++;
                        } else {
                            item.setWaStatus("FAILED");
                            item.setWaMessageId(msgId);
                            item.setErrorMessage(composeWaError(err, httpStatus, rawResponse));
                            failed++;
                        }

                    } catch (Exception ex) {
                        item.setWaStatus("FAILED");
                        item.setErrorMessage(errorToString(ex));
                        log.warn("Learning schedule send failed for agentCode={} companyCode={} configId={}: {}",
                                safe(t.getAgentCode()), safe(config.getCompanyCode()), config.getId(), errorToString(ex));
                        failed++;
                    }

                    historyItemRepository.save(item);
                }

            } else if ("PERFORMANCE_TRACKING_WITH_BALANCE_TO_GO".equals(schedulerType)) {
                LocalDate monthStart = today.withDayOfMonth(1);
                LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());

                LocalDateTime monthStartAt = monthStart.atStartOfDay();
                LocalDateTime monthEndExclusive = monthEnd.plusDays(1).atStartOfDay();

                List<MasterPolicySalesRepository.AgentPolicyCount> targets = masterPolicySalesRepository
                    .findAgentPolicyCountBetween(config.getCompanyCode(), monthStartAt, monthEndExclusive, 2);

                history.setTotalTargets(targets.size());
                historyRepository.save(history);

                LocalDateTime monthFrom = monthStart.atStartOfDay();
                LocalDateTime monthTo = monthEnd.atTime(23, 59, 59);

                LocalDate requiredCongratsDate = today.minusDays(1);
                LocalDateTime congratsFrom = requiredCongratsDate.atStartOfDay();
                LocalDateTime congratsTo = requiredCongratsDate.atTime(23, 59, 59);

                for (MasterPolicySalesRepository.AgentPolicyCount t : targets) {
                    LearningScheduleHistoryItem item = new LearningScheduleHistoryItem();
                    item.setHistory(history);
                    item.setAgentCode(t.getAgentCode());
                    item.setPolicyLastDate(monthEnd);
                    item.setMediaType(config.getMediaType());
                    item.setLearningCode(effectiveLearningCode);

                    try {
                        boolean alreadySentThisMonth = historyItemRepository.existsSentForAgentInPeriod(
                                config.getCompanyCode(),
                                schedulerType,
                                t.getAgentCode(),
                                monthFrom,
                                monthTo
                        );
                        if (alreadySentThisMonth) {
                            item.setWaStatus("SKIPPED");
                            item.setErrorMessage("Already sent in current month");
                            skipped++;
                            historyItemRepository.save(item);
                            continue;
                        }

                        boolean congratulationSentYesterday = historyItemRepository.existsSentForAgentInPeriod(
                                config.getCompanyCode(),
                                "CONGRATULATION",
                                t.getAgentCode(),
                                congratsFrom,
                                congratsTo
                        );
                        if (!congratulationSentYesterday) {
                            item.setWaStatus("SKIPPED");
                            item.setErrorMessage("Congratulation not sent yesterday");
                            skipped++;
                            historyItemRepository.save(item);
                            continue;
                        }

                        MasterAgencyAgent agency = masterAgencyAgentRepository
                                .findByCompanyCodeAndAgentCodeIgnoreCase(config.getCompanyCode(), t.getAgentCode())
                                .orElse(null);

                        if (agency == null) {
                            item.setWaStatus("SKIPPED");
                            item.setErrorMessage("Agent not found in Agency List");
                            skipped++;
                            historyItemRepository.save(item);
                            continue;
                        }

                        item.setFullName(agency.getFullName());
                        item.setPhoneNo(agency.getPhoneNo());

                        Map<String, String> vars = new HashMap<>();
                        vars.put("name", safe(agency.getFullName()));
                        vars.put("agentCode", safe(t.getAgentCode()));
                        vars.put("companyCode", safe(config.getCompanyCode()));
                        vars.put("learningCode", safe(effectiveLearningCode));
                        vars.put("policyCount", String.valueOf(t.getPolicyCount()));
                        vars.put("month", String.valueOf(today.getMonthValue()));
                        vars.put("year", String.valueOf(today.getYear()));
                        vars.put("companyName", safe(companyName));
                        vars.put("learningName", safe(learningName));

                        String caption = applyTemplate(config.getWaMessageTemplate(), vars);

                        Map<String, Object> waResult;

                        if ("VIDEO".equals(mediaTypeValue)) {
                            String script = applyTemplate(effectiveVideoTextTemplate, vars);
                            waResult = sendHeyGenVideoWithWablasFallback(config, agency.getPhoneNo(), caption, script);
                        } else if ("IMAGE".equals(mediaTypeValue)) {
                            LearningModuleImage img = learningModuleImageRepository.findByCodeIgnoreCase(effectiveLearningCode)
                                    .orElseThrow(() -> new RuntimeException("Learning image code not found"));
                            byte[] bytes = Files.readAllBytes(imageService.getImagePath(img.getImageFilename()));
                            String imgUrl = buildPublicUrl(normalize(imageBaseUrl), img.getImageUrl(), imageService.getImageUrl(img.getImageFilename()));
                            waResult = whatsAppService.sendImageAttachmentWithDetailsOrLink(
                                    agency.getPhoneNo(),
                                    caption,
                                    img.getImageFilename(),
                                    bytes,
                                    guessImageMediaType(img.getImageFilename()),
                                    imgUrl
                            );
                        } else if ("PDF".equals(mediaTypeValue)) {
                            LearningModulePdf pdf = learningModulePdfRepository.findByCodeIgnoreCase(effectiveLearningCode)
                                    .orElseThrow(() -> new RuntimeException("Learning PDF code not found"));
                            byte[] bytes = Files.readAllBytes(documentFileService.getDocumentPath(pdf.getPdfFilename()));
                            String docUrl = buildPublicUrl(normalize(documentBaseUrl), pdf.getPdfUrl(), documentFileService.getDocumentUrl(pdf.getPdfFilename()));
                            waResult = whatsAppService.sendDocumentAttachmentWithDetailsOrLink(
                                    agency.getPhoneNo(),
                                    caption,
                                    pdf.getPdfFilename(),
                                    bytes,
                                    MediaType.APPLICATION_PDF,
                                    docUrl
                            );
                        } else if ("PPT".equals(mediaTypeValue)) {
                            LearningModulePowerPoint ppt = learningModulePowerPointRepository.findByCodeIgnoreCase(effectiveLearningCode)
                                    .orElseThrow(() -> new RuntimeException("Learning PowerPoint code not found"));
                            byte[] bytes = Files.readAllBytes(documentFileService.getDocumentPath(ppt.getPowerPointFilename()));
                            String docUrl = buildPublicUrl(normalize(documentBaseUrl), ppt.getPowerPointUrl(), documentFileService.getDocumentUrl(ppt.getPowerPointFilename()));
                            waResult = whatsAppService.sendDocumentAttachmentWithDetailsOrLink(
                                    agency.getPhoneNo(),
                                    caption,
                                    ppt.getPowerPointFilename(),
                                    bytes,
                                    MediaType.APPLICATION_OCTET_STREAM,
                                    docUrl
                            );
                        } else {
                            throw new IllegalArgumentException("Unsupported media type");
                        }

                        boolean ok = (Boolean) waResult.getOrDefault("success", false);
                        String msgId = (String) waResult.get("messageId");
                        String err = (String) waResult.get("error");
                        Integer httpStatus = waResult.get("httpStatus") instanceof Number
                                ? ((Number) waResult.get("httpStatus")).intValue()
                                : null;
                        String rawResponse = waResult.get("rawResponse") == null ? null : waResult.get("rawResponse").toString();

                        if (ok) {
                            item.setWaStatus("SENT");
                            item.setWaMessageId(msgId);
                            item.setSentAt(LocalDateTime.now());
                            item.setErrorMessage(null);
                            sent++;
                        } else {
                            item.setWaStatus("FAILED");
                            item.setWaMessageId(msgId);
                            item.setErrorMessage(composeWaError(err, httpStatus, rawResponse));
                            failed++;
                        }

                    } catch (Exception ex) {
                        item.setWaStatus("FAILED");
                        item.setErrorMessage(errorToString(ex));
                        log.warn("Learning schedule send failed for agentCode={} companyCode={} configId={}: {}",
                                safe(t.getAgentCode()), safe(config.getCompanyCode()), config.getId(), errorToString(ex));
                        failed++;
                    }

                    historyItemRepository.save(item);
                }

            } else {
                int days;
                if ("TRAINING_14_DAY_MICRO_LEARNING".equals(schedulerType)) {
                    days = 14;
                } else if ("TRAINING_28_DAY_MICRO_LEARNING".equals(schedulerType)) {
                    days = 28;
                } else {
                    throw new IllegalArgumentException("Unsupported scheduler type");
                }

                LocalDate targetPolicyDate = today.minusDays(days);
                LocalDateTime targetStartAt = targetPolicyDate.atStartOfDay();
                LocalDateTime targetEndExclusive = targetPolicyDate.plusDays(1).atStartOfDay();

                List<MasterPolicySalesRepository.AgentLastPolicyAt> targets =
                        masterPolicySalesRepository.findAgentLastPolicyAtBetween(config.getCompanyCode(), targetStartAt, targetEndExclusive);

                history.setTotalTargets(targets.size());
                historyRepository.save(history);

                for (MasterPolicySalesRepository.AgentLastPolicyAt t : targets) {
                    LearningScheduleHistoryItem item = new LearningScheduleHistoryItem();
                    item.setHistory(history);
                    item.setAgentCode(t.getAgentCode());
                    item.setPolicyLastDate(t.getLastPolicyAt() == null ? null : t.getLastPolicyAt().toLocalDate());
                    item.setMediaType(config.getMediaType());
                    item.setLearningCode(effectiveLearningCode);

                    try {
                        MasterAgencyAgent agency = masterAgencyAgentRepository
                                .findByCompanyCodeAndAgentCodeIgnoreCase(config.getCompanyCode(), t.getAgentCode())
                                .orElse(null);

                        if (agency == null) {
                            item.setWaStatus("SKIPPED");
                            item.setErrorMessage("Agent not found in Agency List");
                            skipped++;
                            historyItemRepository.save(item);
                            continue;
                        }

                        item.setFullName(agency.getFullName());
                        item.setPhoneNo(agency.getPhoneNo());

                        Map<String, String> vars = new HashMap<>();
                        vars.put("name", safe(agency.getFullName()));
                        vars.put("agentCode", safe(t.getAgentCode()));
                        vars.put("companyCode", safe(config.getCompanyCode()));
                        vars.put("learningCode", safe(effectiveLearningCode));
                        vars.put("companyName", safe(companyName));
                        vars.put("learningName", safe(learningName));

                        String caption = applyTemplate(config.getWaMessageTemplate(), vars);

                        Map<String, Object> waResult;

                        if ("VIDEO".equals(mediaTypeValue)) {
                            String script = applyTemplate(effectiveVideoTextTemplate, vars);
                            waResult = sendHeyGenVideoWithWablasFallback(config, agency.getPhoneNo(), caption, script);
                        } else if ("IMAGE".equals(mediaTypeValue)) {
                            LearningModuleImage img = learningModuleImageRepository.findByCodeIgnoreCase(effectiveLearningCode)
                                    .orElseThrow(() -> new RuntimeException("Learning image code not found"));
                            byte[] bytes = Files.readAllBytes(imageService.getImagePath(img.getImageFilename()));
                            String imgUrl = buildPublicUrl(normalize(imageBaseUrl), img.getImageUrl(), imageService.getImageUrl(img.getImageFilename()));
                            waResult = whatsAppService.sendImageAttachmentWithDetailsOrLink(
                                agency.getPhoneNo(),
                                caption,
                                img.getImageFilename(),
                                bytes,
                                guessImageMediaType(img.getImageFilename()),
                                imgUrl
                            );
                        } else if ("PDF".equals(mediaTypeValue)) {
                            LearningModulePdf pdf = learningModulePdfRepository.findByCodeIgnoreCase(effectiveLearningCode)
                                    .orElseThrow(() -> new RuntimeException("Learning PDF code not found"));
                            byte[] bytes = Files.readAllBytes(documentFileService.getDocumentPath(pdf.getPdfFilename()));
                            String docUrl = buildPublicUrl(normalize(documentBaseUrl), pdf.getPdfUrl(), documentFileService.getDocumentUrl(pdf.getPdfFilename()));
                            waResult = whatsAppService.sendDocumentAttachmentWithDetailsOrLink(
                                agency.getPhoneNo(),
                                caption,
                                pdf.getPdfFilename(),
                                bytes,
                                MediaType.APPLICATION_PDF,
                                docUrl
                            );
                        } else if ("PPT".equals(mediaTypeValue)) {
                            LearningModulePowerPoint ppt = learningModulePowerPointRepository.findByCodeIgnoreCase(effectiveLearningCode)
                                    .orElseThrow(() -> new RuntimeException("Learning PowerPoint code not found"));
                            byte[] bytes = Files.readAllBytes(documentFileService.getDocumentPath(ppt.getPowerPointFilename()));
                            String docUrl = buildPublicUrl(normalize(documentBaseUrl), ppt.getPowerPointUrl(), documentFileService.getDocumentUrl(ppt.getPowerPointFilename()));
                            waResult = whatsAppService.sendDocumentAttachmentWithDetailsOrLink(
                                agency.getPhoneNo(),
                                caption,
                                ppt.getPowerPointFilename(),
                                bytes,
                                MediaType.APPLICATION_OCTET_STREAM,
                                docUrl
                            );
                        } else {
                            throw new IllegalArgumentException("Unsupported media type");
                        }

                        boolean ok = (Boolean) waResult.getOrDefault("success", false);
                        String msgId = (String) waResult.get("messageId");
                        String err = (String) waResult.get("error");
                        Integer httpStatus = waResult.get("httpStatus") instanceof Number
                                ? ((Number) waResult.get("httpStatus")).intValue()
                                : null;
                        String rawResponse = waResult.get("rawResponse") == null ? null : waResult.get("rawResponse").toString();

                        if (ok) {
                            item.setWaStatus("SENT");
                            item.setWaMessageId(msgId);
                            item.setSentAt(LocalDateTime.now());
                            item.setErrorMessage(null);
                            sent++;
                        } else {
                            item.setWaStatus("FAILED");
                            item.setWaMessageId(msgId);
                            item.setErrorMessage(composeWaError(err, httpStatus, rawResponse));
                            failed++;
                        }

                    } catch (Exception ex) {
                        item.setWaStatus("FAILED");
                        item.setErrorMessage(errorToString(ex));
                        log.warn("Learning schedule send failed for agentCode={} companyCode={} configId={}: {}",
                                safe(t.getAgentCode()), safe(config.getCompanyCode()), config.getId(), errorToString(ex));
                        failed++;
                    }

                    historyItemRepository.save(item);
                }
            }

            history.setStatus(failed > 0 ? (sent > 0 ? "PARTIAL" : "FAILED") : "SUCCESS");
            history.setSentCount(sent);
            history.setFailedCount(failed);
            history.setSkippedCount(skipped);
            history.setFinishedAt(LocalDateTime.now());
            history.setErrorMessage(null);
                history = historyRepository.save(history);

                schedulerLogService.info(
                    "EXEC_FINISH",
                    config,
                    history,
                    "Execution finished status=" + history.getStatus() + " sent=" + sent + " failed=" + failed + " skipped=" + skipped
                );

                return history;

        } catch (Exception e) {
            history.setStatus("FAILED");
            history.setSentCount(sent);
            history.setFailedCount(failed + 1);
            history.setSkippedCount(skipped);
            history.setFinishedAt(LocalDateTime.now());
            history.setErrorMessage(errorToString(e));
            history = historyRepository.save(history);

            schedulerLogService.error(
                    "EXEC_ERROR",
                    config,
                    history,
                    "Execution failed: " + errorToString(e),
                    e
            );

            return history;
        }
    }

    private String composeWaError(String err, Integer httpStatus, String rawResponse) {
        String base = (err == null || err.isBlank()) ? "WhatsApp send failed" : err;
        StringBuilder sb = new StringBuilder(base);

        if (httpStatus != null) {
            sb.append(" | HTTP ").append(httpStatus);
        }

        if (rawResponse != null && !rawResponse.isBlank()) {
            String trimmed = rawResponse.length() > 500 ? rawResponse.substring(0, 500) + "..." : rawResponse;
            sb.append(" | resp=").append(trimmed);
        }

        return sb.toString();
    }

    private String errorToString(Throwable t) {
        if (t == null) return null;
        String msg = t.getMessage();
        if (msg == null || msg.isBlank()) {
            msg = t.toString();
        }
        return t.getClass().getSimpleName() + ": " + msg;
    }

    private Map<String, Object> sendHeyGenVideoWithWablasFallback(
            LearningScheduleConfig config,
            String phoneNumber,
            String caption,
            String script
    ) {
        GeneratedVideoResult video = generateHeyGenVideo(config, script);

        boolean hasBytes = video.bytes != null && video.bytes.length > 0;
        boolean tooLargeForLocal = hasBytes && wablasMaxMediaBytes > 0 && video.bytes.length > wablasMaxMediaBytes;

        // Prefer sending as an actual WhatsApp video (no URL in caption).
        // If local bytes are too large (or missing), try URL-based video send first.
        if (video.resultUrl != null && !video.resultUrl.isBlank() && (tooLargeForLocal || !hasBytes)) {
            Map<String, Object> viaUrl = whatsAppService.sendVideoUrlWithDetails(phoneNumber, caption, video.resultUrl);
            viaUrl.put("videoFallback", "send-video-url-primary");
            if (hasBytes) {
                viaUrl.put("videoBytes", video.bytes.length);
            }
            if (Boolean.TRUE.equals(viaUrl.get("success"))) {
                return viaUrl;
            }
        }

        // If we have bytes that fit Wablas local limit, use local send with robust fallback chain.
        if (hasBytes && !tooLargeForLocal) {
            return whatsAppService.sendVideoAttachmentWithDetailsOrLink(
                    phoneNumber,
                    caption,
                    "learning-video.mp4",
                    video.bytes,
                    video.resultUrl
            );
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", false);
        res.put("phone", phoneNumber);
        res.put("error", "Unable to send video as WhatsApp media");
        if (hasBytes) {
            res.put("videoBytes", video.bytes.length);
        }
        if (video.resultUrl != null && !video.resultUrl.isBlank()) {
            res.put("resultUrl", video.resultUrl);
        }
        return res;
    }

    private static class GeneratedVideoResult {
        private final byte[] bytes;
        private final String resultUrl;

        private GeneratedVideoResult(byte[] bytes, String resultUrl) {
            this.bytes = bytes;
            this.resultUrl = resultUrl;
        }
    }

    private GeneratedVideoResult generateHeyGenVideo(LearningScheduleConfig config, String script) {
        String avatarId = resolveHeyGenAvatarId(config);
        if (avatarId == null || avatarId.isBlank()) {
            throw new IllegalArgumentException("HeyGen avatar is not configured");
        }
        Map<String, Object> created = heyGenService.generateAvatarVideo(
                avatarId,
            null,
                script,
                null,
                null,
                false,
                null,
                null
        );

        String videoId = created == null ? null : (String) created.get("video_id");
        if (videoId == null || videoId.isBlank()) {
            throw new RuntimeException("HeyGen returned empty video_id");
        }

        long deadline = System.currentTimeMillis() + (long) heygenMaxWaitSeconds * 1000L;
        String resultUrl = null;
        Map<String, Object> lastStatus = null;

        while (System.currentTimeMillis() < deadline) {
            Map<String, Object> status = heyGenService.getVideoStatus(videoId);
            lastStatus = status;

            String st = status == null || status.get("status") == null ? "" : status.get("status").toString().toLowerCase(Locale.ROOT);
            resultUrl = status == null || status.get("video_url") == null ? null : status.get("video_url").toString();

            if (("completed".equals(st) || "done".equals(st)) && resultUrl != null && !resultUrl.isBlank()) {
                break;
            }
            if ("failed".equals(st) || "error".equals(st)) {
                String err = status == null || status.get("error") == null ? null : String.valueOf(status.get("error"));
                throw new RuntimeException("HeyGen generation failed" + (err == null || err.isBlank() ? "" : (": " + err)));
            }

            try {
                Thread.sleep(heygenPollIntervalMs);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("Interrupted while waiting HeyGen");
            }
        }

        if (resultUrl == null || resultUrl.isBlank()) {
            String lastSt = lastStatus == null ? "" : String.valueOf(lastStatus.getOrDefault("status", ""));
            String err = lastStatus == null ? null : (lastStatus.get("error") == null ? null : String.valueOf(lastStatus.get("error")));
            StringBuilder sb = new StringBuilder("HeyGen result URL not available");
            if (lastSt != null && !lastSt.isBlank()) sb.append(" | status=").append(lastSt);
            if (err != null && !err.isBlank()) sb.append(" | error=").append(err);
            sb.append(" | waitSeconds=").append(heygenMaxWaitSeconds);
            throw new RuntimeException(sb.toString());
        }

        byte[] bytes = restTemplate.getForObject(toSafeUri(resultUrl), byte[].class);
        return new GeneratedVideoResult(bytes, resultUrl);
    }

    private URI toSafeUri(String url) {
        String v = url == null ? "" : url.trim();
        return URI.create(v);
    }

    private String resolveHeyGenAvatarId(LearningScheduleConfig config) {
        String perConfigId = config == null ? null : normalize(config.getDidPresenterId());
        if (perConfigId != null) {
            return perConfigId;
        }

        String perConfigName = config == null ? null : normalize(config.getDidPresenterName());
        if (perConfigName != null) {
            String id = findHeyGenAvatarIdByNameOrId(perConfigName);
            if (id != null) {
                return id;
            }
        }

        String name = normalize(heygenAvatarName);
        if (name != null) {
            String id = findHeyGenAvatarIdByNameOrId(name);
            if (id != null) {
                return id;
            }
        }

        return normalize(heygenAvatarId);
    }

    private String findHeyGenAvatarIdByNameOrId(String raw) {
        String needle = normalize(raw);
        if (needle == null) return null;

        String needleNorm = normalizeComparable(needle);
        for (Map<String, Object> a : heyGenService.listAvatars()) {
            if (a == null) continue;
            String id = a.get("avatar_id") == null ? null : String.valueOf(a.get("avatar_id"));
            if (id != null && (id.equalsIgnoreCase(needle) || normalizeComparable(id).equals(needleNorm))) {
                return id;
            }
            String displayName = a.get("display_name") == null ? null : String.valueOf(a.get("display_name"));
            if (displayName != null && normalizeComparable(displayName).equals(needleNorm)) {
                return id;
            }
            String avatarName = a.get("avatar_name") == null ? null : String.valueOf(a.get("avatar_name"));
            if (avatarName != null && normalizeComparable(avatarName).equals(needleNorm)) {
                return id;
            }
        }
        return null;
    }

    private String normalizeComparable(String raw) {
        String v = normalize(raw);
        if (v == null) return "";
        return v.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]", "");
    }

    private String applyTemplate(String template, Map<String, String> vars) {
        String t = template == null ? "" : template;
        for (Map.Entry<String, String> e : vars.entrySet()) {
            t = t.replace("{" + e.getKey() + "}", e.getValue());
            t = t.replace(":" + e.getKey(), e.getValue());
        }
        return t;
    }

    private String mergeVideoTemplates(String t1, String t2, String t3, String t4) {
        StringBuilder sb = new StringBuilder();
        for (String t : List.of(t1, t2, t3, t4)) {
            if (t == null) continue;
            String v = t.trim();
            if (v.isEmpty()) continue;
            if (sb.length() > 0) {
                sb.append("\n\n");
            }
            sb.append(v);
        }
        return sb.toString();
    }

    private String normalize(String raw) {
        if (raw == null) return null;
        String v = raw.trim();
        return v.isEmpty() ? null : v;
    }

    private String normalizeType(String raw) {
        String v = normalize(raw);
        if (v == null) return null;
        return v.toUpperCase(Locale.ROOT);
    }

    private String safe(String raw) {
        return raw == null ? "" : raw;
    }

    private String resolveCompanyName(String companyCodeRaw) {
        String companyCode = normalize(companyCodeRaw);
        if (companyCode == null) return "";
        return userRepository.findTopByCompanyCodeIgnoreCase(companyCode)
                .map(u -> safe(u.getCompanyName()))
                .orElse("");
    }

    private String resolveLearningName(String mediaTypeRaw, String learningCodeRaw) {
        String code = normalize(learningCodeRaw);
        if (code == null) return "";
        String mediaType = normalizeType(mediaTypeRaw);
        try {
            if ("VIDEO".equals(mediaType)) {
                return learningModuleVideoRepository.findByCodeIgnoreCase(code).map(v -> safe(v.getTitle())).orElse("");
            }
            if ("IMAGE".equals(mediaType)) {
                return learningModuleImageRepository.findByCodeIgnoreCase(code).map(v -> safe(v.getTitle())).orElse("");
            }
            if ("PDF".equals(mediaType)) {
                return learningModulePdfRepository.findByCodeIgnoreCase(code).map(v -> safe(v.getTitle())).orElse("");
            }
            if ("PPT".equals(mediaType)) {
                return learningModulePowerPointRepository.findByCodeIgnoreCase(code).map(v -> safe(v.getTitle())).orElse("");
            }
        } catch (Exception ignored) {
            return "";
        }
        return "";
    }

    private String normalizeTimezone(String tz) {
        if (tz == null || tz.isBlank()) {
            return "Asia/Jakarta";
        }
        return tz.trim();
    }

    private MediaType guessImageMediaType(String filename) {
        if (filename == null) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        String v = filename.toLowerCase(Locale.ROOT);
        if (v.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (v.endsWith(".gif")) return MediaType.IMAGE_GIF;
        if (v.endsWith(".webp")) return MediaType.valueOf("image/webp");
        if (v.endsWith(".jpeg") || v.endsWith(".jpg")) return MediaType.IMAGE_JPEG;
        return MediaType.APPLICATION_OCTET_STREAM;
    }

    private String buildPublicUrl(String baseUrl, String preferredUrl, String fallbackPath) {
        String u = normalize(preferredUrl);
        if (u != null) {
            if (u.startsWith("http://") || u.startsWith("https://")) {
                return u;
            }
            String b = normalize(baseUrl);
            if (b != null) {
                return trimSlash(b) + (u.startsWith("/") ? u : ("/" + u));
            }
            return u;
        }
        String p = normalize(fallbackPath);
        if (p == null) {
            return null;
        }
        String b = normalize(baseUrl);
        if (b != null) {
            return trimSlash(b) + (p.startsWith("/") ? p : ("/" + p));
        }
        return p;
    }

    private String trimSlash(String base) {
        String v = base.trim();
        while (v.endsWith("/")) {
            v = v.substring(0, v.length() - 1);
        }
        return v;
    }
}
