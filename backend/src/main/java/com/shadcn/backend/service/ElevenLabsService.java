package com.shadcn.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadcn.backend.model.DIDAvatar;
import com.shadcn.backend.repository.DIDAvatarRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;
import jakarta.annotation.PostConstruct;

@Service
public class ElevenLabsService {
    private static final Logger logger = LoggerFactory.getLogger(ElevenLabsService.class);

    private static final Duration TIMEOUT = Duration.ofSeconds(45);

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final DIDAvatarRepository didAvatarRepository;

    @Value("${elevenlabs.api.key:}")
    private String apiKey;

    @Value("${elevenlabs.tts.model:eleven_multilingual_v2}")
    private String ttsModel;

    @Value("${elevenlabs.tts.output-format:mp3_22050_32}")
    private String outputFormat;

    @Value("${elevenlabs.tts.max-concurrency:3}")
    private int maxConcurrency;

    @Value("${elevenlabs.tts.acquire-timeout-ms:60000}")
    private long acquireTimeoutMs;

    private final ConcurrentHashMap<String, String> voiceIdCacheByPresenterId = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> samplePathCache = new ConcurrentHashMap<>();
    private volatile Semaphore concurrencySemaphore;

    public ElevenLabsService(ObjectMapper objectMapper, DIDAvatarRepository didAvatarRepository) {
        this.objectMapper = objectMapper;
        this.didAvatarRepository = didAvatarRepository;
        this.webClient = WebClient.builder()
                .baseUrl("https://api.elevenlabs.io/v1")
                .build();
    }

    @PostConstruct
    void initConcurrency() {
        int permits = Math.max(1, maxConcurrency);
        this.concurrencySemaphore = new Semaphore(permits);
    }

    public Optional<byte[]> tryGenerateSpeechForAvatar(String presenterId, String avatarValue, String text) {
        if (text == null || text.isBlank()) {
            return Optional.empty();
        }
        if (apiKey == null || apiKey.isBlank()) {
            return Optional.empty();
        }

        Optional<Resource> sample = findVoiceSample(avatarValue, presenterId);
        if (sample.isEmpty()) {
            return Optional.empty();
        }

        String sampleKey = sampleKeyFromResource(sample.get());
        if (sampleKey == null || sampleKey.isBlank()) {
            return Optional.empty();
        }

        Optional<String> voiceId = ensureVoiceIdForPresenter(presenterId, sampleKey, sample.get());
        if (voiceId.isEmpty()) {
            return Optional.empty();
        }

        return synthesize(voiceId.get(), text);
    }

    private Optional<Resource> findVoiceSample(String avatarValue, String presenterId) {
        String cacheKey = normalizeKey(avatarValue) + "|" + normalizeKey(presenterId);
        String cachedPath = samplePathCache.get(cacheKey);
        if (cachedPath != null) {
            if (cachedPath.isBlank()) {
                return Optional.empty();
            }
            Resource cached = new ClassPathResource(cachedPath);
            if (cached.exists() && cached.isReadable()) {
                return Optional.of(cached);
            }
        }

        String[] candidates = new String[] {
                normalizeKey(avatarValue),
                normalizeKey(presenterId),
                normalizeKey(avatarValue == null ? null : avatarValue.trim()),
        };

        String[] exts = new String[] {".wav", ".mp3", ".m4a", ".mp4"};
        for (String c : candidates) {
            if (c == null || c.isBlank()) continue;
            for (String ext : exts) {
                String path = "audio/" + c + ext;
                Resource r = new ClassPathResource(path);
                if (r.exists() && r.isReadable()) {
                    samplePathCache.put(cacheKey, path);
                    return Optional.of(r);
                }
            }
        }

        samplePathCache.put(cacheKey, "");
        return Optional.empty();
    }

    private Optional<String> ensureVoiceIdForPresenter(String presenterId, String sampleKey, Resource sample) {
        if (presenterId == null || presenterId.isBlank()) {
            return Optional.empty();
        }

        String presenterKey = presenterId.trim();
        String cached = voiceIdCacheByPresenterId.get(presenterKey);
        if (cached != null && !cached.isBlank()) {
            return Optional.of(cached);
        }

        try {
            Optional<DIDAvatar> db = didAvatarRepository.findByPresenterId(presenterKey);
            if (db.isPresent()) {
                DIDAvatar avatar = db.get();
                if (avatar.getElevenlabsVoiceId() != null && !avatar.getElevenlabsVoiceId().isBlank()) {
                    String voiceId = avatar.getElevenlabsVoiceId().trim();
                    voiceIdCacheByPresenterId.put(presenterKey, voiceId);
                    return Optional.of(voiceId);
                }

                Optional<String> created = createVoice(sampleKey, sample);
                if (created.isPresent()) {
                    avatar.setElevenlabsVoiceId(created.get());
                    didAvatarRepository.save(avatar);
                    voiceIdCacheByPresenterId.put(presenterKey, created.get());
                }
                return created;
            }

            // If avatar is not in DB, still try to create voice (best-effort)
            Optional<String> created = createVoice(sampleKey, sample);
            created.ifPresent(id -> voiceIdCacheByPresenterId.put(presenterKey, id));
            return created;
        } catch (Exception e) {
            logger.warn("ElevenLabs ensureVoiceId failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private Optional<String> createVoice(String sampleKey, Resource sample) {
        return withPermit(() -> {
            try {
            String name = "cemoca-" + sampleKey;

            MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
            form.add("name", name);

            ByteArrayResource fileResource = new ByteArrayResource(sample.getInputStream().readAllBytes()) {
                @Override
                public String getFilename() {
                    return (sampleKey + "-sample").replaceAll("[^a-zA-Z0-9._-]", "_") + guessExtension(sample);
                }
            };
            form.add("files", fileResource);

            String response = webClient.post()
                    .uri("/voices/add")
                    .header("xi-api-key", apiKey.trim())
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(BodyInserters.fromMultipartData(form))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(TIMEOUT)
                    .block();

            if (response == null || response.isBlank()) {
                return Optional.empty();
            }

            JsonNode root = objectMapper.readTree(response);
            String voiceId = null;
            if (root.has("voice_id")) {
                voiceId = root.get("voice_id").asText();
            } else if (root.has("id")) {
                voiceId = root.get("id").asText();
            }

            if (voiceId == null || voiceId.isBlank()) {
                return Optional.empty();
            }

            return Optional.of(voiceId);
            } catch (WebClientResponseException wce) {
            logger.warn("ElevenLabs createVoice failed: status={} body={}", wce.getStatusCode().value(), truncate(wce.getResponseBodyAsString(), 500));
            return Optional.empty();
            } catch (Exception e) {
            logger.warn("ElevenLabs createVoice failed: {}", e.getMessage());
            return Optional.empty();
            }
        });
    }

    private Optional<byte[]> synthesize(String voiceId, String text) {
        return withPermit(() -> {
            try {
            String payload = "{\"text\":" + toJsonString(text) + ",\"model_id\":" + toJsonString(ttsModel) + "}";

            return Optional.ofNullable(
                    webClient.post()
                            .uri(uriBuilder -> {
                                var b = uriBuilder.path("/text-to-speech/{voiceId}");
                                if (outputFormat != null && !outputFormat.isBlank()) {
                                    b = b.queryParam("output_format", outputFormat.trim());
                                }
                                return b.build(voiceId);
                            })
                            .header("xi-api-key", apiKey.trim())
                            .header(HttpHeaders.ACCEPT, "audio/mpeg")
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(payload)
                            .retrieve()
                            .bodyToMono(byte[].class)
                            .timeout(TIMEOUT)
                            .block()
            );
            } catch (WebClientResponseException wce) {
            logger.warn("ElevenLabs TTS failed: status={} body={}", wce.getStatusCode().value(), truncate(wce.getResponseBodyAsString(), 500));
            return Optional.empty();
            } catch (Exception e) {
            logger.warn("ElevenLabs TTS failed: {}", e.getMessage());
            return Optional.empty();
            }
        });
    }

    private <T> T withPermit(Supplier<T> work) {
        Semaphore sem = this.concurrencySemaphore;
        if (sem == null) {
            return work.get();
        }
        boolean acquired = false;
        try {
            acquired = sem.tryAcquire(Math.max(1, acquireTimeoutMs), TimeUnit.MILLISECONDS);
            if (!acquired) {
                return work.get();
            }
            return work.get();
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            return work.get();
        } finally {
            if (acquired) {
                sem.release();
            }
        }
    }

    private String sampleKeyFromResource(Resource r) {
        try {
            String filename = r.getFilename();
            if (filename == null) return null;
            int dot = filename.lastIndexOf('.');
            String base = dot > 0 ? filename.substring(0, dot) : filename;
            return normalizeKey(base);
        } catch (Exception e) {
            return null;
        }
    }

    private String normalizeKey(String raw) {
        if (raw == null) return null;
        String v = raw.trim().toLowerCase(Locale.ROOT);
        if (v.isEmpty()) return null;
        v = v.replaceAll("\\s+", "");
        v = v.replaceAll("[^a-z0-9_-]", "");
        return v;
    }

    private String guessExtension(Resource r) {
        String fn = r.getFilename();
        if (fn == null) return ".mp4";
        int dot = fn.lastIndexOf('.');
        if (dot < 0) return ".mp4";
        return fn.substring(dot);
    }

    private String toJsonString(String s) {
        if (s == null) return "\"\"";
        String escaped = s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
        return "\"" + escaped + "\"";
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        if (max <= 0) return "";
        if (s.length() <= max) return s;
        return s.substring(0, max);
    }
}
