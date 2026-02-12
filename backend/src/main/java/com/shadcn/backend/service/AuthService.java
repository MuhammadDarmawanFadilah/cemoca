package com.shadcn.backend.service;

import com.shadcn.backend.dto.AuthResponse;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Base64;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private void ensureCompanyIdentity(User user) {
        if (user == null) {
            return;
        }

        boolean changed = false;

        String ownerName = user.getOwnerName() == null ? null : user.getOwnerName().trim();
        String companyName = user.getCompanyName() == null ? null : user.getCompanyName().trim();
        String companyCode = user.getCompanyCode() == null ? null : user.getCompanyCode().trim();

        if (ownerName != null && !ownerName.equals(user.getOwnerName())) {
            user.setOwnerName(ownerName);
            changed = true;
        }

        if (companyName != null && !companyName.equals(user.getCompanyName())) {
            user.setCompanyName(companyName);
            changed = true;
        }

        if (companyName == null || companyName.isBlank()) {
            if (changed) {
                userRepository.save(user);
            }
            return;
        }

        if (companyCode != null && !companyCode.isBlank()) {
            if (changed) {
                userRepository.save(user);
            }
            return;
        }

        String normalized = companyName.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        if (normalized.isBlank()) {
            normalized = "COMPANY";
        }
        if (normalized.length() > 8) {
            normalized = normalized.substring(0, 8);
        }

        String next = null;
        for (int i = 0; i < 10; i++) {
            String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase(Locale.ROOT);
            String code = normalized + suffix;
            if (!userRepository.existsByCompanyCode(code)) {
                next = code;
                break;
            }
        }
        if (next == null) {
            next = normalized + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase(Locale.ROOT);
        }

        user.setCompanyCode(next);
        userRepository.save(user);
    }
      public AuthResponse authenticate(String username, String password) {
        log.debug("Attempting authentication for username: {}", username);
        
        Optional<User> userOpt = userRepository.findByUsernameOrEmail(username, username);
        
        if (userOpt.isEmpty()) {
            log.warn("User not found: {}", username);
            throw new RuntimeException("User not found");
        }
        
        User user = userOpt.get();
        
        if (!passwordEncoder.matches(password, user.getPassword())) {
            log.warn("Invalid password for user: {}", username);
            throw new RuntimeException("Invalid password");
        }
        
        if (user.getStatus() != User.UserStatus.ACTIVE) {
            log.warn("Inactive user attempted login: {}", username);
            throw new RuntimeException("User account is not active");
        }

        user.setLastAccessAt(LocalDateTime.now());
        userRepository.save(user);

        ensureCompanyIdentity(user);
        
        // Generate permanent token based on user data
        String token = generatePermanentToken(user);
        
        // Return user data with permanent token (never expires until logout)
        log.info("Authentication successful for user: {}", username);
        return new AuthResponse(token, user, Long.MAX_VALUE); // Token persistent sampai logout
    }
      /**
     * Extract user ID from permanent token
     */
    public Long getUserIdFromToken(String token) {
        try {
            // Decode the token and extract user ID
            String decoded = new String(Base64.getDecoder().decode(token), StandardCharsets.UTF_8);
            int idx = decoded.indexOf(':');
            if (idx <= 0) {
                return null;
            }
            return Long.parseLong(decoded, 0, idx, 10);
        } catch (IllegalArgumentException e) {
            log.debug("Failed to extract user ID from token", e);
            return null;
        }
    }
      /**
     * Get user from token - validate against database
     */
    public User getUserFromToken(String token) {
        Long userId = getUserIdFromToken(token);
        if (userId == null) {
            log.debug("Invalid token format");
            return null;
        }
        
        // Always validate against database to ensure user still exists and is active
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            log.debug("User not found for token: {}", userId);
            return null;
        }
        
        User user = userOpt.get();

        ensureCompanyIdentity(user);
        
        // Validate token signature
        String expectedToken = generatePermanentToken(user);
        if (!token.equals(expectedToken)) {
            log.debug("Token signature mismatch for user: {}", userId);
            return null;
        }
        
        // Check if user is still active
        if (user.getStatus() != User.UserStatus.ACTIVE) {
            log.debug("User not active: {}", userId);
            return null;
        }
        
        return user;
    }
      public AuthResponse refreshToken(String oldToken) {
        User user = getUserFromToken(oldToken);
        
        if (user == null) {
            log.warn("Invalid token for refresh");
            throw new RuntimeException("Invalid token");
        }
        
        // Generate new token (in case user data changed)
        String newToken = generatePermanentToken(user);
        
        // Return simple user data for koperasi system
        log.debug("Token refreshed for user: {}", user.getUsername());
        return new AuthResponse(newToken, user, Long.MAX_VALUE);
    }
    
    public void logout(String token) {
        // For permanent tokens, we don't need to track logout
        // Token validation will always check against database
    }
    
    private String generatePermanentToken(User user) {
        // Generate deterministic permanent token based on user data
        // This ensures same token for same user across server restarts
        String tokenData = user.getId() + ":" + user.getUsername() + ":" + user.getPassword().substring(0, 10);
        return Base64.getEncoder().encodeToString(tokenData.getBytes());
    }
}
