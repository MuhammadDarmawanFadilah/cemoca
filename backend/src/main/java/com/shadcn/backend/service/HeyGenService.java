package com.shadcn.backend.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.Duration;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.netty.http.client.HttpClient;

@Service
public class HeyGenService {
    private static final Logger logger = LoggerFactory.getLogger(HeyGenService.class);

    private static final class CachedValue<T> {
        private final long createdAtMs;
        private final T value;

        private CachedValue(long createdAtMs, T value) {
            this.createdAtMs = createdAtMs;
            this.value = value;
        }
    }

    private final WebClient webClient;

    private final ObjectMapper objectMapper;

    private final String apiKey;

    private final long avatarCacheTtlMs;
    private final Duration heygenRequestTimeout;

    private volatile CachedValue<List<Map<String, Object>>> avatarCache;

    public HeyGenService(
            @Value("${heygen.api.base-url:https://api.heygen.com}") String baseUrl,
            @Value("${heygen.api.key:}") String apiKey,
            @Value("${heygen.api.timeout-seconds:30}") int timeoutSeconds,
            @Value("${heygen.api.avatar-cache-ttl-seconds:300}") int avatarCacheTtlSeconds,
            ObjectMapper objectMapper
    ) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.objectMapper = objectMapper;

        int effectiveTimeoutSeconds = timeoutSeconds <= 0 ? 30 : timeoutSeconds;
        int effectiveCacheTtlSeconds = avatarCacheTtlSeconds <= 0 ? 300 : avatarCacheTtlSeconds;
        this.heygenRequestTimeout = Duration.ofSeconds(effectiveTimeoutSeconds);
        this.avatarCacheTtlMs = effectiveCacheTtlSeconds * 1000L;

        String effectiveBaseUrl = baseUrl == null ? "" : baseUrl.trim();
        if (effectiveBaseUrl.isBlank()) {
            effectiveBaseUrl = "https://api.heygen.com";
        }
        // If a user sets HEYGEN_API_BASE_URL without scheme (e.g. 'api.heygen.com'), WebClient
        // will treat it as a path and default the host to localhost:80.
        if (!effectiveBaseUrl.regionMatches(true, 0, "http://", 0, "http://".length())
                && !effectiveBaseUrl.regionMatches(true, 0, "https://", 0, "https://".length())) {
            effectiveBaseUrl = "https://" + effectiveBaseUrl;
        }

        logger.info("[HEYGEN] Using base URL: {}", effectiveBaseUrl);

        int timeoutSecForHandlers = (int) Math.max(1L, heygenRequestTimeout.getSeconds());

        HttpClient httpClient = HttpClient.create()
            .compress(true)
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 10_000)
            .responseTimeout(heygenRequestTimeout)
            .doOnConnected(conn -> conn
                .addHandlerLast(new ReadTimeoutHandler(timeoutSecForHandlers))
                .addHandlerLast(new WriteTimeoutHandler(timeoutSecForHandlers))
            );

        WebClient.Builder builder = WebClient.builder()
                .baseUrl(effectiveBaseUrl)
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .exchangeStrategies(
                ExchangeStrategies.builder()
                .codecs(cfg -> cfg.defaultCodecs().maxInMemorySize(30 * 1024 * 1024))
                    .build()
            );

        // HeyGen requires an API key header (case can matter on some gateways).
        if (!this.apiKey.isBlank()) {
            builder.defaultHeader("X-API-KEY", this.apiKey);
        }

        this.webClient = builder.build();
    }

    private JsonNode parseJsonOrNull(String body) {
        if (body == null || body.isBlank()) {
            return NullNode.getInstance();
        }
        try {
            return objectMapper.readTree(body);
        } catch (JsonProcessingException e) {
            String snippet = body.length() > 500 ? body.substring(0, 500) + "..." : body;
            throw new RuntimeException("Failed to parse HeyGen JSON response: " + snippet, e);
        }
    }

    public List<Map<String, Object>> listAvatars() {
        CachedValue<List<Map<String, Object>>> cached = avatarCache;
        long now = System.currentTimeMillis();
        if (cached != null && (now - cached.createdAtMs) < avatarCacheTtlMs && cached.value != null && !cached.value.isEmpty()) {
            return deepCopyAvatarList(cached.value);
        }

        long startNs = System.nanoTime();
        try {
            String body = webClient.get()
                .uri("/v2/avatars")
                .retrieve()
                .bodyToMono(String.class)
                .timeout(heygenRequestTimeout)
                .block(heygenRequestTimeout);

            JsonNode root = parseJsonOrNull(body);

            List<Map<String, Object>> result = new ArrayList<>();

            if (root == null || root.isNull() || root.isMissingNode()) {
                return result;
            }

        JsonNode data = root.path("data");
        if (data.isMissingNode() || data.isNull()) {
            data = root;
        }

        // Some responses return data as an array.
        if (data.isArray()) {
            for (JsonNode a : data) {
                Map<String, Object> item = toAvatarOptionMap(a, null);
                if (item.get("avatar_id") != null) {
                    result.add(item);
                }
            }
            return result;
        }

        // V2 List Avatars returns both Avatars and Talking Photos (Photo Avatars).
        List<JsonNode> avatars = extractArray(root, "data", "avatars");
        for (JsonNode a : avatars) {
            Map<String, Object> item = toAvatarOptionMap(a, "avatar");
            if (item.get("avatar_id") != null) {
                result.add(item);
            }
        }

        List<JsonNode> talkingPhotos = extractArray(root, "data", "talking_photos");
        for (JsonNode a : talkingPhotos) {
            Map<String, Object> item = toAvatarOptionMap(a, "talking_photo");
            if (item.get("avatar_id") != null) {
                result.add(item);
            }
        }

        // Fallback for potential camelCase keys.
        List<JsonNode> talkingPhotosCamel = extractArray(root, "data", "talkingPhotos");
        for (JsonNode a : talkingPhotosCamel) {
            Map<String, Object> item = toAvatarOptionMap(a, "talking_photo");
            if (item.get("avatar_id") != null) {
                result.add(item);
            }
        }

            avatarCache = new CachedValue<>(System.currentTimeMillis(), deepCopyAvatarList(result));

            long tookMs = (System.nanoTime() - startNs) / 1_000_000L;
            logger.info("[HEYGEN] listAvatars: {} items in {} ms", result.size(), tookMs);
            return result;
        } catch (Exception e) {
            long tookMs = (System.nanoTime() - startNs) / 1_000_000L;
            logger.error("[HEYGEN] listAvatars failed after {} ms: {}", tookMs, e.toString());

            if (cached != null && cached.value != null && !cached.value.isEmpty()) {
                return deepCopyAvatarList(cached.value);
            }
            throw e;
        }
    }

    private static List<Map<String, Object>> deepCopyAvatarList(List<Map<String, Object>> list) {
        if (list == null || list.isEmpty()) {
            return new ArrayList<>();
        }
        List<Map<String, Object>> copy = new ArrayList<>(list.size());
        for (Map<String, Object> m : list) {
            copy.add(m == null ? null : new HashMap<>(m));
        }
        return copy;
    }

    public Map<String, Object> getAvatarById(String avatarId) {
        if (avatarId == null || avatarId.trim().isEmpty()) {
            return null;
        }

        String id = avatarId.trim();

        JsonNode root;
        try {
            root = webClient.get()
                    .uri("/v2/avatar/{avatar_id}/details", id)
                    .retrieve()
                    .bodyToMono(String.class)
                    .map(this::parseJsonOrNull)
                    .block();
        } catch (Exception e) {
            // Fallback: some avatar types may not support details endpoint.
            for (Map<String, Object> a : listAvatars()) {
                if (a == null) {
                    continue;
                }
                Object aid = a.get("avatar_id");
                if (aid != null && id.equals(String.valueOf(aid))) {
                    return a;
                }
            }
            return null;
        }

        if (root == null || root.isNull() || root.isMissingNode()) {
            return null;
        }

        JsonNode data = root.path("data");
        if (data.isMissingNode() || data.isNull()) {
            data = root;
        }

        // Some responses may wrap the avatar object.
        if (data.isObject()) {
            JsonNode inner = data.path("avatar");
            if (inner.isObject()) {
                data = inner;
            }
        }

        Map<String, Object> item = toAvatarOptionMap(data, null);
        if (item.get("avatar_id") == null) {
            return null;
        }

        // Try to populate thumbnail/preview from details payload (field names vary by avatar type).
        if (item.get("thumbnail_url") == null) {
            String url = findFirstUrlByKeyHints(data, new String[] { "thumbnail", "thumb", "image", "photo", "portrait", "avatar" });
            if (url != null && !url.isBlank()) {
                item.put("thumbnail_url", url);
            }
        }
        if (item.get("preview_url") == null) {
            String url = findFirstUrlByKeyHints(data, new String[] { "talking_preview", "preview", "video", "mp4", "webm" });
            if (url != null && !url.isBlank()) {
                item.put("preview_url", url);
            }
        }

        return item;
    }

    private static String findFirstUrlByKeyHints(JsonNode node, String[] keyHints) {
        if (node == null || node.isNull() || node.isMissingNode()) {
            return null;
        }

        if (node.isTextual()) {
            String s = node.textValue();
            return looksLikeUrl(s) ? s : null;
        }

        if (node.isArray()) {
            for (JsonNode child : node) {
                String found = findFirstUrlByKeyHints(child, keyHints);
                if (found != null) {
                    return found;
                }
            }
            return null;
        }

        if (node.isObject()) {
            for (Map.Entry<String, JsonNode> e : node.properties()) {
                String key = e.getKey() == null ? "" : e.getKey();
                JsonNode value = e.getValue();

                // Prefer matching keys.
                if (value != null && value.isTextual() && keyMatches(key, keyHints)) {
                    String s = value.textValue();
                    if (looksLikeUrl(s)) {
                        return s;
                    }
                }
            }

            // Fallback: deep scan.
            for (Map.Entry<String, JsonNode> e : node.properties()) {
                String found = findFirstUrlByKeyHints(e.getValue(), keyHints);
                if (found != null) {
                    return found;
                }
            }
        }

        return null;
    }

    private static boolean keyMatches(String key, String[] hints) {
        if (key == null) {
            return false;
        }
        String k = key.toLowerCase(java.util.Locale.ROOT);
        if (hints != null) {
            for (String h : hints) {
                if (h == null || h.isBlank()) {
                    continue;
                }
                if (k.contains(h.toLowerCase(java.util.Locale.ROOT))) {
                    return true;
                }
            }
        }
        return false;
    }

    private static boolean looksLikeUrl(String s) {
        if (s == null) {
            return false;
        }
        String t = s.trim();
        return (t.startsWith("http://") || t.startsWith("https://")) && t.length() > 10;
    }

    private static Map<String, Object> toAvatarOptionMap(JsonNode a, String fallbackType) {
        Map<String, Object> item = new HashMap<>();

        String id = firstNonBlank(
                textOrNull(a, "avatar_id"),
                textOrNull(a, "talking_photo_id"),
                textOrNull(a, "photo_avatar_id"),
                textOrNull(a, "id")
        );
        item.put("avatar_id", id);

        String displayName = firstNonBlank(
                textOrNull(a, "display_name"),
                textOrNull(a, "avatar_name"),
                textOrNull(a, "name")
        );
        item.put("display_name", displayName);
        item.put("avatar_name", textOrNull(a, "avatar_name"));
        item.put("gender", textOrNull(a, "gender"));

        String thumbnailUrl = firstNonBlank(
                textOrNull(a, "thumbnail_url"),
            textOrNull(a, "preview_image_url"),
                textOrNull(a, "thumbnail"),
                textOrNull(a, "thumbnailUrl")
        );
        item.put("thumbnail_url", thumbnailUrl);

        String previewUrl = firstNonBlank(
                textOrNull(a, "preview_url"),
            textOrNull(a, "preview_video_url"),
                textOrNull(a, "preview"),
                textOrNull(a, "previewUrl")
        );
        item.put("preview_url", previewUrl);

        item.put("is_public", boolOrNull(a, "is_public"));
        Boolean isPremium = boolOrNull(a, "is_premium");
        if (isPremium == null) {
            isPremium = boolOrNull(a, "premium");
        }
        item.put("is_premium", isPremium);

        String type = firstNonBlank(textOrNull(a, "type"), fallbackType);
        item.put("type", type);

        return item;
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v;
            }
        }
        return null;
    }

    public List<Map<String, Object>> listVoices() {
        String body = webClient.get()
            .uri("/v2/voices")
            .retrieve()
            .bodyToMono(String.class)
            .block();

        JsonNode root = parseJsonOrNull(body);

        List<JsonNode> voices = extractArray(root, "data", "voices");
        List<Map<String, Object>> result = new ArrayList<>();

        for (JsonNode v : voices) {
            Map<String, Object> item = new HashMap<>();
            item.put("voice_id", textOrNull(v, "voice_id"));
            item.put("display_name", textOrNull(v, "display_name"));
            item.put("locale", textOrNull(v, "locale"));
            item.put("gender", textOrNull(v, "gender"));
            item.put("is_premium", boolOrNull(v, "is_premium"));
            item.put("type", textOrNull(v, "type"));
            result.add(item);
        }

        return result;
    }

    public Map<String, Object> generateAvatarVideo(
            String avatarId,
            String voiceId,
            String inputText,
            Integer width,
            Integer height,
            boolean greenScreenBackground,
            String title,
            String callbackUrl
    ) {
        if (avatarId == null || avatarId.trim().isEmpty()) {
            throw new IllegalArgumentException("avatarId is required");
        }
        if (inputText == null || inputText.trim().isEmpty()) {
            throw new IllegalArgumentException("inputText is required");
        }

        String trimmedText = inputText.trim();
        if (trimmedText.length() > 5000) {
            trimmedText = trimmedText.substring(0, 5000);
        }

        String effectiveVoiceId = (voiceId == null || voiceId.trim().isEmpty()) ? null : voiceId.trim();
        if (effectiveVoiceId == null) {
            // Some HeyGen accounts/avatars require a voice_id for text-based generation.
            effectiveVoiceId = resolveDefaultVoiceIdForAvatar(avatarId.trim());
        }

        Map<String, Object> character = new HashMap<>();
        character.put("type", "avatar");
        character.put("avatar_id", avatarId.trim());
        character.put("avatar_style", "normal");

        Map<String, Object> voice = new HashMap<>();
        voice.put("type", "text");
        voice.put("input_text", trimmedText);
        if (effectiveVoiceId != null && !effectiveVoiceId.isBlank()) {
            voice.put("voice_id", effectiveVoiceId);
        }

        Map<String, Object> background = new HashMap<>();
        background.put("type", "color");
        // Use a standard chroma key green for more predictable results.
        background.put("value", greenScreenBackground ? "#00FF00" : "#FFFFFF");

        Map<String, Object> videoInput = new HashMap<>();
        videoInput.put("character", character);
        videoInput.put("voice", voice);
        videoInput.put("background", background);

        Map<String, Object> body = new HashMap<>();
        body.put("caption", false);
        if (title != null && !title.trim().isEmpty()) {
            body.put("title", title.trim());
        }
        if (callbackUrl != null && !callbackUrl.trim().isEmpty()) {
            body.put("callback_url", callbackUrl.trim());
        }
        body.put("video_inputs", List.of(videoInput));
        if (width != null && height != null && width > 0 && height > 0) {
            Map<String, Object> dimension = new HashMap<>();
            dimension.put("width", width);
            dimension.put("height", height);
            body.put("dimension", dimension);
        }

        JsonNode root;
        try {
            root = postGenerate(body);
        } catch (WebClientResponseException e) {
            int status = e.getStatusCode() == null ? -1 : e.getStatusCode().value();

            // Retry once with a fallback voice_id if none was provided/resolved.
            if (status == 400 && (effectiveVoiceId == null || effectiveVoiceId.isBlank())) {
                String fallbackVoiceId = pickFallbackVoiceId();
                if (fallbackVoiceId != null && !fallbackVoiceId.isBlank()) {
                    voice.put("voice_id", fallbackVoiceId);
                    try {
                        root = postGenerate(body);
                    } catch (WebClientResponseException e2) {
                        throw toDetailedException(e2);
                    }
                } else {
                    throw toDetailedException(e);
                }
            } else {
                throw toDetailedException(e);
            }
        }

        Map<String, Object> result = new HashMap<>();

        String videoId = null;
        if (root != null) {
            if (root.hasNonNull("data")) {
                videoId = textOrNull(root.path("data"), "video_id");
            }
            if (videoId == null) {
                videoId = textOrNull(root, "video_id");
            }
        }

        result.put("video_id", videoId);
        return result;
    }

    private JsonNode postGenerate(Map<String, Object> body) {
        return webClient.post()
                .uri("/v2/video/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .map(this::parseJsonOrNull)
                .block();
    }

    private RuntimeException toDetailedException(WebClientResponseException e) {
        String resp = e.getResponseBodyAsString();
        String snippet = resp == null ? "" : (resp.length() > 1200 ? resp.substring(0, 1200) + "..." : resp);
        int status = e.getStatusCode() == null ? -1 : e.getStatusCode().value();
        return new RuntimeException("HeyGen video generation failed: HTTP " + status + " - " + snippet, e);
    }

    private String pickFallbackVoiceId() {
        try {
            List<Map<String, Object>> voices = listVoices();
            if (voices == null || voices.isEmpty()) {
                return null;
            }
            for (Map<String, Object> v : voices) {
                if (v == null) {
                    continue;
                }
                Object id = v.get("voice_id");
                if (id != null && !String.valueOf(id).isBlank()) {
                    return String.valueOf(id);
                }
            }
            return null;
        } catch (Exception ignore) {
            return null;
        }
    }

    private String resolveDefaultVoiceIdForAvatar(String avatarId) {
        if (avatarId == null || avatarId.isBlank()) {
            return null;
        }

        try {
            String body = webClient.get()
                    .uri("/v2/avatar/{avatar_id}/details", avatarId.trim())
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            JsonNode root = parseJsonOrNull(body);
            if (root == null || root.isNull() || root.isMissingNode()) {
                return null;
            }

            JsonNode data = root.path("data");
            if (data.isMissingNode() || data.isNull()) {
                data = root;
            }

            String id = firstNonBlank(
                    findTextRecursive(data, "default_voice_id"),
                    findTextRecursive(data, "defaultVoiceId")
            );
            return (id == null || id.isBlank()) ? null : id;
        } catch (Exception ignore) {
            return null;
        }
    }

    private static String findTextRecursive(JsonNode node, String targetField) {
        if (node == null || node.isNull() || node.isMissingNode() || targetField == null || targetField.isBlank()) {
            return null;
        }

        if (node.isObject()) {
            JsonNode direct = node.get(targetField);
            if (direct != null && direct.isTextual()) {
                String s = direct.textValue();
                if (s != null && !s.isBlank()) {
                    return s;
                }
            }

            for (Map.Entry<String, JsonNode> e : node.properties()) {
                String found = findTextRecursive(e.getValue(), targetField);
                if (found != null) {
                    return found;
                }
            }
            return null;
        }

        if (node.isArray()) {
            for (JsonNode child : node) {
                String found = findTextRecursive(child, targetField);
                if (found != null) {
                    return found;
                }
            }
        }

        return null;
    }

    public Map<String, Object> getVideoStatus(String videoId) {
        if (videoId == null || videoId.trim().isEmpty()) {
            throw new IllegalArgumentException("videoId is required");
        }

        JsonNode root = webClient.get()
            .uri(uriBuilder -> uriBuilder
                    .path("/v1/video_status.get")
                    .queryParam("video_id", videoId.trim())
                    .build())
            .retrieve()
            .bodyToMono(String.class)
            .map(this::parseJsonOrNull)
            .block();

        Map<String, Object> result = new HashMap<>();

        JsonNode data = root == null ? null : (root.hasNonNull("data") ? root.path("data") : root);
        if (data != null) {
            result.put("status", textOrNull(data, "status"));
            result.put("video_url", textOrNull(data, "video_url"));
            result.put("thumbnail_url", textOrNull(data, "thumbnail_url"));
            result.put("video_url_caption", textOrNull(data, "video_url_caption"));
            result.put("error", textOrNull(data, "error"));
        }

        return result;
    }

    private static List<JsonNode> extractArray(JsonNode root, String firstChoiceField, String secondChoiceField) {
        if (root == null) {
            return List.of();
        }

        JsonNode node = root.path(firstChoiceField);
        if (node.isMissingNode() || node.isNull()) {
            node = root;
        }

        if (node.isArray()) {
            return toList(node);
        }

        JsonNode inner = node.path(secondChoiceField);
        if (inner.isArray()) {
            return toList(inner);
        }

        return List.of();
    }

    private static List<JsonNode> toList(JsonNode arrayNode) {
        List<JsonNode> list = new ArrayList<>();
        for (JsonNode n : arrayNode) {
            list.add(n);
        }
        return list;
    }

    private static String textOrNull(JsonNode node, String field) {
        if (node == null) {
            return null;
        }
        JsonNode v = node.get(field);
        if (v == null || v.isNull() || v.isMissingNode()) {
            return null;
        }
        String s = v.asText();
        return (s == null || s.isBlank()) ? null : s;
    }

    private static Boolean boolOrNull(JsonNode node, String field) {
        if (node == null) {
            return null;
        }
        JsonNode v = node.get(field);
        if (v == null || v.isNull() || v.isMissingNode()) {
            return null;
        }
        if (v.isBoolean()) {
            return v.booleanValue();
        }
        if (v.isTextual()) {
            String s = v.textValue();
            if (s == null || s.isBlank()) {
                return null;
            }
            String t = s.trim();
            if (t.equalsIgnoreCase("true")) {
                return Boolean.TRUE;
            }
            if (t.equalsIgnoreCase("false")) {
                return Boolean.FALSE;
            }
            return null;
        }

        return v.asBoolean();
    }

}
