package com.shadcn.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadcn.backend.dto.GeminiReviewResponse;
import com.shadcn.backend.dto.LearningVideoCreateRequest;
import com.shadcn.backend.dto.LearningVideoCreateResponse;
import com.shadcn.backend.dto.LearningVideoGetResponse;
import com.shadcn.backend.dto.LearningVideoRequestEditRequest;
import com.shadcn.backend.dto.LearningVideoRequestEditResponse;
import com.shadcn.backend.dto.LearningVideoTranslateAllRequest;
import com.shadcn.backend.dto.LearningVideoTranslateAllResponse;
import com.shadcn.backend.model.LearningVideoEditHistory;
import com.shadcn.backend.model.LearningVideoEditToken;
import com.shadcn.backend.model.LearningVideoTextBundle;
import com.shadcn.backend.repository.LearningVideoEditHistoryRepository;
import com.shadcn.backend.repository.LearningVideoEditTokenRepository;
import com.shadcn.backend.repository.LearningVideoTextBundleRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@Service
public class LearningVideoService {

    private static final Random CODE_RANDOM = new Random();

    private final LearningVideoTextBundleRepository repository;
    private final LearningVideoEditTokenRepository tokenRepository;
    private final LearningVideoEditHistoryRepository historyRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;
    private final WhatsAppService whatsAppService;
    
    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public LearningVideoService(
            LearningVideoTextBundleRepository repository,
            LearningVideoEditTokenRepository tokenRepository,
            LearningVideoEditHistoryRepository historyRepository,
            GeminiService geminiService,
            ObjectMapper objectMapper,
            WhatsAppService whatsAppService
    ) {
        this.repository = repository;
        this.tokenRepository = tokenRepository;
        this.historyRepository = historyRepository;
        this.geminiService = geminiService;
        this.objectMapper = objectMapper;
        this.whatsAppService = whatsAppService;
    }

    public LearningVideoCreateResponse create(LearningVideoCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Invalid request");
        }

        String sourceLang = normalizeLang(request.sourceLanguageCode());
        if (sourceLang == null) {
            throw new IllegalArgumentException("Source language is required");
        }

        String sourceText = request.sourceText() == null ? "" : request.sourceText().trim();
        if (sourceText.isEmpty()) {
            throw new IllegalArgumentException("Source text is required");
        }

        Map<String, String> translations = request.translations() == null ? Map.of() : request.translations();

        LearningVideoTextBundle entity = new LearningVideoTextBundle();
        entity.setSourceLanguageCode(sourceLang);
        entity.setSourceText(sourceText);
        entity.setCode(ensureUniqueCode("LV-" + randomSuffix(10)));

        try {
            entity.setTranslationsJson(objectMapper.writeValueAsString(translations));
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid translations");
        }

        GeminiReviewResponse review = request.review();
        if (review != null) {
            try {
                entity.setReviewJson(objectMapper.writeValueAsString(review));
            } catch (Exception ignore) {
                entity.setReviewJson(null);
            }
        }

        LearningVideoTextBundle saved = repository.save(entity);
        return new LearningVideoCreateResponse(saved.getId(), saved.getCode());
    }

    public List<LearningVideoGetResponse> list() {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        return repository.findAll(sort).stream()
                .map(this::toResponse)
                .toList();
    }

    public Map<String, Object> listPaginated(int page, int size, String search) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<LearningVideoTextBundle> resultPage;
        if (search != null && !search.trim().isEmpty()) {
            resultPage = repository.findByCodeContainingIgnoreCase(search.trim(), pageable);
        } else {
            resultPage = repository.findAll(pageable);
        }
        
        List<LearningVideoGetResponse> content = resultPage.getContent().stream()
                .map(this::toResponse)
                .toList();
        
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("page", resultPage.getNumber());
        response.put("size", resultPage.getSize());
        response.put("totalElements", resultPage.getTotalElements());
        response.put("totalPages", resultPage.getTotalPages());
        response.put("first", resultPage.isFirst());
        response.put("last", resultPage.isLast());
        
        return response;
    }

    public Optional<LearningVideoGetResponse> getById(Long id) {
        if (id == null) {
            return Optional.empty();
        }
        return repository.findById(id).map(this::toResponse);
    }

    public Optional<LearningVideoGetResponse> getByCode(String code) {
        String c = normalizeCode(code);
        if (c == null) {
            return Optional.empty();
        }

        return repository.findByCode(c).map(this::toResponse);
    }

    public boolean update(Long id, LearningVideoCreateRequest request) {
        if (id == null || request == null) {
            return false;
        }

        Optional<LearningVideoTextBundle> existing = repository.findById(id);
        if (existing.isEmpty()) {
            return false;
        }

        LearningVideoTextBundle entity = existing.get();

        // Only update translations - source text and language are final from creation
        Map<String, String> translations = request.translations();
        if (translations != null) {
            try {
                // Parse existing translations
                Map<String, String> existingTranslations = parseTranslations(entity.getTranslationsJson());
                
                // Track changes
                Map<String, Map<String, String>> changesMap = new HashMap<>();
                for (Map.Entry<String, String> entry : translations.entrySet()) {
                    String lang = entry.getKey();
                    String newValue = entry.getValue();
                    String oldValue = existingTranslations.getOrDefault(lang, "");
                    
                    if (!oldValue.equals(newValue)) {
                        Map<String, String> change = new HashMap<>();
                        change.put("before", oldValue);
                        change.put("after", newValue);
                        changesMap.put(lang, change);
                    }
                }
                
                String newTranslationsJson = objectMapper.writeValueAsString(translations);
                entity.setTranslationsJson(newTranslationsJson);
                
                // Record edit history (admin edit) with detailed changes
                String changesJson = objectMapper.writeValueAsString(changesMap);
                saveEditHistory(id, "ADMIN_EDIT", null, null, changesJson);
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid translations");
            }
        }

        repository.save(entity);
        return true;
    }

    public boolean delete(Long id) {
        if (id == null) {
            return false;
        }

        if (!repository.existsById(id)) {
            return false;
        }

        repository.deleteById(id);
        return true;
    }

    public LearningVideoTranslateAllResponse translateAll(LearningVideoTranslateAllRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Invalid request");
        }

        String text = request.text() == null ? "" : request.text().trim();
        if (text.isEmpty()) {
            throw new IllegalArgumentException("Text is required");
        }

        List<LearningVideoTranslateAllRequest.TargetLanguage> targets = request.targets();
        if (targets == null || targets.isEmpty()) {
            throw new IllegalArgumentException("Targets are required");
        }

        Map<String, String> out = new LinkedHashMap<>();
        for (LearningVideoTranslateAllRequest.TargetLanguage t : targets) {
            if (t == null) continue;

            String code = normalizeLang(t.code());
            String name = t.name() == null ? null : t.name().trim();
            if (code == null) continue;

            String translated = geminiService.translate(text, code, name).text();
            out.put(code, translated);
        }

        return new LearningVideoTranslateAllResponse(out);
    }

    public GeminiReviewResponse review(String text, String inputLanguageCode, String inputLanguageName) {
        String safeText = text == null ? "" : text.trim();
        if (safeText.isEmpty()) {
            throw new IllegalArgumentException("Text is required");
        }

        String lang = (inputLanguageName == null || inputLanguageName.trim().isEmpty())
                ? (inputLanguageCode == null ? "" : inputLanguageCode.trim())
                : inputLanguageName.trim();

        return geminiService.reviewLearningVideoText(safeText, lang);
    }

    public String resolveTextForLanguage(LearningVideoTextBundle bundle, String languageCode) {
        if (bundle == null) {
            return null;
        }

        String lang = normalizeLang(languageCode);
        if (lang == null) {
            lang = normalizeLang(bundle.getSourceLanguageCode());
        }

        if (lang != null && lang.equalsIgnoreCase(normalizeLang(bundle.getSourceLanguageCode()))) {
            String t = bundle.getSourceText();
            return t == null ? null : t.trim();
        }

        Map<String, String> translations = parseTranslations(bundle.getTranslationsJson());
        if (translations == null || translations.isEmpty()) {
            return null;
        }

        String direct = translations.get(lang);
        if (direct != null && !direct.trim().isEmpty()) {
            return direct.trim();
        }

        for (Map.Entry<String, String> e : translations.entrySet()) {
            if (e == null) continue;
            if (e.getKey() != null && e.getKey().equalsIgnoreCase(lang)) {
                String v = e.getValue();
                return v == null ? null : v.trim();
            }
        }

        return null;
    }

    private LearningVideoGetResponse toResponse(LearningVideoTextBundle entity) {
        Map<String, String> translations = parseTranslations(entity.getTranslationsJson());
        GeminiReviewResponse review = parseReview(entity.getReviewJson());

        return new LearningVideoGetResponse(
                entity.getId(),
                entity.getCode(),
                entity.getSourceLanguageCode(),
                entity.getSourceText(),
                review,
                translations,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private Map<String, String> parseTranslations(String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            Map<String, String> map = objectMapper.readValue(json, new TypeReference<Map<String, String>>() {
            });
            if (map == null) return Map.of();
            return map;
        } catch (Exception ignore) {
            return Map.of();
        }
    }

    private GeminiReviewResponse parseReview(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, GeminiReviewResponse.class);
        } catch (Exception ignore) {
            return null;
        }
    }

    private String ensureUniqueCode(String candidate) {
        String code = candidate;
        int attempts = 0;
        while (repository.existsByCode(code) && attempts < 50) {
            code = "LV-" + randomSuffix(10);
            attempts++;
        }
        return code;
    }

    private String normalizeCode(String raw) {
        if (raw == null) return null;
        String v = raw.trim();
        if (v.isEmpty()) return null;
        return v;
    }

    private String normalizeLang(String raw) {
        if (raw == null) return null;
        String v = raw.trim();
        if (v.isEmpty()) return null;
        v = v.toLowerCase(Locale.ROOT);
        // keep as short stable key (e.g. en, id, ja, th, vi, km)
        int dash = v.indexOf('-');
        if (dash > 0) v = v.substring(0, dash);
        return v;
    }

    private String randomSuffix(int length) {
        final String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(alphabet.charAt(CODE_RANDOM.nextInt(alphabet.length())));
        }
        return sb.toString();
    }
    
    public LearningVideoRequestEditResponse requestEdit(Long id, LearningVideoRequestEditRequest request) {
        if (id == null || request == null) {
            return new LearningVideoRequestEditResponse(false, null, "Invalid request");
        }
        
        Optional<LearningVideoTextBundle> videoOpt = repository.findById(id);
        if (videoOpt.isEmpty()) {
            return new LearningVideoRequestEditResponse(false, null, "Learning video not found");
        }
        
        String phoneNumber = request.phoneNumber();
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return new LearningVideoRequestEditResponse(false, null, "Phone number is required");
        }
        
        List<String> languageCodes = request.languageCodes();
        if (languageCodes == null || languageCodes.isEmpty()) {
            return new LearningVideoRequestEditResponse(false, null, "At least one language must be selected");
        }
        
        LearningVideoTextBundle video = videoOpt.get();
        
        // Generate unique token
        String token = generateEditToken(id);
        
        // Save token to database
        LearningVideoEditToken editToken = new LearningVideoEditToken();
        editToken.setLearningVideoId(id);
        editToken.setToken(token);
        editToken.setPhoneNumber(phoneNumber.trim());
        editToken.setLanguageCodes(String.join(",", languageCodes));
        editToken.setExpiresAt(LocalDateTime.now().plusDays(30));
        tokenRepository.save(editToken);
        
        // Generate edit link
        String editLink = frontendUrl + "/learning-module/learning-video/public-edit/" + token;
        
        // Select message based on first selected language
        String firstLanguage = languageCodes.get(0);
        String message = getEditRequestMessage(firstLanguage, video.getCode(), editLink, editToken.getExpiresAt().toLocalDate().toString());
        
        try {
            whatsAppService.sendMessage(phoneNumber.trim(), message);
            return new LearningVideoRequestEditResponse(true, token, "Edit request sent successfully");
        } catch (Exception e) {
            return new LearningVideoRequestEditResponse(false, token, "Failed to send WhatsApp message: " + e.getMessage());
        }
    }
    
    public Optional<LearningVideoGetResponse> getByToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return Optional.empty();
        }
        
        Optional<LearningVideoEditToken> tokenOpt = tokenRepository.findByTokenAndExpiresAtAfterAndUsedFalse(
            token.trim(), 
            LocalDateTime.now()
        );
        
        if (tokenOpt.isEmpty()) {
            return Optional.empty();
        }
        
        LearningVideoEditToken editToken = tokenOpt.get();
        Optional<LearningVideoTextBundle> videoOpt = repository.findById(editToken.getLearningVideoId());
        
        if (videoOpt.isEmpty()) {
            return Optional.empty();
        }
        
        return Optional.of(toResponse(videoOpt.get()));
    }
    
    public boolean updateByToken(String token, Map<String, String> translations) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }
        
        Optional<LearningVideoEditToken> tokenOpt = tokenRepository.findByTokenAndExpiresAtAfterAndUsedFalse(
            token.trim(), 
            LocalDateTime.now()
        );
        
        if (tokenOpt.isEmpty()) {
            return false;
        }
        
        LearningVideoEditToken editToken = tokenOpt.get();
        Optional<LearningVideoTextBundle> videoOpt = repository.findById(editToken.getLearningVideoId());
        
        if (videoOpt.isEmpty()) {
            return false;
        }
        
        LearningVideoTextBundle video = videoOpt.get();
        
        // Get allowed language codes
        String[] allowedLangs = editToken.getLanguageCodes().split(",");
        
        // Filter translations to only allowed languages and track changes
        Map<String, String> existingTranslations = parseTranslations(video.getTranslationsJson());
        Map<String, Map<String, String>> changesMap = new HashMap<>();
        
        for (String lang : allowedLangs) {
            String normalizedLang = normalizeLang(lang.trim());
            if (normalizedLang != null && translations.containsKey(normalizedLang)) {
                String newValue = translations.get(normalizedLang);
                String oldValue = existingTranslations.getOrDefault(normalizedLang, "");
                
                // Track changes only if value actually changed
                if (!oldValue.equals(newValue)) {
                    Map<String, String> change = new HashMap<>();
                    change.put("before", oldValue);
                    change.put("after", newValue);
                    changesMap.put(normalizedLang, change);
                }
                
                existingTranslations.put(normalizedLang, newValue);
            }
        }
        
        try {
            String newTranslationsJson = objectMapper.writeValueAsString(existingTranslations);
            video.setTranslationsJson(newTranslationsJson);
            repository.save(video);
            
            // Record edit history (public edit) with detailed changes
            String changesJson = objectMapper.writeValueAsString(changesMap);
            saveEditHistory(
                editToken.getLearningVideoId(), 
                "PUBLIC_EDIT", 
                null, 
                editToken.getPhoneNumber(), 
                changesJson
            );
            
            // Mark token as used
            editToken.setUsed(true);
            tokenRepository.save(editToken);
            
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    public List<String> getAllowedLanguagesByToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return List.of();
        }
        
        Optional<LearningVideoEditToken> tokenOpt = tokenRepository.findByToken(token.trim());
        if (tokenOpt.isEmpty()) {
            return List.of();
        }
        
        String languageCodes = tokenOpt.get().getLanguageCodes();
        if (languageCodes == null || languageCodes.trim().isEmpty()) {
            return List.of();
        }
        
        return List.of(languageCodes.split(","));
    }
    
    public List<LearningVideoEditHistory> getEditHistory(Long videoId) {
        if (videoId == null) {
            return List.of();
        }
        return historyRepository.findByLearningVideoIdOrderByEditedAtDesc(videoId);
    }
    
    private void saveEditHistory(Long videoId, String editType, String editedBy, String editedByPhone, String changes) {
        try {
            LearningVideoEditHistory history = new LearningVideoEditHistory();
            history.setLearningVideoId(videoId);
            history.setEditType(editType);
            history.setEditedBy(editedBy);
            history.setEditedByPhone(editedByPhone);
            history.setChanges(changes);
            historyRepository.save(history);
        } catch (Exception e) {
            // Log but don't fail the main operation
            System.err.println("Failed to save edit history: " + e.getMessage());
        }
    }
    
    private String generateEditToken(Long videoId) {
        try {
            String source = videoId + "-" + System.currentTimeMillis() + "-" + Math.random();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(source.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return java.util.UUID.randomUUID().toString().replace("-", "");
        }
    }
    
    private String getEditRequestMessage(String languageCode, String videoCode, String editLink, String expiryDate) {
        return switch (languageCode.toLowerCase()) {
            case "id" -> String.format(
                "Halo,\n\n" +
                "Anda diminta untuk melakukan perbaikan kosakata pada Learning Video:\n" +
                "Code: %s\n\n" +
                "Silakan klik link berikut untuk melakukan edit:\n%s\n\n" +
                "Link berlaku hingga: %s\n\n" +
                "Terima kasih.",
                videoCode, editLink, expiryDate
            );
            case "en" -> String.format(
                "Hello,\n\n" +
                "You are requested to edit the vocabulary in Learning Video:\n" +
                "Code: %s\n\n" +
                "Please click the following link to edit:\n%s\n\n" +
                "Link valid until: %s\n\n" +
                "Thank you.",
                videoCode, editLink, expiryDate
            );
            case "vi" -> String.format(
                "Xin chào,\n\n" +
                "Bạn được yêu cầu chỉnh sửa từ vựng trong Learning Video:\n" +
                "Mã: %s\n\n" +
                "Vui lòng nhấp vào liên kết sau để chỉnh sửa:\n%s\n\n" +
                "Liên kết có hiệu lực đến: %s\n\n" +
                "Cảm ơn bạn.",
                videoCode, editLink, expiryDate
            );
            case "th" -> String.format(
                "สวัสดี\n\n" +
                "คุณได้รับการร้องขอให้แก้ไขคำศัพท์ใน Learning Video:\n" +
                "รหัส: %s\n\n" +
                "กรุณาคลิกลิงก์ต่อไปนี้เพื่อแก้ไข:\n%s\n\n" +
                "ลิงก์มีผลถึง: %s\n\n" +
                "ขอบคุณค่ะ",
                videoCode, editLink, expiryDate
            );
            case "km" -> String.format(
                "សួស្តី\n\n" +
                "អ្នកត្រូវបានស្នើសុំឱ្យកែត្រូវវាក្យសព្ទក្នុង Learning Video:\n" +
                "លេខកូដ: %s\n\n" +
                "សូមចុចលើតំណខាងក្រោមដើម្បីកែត្រូវ:\n%s\n\n" +
                "តំណមានសុពលភាពដល់: %s\n\n" +
                "សូមអរគុណ។",
                videoCode, editLink, expiryDate
            );
            case "ja" -> String.format(
                "こんにちは、\n\n" +
                "Learning Videoの語彙を編集するよう依頼されました:\n" +
                "コード: %s\n\n" +
                "編集するには次のリンクをクリックしてください:\n%s\n\n" +
                "リンク有効期限: %s\n\n" +
                "ありがとうございます。",
                videoCode, editLink, expiryDate
            );
            case "zh" -> String.format(
                "您好，\n\n" +
                "您被要求編輯學習視頻中的詞彙：\n" +
                "代碼：%s\n\n" +
                "請點擊以下鏈接進行編輯：\n%s\n\n" +
                "鏈接有效期至：%s\n\n" +
                "謝謝。",
                videoCode, editLink, expiryDate
            );
            case "tl" -> String.format(
                "Kumusta,\n\n" +
                "Hinihiling ka na mag-edit ng bokabularyo sa Learning Video:\n" +
                "Code: %s\n\n" +
                "Mangyaring i-click ang sumusunod na link upang mag-edit:\n%s\n\n" +
                "Ang link ay valid hanggang: %s\n\n" +
                "Salamat.",
                videoCode, editLink, expiryDate
            );
            case "hi" -> String.format(
                "नमस्ते,\n\n" +
                "आपसे Learning Video में शब्दावली संपादित करने का अनुरोध किया गया है:\n" +
                "कोड: %s\n\n" +
                "संपादित करने के लिए कृपया निम्नलिखित लिंक पर क्लिक करें:\n%s\n\n" +
                "लिंक वैध है: %s तक\n\n" +
                "धन्यवाद।",
                videoCode, editLink, expiryDate
            );
            case "ko" -> String.format(
                "안녕하세요,\n\n" +
                "Learning Video의 어휘를 편집하도록 요청받았습니다:\n" +
                "코드: %s\n\n" +
                "편집하려면 다음 링크를 클릭하세요:\n%s\n\n" +
                "링크 유효 기간: %s\n\n" +
                "감사합니다.",
                videoCode, editLink, expiryDate
            );
            default -> String.format(
                "Hello,\n\n" +
                "You are requested to edit the vocabulary in Learning Video:\n" +
                "Code: %s\n\n" +
                "Please click the following link to edit:\n%s\n\n" +
                "Link valid until: %s\n\n" +
                "Thank you.",
                videoCode, editLink, expiryDate
            );
        };
    }
}
