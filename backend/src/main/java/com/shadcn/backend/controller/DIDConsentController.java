package com.shadcn.backend.controller;

import com.shadcn.backend.service.DIDService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Map;

@RestController
@RequestMapping("/api/did/consents")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.OPTIONS})
public class DIDConsentController {

    private final DIDService didService;

    public DIDConsentController(DIDService didService) {
        this.didService = didService;
    }

    public static class ResetConsentRequest {
        public String consentText;
    }


    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getConsent(@PathVariable String id) {
        return ResponseEntity.ok(didService.getConsent(id));
    }

    @GetMapping("/for-avatar/{avatarKey}")
    public ResponseEntity<Map<String, Object>> getConsentTextForAvatar(@PathVariable String avatarKey) {
        return ResponseEntity.ok(didService.getConsentForAvatarKey(avatarKey));
    }

    @GetMapping("/for-avatar/{avatarKey}/text")
    public ResponseEntity<String> getConsentTextForAvatarOnly(@PathVariable String avatarKey) {
        Map<String, Object> out = didService.getConsentForAvatarKey(avatarKey);
        Object t = out.get("consentText");
        String text = t == null ? "" : String.valueOf(t);
        return ResponseEntity.ok(text);
    }

    @PostMapping("/for-avatar/{avatarKey}/reset")
    public ResponseEntity<Map<String, Object>> resetConsentForAvatar(
            @PathVariable String avatarKey,
            @RequestBody ResetConsentRequest request,
            HttpServletRequest httpRequest
    ) {
        String remote = httpRequest == null ? null : httpRequest.getRemoteAddr();
        boolean localhost = remote != null && (remote.equals("127.0.0.1") || remote.equals("::1"));
        if (!localhost) {
            return ResponseEntity.status(403).body(Map.of("ok", false, "error", "Forbidden"));
        }

        String text = request == null ? null : request.consentText;
        return ResponseEntity.ok(didService.resetConsentForAvatarKey(avatarKey, text));
    }
}
