package com.shadcn.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadcn.backend.dto.DIDPresenter;
import com.shadcn.backend.model.DIDAvatar;
import com.shadcn.backend.repository.DIDAvatarRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Duration;
import java.nio.charset.StandardCharsets;
import java.io.InputStream;
import java.util.Base64;
import java.util.stream.Collectors;

@Service
public class DIDService {
    private static final Logger logger = LoggerFactory.getLogger(DIDService.class);
    
    // Retry configuration
    private static final int MAX_RETRIES = 3;
    private static final Duration RETRY_DELAY = Duration.ofSeconds(2);
    
    // Timeout configuration
    private static final Duration READ_TIMEOUT = Duration.ofSeconds(60); // Video generation can take time
    
    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final DIDAvatarRepository avatarRepository;
    private final Map<String, DIDPresenter> presenterCache = new ConcurrentHashMap<>();

    @Value("${app.did.clips.webhook:}")
    private String clipsWebhookUrl;

    @Value("${app.did.scenes.webhook:}")
    private String scenesWebhookUrl;
    
    // Cache for presenter list with expiry
    private List<DIDPresenter> cachedPresenterList = null;
    private long cacheExpiry = 0;
    private static final long CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
    
    @Value("${did.api.token:}")
    private String apiToken;

    @Value("${did.presenter.id:}")
    private String forcedPresenterId;

    @Value("${did.fallback.presenter.id:}")
    private String fallbackPresenterId;

    private static final String CUSTOM_VOICE_PREFIX = "custom:";

    public DIDService(ObjectMapper objectMapper, DIDAvatarRepository avatarRepository) {
        this.objectMapper = objectMapper;
        this.avatarRepository = avatarRepository;
        this.webClient = WebClient.builder()
                .baseUrl("https://api.d-id.com")
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024)) // 10MB buffer
                .build();
    }

    private String postScene(Map<String, Object> requestBody) {
        return webClient.post()
                .uri("/scenes")
                .headers(h -> {
                    h.set(HttpHeaders.AUTHORIZATION, getAuthHeader());
                })
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(READ_TIMEOUT)
                .block();
    }

    private String getAuthHeader() {
        String token = apiToken == null ? "" : apiToken.trim();
        if (token.endsWith(".")) {
            token = token.substring(0, token.length() - 1).trim();
        }

        if (token.regionMatches(true, 0, "Basic ", 0, "Basic ".length())) {
            return token;
        }

        if (token.isBlank()) {
            throw new IllegalStateException("D-ID API token is not configured");
        }

        // D-ID uses HTTP Basic auth. Many accounts use API key as username with empty password.
        // Support both formats:
        // - "API_KEY" (we send as "API_KEY:")
        // - "API_USERNAME:API_PASSWORD"
        if (!token.contains(":")) {
            token = token + ":";
        }

        String basicToken = Base64.getEncoder().encodeToString(token.getBytes(StandardCharsets.UTF_8));
        return "Basic " + basicToken;
    }

    /**
     * Get list of available avatars - combines Express Avatars (Scenes) and custom Clips Presenters
     * Express Avatars are created in D-ID Studio and use /scenes/avatars endpoint
     * Custom Presenters are Premium+ avatars using /clips/presenters endpoint
     * Results are cached for 5 minutes to avoid repeated API calls
     * Also syncs with database for persistent storage
     */
    public List<DIDPresenter> getPresenters() {
        String forcedId = normalize(forcedPresenterId);
        if (forcedId != null) {
            DIDPresenter forcedPresenter = getPresenterByIdPreferDbThenApi(forcedId);
            if (forcedPresenter == null) {
                forcedPresenter = createPlaceholderPresenter(forcedId);
            }

            List<DIDPresenter> only = List.of(forcedPresenter);
            syncAvatarsToDatabase(only);

            cachedPresenterList = new ArrayList<>(only);
            cacheExpiry = System.currentTimeMillis() + CACHE_TTL_MS;
            presenterCache.put(forcedPresenter.getPresenter_id(), forcedPresenter);
            logger.info("Using forced D-ID presenter_id: {}", forcedId);
            return new ArrayList<>(only);
        }

        return fetchAndCacheCustomPresenters();
    }

    /**
     * Get list of available custom avatars for UI selection.
     * This ignores did.presenter.id so the UI can always see the real list from D-ID.
     */
    public List<DIDPresenter> getPresentersForListing() {
        return fetchAndCacheCustomPresenters();
    }

    public List<DIDPresenter> getPresentersForListing(boolean includeNotReadyExpress) {
        // Always fetch Express Avatars fresh so newly-created avatars show up immediately,
        // while still using cache for Clips presenters to avoid repeated large API calls.
        List<DIDPresenter> cached = fetchAndCacheCustomPresenters();

        Map<String, DIDPresenter> byId = new LinkedHashMap<>();

        for (DIDPresenter p : getExpressAvatars(includeNotReadyExpress)) {
            if (p == null) continue;
            String id = p.getPresenter_id();
            if (id == null || id.isBlank()) continue;
            byId.put(id, p);
        }

        if (cached != null && !cached.isEmpty()) {
            for (DIDPresenter p : cached) {
                if (p == null) continue;
                if ("express".equalsIgnoreCase(p.getAvatar_type())) continue;

                String id = p.getPresenter_id();
                if (id == null || id.isBlank()) continue;
                byId.putIfAbsent(id, p);
            }
        }

        return new ArrayList<>(byId.values());
    }

    public Map<String, Object> diagnosePresenterAccess() {
        Map<String, Object> out = new LinkedHashMap<>();

        Map<String, Object> scenes = new LinkedHashMap<>();
        try {
            String response = webClient.get()
                    .uri("/scenes/avatars")
                    .header(HttpHeaders.AUTHORIZATION, getAuthHeader())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(READ_TIMEOUT)
                    .block();

            int count = 0;
            List<Map<String, Object>> sample = new ArrayList<>();
            List<String> topLevelKeys = new ArrayList<>();
            if (response != null && !response.isBlank()) {
                JsonNode root = objectMapper.readTree(response);

                if (root != null && root.isObject()) {
                    root.fieldNames().forEachRemaining(topLevelKeys::add);
                }

                JsonNode avatarsArray = null;
                if (root != null) {
                    if (root.isArray()) {
                        avatarsArray = root;
                    } else if (root.has("avatars")) {
                        JsonNode avatars = root.get("avatars");
                        if (avatars != null && avatars.isArray()) {
                            avatarsArray = avatars;
                        } else if (avatars != null && avatars.isObject() && avatars.has("items") && avatars.get("items").isArray()) {
                            avatarsArray = avatars.get("items");
                        }
                    } else if (root.has("items") && root.get("items").isArray()) {
                        avatarsArray = root.get("items");
                    } else if (root.has("data") && root.get("data").isArray()) {
                        avatarsArray = root.get("data");
                    }
                }

                if (avatarsArray != null && avatarsArray.isArray()) {
                    count = avatarsArray.size();
                    for (int i = 0; i < Math.min(3, avatarsArray.size()); i++) {
                        JsonNode node = avatarsArray.get(i);
                        Map<String, Object> item = new LinkedHashMap<>();
                        item.put("id", node.has("id") ? node.get("id").asText() : "");
                        item.put("name", node.has("name") ? node.get("name").asText() : "");
                        item.put("status", node.has("status") ? node.get("status").asText() : "");
                        sample.add(item);
                    }
                }
            }

            scenes.put("ok", true);
            scenes.put("count", count);
            scenes.put("topLevelKeys", topLevelKeys);
            scenes.put("sample", sample);
        } catch (WebClientResponseException wce) {
            scenes.put("ok", false);
            scenes.put("status", wce.getStatusCode().value());
            scenes.put("body", truncate(wce.getResponseBodyAsString(), 1000));
        } catch (Exception e) {
            scenes.put("ok", false);
            scenes.put("error", truncate(String.valueOf(e.getMessage()), 300));
        }
        out.put("expressAvatars", scenes);

        Map<String, Object> clips = new LinkedHashMap<>();
        List<DIDPresenter> all = getClipsPresentersFromApi(true);
        List<DIDPresenter> custom = all.stream()
                .filter(p -> p != null && p.getPresenter_id() != null && !p.getPresenter_id().startsWith("v2_public_"))
                .collect(Collectors.toList());
        clips.put("ok", true);
        clips.put("total", all.size());
        clips.put("custom", custom.size());
        out.put("clipsPresenters", clips);

        return out;
    }

    private List<DIDPresenter> fetchAndCacheCustomPresenters() {
        // Return cached list if still valid
        if (cachedPresenterList != null && System.currentTimeMillis() < cacheExpiry) {
            // Do not keep serving an empty cache forever (e.g. transient D-ID outage)
            if (!cachedPresenterList.isEmpty()) {
                logger.info("Returning cached presenter list ({} items)", cachedPresenterList.size());
                return new ArrayList<>(cachedPresenterList);
            }
        }

        List<DIDPresenter> allAvatars = new ArrayList<>();

        // 1. Fetch Express Avatars from /scenes/avatars (custom avatars created in Studio)
        allAvatars.addAll(getExpressAvatars(true));

        // 2. Fetch Clips Presenters (include public library for UI listing)
        allAvatars.addAll(getClipsPresentersFromApi(true));

        // 3. Sync with database
        syncAvatarsToDatabase(allAvatars);

        // Cache the result
        cachedPresenterList = new ArrayList<>(allAvatars);
        cacheExpiry = System.currentTimeMillis() + (allAvatars.isEmpty() ? 30_000L : CACHE_TTL_MS);

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

    public List<DIDPresenter> getClipsPresentersFromApi(boolean includePublic) {
        try {
            String response = webClient.get()
                    .uri(uriBuilder -> uriBuilder.path("/clips/presenters")
                            .queryParam("limit", 1000)
                            .build())
                    .header(HttpHeaders.AUTHORIZATION, getAuthHeader())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(READ_TIMEOUT)
                    .block();

            if (response == null || response.isBlank()) {
                return List.of();
            }

            JsonNode root = objectMapper.readTree(response);
            JsonNode presentersNode = root.get("presenters");
            if (presentersNode == null || !presentersNode.isArray()) {
                return List.of();
            }

            List<DIDPresenter> presenters = new ArrayList<>();
            for (JsonNode node : presentersNode) {
                String presenterId = node.has("presenter_id") ? node.get("presenter_id").asText() : "";
                if (presenterId.isBlank()) {
                    continue;
                }

                DIDPresenter presenter = new DIDPresenter();
                presenter.setPresenter_id(presenterId);
                presenter.setPresenter_name(node.has("presenter_name")
                        ? node.get("presenter_name").asText()
                        : (node.has("name") ? node.get("name").asText() : "Presenter"));
                presenter.setGender(node.has("gender") ? node.get("gender").asText() : "");
                presenter.setThumbnail_url(node.has("thumbnail_url") ? node.get("thumbnail_url").asText() : "");
                presenter.setPreview_url(node.has("preview_url") ? node.get("preview_url").asText() : "");
                presenter.set_premium(node.has("is_premium") && node.get("is_premium").asBoolean());
                presenter.setAvatar_type("clips");

                String voiceId = null;
                String voiceType = null;
                if (node.has("voice") && node.get("voice").isObject() && node.get("voice").has("voice_id")) {
                    voiceId = node.get("voice").get("voice_id").asText();
                    if (node.get("voice").has("type")) {
                        voiceType = node.get("voice").get("type").asText();
                    }
                } else if (node.has("voice_id")) {
                    voiceId = node.get("voice_id").asText();
                }
                presenter.setVoice_id(voiceId == null ? "" : voiceId);
                presenter.setVoice_type(voiceType == null ? "" : voiceType);

                presenters.add(presenter);
            }

            if (!includePublic) {
                presenters = presenters.stream()
                        .filter(p -> p.getPresenter_id() != null && !p.getPresenter_id().startsWith("v2_public_"))
                        .collect(Collectors.toList());
            }

            return presenters;
        } catch (Exception e) {
            logger.error("Error fetching Clips Presenters from D-ID API: {}", e.getMessage());
            return List.of();
        }
    }
    
    /**
     * Sync avatars from D-ID API to database
     */
    private void syncAvatarsToDatabase(List<DIDPresenter> avatars) {
        try {
            for (DIDPresenter presenter : avatars) {
                if (presenter == null || presenter.getPresenter_id() == null || presenter.getPresenter_id().isBlank()) {
                    continue;
                }

                // Avoid syncing public clips presenters into DB (too many; they’re already available via API).
                if (presenter.getPresenter_id().startsWith("v2_public_")) {
                    continue;
                }

                Optional<DIDAvatar> existing = avatarRepository.findByPresenterId(presenter.getPresenter_id());
                
                if (existing.isPresent()) {
                    // Update existing
                    DIDAvatar avatar = existing.get();
                    avatar.setPresenterName(presenter.getPresenter_name());
                    avatar.setAvatarType(presenter.getAvatar_type());
                    avatar.setThumbnailUrl(presenter.getThumbnail_url());
                    avatar.setPreviewUrl(presenter.getPreview_url());
                        boolean keepCustomVoice = avatar.getVoiceType() != null
                            && avatar.getVoiceType().trim().toLowerCase(Locale.ROOT).startsWith(CUSTOM_VOICE_PREFIX)
                            && avatar.getVoiceId() != null
                            && !avatar.getVoiceId().trim().isBlank();
                    if (!keepCustomVoice) {
                        String incomingVoiceId = presenter.getVoice_id();
                        if (incomingVoiceId != null && !incomingVoiceId.isBlank()) {
                            avatar.setVoiceId(incomingVoiceId);
                            avatar.setVoiceType(presenter.getVoice_type());
                        }
                    }
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
                            .voiceType(presenter.getVoice_type())
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

    public Optional<String> ensureClonedVoiceIdFromLocalSample(String presenterId, String avatarName) {
        if (presenterId == null || presenterId.isBlank() || avatarName == null || avatarName.isBlank()) {
            return Optional.empty();
        }

        String pid = presenterId.trim();
        Optional<DIDAvatar> existing = avatarRepository.findByPresenterId(pid);
        if (existing.isEmpty()) {
            // Best-effort: refresh/sync so we have a DB row to store the cloned voice_id
            try {
                refreshPresenters();
            } catch (Exception ignored) {
                // ignore
            }
            existing = avatarRepository.findByPresenterId(pid);
            if (existing.isEmpty()) {
                return Optional.empty();
            }
        }

        DIDAvatar avatar = existing.get();
        if (avatar.getVoiceId() != null && !avatar.getVoiceId().trim().isBlank()
            && avatar.getVoiceType() != null
            && avatar.getVoiceType().trim().toLowerCase(Locale.ROOT).startsWith(CUSTOM_VOICE_PREFIX)) {
            return Optional.of(avatar.getVoiceId().trim());
        }

        Optional<ByteArrayResource> sample = loadAvatarSampleFromClasspath(pid, avatarName.trim());
        if (sample.isEmpty()) {
            return Optional.empty();
        }

        Optional<VoiceInfo> created = createClonedVoice(sample.get(), avatarName.trim());
        Optional<String> voiceId = created.map(v -> v.voiceId);
        created.ifPresent(v -> {
            avatar.setVoiceId(v.voiceId);
            String type = v.voiceType;
            if (type == null || type.isBlank()) {
                type = "d-id";
            }
            avatar.setVoiceType(CUSTOM_VOICE_PREFIX + normalizeVoiceType(type));
            avatarRepository.save(avatar);
        });
        return voiceId;
    }

    private Optional<ByteArrayResource> loadAvatarSampleFromClasspath(String presenterId, String avatarName) {
        List<String> keys = new ArrayList<>();

        if (avatarName != null && !avatarName.isBlank()) {
            String n1 = avatarName;
            String n2 = avatarName.toLowerCase(Locale.ROOT);
            String n3 = avatarName.trim().replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
            keys.add(n1);
            if (!n2.equals(n1)) keys.add(n2);
            if (!n3.equals(n2)) keys.add(n3);
        }

        if (presenterId != null && !presenterId.isBlank()) {
            String p1 = presenterId.trim();
            String p2 = p1.toLowerCase(Locale.ROOT);
            keys.add(p1);
            if (!p2.equals(p1)) keys.add(p2);
        }

        List<String> candidates = new ArrayList<>();
        for (String key : keys) {
            if (key == null || key.isBlank()) {
                continue;
            }
            String base = "audio/" + key;
            candidates.add(base + ".mp4");
            candidates.add(base + ".m4a");
            candidates.add(base + ".mp3");
            candidates.add(base + ".wav");
        }

        for (String path : candidates) {
            try {
                ClassPathResource res = new ClassPathResource(path);
                if (!res.exists()) {
                    continue;
                }
                try (InputStream in = res.getInputStream()) {
                    byte[] bytes = in.readAllBytes();
                    String filename = res.getFilename() == null
                            ? ((avatarName == null || avatarName.isBlank() ? "sample" : avatarName) + ".mp4")
                            : res.getFilename();
                    ByteArrayResource bar = new ByteArrayResource(bytes) {
                        @Override
                        public String getFilename() {
                            return filename;
                        }
                    };
                    return Optional.of(bar);
                }
            } catch (Exception ignored) {
                // try next
            }
        }
        return Optional.empty();
    }

    private Optional<VoiceInfo> createClonedVoice(ByteArrayResource file, String name) {
        try {
            MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
            form.add("name", name);
            form.add("file", file);

            String response = webClient.post()
                    .uri("/tts/voices")
                    .header(HttpHeaders.AUTHORIZATION, getAuthHeader())
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(BodyInserters.fromMultipartData(form))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(READ_TIMEOUT)
                    .block();

            if (response == null || response.isBlank()) {
                return Optional.empty();
            }

            JsonNode root = objectMapper.readTree(response);
            String id = null;
            if (root.hasNonNull("id") && !root.get("id").asText().isBlank()) {
                id = root.get("id").asText();
            } else if (root.hasNonNull("voice_id") && !root.get("voice_id").asText().isBlank()) {
                id = root.get("voice_id").asText();
            }

            if (id == null || id.isBlank()) {
                return Optional.empty();
            }

            String type = root.hasNonNull("type") ? root.get("type").asText() : null;
            if (type == null || type.isBlank()) {
                type = "d-id";
            }
            return Optional.of(new VoiceInfo(id, type));
        } catch (WebClientResponseException wce) {
            logger.warn(
                    "D-ID create cloned voice failed: status={} body={}",
                    wce.getStatusCode().value(),
                    truncate(wce.getResponseBodyAsString(), 1500)
            );
            return Optional.empty();
        } catch (Exception e) {
            logger.warn("D-ID create cloned voice failed: {}", truncate(e.getMessage(), 300));
            return Optional.empty();
        }
    }

    private static final class VoiceInfo {
        private final String voiceId;
        private final String voiceType;

        private VoiceInfo(String voiceId, String voiceType) {
            this.voiceId = voiceId;
            this.voiceType = voiceType;
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
                presenter.setVoice_type(avatar.getVoiceType());
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
        
        String forcedId = normalize(forcedPresenterId);
        String trimmedName = name.trim();

        if (forcedId != null) {
            if (forcedId.equalsIgnoreCase(trimmedName)) {
                return true;
            }

            Optional<DIDAvatar> forced = avatarRepository.findByPresenterId(forcedId);
            if (forced.isEmpty()) {
                getPresenters();
                forced = avatarRepository.findByPresenterId(forcedId);
            }

            return forced.isPresent()
                    && forced.get().getPresenterName() != null
                    && forced.get().getPresenterName().trim().equalsIgnoreCase(trimmedName);
        }
        
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
     * Get avatar by presenter_id
     */
    public Optional<DIDAvatar> getAvatarById(String presenterId) {
        if (presenterId == null || presenterId.trim().isEmpty()) {
            return Optional.empty();
        }
        return avatarRepository.findByPresenterId(presenterId.trim());
    }
    
    /**
     * Get avatar by name from database
     */
    public Optional<DIDAvatar> getAvatarByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return Optional.empty();
        }

        String forcedId = normalize(forcedPresenterId);
        String trimmedName = name.trim();

        if (forcedId != null) {
            if (forcedId.equalsIgnoreCase(trimmedName)) {
                Optional<DIDAvatar> byId = avatarRepository.findByPresenterId(forcedId);
                if (byId.isEmpty()) {
                    getPresenters();
                    byId = avatarRepository.findByPresenterId(forcedId);
                }
                return byId;
            }

            Optional<DIDAvatar> forced = avatarRepository.findByPresenterId(forcedId);
            if (forced.isEmpty()) {
                getPresenters();
                forced = avatarRepository.findByPresenterId(forcedId);
            }
            if (forced.isPresent() && forced.get().getPresenterName() != null
                    && forced.get().getPresenterName().trim().equalsIgnoreCase(trimmedName)) {
                return forced;
            }
            return Optional.empty();
        }
        return avatarRepository.findByPresenterNameTrimmedIgnoreCase(name.trim());
    }
    
    /**
     * Get Express Avatars created in D-ID Studio
     * These are avatars like "AFAN" created via the Studio interface
     */
    private List<DIDPresenter> getExpressAvatars(boolean includeNotReady) {
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

                JsonNode avatarsArray = null;
                if (root != null) {
                    if (root.isArray()) {
                        avatarsArray = root;
                    } else if (root.has("avatars")) {
                        JsonNode avatars = root.get("avatars");
                        if (avatars != null && avatars.isArray()) {
                            avatarsArray = avatars;
                        } else if (avatars != null && avatars.isObject() && avatars.has("items") && avatars.get("items").isArray()) {
                            avatarsArray = avatars.get("items");
                        }
                    } else if (root.has("items") && root.get("items").isArray()) {
                        avatarsArray = root.get("items");
                    } else if (root.has("data") && root.get("data").isArray()) {
                        avatarsArray = root.get("data");
                    }
                }

                if (avatarsArray != null && avatarsArray.isArray()) {
                    for (JsonNode node : avatarsArray) {
                        String avatarId = node.has("id") ? node.get("id").asText() : "";
                        String status = node.has("status") ? node.get("status").asText() : "";

                        boolean include = !avatarId.isEmpty() && (includeNotReady || "done".equalsIgnoreCase(status));
                        if (!include) {
                            continue;
                        }

                        DIDPresenter presenter = new DIDPresenter();
                        presenter.setPresenter_id(avatarId);
                        presenter.setPresenter_name(node.has("name") ? node.get("name").asText() : "Express Avatar");
                        presenter.setGender("");
                        presenter.setThumbnail_url(node.has("thumbnail_url") ? node.get("thumbnail_url").asText() : "");
                        if (node.has("talking_preview_url")) {
                            presenter.setPreview_url(node.get("talking_preview_url").asText());
                        } else if (node.has("preview_url")) {
                            presenter.setPreview_url(node.get("preview_url").asText());
                        } else {
                            presenter.setPreview_url("");
                        }
                        presenter.set_premium(false);
                        presenter.setAvatar_type("express");
                        presenter.setVoice_id(node.has("voice_id") ? node.get("voice_id").asText() : "");

                        expressAvatars.add(presenter);
                        presenterCache.put(avatarId, presenter);
                        logger.debug("Added Express Avatar: {} ({}) status={}", presenter.getPresenter_name(), avatarId, status);
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
     * Validate if a presenter ID exists (works for both Express Avatars and Clips Presenters)
     */
    public boolean isValidPresenter(String presenterId) {
        String forcedId = normalize(forcedPresenterId);
        if (forcedId != null) {
            return presenterId != null && !presenterId.isBlank() && forcedId.equalsIgnoreCase(presenterId.trim());
        }
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
        if (normalize(forcedPresenterId) != null) {
            return;
        }
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
                                presenter.setPresenter_name(node.has("presenter_name")
                                    ? node.get("presenter_name").asText()
                                    : (node.has("name") ? node.get("name").asText() : ""));
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
        return createClip(avatarId, script, null, null);
    }

    public Map<String, Object> createClip(String avatarId, String script, String backgroundUrl) {
        return createClip(avatarId, script, backgroundUrl, null);
    }

    public Map<String, Object> createClip(String avatarId, String script, String backgroundUrl, String audioUrl) {
        if (avatarId == null || avatarId.trim().isEmpty()) {
            throw new RuntimeException("Avatar ID is required");
        }

        String trimmedAvatarId = avatarId.trim();

        // Voice policy: prefer local-sample cloned voice when available; otherwise use presenter default voice.
        // Do not use audio_url.
        audioUrl = null;

        // Best-effort: prefer deterministic local-sample cloned voices when available (e.g. audio/linda.*)
        ensureLocalSampleVoiceIfAvailable(trimmedAvatarId);

        // If explicitly targeting an Express Avatar, never fall back to another avatar.
        if (trimmedAvatarId.startsWith("avt_")) {
            return createScene(trimmedAvatarId, script, backgroundUrl, audioUrl);
        }

        Optional<DIDAvatar> dbAvatar = avatarRepository.findByPresenterId(trimmedAvatarId);
        if (dbAvatar.isPresent() && "express".equalsIgnoreCase(dbAvatar.get().getAvatarType())) {
            return createScene(trimmedAvatarId, script, backgroundUrl, audioUrl);
        }

        DIDPresenter cached = presenterCache.get(trimmedAvatarId);
        if (cached != null && "express".equalsIgnoreCase(cached.getAvatar_type())) {
            return createScene(trimmedAvatarId, script, backgroundUrl, audioUrl);
        }

        Map<String, Object> clips = createClipsVideo(trimmedAvatarId, script, backgroundUrl, audioUrl);
        if (Boolean.TRUE.equals(clips.get("success"))) {
            return clips;
        }

        String err = clips.get("error") == null ? "" : clips.get("error").toString();
        String errLower = err.toLowerCase(Locale.ROOT);

        if (!errLower.isBlank() && (errLower.contains("avatar not found") || errLower.contains("notfounderror"))) {
            DIDPresenter express = fetchExpressAvatarById(trimmedAvatarId);
            if (express != null) {
                presenterCache.put(trimmedAvatarId, express);
                logger.warn("Clips presenter_id not found. Using Express Avatar via Scenes for avatar_id={}", trimmedAvatarId);
                Map<String, Object> scene = createScene(trimmedAvatarId, script, backgroundUrl, audioUrl);
                if (Boolean.TRUE.equals(scene.get("success"))) {
                    return scene;
                }
                logger.warn("Scenes creation failed after presenter_id not found. Falling back to Clips public presenter.");
            }

            String fallback = resolveFallbackClipsPresenterId();
            if (fallback != null && !fallback.equalsIgnoreCase(trimmedAvatarId)) {
                logger.warn("Clips presenter_id not found ({}). Falling back to presenter_id={}", truncate(err, 300), fallback);
                return createClipsVideo(fallback, script, backgroundUrl, audioUrl);
            }
        }

        if (!err.isBlank() && (err.contains("UnknownError") || err.startsWith("500") || err.contains(" 500 ") || err.contains("500 Internal Server Error"))) {
            logger.warn("Clips creation failed ({}). Falling back to Scenes for avatar_id={}", truncate(err, 500), trimmedAvatarId);
            Map<String, Object> scene = createSceneWithClipsFallback(trimmedAvatarId, script, backgroundUrl, audioUrl);
            if (Boolean.TRUE.equals(scene.get("success"))) {
                return scene;
            }
            return scene;
        }

        return clips;
    }

    private void ensureLocalSampleVoiceIfAvailable(String presenterId) {
        if (presenterId == null || presenterId.isBlank()) {
            return;
        }

        String pid = presenterId.trim();

        try {
            String name = null;

            Optional<DIDAvatar> db = avatarRepository.findByPresenterId(pid);
            if (db.isPresent()) {
                name = db.get().getPresenterName();
            }

            if (name == null || name.isBlank()) {
                DIDPresenter cached = presenterCache.get(pid);
                if (cached != null) {
                    name = cached.getPresenter_name();
                }
            }

            if (name == null || name.isBlank()) {
                DIDPresenter fetched = pid.startsWith("avt_") ? fetchExpressAvatarById(pid) : fetchClipsPresenterById(pid);
                if (fetched != null) {
                    name = fetched.getPresenter_name();
                    presenterCache.put(pid, fetched);
                }
            }

            if (name == null || name.isBlank()) {
                return;
            }

            ensureClonedVoiceIdFromLocalSample(pid, name.trim());
        } catch (Exception ignored) {
            // best-effort only
        }
    }

    private Map<String, Object> resolveProviderForPresenter(String presenterId) {
        if (presenterId == null || presenterId.isBlank()) {
            return null;
        }

        String pid = presenterId.trim();
        try {
            Optional<DIDAvatar> db = avatarRepository.findByPresenterId(pid);
            if (db.isPresent()) {
                DIDAvatar a = db.get();
                String rawType = a.getVoiceType();
                String rawId = a.getVoiceId();

                if (rawType != null
                        && rawType.trim().toLowerCase(Locale.ROOT).startsWith(CUSTOM_VOICE_PREFIX)
                        && rawId != null
                        && !rawId.trim().isBlank()) {
                    String providerType = rawType.trim().substring(CUSTOM_VOICE_PREFIX.length()).trim();
                    if (providerType.isBlank()) {
                        return null;
                    }
                    Map<String, Object> provider = new HashMap<>();
                    provider.put("type", providerType);
                    provider.put("voice_id", rawId.trim());
                    return provider;
                }
            }
        } catch (Exception ignore) {
            // ignore
        }
        return null;
    }

    private String normalizeSsmlBreakTagsForAmazon(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }

        try {
            java.util.regex.Pattern p = java.util.regex.Pattern.compile("(?is)<\\s*break\\b([^>]*)/\\s*>");
            java.util.regex.Matcher m = p.matcher(input);
            StringBuffer sb = new StringBuffer();
            while (m.find()) {
                String attrs = m.group(1);
                long ms = parseSsmlBreakTimeMs(attrs);
                double seconds = Math.max(0d, ms / 1000d);
                if (seconds > 10.0d) {
                    seconds = 10.0d;
                }
                if (seconds <= 0d) {
                    seconds = 0.1d;
                }

                String formatted;
                if (Math.abs(seconds - Math.rint(seconds)) < 0.0001d) {
                    formatted = String.valueOf((int) Math.rint(seconds));
                } else {
                    formatted = String.format(java.util.Locale.ROOT, "%.1f", seconds);
                }

                String repl = "<break time=\"" + formatted + "s\"/>";
                m.appendReplacement(sb, java.util.regex.Matcher.quoteReplacement(repl));
            }
            m.appendTail(sb);
            return sb.toString();
        } catch (Exception ignore) {
            return input;
        }
    }

    public Optional<DIDAvatar> getExpressAvatarByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return Optional.empty();
        }

        String trimmed = name.trim();
        Optional<DIDAvatar> db = avatarRepository.findExpressByPresenterNameTrimmedIgnoreCase(trimmed);
        if (db.isPresent()) {
            return db;
        }

        // Refresh from D-ID API then re-check
        getPresentersForListing(true);
        return avatarRepository.findExpressByPresenterNameTrimmedIgnoreCase(trimmed);
    }

    public Optional<DIDAvatar> getExpressAvatarById(String presenterId) {
        if (presenterId == null || presenterId.trim().isEmpty()) {
            return Optional.empty();
        }

        String trimmed = presenterId.trim();
        Optional<DIDAvatar> db = avatarRepository.findExpressByPresenterId(trimmed);
        if (db.isPresent()) {
            return db;
        }

        // Refresh from D-ID API then re-check
        getPresentersForListing(true);
        return avatarRepository.findExpressByPresenterId(trimmed);
    }

    private String normalizePresenterNameForMatch(String name) {
        if (name == null) {
            return "";
        }
        return name.trim().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
    }

    /**
     * Resolve avatar input (name or avt_* id) to an Express Avatar presenter_id.
     * Returns null if not found.
     */
    public String resolveExpressPresenterId(String avatarValue) {
        if (avatarValue == null || avatarValue.trim().isEmpty()) {
            return null;
        }

        String trimmed = avatarValue.trim();
        if (trimmed.startsWith("avt_")) {
            try {
                DIDPresenter byId = fetchExpressAvatarById(trimmed);
                if (byId != null) {
                    return trimmed;
                }
            } catch (Exception ignored) {
                // fall through
            }
            return getExpressAvatarById(trimmed).map(DIDAvatar::getPresenterId).orElse(null);
        }

        String target = normalizePresenterNameForMatch(trimmed);
        try {
            List<DIDPresenter> express = getExpressAvatars(true);
            if (express != null) {
                for (DIDPresenter p : express) {
                    if (p == null || p.getPresenter_id() == null || p.getPresenter_id().isBlank()) {
                        continue;
                    }
                    if (target.equals(normalizePresenterNameForMatch(p.getPresenter_name()))) {
                        return p.getPresenter_id();
                    }
                }
            }
        } catch (Exception ignored) {
            // fall back
        }

        return getExpressAvatarByName(trimmed).map(DIDAvatar::getPresenterId).orElse(null);
    }

    private Map<String, Object> createSceneWithClipsFallback(String avatarId, String script, String backgroundUrl) {
        return createSceneWithClipsFallback(avatarId, script, backgroundUrl, null);
    }

    private Map<String, Object> createSceneWithClipsFallback(String avatarId, String script, String backgroundUrl, String audioUrl) {
        Map<String, Object> scene = createScene(avatarId, script, backgroundUrl, audioUrl);
        if (Boolean.TRUE.equals(scene.get("success"))) {
            return scene;
        }

        Object errObj = scene.get("error");
        String err = errObj == null ? "" : errObj.toString();
        String errLower = err.toLowerCase(Locale.ROOT);
        if (errLower.contains("avatar not found") || errLower.contains("notfounderror")) {
            String fallback = resolveFallbackClipsPresenterId();
            if (fallback != null && !fallback.equalsIgnoreCase(avatarId)) {
                logger.warn("Scenes avatar_id not found ({}). Falling back to presenter_id={}", truncate(err, 300), fallback);
                return createClipsVideo(fallback, script, backgroundUrl, audioUrl);
            }
        }

        return scene;
    }

    private String resolveFallbackClipsPresenterId() {
        String configured = normalize(fallbackPresenterId);
        if (configured != null) {
            return configured;
        }

        try {
            List<DIDPresenter> presenters = getClipsPresentersFromApi(true);
            if (presenters == null || presenters.isEmpty()) {
                return null;
            }

            for (DIDPresenter p : presenters) {
                if (p != null && p.getPresenter_id() != null && p.getPresenter_id().startsWith("v2_public_")) {
                    return p.getPresenter_id();
                }
            }

            DIDPresenter first = presenters.get(0);
            return first == null ? null : normalize(first.getPresenter_id());
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * Create a Scene video for Express Avatars
     * Includes retry logic for transient failures
     */
    private Map<String, Object> createScene(String avatarId, String script, String backgroundUrl) {
        return createScene(avatarId, script, backgroundUrl, null);
    }

    private Map<String, Object> createScene(String avatarId, String script, String backgroundUrl, String audioUrl) {
        Map<String, Object> result = new HashMap<>();
        
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                // First get the avatar to retrieve voice_id - check database first, then cache
                String voiceId = null;
                String voiceType = null;
                
                // 1. Try to get voice_id from database (most reliable)
                Optional<DIDAvatar> dbAvatar = avatarRepository.findByPresenterId(avatarId);
                if (dbAvatar.isPresent() && dbAvatar.get().getVoiceId() != null && !dbAvatar.get().getVoiceId().isEmpty()) {
                    voiceId = dbAvatar.get().getVoiceId();
                    voiceType = dbAvatar.get().getVoiceType();
                    logger.debug("Using voice_id '{}' from database for avatar '{}'", voiceId, avatarId);
                }
                
                // 2. Fallback to cache if not in database
                if (voiceId == null) {
                    DIDPresenter cachedAvatar = presenterCache.get(avatarId);
                    if (cachedAvatar != null && cachedAvatar.getVoice_id() != null && !cachedAvatar.getVoice_id().isEmpty()) {
                        voiceId = cachedAvatar.getVoice_id();
                        voiceType = cachedAvatar.getVoice_type();
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
                        voiceType = dbAvatar.get().getVoiceType();
                        logger.info("After refresh, using voice_id '{}' for avatar '{}'", voiceId, avatarId);
                    }
                }

                // 4. If still missing voice_id, fetch the specific Express Avatar details (list endpoints may omit voice_id)
                if (voiceId == null || voiceId.isEmpty()) {
                    String fetchedVoice = fetchExpressAvatarVoiceIdById(avatarId);
                    if (fetchedVoice != null && !fetchedVoice.isEmpty()) {
                        voiceId = fetchedVoice;
                        logger.info("Fetched voice_id '{}' from /scenes/avatars/{}", voiceId, avatarId);
                    }
                }
                
                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("avatar_id", avatarId);

                if (scenesWebhookUrl != null && !scenesWebhookUrl.isBlank()) {
                    requestBody.put("webhook", scenesWebhookUrl.trim());
                }
                
                Map<String, Object> scriptObj = new HashMap<>();
                boolean usingAudio = false;
                if (usingAudio) {
                    scriptObj.put("type", "audio");
                    scriptObj.put("audio_url", audioUrl);
                } else {
                    scriptObj.put("type", "text");
                    boolean containsBreak = script != null && script.contains("<break");
                    boolean canUseSsml = containsBreak;
                    String scriptInput = script;
                    if (containsBreak && canUseSsml) {
                        scriptInput = normalizeSsmlBreakTagsForAmazon(script);
                    }
                    scriptObj.put("input", scriptInput);
                    if (canUseSsml) {
                        scriptObj.put("ssml", true);
                    }
                }
                
                // Use cloned custom voice when available (text scripts only).
                if (!usingAudio) {
                    Map<String, Object> provider = resolveProviderForPresenter(avatarId);
                    if (provider != null) {
                        scriptObj.put("provider", provider);
                    }
                }
                
                requestBody.put("script", scriptObj);

                if (backgroundUrl != null && !backgroundUrl.isBlank()) {
                    Map<String, Object> background = new HashMap<>();
                    background.put("source_url", backgroundUrl);
                    requestBody.put("background", background);
                }

                String response;
                try {
                    response = postScene(requestBody);
                } catch (WebClientResponseException wce) {
                    if (backgroundUrl != null && !backgroundUrl.isBlank() && wce.getStatusCode().is4xxClientError()) {
                        logger.warn("Scenes background rejected (status={}). Retrying without background.", wce.getStatusCode().value());
                        requestBody.remove("background");
                        response = postScene(requestBody);
                    } else if (audioUrl != null && !audioUrl.isBlank() && wce.getStatusCode().is4xxClientError()) {
                        logger.warn("Scenes audio rejected (status={}). Retrying with text script.", wce.getStatusCode().value());
                        Map<String, Object> textScript = new HashMap<>();
                        textScript.put("type", "text");
                        boolean containsBreak = script != null && script.contains("<break");
                        boolean canUseSsml = containsBreak;
                        String scriptInput = script;
                        if (containsBreak && canUseSsml) {
                            scriptInput = normalizeSsmlBreakTagsForAmazon(script);
                        }
                        textScript.put("input", scriptInput);
                        if (canUseSsml) {
                            textScript.put("ssml", true);
                        }
                        Map<String, Object> provider = resolveProviderForPresenter(avatarId);
                        if (provider != null) {
                            textScript.put("provider", provider);
                        }
                        requestBody.put("script", textScript);
                        response = postScene(requestBody);
                    } else if (!usingAudio && script != null && script.contains("<break") && wce.getStatusCode().is4xxClientError()) {
                        logger.warn("Scenes SSML rejected (status={}). Retrying without SSML breaks.", wce.getStatusCode().value());
                        Map<String, Object> fallbackTextScript = new HashMap<>();
                        fallbackTextScript.put("type", "text");
                        fallbackTextScript.put("input", convertSsmlBreakTagsToPunctuation(script));

                        Map<String, Object> provider = resolveProviderForPresenter(avatarId);
                        if (provider != null) {
                            fallbackTextScript.put("provider", provider);
                        }

                        requestBody.put("script", fallbackTextScript);
                        response = postScene(requestBody);
                    } else {
                        throw wce;
                    }
                }

                if (response != null) {
                    JsonNode root = objectMapper.readTree(response);
                    result.put("success", true);
                    result.put("id", root.has("id") ? root.get("id").asText() : null);
                    result.put("status", root.has("status") ? root.get("status").asText() : "created");
                    result.put("type", "scene");
                    logger.info("Created D-ID scene: {} (attempt {})", result.get("id"), attempt);
                    return result;
                }
            } catch (WebClientResponseException wce) {
                String body = truncate(wce.getResponseBodyAsString(), 4000);
                logger.error(
                    "Error creating D-ID scene (attempt {}/{}): status={} body={}",
                    attempt, MAX_RETRIES, wce.getStatusCode().value(), body
                );

                if (attempt < MAX_RETRIES) {
                    try {
                        Thread.sleep(RETRY_DELAY.toMillis() * attempt); // Exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        result.put("success", false);
                        result.put("error", "Interrupted while waiting to retry D-ID scene");
                        return result;
                    }
                } else {
                    result.put("success", false);
                    result.put("error", wce.getStatusCode().value() + " " + wce.getStatusText() + ": " + body);
                }
            } catch (Exception e) {
                logger.error("Error creating D-ID scene (attempt {}/{}): {}", attempt, MAX_RETRIES, e.getMessage());
                
                if (attempt < MAX_RETRIES) {
                    try {
                        Thread.sleep(RETRY_DELAY.toMillis() * attempt); // Exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        result.put("success", false);
                        result.put("error", "Interrupted while waiting to retry D-ID scene");
                        return result;
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
    private Map<String, Object> createClipsVideo(String presenterId, String script, String backgroundUrl) {
        return createClipsVideo(presenterId, script, backgroundUrl, null);
    }

    private Map<String, Object> createClipsVideo(String presenterId, String script, String backgroundUrl, String audioUrl) {
        Map<String, Object> result = new HashMap<>();
        
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("presenter_id", presenterId);

                if (clipsWebhookUrl != null && !clipsWebhookUrl.isBlank()) {
                    requestBody.put("webhook", clipsWebhookUrl.trim());
                }
                
                Map<String, Object> scriptObj = new HashMap<>();
                boolean usingAudio = false;
                Map<String, Object> provider = usingAudio ? null : resolveClipsVoiceProvider(presenterId);
                if (usingAudio) {
                    scriptObj.put("type", "audio");
                    scriptObj.put("audio_url", audioUrl);
                } else {
                    scriptObj.put("type", "text");
                    boolean containsBreak = script != null && script.contains("<break");
                    boolean canUseSsml = containsBreak;
                    String scriptInput = script;
                    if (containsBreak && !canUseSsml) {
                        scriptInput = convertSsmlBreakTagsToPunctuation(script);
                    } else if (containsBreak && canUseSsml) {
                        scriptInput = normalizeSsmlBreakTagsForAmazon(script);
                    }
                    scriptObj.put("input", scriptInput);
                    if (canUseSsml) {
                        scriptObj.put("ssml", true);
                    }
                }

                if (backgroundUrl != null && !backgroundUrl.isBlank()) {
                    Map<String, Object> background = new HashMap<>();
                    background.put("source_url", backgroundUrl);
                    requestBody.put("background", background);
                }

                Map<String, Object> requestBodyWithProvider = new HashMap<>(requestBody);
                Map<String, Object> scriptWithProvider = new HashMap<>(scriptObj);
                if (provider != null) {
                    scriptWithProvider.put("provider", provider);
                    logger.debug(
                            "Creating clip with provider type={} voice_id={} for presenter: {}",
                            provider.get("type"),
                            provider.get("voice_id"),
                            presenterId
                    );
                }
                requestBodyWithProvider.put("script", scriptWithProvider);

                Map<String, Object> requestBodyWithoutProvider = new HashMap<>(requestBody);
                requestBodyWithoutProvider.put("script", new HashMap<>(scriptObj));

                String response;
                try {
                    response = postClip(requestBodyWithProvider);
                } catch (WebClientResponseException wce) {
                    if (backgroundUrl != null && !backgroundUrl.isBlank() && wce.getStatusCode().is4xxClientError()) {
                        logger.warn("Clips background rejected (status={}). Retrying without background.", wce.getStatusCode().value());
                        requestBodyWithProvider.remove("background");
                        requestBodyWithoutProvider.remove("background");
                        response = provider != null ? postClip(requestBodyWithProvider) : postClip(requestBodyWithoutProvider);
                    } else
                    if (audioUrl != null && !audioUrl.isBlank() && wce.getStatusCode().is4xxClientError()) {
                        logger.warn("Clips audio rejected (status={}). Retrying with text script.", wce.getStatusCode().value());
                        Map<String, Object> textScriptObj = new HashMap<>();
                        textScriptObj.put("type", "text");
                        Map<String, Object> fallbackProvider = resolveClipsVoiceProvider(presenterId);
                        boolean containsBreak = script != null && script.contains("<break");
                        boolean canUseSsml = containsBreak;
                        String scriptInput = script;
                        if (containsBreak && !canUseSsml) {
                            scriptInput = convertSsmlBreakTagsToPunctuation(script);
                        } else if (containsBreak && canUseSsml) {
                            scriptInput = normalizeSsmlBreakTagsForAmazon(script);
                        }
                        textScriptObj.put("input", scriptInput);
                        if (canUseSsml) {
                            textScriptObj.put("ssml", true);
                        }

                        Map<String, Object> textBody = new HashMap<>(requestBody);
                        Map<String, Object> textBodyNoProvider = new HashMap<>(requestBody);

                        Map<String, Object> textScriptWithProvider = new HashMap<>(textScriptObj);
                        if (fallbackProvider != null) {
                            textScriptWithProvider.put("provider", fallbackProvider);
                        }

                        textBody.put("script", textScriptWithProvider);
                        textBodyNoProvider.put("script", textScriptObj);

                        response = fallbackProvider != null ? postClip(textBody) : postClip(textBodyNoProvider);
                    } else
                    if (!usingAudio && script != null && script.contains("<break") && wce.getStatusCode().is4xxClientError()) {
                        logger.warn("Clips SSML rejected (status={}). Retrying without SSML breaks.", wce.getStatusCode().value());

                        Map<String, Object> fallbackTextScript = new HashMap<>(scriptObj);
                        fallbackTextScript.put("type", "text");
                        fallbackTextScript.put("input", convertSsmlBreakTagsToPunctuation(script));
                        fallbackTextScript.remove("ssml");

                        Map<String, Object> bodyWithProvider = new HashMap<>(requestBody);
                        Map<String, Object> bodyWithoutProvider = new HashMap<>(requestBody);

                        Map<String, Object> s1 = new HashMap<>(fallbackTextScript);
                        Map<String, Object> s2 = new HashMap<>(fallbackTextScript);
                        if (provider != null) {
                            s1.put("provider", provider);
                        }

                        bodyWithProvider.put("script", s1);
                        bodyWithoutProvider.put("script", s2);

                        response = provider != null ? postClip(bodyWithProvider) : postClip(bodyWithoutProvider);
                    } else
                    if (provider != null && wce.getStatusCode().is5xxServerError()) {
                        logger.warn(
                                "D-ID clip creation 5xx with provider for presenter {}. Retrying without provider.",
                                presenterId
                        );
                        response = postClip(requestBodyWithoutProvider);
                    } else {
                        throw wce;
                    }
                }

                if (response != null) {
                    JsonNode root = objectMapper.readTree(response);
                    result.put("success", true);
                    result.put("id", root.has("id") ? root.get("id").asText() : null);
                    result.put("status", root.has("status") ? root.get("status").asText() : "created");
                    result.put("type", "clip");
                    logger.info("Created D-ID clip: {} (attempt {})", result.get("id"), attempt);
                    return result;
                }
            } catch (WebClientResponseException wce) {
                String body = truncate(wce.getResponseBodyAsString(), 4000);
                logger.error(
                    "Error creating D-ID clip (attempt {}/{}): status={} body={}",
                    attempt, MAX_RETRIES, wce.getStatusCode().value(), body
                );

                if (attempt < MAX_RETRIES) {
                    try {
                        Thread.sleep(RETRY_DELAY.toMillis() * attempt); // Exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        result.put("success", false);
                        result.put("error", "Interrupted while waiting to retry D-ID clip");
                        return result;
                    }
                } else {
                    result.put("success", false);
                    result.put("error", wce.getStatusCode().value() + " " + wce.getStatusText() + ": " + body);
                }
            } catch (Exception e) {
                logger.error("Error creating D-ID clip (attempt {}/{}): {}", attempt, MAX_RETRIES, e.getMessage());
                
                if (attempt < MAX_RETRIES) {
                    try {
                        Thread.sleep(RETRY_DELAY.toMillis() * attempt); // Exponential backoff
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        result.put("success", false);
                        result.put("error", "Interrupted while waiting to retry D-ID clip");
                        return result;
                    }
                } else {
                    result.put("success", false);
                    result.put("error", e.getMessage());
                }
            }
        }
        
        return result;
    }

    public Optional<String> uploadAudio(byte[] bytes, String filename) {
        if (bytes == null || bytes.length == 0) {
            return Optional.empty();
        }

        String safeFilename = filename == null || filename.isBlank()
                ? ("tts-" + System.currentTimeMillis() + ".mp3")
                : filename.trim().replaceAll("[^a-zA-Z0-9._-]", "_");

        try {
            MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
            ByteArrayResource audio = new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return safeFilename;
                }
            };
            form.add("audio", audio);
            form.add("filename", safeFilename.length() > 50 ? safeFilename.substring(0, 50) : safeFilename);

            String response = webClient.post()
                    .uri("/audios")
                    .header(HttpHeaders.AUTHORIZATION, getAuthHeader())
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(BodyInserters.fromMultipartData(form))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(READ_TIMEOUT)
                    .block();

            if (response == null || response.isBlank()) {
                return Optional.empty();
            }

            String url = extractUploadedAudioUrl(response);
            return url == null || url.isBlank() ? Optional.empty() : Optional.of(url);
        } catch (WebClientResponseException wce) {
            logger.warn(
                    "D-ID audio upload failed: status={} body={}",
                    wce.getStatusCode().value(),
                    truncate(wce.getResponseBodyAsString(), 1000)
            );
            return Optional.empty();
        } catch (Exception e) {
            logger.warn("D-ID audio upload failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private String extractUploadedAudioUrl(String response) {
        String trimmed = response == null ? "" : response.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        try {
            JsonNode root = objectMapper.readTree(trimmed);
            String[] keys = new String[] {"url", "audio_url", "audioUrl", "result_url"};
            for (String k : keys) {
                if (root.has(k) && !root.get(k).isNull()) {
                    String v = root.get(k).asText();
                    if (v != null && !v.isBlank()) {
                        return v;
                    }
                }
            }

            if (root.has("data") && root.get("data").isObject()) {
                JsonNode data = root.get("data");
                for (String k : keys) {
                    if (data.has(k) && !data.get(k).isNull()) {
                        String v = data.get(k).asText();
                        if (v != null && !v.isBlank()) {
                            return v;
                        }
                    }
                }
            }
        } catch (Exception ignore) {
            // Not JSON
        }

        // Some APIs may return plain URL
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("s3://")) {
            return trimmed;
        }

        return null;
    }

    private String postClip(Map<String, Object> requestBody) {
        return webClient.post()
                .uri("/clips")
                .headers(h -> {
                    h.set(HttpHeaders.AUTHORIZATION, getAuthHeader());
                })
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(READ_TIMEOUT)
                .block();
    }

    private Map<String, Object> resolveClipsVoiceProvider(String presenterId) {
        if (presenterId == null || presenterId.isBlank()) {
            return null;
        }
        return resolveProviderForPresenter(presenterId);
    }

    private String normalizeVoiceType(String raw) {
        if (raw == null || raw.isBlank()) {
            return "d-id";
        }
        String v = raw.trim();
        if (v.toLowerCase(Locale.ROOT).startsWith(CUSTOM_VOICE_PREFIX)) {
            String inner = v.substring(CUSTOM_VOICE_PREFIX.length()).trim();
            return inner.isBlank() ? "d-id" : inner;
        }
        return v;
    }

    private String stripSsmlBreakTags(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }
        try {
            return input.replaceAll("(?is)<\\s*break\\b[^>]*/\\s*>", " ").replaceAll("\\s+", " ").trim();
        } catch (Exception ignore) {
            return input;
        }
    }

    private String convertSsmlBreakTagsToPunctuation(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }

        try {
            java.util.regex.Pattern p = java.util.regex.Pattern.compile("(?is)<\\s*break\\b([^>]*)/\\s*>");
            java.util.regex.Matcher m = p.matcher(input);
            StringBuffer sb = new StringBuffer();
            while (m.find()) {
                String attrs = m.group(1);
                long ms = parseSsmlBreakTimeMs(attrs);
                String repl;
                if (ms >= 800) {
                    repl = ". ";
                } else if (ms >= 350) {
                    repl = ", ";
                } else {
                    repl = " ";
                }
                m.appendReplacement(sb, java.util.regex.Matcher.quoteReplacement(repl));
            }
            m.appendTail(sb);
            return sb.toString().replaceAll("\\s+", " ").trim();
        } catch (Exception ignore) {
            return stripSsmlBreakTags(input);
        }
    }

    private long parseSsmlBreakTimeMs(String attrs) {
        if (attrs == null || attrs.isBlank()) {
            return 250;
        }

        try {
            java.util.regex.Pattern p = java.util.regex.Pattern.compile("(?is)\\btime\\s*=\\s*['\"]([^'\"]+)['\"]");
            java.util.regex.Matcher m = p.matcher(attrs);
            if (!m.find()) {
                return 250;
            }

            String raw = m.group(1);
            if (raw == null) {
                return 250;
            }
            String v = raw.trim().toLowerCase(Locale.ROOT);
            if (v.isEmpty()) {
                return 250;
            }

            if (v.endsWith("ms")) {
                String n = v.substring(0, v.length() - 2).trim();
                return (long) Math.max(0, Double.parseDouble(n));
            }
            if (v.endsWith("s")) {
                String n = v.substring(0, v.length() - 1).trim();
                return (long) Math.max(0, Double.parseDouble(n) * 1000d);
            }

            return (long) Math.max(0, Double.parseDouble(v));
        } catch (Exception ignore) {
            return 250;
        }
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
                result.put("result_url", extractResultUrl(root));
                result.put("pending_url", root.has("pending_url") ? root.get("pending_url").asText() : null);
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
                result.put("result_url", extractResultUrl(root));
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

    private String extractResultUrl(JsonNode root) {
        if (root == null) return null;

        String[] directKeys = new String[] { "result_url", "resultUrl", "url", "video_url" };
        for (String k : directKeys) {
            if (root.has(k) && !root.get(k).isNull()) {
                String v = root.get(k).asText();
                if (v != null && !v.isBlank()) return v;
            }
        }

        JsonNode result = root.get("result");
        if (result != null && result.isObject()) {
            String[] nestedKeys = new String[] { "result_url", "url", "video_url", "mp4_url" };
            for (String k : nestedKeys) {
                if (result.has(k) && !result.get(k).isNull()) {
                    String v = result.get(k).asText();
                    if (v != null && !v.isBlank()) return v;
                }
            }
        }

        return null;
    }

    /**
     * Get presenter details by ID
     */
    public DIDPresenter getPresenterById(String presenterId) {
        String forcedId = normalize(forcedPresenterId);
        if (forcedId != null) {
            return presenterCache.get(forcedId);
        }
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
        String forcedId = normalize(forcedPresenterId);
        if (forcedId != null) {
            return getPresenterByIdPreferDbThenApi(forcedId);
        }
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
        String forcedId = normalize(forcedPresenterId);
        if (forcedId != null) {
            return forcedId;
        }
        DIDPresenter presenter = getPresenterByName(name);
        return presenter != null ? presenter.getPresenter_id() : null;
    }

    private DIDPresenter getPresenterByIdPreferDbThenApi(String presenterId) {
        if (presenterId == null || presenterId.isBlank()) {
            return null;
        }

        DIDPresenter cached = presenterCache.get(presenterId);
        if (cached != null) {
            return cached;
        }

        Optional<DIDAvatar> db = avatarRepository.findByPresenterId(presenterId);
        if (db.isPresent()) {
            DIDAvatar a = db.get();
            DIDPresenter presenter = new DIDPresenter();
            presenter.setPresenter_id(a.getPresenterId());
            presenter.setPresenter_name(a.getPresenterName());
            presenter.setAvatar_type(a.getAvatarType());
            presenter.setThumbnail_url(a.getThumbnailUrl());
            presenter.setPreview_url(a.getPreviewUrl());
            presenter.setVoice_id(a.getVoiceId());
            presenter.setVoice_type(a.getVoiceType());
            presenter.setGender(a.getGender());
            presenter.set_premium(a.getIsPremium() != null && a.getIsPremium());
            presenterCache.put(presenterId, presenter);
            return presenter;
        }

        DIDPresenter fetched;
        if (presenterId.startsWith("avt_")) {
            fetched = fetchExpressAvatarById(presenterId);
            if (fetched == null) {
                fetched = fetchClipsPresenterById(presenterId);
            }
        } else {
            fetched = fetchClipsPresenterById(presenterId);
            if (fetched == null) {
                fetched = fetchExpressAvatarById(presenterId);
            }
        }

        if (fetched != null) {
            presenterCache.put(presenterId, fetched);
        }
        return fetched;
    }

    private DIDPresenter fetchClipsPresenterById(String presenterId) {
        try {
            String response = webClient.get()
                    .uri("/clips/presenters/{id}", presenterId)
                    .header(HttpHeaders.AUTHORIZATION, getAuthHeader())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response == null) {
                return null;
            }

            JsonNode root = objectMapper.readTree(response);

            JsonNode node = root;
            if (root.has("presenters") && root.get("presenters").isArray() && !root.get("presenters").isEmpty()) {
                node = root.get("presenters").get(0);
            }

            String id = node.has("presenter_id") ? node.get("presenter_id").asText() : "";
            if (id.isBlank()) {
                return null;
            }

            DIDPresenter presenter = new DIDPresenter();
            presenter.setPresenter_id(id);
            presenter.setPresenter_name(node.has("presenter_name")
                    ? node.get("presenter_name").asText()
                    : (node.has("name") ? node.get("name").asText() : "Presenter"));
            presenter.setGender(node.has("gender") ? node.get("gender").asText() : "");
            presenter.setThumbnail_url(node.has("thumbnail_url") ? node.get("thumbnail_url").asText() : "");
            presenter.setPreview_url(node.has("preview_url") ? node.get("preview_url").asText() : "");
            presenter.set_premium(node.has("is_premium") && node.get("is_premium").asBoolean());
            presenter.setAvatar_type("clips");

            String voiceId = null;
            String voiceType = null;
            if (node.has("voice") && node.get("voice").isObject() && node.get("voice").has("voice_id")) {
                voiceId = node.get("voice").get("voice_id").asText();
                if (node.get("voice").has("type")) {
                    voiceType = node.get("voice").get("type").asText();
                }
            } else if (node.has("voice_id")) {
                voiceId = node.get("voice_id").asText();
            }
            presenter.setVoice_id(voiceId == null ? "" : voiceId);
            presenter.setVoice_type(voiceType == null ? "" : voiceType);
            return presenter;
        } catch (WebClientResponseException wce) {
            if (wce.getStatusCode().value() == 404) {
                return null;
            }
            logger.error(
                    "Error fetching Clips Presenter by id (status={}): {}",
                    wce.getStatusCode().value(),
                    truncate(wce.getResponseBodyAsString(), 2000)
            );
        } catch (Exception e) {
            logger.error("Error fetching Clips Presenter by id: {}", e.getMessage());
        }

        return null;
    }

    private DIDPresenter fetchExpressAvatarById(String avatarId) {
        try {
            String response = webClient.get()
                    .uri("/scenes/avatars/{id}", avatarId)
                    .header(HttpHeaders.AUTHORIZATION, getAuthHeader())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(READ_TIMEOUT)
                    .block();

            if (response == null || response.isBlank()) {
                return null;
            }

            JsonNode root = objectMapper.readTree(response);
            String id = root.has("id") ? root.get("id").asText() : "";
            if (id.isBlank()) {
                return null;
            }

            DIDPresenter presenter = new DIDPresenter();
            presenter.setPresenter_id(id);
            presenter.setPresenter_name(root.has("name") ? root.get("name").asText() : "Express Avatar");
            presenter.setGender("");
            presenter.setThumbnail_url(root.has("thumbnail_url") ? root.get("thumbnail_url").asText() : "");
            presenter.setPreview_url(root.has("talking_preview_url") ? root.get("talking_preview_url").asText() : "");
            presenter.set_premium(false);
            presenter.setAvatar_type("express");
            presenter.setVoice_id(root.has("voice_id") ? root.get("voice_id").asText() : "");
            return presenter;
        } catch (WebClientResponseException wce) {
            if (wce.getStatusCode().value() == 404) {
                return null;
            }
            logger.warn(
                    "Error fetching Express Avatar by id (status={}): {}",
                    wce.getStatusCode().value(),
                    truncate(wce.getResponseBodyAsString(), 800)
            );
        } catch (Exception e) {
            logger.error("Error fetching Express Avatar by id: {}", e.getMessage());
        }

        return null;
    }

    private String fetchExpressAvatarVoiceIdById(String avatarId) {
        try {
            String response = webClient.get()
                    .uri("/scenes/avatars/{id}", avatarId)
                    .header(HttpHeaders.AUTHORIZATION, getAuthHeader())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(READ_TIMEOUT)
                    .block();

            if (response == null || response.isBlank()) {
                return null;
            }

            JsonNode root = objectMapper.readTree(response);
            String voiceId = root.has("voice_id") ? root.get("voice_id").asText() : null;
            if (voiceId == null || voiceId.isBlank()) {
                return null;
            }

            try {
                Optional<DIDAvatar> existing = avatarRepository.findByPresenterId(avatarId);
                if (existing.isPresent()) {
                    DIDAvatar a = existing.get();
                    a.setVoiceId(voiceId);
                    if (a.getAvatarType() == null || a.getAvatarType().isBlank()) {
                        a.setAvatarType("express");
                    }
                    a.setIsActive(true);
                    avatarRepository.save(a);
                }
            } catch (Exception ignore) {
                // Best-effort DB sync
            }

            return voiceId;
        } catch (WebClientResponseException wce) {
            if (wce.getStatusCode().value() == 404) {
                return null;
            }
            logger.warn(
                    "Failed to fetch Express Avatar details (status={}): {}",
                    wce.getStatusCode().value(),
                    truncate(wce.getResponseBodyAsString(), 500)
            );
        } catch (Exception e) {
            logger.warn("Failed to fetch Express Avatar details: {}", truncate(e.getMessage(), 300));
        }

        return null;
    }

    private DIDPresenter createPlaceholderPresenter(String presenterId) {
        DIDPresenter presenter = new DIDPresenter();
        presenter.setPresenter_id(presenterId);
        presenter.setPresenter_name("Custom Presenter");
        presenter.setAvatar_type(presenterId != null && presenterId.startsWith("avt_") ? "express" : "clips");
        presenter.setGender("");
        presenter.setThumbnail_url("");
        presenter.setPreview_url("");
        presenter.set_premium(false);
        presenter.setVoice_id("");
        return presenter;
    }

    private String normalize(String raw) {
        if (raw == null) return null;
        String v = raw.trim();
        return v.isEmpty() ? null : v;
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        if (max <= 0) return "";
        if (s.length() <= max) return s;
        return s.substring(0, max);
    }
}
