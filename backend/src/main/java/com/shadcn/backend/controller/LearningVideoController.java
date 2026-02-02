package com.shadcn.backend.controller;

import com.shadcn.backend.dto.GeminiReviewResponse;
import com.shadcn.backend.dto.LearningVideoCreateRequest;
import com.shadcn.backend.dto.LearningVideoCreateResponse;
import com.shadcn.backend.dto.LearningVideoGetResponse;
import com.shadcn.backend.dto.LearningVideoPreviewStartRequest;
import com.shadcn.backend.dto.LearningVideoPreviewStartResponse;
import com.shadcn.backend.dto.LearningVideoPreviewStatusResponse;
import com.shadcn.backend.dto.LearningVideoPublicEditUpdateRequest;
import com.shadcn.backend.dto.LearningVideoRequestEditRequest;
import com.shadcn.backend.dto.LearningVideoRequestEditResponse;
import com.shadcn.backend.dto.LearningVideoReviewRequest;
import com.shadcn.backend.dto.LearningVideoTranslateAllRequest;
import com.shadcn.backend.dto.LearningVideoTranslateAllResponse;
import com.shadcn.backend.model.LearningVideoEditHistory;
import com.shadcn.backend.model.LearningVideoTextBundle;
import com.shadcn.backend.repository.LearningVideoTextBundleRepository;
import com.shadcn.backend.service.HeyGenService;
import com.shadcn.backend.service.LearningVideoService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/learning-videos")
public class LearningVideoController {

    private final LearningVideoService learningVideoService;
    private final LearningVideoTextBundleRepository repository;
    private final HeyGenService heyGenService;

    @Value("${learning.scheduler.heygen.avatar-name:}")
    private String heygenAvatarName;

    @Value("${learning.scheduler.heygen.avatar-id:}")
    private String heygenAvatarId;

    public LearningVideoController(
            LearningVideoService learningVideoService,
            LearningVideoTextBundleRepository repository,
            HeyGenService heyGenService
    ) {
        this.learningVideoService = learningVideoService;
        this.repository = repository;
        this.heyGenService = heyGenService;
    }

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search
    ) {
        try {
            Map<String, Object> res = learningVideoService.listPaginated(page, size, search);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Optional<LearningVideoGetResponse> res = learningVideoService.getById(id);
        return res.<ResponseEntity<?>>map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody LearningVideoCreateRequest request) {
        try {
            boolean success = learningVideoService.update(id, request);
            if (!success) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            boolean success = learningVideoService.delete(id);
            if (!success) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody LearningVideoCreateRequest request) {
        try {
            LearningVideoCreateResponse res = learningVideoService.create(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/{code}")
    public ResponseEntity<?> getByCode(@PathVariable String code) {
        Optional<LearningVideoGetResponse> res = learningVideoService.getByCode(code);
        return res.<ResponseEntity<?>>map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/translate-all")
    public ResponseEntity<?> translateAll(@RequestBody LearningVideoTranslateAllRequest request) {
        try {
            LearningVideoTranslateAllResponse res = learningVideoService.translateAll(request);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/review")
    public ResponseEntity<?> review(@RequestBody LearningVideoReviewRequest request) {
        try {
            String text = request == null ? null : request.text();
            String langCode = request == null ? null : request.inputLanguageCode();
            String langName = request == null ? null : request.inputLanguageName();

            GeminiReviewResponse res = learningVideoService.review(text, langCode, langName);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/preview")
    public ResponseEntity<?> startPreview(@RequestBody LearningVideoPreviewStartRequest request) {
        try {
            if (request == null) {
                return ResponseEntity.badRequest().body(new LearningVideoPreviewStartResponse(false, null, null, "Invalid request"));
            }

            String code = request.code() == null ? "" : request.code().trim();
            if (code.isBlank()) {
                return ResponseEntity.badRequest().body(new LearningVideoPreviewStartResponse(false, null, null, "Code is required"));
            }

            String lang = request.languageCode() == null ? "" : request.languageCode().trim();
            if (lang.isBlank()) {
                return ResponseEntity.badRequest().body(new LearningVideoPreviewStartResponse(false, null, null, "Language is required"));
            }

            LearningVideoTextBundle bundle = repository.findByCode(code).orElse(null);
            if (bundle == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new LearningVideoPreviewStartResponse(false, null, null, "Code not found"));
            }

            String script = learningVideoService.resolveTextForLanguage(bundle, lang);
            if (script == null || script.isBlank()) {
                return ResponseEntity.badRequest().body(new LearningVideoPreviewStartResponse(false, null, null, "Text for selected language is empty"));
            }

            String avatarId = resolveHeyGenAvatarId();
            if (avatarId == null || avatarId.isBlank()) {
                return ResponseEntity.badRequest().body(new LearningVideoPreviewStartResponse(false, null, null, "HeyGen avatar is not configured"));
            }

            Map<String, Object> created = heyGenService.generateAvatarVideo(
                    avatarId,
                    null,
                    script,
                    720,
                    1280,
                    false,
                    null,
                    null
            );

            String videoId = created == null || created.get("video_id") == null ? null : String.valueOf(created.get("video_id"));
            if (videoId == null || videoId.isBlank()) {
                return ResponseEntity.status(500).body(new LearningVideoPreviewStartResponse(false, null, null, "HeyGen returned empty video_id"));
            }

            return ResponseEntity.ok(new LearningVideoPreviewStartResponse(true, videoId, "processing", null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new LearningVideoPreviewStartResponse(false, null, null, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new LearningVideoPreviewStartResponse(false, null, null, e.getMessage()));
        }
    }

    @GetMapping("/preview/{videoId}")
    public ResponseEntity<?> previewStatus(@PathVariable String videoId) {
        try {
            if (videoId == null || videoId.isBlank()) {
                return ResponseEntity.badRequest().body(new LearningVideoPreviewStatusResponse(false, null, null, null, "Invalid videoId"));
            }

            Map<String, Object> status = heyGenService.getVideoStatus(videoId.trim());
            String s = status == null || status.get("status") == null ? null : String.valueOf(status.get("status"));
            String url = status == null || status.get("video_url") == null ? null : String.valueOf(status.get("video_url"));
            String err = status == null || status.get("error") == null ? null : String.valueOf(status.get("error"));

            return ResponseEntity.ok(new LearningVideoPreviewStatusResponse(true, videoId.trim(), s, url, err));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new LearningVideoPreviewStatusResponse(false, videoId, null, null, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new LearningVideoPreviewStatusResponse(false, videoId, null, null, e.getMessage()));
        }
    }

    private String resolveHeyGenAvatarId() {
        String name = heygenAvatarName == null ? "" : heygenAvatarName.trim();
        if (!name.isBlank()) {
            for (Map<String, Object> a : heyGenService.listAvatars()) {
                if (a == null) continue;
                String id = a.get("avatar_id") == null ? null : String.valueOf(a.get("avatar_id"));
                String display = a.get("display_name") == null ? null : String.valueOf(a.get("display_name"));
                String avatarName = a.get("avatar_name") == null ? null : String.valueOf(a.get("avatar_name"));

                if (id != null && id.equalsIgnoreCase(name)) {
                    return id;
                }
                if (display != null && display.trim().equalsIgnoreCase(name)) {
                    return id;
                }
                if (avatarName != null && avatarName.trim().equalsIgnoreCase(name)) {
                    return id;
                }
            }
        }

        return heygenAvatarId == null ? null : heygenAvatarId.trim();
    }
    
    @PostMapping("/{id}/request-edit")
    public ResponseEntity<?> requestEdit(@PathVariable Long id, @RequestBody LearningVideoRequestEditRequest request) {
        try {
            LearningVideoRequestEditResponse res = learningVideoService.requestEdit(id, request);
            if (!res.success()) {
                return ResponseEntity.badRequest().body(res);
            }
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new LearningVideoRequestEditResponse(false, null, e.getMessage()));
        }
    }
    
    @GetMapping("/edit/{token}")
    public ResponseEntity<?> getByToken(@PathVariable String token) {
        try {
            Optional<LearningVideoGetResponse> res = learningVideoService.getByToken(token);
            if (res.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Token not found or expired"));
            }
            
            // Include allowed languages in response
            Map<String, Object> response = Map.of(
                "video", res.get(),
                "allowedLanguages", learningVideoService.getAllowedLanguagesByToken(token)
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @PutMapping("/edit/{token}")
    public ResponseEntity<?> updateByToken(@PathVariable String token, @RequestBody LearningVideoPublicEditUpdateRequest request) {
        try {
            if (request == null || request.translations() == null) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Invalid request"));
            }
            
            boolean success = learningVideoService.updateByToken(token, request.translations());
            if (!success) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("Token not found or expired"));
            }
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse(e.getMessage()));
        }
    }
    
    @GetMapping("/{id}/history")
    public ResponseEntity<?> getEditHistory(@PathVariable Long id) {
        try {
            List<LearningVideoEditHistory> history = learningVideoService.getEditHistory(id);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ErrorResponse(e.getMessage()));
        }
    }

    public record ErrorResponse(String error) {
    }
}
