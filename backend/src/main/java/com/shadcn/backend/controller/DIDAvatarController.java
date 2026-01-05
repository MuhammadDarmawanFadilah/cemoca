package com.shadcn.backend.controller;

import com.shadcn.backend.service.DIDService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/did/avatars")
public class DIDAvatarController {

    private final DIDService didService;

    public DIDAvatarController(DIDService didService) {
        this.didService = didService;
    }

    public static class SetVoiceRequest {
        public String voiceId;
        public String voiceType;
    }

    @PostMapping("/for-avatar/{avatarKey}/voice")
    public ResponseEntity<Map<String, Object>> setVoiceForAvatar(
            @PathVariable String avatarKey,
            @RequestBody SetVoiceRequest request,
            HttpServletRequest httpRequest
    ) {
        String remote = httpRequest == null ? null : httpRequest.getRemoteAddr();
        boolean localhost = remote != null && (remote.equals("127.0.0.1") || remote.equals("::1"));
        if (!localhost) {
            return ResponseEntity.status(403).body(Map.of("ok", false, "error", "Forbidden"));
        }

        String voiceId = request == null ? null : request.voiceId;
        String voiceType = request == null ? null : request.voiceType;
        return ResponseEntity.ok(didService.setCustomVoiceForAvatarKey(avatarKey, voiceId, voiceType));
    }
}
