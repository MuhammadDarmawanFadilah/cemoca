package com.shadcn.backend.service;

import com.shadcn.backend.dto.AuthResponse;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
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
        
        // Generate permanent token based on user data
        String token = generatePermanentToken(user);
        
        // Return simple user data for koperasi system
        log.info("Authentication successful for user: {}", username);
        return new AuthResponse(token, user, Long.MAX_VALUE); // Never expires
    }
      /**
     * Extract user ID from permanent token
     */
    public Long getUserIdFromToken(String token) {
        try {
            // Decode the token and extract user ID
            String decoded = new String(Base64.getDecoder().decode(token));
            String[] parts = decoded.split(":");
            if (parts.length >= 2) {
                return Long.parseLong(parts[0]);
            }
            return null;
        } catch (Exception e) {
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
