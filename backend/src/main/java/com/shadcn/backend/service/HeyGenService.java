package com.shadcn.backend.service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import reactor.netty.http.client.HttpClient;
import reactor.netty.tcp.SslProvider;

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

    private final int connectTimeoutMs;
    private final int sslHandshakeTimeoutMs;

    private final boolean includePublicAvatars;
    private final boolean includePremiumAvatars;
    private final boolean useAvatarGroupsForOwned;
    private final boolean fallbackToAllIfOwnedEmpty;

    private final boolean onlyVideoAvatars;
    private final int maxAvatarResults;
    private final boolean excludePublicHints;

    private volatile CachedValue<List<Map<String, Object>>> avatarCacheOwned;
    private volatile CachedValue<List<Map<String, Object>>> avatarCacheAll;

    public HeyGenService(
            @Value("${heygen.api.base-url:https://api.heygen.com}") String baseUrl,
            @Value("${heygen.api.key:}") String apiKey,
            @Value("${heygen.api.timeout-seconds:30}") int timeoutSeconds,
            @Value("${heygen.api.connect-timeout-ms:10000}") int connectTimeoutMs,
            @Value("${heygen.api.ssl-handshake-timeout-ms:10000}") int sslHandshakeTimeoutMs,
            @Value("${heygen.api.avatar-cache-ttl-seconds:300}") int avatarCacheTtlSeconds,
            @Value("${heygen.api.avatars.include-public:false}") boolean includePublicAvatars,
            @Value("${heygen.api.avatars.include-premium:false}") boolean includePremiumAvatars,
            @Value("${heygen.api.avatars.use-groups:true}") boolean useAvatarGroupsForOwned,
                @Value("${heygen.api.avatars.fallback-to-all-if-owned-empty:true}") boolean fallbackToAllIfOwnedEmpty,
            @Value("${heygen.api.avatars.only-video-avatars:true}") boolean onlyVideoAvatars,
            @Value("${heygen.api.avatars.max-results:200}") int maxAvatarResults,
                @Value("${heygen.api.avatars.exclude-public-hints:true}") boolean excludePublicHints,
            ObjectMapper objectMapper
    ) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.objectMapper = objectMapper;

        int effectiveTimeoutSeconds = timeoutSeconds <= 0 ? 30 : timeoutSeconds;
        int effectiveCacheTtlSeconds = avatarCacheTtlSeconds <= 0 ? 300 : avatarCacheTtlSeconds;
        this.heygenRequestTimeout = Duration.ofSeconds(effectiveTimeoutSeconds);
        this.avatarCacheTtlMs = effectiveCacheTtlSeconds * 1000L;

        int computedConnectTimeoutMs = connectTimeoutMs <= 0 ? 10_000 : connectTimeoutMs;
        long requestTimeoutMs = Math.max(1_000L, this.heygenRequestTimeout.toMillis());
        if (computedConnectTimeoutMs > requestTimeoutMs) {
            computedConnectTimeoutMs = (int) Math.min(Integer.MAX_VALUE, requestTimeoutMs);
        }
        this.connectTimeoutMs = computedConnectTimeoutMs;

        int computedHandshakeTimeoutMs = sslHandshakeTimeoutMs <= 0 ? 10_000 : sslHandshakeTimeoutMs;
        if (computedHandshakeTimeoutMs > requestTimeoutMs) {
            computedHandshakeTimeoutMs = (int) Math.min(Integer.MAX_VALUE, requestTimeoutMs);
        }
        this.sslHandshakeTimeoutMs = computedHandshakeTimeoutMs;

        this.includePublicAvatars = includePublicAvatars;
        this.includePremiumAvatars = includePremiumAvatars;
        this.useAvatarGroupsForOwned = useAvatarGroupsForOwned;
        this.fallbackToAllIfOwnedEmpty = fallbackToAllIfOwnedEmpty;

        this.onlyVideoAvatars = onlyVideoAvatars;
        this.maxAvatarResults = maxAvatarResults <= 0 ? Integer.MAX_VALUE : maxAvatarResults;
        this.excludePublicHints = excludePublicHints;

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

        SslProvider.Builder sslBuilder = SslProvider.builder()
            .sslContext(SslProvider.defaultClientProvider().getSslContext());
        sslBuilder.handshakeTimeoutMillis(this.sslHandshakeTimeoutMs);
        SslProvider sslProvider = sslBuilder.build();

        HttpClient httpClient = HttpClient.create()
            .compress(true)
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, this.connectTimeoutMs)
            .secure(sslProvider)
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

        if (!this.apiKey.isBlank()) {
            CompletableFuture.runAsync(() -> {
                try {
                    listAvatarsInternal(false);
                } catch (Exception ignore) {
                }
            });
        }
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
        return listAvatarsInternal(includePublicAvatars || includePremiumAvatars);
    }

    public List<Map<String, Object>> listAllAvatars() {
        return listAvatarsInternal(true);
    }

    private List<Map<String, Object>> listAvatarsInternal(boolean includeAll) {
        CachedValue<List<Map<String, Object>>> cached = includeAll ? avatarCacheAll : avatarCacheOwned;
        long now = System.currentTimeMillis();
        if (cached != null && (now - cached.createdAtMs) < avatarCacheTtlMs && cached.value != null && !cached.value.isEmpty()) {
            return deepCopyAvatarList(cached.value);
        }

        long startNs = System.nanoTime();
        try {
            if (includeAll) {
                List<Map<String, Object>> all = fetchAllAvatarsFromV2();
                List<Map<String, Object>> owned = filterOwnedAvatars(all);

                long cachedAtMs = System.currentTimeMillis();
                avatarCacheAll = new CachedValue<>(cachedAtMs, deepCopyAvatarList(all));
                avatarCacheOwned = new CachedValue<>(cachedAtMs, deepCopyAvatarList(owned));

                long tookMs = (System.nanoTime() - startNs) / 1_000_000L;
                logger.info("[HEYGEN] listAvatars: {} items (includeAll=true) in {} ms", all.size(), tookMs);
                return all;
            }

            List<Map<String, Object>> ownedFromGroups = null;
            if (useAvatarGroupsForOwned) {
                try {
                    ownedFromGroups = fetchOwnedAvatarsFromGroups();
                } catch (Exception e) {
                    logger.warn("[HEYGEN] avatar groups listing failed, falling back to /v2/avatars: {}", e.toString());
                }
            }

            if (ownedFromGroups != null && !ownedFromGroups.isEmpty()) {
                long cachedAtMs = System.currentTimeMillis();
                List<Map<String, Object>> normalized = normalizeAvatarResults(ownedFromGroups);
                avatarCacheOwned = new CachedValue<>(cachedAtMs, deepCopyAvatarList(normalized));

                long tookMs = (System.nanoTime() - startNs) / 1_000_000L;
                logger.info("[HEYGEN] listAvatars: {} items (owned via groups) in {} ms", normalized.size(), tookMs);
                return normalized;
            }

            List<Map<String, Object>> owned = fetchOwnedAvatarsFromV2();
            if (owned == null || owned.isEmpty()) {
                boolean strictOwnedOnly = useAvatarGroupsForOwned
                        && !includePublicAvatars
                        && !includePremiumAvatars
                        && !fallbackToAllIfOwnedEmpty;
                if (!strictOwnedOnly) {
                    List<Map<String, Object>> all = fetchAllAvatarsFromV2();
                    owned = filterOwnedAvatars(all);
                    if ((owned == null || owned.isEmpty()) && fallbackToAllIfOwnedEmpty) {
                        owned = all;
                    }
                }
            }

            if (owned == null) {
                owned = new ArrayList<>();
            }

            List<Map<String, Object>> normalized = normalizeAvatarResults(owned);

            long cachedAtMs = System.currentTimeMillis();
            avatarCacheOwned = new CachedValue<>(cachedAtMs, deepCopyAvatarList(normalized));

            long tookMs = (System.nanoTime() - startNs) / 1_000_000L;
            logger.info("[HEYGEN] listAvatars: {} items (owned via filter fallback) in {} ms", normalized.size(), tookMs);
            return normalized;
        } catch (Exception e) {
            long tookMs = (System.nanoTime() - startNs) / 1_000_000L;
            logger.error("[HEYGEN] listAvatars failed after {} ms: {}", tookMs, e.toString());

            if (cached != null && cached.value != null && !cached.value.isEmpty()) {
                return deepCopyAvatarList(cached.value);
            }
            throw e;
        }
    }

    private List<Map<String, Object>> normalizeAvatarResults(List<Map<String, Object>> avatars) {
        if (avatars == null || avatars.isEmpty()) {
            return new ArrayList<>();
        }

        List<Map<String, Object>> out = new ArrayList<>(avatars.size());
        for (Map<String, Object> a : avatars) {
            if (a == null) {
                continue;
            }

            if (onlyVideoAvatars) {
                Object type = a.get("type");
                String t = type == null ? "" : String.valueOf(type).trim().toLowerCase(java.util.Locale.ROOT);
                if (!t.isEmpty() && !t.equals("avatar")) {
                    continue;
                }
            }

            if (!includePublicAvatars && excludePublicHints && isLikelyPublicByHint(a)) {
                continue;
            }

            out.add(a);
            if (out.size() >= maxAvatarResults) {
                break;
            }
        }

        return out;
    }

    private static boolean isLikelyPublicByHint(Map<String, Object> a) {
        if (a == null) {
            return false;
        }
        String id = a.get("avatar_id") == null ? "" : String.valueOf(a.get("avatar_id"));
        String display = a.get("display_name") == null ? "" : String.valueOf(a.get("display_name"));
        String name = a.get("avatar_name") == null ? "" : String.valueOf(a.get("avatar_name"));
        String combined = (id + " " + display + " " + name).toLowerCase(java.util.Locale.ROOT);
        return combined.contains("_public_") || combined.contains(" public ") || combined.contains("public_") || combined.contains("_public") || combined.contains("public");
    }

    private List<Map<String, Object>> fetchOwnedAvatarsFromV2() {
        String body = webClient.get()
            .uri("/v2/avatars")
            .retrieve()
            .bodyToMono(String.class)
            .timeout(heygenRequestTimeout)
            .block(heygenRequestTimeout);

        JsonNode root = parseJsonOrNull(body);
        if (root == null || root.isNull() || root.isMissingNode()) {
            return new ArrayList<>();
        }

        List<JsonNode> privateAvatars = new ArrayList<>();
        privateAvatars.addAll(extractArray(root, "data", "private_avatars"));
        privateAvatars.addAll(extractArray(root, "data", "privateAvatars"));
        privateAvatars.addAll(extractArray(root, "data", "owned_avatars"));
        privateAvatars.addAll(extractArray(root, "data", "my_avatars"));
        privateAvatars.addAll(extractArray(root, "data", "avatars_private"));

        if (privateAvatars.isEmpty()) {
            privateAvatars.addAll(extractArray(root, "data", "private"));
            privateAvatars.addAll(extractArray(root, "data", "owned"));
        }

        if (privateAvatars.isEmpty()) {
            return new ArrayList<>();
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (JsonNode a : privateAvatars) {
            Map<String, Object> item = toAvatarOptionMap(a, "avatar");
            if (item.get("avatar_id") != null) {
                result.add(item);
            }
        }

        return filterOwnedAvatars(result);
    }

    private List<Map<String, Object>> fetchAllAvatarsFromV2() {
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

        if (!result.isEmpty()) {
            return result;
        }

        // Ultra fallback: scan response for avatar-like objects.
        List<JsonNode> candidates = new ArrayList<>();
        collectAvatarCandidates(root, candidates, 0);
        if (candidates.isEmpty()) {
            return result;
        }

        LinkedHashMap<String, Map<String, Object>> byId = new LinkedHashMap<>();
        for (JsonNode a : candidates) {
            Map<String, Object> item = toAvatarOptionMap(a, null);
            Object id = item.get("avatar_id");
            if (id == null) {
                continue;
            }
            byId.putIfAbsent(String.valueOf(id), item);
        }
        return new ArrayList<>(byId.values());
    }

    private static void collectAvatarCandidates(JsonNode node, List<JsonNode> out, int depth) {
        if (node == null || node.isNull() || node.isMissingNode()) {
            return;
        }
        if (depth > 10) {
            return;
        }

        if (node.isArray()) {
            for (JsonNode child : node) {
                collectAvatarCandidates(child, out, depth + 1);
            }
            return;
        }

        if (!node.isObject()) {
            return;
        }

        boolean hasId = node.hasNonNull("avatar_id")
                || node.hasNonNull("talking_photo_id")
                || node.hasNonNull("photo_avatar_id")
                || node.hasNonNull("id");

        boolean hasName = node.hasNonNull("display_name")
                || node.hasNonNull("avatar_name")
                || node.hasNonNull("name");

        if (hasId && hasName) {
            out.add(node);
        }

        for (Map.Entry<String, JsonNode> e : node.properties()) {
            collectAvatarCandidates(e.getValue(), out, depth + 1);
        }
    }

    private List<Map<String, Object>> fetchOwnedAvatarsFromGroups() {
        String groupBody = webClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/v2/avatar_group.list")
                .queryParam("include_public", false)
                .build())
            .retrieve()
            .bodyToMono(String.class)
            .timeout(heygenRequestTimeout)
            .block(heygenRequestTimeout);

        JsonNode groupRoot = parseJsonOrNull(groupBody);

        List<JsonNode> groups = extractArray(groupRoot, "data", "avatar_group_list");
        if (groups.isEmpty()) {
            groups = extractArray(groupRoot, "data", "avatar_groups");
        }
        if (groups.isEmpty()) {
            groups = extractArray(groupRoot, "data", "groups");
        }
        if (groups.isEmpty()) {
            groups = extractArray(groupRoot, "avatar_group_list");
        }
        if (groups.isEmpty()) {
            groups = extractArray(groupRoot, "avatar_groups");
        }

        List<String> groupIds = new ArrayList<>();
        for (JsonNode g : groups) {
            String groupType = textOrNull(g, "group_type");
            if (!includePublicAvatars && groupType != null && !groupType.isBlank()) {
                String t = groupType.trim().toUpperCase(java.util.Locale.ROOT);
                if ("PUBLIC".equals(t)) {
                    continue;
                }
            }

            String gid = firstNonBlank(
                textOrNull(g, "group_id"),
                textOrNull(g, "avatar_group_id"),
                textOrNull(g, "id")
            );
            if (gid != null && !gid.isBlank()) {
                groupIds.add(gid);
            }
        }

        if (groupIds.isEmpty()) {
            return new ArrayList<>();
        }

        LinkedHashMap<String, Map<String, Object>> byId = new LinkedHashMap<>();
        for (String groupId : groupIds) {
            String body = webClient.get()
                .uri("/v2/avatar_group/{group_id}/avatars", groupId)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(heygenRequestTimeout)
                .block(heygenRequestTimeout);

            JsonNode root = parseJsonOrNull(body);
            if (root == null || root.isNull() || root.isMissingNode()) {
                continue;
            }

            JsonNode data = root.path("data");
            if (data.isMissingNode() || data.isNull()) {
                data = root;
            }

            List<JsonNode> avatars;
            if (data.isArray()) {
                avatars = toList(data);
            } else {
                avatars = extractArray(root, "data", "avatar_list");
                if (avatars.isEmpty()) {
                    avatars = extractArray(root, "data", "avatars");
                }
                if (avatars.isEmpty()) {
                    avatars = extractArray(root, "data", "data");
                }
                if (avatars.isEmpty()) {
                    avatars = extractArray(root, "avatar_list");
                }
            }

            for (JsonNode a : avatars) {
                Map<String, Object> item = toAvatarOptionMap(a, "avatar");
                Object aid = item.get("avatar_id");
                if (aid == null) {
                    continue;
                }
                String key = String.valueOf(aid);
                byId.putIfAbsent(key, item);
            }
        }

        return new ArrayList<>(byId.values());
    }

    private List<Map<String, Object>> filterOwnedAvatars(List<Map<String, Object>> avatars) {
        if (avatars == null || avatars.isEmpty()) {
            return new ArrayList<>();
        }

        List<Map<String, Object>> filtered = new ArrayList<>(avatars.size());
        for (Map<String, Object> a : avatars) {
            if (a == null) {
                continue;
            }

            Boolean isPublic = (a.get("is_public") instanceof Boolean) ? (Boolean) a.get("is_public") : null;
            Boolean isPremium = (a.get("is_premium") instanceof Boolean) ? (Boolean) a.get("is_premium") : null;

            if (!includePublicAvatars && Boolean.TRUE.equals(isPublic)) {
                continue;
            }
            if (!includePremiumAvatars && Boolean.TRUE.equals(isPremium)) {
                continue;
            }

            filtered.add(a);
        }

        return filtered;
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
            for (Map<String, Object> a : listAllAvatars()) {
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

        Boolean isPublic = inferIsPublic(a);
        item.put("is_public", isPublic);

        Boolean isPremium = inferIsPremium(a);
        item.put("is_premium", isPremium);

        String type = firstNonBlank(textOrNull(a, "type"), fallbackType);
        item.put("type", type);

        return item;
    }

    private static Boolean inferIsPublic(JsonNode node) {
        if (node == null) {
            return null;
        }

        Boolean isPublic = boolOrNull(node, "is_public");
        if (isPublic == null) {
            isPublic = boolOrNull(node, "isPublic");
        }
        if (isPublic == null) {
            isPublic = boolOrNull(node, "public");
        }
        if (isPublic != null) {
            return isPublic;
        }

        Boolean isPrivate = boolOrNull(node, "is_private");
        if (isPrivate == null) {
            isPrivate = boolOrNull(node, "isPrivate");
        }
        if (isPrivate == null) {
            isPrivate = boolOrNull(node, "private");
        }
        if (Boolean.TRUE.equals(isPrivate)) {
            return Boolean.FALSE;
        }

        String access = firstNonBlank(textOrNull(node, "access"), textOrNull(node, "visibility"), textOrNull(node, "scope"));
        if (access != null) {
            String v = access.trim().toLowerCase(java.util.Locale.ROOT);
            if ("public".equals(v)) {
                return Boolean.TRUE;
            }
            if ("private".equals(v) || "owned".equals(v)) {
                return Boolean.FALSE;
            }
        }

        return null;
    }

    private static Boolean inferIsPremium(JsonNode node) {
        if (node == null) {
            return null;
        }

        Boolean isPremium = boolOrNull(node, "is_premium");
        if (isPremium == null) {
            isPremium = boolOrNull(node, "isPremium");
        }
        if (isPremium == null) {
            isPremium = boolOrNull(node, "premium");
        }
        if (isPremium != null) {
            return isPremium;
        }

        String tier = firstNonBlank(textOrNull(node, "tier"), textOrNull(node, "plan"), textOrNull(node, "category"));
        if (tier != null) {
            String v = tier.trim().toLowerCase(java.util.Locale.ROOT);
            if (v.contains("premium") || v.contains("pro") || v.contains("enterprise")) {
                return Boolean.TRUE;
            }
        }

        return null;
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
        Map<String, Object> dimension = new HashMap<>();
        dimension.put("width", 720);
        dimension.put("height", 1280);
        body.put("dimension", dimension);

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

    public Map<String, Object> createVideoTranslation(String videoUrl, String outputLanguage) {
        if (videoUrl == null || videoUrl.trim().isEmpty()) {
            throw new IllegalArgumentException("videoUrl is required");
        }
        if (outputLanguage == null || outputLanguage.trim().isEmpty()) {
            throw new IllegalArgumentException("outputLanguage is required");
        }

        String normalizedOutputLanguage = normalizeHeyGenOutputLanguage(outputLanguage);

        Map<String, Object> body = new HashMap<>();
        body.put("video_url", videoUrl.trim());
        body.put("output_language", normalizedOutputLanguage);

        JsonNode root = webClient.post()
                .uri("/v2/video_translate")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .map(this::parseJsonOrNull)
                .timeout(heygenRequestTimeout)
                .block(heygenRequestTimeout);

        JsonNode data = root == null ? null : (root.hasNonNull("data") ? root.path("data") : root);

        Map<String, Object> result = new HashMap<>();
        if (data != null) {
            String id = firstNonBlank(
                    textOrNull(data, "video_translate_id"),
                    textOrNull(data, "videoTranslateId"),
                    textOrNull(data, "id")
            );
            result.put("video_translate_id", id);
            result.put("status", textOrNull(data, "status"));
            result.put("video_url", textOrNull(data, "video_url"));
            result.put("error", textOrNull(data, "error"));
        }
        return result;
    }

    private static String normalizeHeyGenOutputLanguage(String outputLanguage) {
        String v = outputLanguage == null ? null : outputLanguage.trim();
        if (v == null || v.isBlank()) {
            throw new IllegalArgumentException("outputLanguage is required");
        }

        String key = v.toLowerCase(java.util.Locale.ROOT);
        String primary = key;
        int dash = key.indexOf('-');
        if (dash > 0) {
            primary = key.substring(0, dash);
        }

        if (key.equals("english") || key.contains("english") || primary.equals("en")) {
            return "English";
        }

        if (key.equals("indonesian") || key.contains("indonesia") || key.contains("bahasa") || primary.equals("id") || primary.equals("in")) {
            return "Indonesian";
        }

        if (key.equals("japanese") || key.contains("japan") || key.contains("jepan") || primary.equals("ja") || primary.equals("jp")) {
            return "Japanese";
        }

        if (key.equals("thai") || key.contains("thailand") || primary.equals("th")) {
            return "Thai";
        }

        if (key.equals("vietnamese") || key.contains("viet") || key.contains("vietname") || primary.equals("vi")) {
            return "Vietnamese";
        }

        if (key.equals("khmer") || key.contains("khmer") || key.contains("khamer") || primary.equals("km")) {
            return "Khmer";
        }

        if (key.equals("chinese") || key.contains("china") || key.contains("mandarin") || primary.equals("zh") || primary.equals("cn")) {
            return "Chinese";
        }

        return v;
    }

    public Map<String, Object> getVideoTranslationStatus(String videoTranslateId) {
        if (videoTranslateId == null || videoTranslateId.trim().isEmpty()) {
            throw new IllegalArgumentException("videoTranslateId is required");
        }

        JsonNode root = webClient.get()
                .uri("/v2/video_translate/{video_translate_id}", videoTranslateId.trim())
                .retrieve()
                .bodyToMono(String.class)
                .map(this::parseJsonOrNull)
                .timeout(heygenRequestTimeout)
                .block(heygenRequestTimeout);

        JsonNode data = root == null ? null : (root.hasNonNull("data") ? root.path("data") : root);
        Map<String, Object> result = new HashMap<>();
        if (data != null) {
            String status = firstNonBlank(
                    textOrNull(data, "status"),
                    findTextRecursive(data, "status"),
                    root == null ? null : textOrNull(root, "status"),
                    findTextRecursive(root, "status")
            );
                String videoUrl = firstNonBlank(
                    textOrNull(data, "video_url"),
                    textOrNull(data, "url"),
                    findTextRecursive(data, "video_url"),
                    findTextRecursive(data, "url"),
                    root == null ? null : textOrNull(root, "video_url"),
                    root == null ? null : textOrNull(root, "url"),
                    findTextRecursive(root, "video_url"),
                    findTextRecursive(root, "url")
                );
            String err = firstNonBlank(
                    textOrNull(data, "error"),
                    findTextRecursive(data, "error"),
                    root == null ? null : textOrNull(root, "error"),
                    findTextRecursive(root, "error"),
                    root == null ? null : textOrNull(root, "message"),
                    findTextRecursive(root, "message"),
                    root == null ? null : textOrNull(root, "msg")
            );

            result.put("status", status);
            result.put("video_url", videoUrl);
            result.put("error", err);
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

    private static List<JsonNode> extractArray(JsonNode root, String field) {
        if (root == null || field == null || field.isBlank()) {
            return List.of();
        }
        JsonNode node = root.path(field);
        if (node.isArray()) {
            return toList(node);
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
