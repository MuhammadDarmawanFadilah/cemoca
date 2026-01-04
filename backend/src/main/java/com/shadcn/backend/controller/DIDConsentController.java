package com.shadcn.backend.controller;

import com.shadcn.backend.service.DIDService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/did/consents")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS})
public class DIDConsentController {

    private final DIDService didService;

    public DIDConsentController(DIDService didService) {
        this.didService = didService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createConsent(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(didService.createConsent(body));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getConsent(@PathVariable String id) {
        return ResponseEntity.ok(didService.getConsent(id));
    }

    @PostMapping("/new")
    public ResponseEntity<Map<String, Object>> createConsentDefault() {
        return ResponseEntity.ok(didService.createConsent(null));
    }

    @GetMapping("/for-avatar/{avatarKey}")
    public ResponseEntity<Map<String, Object>> getConsentTextForAvatar(@PathVariable String avatarKey) {
        Map<String, Object> out = new HashMap<>(didService.createConsent(null));
        out.put("avatarKey", avatarKey);
        return ResponseEntity.ok(out);
    }

    @GetMapping("/for-avatar/{avatarKey}/text")
    public ResponseEntity<String> getConsentTextForAvatarOnly(@PathVariable String avatarKey) {
        Map<String, Object> created = didService.createConsent(null);
        Object t = created.get("consentText");
        String text = t == null ? "" : String.valueOf(t);
        if (text.isBlank()) {
            return ResponseEntity.ok("");
        }
        return ResponseEntity.ok(text);
    }
}
