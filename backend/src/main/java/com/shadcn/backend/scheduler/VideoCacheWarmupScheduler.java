package com.shadcn.backend.scheduler;

import com.shadcn.backend.entity.VideoReportItem;
import com.shadcn.backend.repository.VideoReportItemRepository;
import com.shadcn.backend.service.VideoReportService;
import com.shadcn.backend.util.VideoLinkEncryptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;

@Component
public class VideoCacheWarmupScheduler {

    private static final Logger logger = LoggerFactory.getLogger(VideoCacheWarmupScheduler.class);

    private final VideoReportItemRepository videoReportItemRepository;
    private final VideoReportService videoReportService;

    @Value("${app.video.cache.warmup.enabled:true}")
    private boolean enabled;

    @Value("${app.video.share-dir:${app.video.base-dir}/share}")
    private String videoShareDir;

    @Value("${app.video.cache.retention-days:30}")
    private int retentionDays;

    @Value("${app.video.cache.warmup.batch-size:50}")
    private int batchSize;

    public VideoCacheWarmupScheduler(VideoReportItemRepository videoReportItemRepository, VideoReportService videoReportService) {
        this.videoReportItemRepository = videoReportItemRepository;
        this.videoReportService = videoReportService;
    }

    @Scheduled(cron = "${app.video.cache.warmup-cron:0 */10 * * * *}")
    public void warmupMissingCachedVideos() {
        if (!enabled) {
            return;
        }
        if (retentionDays <= 0) {
            return;
        }
        if (batchSize <= 0) {
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

        try {
            Files.createDirectories(dir);
        } catch (Exception e) {
            return;
        }

        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);

        Page<VideoReportItem> page;
        try {
            page = videoReportItemRepository.findRecentDoneItemsForCacheWarmup(cutoff, PageRequest.of(0, batchSize));
        } catch (Exception e) {
            return;
        }

        if (page == null || page.isEmpty()) {
            return;
        }

        int enqueued = 0;
        for (VideoReportItem item : page.getContent()) {
            try {
                if (item == null || item.getVideoReport() == null || item.getVideoReport().getId() == null || item.getId() == null) {
                    continue;
                }
                String sourceUrl = item.getVideoUrl();
                if (sourceUrl == null || sourceUrl.isBlank()) {
                    continue;
                }

                String token = VideoLinkEncryptor.encryptVideoLinkShort(item.getVideoReport().getId(), item.getId());
                if (token == null || token.isBlank()) {
                    continue;
                }

                Path target = dir.resolve(token + ".mp4");
                boolean ok = false;
                try {
                    ok = Files.exists(target) && Files.isReadable(target) && Files.size(target) > 0;
                } catch (Exception ignore) {
                    ok = false;
                }

                if (ok) {
                    continue;
                }

                videoReportService.enqueueShareCacheDownloadIfNeeded(item.getVideoReport().getId(), item.getId(), sourceUrl);
                enqueued++;
            } catch (Exception ignore) {
                // best-effort
            }
        }

        if (enqueued > 0) {
            logger.info("[VIDEO CACHE] Warmup enqueued {} missing videos", enqueued);
        }
    }
}
