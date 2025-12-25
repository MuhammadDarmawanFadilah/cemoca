package com.shadcn.backend.controller;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import jakarta.servlet.http.HttpServletRequest;

@Controller
public class VideoShareController {

    @GetMapping(value = "/v/{token}", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String view(@PathVariable String token, HttpServletRequest request) {
        String ctx = request == null ? "" : request.getContextPath();
        if (ctx == null) {
            ctx = "";
        }

        String videoSrc = ctx + "/api/video-reports/stream/" + token + ".mp4";

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
            "    video { width: 100vw; height: 100vh; object-fit: cover; background: #000; }\n" +
                "  </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div class=\"wrap\">\n" +
            "    <video controls controlsList=\"nodownload\" autoplay playsinline preload=\"auto\" src=\"" + videoSrc + "\"></video>\n" +
                "  </div>\n" +
                "</body>\n" +
                "</html>\n";
    }
}
