package com.shadcn.backend.controller;

import com.shadcn.backend.dto.GeminiGenerateRequest;
import com.shadcn.backend.dto.GeminiGenerateResponse;
import com.shadcn.backend.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/gemini")
@CrossOrigin(originPatterns = "*", allowCredentials = "true", allowedHeaders = "*")
public class GeminiController {

    private final GeminiService geminiService;

    public GeminiController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generate(@RequestBody GeminiGenerateRequest request) {
        try {
            String prompt = request == null ? null : request.prompt();
            GeminiGenerateResponse res = geminiService.generate(prompt);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse(e.getMessage()));
        }
    }

    public record ErrorResponse(String error) {
    }
}
