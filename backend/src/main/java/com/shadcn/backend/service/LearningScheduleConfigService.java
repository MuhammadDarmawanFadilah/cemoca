package com.shadcn.backend.service;

import com.shadcn.backend.dto.LearningScheduleConfigRequest;
import com.shadcn.backend.dto.LearningScheduleConfigResponse;
import com.shadcn.backend.dto.LearningScheduleMaterialRequest;
import com.shadcn.backend.dto.LearningScheduleMaterialResponse;
import com.shadcn.backend.dto.LearningSchedulePrerequisiteResponse;
import com.shadcn.backend.model.LearningScheduleConfig;
import com.shadcn.backend.model.LearningScheduleConfigMaterial;
import com.shadcn.backend.repository.LearningScheduleConfigRepository;
import com.shadcn.backend.repository.LearningScheduleConfigMaterialRepository;
import com.shadcn.backend.repository.MasterAgencyAgentRepository;
import com.shadcn.backend.repository.MasterPolicySalesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningScheduleConfigService {

    private final LearningScheduleConfigRepository repository;
    private final LearningScheduleConfigMaterialRepository materialRepository;
    private final MasterAgencyAgentRepository masterAgencyAgentRepository;
    private final MasterPolicySalesRepository masterPolicySalesRepository;

    public LearningSchedulePrerequisiteResponse checkPrerequisites(String companyCode) {
        String c = normalize(companyCode);
        long agencyCount = masterAgencyAgentRepository.countByCompanyCode(c);
        long policyCount = masterPolicySalesRepository.countByCompanyCode(c);
        return new LearningSchedulePrerequisiteResponse(agencyCount > 0, policyCount > 0);
    }

    public void validateExecutionPrerequisites(String companyCode, String schedulerType) {
        validateActivationPrerequisites(normalize(companyCode), schedulerType);
    }

    public List<LearningScheduleConfigResponse> listByCompany(String companyCode) {
        List<LearningScheduleConfig> configs = repository.findByCompanyCodeOrderByUpdatedAtDesc(normalize(companyCode));
        if (configs.isEmpty()) return List.of();

        List<Long> ids = configs.stream().map(LearningScheduleConfig::getId).toList();
        Map<Long, List<LearningScheduleConfigMaterial>> materialsByConfigId = materialRepository
            .findByConfigIdInOrderByConfigIdAscStartDateAsc(ids)
            .stream()
            .collect(Collectors.groupingBy(m -> m.getConfig().getId()));

        return configs.stream()
            .map(cfg -> toResponse(cfg, materialsByConfigId.getOrDefault(cfg.getId(), List.of())))
            .toList();
    }

    public LearningScheduleConfigResponse getById(String companyCode, Long id) {
        LearningScheduleConfig entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Config not found"));
        if (!normalize(companyCode).equalsIgnoreCase(normalize(entity.getCompanyCode()))) {
            throw new SecurityException("Forbidden");
        }
        List<LearningScheduleConfigMaterial> materials = materialRepository.findByConfigIdOrderByStartDateAsc(entity.getId());
        return toResponse(entity, materials);
    }

    @Transactional
    public LearningScheduleConfigResponse create(String companyCode, LearningScheduleConfigRequest request) {
        String c = normalize(companyCode);
        validateRequest(request);

        Optional<LearningScheduleConfig> existing = repository.findByCompanyCodeAndSchedulerType(c, normalizeType(request.schedulerType()));
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Scheduler type already exists for this company");
        }

        LearningScheduleConfig entity = new LearningScheduleConfig();
        entity.setCompanyCode(c);
        applyRequest(entity, request);
        entity.setActive(Boolean.FALSE);

        LearningScheduleConfig saved = repository.save(entity);
        saveMaterials(saved, request);
        List<LearningScheduleConfigMaterial> materials = materialRepository.findByConfigIdOrderByStartDateAsc(saved.getId());
        return toResponse(saved, materials);
    }

    @Transactional
    public LearningScheduleConfigResponse update(String companyCode, Long id, LearningScheduleConfigRequest request) {
        String c = normalize(companyCode);
        validateRequest(request);

        LearningScheduleConfig entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Config not found"));

        if (!c.equalsIgnoreCase(normalize(entity.getCompanyCode()))) {
            throw new SecurityException("Forbidden");
        }

        applyRequest(entity, request);
        saveMaterials(entity, request);
        if (Boolean.TRUE.equals(request.active())) {
            validateActivationPrerequisites(c, entity.getSchedulerType());
            entity.setActive(true);
        } else if (Boolean.FALSE.equals(request.active())) {
            entity.setActive(false);
        }

        LearningScheduleConfig saved = repository.save(entity);
        List<LearningScheduleConfigMaterial> materials = materialRepository.findByConfigIdOrderByStartDateAsc(saved.getId());
        return toResponse(saved, materials);
    }

    @Transactional
    public LearningScheduleConfigResponse activate(String companyCode, Long id) {
        String c = normalize(companyCode);
        LearningScheduleConfig entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Config not found"));
        if (!c.equalsIgnoreCase(normalize(entity.getCompanyCode()))) {
            throw new SecurityException("Forbidden");
        }

        validateActivationPrerequisites(c, entity.getSchedulerType());
        entity.setActive(true);
        LearningScheduleConfig saved = repository.save(entity);
        List<LearningScheduleConfigMaterial> materials = materialRepository.findByConfigIdOrderByStartDateAsc(saved.getId());
        return toResponse(saved, materials);
    }

    @Transactional
    public LearningScheduleConfigResponse deactivate(String companyCode, Long id) {
        String c = normalize(companyCode);
        LearningScheduleConfig entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Config not found"));
        if (!c.equalsIgnoreCase(normalize(entity.getCompanyCode()))) {
            throw new SecurityException("Forbidden");
        }

        entity.setActive(false);
        LearningScheduleConfig saved = repository.save(entity);
        List<LearningScheduleConfigMaterial> materials = materialRepository.findByConfigIdOrderByStartDateAsc(saved.getId());
        return toResponse(saved, materials);
    }

    private void validateActivationPrerequisites(String companyCode, String schedulerType) {
        long agencyCount = masterAgencyAgentRepository.countByCompanyCode(companyCode);
        if (agencyCount <= 0) {
            throw new IllegalArgumentException("Prerequisite not met: Agency List is empty");
        }
        String st = normalizeType(schedulerType);
        if (!List.of("WELCOME_NEW_JOINNER", "HAPPY_BIRTHDAY_NOTIFICATION").contains(st)) {
            long policyCount = masterPolicySalesRepository.countByCompanyCode(companyCode);
            if (policyCount <= 0) {
                throw new IllegalArgumentException("Prerequisite not met: Policy Sales is empty");
            }
        }
    }

    private void applyRequest(LearningScheduleConfig entity, LearningScheduleConfigRequest request) {
        entity.setSchedulerType(normalizeType(request.schedulerType()));
        entity.setStartDate(request.startDate());
        entity.setEndDate(request.endDate());
        entity.setHourOfDay(request.hourOfDay());
        entity.setMediaType(normalizeType(request.mediaType()));
        String learningCode = normalize(request.learningCode());
        entity.setLearningCode(learningCode == null ? "" : learningCode);

        entity.setVideoLearningCode1(normalize(request.videoLearningCode1()));
        entity.setVideoLearningCode2(normalize(request.videoLearningCode2()));
        entity.setVideoLearningCode3(normalize(request.videoLearningCode3()));
        entity.setVideoLearningCode4(normalize(request.videoLearningCode4()));

        entity.setVideoTextTemplate(request.videoTextTemplate());
        entity.setVideoTextTemplate1(request.videoTextTemplate1());
        entity.setVideoTextTemplate2(request.videoTextTemplate2());
        entity.setVideoTextTemplate3(request.videoTextTemplate3());
        entity.setVideoTextTemplate4(request.videoTextTemplate4());
        entity.setWaMessageTemplate(request.waMessageTemplate());
        entity.setDidPresenterId(normalize(request.didPresenterId()));
        entity.setDidPresenterName(normalize(request.didPresenterName()));
    }

    private void validateRequest(LearningScheduleConfigRequest request) {
        if (request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("End date must be >= start date");
        }
        if (request.hourOfDay() < 0 || request.hourOfDay() > 23) {
            throw new IllegalArgumentException("Hour of day must be 0-23");
        }
        String schedulerType = normalizeType(request.schedulerType());
        String media = normalizeType(request.mediaType());
        if (!List.of("VIDEO", "IMAGE", "PDF", "PPT").contains(media)) {
            throw new IllegalArgumentException("Invalid media type");
        }
        boolean learningCodeOptional = List.of("WELCOME_NEW_JOINNER", "HAPPY_BIRTHDAY_NOTIFICATION").contains(schedulerType);
        if (!learningCodeOptional && normalize(request.learningCode()) == null) {
            throw new IllegalArgumentException("Learning code is required");
        }
        if (normalize(request.waMessageTemplate()) == null) {
            throw new IllegalArgumentException("WhatsApp message template is required");
        }
        if ("VIDEO".equals(media) && normalize(request.videoTextTemplate()) == null) {
            // Allow using materials-only video templates (dynamic learning materials)
            if (request.materials() == null || request.materials().isEmpty()) {
                throw new IllegalArgumentException("Video text template is required for VIDEO");
            }
        }

        validateMaterials(request);
    }

    private void validateMaterials(LearningScheduleConfigRequest request) {
        List<LearningScheduleMaterialRequest> materials = request.materials();
        if (materials == null || materials.isEmpty()) return;

        LocalDate scheduleStart = request.startDate();
        LocalDate scheduleEnd = request.endDate();
        String media = normalizeType(request.mediaType());

        // Validate ranges and bounds
        for (LearningScheduleMaterialRequest m : materials) {
            if (m == null) {
                throw new IllegalArgumentException("Material is required");
            }
            if (m.endDate().isBefore(m.startDate())) {
                throw new IllegalArgumentException("Material end date must be >= start date");
            }
            if (m.startDate().isBefore(scheduleStart) || m.endDate().isAfter(scheduleEnd)) {
                throw new IllegalArgumentException("Material period must be within schedule period");
            }
            if (normalize(m.learningCode()) == null) {
                throw new IllegalArgumentException("Material learning code is required");
            }
            if ("VIDEO".equals(media)) {
                // For VIDEO, each material card must contain Learning Material 1-4.
                if (normalize(m.videoLearningCode1()) == null
                        || normalize(m.videoLearningCode2()) == null
                        || normalize(m.videoLearningCode3()) == null
                        || normalize(m.videoLearningCode4()) == null) {
                    throw new IllegalArgumentException("Material video learning codes 1-4 are required for VIDEO");
                }
                if (normalize(m.videoTextTemplate1()) == null
                        || normalize(m.videoTextTemplate2()) == null
                        || normalize(m.videoTextTemplate3()) == null
                        || normalize(m.videoTextTemplate4()) == null) {
                    throw new IllegalArgumentException("Material video text templates 1-4 are required for VIDEO");
                }
            }
        }

        // No-overlap (inclusive)
        List<LearningScheduleMaterialRequest> sorted = materials.stream()
                .sorted((a, b) -> a.startDate().compareTo(b.startDate()))
                .toList();

        for (int i = 1; i < sorted.size(); i++) {
            LearningScheduleMaterialRequest prev = sorted.get(i - 1);
            LearningScheduleMaterialRequest cur = sorted.get(i);
            if (!cur.startDate().isAfter(prev.endDate())) {
                throw new IllegalArgumentException("Material periods must not overlap");
            }
        }
    }

    private void saveMaterials(LearningScheduleConfig config, LearningScheduleConfigRequest request) {
        List<LearningScheduleMaterialRequest> materials = request.materials();
        if (materials == null) {
            return;
        }

        // Replace fully (simpler and deterministic)
        materialRepository.deleteByConfigId(config.getId());
        if (materials.isEmpty()) return;

        for (LearningScheduleMaterialRequest m : materials) {
            LearningScheduleConfigMaterial entity = new LearningScheduleConfigMaterial();
            entity.setConfig(config);
            entity.setStartDate(m.startDate());
            entity.setEndDate(m.endDate());
            entity.setLearningCode(normalize(m.learningCode()));
            entity.setVideoTextTemplate(m.videoTextTemplate());

            entity.setVideoLearningCode1(normalize(m.videoLearningCode1()));
            entity.setVideoLearningCode2(normalize(m.videoLearningCode2()));
            entity.setVideoLearningCode3(normalize(m.videoLearningCode3()));
            entity.setVideoLearningCode4(normalize(m.videoLearningCode4()));

            entity.setVideoTextTemplate1(m.videoTextTemplate1());
            entity.setVideoTextTemplate2(m.videoTextTemplate2());
            entity.setVideoTextTemplate3(m.videoTextTemplate3());
            entity.setVideoTextTemplate4(m.videoTextTemplate4());
            materialRepository.save(entity);
        }
    }

    private LearningScheduleConfigResponse toResponse(LearningScheduleConfig e, List<LearningScheduleConfigMaterial> materials) {
        List<LearningScheduleMaterialResponse> materialResponses = (materials == null ? List.<LearningScheduleConfigMaterial>of() : materials)
                .stream()
                .map(m -> new LearningScheduleMaterialResponse(
                        m.getId(),
                        m.getStartDate(),
                        m.getEndDate(),
                        m.getLearningCode(),
                    m.getVideoTextTemplate(),
                    m.getVideoLearningCode1(),
                    m.getVideoLearningCode2(),
                    m.getVideoLearningCode3(),
                    m.getVideoLearningCode4(),
                    m.getVideoTextTemplate1(),
                    m.getVideoTextTemplate2(),
                    m.getVideoTextTemplate3(),
                    m.getVideoTextTemplate4()
                ))
                .toList();

        return new LearningScheduleConfigResponse(
                e.getId(),
                e.getCompanyCode(),
                e.getSchedulerType(),
                e.getActive(),
                e.getStartDate(),
                e.getEndDate(),
                e.getHourOfDay(),
                e.getMediaType(),
                e.getLearningCode(),
                e.getVideoLearningCode1(),
                e.getVideoLearningCode2(),
                e.getVideoLearningCode3(),
                e.getVideoLearningCode4(),
                e.getVideoTextTemplate(),
                e.getVideoTextTemplate1(),
                e.getVideoTextTemplate2(),
                e.getVideoTextTemplate3(),
                e.getVideoTextTemplate4(),
                materialResponses,
                e.getWaMessageTemplate(),
                e.getDidPresenterId(),
                e.getDidPresenterName(),
                e.getLastTriggeredAt(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
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
}
