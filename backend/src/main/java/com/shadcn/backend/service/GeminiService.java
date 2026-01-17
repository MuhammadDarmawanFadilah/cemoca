package com.shadcn.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shadcn.backend.dto.GeminiGenerateResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class GeminiService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    private final String apiKey;
    private final String model;

        private static final Pattern MARKDOWN_BOLD = Pattern.compile("\\*\\*(.+?)\\*\\*");
        private static final Pattern SPEAKER_PREFIX = Pattern.compile(
            "^(?:PEMBICARA|NARATOR|NARRATOR|HOST|SPEAKER)\\s*:\\s*",
            Pattern.CASE_INSENSITIVE
        );
        private static final Pattern BULLET_PREFIX = Pattern.compile("^\\s*(?:[-*]|\\d+\\.)\\s+");
        private static final Pattern BRACKETED_LINE = Pattern.compile("^\\s*(?:\\([^)]*\\)|\\[[^\\]]*\\])\\s*$");
        private static final Pattern INLINE_SFX = Pattern.compile(
            "\\[(?:SFX|MUSIC|MUSIK|SOUND|AUDIO)[^\\]]*\\]",
            Pattern.CASE_INSENSITIVE
        );

    public GeminiService(
            ObjectMapper objectMapper,
            @Value("${gemini.api.key:}") String apiKey,
            @Value("${gemini.model:gemini-3}") String model
    ) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
        this.webClient = WebClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .build();
    }

    public GeminiGenerateResponse generate(String prompt) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("Missing gemini.api.key");
        }

        String safePrompt = prompt == null ? "" : prompt.trim();
        if (safePrompt.isEmpty()) {
            throw new IllegalArgumentException("Prompt is required");
        }

        String effectivePrompt = buildNarrationOnlyPrompt(safePrompt);

        Map<String, Object> body = new HashMap<>();
        body.put("contents", new Object[]{
            Map.of("parts", new Object[]{ Map.of("text", effectivePrompt) })
        });
        body.put("generationConfig", Map.of(
                "temperature", 0.7,
                "topP", 0.95
        ));

        String resolvedModel = resolveModel(model);

        String raw;
        try {
            raw = callGenerateContent(resolvedModel, body);
        } catch (WebClientResponseException e) {
            if (e.getStatusCode().value() == 404) {
                String fallback = discoverGenerateContentModel();
                if (fallback != null && !fallback.equalsIgnoreCase(resolvedModel)) {
                    try {
                        resolvedModel = fallback;
                        raw = callGenerateContent(resolvedModel, body);
                    } catch (WebClientResponseException retryEx) {
                        throw toSafeException(retryEx);
                    }
                } else {
                    throw toSafeException(e);
                }
            } else {
                throw toSafeException(e);
            }
        } catch (Exception e) {
            throw new IllegalStateException("Gemini request failed");
        }

        if (raw == null || raw.isBlank()) {
            return new GeminiGenerateResponse("", 0, 0.0, new GeminiGenerateResponse.EstimatedRange(0.0, 0.0), model);
        }

        String text = cleanGeneratedText(extractText(raw));
        int words = wordCount(text);

        double minutes = estimateMinutes(words, 140.0);
        double minRange = estimateMinutes(words, 160.0);
        double maxRange = estimateMinutes(words, 130.0);

        return new GeminiGenerateResponse(
                text,
                words,
                clamp(minutes, 0.0, 9999.0),
                new GeminiGenerateResponse.EstimatedRange(
                        clamp(minRange, 0.0, 9999.0),
                        clamp(maxRange, 0.0, 9999.0)
                ),
                resolvedModel
        );
    }

    public com.shadcn.backend.dto.GeminiTranslateResponse translate(
            String text,
            String targetLanguageCode,
            String targetLanguageName
    ) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            throw new IllegalStateException("Missing gemini.api.key");
        }

        String safeText = text == null ? "" : text.trim();
        if (safeText.isEmpty()) {
            throw new IllegalArgumentException("Text is required");
        }

        String lang = (targetLanguageName == null || targetLanguageName.trim().isEmpty())
                ? (targetLanguageCode == null ? "" : targetLanguageCode.trim())
                : targetLanguageName.trim();
        if (lang.isEmpty()) {
            throw new IllegalArgumentException("Target language is required");
        }

        String prompt = String.join("\n",
                "Anda adalah penerjemah profesional.",
                "Terjemahkan teks di bawah ini ke bahasa: " + lang + ".",
                "Aturan WAJIB:",
                "- Output hanya hasil terjemahan (tanpa penjelasan, tanpa markdown, tanpa tanda kutip).",
                "- Pertahankan placeholder persis sama, jangan diubah: token seperti :name, :linkvideo, atau pola :[A-Za-z0-9_]+.",
                "- Pertahankan baris baru (newline) sebisa mungkin.",
                "\nTEKS:",
                safeText
        );

        Map<String, Object> body = new HashMap<>();
        body.put("contents", new Object[]{
                Map.of("parts", new Object[]{Map.of("text", prompt)})
        });
        body.put("generationConfig", Map.of(
                "temperature", 0.2,
                "topP", 0.9
        ));

        String resolvedModel = resolveModel(model);

        String raw;
        try {
            raw = callGenerateContent(resolvedModel, body);
        } catch (WebClientResponseException e) {
            if (e.getStatusCode().value() == 404) {
                String fallback = discoverGenerateContentModel();
                if (fallback != null && !fallback.equalsIgnoreCase(resolvedModel)) {
                    try {
                        resolvedModel = fallback;
                        raw = callGenerateContent(resolvedModel, body);
                    } catch (WebClientResponseException retryEx) {
                        throw toSafeException(retryEx);
                    }
                } else {
                    throw toSafeException(e);
                }
            } else {
                throw toSafeException(e);
            }
        } catch (Exception e) {
            throw new IllegalStateException("Gemini request failed");
        }

        String out = raw == null ? "" : extractText(raw);
        out = cleanTranslationOutput(out);
        if (out.isEmpty()) {
            return new com.shadcn.backend.dto.GeminiTranslateResponse("", resolvedModel);
        }
        return new com.shadcn.backend.dto.GeminiTranslateResponse(out, resolvedModel);
    }

    private String resolveModel(String configuredModel) {
        if (configuredModel == null || configuredModel.trim().isEmpty()) {
            return "";
        }
        String m = configuredModel.trim();
        return m;
    }

    private String callGenerateContent(String modelId, Map<String, Object> body) {
        String effectiveModel = (modelId == null || modelId.isBlank()) ? "gemini" : modelId;
        String path = String.format(
                "/v1beta/models/%s:generateContent?key=%s",
                encode(effectiveModel),
                encode(apiKey)
        );

        return webClient.post()
                .uri(path)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

    private String discoverGenerateContentModel() {
        try {
            String path = String.format("/v1beta/models?key=%s", encode(apiKey));
            String raw = webClient.get().uri(path).retrieve().bodyToMono(String.class).block();
            if (raw == null || raw.isBlank()) return null;

            JsonNode root = objectMapper.readTree(raw);
            JsonNode models = root.path("models");
            if (!models.isArray()) return null;

            String bestFlash = null;
            String bestAny = null;

            for (JsonNode m : models) {
                String name = m.path("name").asText("");
                String id = normalizeModelId(name);
                if (id.isBlank()) continue;

                boolean supportsGenerate = false;
                JsonNode methods = m.path("supportedGenerationMethods");
                if (methods.isArray()) {
                    for (JsonNode method : methods) {
                        if ("generateContent".equalsIgnoreCase(method.asText(""))) {
                            supportsGenerate = true;
                            break;
                        }
                    }
                }
                if (!supportsGenerate) continue;

                String lower = id.toLowerCase();
                if (!lower.contains("gemini")) continue;

                if (bestAny == null) bestAny = id;
                if (bestFlash == null && lower.contains("flash")) {
                    bestFlash = id;
                }
            }

            return bestFlash != null ? bestFlash : bestAny;
        } catch (Exception ignored) {
            return null;
        }
    }

    private String normalizeModelId(String modelName) {
        if (modelName == null) return "";
        String n = modelName.trim();
        if (n.isEmpty()) return "";
        if (n.startsWith("models/")) {
            return n.substring("models/".length());
        }
        return n;
    }

    private IllegalStateException toSafeException(WebClientResponseException e) {
        String safeMsg = sanitizeError(e.getResponseBodyAsString());
        if (safeMsg == null || safeMsg.isBlank()) {
            safeMsg = "Gemini request failed (" + e.getStatusCode().value() + ")";
        }
        return new IllegalStateException(safeMsg);
    }

    private String sanitizeError(String msg) {
        if (msg == null) return null;
        return msg.replaceAll("(?i)key=([^&\\s\"]+)", "key=REDACTED");
    }

    private String buildNarrationOnlyPrompt(String userPrompt) {
        String base = userPrompt == null ? "" : userPrompt.trim();
        return String.join("\n",
                "Anda adalah penulis naskah narasi untuk video AI (Text-to-Video).",
                "Keluaran WAJIB hanya teks narasi yang akan diucapkan (spoken narration).",
                "Aturan output:",
                "- Jangan gunakan markdown (tanpa **bold**, tanpa judul, tanpa bullet/numbering).",
                "- Jangan tulis arahan panggung/aksi/suara/musik seperti (musik intro), [SFX], atau deskripsi visual.",
                "- Jangan tulis label pembicara seperti PEMBICARA:, HOST:, NARATOR:.",
                "- Jangan sertakan catatan/penjelasan tambahan. Hanya narasi final.",
                "- Gunakan bahasa sesuai instruksi yang ada di prompt pengguna.",
                "\nPermintaan pengguna:",
                base
        );
    }

    private String cleanGeneratedText(String text) {
        if (text == null) return "";

        String t = text.replace("\r\n", "\n").replace("\r", "\n");
        t = INLINE_SFX.matcher(t).replaceAll("").trim();

        String[] lines = t.split("\\n");
        List<String> kept = new ArrayList<>();

        for (String line : lines) {
            if (line == null) continue;
            String s = line.trim();
            if (s.isEmpty()) {
                kept.add("");
                continue;
            }

            if (BRACKETED_LINE.matcher(s).matches()) {
                continue;
            }

            s = SPEAKER_PREFIX.matcher(s).replaceFirst("");
            s = MARKDOWN_BOLD.matcher(s).replaceAll("$1");
            s = BULLET_PREFIX.matcher(s).replaceFirst("");

            kept.add(s);
        }

        // collapse excessive blank lines
        String joined = String.join("\n", kept);
        joined = joined.replaceAll("\\n{3,}", "\n\n").trim();
        return joined;
    }

    private String cleanTranslationOutput(String text) {
        if (text == null) {
            return "";
        }

        String t = text.replace("\r\n", "\n").replace("\r", "\n").trim();

        // Remove code fences if model returns them.
        if (t.startsWith("```")) {
            t = t.replaceAll("(?s)^```[a-zA-Z0-9_-]*\\n", "");
            t = t.replaceAll("(?s)\\n```$", "");
            t = t.trim();
        }

        // Remove surrounding quotes if any.
        if ((t.startsWith("\"") && t.endsWith("\"")) || (t.startsWith("'") && t.endsWith("'"))) {
            t = t.substring(1, t.length() - 1).trim();
        }

        return t;
    }

    private String extractText(String rawJson) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);
            JsonNode parts = root.path("candidates").path(0).path("content").path("parts");
            if (!parts.isArray()) return "";

            StringBuilder sb = new StringBuilder();
            for (JsonNode p : parts) {
                String t = p.path("text").asText("");
                if (t == null || t.isBlank()) continue;
                if (!sb.isEmpty()) sb.append("\n");
                sb.append(t);
            }
            return sb.toString().trim();
        } catch (Exception e) {
            return "";
        }
    }

    private int wordCount(String text) {
        if (text == null) return 0;
        String t = text.trim();
        if (t.isEmpty()) return 0;
        return t.split("\\s+").length;
    }

    private double estimateMinutes(int words, double wpm) {
        if (words <= 0) return 0.0;
        return words / wpm;
    }

    private double clamp(double v, double min, double max) {
        return Math.min(max, Math.max(min, v));
    }

    private String encode(String v) {
        if (v == null) return "";
        return java.net.URLEncoder.encode(v, StandardCharsets.UTF_8);
    }
}
