package com.shadcn.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.shadcn.backend.model.VideoBackground;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class VideoBackgroundCompositeService {

    private final ImageService imageService;
    private final VideoBackgroundService videoBackgroundService;

    @Value("${app.video.ffmpeg.path:ffmpeg}")
    private String ffmpegPath;

    @Value("${app.video.chroma.key:0x00FF00}")
    private String chromaKey;

    @Value("${app.video.chroma.similarity:0.25}")
    private double chromaSimilarity;

    @Value("${app.video.chroma.blend:0.08}")
    private double chromaBlend;

    @Value("${app.video.chroma.timeout-minutes:8}")
    private long timeoutMinutes;

    public VideoBackgroundCompositeService(ImageService imageService, VideoBackgroundService videoBackgroundService) {
        this.imageService = imageService;
        this.videoBackgroundService = videoBackgroundService;
    }

    public Optional<String> compositeToStoredVideoUrl(String inputVideoUrl, String backgroundName, String publicBaseUrl, String serverContextPath) {
        if (inputVideoUrl == null || inputVideoUrl.isBlank()) {
            return Optional.empty();
        }
        if (backgroundName == null || backgroundName.isBlank()) {
            return Optional.empty();
        }

        BackgroundSource backgroundSource = resolveBackgroundSource(backgroundName);
        if (backgroundSource == null) {
            return Optional.empty();
        }

        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("video-bg-");

            Path inputVideoPath = tempDir.resolve("input.mp4");
            downloadToFile(inputVideoUrl, inputVideoPath);

            String bgExt = backgroundSource.getExtension();
            if (bgExt.isBlank()) {
                bgExt = "png";
            }
            Path backgroundPath = tempDir.resolve("background." + bgExt);
            backgroundSource.copyTo(backgroundPath);

            Path outputPath = tempDir.resolve("output.mp4");

            String filter = String.format(
                    Locale.ROOT,
                    "[0:v]chromakey=%s:%.3f:%.3f[fg];[1:v][fg]scale2ref[bg][fg2];[bg][fg2]overlay,format=yuv420p[v]",
                    chromaKey,
                    chromaSimilarity,
                    chromaBlend
            );

            List<String> cmd = new ArrayList<>();
            cmd.add(ffmpegPath);
            cmd.add("-y");
            cmd.add("-i");
            cmd.add(inputVideoPath.toString());
            cmd.add("-loop");
            cmd.add("1");
            cmd.add("-i");
            cmd.add(backgroundPath.toString());
            cmd.add("-filter_complex");
            cmd.add(filter);
            cmd.add("-map");
            cmd.add("[v]");
            cmd.add("-map");
            cmd.add("0:a?");
            cmd.add("-shortest");
            cmd.add("-c:v");
            cmd.add("libx264");
            cmd.add("-preset");
            cmd.add("veryfast");
            cmd.add("-crf");
            cmd.add("23");
            cmd.add("-c:a");
            cmd.add("aac");
            cmd.add("-b:a");
            cmd.add("128k");
            cmd.add("-movflags");
            cmd.add("+faststart");
            cmd.add(outputPath.toString());

            int exit = runProcess(cmd, Duration.ofMinutes(Math.max(1, timeoutMinutes)));
            if (exit != 0 || !Files.exists(outputPath)) {
                return Optional.empty();
            }

            String filename = UUID.randomUUID() + ".mp4";
            Path storedPath = imageService.getImagePath(filename);
            Files.createDirectories(storedPath.getParent());
            Files.copy(Files.newInputStream(outputPath), storedPath, StandardCopyOption.REPLACE_EXISTING);

            String base = publicBaseUrl == null ? "" : publicBaseUrl.trim();
            if (base.endsWith("/")) {
                base = base.substring(0, base.length() - 1);
            }

            String ctx = serverContextPath == null ? "" : serverContextPath.trim();
            if (ctx.isEmpty() || "/".equals(ctx)) {
                ctx = "";
            } else if (!ctx.startsWith("/")) {
                ctx = "/" + ctx;
            }
            if (ctx.endsWith("/")) {
                ctx = ctx.substring(0, ctx.length() - 1);
            }

            String url = base + ctx + "/api/images/" + filename;
            return Optional.of(url);
        } catch (Exception e) {
            log.warn("Video background composite failed: {}", e.getMessage());
            return Optional.empty();
        } finally {
            if (tempDir != null) {
                try {
                    deleteRecursive(tempDir);
                } catch (Exception ignored) {
                }
            }
        }
    }

    private void downloadToFile(String url, Path output) throws Exception {
        HttpClient client = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .connectTimeout(Duration.ofSeconds(30))
                .build();

        HttpRequest req = HttpRequest.newBuilder()
                .GET()
                .uri(URI.create(url))
                .timeout(Duration.ofMinutes(2))
                .build();

        HttpResponse<Path> resp = client.send(req, HttpResponse.BodyHandlers.ofFile(output));
        int code = resp.statusCode();
        if (code < 200 || code >= 300) {
            throw new IllegalStateException("Failed to download video, status=" + code);
        }
    }

    private int runProcess(List<String> command, Duration timeout) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true);
        Process p = pb.start();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Thread t = new Thread(() -> {
            try (InputStream in = p.getInputStream()) {
                in.transferTo(baos);
            } catch (Exception ignored) {
            }
        });
        t.setDaemon(true);
        t.start();

        boolean finished = p.waitFor(timeout.toMillis(), TimeUnit.MILLISECONDS);
        if (!finished) {
            p.destroyForcibly();
            throw new IllegalStateException("ffmpeg timeout");
        }

        int exit = p.exitValue();
        if (exit != 0) {
            String out = baos.toString(StandardCharsets.UTF_8);
            log.warn("ffmpeg exit={} output={}", exit, truncate(out, 4000));
        }
        return exit;
    }

    private String getFileExtension(String filename) {
        if (filename == null) {
            return "";
        }
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot >= filename.length() - 1) {
            return "";
        }
        return filename.substring(dot + 1).trim().toLowerCase(Locale.ROOT);
    }

    private void deleteRecursive(Path root) throws Exception {
        if (root == null || !Files.exists(root)) {
            return;
        }
        Files.walk(root)
                .sorted((a, b) -> b.getNameCount() - a.getNameCount())
                .forEach(p -> {
                    try {
                        Files.deleteIfExists(p);
                    } catch (Exception ignored) {
                    }
                });
    }

    private String truncate(String s, int max) {
        if (s == null) {
            return "";
        }
        if (s.length() <= max) {
            return s;
        }
        return s.substring(0, Math.max(0, max));
    }

    private BackgroundSource resolveBackgroundSource(String backgroundName) {
        if (backgroundName == null || backgroundName.isBlank()) {
            return null;
        }

        String safe = backgroundName.trim();
        if (safe.contains("..") || safe.contains("/") || safe.contains("\\")) {
            return null;
        }

        try {
            VideoBackground bg = videoBackgroundService.getByName(safe);
            String filePath = bg.getFilePath();
            if (filePath == null || filePath.isBlank()) {
                return null;
            }
            Path path = Paths.get(filePath);
            if (!Files.isRegularFile(path) || !Files.isReadable(path)) {
                return null;
            }
            String ext = getFileExtension(bg.getStoredFilename());
            if (ext.isBlank()) {
                ext = getFileExtension(bg.getOriginalFilename());
            }
            return new FileBackgroundSource(path, ext);
        } catch (Exception ignored) {
            return null;
        }
    }

    private interface BackgroundSource {
        void copyTo(Path target) throws Exception;

        String getExtension();
    }

    private static final class FileBackgroundSource implements BackgroundSource {
        private final Path path;

        private final String extension;

        private FileBackgroundSource(Path path, String extension) {
            this.path = path;
            this.extension = extension == null ? "" : extension;
        }

        @Override
        public void copyTo(Path target) throws Exception {
            Files.copy(Files.newInputStream(path), target, StandardCopyOption.REPLACE_EXISTING);
        }

        @Override
        public String getExtension() {
            return extension;
        }
    }
}
