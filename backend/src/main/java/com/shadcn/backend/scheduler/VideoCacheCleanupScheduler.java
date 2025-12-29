package com.shadcn.backend.scheduler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;

@Component
public class VideoCacheCleanupScheduler {

    private static final Logger logger = LoggerFactory.getLogger(VideoCacheCleanupScheduler.class);

    @Value("${app.video.share-dir:${app.video.base-dir}/share}")
    private String videoShareDir;

    @Value("${app.video.cache.retention-days:30}")
    private int retentionDays;

    @Scheduled(cron = "${app.video.cache.cleanup-cron:0 0 3 * * *}")
    public void cleanupOldCachedVideos() {
        if (retentionDays <= 0) {
            return;
        }
        if (videoShareDir == null || videoShareDir.isBlank()) {
            return;
        }

        Path dir;
        try {
            dir = Paths.get(videoShareDir);
        } catch (Exception e) {
            return;
        }

        if (!Files.exists(dir) || !Files.isDirectory(dir)) {
            return;
        }

        long cutoffMs = System.currentTimeMillis() - (retentionDays * 24L * 60L * 60L * 1000L);
        AtomicInteger deleted = new AtomicInteger(0);

        try (Stream<Path> stream = Files.list(dir)) {
            stream
                .filter(Files::isRegularFile)
                .forEach(p -> {
                    try {
                        String name = p.getFileName() == null ? "" : p.getFileName().toString();
                        if (!(name.endsWith(".mp4") || name.endsWith(".tmp"))) {
                            return;
                        }
                        long lastModified = Files.getLastModifiedTime(p).toMillis();
                        if (lastModified < cutoffMs) {
                            Files.deleteIfExists(p);
                            deleted.incrementAndGet();
                        }
                    } catch (Exception ignore) {
                    }
                });
        } catch (Exception e) {
            logger.warn("[VIDEO CACHE] Cleanup failed: {}", e.getMessage());
            return;
        }

        if (deleted.get() > 0) {
            logger.info("[VIDEO CACHE] Cleanup deleted {} files (retention {} days)", deleted.get(), retentionDays);
        }
    }
}
