package com.shadcn.backend.service;

import com.shadcn.backend.dto.InvitationRequest;
import com.shadcn.backend.dto.InvitationResponse;
import com.shadcn.backend.dto.PagedInvitationResponse;
import com.shadcn.backend.dto.RegistrationFromInvitationRequest;
import com.shadcn.backend.model.Invitation;
import com.shadcn.backend.model.User;
import com.shadcn.backend.model.Biografi;
import com.shadcn.backend.model.Role;
import com.shadcn.backend.repository.InvitationRepository;
import com.shadcn.backend.repository.UserRepository;
import com.shadcn.backend.repository.BiografiRepository;
import com.shadcn.backend.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class InvitationService {    
    
    @Value("${app.frontend.url}")
    private String frontendUrl;
    
    private final InvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final BiografiRepository biografiRepository;
    private final RoleRepository roleRepository;
    private final WhatsAppService whatsAppService;
    private final BiografiService biografiService;
    private final PasswordEncoder passwordEncoder;
    
    /**
     * Send invitation to alumni
     */
    public InvitationResponse sendInvitation(InvitationRequest request) {
        try {            // Format phone number for storage (keep in 08xxx format)
            String formattedPhone = whatsAppService.formatPhoneNumber(request.getNomorHp());
            
            // Check if user already exists with this phone number in both formats
            String phoneInPlusFormat = whatsAppService.formatPhoneNumberForWhatsApp(request.getNomorHp());
            Optional<User> existingUser = userRepository.findByPhoneNumber(formattedPhone);
            if (existingUser.isEmpty()) {
                existingUser = userRepository.findByPhoneNumber(phoneInPlusFormat);
            }
            if (existingUser.isPresent()) {
                throw new RuntimeException("Alumni dengan nomor HP ini sudah terdaftar");
            }
            
            // Check if there's already a valid invitation for this phone number in both formats
            if (invitationRepository.hasValidInvitation(formattedPhone, LocalDateTime.now()) ||
                invitationRepository.hasValidInvitation(phoneInPlusFormat, LocalDateTime.now())) {
                throw new RuntimeException("Undangan untuk nomor HP ini masih berlaku");
            }
            
            // Create new invitation
            Invitation invitation = new Invitation();
            invitation.setNamaLengkap(request.getNamaLengkap());
            invitation.setNomorHp(formattedPhone);
            invitation.setInvitationToken(generateInvitationToken());
            invitation.setStatus(Invitation.InvitationStatus.PENDING);
            invitation.setSentAt(LocalDateTime.now());
            invitation.setExpiresAt(LocalDateTime.now().plusDays(7));
            
            // Save invitation
            invitation = invitationRepository.save(invitation);
            
            // Send WhatsApp message
            try {
                String messageId = whatsAppService.sendInvitationMessage(
                    formattedPhone, 
                    request.getNamaLengkap(), 
                    invitation.getInvitationToken()
                );
                
                invitation.markAsSent(messageId);
                invitation = invitationRepository.save(invitation);
                
                log.info("Invitation sent successfully to {} ({})", 
                    request.getNamaLengkap(), formattedPhone);
                
            } catch (Exception e) {
                log.error("Failed to send WhatsApp message for invitation {}: {}", 
                    invitation.getId(), e.getMessage());
                invitation.markAsFailed();
                invitationRepository.save(invitation);
                throw new RuntimeException("Gagal mengirim pesan WhatsApp: " + e.getMessage());
            }
            
            return new InvitationResponse(invitation);
            
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error sending invitation: {}", e.getMessage());
            throw new RuntimeException("Terjadi kesalahan saat mengirim undangan");
        }
    }
    
    /**
     * Get invitation by token
     */
    public InvitationResponse getInvitationByToken(String token) {
        Optional<Invitation> invitation = invitationRepository.findByInvitationToken(token);
        if (invitation.isEmpty()) {
            throw new RuntimeException("Token undangan tidak valid");
        }
        
        Invitation inv = invitation.get();
        if (inv.isExpired()) {
            inv.markAsExpired();
            invitationRepository.save(inv);
            throw new RuntimeException("Token undangan sudah kadaluarsa");
        }
        
        if (inv.isUsed()) {
            throw new RuntimeException("Token undangan sudah digunakan");
        }
        
        return new InvitationResponse(inv);
    }
    
    /**
     * Register user from invitation
     */
    @Transactional
    public User registerFromInvitation(RegistrationFromInvitationRequest request) {
        try {
            // Validate invitation token
            Optional<Invitation> invitationOpt = invitationRepository.findByInvitationToken(request.getInvitationToken());
            if (invitationOpt.isEmpty()) {
                throw new RuntimeException("Token undangan tidak valid");
            }
            
            Invitation invitation = invitationOpt.get();
            if (!invitation.isValid()) {
                throw new RuntimeException("Token undangan tidak valid atau sudah kadaluarsa");
            }
            
            // Check if username already exists
            if (userRepository.findByUsername(request.getUsername()).isPresent()) {
                throw new RuntimeException("Username sudah digunakan");
            }
            
            // Check if email already exists
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new RuntimeException("Email sudah digunakan");
            }
            
            // Get alumni role
            Optional<Role> alumniRole = roleRepository.findByRoleName("ALUMNI");
            if (alumniRole.isEmpty()) {
                throw new RuntimeException("Role alumni tidak ditemukan");
            }
            
            // Create biografi first (populate with invitation data)
            request.getBiografiData().setNamaLengkap(invitation.getNamaLengkap());
            request.getBiografiData().setNomorTelepon(invitation.getNomorHp());
            Biografi biografi = biografiService.createBiografi(request.getBiografiData());
            
            // Create user
            User user = new User();
            user.setUsername(request.getUsername());
            user.setEmail(request.getEmail());
            user.setFullName(invitation.getNamaLengkap());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setPhoneNumber(invitation.getNomorHp());
            user.setRole(alumniRole.get());
            user.setBiografi(biografi);
            user.setStatus(User.UserStatus.ACTIVE);
            
            user = userRepository.save(user);
            
            // Mark invitation as used
            invitation.markAsUsed(user);
            invitationRepository.save(invitation);
            
            log.info("User registered successfully from invitation: {} ({})", 
                user.getUsername(), user.getFullName());
            
            return user;
            
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error registering user from invitation: {}", e.getMessage());
            throw new RuntimeException("Terjadi kesalahan saat mendaftar");
        }
    }
    
    /**
     * Get all invitations history with pagination support
     */
    public List<InvitationResponse> getAllInvitations() {
        List<Invitation> invitations = invitationRepository.findAllByOrderByCreatedAtDesc();
        return invitations.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
      /**
     * Get paginated invitations with filtering and sorting
     */
    public PagedInvitationResponse getInvitationHistory(
            int page, 
            int size, 
            String status, 
            String nama, 
            String phone,
            String sortBy,
            String sortDirection) {
        
        // Create sort direction
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = Sort.by(direction, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<Invitation> invitationPage;
        
        // Apply filters based on provided parameters
        if (status != null && nama != null && phone != null) {
            // All filters
            Invitation.InvitationStatus invitationStatus = Invitation.InvitationStatus.valueOf(status.toUpperCase());
            invitationPage = invitationRepository.findByStatusAndNamaLengkapContainingIgnoreCaseAndNomorHpContaining(
                invitationStatus, nama, phone, pageable);
        } else if (status != null && nama != null) {
            // Status and name filters
            Invitation.InvitationStatus invitationStatus = Invitation.InvitationStatus.valueOf(status.toUpperCase());
            invitationPage = invitationRepository.findByStatusAndNamaLengkapContainingIgnoreCase(
                invitationStatus, nama, pageable);
        } else if (status != null && phone != null) {
            // Status and phone filters
            Invitation.InvitationStatus invitationStatus = Invitation.InvitationStatus.valueOf(status.toUpperCase());
            invitationPage = invitationRepository.findByStatusAndNomorHpContaining(
                invitationStatus, phone, pageable);
        } else if (nama != null && phone != null) {
            // Name and phone filters
            invitationPage = invitationRepository.findByNamaLengkapContainingIgnoreCaseAndNomorHpContaining(
                nama, phone, pageable);
        } else if (status != null) {
            // Status filter only
            Invitation.InvitationStatus invitationStatus = Invitation.InvitationStatus.valueOf(status.toUpperCase());
            invitationPage = invitationRepository.findByStatus(invitationStatus, pageable);
        } else if (nama != null) {
            // Name filter only
            invitationPage = invitationRepository.findByNamaLengkapContainingIgnoreCase(nama, pageable);
        } else if (phone != null) {
            // Phone filter only
            invitationPage = invitationRepository.findByNomorHpContaining(phone, pageable);
        } else {
            // No filters
            invitationPage = invitationRepository.findAll(pageable);
        }
        
        // Convert to response with biography status
        List<InvitationResponse> content = invitationPage.getContent().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        
        // Create paginated response
        PagedInvitationResponse response = new PagedInvitationResponse();
        response.setContent(content);
        response.setPage(invitationPage.getNumber());
        response.setSize(invitationPage.getSize());
        response.setTotalElements(invitationPage.getTotalElements());
        response.setTotalPages(invitationPage.getTotalPages());
        response.setFirst(invitationPage.isFirst());
        response.setLast(invitationPage.isLast());
        response.setHasNext(invitationPage.hasNext());
        response.setHasPrevious(invitationPage.hasPrevious());
        
        return response;
    }
      /**
     * Convert Invitation to InvitationResponse with biography status
     */
    private InvitationResponse convertToResponse(Invitation invitation) {
        boolean hasBiografi = false;
        
        // Check if user exists and has biography
        if (invitation.getCreatedUser() != null) {
            Long userId = invitation.getCreatedUser().getId();
            hasBiografi = biografiRepository.existsBiografiByUserId(userId);
        }
        
        return new InvitationResponse(invitation, hasBiografi);
    }
    
    /**
     * Get invitation by ID
     */
    public InvitationResponse getInvitationById(Long id) {
        Optional<Invitation> invitation = invitationRepository.findById(id);
        if (invitation.isEmpty()) {
            throw new RuntimeException("Undangan tidak ditemukan");
        }
        return new InvitationResponse(invitation.get());
    }
    
    /**
     * Clean up expired invitations
     */
    @Transactional
    public int cleanupExpiredInvitations() {
        List<Invitation> expiredInvitations = invitationRepository.findExpiredInvitations(LocalDateTime.now());
        
        for (Invitation invitation : expiredInvitations) {
            invitation.markAsExpired();
        }
        
        if (!expiredInvitations.isEmpty()) {
            invitationRepository.saveAll(expiredInvitations);
            log.info("Marked {} invitations as expired", expiredInvitations.size());
        }
        
        return expiredInvitations.size();
    }
    
    /**
     * Generate unique invitation token
     */
    private String generateInvitationToken() {
        String token;
        do {
            token = UUID.randomUUID().toString().replace("-", "");
        } while (invitationRepository.findByInvitationToken(token).isPresent());
        
        return token;
    }
    
    /**
     * Get invitation statistics
     */
    public Object getInvitationStatistics() {
        long totalInvitations = invitationRepository.count();
        long pendingInvitations = invitationRepository.findByStatus(Invitation.InvitationStatus.PENDING).size();
        long sentInvitations = invitationRepository.findByStatus(Invitation.InvitationStatus.SENT).size();
        long usedInvitations = invitationRepository.findByStatus(Invitation.InvitationStatus.USED).size();
        long expiredInvitations = invitationRepository.findByStatus(Invitation.InvitationStatus.EXPIRED).size();
        long cancelledInvitations = invitationRepository.findByStatus(Invitation.InvitationStatus.CANCELLED).size();
        long todaysInvitations = invitationRepository.findTodaysInvitations().size();
        
        return java.util.Map.of(
            "total", totalInvitations,
            "pending", pendingInvitations,
            "sent", sentInvitations,
            "used", usedInvitations,
            "expired", expiredInvitations,
            "cancelled", cancelledInvitations,
            "today", todaysInvitations
        );
    }
    
    /**
     * Resend invitation
     */
    public InvitationResponse resendInvitation(Long invitationId) {
        Optional<Invitation> invitationOpt = invitationRepository.findById(invitationId);
        if (!invitationOpt.isPresent()) {
            throw new RuntimeException("Invitation not found");
        }
        
        Invitation invitation = invitationOpt.get();
        
        // Check if invitation can be resent
        if (invitation.isUsed() || invitation.isCancelled()) {
            throw new RuntimeException("Cannot resend invitation that has been used or cancelled");
        }
        
        try {
            // Reset status and send WhatsApp message
            invitation.setStatus(Invitation.InvitationStatus.PENDING);
            invitation.setSentAt(LocalDateTime.now());
            
            // Extend expiration if expired
            if (invitation.isExpired()) {
                invitation.setExpiresAt(LocalDateTime.now().plusDays(7));
            }
            
            // Send WhatsApp invitation
            String registrationLink = frontendUrl + "/register/invitation?token=" + invitation.getInvitationToken();
            String message = String.format(
                "Halo %s! 🎓\n\n" +
                "Anda diundang untuk bergabung dengan sistem alumni.\n\n" +
                "Klik link berikut untuk mendaftar:\n%s\n\n" +
                "Link akan expired dalam 7 hari.\n\n" +
                "Terima kasih!",
                invitation.getNamaLengkap(),
                registrationLink
            );
            
            String messageId = whatsAppService.sendMessage(invitation.getNomorHp(), message);
            invitation.markAsSent(messageId);
            
            Invitation savedInvitation = invitationRepository.save(invitation);
            log.info("Invitation resent successfully to: {}", invitation.getNomorHp());
            
            return convertToResponse(savedInvitation);
            
        } catch (Exception e) {
            log.error("Failed to resend invitation for: {}", invitation.getNomorHp(), e);
            invitation.markAsFailed();
            invitationRepository.save(invitation);
            throw new RuntimeException("Failed to resend invitation: " + e.getMessage());
        }
    }
    
    /**
     * Cancel invitation and send WhatsApp notification
     */
    public InvitationResponse cancelInvitation(Long invitationId) {
        Optional<Invitation> invitationOpt = invitationRepository.findById(invitationId);
        if (!invitationOpt.isPresent()) {
            throw new RuntimeException("Invitation not found");
        }
        
        Invitation invitation = invitationOpt.get();
        
        // Check if invitation can be cancelled
        if (invitation.isUsed()) {
            throw new RuntimeException("Cannot cancel invitation that has already been used");
        }
        
        if (invitation.isCancelled()) {
            throw new RuntimeException("Invitation is already cancelled");
        }
        
        try {
            // Mark as cancelled
            invitation.markAsCancelled();
            
            // Send WhatsApp cancellation notification
            String message = String.format(
                "Halo %s,\n\n" +
                "Undangan untuk bergabung dengan sistem alumni telah dibatalkan.\n\n" +
                "Jika ada pertanyaan, silakan hubungi administrator.\n\n" +
                "Terima kasih.",
                invitation.getNamaLengkap()
            );
            
            whatsAppService.sendMessage(invitation.getNomorHp(), message);
            
            Invitation savedInvitation = invitationRepository.save(invitation);
            log.info("Invitation cancelled successfully for: {}", invitation.getNomorHp());
            
            return convertToResponse(savedInvitation);
            
        } catch (Exception e) {
            log.error("Failed to cancel invitation for: {}", invitation.getNomorHp(), e);
            throw new RuntimeException("Failed to cancel invitation: " + e.getMessage());
        }
    }
  }
