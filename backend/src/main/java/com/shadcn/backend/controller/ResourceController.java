package com.shadcn.backend.controller;

import java.io.IOException;
import java.io.InputStream;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    @GetMapping("/video/{filename:.+}")
    public ResponseEntity<byte[]> getVideo(@PathVariable String filename) {
        try {
            Resource resource = new ClassPathResource("video/" + filename);
            if (!resource.exists()) {
                log.warn("Video not found: {}", filename);
                return ResponseEntity.notFound().build();
            }

            byte[] bytes = readResourceBytes(resource);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("video/mp4"));
            headers.setContentLength(bytes.length);
            
            return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
        } catch (IOException e) {
            log.error("Error reading video: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/background/{filename:.+}")
    public ResponseEntity<byte[]> getBackground(@PathVariable String filename) {
        try {
            Resource resource = new ClassPathResource("background/" + filename);
            if (!resource.exists()) {
                log.warn("Background not found: {}", filename);
                return ResponseEntity.notFound().build();
            }

            byte[] bytes = readResourceBytes(resource);
            HttpHeaders headers = new HttpHeaders();
            
            // Determine content type based on file extension
            String contentType = "image/jpeg";
            if (filename.endsWith(".png")) {
                contentType = "image/png";
            } else if (filename.endsWith(".gif")) {
                contentType = "image/gif";
            }
            
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentLength(bytes.length);
            
            return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
        } catch (IOException e) {
            log.error("Error reading background: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/audio/{filename:.+}")
    public ResponseEntity<byte[]> getAudio(@PathVariable String filename) {
        try {
            Resource resource = new ClassPathResource("audio/" + filename);
            if (!resource.exists()) {
                log.warn("Audio not found: {}", filename);
                return ResponseEntity.notFound().build();
            }

            byte[] bytes = readResourceBytes(resource);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
            headers.setContentLength(bytes.length);
            
            return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
        } catch (IOException e) {
            log.error("Error reading audio: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private byte[] readResourceBytes(Resource resource) throws IOException {
        try (InputStream inputStream = resource.getInputStream()) {
            return inputStream.readAllBytes();
        }
    }
}
