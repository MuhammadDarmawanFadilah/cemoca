package com.shadcn.backend.service;

import com.shadcn.backend.dto.LearningModuleVideoRequest;
import com.shadcn.backend.dto.LearningModuleVideoResponse;
import com.shadcn.backend.model.LearningModuleVideo;
import com.shadcn.backend.repository.LearningModuleVideoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.nio.charset.StandardCharsets;

@Service
public class LearningModuleVideoService {

    private static final Set<String> ALLOWED_DURATIONS = Set.of("D1", "D2", "D3");
    private static final Set<String> ALLOWED_SHARE_SCOPES = Set.of("GENERAL", "COMPANY_ONLY");
    private static final Set<String> ALLOWED_VIDEO_CATEGORIES = Set.of("VIDEO_1", "VIDEO_2", "VIDEO_3", "VIDEO_4");

    private static final List<String> AUDIENCE_ORDER = List.of(
            "GENERAL",
            "TOP_LEADER",
            "LEADER",
            "TOP_AGENT",
            "AGENT",
            "NEW_LEADER",
            "NEW_AGENT"
    );

    private static final Map<String, String> AUDIENCE_CODES = Map.of(
            "GENERAL", "GEN",
            "TOP_LEADER", "TL",
            "LEADER", "L",
            "TOP_AGENT", "TA",
            "AGENT", "A",
            "NEW_LEADER", "NL",
            "NEW_AGENT", "NA"
    );

    private static final List<String> CONTENT_ORDER = List.of(
            "GENERAL",
            "LEADERSHIP",
            "MOTIVATION_COACH",
            "PERSONAL_SALES",
            "RECRUITMENT",
            "PRODUCT",
            "LEGAL_COMPLIANCE",
            "OPERATION"
    );

    private static final Map<String, String> CONTENT_CODES = Map.of(
            "GENERAL", "GEN",
            "LEADERSHIP", "LDR",
            "MOTIVATION_COACH", "MOT",
            "PERSONAL_SALES", "PS",
            "RECRUITMENT", "REC",
            "PRODUCT", "PROD",
            "LEGAL_COMPLIANCE", "LEG",
            "OPERATION", "OPS"
    );

    private static final Random CODE_RANDOM = new Random();

    @Autowired
    private LearningModuleVideoRepository repository;

    public Page<LearningModuleVideoResponse> list(
            Pageable pageable,
            String category,
            String requesterCompanyName,
            String title,
            String duration,
            String creator,
            String audience,
            String contentType
    ) {
        String requester = normalizeCompanyName(requesterCompanyName);
        String cat = normalizeVideoCategory(category);
        String t = normalizeString(title);
        String d = normalizeString(duration);
        String c = normalizeString(creator);
        String a = buildJsonArrayRegexFromCsv(audience);
        String ct = buildJsonArrayRegexFromCsv(contentType);

        if (requester == null) {
            return repository.searchGeneral(cat, t, d, c, a, ct, pageable).map(v -> toResponseSummary(v, null));
        }
        return repository.search(requester, cat, t, d, c, a, ct, pageable).map(v -> toResponseSummary(v, requester));
    }

    public Optional<LearningModuleVideoResponse> getById(Long id, String requesterCompanyName) {
        String requester = normalizeCompanyName(requesterCompanyName);
        if (requester == null) {
            return repository.findById(id)
                    .filter(v -> "GENERAL".equalsIgnoreCase(defaultShareScope(v.getShareScope())))
                    .map(v -> toResponseDetail(v, null));
        }
        return repository.findVisibleByIdForCompany(id, requester).map(v -> toResponseDetail(v, requester));
    }

    public LearningModuleVideoResponse create(LearningModuleVideoRequest request) {
        LearningModuleVideo entity = new LearningModuleVideo();
        applyRequest(entity, request);

        String category = normalizeVideoCategory(request.videoCategory());
        entity.setVideoCategory(category);

        String createdByCompanyName = normalizeCompanyName(request.createdByCompanyName());
        if ("COMPANY_ONLY".equalsIgnoreCase(entity.getShareScope()) && createdByCompanyName == null) {
            throw new IllegalArgumentException("Created by company name is required for company-only videos");
        }
        entity.setCreatedByCompanyName(createdByCompanyName);

        entity.setCode(ensureUniqueCode(generateUniqueCode(entity)));
        LearningModuleVideo saved = repository.save(entity);
        return toResponseDetail(saved, createdByCompanyName);
    }

    public Optional<LearningModuleVideoResponse> update(Long id, LearningModuleVideoRequest request, String requesterCompanyName) {
        Optional<LearningModuleVideo> existingOpt = repository.findById(id);
        if (existingOpt.isEmpty()) {
            return Optional.empty();
        }
        LearningModuleVideo entity = existingOpt.get();

        String requester = normalizeCompanyName(requesterCompanyName);
        if (!canEdit(entity, requester)) {
            throw new SecurityException("Forbidden");
        }

        applyRequest(entity, request);

        String categoryRaw = request.videoCategory();
        if (categoryRaw != null && !categoryRaw.trim().isEmpty()) {
            entity.setVideoCategory(normalizeVideoCategory(categoryRaw));
        }

        if (normalizeCompanyName(entity.getCreatedByCompanyName()) == null) {
            String fromRequest = normalizeCompanyName(request.createdByCompanyName());
            if (fromRequest != null) {
                entity.setCreatedByCompanyName(fromRequest);
            }
        }

        if ("COMPANY_ONLY".equalsIgnoreCase(entity.getShareScope()) && normalizeCompanyName(entity.getCreatedByCompanyName()) == null) {
            throw new IllegalArgumentException("Created by company name is required for company-only videos");
        }

        String nextBase = generateBaseCode(entity);
        String current = entity.getCode() == null ? "" : entity.getCode();
        if (!current.startsWith(nextBase + "-")) {
            entity.setCode(ensureUniqueCode(nextBase + "-" + randomSuffix(6)));
        }
        LearningModuleVideo saved = repository.save(entity);
        return Optional.of(toResponseDetail(saved, requester));
    }

    public boolean delete(Long id, String requesterCompanyName) {
        Optional<LearningModuleVideo> existingOpt = repository.findById(id);
        if (existingOpt.isEmpty()) {
            return false;
        }
        LearningModuleVideo entity = existingOpt.get();

        String requester = normalizeCompanyName(requesterCompanyName);
        if (!canEdit(entity, requester)) {
            throw new SecurityException("Forbidden");
        }

        repository.deleteById(id);
        return true;
    }

    private void applyRequest(LearningModuleVideo entity, LearningModuleVideoRequest request) {
        String title = request.title() == null ? "" : request.title().trim();
        // Title is optional in DB but let's trim it.

        String duration = request.duration() == null ? null : request.duration().trim().toUpperCase(Locale.ROOT);
        if (duration == null || !ALLOWED_DURATIONS.contains(duration)) {
            throw new IllegalArgumentException("Invalid duration");
        }

        String shareScope = defaultShareScope(request.shareScope());
        if (!ALLOWED_SHARE_SCOPES.contains(shareScope)) {
            throw new IllegalArgumentException("Invalid share scope");
        }

        List<String> audience = normalizeList(request.intendedAudience(), AUDIENCE_ORDER);
        if (audience.isEmpty()) {
            throw new IllegalArgumentException("Intended audience is required");
        }

        List<String> content = normalizeList(request.contentTypes(), CONTENT_ORDER);
        if (content.isEmpty()) {
            throw new IllegalArgumentException("Content types are required");
        }

        String text = request.text() == null ? "" : request.text().trim();
        if (text.isEmpty()) {
            throw new IllegalArgumentException("Text is required");
        }

        entity.setTitle(title);
        entity.setDuration(duration);
        entity.setShareScope(shareScope);
        entity.setIntendedAudience(audience);
        entity.setContentTypes(content);
        entity.setText(text);
    }

    private String normalizeVideoCategory(String raw) {
        if (raw == null) {
            return "VIDEO_1";
        }
        String v = raw.trim().toUpperCase(Locale.ROOT);
        if (v.isEmpty()) {
            return "VIDEO_1";
        }
        if (!ALLOWED_VIDEO_CATEGORIES.contains(v)) {
            throw new IllegalArgumentException("Invalid video category");
        }
        return v;
    }

    private String defaultShareScope(String raw) {
        String v = raw == null ? "" : raw.trim().toUpperCase(Locale.ROOT);
        if (v.isEmpty()) return "GENERAL";
        return v;
    }

    private String normalizeCompanyName(String raw) {
        if (raw == null) return null;
        String v = raw.trim();
        if (v.isEmpty()) return null;
        return v;
    }

    private String normalizeString(String raw) {
        if (raw == null) return null;
        String v = raw.trim();
        if (v.isEmpty()) return null;
        return v;
    }

    private String buildJsonArrayRegexFromCsv(String rawCsv) {
        String v = normalizeString(rawCsv);
        if (v == null) return null;

        // Accept single value or comma-separated values. Values are expected to be enum-like tokens.
        String[] parts = v.split(",");
        List<String> tokens = new ArrayList<>();
        for (String p : parts) {
            if (p == null) continue;
            String token = p.trim().toUpperCase(Locale.ROOT);
            if (token.isEmpty()) continue;
            // allow only A-Z0-9_ to keep regex safe
            if (!token.matches("[A-Z0-9_]+")) continue;
            tokens.add(token);
        }
        if (tokens.isEmpty()) return null;

        if (tokens.size() == 1) {
            return "\\\"" + tokens.get(0) + "\\\"";
        }
        return "\\\"(" + String.join("|", tokens) + ")\\\"";
    }

    private boolean canEdit(LearningModuleVideo entity, String requesterCompanyName) {
        if (requesterCompanyName == null) {
            return true;
        }
        String owner = normalizeCompanyName(entity.getCreatedByCompanyName());
        if (owner == null) {
            return false;
        }
        return owner.equalsIgnoreCase(requesterCompanyName);
    }

    private String createdByDisplay(LearningModuleVideo entity) {
        String owner = normalizeCompanyName(entity.getCreatedByCompanyName());
        return owner == null ? "Anonim / Admin" : owner;
    }

    private List<String> normalizeList(List<String> input, List<String> allowedOrder) {
        if (input == null) {
            return List.of();
        }

        Set<String> normalized = new LinkedHashSet<>();
        for (String raw : input) {
            if (raw == null) continue;
            String v = raw.trim().toUpperCase(Locale.ROOT);
            if (v.isEmpty()) continue;
            normalized.add(v);
        }

        List<String> ordered = new ArrayList<>();
        for (String allowed : allowedOrder) {
            if (normalized.contains(allowed)) {
                ordered.add(allowed);
            }
        }
        return ordered;
    }

    private String generateUniqueCode(LearningModuleVideo entity) {
        String base = generateBaseCode(entity);
        return base + "-" + randomSuffix(6);
    }

    private String generateBaseCode(LearningModuleVideo entity) {
        String duration = entity.getDuration();

        List<String> audienceCodes = new ArrayList<>();
        for (String a : entity.getIntendedAudience()) {
            String code = AUDIENCE_CODES.get(a);
            if (code != null) audienceCodes.add(code);
        }

        List<String> contentCodes = new ArrayList<>();
        for (String c : entity.getContentTypes()) {
            String code = CONTENT_CODES.get(c);
            if (code != null) contentCodes.add(code);
        }

        String payload = duration + "|" + String.join(",", audienceCodes) + "|" + String.join(",", contentCodes);
        String hash = shortHash8(payload);
        return duration + "-" + hash;
    }

    private String ensureUniqueCode(String codeCandidate) {
        String code = codeCandidate;
        int attempts = 0;
        while (repository.existsByCode(code) && attempts < 20) {
            String base = codeCandidate;
            int lastDash = codeCandidate.lastIndexOf('-');
            if (lastDash > 0) {
                base = codeCandidate.substring(0, lastDash);
            }
            code = base + "-" + randomSuffix(6);
            attempts++;
        }
        return code;
    }

    private String shortHash8(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 4; i++) {
                sb.append(String.format("%02X", hash[i]));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            String b64 = Base64.getEncoder().encodeToString(input.getBytes(StandardCharsets.UTF_8));
            String cleaned = b64.replaceAll("[^A-Z0-9]", "").toUpperCase(Locale.ROOT);
            return cleaned.length() >= 8 ? cleaned.substring(0, 8) : (cleaned + "00000000").substring(0, 8);
        }
    }

    private String randomSuffix(int length) {
        final String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(alphabet.charAt(CODE_RANDOM.nextInt(alphabet.length())));
        }
        return sb.toString();
    }

    private LearningModuleVideoResponse toResponseSummary(LearningModuleVideo entity, String requesterCompanyName) {
        return new LearningModuleVideoResponse(
                entity.getId(),
                entity.getCode(),
                normalizeVideoCategory(entity.getVideoCategory()),
                entity.getTitle(),
                entity.getDuration(),
                defaultShareScope(entity.getShareScope()),
                normalizeCompanyName(entity.getCreatedByCompanyName()),
                createdByDisplay(entity),
                canEdit(entity, requesterCompanyName),
                entity.getIntendedAudience(),
                entity.getContentTypes(),
                null,
                buildPreview(entity.getText()),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private LearningModuleVideoResponse toResponseDetail(LearningModuleVideo entity, String requesterCompanyName) {
        return new LearningModuleVideoResponse(
                entity.getId(),
                entity.getCode(),
                normalizeVideoCategory(entity.getVideoCategory()),
                entity.getTitle(),
                entity.getDuration(),
                defaultShareScope(entity.getShareScope()),
                normalizeCompanyName(entity.getCreatedByCompanyName()),
                createdByDisplay(entity),
                canEdit(entity, requesterCompanyName),
                entity.getIntendedAudience(),
                entity.getContentTypes(),
                entity.getText(),
                buildPreview(entity.getText()),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private String buildPreview(String text) {
        if (text == null) return "";
        String t = text.trim().replaceAll("\\s+", " ");
        if (t.length() <= 160) return t;
        return t.substring(0, 160) + "...";
    }
}
