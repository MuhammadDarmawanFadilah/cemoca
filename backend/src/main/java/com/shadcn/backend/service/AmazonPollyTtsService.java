package com.shadcn.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.polly.PollyClient;
import software.amazon.awssdk.services.polly.model.Engine;
import software.amazon.awssdk.services.polly.model.OutputFormat;
import software.amazon.awssdk.services.polly.model.SynthesizeSpeechRequest;
import software.amazon.awssdk.services.polly.model.SynthesizeSpeechResponse;
import software.amazon.awssdk.services.polly.model.TextType;
import software.amazon.awssdk.services.polly.model.VoiceId;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AmazonPollyTtsService {
    private static final Logger logger = LoggerFactory.getLogger(AmazonPollyTtsService.class);

    private static final String SSML_XMLNS = "http://www.w3.org/2001/10/synthesis";
    private static final String AMAZON_SSML_XMLNS = "http://www.amazon.com/ssml";

    private static final int MAX_CHARS_PER_REQUEST = 2500;

    private static final Pattern P_BLOCK = Pattern.compile(
            "(?is)<\\s*p\\b[^>]*>.*?<\\s*/\\s*p\\s*>"
    );

    private final PollyClient polly;

    public AmazonPollyTtsService(
            @Value("${aws.region:us-east-1}") String awsRegion
    ) {
        this.polly = PollyClient.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    public byte[] synthesizeToMp3(String input, String voiceId) {
        if (input == null || input.isBlank()) {
            return new byte[0];
        }

        String effectiveVoiceId = (voiceId == null || voiceId.isBlank()) ? "Joanna" : voiceId.trim();

        List<String> chunks = splitIntoPollyChunks(input, MAX_CHARS_PER_REQUEST);
        logger.info("[POLLY] Synthesizing {} chunks with voice_id={}", chunks.size(), effectiveVoiceId);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        int index = 0;
        for (String chunk : chunks) {
            index++;
            byte[] mp3 = synthesizeChunkToMp3(chunk, effectiveVoiceId);
            try {
                out.write(mp3);
            } catch (IOException e) {
                throw new RuntimeException("Failed to append Polly audio chunk " + index, e);
            }
        }

        return out.toByteArray();
    }

    private byte[] synthesizeChunkToMp3(String chunk, String voiceId) {
        String safeChunk = chunk == null ? "" : chunk.trim();
        boolean isSsml = safeChunk.toLowerCase(Locale.ROOT).contains("<speak");

        if (isSsml) {
            safeChunk = normalizeSpeakNamespaces(safeChunk);
        }

        TextType textType = isSsml ? TextType.SSML : TextType.TEXT;

        List<Engine> enginesToTry = new ArrayList<>();
        enginesToTry.add(Engine.NEURAL);
        enginesToTry.add(Engine.STANDARD);

        RuntimeException last = null;
        for (Engine engine : enginesToTry) {
            try {
                SynthesizeSpeechRequest req = SynthesizeSpeechRequest.builder()
                        .outputFormat(OutputFormat.MP3)
                        .textType(textType)
                        .text(safeChunk)
                        .voiceId(VoiceId.fromValue(voiceId))
                        .engine(engine)
                        .build();

                ResponseInputStream<SynthesizeSpeechResponse> resp = polly.synthesizeSpeech(req);
                try {
                    return resp.readAllBytes();
                } finally {
                    try {
                        resp.close();
                    } catch (IOException ignored) {
                    }
                }
            } catch (Exception e) {
                String msg = e.getMessage() == null ? "" : e.getMessage();
                logger.warn("[POLLY] Synthesize failed engine={} msg={}", engine.toString(), msg);
                last = new RuntimeException("Polly synth failed engine=" + engine.toString() + ": " + msg, e);
            }
        }

        throw last == null ? new RuntimeException("Polly synth failed") : last;
    }

    private List<String> splitIntoPollyChunks(String input, int maxChars) {
        String trimmed = input.trim();

        if (trimmed.toLowerCase(Locale.ROOT).contains("<speak")) {
            trimmed = normalizeSpeakNamespaces(trimmed);
        }

        if (!trimmed.toLowerCase(Locale.ROOT).contains("<speak")) {
            return splitPlainText(trimmed, maxChars);
        }

        Matcher m = P_BLOCK.matcher(trimmed);
        List<String> pBlocks = new ArrayList<>();
        while (m.find()) {
            pBlocks.add(m.group());
        }

        if (pBlocks.isEmpty()) {
            List<String> plainChunks = splitPlainText(stripOuterSpeak(trimmed), maxChars);
            List<String> wrapped = new ArrayList<>(plainChunks.size());
            for (String s : plainChunks) {
                wrapped.add(wrapWithSpeakIfNeeded(s, trimmed));
            }
            return wrapped;
        }

        int firstPStart = trimmed.toLowerCase(Locale.ROOT).indexOf("<p");
        String header = firstPStart >= 0 ? trimmed.substring(0, firstPStart) : "<speak>";

        String footer = "";
        int lastPEnd = -1;
        Matcher m2 = P_BLOCK.matcher(trimmed);
        while (m2.find()) {
            lastPEnd = m2.end();
        }
        if (lastPEnd >= 0 && lastPEnd <= trimmed.length()) {
            footer = trimmed.substring(lastPEnd);
        }

        List<String> chunks = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        current.append(header);

        for (String p : pBlocks) {
            if (current.length() + p.length() + footer.length() > maxChars && current.length() > header.length()) {
                current.append(footer);
                chunks.add(current.toString());
                current = new StringBuilder();
                current.append(header);
            }
            current.append(p);
        }

        current.append(footer);
        chunks.add(current.toString());

        return chunks;
    }

    private static List<String> splitPlainText(String text, int maxChars) {
        String t = text == null ? "" : text.trim();
        if (t.isEmpty()) {
            return List.of();
        }

        List<String> chunks = new ArrayList<>();
        byte[] bytes = t.getBytes(StandardCharsets.UTF_8);
        if (bytes.length <= maxChars) {
            chunks.add(t);
            return chunks;
        }

        int start = 0;
        while (start < t.length()) {
            int end = Math.min(t.length(), start + maxChars);
            int lastSpace = t.lastIndexOf(' ', end);
            if (lastSpace > start + 200) {
                end = lastSpace;
            }
            chunks.add(t.substring(start, end).trim());
            start = end;
        }

        return chunks;
    }

    private static String stripOuterSpeak(String ssml) {
        String s = ssml == null ? "" : ssml.trim();
        String lower = s.toLowerCase(Locale.ROOT);
        int open = lower.indexOf("<speak");
        if (open >= 0) {
            int openEnd = lower.indexOf('>', open);
            if (openEnd >= 0) {
                s = s.substring(openEnd + 1);
                lower = s.toLowerCase(Locale.ROOT);
            }
        }
        int close = lower.lastIndexOf("</speak>");
        if (close >= 0) {
            s = s.substring(0, close);
        }
        return s.trim();
    }

    private static String wrapWithSpeakIfNeeded(String inner, String originalSsml) {
        String o = originalSsml == null ? "" : originalSsml.trim();
        if (o.toLowerCase(Locale.ROOT).contains("<speak")) {
            String normalized = normalizeSpeakNamespaces(o);
            int speakOpen = normalized.toLowerCase(Locale.ROOT).indexOf("<speak");
            int speakOpenEnd = normalized.indexOf('>', speakOpen);
            String speakOpenTag = speakOpenEnd > 0 ? normalized.substring(speakOpen, speakOpenEnd + 1) : "<speak xmlns=\"" + SSML_XMLNS + "\">";
            return speakOpenTag + "\n" + inner + "\n</speak>";
        }
        return "<speak xmlns=\"" + SSML_XMLNS + "\">\n" + inner + "\n</speak>";
    }

    private static String normalizeSpeakNamespaces(String ssml) {
        String s = ssml == null ? "" : ssml.trim();
        if (s.isEmpty()) {
            return s;
        }

        String lower = s.toLowerCase(Locale.ROOT);
        int speakOpen = lower.indexOf("<speak");
        if (speakOpen < 0) {
            return s;
        }

        int speakEnd = s.indexOf('>', speakOpen);
        if (speakEnd < 0) {
            return s;
        }

        String openTag = s.substring(speakOpen, speakEnd + 1);
        String openLower = openTag.toLowerCase(Locale.ROOT);

        boolean needsAmazon = lower.contains("<amazon:");

        StringBuilder updated = new StringBuilder(openTag.substring(0, openTag.length() - 1));

        if (!openLower.contains("xmlns=")) {
            updated.append(" xmlns=\"").append(SSML_XMLNS).append("\"");
        }
        if (needsAmazon && !openLower.contains("xmlns:amazon=")) {
            updated.append(" xmlns:amazon=\"").append(AMAZON_SSML_XMLNS).append("\"");
        }

        updated.append(">");

        return s.substring(0, speakOpen) + updated + s.substring(speakEnd + 1);
    }
}
