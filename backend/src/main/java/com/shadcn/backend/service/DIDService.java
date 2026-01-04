package com.shadcn.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadcn.backend.dto.DIDPresenter;
import com.shadcn.backend.model.AvatarAudio;
import com.shadcn.backend.model.ConsentAudio;
import com.shadcn.backend.model.DIDAvatar;
import com.shadcn.backend.repository.AvatarAudioRepository;
import com.shadcn.backend.repository.ConsentAudioRepository;
import com.shadcn.backend.repository.DIDAvatarRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
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
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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
    private final AvatarAudioRepository avatarAudioRepository;
    private final ConsentAudioRepository consentAudioRepository;
    private final Map<String, DIDPresenter> presenterCache = new ConcurrentHashMap<>();

    private final Map<String, String> clonedVoiceIdCache = new ConcurrentHashMap<>();
    private final Set<String> clonedVoiceNoSample = ConcurrentHashMap.newKeySet();

    private final Map<String, String> voiceCloneLastErrorByPresenterId = new ConcurrentHashMap<>();

    private final Map<String, Object> voiceCloneLocks = new ConcurrentHashMap<>();

    @Value("${app.did.clips.webhook:}")
    private String clipsWebhookUrl;

    @Value("${app.did.scenes.webhook:}")
    private String scenesWebhookUrl;

    private boolean isHttpsUrl(String url) {
        if (url == null) return false;
        String v = url.trim();
        return !v.isEmpty() && v.regionMatches(true, 0, "https://", 0, "https://".length());
    }

    private boolean isBackgroundRelatedError(WebClientResponseException wce) {
        if (wce == null) return false;
        try {
            String body = wce.getResponseBodyAsString();
            if (body == null) return false;
            String lower = body.toLowerCase(java.util.Locale.ROOT);
            return lower.contains("setting background")
                || lower.contains("failed during setting background")
                || lower.contains("background");
        } catch (Exception ignore) {
            return false;
        }
    }
    
    // Cache for presenter list with expiry
    private List<DIDPresenter> cachedPresenterList = null;
    private long cacheExpiry = 0;
    private static final long CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    // Cache for Express Avatars (Scenes) to avoid /scenes/avatars per-row/per-item calls
    private volatile List<DIDPresenter> cachedExpressAvatarsAll = null;
    private volatile List<DIDPresenter> cachedExpressAvatarsDone = null;
    private volatile long expressCacheExpiry = 0;
    private final Map<String, String> expressIdByNormalizedName = new ConcurrentHashMap<>();
    private final Set<String> expressIds = ConcurrentHashMap.newKeySet();
    
    @Value("${did.api.token:}")
    private String apiToken;

    @Value("${did.presenter.id:}")
    private String forcedPresenterId;

    @Value("${did.fallback.presenter.id:}")
    private String fallbackPresenterId;

    @Value("${did.tts.clone.language:english}")
    private String cloneVoiceLanguage;

    @Value("${did.tts.strict-audio-management:true}")
    private boolean strictAudioManagementVoice;

    @Value("${did.tts.strict-audio-management.fail-on-clone-error:false}")
    private boolean failOnCloneError;

    @Value("${did.tts.strict-audio-management.enforce-consistent-voice:true}")
    private boolean enforceConsistentAudioManagementVoice;

    @Value("${did.tts.amazon.voice-id.female:Joanna}")
    private String amazonVoiceIdFemale;

    @Value("${did.tts.amazon.voice-id.male:Matthew}")
    private String amazonVoiceIdMale;

    @Value("${did.tts.clone.skip-on-validation-error-minutes:1440}")
    private long cloneSkipOnValidationErrorMinutes;

    @Value("${did.tts.clone.skip-on-transient-error-minutes:5}")
    private long cloneSkipOnTransientErrorMinutes;

    private final Map<String, Long> voiceCloneSkipUntilMsByPresenterId = new ConcurrentHashMap<>();

    private static final String CUSTOM_VOICE_PREFIX = "custom:";

    private boolean hasAudioManagementSampleForPresenter(String presenterId) {
        if (presenterId == null || presenterId.isBlank()) {
            return false;
        }

        String pid = presenterId.trim();
        String name = null;

        try {
            Optional<DIDAvatar> db = avatarRepository.findByPresenterId(pid);
            if (db.isPresent()) {
                name = db.get().getPresenterName();
            }
        } catch (Exception ignored) {
            // ignore
        }

        if (name == null || name.isBlank()) {
            try {
                DIDPresenter cached = presenterCache.get(pid);
                if (cached != null) {
                    name = cached.getPresenter_name();
                }
            } catch (Exception ignored) {
                // ignore
            }
        }

        try {
            return findAudioManagementEntry(pid, name).isPresent();
        } catch (Exception ignored) {
            return false;
        }
    }

    public DIDService(ObjectMapper objectMapper, DIDAvatarRepository avatarRepository, AvatarAudioRepository avatarAudioRepository, ConsentAudioRepository consentAudioRepository) {
        this.objectMapper = objectMapper;
        this.avatarRepository = avatarRepository;
        this.avatarAudioRepository = avatarAudioRepository;
        this.consentAudioRepository = consentAudioRepository;
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

    private boolean providerSupportsSsmlFlag(String providerType) {
        if (providerType == null || providerType.isBlank()) {
            return false;
        }
        String t = providerType.trim().toLowerCase(java.util.Locale.ROOT);
        return t.equals("microsoft") || t.equals("elevenlabs");
    }

    private RuntimeException strictVoiceSetupRequired(String presenterId, String details) {
        String pid = presenterId == null ? "" : presenterId.trim();
        String suffix = (details == null || details.isBlank()) ? "" : (" (" + details.trim() + ")");
        return new RuntimeException(
                "Audio-management voice cloning is required but not ready for presenterId=" + pid
                        + ". Upload/refresh consent audio that matches the current consent text, then retry." + suffix
        );
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

    public Map<String, Object> createConsent(Map<String, Object> body) {
        try {
            Map<String, Object> requestBody = new LinkedHashMap<>();
            if (body != null && !body.isEmpty()) {
                requestBody.putAll(body);
            }

            // D-ID consents API requires language.
            if (!requestBody.containsKey("language") || requestBody.get("language") == null
                    || String.valueOf(requestBody.get("language")).trim().isBlank()) {
                String lang = cloneVoiceLanguage == null ? "" : cloneVoiceLanguage.trim();
                if (lang.isBlank()) {
                    lang = "english";
                }
                requestBody.put("language", lang);
            }

            String response = webClient.post()
                    .uri("/consents")
                    .header(HttpHeaders.AUTHORIZATION, getAuthHeader())
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(READ_TIMEOUT)
                    .block();

            Map<String, Object> out = new LinkedHashMap<>();
            if (response == null || response.isBlank()) {
                out.put("ok", false);
                out.put("error", "Empty response");
                return out;
            }

            JsonNode root = objectMapper.readTree(response);
            out.put("ok", true);
            out.put("raw", objectMapper.convertValue(root, Map.class));
            String consentText = extractConsentText(root);
            if (consentText != null && !consentText.isBlank()) {
                out.put("consentText", consentText);
            }
            return out;
        } catch (WebClientResponseException wce) {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("ok", false);
            out.put("status", wce.getStatusCode().value());
            out.put("body", truncate(wce.getResponseBodyAsString(), 2000));
            return out;
        } catch (Exception e) {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("ok", false);
            out.put("error", truncate(String.valueOf(e.getMessage()), 500));
            return out;
        }
    }

    public Map<String, Object> getConsent(String id) {
        try {
            String safeId = (id == null) ? "" : id.trim();
            String response = webClient.get()
                    .uri("/consents/{id}", safeId)
                    .header(HttpHeaders.AUTHORIZATION, getAuthHeader())
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(READ_TIMEOUT)
                    .block();

            Map<String, Object> out = new LinkedHashMap<>();
            if (response == null || response.isBlank()) {
                out.put("ok", false);
                out.put("error", "Empty response");
                return out;
            }

            JsonNode root = objectMapper.readTree(response);
            out.put("ok", true);
            out.put("raw", objectMapper.convertValue(root, Map.class));
            String consentText = extractConsentText(root);
            if (consentText != null && !consentText.isBlank()) {
                out.put("consentText", consentText);
            }
            return out;
        } catch (WebClientResponseException wce) {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("ok", false);
            out.put("status", wce.getStatusCode().value());
            out.put("body", truncate(wce.getResponseBodyAsString(), 2000));
            return out;
        } catch (Exception e) {
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("ok", false);
            out.put("error", truncate(String.valueOf(e.getMessage()), 500));
            return out;
        }
    }

    public Map<String, Object> getConsentForAvatarKey(String avatarKey) {
        Map<String, Object> out = new LinkedHashMap<>();
        String key = avatarKey == null ? "" : avatarKey.trim();
        out.put("avatarKey", key);

        String presenterId;
        try {
            presenterId = resolveExpressPresenterId(key);
        } catch (Exception e) {
            presenterId = null;
        }

        if (presenterId == null || presenterId.isBlank()) {
            out.put("ok", false);
            out.put("error", "Avatar not found");
            return out;
        }

        out.put("presenterId", presenterId);

        String consentId = null;
        if (presenterId.startsWith("avt_")) {
            consentId = fetchExpressAvatarConsentIdById(presenterId);
        }

        if (consentId == null || consentId.isBlank()) {
            out.put("ok", false);
            out.put("error", "Consent id not found for avatar");
            return out;
        }

        out.put("consentId", consentId);

        Map<String, Object> consent = getConsent(consentId);
        Object ok = consent.get("ok");
        out.put("ok", ok instanceof Boolean ? ok : Boolean.FALSE);
        if (consent.containsKey("consentText")) {
            out.put("consentText", consent.get("consentText"));
        }
        if (consent.containsKey("status")) {
            out.put("status", consent.get("status"));
        }
        if (consent.containsKey("body")) {
            out.put("body", consent.get("body"));
        }
        if (consent.containsKey("error")) {
            out.put("error", consent.get("error"));
        }
        return out;
    }

    private String extractConsentText(JsonNode root) {
        if (root == null) {
            return null;
        }

        String direct = extractConsentTextDirect(root);
        if (direct != null && !direct.isBlank()) {
            return direct;
        }

        return extractConsentTextRecursive(root, 0, 4);
    }

    private String extractConsentTextDirect(JsonNode node) {
        if (node == null || !node.isObject()) {
            return null;
        }

        String[] keys = new String[] {
                "consent_text",
                "consentText",
                "text",
                "script",
                "content",
                "instructions",
                "description"
        };
        for (String k : keys) {
            if (node.hasNonNull(k) && node.get(k).isTextual()) {
                String v = node.get(k).asText();
                if (v != null && !v.isBlank()) {
                    return v;
                }
            }
        }
        return null;
    }

    private String extractConsentTextRecursive(JsonNode node, int depth, int maxDepth) {
        if (node == null || depth > maxDepth) {
            return null;
        }

        if (node.isObject()) {
            java.util.Iterator<Map.Entry<String, JsonNode>> it = node.fields();
            while (it.hasNext()) {
                Map.Entry<String, JsonNode> e = it.next();
                String key = e.getKey() == null ? "" : e.getKey();
                JsonNode v = e.getValue();

                if (v != null && v.isTextual()) {
                    String s = v.asText();
                    String lk = key.toLowerCase(java.util.Locale.ROOT);
                    if (!s.isBlank() && (lk.contains("consent") || lk.contains("text") || lk.contains("script"))) {
                        return s;
                    }
                }

                String direct = extractConsentTextDirect(v);
                if (direct != null && !direct.isBlank()) {
                    return direct;
                }

                String nested = extractConsentTextRecursive(v, depth + 1, maxDepth);
                if (nested != null && !nested.isBlank()) {
                    return nested;
                }
            }
        } else if (node.isArray()) {
            for (JsonNode child : node) {
                String nested = extractConsentTextRecursive(child, depth + 1, maxDepth);
                if (nested != null && !nested.isBlank()) {
                    return nested;
                }
            }
        }

        return null;
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

        String cachedVoice = clonedVoiceIdCache.get(pid);
        if (cachedVoice != null && !cachedVoice.isBlank()) {
            return Optional.of(cachedVoice);
        }
        if (clonedVoiceNoSample.contains(pid)) {
            return Optional.empty();
        }

        Object lock = voiceCloneLocks.computeIfAbsent(pid, k -> new Object());
        synchronized (lock) {
            String cachedAfterLock = clonedVoiceIdCache.get(pid);
            if (cachedAfterLock != null && !cachedAfterLock.isBlank()) {
                return Optional.of(cachedAfterLock);
            }
            if (clonedVoiceNoSample.contains(pid)) {
                return Optional.empty();
            }

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
                String vid = avatar.getVoiceId().trim();
                if (!vid.isBlank()) {
                    clonedVoiceIdCache.put(pid, vid);
                }
                return Optional.of(vid);
            }

            if (shouldSkipVoiceClone(pid)) {
                return Optional.empty();
            }

            Optional<ByteArrayResource> sample = loadAvatarSampleFromConsentManagement(pid, avatarName.trim());
            if (sample.isEmpty()) {
                sample = loadAvatarSampleFromAudioManagement(pid, avatarName.trim());
            }
            if (sample.isEmpty()) {
                clonedVoiceNoSample.add(pid);
                return Optional.empty();
            }

            Optional<VoiceInfo> created = createClonedVoice(sample.get(), avatarName.trim(), pid);
            Optional<String> voiceId = created.map(v -> v.voiceId);
            created.ifPresent(v -> {
                avatar.setVoiceId(v.voiceId);
                String type = v.voiceType;
                String providerType = normalizeCustomProviderTypeOrDefault(type);
                avatar.setVoiceType(CUSTOM_VOICE_PREFIX + providerType);
                avatarRepository.save(avatar);

                if (v.voiceId != null && !v.voiceId.trim().isBlank()) {
                    clonedVoiceIdCache.put(pid, v.voiceId.trim());
                }
            });
            return voiceId;
        }
    }

    private boolean shouldSkipVoiceClone(String presenterId) {
        if (presenterId == null || presenterId.isBlank()) {
            return false;
        }
        Long until = voiceCloneSkipUntilMsByPresenterId.get(presenterId);
        if (until == null) {
            return false;
        }
        long now = System.currentTimeMillis();
        if (until <= now) {
            voiceCloneSkipUntilMsByPresenterId.remove(presenterId);
            return false;
        }
        return true;
    }

    private void markVoiceCloneSkip(String presenterId, long minutes) {
        if (presenterId == null || presenterId.isBlank()) {
            return;
        }
        long safeMinutes = Math.max(0, minutes);
        if (safeMinutes == 0) {
            return;
        }
        long until = System.currentTimeMillis() + (safeMinutes * 60_000L);
        voiceCloneSkipUntilMsByPresenterId.put(presenterId, until);
    }

    private Optional<ByteArrayResource> loadAvatarSampleFromAudioManagement(String presenterId, String avatarName) {
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

        List<String> normalizedKeys = keys.stream()
                .filter(k -> k != null && !k.isBlank())
                .map(AvatarAudioService::normalizeKey)
                .filter(k -> k != null && !k.isBlank())
                .distinct()
                .toList();

        Optional<AvatarAudio> match = Optional.empty();
        if (!normalizedKeys.isEmpty()) {
            try {
                match = avatarAudioRepository.findFirstByNormalizedKeyIn(normalizedKeys);
            } catch (Exception ignored) {
                // ignore
            }
            if (match.isEmpty()) {
                for (String key : normalizedKeys) {
                    if (key == null || key.isBlank()) {
                        continue;
                    }
                    match = avatarAudioRepository.findFirstByNormalizedKey(key);
                    if (match.isPresent()) {
                        break;
                    }
                }
            }
        }

        if (match.isEmpty()) {
            return Optional.empty();
        }

        AvatarAudio audio = match.get();
        String p = audio.getFilePath();
        if (p == null || p.isBlank()) {
            return Optional.empty();
        }

        try {
            Path filePath = Paths.get(p);
            if (!Files.exists(filePath)) {
                return Optional.empty();
            }
            byte[] bytes = Files.readAllBytes(filePath);
            String filename = audio.getOriginalFilename();
            if (filename == null || filename.isBlank()) {
                filename = audio.getStoredFilename();
            }
            if (filename == null || filename.isBlank()) {
                filename = (avatarName == null || avatarName.isBlank() ? "sample.mp3" : (avatarName + ".mp3"));
            }
            String finalFilename = filename;
            ByteArrayResource bar = new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return finalFilename;
                }
            };
            return Optional.of(bar);
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private Optional<ByteArrayResource> loadAvatarSampleFromConsentManagement(String presenterId, String avatarName) {
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

        List<String> normalizedKeys = keys.stream()
                .filter(k -> k != null && !k.isBlank())
                .map(AvatarAudioService::normalizeKey)
                .filter(k -> k != null && !k.isBlank())
                .distinct()
                .toList();

        Optional<ConsentAudio> match = Optional.empty();
        if (!normalizedKeys.isEmpty()) {
            try {
                match = consentAudioRepository.findFirstByNormalizedKeyIn(normalizedKeys);
            } catch (Exception ignored) {
                // ignore
            }
            if (match.isEmpty()) {
                for (String key : normalizedKeys) {
                    if (key == null || key.isBlank()) {
                        continue;
                    }
                    match = consentAudioRepository.findFirstByNormalizedKey(key);
                    if (match.isPresent()) {
                        break;
                    }
                }
            }
        }

        if (match.isEmpty()) {
            return Optional.empty();
        }

        ConsentAudio audio = match.get();
        String p = audio.getFilePath();
        if (p == null || p.isBlank()) {
            return Optional.empty();
        }

        try {
            Path filePath = Paths.get(p);
            if (!Files.exists(filePath)) {
                return Optional.empty();
            }
            byte[] bytes = Files.readAllBytes(filePath);
            String filename = audio.getOriginalFilename();
            if (filename == null || filename.isBlank()) {
                filename = audio.getStoredFilename();
            }
            if (filename == null || filename.isBlank()) {
                filename = (avatarName == null || avatarName.isBlank() ? "consent.mp3" : (avatarName + "-consent.mp3"));
            }
            String finalFilename = filename;
            ByteArrayResource bar = new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return finalFilename;
                }
            };
            return Optional.of(bar);
        } catch (Exception ignored) {
            return Optional.empty();
        }
    }

    private Optional<VoiceInfo> createClonedVoice(ByteArrayResource file, String name, String presenterId) {
        try {
            String pid = presenterId == null ? "" : presenterId.trim();
            if (!pid.isBlank() && shouldSkipVoiceClone(pid)) {
                return Optional.empty();
            }

            final int maxAttempts = 3;
            for (int attempt = 1; attempt <= maxAttempts; attempt++) {
                MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
                form.add("name", name);
                String lang = cloneVoiceLanguage == null ? "" : cloneVoiceLanguage.trim();
                if (lang.isBlank()) {
                    lang = "english";
                }
                form.add("language", lang);
                form.add("file", file);

                try {
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
                        logger.warn("D-ID create cloned voice: empty response presenterId={} attempt={}", pid, attempt);
                        if (attempt < maxAttempts) {
                            continue;
                        }
                        if (!pid.isBlank()) {
                            markVoiceCloneSkip(pid, cloneSkipOnTransientErrorMinutes);
                        }
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
                        logger.warn("D-ID create cloned voice: no voice_id in response presenterId={} attempt={}", pid, attempt);
                        if (attempt < maxAttempts) {
                            continue;
                        }
                        if (!pid.isBlank()) {
                            markVoiceCloneSkip(pid, cloneSkipOnTransientErrorMinutes);
                        }
                        if (!pid.isBlank()) {
                            voiceCloneLastErrorByPresenterId.put(pid, "no voice_id in response");
                        }
                        return Optional.empty();
                    }

                    String type = root.hasNonNull("type") ? root.get("type").asText() : null;
                    if ((type == null || type.isBlank()) && root.has("provider") && root.get("provider").isObject() && root.get("provider").hasNonNull("type")) {
                        type = root.get("provider").get("type").asText();
                    }
                    if ((type == null || type.isBlank()) && root.has("voice") && root.get("voice").isObject() && root.get("voice").hasNonNull("type")) {
                        type = root.get("voice").get("type").asText();
                    }
                    if ((type == null || type.isBlank()) && root.hasNonNull("tts_provider")) {
                        type = root.get("tts_provider").asText();
                    }
                    if (type == null || type.isBlank()) {
                        type = "amazon";
                    }
                    logger.info("D-ID create cloned voice success: presenterId={} voiceId={} type={} language={}", pid, id, type, lang);
                    if (!pid.isBlank()) {
                        voiceCloneLastErrorByPresenterId.remove(pid);
                    }
                    return Optional.of(new VoiceInfo(id, type));
                } catch (WebClientResponseException wce) {
                    String body = truncate(wce.getResponseBodyAsString(), 1500);
                    int status = wce.getStatusCode().value();
                    String kind = null;
                    try {
                        String raw = wce.getResponseBodyAsString();
                        if (raw != null && !raw.isBlank()) {
                            JsonNode errRoot = objectMapper.readTree(raw);
                            if (errRoot.hasNonNull("kind")) {
                                kind = errRoot.get("kind").asText();
                            }
                        }
                    } catch (com.fasterxml.jackson.core.JacksonException ignored) {
                        // ignore
                    }

                    logger.error(
                            "D-ID create cloned voice failed: presenterId={} attempt={} status={} kind={} body={}",
                            pid,
                            attempt,
                            status,
                            kind,
                            body
                    );

                    if (!pid.isBlank()) {
                        String safeKind = kind == null ? "" : kind.trim();
                        String safeBody = body == null ? "" : body.trim();
                        voiceCloneLastErrorByPresenterId.put(pid, "status=" + status + " kind=" + safeKind + " body=" + truncate(safeBody, 200));
                    }

                    boolean isValidationConsent = kind != null && kind.toLowerCase(Locale.ROOT).contains("consent");
                    if (isValidationConsent) {
                        if (!pid.isBlank()) {
                            markVoiceCloneSkip(pid, cloneSkipOnValidationErrorMinutes);
                        }
                        return Optional.empty();
                    }

                    boolean retryable = status == 429 || status >= 500;
                    if (retryable && attempt < maxAttempts) {
                        continue;
                    }
                    if (!pid.isBlank()) {
                        markVoiceCloneSkip(pid, cloneSkipOnTransientErrorMinutes);
                    }
                    return Optional.empty();
                } catch (Exception e) {
                    logger.error(
                            "D-ID create cloned voice failed: presenterId={} attempt={} error={}",
                            pid,
                            attempt,
                            truncate(e.getMessage(), 300),
                            e
                    );
                    if (!pid.isBlank()) {
                        voiceCloneLastErrorByPresenterId.put(pid, "error=" + truncate(e.getMessage(), 300));
                    }
                    if (attempt < maxAttempts) {
                        continue;
                    }
                    if (!pid.isBlank()) {
                        markVoiceCloneSkip(pid, cloneSkipOnTransientErrorMinutes);
                    }
                    return Optional.empty();
                }
            }

            return Optional.empty();
        } catch (Exception e) {
            logger.error("D-ID create cloned voice failed: {}", truncate(e.getMessage(), 300), e);
            String pid = presenterId == null ? "" : presenterId.trim();
            if (!pid.isBlank()) {
                voiceCloneLastErrorByPresenterId.put(pid, "error=" + truncate(e.getMessage(), 300));
            }
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

    private static final java.util.regex.Pattern SSML_KNOWN_TAG_DETECT = java.util.regex.Pattern.compile(
            "(?is)<\\s*(speak|break|p|s|w|prosody|emphasis|amazon:effect|amazon:domain|say-as|sub|lang|phoneme)\\b"
    );

    private static final java.util.regex.Pattern SSML_KNOWN_TAG_STRIP = java.util.regex.Pattern.compile(
            "(?is)</?\\s*(speak|break|p|s|w|prosody|emphasis|amazon:effect|amazon:domain|say-as|sub|lang|phoneme)\\b[^>]*>"
    );

            private static final java.util.regex.Pattern SSML_AMAZON_EFFECT_STRIP = java.util.regex.Pattern.compile(
                "(?is)</?\\s*amazon:effect\\b[^>]*>"
            );

            private static final java.util.regex.Pattern SSML_AMAZON_DOMAIN_STRIP = java.util.regex.Pattern.compile(
                "(?is)</?\\s*amazon:domain\\b[^>]*>"
            );

    private static final java.util.regex.Pattern MULTI_WHITESPACE = java.util.regex.Pattern.compile("\\s+");

    private boolean isSsmlInput(String script) {
        if (script == null || script.isBlank()) {
            return false;
        }
        if (script.indexOf('<') < 0) {
            return false;
        }
        return SSML_KNOWN_TAG_DETECT.matcher(script).find();
    }

    private String stripKnownSsmlTagsToPlainText(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }
        if (input.indexOf('<') < 0) {
            return input;
        }
        String stripped = SSML_KNOWN_TAG_STRIP.matcher(input).replaceAll(" ");
        stripped = MULTI_WHITESPACE.matcher(stripped).replaceAll(" ").trim();
        return stripped;
    }

    private String sanitizeSsmlForDidProvider(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }
        if (input.indexOf('<') < 0) {
            return input;
        }
        String s = SSML_AMAZON_EFFECT_STRIP.matcher(input).replaceAll("");
        s = SSML_AMAZON_DOMAIN_STRIP.matcher(s).replaceAll("");
        return s;
    }

    private String sanitizeSsmlForAmazonProvider(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }
        if (input.indexOf('<') < 0) {
            return input;
        }

        try {
            return input.replaceAll(
                    "(?is)</?\\s*(?!speak\\b|break\\b|p\\b|s\\b|w\\b|prosody\\b|emphasis\\b|amazon:effect\\b|amazon:domain\\b|say-as\\b|sub\\b|lang\\b|phoneme\\b)[a-zA-Z0-9:_-]+\\b[^>]*>",
                    ""
            );
        } catch (Exception e) {
            return input;
        }
    }

    private String xmlEscapeForSsml(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }
        String s = input;
        s = s.replace("&", "&amp;");
        s = s.replace("<", "&lt;");
        s = s.replace(">", "&gt;");
        s = s.replace("\"", "&quot;");
        s = s.replace("'", "&apos;");
        return s;
    }

    private String wrapPlainTextToSsml(String input) {
        if (input == null) {
            return null;
        }
        String t = input.trim();
        if (t.isEmpty()) {
            return t;
        }

        t = t.replace("\r\n", "\n").replace("\r", "\n");
        t = xmlEscapeForSsml(t);

        t = t.replaceAll("\\n\\s*\\n+", "<break time=\"1400ms\"/>");
        t = t.replaceAll("\\n", "<break time=\"900ms\"/>");
        t = t.replaceAll("([.!?])\\s+", "$1<break time=\"900ms\"/> ");
        t = t.replaceAll("(:)\\s+", "$1<break time=\"700ms\"/> ");

        return "<speak><prosody rate=\"90%\">" + t + "</prosody></speak>";
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
        List<DIDAvatar> matches = avatarRepository.findByPresenterNameTrimmedIgnoreCase(trimmedName);
        return (matches == null || matches.isEmpty()) ? Optional.empty() : Optional.of(matches.get(0));
    }

    private DIDPresenter getPresenterByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return null;
        }

        String trimmed = name.trim();

        Optional<DIDAvatar> avatar = getAvatarByName(trimmed);
        if (avatar.isEmpty()) {
            refreshPresenters();
            avatar = getAvatarByName(trimmed);
        }

        return avatar.map(a -> getPresenterByIdPreferDbThenApi(a.getPresenterId())).orElse(null);
    }
    
    /**
     * Get Express Avatars created in D-ID Studio
     * These are avatars like "AFAN" created via the Studio interface
     */
    private List<DIDPresenter> getExpressAvatars(boolean includeNotReady) {
        long now = System.currentTimeMillis();
        List<DIDPresenter> cached = this.cachedExpressAvatarsAll;
        if (cached != null && now < expressCacheExpiry) {
            if (includeNotReady) {
                return new ArrayList<>(cached);
            }
            List<DIDPresenter> done = this.cachedExpressAvatarsDone;
            return done == null ? new ArrayList<>() : new ArrayList<>(done);
        }

        List<DIDPresenter> all = new ArrayList<>();
        List<DIDPresenter> doneOnly = new ArrayList<>();
        Map<String, String> nameMap = new HashMap<>();
        Set<String> idSet = new HashSet<>();

        try {
            String response = webClient.get()
                    .uri("/scenes/avatars")
                    .header(HttpHeaders.AUTHORIZATION, getAuthHeader())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(READ_TIMEOUT)
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

                        if (avatarId == null || avatarId.isBlank()) {
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

                        all.add(presenter);
                        if ("done".equalsIgnoreCase(status)) {
                            doneOnly.add(presenter);
                        }
                        presenterCache.put(avatarId, presenter);
                        idSet.add(avatarId.trim());

                        String nm = presenter.getPresenter_name();
                        String normalizedName = normalizePresenterNameForMatch(nm);
                        if (!normalizedName.isBlank()) {
                            nameMap.putIfAbsent(normalizedName, avatarId.trim());
                        }
                    }
                }

                logger.info("Found {} Express Avatars from D-ID", all.size());
            }
        } catch (Exception e) {
            logger.error("Error fetching Express Avatars from D-ID: {}", e.getMessage());
        }

        this.cachedExpressAvatarsAll = new ArrayList<>(all);
        this.cachedExpressAvatarsDone = new ArrayList<>(doneOnly);
        this.expressCacheExpiry = System.currentTimeMillis() + CACHE_TTL_MS;
        this.expressIdByNormalizedName.clear();
        this.expressIdByNormalizedName.putAll(nameMap);
        this.expressIds.clear();
        this.expressIds.addAll(idSet);

        if (includeNotReady) {
            return new ArrayList<>(all);
        }
        return new ArrayList<>(doneOnly);
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
        if (strictAudioManagementVoice && audioUrl != null && !audioUrl.isBlank()) {
            throw new RuntimeException("audio_url is disabled in strict mode; must use Audio Management voice or avatar native voice");
        }
        boolean hasAudioManagementSample = false;
        try {
            hasAudioManagementSample = strictAudioManagementVoice && hasAudioManagementSampleForPresenter(trimmedAvatarId);
        } catch (Exception ignored) {
            // Best-effort
        }

        // Strict mode: require Audio Management entry and use D-ID Amazon provider (no direct AWS calls).
        if (strictAudioManagementVoice) {
            if (!hasAudioManagementSample) {
                throw new RuntimeException("Audio Management voice is required for avatarId=" + trimmedAvatarId);
            }
        } else {
            // Non-strict: best-effort local-sample voice cloning.
            ensureLocalSampleVoiceIfAvailable(trimmedAvatarId);
        }

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

        if (strictAudioManagementVoice) {
            return clips;
        }

        String err = clips.get("error") == null ? "" : clips.get("error").toString();
        String errLower = err.toLowerCase(Locale.ROOT);

        if (!errLower.isBlank() && (errLower.contains("avatar not found") || errLower.contains("notfounderror"))) {
            if (hasAudioManagementSample && enforceConsistentAudioManagementVoice) {
                return clips;
            }
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
            if (hasAudioManagementSample && enforceConsistentAudioManagementVoice) {
                return clips;
            }
            logger.warn("Clips creation failed ({}). Falling back to Scenes for avatar_id={}", truncate(err, 500), trimmedAvatarId);
            Map<String, Object> scene = createSceneWithClipsFallback(trimmedAvatarId, script, backgroundUrl, audioUrl);
            if (Boolean.TRUE.equals(scene.get("success"))) {
                return scene;
            }
            return scene;
        }

        return clips;
    }

    public Map<String, Object> getClipStatus(String videoId) {
        Map<String, Object> out = new HashMap<>();
        if (videoId == null || videoId.isBlank()) {
            out.put("success", false);
            out.put("error", "Invalid videoId");
            return out;
        }

        String id = videoId.trim();
        boolean isScene = id.startsWith("scn_") || id.startsWith("scene_");
        String path = isScene ? "/scenes/{id}" : "/clips/{id}";

        try {
            String response = webClient.get()
                    .uri(path, id)
                    .header(HttpHeaders.AUTHORIZATION, getAuthHeader())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(READ_TIMEOUT)
                    .block();

            if (response == null || response.isBlank()) {
                out.put("success", false);
                out.put("error", "Empty response from D-ID");
                return out;
            }

            JsonNode root = objectMapper.readTree(response);
            String status = root.has("status") && !root.get("status").isNull() ? root.get("status").asText() : "";

            String resultUrl = null;
            if (root.has("result_url") && !root.get("result_url").isNull()) {
                resultUrl = root.get("result_url").asText();
            } else if (root.has("result") && root.get("result").isObject() && root.get("result").has("url")) {
                resultUrl = root.get("result").get("url").asText();
            }

            String pendingUrl = null;
            if (root.has("pending_url") && !root.get("pending_url").isNull()) {
                pendingUrl = root.get("pending_url").asText();
            } else if (root.has("url") && !root.get("url").isNull()) {
                pendingUrl = root.get("url").asText();
            }

            String err = null;
            if (root.has("error") && !root.get("error").isNull()) {
                err = root.get("error").asText();
            } else if (root.has("message") && !root.get("message").isNull()) {
                err = root.get("message").asText();
            }

            out.put("success", true);
            out.put("id", id);
            out.put("type", isScene ? "scene" : "clip");
            out.put("status", status == null ? "" : status);
            out.put("result_url", resultUrl);
            out.put("pending_url", pendingUrl);
            if (err != null && !err.isBlank()) {
                out.put("error", err);
            }
            return out;
        } catch (WebClientResponseException wce) {
            out.put("success", false);
            out.put("error", "D-ID status failed: status=" + wce.getStatusCode().value());
            out.put("status", "error");
            return out;
        } catch (Exception e) {
            out.put("success", false);
            out.put("error", e.getMessage());
            out.put("status", "error");
            return out;
        }
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

            String trimmedName = (name == null) ? null : name.trim();
            boolean hasSample = findAudioManagementEntry(pid, trimmedName).isPresent();

            if (strictAudioManagementVoice) {
                if (!hasSample) {
                    throw new RuntimeException("Audio-management voice is required for presenterId=" + pid);
                }
                // Strict mode: we only enforce existence of audio-management entry.
                // Provider selection is handled in resolveProviderForPresenter() and uses Amazon.
                return;
            }

            if (!hasSample) {
                return;
            }

            Optional<String> ensured = ensureClonedVoiceIdFromLocalSample(pid, trimmedName);
            if (hasSample && (ensured.isEmpty() || ensured.get().isBlank()) && failOnCloneError) {
                throw new RuntimeException("Audio-management sample exists but voice cloning failed for presenterId=" + pid);
            }
        } catch (Exception e) {
            if (strictAudioManagementVoice && failOnCloneError) {
                if (e instanceof RuntimeException re) {
                    throw re;
                }
                throw new RuntimeException(e);
            }
        }
    }

    private String pickAmazonVoiceIdForPresenter(String presenterId) {
        String fallback = (amazonVoiceIdFemale == null || amazonVoiceIdFemale.isBlank()) ? "Joanna" : amazonVoiceIdFemale.trim();

        if (presenterId == null || presenterId.isBlank()) {
            return fallback;
        }

        String pid = presenterId.trim();
        String gender = null;

        try {
            Optional<DIDAvatar> db = avatarRepository.findByPresenterId(pid);
            if (db.isPresent()) {
                gender = db.get().getGender();
            }
        } catch (Exception ignored) {
            // ignore
        }

        if (gender == null || gender.isBlank()) {
            try {
                DIDPresenter cached = presenterCache.get(pid);
                if (cached != null) {
                    gender = cached.getGender();
                }
            } catch (Exception ignored) {
                // ignore
            }
        }

        if (gender == null) {
            gender = "";
        }

        String g = gender.trim().toLowerCase(Locale.ROOT);
        if (g.startsWith("m")) {
            String male = (amazonVoiceIdMale == null || amazonVoiceIdMale.isBlank()) ? "Matthew" : amazonVoiceIdMale.trim();
            return male;
        }

        return fallback;
    }

    private String normalizeCustomProviderTypeOrDefault(String rawType) {
        String providerType = normalizeVoiceType(rawType);
        if (providerType == null || providerType.isBlank()) {
            return "amazon";
        }
        String v = providerType.trim().toLowerCase(Locale.ROOT);
        if (v.equals("d-id") || v.equals("did")) {
            return "d-id";
        }
        if (v.equals("amazon") || v.contains("amazon") || v.contains("polly") || v.contains("aws")) {
            return "amazon";
        }
        return v;
    }

    private Map<String, Object> resolveProviderForPresenter(String presenterId) {
        if (presenterId == null || presenterId.isBlank()) {
            return null;
        }

        String pid = presenterId.trim();

        if (strictAudioManagementVoice) {
            if (!hasAudioManagementSampleForPresenter(pid)) {
                throw new RuntimeException("Audio-management voice is required for presenterId=" + pid);
            }

            // Strict rule: ONLY use (a) a voice already derived from Audio Management (custom/cloned) or
            // (b) the Express Avatar's native voice (provider=null). Never force a generic/default voice.
            // NOTE: We intentionally DO NOT attempt to create/clone a voice here, because cloning may
            // require a consent-specific recording and can cause hard failures (e.g. ConsentTextSimilarityError).
            try {
                Optional<DIDAvatar> db = avatarRepository.findByPresenterId(pid);
                DIDAvatar a = db.orElse(null);

                // If a custom/cloned voice was already saved, prefer it.
                if (a != null) {
                    String voiceId = a.getVoiceId();
                    String rawType = a.getVoiceType();
                    if (voiceId != null && !voiceId.isBlank() && rawType != null && !rawType.isBlank()
                            && rawType.trim().toLowerCase(Locale.ROOT).startsWith(CUSTOM_VOICE_PREFIX)) {
                        String providerType = normalizeCustomProviderTypeOrDefault(rawType);
                        Map<String, Object> provider = new HashMap<>();
                        provider.put("type", providerType);
                        provider.put("voice_id", voiceId.trim());
                        logger.info("Using audio-management voice for presenter {}: type={} voice_id={}", pid, providerType, voiceId.trim());
                        return provider;
                    }
                }

                // Strict mode: audio-management exists, so we MUST ensure a cloned voice exists.
                String cloneName;
                try {
                    Optional<DIDAvatar> db2 = avatarRepository.findByPresenterId(pid);
                    cloneName = db2.map(DIDAvatar::getPresenterName).orElse(null);
                } catch (Exception ignored) {
                    cloneName = null;
                }
                if (cloneName == null || cloneName.isBlank()) {
                    DIDPresenter cached = presenterCache.get(pid);
                    cloneName = cached == null ? pid : cached.getPresenter_name();
                }
                if (cloneName == null || cloneName.isBlank()) {
                    cloneName = pid;
                }

                Optional<String> ensuredVoiceId = ensureClonedVoiceIdFromLocalSample(pid, cloneName.trim());
                if (ensuredVoiceId.isEmpty() || ensuredVoiceId.get().isBlank()) {
                    String last = voiceCloneLastErrorByPresenterId.get(pid);
                    throw strictVoiceSetupRequired(pid, last);
                }

                String ensuredType = "amazon";
                try {
                    Optional<DIDAvatar> refreshed = avatarRepository.findByPresenterId(pid);
                    if (refreshed.isPresent() && refreshed.get().getVoiceType() != null
                            && refreshed.get().getVoiceType().trim().toLowerCase(Locale.ROOT).startsWith(CUSTOM_VOICE_PREFIX)) {
                        ensuredType = normalizeCustomProviderTypeOrDefault(refreshed.get().getVoiceType());
                    }
                } catch (Exception ignored) {
                    // ignore
                }

                Map<String, Object> provider = new HashMap<>();
                provider.put("type", ensuredType);
                provider.put("voice_id", ensuredVoiceId.get().trim());
                logger.info("Strict voice ensured for presenter {}: type={} voice_id={}", pid, ensuredType, ensuredVoiceId.get().trim());
                return provider;
            } catch (RuntimeException re) {
                throw re;
            } catch (Exception e) {
                String last = voiceCloneLastErrorByPresenterId.get(pid);
                throw strictVoiceSetupRequired(pid, (last == null || last.isBlank()) ? e.getMessage() : last);
            }
        }

        try {
            Optional<DIDAvatar> db = avatarRepository.findByPresenterId(pid);
            if (db.isPresent()) {
                DIDAvatar a = db.get();
                String presenterName = a.getPresenterName();

                Optional<AvatarAudio> audioEntry = findAudioManagementEntry(pid, presenterName);
                boolean hasAudioManagementSample = audioEntry.isPresent();

                // Priority 1: Use existing custom/cloned voice saved on the avatar (from audio-management)
                String voiceId = a.getVoiceId();
                String rawType = a.getVoiceType();
                if (voiceId != null && !voiceId.isBlank() && rawType != null && !rawType.isBlank()
                        && rawType.trim().toLowerCase(Locale.ROOT).startsWith(CUSTOM_VOICE_PREFIX)) {
                    String providerType = normalizeCustomProviderTypeOrDefault(rawType);
                    Map<String, Object> provider = new HashMap<>();
                    provider.put("type", providerType);
                    provider.put("voice_id", voiceId.trim());
                    logger.info("Using audio-management voice for presenter {}: type={} voice_id={}", pid, providerType, voiceId.trim());
                    return provider;
                }

                // Priority 2: If audio-management has a sample, ensure a cloned/custom voice exists and use it
                if (hasAudioManagementSample) {
                    String cloneName = (presenterName == null || presenterName.isBlank()) ? pid : presenterName.trim();
                    Optional<String> ensuredVoiceId = ensureClonedVoiceIdFromLocalSample(pid, cloneName);
                    if (ensuredVoiceId.isPresent() && !ensuredVoiceId.get().isBlank()) {
                        // Reload type from DB after ensure, so we use the correct provider type if available
                        String ensuredType = "d-id";
                        try {
                            Optional<DIDAvatar> refreshed = avatarRepository.findByPresenterId(pid);
                            if (refreshed.isPresent() && refreshed.get().getVoiceType() != null
                                    && refreshed.get().getVoiceType().trim().toLowerCase(Locale.ROOT).startsWith(CUSTOM_VOICE_PREFIX)) {
                                ensuredType = normalizeCustomProviderTypeOrDefault(refreshed.get().getVoiceType());
                            }
                        } catch (Exception ignored) {
                            // ignore
                        }
                        Map<String, Object> provider = new HashMap<>();
                        provider.put("type", ensuredType);
                        provider.put("voice_id", ensuredVoiceId.get().trim());
                        logger.info("Using audio-management voice (ensured) for presenter {}: type={} voice_id={}", pid, ensuredType, ensuredVoiceId.get().trim());
                        return provider;
                    }

                    if (strictAudioManagementVoice && failOnCloneError) {
                        throw new RuntimeException("Audio-management sample exists but voice cloning failed for presenterId=" + pid);
                    }

                    // Do NOT fall back to a different voice/provider when audio-management exists.
                    // Returning null keeps the selected Express Avatar's native voice.
                    return null;
                }
            }
            
            // No audio-management match, no override configured
            // Return null to let D-ID use Express Avatar's native voice
            logger.info("No audio-management sample for presenter {}, using avatar's native voice", pid);
            return null;
            
        } catch (Exception e) {
            if (strictAudioManagementVoice && failOnCloneError) {
                if (e instanceof RuntimeException re) {
                    throw re;
                }
                throw new RuntimeException(e);
            }
            logger.warn("Error resolving voice provider for presenter {}: {}", pid, e.getMessage());
            return null;
        }
    }

    private Map<String, Object> sanitizeProviderForScenes(Map<String, Object> provider) {
        if (provider == null) {
            return null;
        }

        String type = provider.get("type") == null ? null : String.valueOf(provider.get("type"));
        if (type == null || type.isBlank()) {
            return provider;
        }

        String t = type.trim().toLowerCase(Locale.ROOT);
        // /scenes does NOT accept provider.type = d-id (union validation error).
        if (t.equals("d-id") || t.equals("did")) {
            return null;
        }

        return provider;
    }

    private Optional<AvatarAudio> findAudioManagementEntry(String presenterId, String presenterName) {
        List<String> keys = new ArrayList<>();

        if (presenterName != null && !presenterName.isBlank()) {
            String n1 = presenterName;
            String n2 = presenterName.toLowerCase(Locale.ROOT);
            String n3 = presenterName.trim().replaceAll("\\s+", "").toLowerCase(Locale.ROOT);
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

        List<String> normalizedKeys = keys.stream()
                .filter(k -> k != null && !k.isBlank())
                .map(AvatarAudioService::normalizeKey)
                .filter(k -> k != null && !k.isBlank())
                .distinct()
                .toList();

        if (normalizedKeys.isEmpty()) {
            return Optional.empty();
        }

        try {
            return avatarAudioRepository.findFirstByNormalizedKeyIn(normalizedKeys);
        } catch (Exception ignored) {
            // Fallback to single lookups
            for (String key : normalizedKeys) {
                if (key == null || key.isBlank()) {
                    continue;
                }
                Optional<AvatarAudio> match = avatarAudioRepository.findFirstByNormalizedKey(key);
                if (match.isPresent()) {
                    return match;
                }
            }
            return Optional.empty();
        }
    }

    public Optional<DIDAvatar> getExpressAvatarByName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return Optional.empty();
        }

        String trimmed = name.trim();
        List<DIDAvatar> db = avatarRepository.findExpressByPresenterNameTrimmedIgnoreCase(trimmed);
        if (db != null && !db.isEmpty()) {
            return Optional.of(db.get(0));
        }

        // Refresh from D-ID API then re-check
        getPresentersForListing(true);
        List<DIDAvatar> afterRefresh = avatarRepository.findExpressByPresenterNameTrimmedIgnoreCase(trimmed);
        return (afterRefresh == null || afterRefresh.isEmpty()) ? Optional.empty() : Optional.of(afterRefresh.get(0));
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
                if (!expressIds.isEmpty() && expressIds.contains(trimmed)) {
                    return trimmed;
                }

                getExpressAvatars(true);
                if (!expressIds.isEmpty() && expressIds.contains(trimmed)) {
                    return trimmed;
                }
            } catch (Exception ignored) {
                // fall through
            }
            return getExpressAvatarById(trimmed).map(DIDAvatar::getPresenterId).orElse(null);
        }

        String target = normalizePresenterNameForMatch(trimmed);
        try {
            if (target != null && !target.isBlank()) {
                String cachedId = expressIdByNormalizedName.get(target);
                if (cachedId != null && !cachedId.isBlank()) {
                    return cachedId;
                }

                // Warm cache once when empty/expired
                getExpressAvatars(true);
                cachedId = expressIdByNormalizedName.get(target);
                if (cachedId != null && !cachedId.isBlank()) {
                    return cachedId;
                }
            }
        } catch (Exception ignored) {
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

        // Strict mode: never fall back to another presenter_id (prevents voice drift / overlapping flows).
        if (strictAudioManagementVoice) {
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

        if (errLower.contains("logoerror") || errLower.contains("could not load logo") || errLower.contains("logo image")) {
            String fallback = resolveFallbackClipsPresenterId();
            if (fallback != null && !fallback.equalsIgnoreCase(avatarId)) {
                logger.warn("Scenes logo error ({}). Falling back to presenter_id={}", truncate(err, 300), fallback);
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

                if (isHttpsUrl(scenesWebhookUrl)) {
                    requestBody.put("webhook", scenesWebhookUrl.trim());
                }
                
                Map<String, Object> scriptObj = new HashMap<>();
                boolean usingAudio = audioUrl != null && !audioUrl.isBlank();
                if (usingAudio) {
                    scriptObj.put("type", "audio");
                    scriptObj.put("audio_url", audioUrl);
                } else {
                    scriptObj.put("type", "text");
                    boolean originalSsml = isSsmlInput(script);
                    Map<String, Object> provider = sanitizeProviderForScenes(resolveProviderForPresenter(avatarId));

                    String providerType = provider == null ? null : String.valueOf(provider.get("type"));
                    boolean providerIsAmazon = providerType != null && providerType.equalsIgnoreCase("amazon");
                    boolean canUseSsml = strictAudioManagementVoice || originalSsml;
                    boolean ssmlAllowedFlag = canUseSsml && providerSupportsSsmlFlag(providerType);
                    
                    // Log the voice configuration being used
                    if (provider != null) {
                        String logVoiceType = String.valueOf(provider.get("type"));
                        String logVoiceId = String.valueOf(provider.get("voice_id"));
                        logger.info("Scene {} using {} voice: voice_id={}", avatarId, logVoiceType, logVoiceId);
                    } else {
                        logger.info("Scene {} using avatar's native voice", avatarId);
                    }

                    String scriptInput = script;
                    if (strictAudioManagementVoice && !originalSsml) {
                        // If template is plain text, wrap into SSML so pauses/prosody can be applied.
                        scriptInput = wrapPlainTextToSsml(scriptInput);
                        originalSsml = isSsmlInput(scriptInput);
                    }

                    if (originalSsml) {
                        scriptInput = providerIsAmazon
                                ? sanitizeSsmlForAmazonProvider(scriptInput)
                                : sanitizeSsmlForDidProvider(scriptInput);
                    }

                    // Only set the explicit ssml flag for providers documented to support it in D-ID.
                    // For Amazon, we keep SSML tags in the input without the ssml flag.
                    if (ssmlAllowedFlag) {
                        scriptObj.put("ssml", true);
                        if (strictAudioManagementVoice) {
                            String si = scriptInput == null ? "" : scriptInput;
                            logger.info(
                                "Scene {} SSML enabled: provider={} breaks={} prosody={} amazonDomain={} amazonEffect={} len={}",
                                avatarId,
                                providerType,
                                si.contains("<break"),
                                si.contains("<prosody"),
                                si.toLowerCase(java.util.Locale.ROOT).contains("<amazon:domain"),
                                si.toLowerCase(java.util.Locale.ROOT).contains("<amazon:effect"),
                                si.length()
                            );
                        }
                    } else if (originalSsml && !providerIsAmazon && !providerSupportsSsmlFlag(providerType)) {
                        // Provider does not support SSML flag and isn't Amazon; fall back to punctuation.
                        scriptInput = stripKnownSsmlTagsToPlainText(convertSsmlBreakTagsToPunctuation(scriptInput));
                    }
                    scriptObj.put("input", scriptInput);
                    if (provider != null) {
                        scriptObj.put("provider", provider);
                    }
                }
                
                requestBody.put("script", scriptObj);

                if (isHttpsUrl(backgroundUrl)) {
                    Map<String, Object> background = new HashMap<>();
                    background.put("source_url", backgroundUrl);
                    requestBody.put("background", background);
                }

                String response;
                try {
                    response = postScene(requestBody);
                } catch (WebClientResponseException wce) {
                    if (requestBody.containsKey("background") && (wce.getStatusCode().is4xxClientError() || isBackgroundRelatedError(wce))) {
                        logger.warn("Scenes background rejected (status={}). Retrying without background.", wce.getStatusCode().value());
                        requestBody.remove("background");
                        response = postScene(requestBody);
                    } else if (!usingAudio && isSsmlInput(script) && wce.getStatusCode().is4xxClientError()) {
                        if (strictAudioManagementVoice) {
                            throw wce;
                        }

                        logger.warn("Scenes SSML rejected (status={}). Retrying with plain text.", wce.getStatusCode().value());

                        Map<String, Object> fallbackTextScript = new HashMap<>();
                        fallbackTextScript.put("type", "text");
                        fallbackTextScript.put("input", stripKnownSsmlTagsToPlainText(script));

                        Map<String, Object> provider = resolveProviderForPresenter(avatarId);
                        provider = sanitizeProviderForScenes(provider);
                        if (provider != null) {
                            fallbackTextScript.put("provider", provider);
                        }

                        requestBody.put("script", fallbackTextScript);
                        response = postScene(requestBody);
                    } else if (!usingAudio && script != null && script.contains("<break") && wce.getStatusCode().is4xxClientError()) {
                        if (strictAudioManagementVoice) {
                            throw wce;
                        }

                        logger.warn("Scenes SSML rejected (status={}). Retrying without SSML breaks.", wce.getStatusCode().value());
                        Map<String, Object> fallbackTextScript = new HashMap<>();
                        fallbackTextScript.put("type", "text");
                        fallbackTextScript.put("input", convertSsmlBreakTagsToPunctuation(script));

                        Map<String, Object> provider = resolveProviderForPresenter(avatarId);
                        provider = sanitizeProviderForScenes(provider);
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
                String msg = e.getMessage() == null ? "" : e.getMessage();
                boolean noRetry = msg.contains("ConsentTextSimilarityError")
                        || msg.contains("voice cloning")
                        || msg.contains("Audio-management voice cloning is required");

                logger.error("Error creating D-ID scene (attempt {}/{}): {}", attempt, MAX_RETRIES, msg);

                if (noRetry) {
                    result.put("success", false);
                    result.put("error", msg);
                    return result;
                }
                
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

                if (isHttpsUrl(clipsWebhookUrl)) {
                    requestBody.put("webhook", clipsWebhookUrl.trim());
                }
                
                Map<String, Object> scriptObj = new HashMap<>();
                boolean usingAudio = audioUrl != null && !audioUrl.isBlank();
                Map<String, Object> provider = usingAudio ? null : resolveClipsVoiceProvider(presenterId);
                if (!usingAudio && provider == null) {
                    String nativeVoiceId = null;
                    try {
                        Optional<DIDAvatar> dbAvatar = avatarRepository.findByPresenterId(presenterId);
                        if (dbAvatar.isPresent() && dbAvatar.get().getVoiceId() != null && !dbAvatar.get().getVoiceId().isBlank()) {
                            nativeVoiceId = dbAvatar.get().getVoiceId().trim();
                        }
                    } catch (Exception ignored) {
                        // ignore
                    }

                    if (nativeVoiceId == null || nativeVoiceId.isBlank()) {
                        try {
                            DIDPresenter cached = presenterCache.get(presenterId);
                            if (cached != null && cached.getVoice_id() != null && !cached.getVoice_id().isBlank()) {
                                nativeVoiceId = cached.getVoice_id().trim();
                            }
                        } catch (Exception ignored) {
                            // ignore
                        }
                    }

                    if (nativeVoiceId != null && !nativeVoiceId.isBlank()) {
                        Map<String, Object> nativeProvider = new HashMap<>();
                        nativeProvider.put("type", "d-id");
                        nativeProvider.put("voice_id", nativeVoiceId);
                        provider = nativeProvider;
                    }
                }
                if (usingAudio) {
                    scriptObj.put("type", "audio");
                    scriptObj.put("audio_url", audioUrl);
                } else {
                    scriptObj.put("type", "text");
                    boolean originalSsml = isSsmlInput(script);
                    boolean canUseSsml = strictAudioManagementVoice || originalSsml;
                    // In strict mode, provider is already resolved by resolveProviderForPresenter() which also ensures cloning.

                    String providerType = provider == null ? null : String.valueOf(provider.get("type"));
                    boolean providerIsAmazon = providerType != null && providerType.equalsIgnoreCase("amazon");
                    boolean ssmlAllowedFlag = canUseSsml && providerSupportsSsmlFlag(providerType);
                    String scriptInput = script;
                    if (strictAudioManagementVoice && !originalSsml) {
                        scriptInput = wrapPlainTextToSsml(scriptInput);
                        originalSsml = isSsmlInput(scriptInput);
                    }

                    if (originalSsml) {
                        scriptInput = providerIsAmazon
                                ? sanitizeSsmlForAmazonProvider(scriptInput)
                                : sanitizeSsmlForDidProvider(scriptInput);
                    }

                    if (ssmlAllowedFlag) {
                        scriptObj.put("ssml", true);
                        if (strictAudioManagementVoice) {
                            String si = scriptInput == null ? "" : scriptInput;
                            logger.info(
                                "Clips {} SSML enabled: provider={} breaks={} prosody={} amazonDomain={} amazonEffect={} len={}",
                                presenterId,
                                providerType,
                                si.contains("<break"),
                                si.contains("<prosody"),
                                si.toLowerCase(java.util.Locale.ROOT).contains("<amazon:domain"),
                                si.toLowerCase(java.util.Locale.ROOT).contains("<amazon:effect"),
                                si.length()
                            );
                        }
                    } else if (originalSsml && !providerIsAmazon && !providerSupportsSsmlFlag(providerType)) {
                        scriptInput = stripKnownSsmlTagsToPlainText(convertSsmlBreakTagsToPunctuation(scriptInput));
                    }
                    scriptObj.put("input", scriptInput);
                }

                if (isHttpsUrl(backgroundUrl)) {
                    Map<String, Object> background = new HashMap<>();
                    background.put("source_url", backgroundUrl);
                    requestBody.put("background", background);
                }

                Map<String, Object> requestBodyWithProvider = new HashMap<>(requestBody);
                Map<String, Object> scriptWithProvider = new HashMap<>(scriptObj);
                if (provider != null) {
                    scriptWithProvider.put("provider", provider);
                    String voiceType = String.valueOf(provider.get("type"));
                    String voiceId = String.valueOf(provider.get("voice_id"));
                    logger.info("Clip {} using {} voice: voice_id={}", presenterId, voiceType, voiceId);
                } else {
                    logger.info("Clip {} using presenter's native voice", presenterId);
                }
                requestBodyWithProvider.put("script", scriptWithProvider);

                Map<String, Object> requestBodyWithoutProvider = new HashMap<>(requestBody);
                requestBodyWithoutProvider.put("script", new HashMap<>(scriptObj));

                String response;
                try {
                    response = postClip(requestBodyWithProvider);
                } catch (WebClientResponseException wce) {
                    if (requestBodyWithProvider.containsKey("background") && (wce.getStatusCode().is4xxClientError() || isBackgroundRelatedError(wce))) {
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
                        boolean canUseSsml = isSsmlInput(script);
                        if (canUseSsml) {
                            textScriptObj.put("ssml", true);
                        }
                        String fallbackProviderType = fallbackProvider == null ? null : String.valueOf(fallbackProvider.get("type"));
                        boolean ssmlAllowed = canUseSsml;
                        String scriptInput = script;
                        if (ssmlAllowed) {
                            scriptInput = fallbackProviderType != null && fallbackProviderType.equalsIgnoreCase("amazon")
                                    ? sanitizeSsmlForAmazonProvider(script)
                                    : sanitizeSsmlForDidProvider(script);
                        } else if (canUseSsml) {
                            scriptInput = stripKnownSsmlTagsToPlainText(script);
                        }
                        textScriptObj.put("input", scriptInput);
                        // no 'ssml' flag; SSML is inferred from <speak> input

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
                    if (!usingAudio && isSsmlInput(script) && wce.getStatusCode().is4xxClientError()) {
                        if (strictAudioManagementVoice) {
                            throw wce;
                        }

                        logger.warn("Clips SSML rejected (status={}). Retrying with plain text.", wce.getStatusCode().value());

                        Map<String, Object> fallbackTextScript = new HashMap<>();
                        fallbackTextScript.put("type", "text");
                        fallbackTextScript.put("input", stripKnownSsmlTagsToPlainText(script));

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
                    if (!usingAudio && script != null && script.contains("<break") && wce.getStatusCode().is4xxClientError()) {
                        if (strictAudioManagementVoice) {
                            throw wce;
                        }

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
                    throw wce;
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
                String msg = e.getMessage() == null ? "" : e.getMessage();
                boolean noRetry = msg.contains("ConsentTextSimilarityError")
                        || msg.contains("voice cloning")
                        || msg.contains("Audio-management voice cloning is required");

                logger.error("Error creating D-ID clip (attempt {}/{}): {}", attempt, MAX_RETRIES, msg);

                if (noRetry) {
                    result.put("success", false);
                    result.put("error", msg);
                    return result;
                }
                
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
                if (ms >= 2400) {
                    repl = ". . . ";
                } else if (ms >= 1600) {
                    repl = ". . ";
                } else if (ms >= 900) {
                    repl = ". ";
                } else if (ms >= 450) {
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

    private String fetchExpressAvatarConsentIdById(String avatarId) {
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
            String consentId = null;

            if (root.hasNonNull("consent_id")) {
                consentId = root.get("consent_id").asText();
            } else if (root.has("consent") && root.get("consent").isObject()) {
                JsonNode consent = root.get("consent");
                if (consent.hasNonNull("id")) {
                    consentId = consent.get("id").asText();
                } else if (consent.hasNonNull("consent_id")) {
                    consentId = consent.get("consent_id").asText();
                }
            }

            if (consentId == null || consentId.isBlank()) {
                return null;
            }

            return consentId;
        } catch (WebClientResponseException wce) {
            if (wce.getStatusCode().value() == 404) {
                return null;
            }
            logger.warn(
                    "Failed to fetch Express Avatar consent id (status={}): {}",
                    wce.getStatusCode().value(),
                    truncate(wce.getResponseBodyAsString(), 800)
            );
        } catch (Exception e) {
            logger.warn("Failed to fetch Express Avatar consent id: {}", truncate(e.getMessage(), 300));
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

    /**
     * Get voice policy information for the current configuration.
     * Voice selection priority:
     * - Strict mode: Amazon Polly provider + audio-management required (no fallback)
     * - Non-strict mode:
     *   1. Cloned voice from audio-management (if avatar name matches audio sample)
     *   2. Express Avatar's native voice (no provider)
     * @return Map containing voice policy information
     */
    public Map<String, Object> getVoicePolicyInfo() {
        Map<String, Object> result = new HashMap<>();
        
        // Current configuration
        Map<String, Object> config = new HashMap<>();
        config.put("cloneLanguage", cloneVoiceLanguage);
        config.put("strictAudioManagement", strictAudioManagementVoice);
        config.put("failOnCloneError", failOnCloneError);
        config.put("amazonVoiceIdFemale", (amazonVoiceIdFemale == null || amazonVoiceIdFemale.isBlank()) ? "Joanna" : amazonVoiceIdFemale.trim());
        config.put("amazonVoiceIdMale", (amazonVoiceIdMale == null || amazonVoiceIdMale.isBlank()) ? "Matthew" : amazonVoiceIdMale.trim());
        result.put("config", config);

        // Voice selection priority
        if (strictAudioManagementVoice) {
            result.put("priority", List.of(
                Map.of("order", 1, "type", "elevenlabs", "description", "SSML uses ElevenLabs provider with Express Avatar voice_id (SSML supported by D-ID)"),
                Map.of("order", 2, "type", "amazon", "description", "Non-SSML uses Amazon provider (voice_id Joanna/Matthew)"),
                Map.of("order", 3, "type", "audio-management-required", "description", "Audio-management entry is required; system fails loudly if missing")
            ));
        } else {
            result.put("priority", List.of(
                Map.of("order", 1, "type", "audio-management", "description", "Cloned voice from audio sample matching avatar name (D-ID voice cloning)"),
                Map.of("order", 2, "type", "native", "description", "Express Avatar's native voice (no provider specified)")
            ));
        }
        
        // How to add custom voice
        result.put("howToAddCustomVoice", Map.of(
            "step1", "Go to audio-management page",
            "step2", "Upload a 30+ second audio sample",
            "step3", "Name it exactly matching the avatar name",
            "step4", "System will automatically use that voice for the matching avatar"
        ));
        
        return result;
    }
}
