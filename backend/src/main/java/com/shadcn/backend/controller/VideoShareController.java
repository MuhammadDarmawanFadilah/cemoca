package com.shadcn.backend.controller;

import java.net.URI;
import java.nio.charset.StandardCharsets;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import org.springframework.web.util.UriUtils;

@Controller
public class VideoShareController {

    @GetMapping("/v/{token}")
    public ResponseEntity<Void> view(@PathVariable String token) {
        String safeToken = UriUtils.encodePathSegment(token == null ? "" : token, StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create("/v/" + safeToken));
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }
}
