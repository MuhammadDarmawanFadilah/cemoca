package com.shadcn.backend.controller;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.shadcn.backend.dto.ChatMessageRequest;
import com.shadcn.backend.model.ChatMessage;
import com.shadcn.backend.model.User;
import com.shadcn.backend.service.AuthService;
import com.shadcn.backend.service.ChatMessageService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    
    private final ChatMessageService chatMessageService;
    private final AuthService authService;
    
    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(
        @Valid @RequestBody ChatMessageRequest request,
        @RequestHeader(value = "Authorization", required = false) String token
    ) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                log.warn("Invalid or missing Authorization header");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No valid token provided"));
            }
            
            String actualToken = token.substring(7); // Remove "Bearer " prefix
            User user = authService.getUserFromToken(actualToken);
            
            if (user == null) {
                log.warn("Invalid token provided");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid token"));
            }
            
            ChatMessage chatMessage = chatMessageService.sendMessage(user, request);
            log.info("Chat message sent by user: {}", user.getUsername());
            return ResponseEntity.ok(chatMessage);
        } catch (Exception e) {
            log.error("Error sending chat message", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to send message"));
        }
    }
    
    @GetMapping("/messages")
    public ResponseEntity<Page<ChatMessage>> getAllMessages(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Page<ChatMessage> messages = chatMessageService.getAllMessages(page, size);
        return ResponseEntity.ok(messages);
    }
}
