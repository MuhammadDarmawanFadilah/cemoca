package com.shadcn.backend.controller;

import com.shadcn.backend.entity.VideoReportItem;
import com.shadcn.backend.repository.VideoReportItemRepository;
import com.shadcn.backend.util.VideoLinkEncryptor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import jakarta.servlet.http.HttpServletRequest;

@Controller
public class VideoShareController {

    private final VideoReportItemRepository videoReportItemRepository;

    public VideoShareController(VideoReportItemRepository videoReportItemRepository) {
        this.videoReportItemRepository = videoReportItemRepository;
    }

    @GetMapping(value = "/v/{token}", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String view(@PathVariable String token, HttpServletRequest request) {
        Long[] ids = VideoLinkEncryptor.decryptVideoLink(token);
        VideoReportItem item = null;
        if (ids != null && ids.length >= 2) {
            item = videoReportItemRepository.findByIdAndVideoReportId(ids[1], ids[0]);
        }

        String videoSrc = item == null ? null : item.getVideoUrl();
        if (videoSrc != null) {
            videoSrc = videoSrc.replace("\"", "&quot;");
        }

        String message = null;
        if (item == null) {
            message = "Link tidak valid atau video tidak ditemukan";
        } else if (videoSrc == null || videoSrc.isBlank()) {
            String status = item.getStatus();
            if ("PROCESSING".equals(status)) {
                message = "Video sedang diproses, silakan coba lagi nanti";
            } else if ("FAILED".equals(status)) {
                message = "Video gagal dibuat";
            } else {
                message = "Video belum tersedia";
            }
        }

        return "<!doctype html>\n" +
                "<html lang=\"id\">\n" +
                "<head>\n" +
                "  <meta charset=\"utf-8\">\n" +
                "  <meta name=\"viewport\" content=\"width=device-width, height=device-height, initial-scale=1, viewport-fit=cover\">\n" +
                "  <meta name=\"referrer\" content=\"no-referrer\">\n" +
                "  <title>Video</title>\n" +
                "  <style>\n" +
                "    html, body { width: 100%; height: 100%; margin: 0; padding: 0; background: #000; overflow: hidden; }\n" +
                "    .wrap { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: #000; }\n" +
                "    video { width: 100vw; height: 100vh; object-fit: contain; background: #000; }\n" +
                "    .msg { color: #fff; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 24px; text-align: center; }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div class=\"wrap\">\n" +
                (message == null
                        ? ("    <video controls controlsList=\"nodownload\" autoplay playsinline preload=\"auto\" src=\"" + videoSrc + "\"></video>\n")
                        : ("    <div class=\"msg\">" + message + "</div>\n")) +
                "  </div>\n" +
                "</body>\n" +
                "</html>\n";
    }
}
