package com.shadcn.backend.controller;

import com.shadcn.backend.service.DIDService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.InetAddress;
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

    private boolean isLoopback(String addr) {
        if (addr == null || addr.isBlank()) {
            return false;
        }
        try {
            return InetAddress.getByName(addr.trim()).isLoopbackAddress();
        } catch (Exception ignored) {
            return false;
        }
    }

    @PostMapping("/for-avatar/{avatarKey}/voice")
    public ResponseEntity<Map<String, Object>> setVoiceForAvatar(
            @PathVariable String avatarKey,
            @RequestBody(required = false) SetVoiceRequest request,
            @RequestParam(name = "voiceId", required = false) String voiceIdParam,
            @RequestParam(name = "voiceType", required = false) String voiceTypeParam,
            HttpServletRequest httpRequest
    ) {
        String remote = httpRequest == null ? null : httpRequest.getRemoteAddr();
        boolean localhost = isLoopback(remote);

        String xff = httpRequest == null ? null : httpRequest.getHeader("X-Forwarded-For");
        if (xff != null && !xff.trim().isBlank()) {
            String first = xff.split(",")[0].trim();
            boolean forwardedLocal = isLoopback(first);
            if (!forwardedLocal) {
                localhost = false;
            }
        }

        if (!localhost) {
            return ResponseEntity.status(403).body(Map.of("ok", false, "error", "Forbidden"));
        }

        String voiceId = request == null ? null : request.voiceId;
        String voiceType = request == null ? null : request.voiceType;
        if (voiceId == null || voiceId.isBlank()) {
            voiceId = voiceIdParam;
        }
        if (voiceType == null || voiceType.isBlank()) {
            voiceType = voiceTypeParam;
        }
        return ResponseEntity.ok(didService.setCustomVoiceForAvatarKey(avatarKey, voiceId, voiceType));
    }
}
