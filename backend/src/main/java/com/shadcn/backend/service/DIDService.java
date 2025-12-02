package com.shadcn.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadcn.backend.dto.DIDPresenter;
import com.shadcn.backend.model.DIDAvatar;
import com.shadcn.backend.repository.DIDAvatarRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Duration;

@Service
public class DIDService {
    private static final Logger logger = LoggerFactory.getLogger(DIDService.class);
    
    // Retry configuration
    private static final int MAX_RETRIES = 3;
    private static final Duration RETRY_DELAY = Duration.ofSeconds(2);
    
    // Timeout configuration
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(60); // Video generation can take time
    
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final DIDAvatarRepository avatarRepository;
    private final Map<String, DIDPresenter> presenterCache = new ConcurrentHashMap<>();
    
    // Cache for presenter list with expiry
    private List<DIDPresenter> cachedPresenterList = null;
    private long cacheExpiry = 0;
    private static final long CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
    
    @Value("${did.api.token:bmRha3RhdTU1NTM4QGdtYWlsLmNvbQ:oLHQ0qx4fsii1d3z8ikQA}")
    private String apiToken;

    public DIDService(ObjectMapper objectMapper, DIDAvatarRepository avatarRepository) {
        this.objectMapper = objectMapper;
        this.avatarRepository = avatarRepository;
        this.webClient = WebClient.builder()
                .baseUrl("https://api.d-id.com")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024)) // 10MB buffer
                .build();
    }

    private String getAuthHeader() {
        return "Basic " + apiToken;
    }

    /**
     * Get list of available avatars - combines Express Avatars (Scenes) and custom Clips Presenters
     * Express Avatars are created in D-ID Studio and use /scenes/avatars endpoint
     * Custom Presenters are Premium+ avatars using /clips/presenters endpoint
     * Results are cached for 5 minutes to avoid repeated API calls
     * Also syncs with database for persistent storage
     */
    public List<DIDPresenter> getPresenters() {
        // Return cached list if still valid
        if (cachedPresenterList != null && System.currentTimeMillis() < cacheExpiry) {
            logger.info("Returning cached presenter list ({} items)", cachedPresenterList.size());
            return new ArrayList<>(cachedPresenterList);
        }
        
        List<DIDPresenter> allAvatars = new ArrayList<>();
        
        // 1. Fetch Express Avatars from /scenes/avatars (like AFAN)
        allAvatars.addAll(getExpressAvatars());
        
        // 2. Fetch custom Clips Presenters (non-public)
        allAvatars.addAll(getCustomClipsPresenters());
        
        // 3. Sync with database
        syncAvatarsToDatabase(allAvatars);
        
        // Cache the result
        cachedPresenterList = new ArrayList<>(allAvatars);
        cacheExpiry = System.currentTimeMillis() + CACHE_TTL_MS;
        
        logger.info("Fetched and cached {} total custom avatars (Express + Clips)", allAvatars.size());
        return allAvatars;
    }
    
    /**
     * Force refresh avatars from D-ID API and update database
     */
    public List<DIDPresenter> refreshPresenters() {
        // Clear cache to force refresh
        cachedPresenterList = null;
        cacheExpiry = 0;
        return getPresenters();
    }
    
    /**
     * Sync avatars from D-ID API to database
     */
    private void syncAvatarsToDatabase(List<DIDPresenter> avatars) {
        try {
            for (DIDPresenter presenter : avatars) {
                Optional<DIDAvatar> existing = avatarRepository.findByPresenterId(presenter.getPresenter_id());
                
                if (existing.isPresent()) {
                    // Update existing
                    DIDAvatar avatar = existing.get();
                    avatar.setPresenterName(presenter.getPresenter_name());
                    avatar.setAvatarType(presenter.getAvatar_type());
                    avatar.setThumbnailUrl(presenter.getThumbnail_url());
                    avatar.setPreviewUrl(presenter.getPreview_url());
                    avatar.setVoiceId(presenter.getVoice_id());
                    avatar.setGender(presenter.getGender());
                    avatar.setIsPremium(presenter.is_premium());
                    avatar.setIsActive(true);
                    avatarRepository.save(avatar);
                } else {
                    // Create new
                    DIDAvatar avatar = DIDAvatar.builder()
                            .presenterId(presenter.getPresenter_id())
                            .presenterName(presenter.getPresenter_name())
                            .avatarType(presenter.getAvatar_type())
                            .thumbnailUrl(presenter.getThumbnail_url())
                            .previewUrl(presenter.getPreview_url())
                            .voiceId(presenter.getVoice_id())
                            .gender(presenter.getGender())
                            .isPremium(presenter.is_premium())
                            .isActive(true)
                            .build();
                    avatarRepository.save(avatar);
                }
            }
            logger.info("Synced {} avatars to database", avatars.size());
        } catch (Exception e) {
            logger.error("Error syncing avatars to database: {}", e.getMessage());
        }
    }
    
    /**
     * Get avatars from database
     */
    public List<DIDPresenter> getAvatarsFromDatabase() {
        List<DIDPresenter> presenters = new ArrayList<>();
        try {
            List<DIDAvatar> avatars = avatarRepository.findByIsActiveTrue();
            for (DIDAvatar avatar : avatars) {
                DIDPresenter presenter = new DIDPresenter();
                presenter.setPresenter_id(avatar.getPresenterId());
                presenter.setPresenter_name(avatar.getPresenterName());
                presenter.setAvatar_type(avatar.getAvatarType());
                presenter.setThumbnail_url(avatar.getThumbnailUrl());
                presenter.setPreview_url(avatar.getPreviewUrl());
                presenter.setVoice_id(avatar.getVoiceId());
                presenter.setGender(avatar.getGender());
                presenter.set_premium(avatar.getIsPremium() != null && avatar.getIsPremium());
                presenters.add(presenter);
            }
            logger.info("Loaded {} avatars from database", presenters.size());
        } catch (Exception e) {
            logger.error("Error loading avatars from database: {}", e.getMessage());
        }
        return presenters;
    }
    
    /**
     * Check if avatar exists by name - first check database, then refresh from API if not found
     */
    public boolean avatarExistsByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return false;
        }
        
        String trimmedName = name.trim();
        
        // 1. Check database first
        if (avatarRepository.existsByPresenterNameTrimmedIgnoreCase(trimmedName)) {
            logger.info("Avatar '{}' found in database", trimmedName);
            return true;
        }
        
        // 2. Not found in database - refresh from D-ID API
        logger.info("Avatar '{}' not found in database, refreshing from D-ID API...", trimmedName);
        refreshPresenters();
        
        // 3. Check database again after refresh
        boolean exists = avatarRepository.existsByPresenterNameTrimmedIgnoreCase(trimmedName);
        logger.info("After refresh, avatar '{}' exists: {}", trimmedName, exists);
        return exists;
    }
    
    /**
     * Get avatar by name from database
     */
    public Optional<DIDAvatar> getAvatarByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return Optional.empty();
        }
        return avatarRepository.findByPresenterNameTrimmedIgnoreCase(name.trim());
    }
    
    /**
     * Get Express Avatars created in D-ID Studio
     * These are avatars like "AFAN" created via the Studio interface
     */
    private List<DIDPresenter> getExpressAvatars() {
        List<DIDPresenter> expressAvatars = new ArrayList<>();
        
        try {
            String response = webClient.get()
                    .uri("/scenes/avatars")
                    .header(HttpHeaders.AUTHORIZATION, getAuthHeader())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response != null) {
                JsonNode root = objectMapper.readTree(response);
                JsonNode avatarsNode = root.has("avatars") ? root.get("avatars") : root;
                
                // Handle if response is array directly or has "avatars" field
                if (avatarsNode.isArray()) {
                    for (JsonNode node : avatarsNode) {
                        String avatarId = node.has("id") ? node.get("id").asText() : "";
                        String status = node.has("status") ? node.get("status").asText() : "";
                        
                        // Only include avatars that are ready (status = done)
                        if (!avatarId.isEmpty() && "done".equals(status)) {
                            DIDPresenter presenter = new DIDPresenter();
                            presenter.setPresenter_id(avatarId);
                            presenter.setPresenter_name(node.has("name") ? node.get("name").asText() : "Express Avatar");
                            presenter.setGender("");
                            presenter.setThumbnail_url(node.has("thumbnail_url") ? node.get("thumbnail_url").asText() : "");
                            presenter.setPreview_url(node.has("talking_preview_url") ? node.get("talking_preview_url").asText() : "");
                            presenter.set_premium(false);
                            presenter.setAvatar_type("express"); // Mark as express avatar
                            presenter.setVoice_id(node.has("voice_id") ? node.get("voice_id").asText() : ""); // Cloned voice
                            
                            expressAvatars.add(presenter);
                            presenterCache.put(avatarId, presenter);
                            logger.debug("Added Express Avatar: {} ({})", presenter.getPresenter_name(), avatarId);
                        }
                    }
                }
                
                logger.info("Found {} Express Avatars from D-ID", expressAvatars.size());
            }
        } catch (Exception e) {
            logger.error("Error fetching Express Avatars from D-ID: {}", e.getMessage());
        }
        
        return expressAvatars;
    }
    
    /**
     * Get custom Clips Presenters (non-public Premium+ avatars)
     */
    private List<DIDPresenter> getCustomClipsPresenters() {
        List<DIDPresenter> customPresenters = new ArrayList<>();
        
        try {
            String response = webClient.get()
                    .uri("/clips/presenters")
                    .header(HttpHeaders.AUTHORIZATION, getAuthHeader())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response != null) {
                JsonNode root = objectMapper.readTree(response);
                JsonNode presentersNode = root.get("presenters");
                
                if (presentersNode != null && presentersNode.isArray()) {
                    for (JsonNode node : presentersNode) {
                        String presenterId = node.get("presenter_id").asText();
                        
                        // Filter: Only include custom presenters (non-public)
                        // Public presenters start with "v2_public_" (e.g., v2_public_Amber@0zSz8kflCN)
                        boolean isPublicPresenter = presenterId.startsWith("v2_public_") || 
                                                    presenterId.contains("_public_");
                        
                        // Skip public presenters - only show custom ones
                        if (isPublicPresenter) {
                            continue;
                        }
                        
                        DIDPresenter presenter = new DIDPresenter();
                        presenter.setPresenter_id(presenterId);
                        presenter.setPresenter_name(node.has("presenter_name") ? node.get("presenter_name").asText() : "Custom Presenter");
                        presenter.setGender(node.has("gender") ? node.get("gender").asText() : "");
                        presenter.setThumbnail_url(node.has("thumbnail_url") ? node.get("thumbnail_url").asText() : "");
                        presenter.setPreview_url(node.has("preview_url") ? node.get("preview_url").asText() : "");
                        presenter.set_premium(node.has("is_premium") && node.get("is_premium").asBoolean());
                        presenter.setAvatar_type("clips"); // Mark as clips presenter
                        
                        customPresenters.add(presenter);
                        presenterCache.put(presenterId, presenter);
                        logger.debug("Added custom Clips Presenter: {} ({})", presenter.getPresenter_name(), presenterId);
                    }
                }
                
                logger.info("Found {} custom Clips Presenters from D-ID", customPresenters.size());
            }
        } catch (Exception e) {
            logger.error("Error fetching Clips Presenters from D-ID: {}", e.getMessage());
        }
        
        return customPresenters;
    }

    /**
     * Validate if a presenter ID exists (works for both Express Avatars and Clips Presenters)
     */
    public boolean isValidPresenter(String presenterId) {
        if (presenterCache.containsKey(presenterId)) {
            return true;
        }
        // Try to fetch all presenters to validate
        getPresenters();
        fetchAllClipsPresentersForValidation();
        return presenterCache.containsKey(presenterId);
    }
    
    /**
     * Fetch all clips presenters (including public) for validation purposes only
     */
    private void fetchAllClipsPresentersForValidation() {
        try {
            String response = webClient.get()
                    .uri("/clips/presenters")
                    .header(HttpHeaders.AUTHORIZATION, getAuthHeader())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response != null) {
                JsonNode root = objectMapper.readTree(response);
                JsonNode presentersNode = root.get("presenters");
                
                if (presentersNode != null && presentersNode.isArray()) {
                    for (JsonNode node : presentersNode) {
                        String presenterId = node.get("presenter_id").asText();
                        if (!presenterCache.containsKey(presenterId)) {
                            DIDPresenter presenter = new DIDPresenter();
                            presenter.setPresenter_id(presenterId);
                            presenter.setPresenter_name(node.has("presenter_name") ? node.get("presenter_name").asText() : "");
                            presenter.setGender(node.has("gender") ? node.get("gender").asText() : "");
                            presenter.setThumbnail_url(node.has("thumbnail_url") ? node.get("thumbnail_url").asText() : "");
                            presenter.setPreview_url(node.has("preview_url") ? node.get("preview_url").asText() : "");
                            presenter.set_premium(node.has("is_premium") && node.get("is_premium").asBoolean());
                            presenter.setAvatar_type("clips");
                            presenterCache.put(presenterId, presenter);
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error fetching all presenters for validation: {}", e.getMessage());
        }
    }

    /**
     * Create a video using D-ID API
     * For Express Avatars (avt_*): uses /scenes endpoint
     * For Clips Presenters: uses /clips endpoint
     */
    public Map<String, Object> createClip(String avatarId, String script) {
        // Check if this is an Express Avatar (starts with "avt_")
        if (avatarId.startsWith("avt_")) {
            return createScene(avatarId, script);
        } else {
            return createClipsVideo(avatarId, script);
        }
    }
    
    /**
     * Create a Scene video for Express Avatars
     * Includes retry logic for transient failures
     */
    private Map<String, Object> createScene(String avatarId, String script) {
        Map<String, Object> result = new HashMap<>();
        
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                // First get the avatar to retrieve voice_id - check database first, then cache
                String voiceId = null;
                
                // 1. Try to get voice_id from database (most reliable)
                Optional<DIDAvatar> dbAvatar = avatarRepository.findByPresenterId(avatarId);
                if (dbAvatar.isPresent() && dbAvatar.get().getVoiceId() != null && !dbAvatar.get().getVoiceId().isEmpty()) {
                    voiceId = dbAvatar.get().getVoiceId();
                    logger.debug("Using voice_id '{}' from database for avatar '{}'", voiceId, avatarId);
                }
                
                // 2. Fallback to cache if not in database
                if (voiceId == null) {
                    DIDPresenter cachedAvatar = presenterCache.get(avatarId);
                    if (cachedAvatar != null && cachedAvatar.getVoice_id() != null && !cachedAvatar.getVoice_id().isEmpty()) {
                        voiceId = cachedAvatar.getVoice_id();
                        logger.debug("Using voice_id '{}' from cache for avatar '{}'", voiceId, avatarId);
                    }
                }
                
                // 3. If still no voice_id, try to refresh from API (only on first attempt)
                if (voiceId == null && attempt == 1) {
                    logger.info("No voice_id found for avatar '{}', refreshing from D-ID API...", avatarId);
                    refreshPresenters();
                    dbAvatar = avatarRepository.findByPresenterId(avatarId);
                    if (dbAvatar.isPresent() && dbAvatar.get().getVoiceId() != null && !dbAvatar.get().getVoiceId().isEmpty()) {
                        voiceId = dbAvatar.get().getVoiceId();
                        logger.info("After refresh, using voice_id '{}' for avatar '{}'", voiceId, avatarId);
                    }
                }
                
                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("avatar_id", avatarId);
                
                Map<String, Object> scriptObj = new HashMap<>();
                scriptObj.put("type", "text");
                scriptObj.put("input", script);
                
                // Use cloned voice if available
                if (voiceId != null && !voiceId.isEmpty()) {
                    Map<String, Object> provider = new HashMap<>();
                    provider.put("type", "elevenlabs");
                    provider.put("voice_id", voiceId);
                    scriptObj.put("provider", provider);
                    logger.debug("Creating scene with voice_id: {} for avatar: {}", voiceId, avatarId);
                } else {
                    logger.warn("No voice_id found for avatar '{}', video will use default D-ID voice", avatarId);
                }
                
                requestBody.put("script", scriptObj);

                String response = webClient.post()
                        .uri("/scenes")
                        .header(HttpHeaders.AUTHORIZATION, getAuthHeader())
                        .bodyValue(requestBody)
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(READ_TIMEOUT)
                        .block();

                if (response != null) {
                    JsonNode root = objectMapper.readTree(response);
                    result.put("success", true);
                    result.put("id", root.has("id") ? root.get("id").asText() : null);
                    result.put("status", root.has("status") ? root.get("status").asText() : "created");
                    result.put("type", "scene");
                    logger.info("Created D-ID scene: {} (attempt {})", result.get("id"), attempt);
                    return result;
                }
            } catch (Exception e) {
                logger.error("Error creating D-ID scene (attempt {}/{}): {}", attempt, MAX_RETRIES, e.getMessage());
                
                if (attempt < MAX_RETRIES) {
                    try {
                        Thread.sleep(RETRY_DELAY.toMillis() * attempt); // Exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                } else {
                    result.put("success", false);
                    result.put("error", e.getMessage());
                }
            }
        }
        
        return result;
    }
    
    /**
     * Create a Clips video for Premium+ Presenters
     * Includes retry logic for transient failures
     */
    private Map<String, Object> createClipsVideo(String presenterId, String script) {
        Map<String, Object> result = new HashMap<>();
        
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("presenter_id", presenterId);
                
                Map<String, String> scriptObj = new HashMap<>();
                scriptObj.put("type", "text");
                scriptObj.put("input", script);
                requestBody.put("script", scriptObj);

                String response = webClient.post()
                        .uri("/clips")
                        .header(HttpHeaders.AUTHORIZATION, getAuthHeader())
                        .bodyValue(requestBody)
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(READ_TIMEOUT)
                        .block();

                if (response != null) {
                    JsonNode root = objectMapper.readTree(response);
                    result.put("success", true);
                    result.put("id", root.has("id") ? root.get("id").asText() : null);
                    result.put("status", root.has("status") ? root.get("status").asText() : "created");
                    result.put("type", "clip");
                    logger.info("Created D-ID clip: {} (attempt {})", result.get("id"), attempt);
                    return result;
                }
            } catch (Exception e) {
                logger.error("Error creating D-ID clip (attempt {}/{}): {}", attempt, MAX_RETRIES, e.getMessage());
                
                if (attempt < MAX_RETRIES) {
                    try {
                        Thread.sleep(RETRY_DELAY.toMillis() * attempt); // Exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                } else {
                    result.put("success", false);
                    result.put("error", e.getMessage());
                }
            }
        }
        
        return result;
    }

    /**
     * Get video status and result URL from D-ID
     * Handles both scenes and clips
     */
    public Map<String, Object> getClipStatus(String videoId) {
        // Try scenes first if it looks like a scene ID
        if (videoId.startsWith("scn_")) {
            return getSceneStatus(videoId);
        }
        return getClipsStatus(videoId);
    }
    
    private Map<String, Object> getSceneStatus(String sceneId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String response = webClient.get()
                    .uri("/scenes/" + sceneId)
                    .header(HttpHeaders.AUTHORIZATION, getAuthHeader())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response != null) {
                JsonNode root = objectMapper.readTree(response);
                result.put("success", true);
                result.put("id", sceneId);
                result.put("status", root.has("status") ? root.get("status").asText() : "unknown");
                result.put("result_url", root.has("result_url") ? root.get("result_url").asText() : null);
                result.put("type", "scene");
                
                if (root.has("error")) {
                    result.put("error", root.get("error").asText());
                }
            }
        } catch (Exception e) {
            logger.error("Error getting D-ID scene status: {}", e.getMessage());
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
    
    private Map<String, Object> getClipsStatus(String clipId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            String response = webClient.get()
                    .uri("/clips/" + clipId)
                    .header(HttpHeaders.AUTHORIZATION, getAuthHeader())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response != null) {
                JsonNode root = objectMapper.readTree(response);
                result.put("success", true);
                result.put("id", clipId);
                result.put("status", root.has("status") ? root.get("status").asText() : "unknown");
                result.put("result_url", root.has("result_url") ? root.get("result_url").asText() : null);
                result.put("type", "clip");
                
                if (root.has("error")) {
                    result.put("error", root.get("error").asText());
                }
            }
        } catch (Exception e) {
            logger.error("Error getting D-ID clip status: {}", e.getMessage());
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }

    /**
     * Get presenter details by ID
     */
    public DIDPresenter getPresenterById(String presenterId) {
        if (presenterCache.isEmpty()) {
            getPresenters();
        }
        return presenterCache.get(presenterId);
    }
    
    /**
     * Get presenter by name (case-insensitive)
     * Returns the first matching presenter
     */
    public DIDPresenter getPresenterByName(String name) {
        if (presenterCache.isEmpty()) {
            getPresenters();
        }
        
        // Search by name (case-insensitive)
        for (DIDPresenter presenter : presenterCache.values()) {
            if (presenter.getPresenter_name() != null && 
                presenter.getPresenter_name().equalsIgnoreCase(name)) {
                return presenter;
            }
        }
        return null;
    }
    
    /**
     * Validate if a presenter exists by name
     */
    public boolean isValidPresenterByName(String name) {
        return getPresenterByName(name) != null;
    }
    
    /**
     * Get presenter ID from name (for video generation)
     */
    public String getPresenterIdByName(String name) {
        DIDPresenter presenter = getPresenterByName(name);
        return presenter != null ? presenter.getPresenter_id() : null;
    }
}
