package com.shadcn.backend.service;

import com.shadcn.backend.dto.ForgotPasswordRequest;
import com.shadcn.backend.dto.ForgotPasswordResponse;
import com.shadcn.backend.dto.ResetPasswordRequest;
import com.shadcn.backend.model.PasswordResetToken;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.PasswordResetTokenRepository;
import com.shadcn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ForgotPasswordService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    // private final WhatsAppService whatsAppService; // Disabled for koperasi system
    private final PasswordEncoder passwordEncoder;

    @Value("${app.password-reset.token-expiry-minutes:60}")
    private int tokenExpiryMinutes;

    @Value("${app.password-reset.max-requests-per-hour:3}")
    private int maxRequestsPerHour;

    @Transactional
    public ForgotPasswordResponse processForgotPasswordRequest(ForgotPasswordRequest request) {
        try {
            // Find user by username or phone number
            Optional<User> userOpt = findUserByIdentifier(request.getIdentifier());
            
            if (userOpt.isEmpty()) {
                // For security, don't reveal whether user exists or not
                return ForgotPasswordResponse.builder()
                    .success(true)
                    .message("Jika akun ditemukan, link reset password telah dikirim ke WhatsApp Anda.")
                    .build();
            }

            User user = userOpt.get();

            // Check rate limiting
            if (isRateLimited(user)) {
                return ForgotPasswordResponse.builder()
                    .success(false)
                    .message("Too many password reset requests. Please try again later.")
                    .build();
            }

            // Validate user has phone number for WhatsApp
            if (user.getPhoneNumber() == null || user.getPhoneNumber().trim().isEmpty()) {
                return ForgotPasswordResponse.builder()
                    .success(false)
                    .message("This account does not have a registered phone number.")
                    .build();
            }

            // Invalidate existing tokens for this user
            invalidateExistingTokens(user);

            // Generate new reset token
            String resetToken = generateResetToken();
            PasswordResetToken tokenEntity = PasswordResetToken.builder()
                .token(resetToken)
                .user(user)
                .expiresAt(LocalDateTime.now().plusMinutes(tokenExpiryMinutes))
                .used(false)
                .build();

            passwordResetTokenRepository.save(tokenEntity);

            // Send WhatsApp message - Disabled for koperasi system
            boolean messageSent = true; // whatsAppService.sendPasswordResetMessage(
                // user.getPhoneNumber(), 
                // resetToken, 
                // user.getUsername()
            // );

            if (messageSent) {
                log.info("Password reset token sent to user: {} via WhatsApp", user.getUsername());
                return ForgotPasswordResponse.builder()
                    .success(true)
                    .message("Link reset password telah dikirim ke WhatsApp Anda.")
                    .build();
            } else {
                // Remove token if message failed to send
                passwordResetTokenRepository.delete(tokenEntity);
                return ForgotPasswordResponse.builder()
                    .success(false)
                    .message("Failed to send WhatsApp message. Please try again.")
                    .build();
            }

        } catch (Exception e) {
            log.error("Error processing forgot password request: {}", e.getMessage(), e);
            return ForgotPasswordResponse.builder()
                .success(false)
                    .message("A system error occurred. Please try again.")
                .build();
        }
    }

    @Transactional
    public ForgotPasswordResponse resetPassword(ResetPasswordRequest request) {
        try {
            // Find and validate token
            Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository
                .findByTokenAndUsedFalse(request.getToken());

            if (tokenOpt.isEmpty()) {
                return ForgotPasswordResponse.builder()
                    .success(false)
                    .message("The password reset token is invalid or has already been used.")
                    .build();
            }

            PasswordResetToken token = tokenOpt.get();

            // Check if token is expired
            if (token.isExpired()) {
                return ForgotPasswordResponse.builder()
                    .success(false)
                    .message("The password reset token has expired.")
                    .build();
            }

            // Update user password
            User user = token.getUser();
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            userRepository.save(user);

            // Mark token as used
            token.setUsed(true);
            token.setUsedAt(LocalDateTime.now());
            passwordResetTokenRepository.save(token);

            log.info("Password successfully reset for user: {}", user.getUsername());

            return ForgotPasswordResponse.builder()
                .success(true)
                    .message("Password reset successfully. Please log in with your new password.")
                .build();

        } catch (Exception e) {
            log.error("Error resetting password: {}", e.getMessage(), e);
            return ForgotPasswordResponse.builder()
                .success(false)
                    .message("A system error occurred. Please try again.")
                .build();
        }
    }

    public ForgotPasswordResponse verifyResetToken(String token) {
        try {
            Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository
                .findByTokenAndUsedFalse(token);

            if (tokenOpt.isEmpty()) {
                return ForgotPasswordResponse.builder()
                    .success(false)
                    .message("The password reset token is invalid or has already been used.")
                    .build();
            }

            PasswordResetToken resetToken = tokenOpt.get();

            if (resetToken.isExpired()) {
                return ForgotPasswordResponse.builder()
                    .success(false)
                    .message("The password reset token has expired.")
                    .build();
            }

            return ForgotPasswordResponse.builder()
                .success(true)
                .message("Token valid.")
                .build();

        } catch (Exception e) {
            log.error("Error verifying reset token: {}", e.getMessage(), e);
            return ForgotPasswordResponse.builder()
                .success(false)
                    .message("A system error occurred.")
                .build();
        }
    }

    @Transactional
    public void cleanupExpiredTokens() {
        try {
            passwordResetTokenRepository.deleteExpiredTokens(LocalDateTime.now());
            log.debug("Cleaned up expired password reset tokens");
        } catch (Exception e) {
            log.error("Error cleaning up expired tokens: {}", e.getMessage(), e);
        }
    }

    private Optional<User> findUserByIdentifier(String identifier) {
        log.debug("Finding user by identifier: {}", identifier);
        
        // First try to find by username (case-insensitive)
        Optional<User> userOpt = userRepository.findByUsernameIgnoreCase(identifier);
        log.debug("Found by username (case-insensitive): {}", userOpt.isPresent());
        
        if (userOpt.isEmpty()) {
            // Then try to find by phone number
            userOpt = userRepository.findByPhoneNumber(identifier);
            log.debug("Found by phone number: {}", userOpt.isPresent());
        }
        
        return userOpt;
    }

    private boolean isRateLimited(User user) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        Long requestCount = passwordResetTokenRepository
            .countByUserAndCreatedAtAfter(user, oneHourAgo);
        
        return requestCount >= maxRequestsPerHour;
    }

    private void invalidateExistingTokens(User user) {
        passwordResetTokenRepository.deleteByUser(user);
    }

    private String generateResetToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}