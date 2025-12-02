package com.shadcn.backend.service;

import com.shadcn.backend.model.User;
import com.shadcn.backend.model.Biografi;
import com.shadcn.backend.dto.UserApprovalDto;
import com.shadcn.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserApprovalService {    
    private static final Logger logger = LoggerFactory.getLogger(UserApprovalService.class);
    
    @Value("${app.frontend.url}")
    private String frontendUrl;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private WhatsAppService whatsAppService;
    
    @Autowired
    private NotificationService notificationService;    /**
     * Get all users waiting for approval (public registration only)
     */
    @Transactional(readOnly = true)
    public List<UserApprovalDto> getUsersWaitingApproval() {
        List<User> users = userRepository.findByStatusAndPublicRegistrationWithBasicBiografi(User.UserStatus.WAITING_APPROVAL);
        return users.stream()
                .map(UserApprovalDto::fromUser)
                .collect(Collectors.toList());
    }
    
    /**
     * Get users waiting for approval with pagination (public registration only)
     */
    @Transactional(readOnly = true)
    public Page<UserApprovalDto> getUsersWaitingApprovalPaginated(int page, int size, String search, String sortBy, String sortDirection) {
        Sort.Direction direction = sortDirection.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(direction, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<User> userPage;
        if (search != null && !search.trim().isEmpty()) {
            userPage = userRepository.findByStatusAndSearchTermsAndPublicRegistrationWithBasicBiografi(
                User.UserStatus.WAITING_APPROVAL, search.trim(), pageable);
        } else {
            userPage = userRepository.findByStatusAndPublicRegistrationWithBasicBiografi(User.UserStatus.WAITING_APPROVAL, pageable);
        }
        
        return userPage.map(UserApprovalDto::fromUser);
    }
    
    /**
     * Approve a user registration
     */
    @Transactional
    public UserApprovalDto approveUser(Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOpt.get();
        
        if (user.getStatus() != User.UserStatus.WAITING_APPROVAL) {
            throw new RuntimeException("User is not waiting for approval");
        }
        
        // Update user status to active
        user.setStatus(User.UserStatus.ACTIVE);
          // Update biografi status if exists
        if (user.getBiografi() != null) {
            Biografi biografi = user.getBiografi();
            biografi.setStatus(Biografi.StatusBiografi.AKTIF);
        }
        
        User savedUser = userRepository.save(user);
        
        // Send WhatsApp notification
        try {
            String message = String.format(
                "Halo %s! 🎉\n\n" +
                "Selamat! Pendaftaran Anda sebagai alumni telah disetujui.\n\n" +
                "Anda sekarang dapat login ke sistem alumni menggunakan:\n" +
                "- Username: %s\n" +
                "- Password: (password yang Anda buat saat mendaftar)\n\n" +
                "Link login: " + frontendUrl + "/login\n\n" +
                "Selamat bergabung dengan komunitas alumni! 🎓",
                user.getFullName(),
                user.getUsername()
            );
            
            whatsAppService.sendMessage(user.getPhoneNumber(), message);
            logger.info("Approval notification sent to user: {}", user.getUsername());
        } catch (Exception e) {
            logger.error("Failed to send approval notification to user: {}", user.getUsername(), e);
        }
        
        // Create system notification
        try {
            notificationService.createNotification(
                user.getId(),
                "Pendaftaran Disetujui",
                "Selamat! Pendaftaran Anda sebagai alumni telah disetujui. Anda sekarang dapat menggunakan semua fitur sistem alumni."
            );
        } catch (Exception e) {
            logger.error("Failed to create approval notification for user: {}", user.getUsername(), e);
        }
        
        logger.info("User approved successfully: {}", user.getUsername());
        return UserApprovalDto.fromUser(savedUser);
    }
    
    /**
     * Reject a user registration
     */
    @Transactional
    public UserApprovalDto rejectUser(Long userId, String reason) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOpt.get();
        
        if (user.getStatus() != User.UserStatus.WAITING_APPROVAL) {
            throw new RuntimeException("User is not waiting for approval");
        }
        
        // Update user status to inactive
        user.setStatus(User.UserStatus.INACTIVE);
          // Update biografi status if exists
        if (user.getBiografi() != null) {
            Biografi biografi = user.getBiografi();
            biografi.setStatus(Biografi.StatusBiografi.TIDAK_AKTIF);
        }
        
        User savedUser = userRepository.save(user);
        
        // Send WhatsApp notification
        try {
            String message = String.format(
                "Halo %s,\n\n" +
                "Maaf, pendaftaran Anda sebagai alumni telah ditolak.\n\n" +
                "Alasan: %s\n\n" +
                "Jika ada pertanyaan atau Anda ingin mengajukan pendaftaran ulang, " +
                "silakan hubungi administrator.\n\n" +
                "Terima kasih.",
                user.getFullName(),
                reason != null ? reason : "Tidak memenuhi kriteria yang ditetapkan"
            );
            
            whatsAppService.sendMessage(user.getPhoneNumber(), message);
            logger.info("Rejection notification sent to user: {}", user.getUsername());
        } catch (Exception e) {
            logger.error("Failed to send rejection notification to user: {}", user.getUsername(), e);
        }
        
        logger.info("User rejected: {} - Reason: {}", user.getUsername(), reason);
        return UserApprovalDto.fromUser(savedUser);
    }
      /**
     * Get users waiting approval count (public registration only)
     */
    public long getUsersWaitingApprovalCount() {
        return userRepository.countByStatusAndPublicRegistration(User.UserStatus.WAITING_APPROVAL);
    }
    
    /**
     * Get approval statistics (public registration only)
     */
    @Transactional(readOnly = true)
    public Object getApprovalStatistics() {
        long waitingApproval = userRepository.countByStatusAndPublicRegistration(User.UserStatus.WAITING_APPROVAL);
        long activeUsers = userRepository.countByStatusAndPublicRegistration(User.UserStatus.ACTIVE);
        long inactiveUsers = userRepository.countByStatusAndPublicRegistration(User.UserStatus.INACTIVE);
        long suspendedUsers = userRepository.countByStatusAndPublicRegistration(User.UserStatus.SUSPENDED);
        long totalUsers = waitingApproval + activeUsers + inactiveUsers + suspendedUsers;
        
        return java.util.Map.of(
            "waitingApproval", waitingApproval,
            "activeUsers", activeUsers,
            "inactiveUsers", inactiveUsers,
            "suspendedUsers", suspendedUsers,
            "totalUsers", totalUsers,
            "approved", activeUsers,  // For frontend compatibility
            "rejected", inactiveUsers,  // For frontend compatibility
            "total", totalUsers  // For frontend compatibility
        );
    }
      /**
     * Get approved users with pagination (public registration only)
     */
    @Transactional(readOnly = true)
    public Page<UserApprovalDto> getApprovedUsersPaginated(int page, int size, String search, String sortBy, String sortDirection) {
        Sort.Direction direction = sortDirection.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(direction, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<User> userPage;
        if (search != null && !search.trim().isEmpty()) {
            userPage = userRepository.findByStatusAndSearchTermsAndPublicRegistrationWithBasicBiografi(
                User.UserStatus.ACTIVE, search.trim(), pageable);
        } else {
            userPage = userRepository.findByStatusAndPublicRegistrationWithBasicBiografi(User.UserStatus.ACTIVE, pageable);
        }
        
        return userPage.map(UserApprovalDto::fromUser);
    }
    
    /**
     * Get rejected users with pagination (public registration only)
     */
    @Transactional(readOnly = true)
    public Page<UserApprovalDto> getRejectedUsersPaginated(int page, int size, String search, String sortBy, String sortDirection) {
        Sort.Direction direction = sortDirection.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(direction, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<User> userPage;
        if (search != null && !search.trim().isEmpty()) {
            userPage = userRepository.findByStatusAndSearchTermsAndPublicRegistrationWithBasicBiografi(
                User.UserStatus.INACTIVE, search.trim(), pageable);
        } else {
            userPage = userRepository.findByStatusAndPublicRegistrationWithBasicBiografi(User.UserStatus.INACTIVE, pageable);
        }
        
        return userPage.map(UserApprovalDto::fromUser);
    }
    
    /**
     * Get all users with pagination (public registration only)
     */
    @Transactional(readOnly = true)
    public Page<UserApprovalDto> getAllUsersPaginated(int page, int size, String search, String sortBy, String sortDirection) {
        Sort.Direction direction = sortDirection.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(direction, sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<User> userPage;
        if (search != null && !search.trim().isEmpty()) {
            userPage = userRepository.findBySearchTermsAndPublicRegistrationWithBasicBiografi(search.trim(), pageable);
        } else {
            userPage = userRepository.findByPublicRegistrationWithBasicBiografi(pageable);
        }
        
        return userPage.map(UserApprovalDto::fromUser);
    }
}
