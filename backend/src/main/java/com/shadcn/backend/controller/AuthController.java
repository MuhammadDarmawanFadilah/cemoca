package com.shadcn.backend.controller;

import com.shadcn.backend.dto.AuthRequest;
import com.shadcn.backend.dto.AuthResponse;
import com.shadcn.backend.dto.RegistrationRequest;
import com.shadcn.backend.model.User;
import com.shadcn.backend.service.AuthService;
import com.shadcn.backend.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    private final UserService userService;
      @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest authRequest) {
        try {
            log.debug("Login attempt for username: {}", authRequest.getUsername());
            AuthResponse response = authService.authenticate(authRequest.getUsername(), authRequest.getPassword());
            log.info("Successful login for username: {}", authRequest.getUsername());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.warn("Login failed for username: {} - {}", authRequest.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid username or password"));
        } catch (Exception e) {
            log.error("Login error for username: {}", authRequest.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Authentication failed"));
        }
    }
      @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        log.debug("Logout request received");
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
      @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String token) {
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
            
            log.debug("Retrieved current user: {}", user.getUsername());
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            log.error("Error getting current user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get user info"));
        }
    }
      @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                log.warn("Invalid or missing Authorization header for token refresh");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No valid token provided"));
            }
            
            String actualToken = token.substring(7); // Remove "Bearer " prefix
            AuthResponse response = authService.refreshToken(actualToken);
            
            log.debug("Token refreshed successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.warn("Token refresh failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid token"));
        } catch (Exception e) {
            log.error("Error refreshing token", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Token refresh failed"));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegistrationRequest request) {
        log.debug("Registration attempt for username: {}", request.getUsername());
        User user = userService.registerUser(request);
        log.info("Registration successful for username: {}", user.getUsername());

        Map<String, Object> userPayload = new HashMap<>();
        userPayload.put("id", user.getId());
        userPayload.put("username", user.getUsername());
        userPayload.put("fullName", user.getFullName());
        userPayload.put("email", user.getEmail());
        userPayload.put("status", user.getStatus());
        userPayload.put("ownerName", user.getOwnerName());
        userPayload.put("companyName", user.getCompanyName());
        userPayload.put("companyCode", user.getCompanyCode());
        userPayload.put("agencyRange", user.getAgencyRange());
        userPayload.put("reasonToUse", user.getReasonToUse());

        Map<String, Object> payload = new HashMap<>();
        payload.put("message", "Registration successful");
        payload.put("user", userPayload);

        return ResponseEntity.status(HttpStatus.CREATED).body(payload);
    }

    public record UpdateCompanyPhotoRequest(@NotBlank(message = "Photo filename is required") String photoFilename) {
    }

    @PutMapping("/me/company-photo")
    public ResponseEntity<?> updateCompanyPhoto(
            @RequestHeader(value = "Authorization", required = false) String token,
            @Valid @RequestBody UpdateCompanyPhotoRequest request
    ) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "No valid token provided"));
            }

            String actualToken = token.substring(7);
            User user = authService.getUserFromToken(actualToken);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid token"));
            }

            user.setAvatarUrl(request.photoFilename());
            User saved = userService.updateUser(user);

            Map<String, Object> payload = new HashMap<>();
            payload.put("message", "Company photo updated successfully");
            payload.put("user", saved);
            return ResponseEntity.ok(payload);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating company photo", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to update company photo"));
        }
    }

    @DeleteMapping("/me/company-photo")
    public ResponseEntity<?> removeCompanyPhoto(
            @RequestHeader(value = "Authorization", required = false) String token
    ) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "No valid token provided"));
            }

            String actualToken = token.substring(7);
            User user = authService.getUserFromToken(actualToken);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid token"));
            }

            user.setAvatarUrl(null);
            User saved = userService.updateUser(user);

            Map<String, Object> payload = new HashMap<>();
            payload.put("message", "Company photo removed successfully");
            payload.put("user", saved);
            return ResponseEntity.ok(payload);
        } catch (Exception e) {
            log.error("Error removing company photo", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to remove company photo"));
        }
    }
}
