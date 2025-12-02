package com.shadcn.backend.controller;

import com.shadcn.backend.service.ForgotPasswordService;
import com.shadcn.backend.dto.ForgotPasswordRequest;
import com.shadcn.backend.dto.ForgotPasswordResponse;
import com.shadcn.backend.dto.ResetPasswordRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class ForgotPasswordController {

    private final ForgotPasswordService forgotPasswordService;

    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("Forgot password request received for identifier: {}", 
                request.getIdentifier().replaceAll("\\d(?=\\d{4})", "*"));
        
        ForgotPasswordResponse response = forgotPasswordService.processForgotPasswordRequest(request);
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ForgotPasswordResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("Reset password request received for token: {}...", 
                request.getToken().substring(0, Math.min(8, request.getToken().length())));
        
        ForgotPasswordResponse response = forgotPasswordService.resetPassword(request);
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/verify-reset-token")
    public ResponseEntity<ForgotPasswordResponse> verifyResetToken(@RequestParam String token) {
        log.info("Token verification request received for token: {}...", 
                token.substring(0, Math.min(8, token.length())));
        
        ForgotPasswordResponse response = forgotPasswordService.verifyResetToken(token);
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}