package com.shadcn.backend.controller;

import com.shadcn.backend.model.MessageTemplate;
import com.shadcn.backend.model.MessageTemplate.TemplateType;
import com.shadcn.backend.service.MessageTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/message-templates")
@RequiredArgsConstructor
public class MessageTemplateController {
    
    private final MessageTemplateService templateService;
    
    @GetMapping
    public ResponseEntity<List<MessageTemplate>> getAllTemplates() {
        return ResponseEntity.ok(templateService.getAllTemplates());
    }
    
    @GetMapping("/type/{type}")
    public ResponseEntity<List<MessageTemplate>> getTemplatesByType(@PathVariable String type) {
        TemplateType templateType = TemplateType.valueOf(type.toUpperCase());
        return ResponseEntity.ok(templateService.getTemplatesByType(templateType));
    }
    
    @GetMapping("/type/{type}/language/{languageCode}")
    public ResponseEntity<MessageTemplate> getTemplate(
            @PathVariable String type,
            @PathVariable String languageCode) {
        TemplateType templateType = TemplateType.valueOf(type.toUpperCase());
        return templateService.getTemplate(templateType, languageCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/type/{type}/default")
    public ResponseEntity<MessageTemplate> getDefaultTemplate(@PathVariable String type) {
        TemplateType templateType = TemplateType.valueOf(type.toUpperCase());
        MessageTemplate template = templateService.getDefaultTemplate(templateType);
        if (template != null) {
            return ResponseEntity.ok(template);
        }
        return ResponseEntity.notFound().build();
    }
    
    @GetMapping("/defaults")
    public ResponseEntity<Map<String, String>> getDefaultTemplates() {
        Map<String, String> defaults = new HashMap<>();
        
        MessageTemplate videoTemplate = templateService.getDefaultTemplate(TemplateType.VIDEO);
        MessageTemplate waTemplate = templateService.getDefaultTemplate(TemplateType.WHATSAPP);
        
        defaults.put("template", videoTemplate != null ? videoTemplate.getTemplate() : "");
        defaults.put("waTemplate", waTemplate != null ? waTemplate.getTemplate() : "");
        
        return ResponseEntity.ok(defaults);
    }
    
    @GetMapping("/languages")
    public ResponseEntity<Map<String, Object>> getAvailableLanguages() {
        List<MessageTemplate> videoTemplates = templateService.getTemplatesByType(TemplateType.VIDEO);
        List<MessageTemplate> waTemplates = templateService.getTemplatesByType(TemplateType.WHATSAPP);
        List<MessageTemplate> pdfTemplates = templateService.getTemplatesByType(TemplateType.PDF);
        List<MessageTemplate> waPdfTemplates = templateService.getTemplatesByType(TemplateType.WHATSAPP_PDF);
        
        Map<String, Object> result = new HashMap<>();
        result.put("video", videoTemplates.stream()
                .map(t -> Map.of(
                        "code", t.getLanguageCode(),
                        "name", t.getLanguageName(),
                        "isDefault", t.getIsDefault()
                ))
                .toList());
        result.put("whatsapp", waTemplates.stream()
                .map(t -> Map.of(
                        "code", t.getLanguageCode(),
                        "name", t.getLanguageName(),
                        "isDefault", t.getIsDefault()
                ))
                .toList());
        result.put("pdf", pdfTemplates.stream()
                .map(t -> Map.of(
                        "code", t.getLanguageCode(),
                        "name", t.getLanguageName(),
                        "isDefault", t.getIsDefault()
                ))
                .toList());
        result.put("whatsapp_pdf", waPdfTemplates.stream()
                .map(t -> Map.of(
                        "code", t.getLanguageCode(),
                        "name", t.getLanguageName(),
                        "isDefault", t.getIsDefault()
                ))
                .toList());
        
        return ResponseEntity.ok(result);
    }
    
    @PostMapping
    public ResponseEntity<MessageTemplate> createTemplate(@RequestBody MessageTemplate template) {
        return ResponseEntity.ok(templateService.saveTemplate(template));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<MessageTemplate> updateTemplate(
            @PathVariable Long id,
            @RequestBody UpdateTemplateRequest request) {
        return ResponseEntity.ok(templateService.updateTemplate(id, request.template(), request.isDefault()));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
        templateService.deleteTemplate(id);
        return ResponseEntity.ok().build();
    }
    
    public record UpdateTemplateRequest(String template, Boolean isDefault) {}
}
