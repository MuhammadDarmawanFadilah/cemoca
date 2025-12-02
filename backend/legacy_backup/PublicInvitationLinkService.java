package com.shadcn.backend.service;

import com.shadcn.backend.model.PublicInvitationLink;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.PublicInvitationLinkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class PublicInvitationLinkService {
    
    private static final Logger logger = LoggerFactory.getLogger(PublicInvitationLinkService.class);
    
    @Autowired
    private PublicInvitationLinkRepository publicInvitationLinkRepository;
    
    /**
     * Generate a new public invitation link
     */
    public PublicInvitationLink generatePublicLink(String description, LocalDateTime expiresAt, Integer maxUses) {
        String linkToken = generateUniqueToken();
        
        PublicInvitationLink link = new PublicInvitationLink();
        link.setLinkToken(linkToken);
        link.setDescription(description);
        link.setExpiresAt(expiresAt);
        link.setMaxUses(maxUses);
        link.setStatus(PublicInvitationLink.LinkStatus.ACTIVE);
        
        PublicInvitationLink savedLink = publicInvitationLinkRepository.save(link);
        logger.info("Generated new public invitation link with token: {}", linkToken);
        
        return savedLink;
    }
    
    /**
     * Get public invitation link by token
     */
    public Optional<PublicInvitationLink> getByToken(String token) {
        return publicInvitationLinkRepository.findByLinkToken(token);
    }
    
    /**
     * Validate if public link is still valid for registration
     */
    public boolean isLinkValid(String token) {
        Optional<PublicInvitationLink> linkOpt = publicInvitationLinkRepository.findByLinkToken(token);
        if (!linkOpt.isPresent()) {
            return false;
        }
        
        PublicInvitationLink link = linkOpt.get();
        return link.isValid();
    }
    
    /**
     * Use public link (increment usage count)
     */
    public void usePublicLink(String token, User user) {
        Optional<PublicInvitationLink> linkOpt = publicInvitationLinkRepository.findByLinkToken(token);
        if (!linkOpt.isPresent()) {
            throw new RuntimeException("Public invitation link not found");
        }
        
        PublicInvitationLink link = linkOpt.get();
        if (!link.isValid()) {
            throw new RuntimeException("Public invitation link is no longer valid");
        }
        
        link.incrementUses();
        
        // Check if max uses reached and mark as inactive
        if (link.isMaxUsesReached()) {
            link.markAsInactive();
        }
        
        // Set user's public invitation link reference
        user.setPublicInvitationLink(link);
        
        publicInvitationLinkRepository.save(link);
        logger.info("Public invitation link used: {} (uses: {}/{})", 
                   token, link.getCurrentUses(), link.getMaxUses());
    }
    
    /**
     * Get all public invitation links
     */
    public List<PublicInvitationLink> getAllLinks() {
        return publicInvitationLinkRepository.findAllOrderByCreatedAtDesc();
    }
    
    /**
     * Get active public invitation links
     */
    public List<PublicInvitationLink> getActiveLinks() {
        return publicInvitationLinkRepository.findActiveLinks();
    }
    
    /**
     * Deactivate public invitation link
     */
    public PublicInvitationLink deactivateLink(Long linkId) {
        Optional<PublicInvitationLink> linkOpt = publicInvitationLinkRepository.findById(linkId);
        if (!linkOpt.isPresent()) {
            throw new RuntimeException("Public invitation link not found");
        }
        
        PublicInvitationLink link = linkOpt.get();
        link.markAsInactive();
        
        PublicInvitationLink savedLink = publicInvitationLinkRepository.save(link);
        logger.info("Public invitation link deactivated: {}", link.getLinkToken());
        
        return savedLink;
    }
    
    /**
     * Activate public invitation link
     */
    public PublicInvitationLink activateLink(Long linkId) {
        Optional<PublicInvitationLink> linkOpt = publicInvitationLinkRepository.findById(linkId);
        if (!linkOpt.isPresent()) {
            throw new RuntimeException("Public invitation link not found");
        }
        
        PublicInvitationLink link = linkOpt.get();
        link.setStatus(PublicInvitationLink.LinkStatus.ACTIVE);
        
        PublicInvitationLink savedLink = publicInvitationLinkRepository.save(link);
        logger.info("Public invitation link activated: {}", link.getLinkToken());
        
        return savedLink;
    }
    
    /**
     * Get public invitation link statistics
     */
    public Object getLinkStatistics() {
        long totalLinks = publicInvitationLinkRepository.count();
        long activeLinks = publicInvitationLinkRepository.countActiveLinks();
        
        return java.util.Map.of(
            "totalLinks", totalLinks,
            "activeLinks", activeLinks,
            "inactiveLinks", totalLinks - activeLinks
        );
    }
    
    /**
     * Generate unique token for public invitation link
     */
    private String generateUniqueToken() {
        String token;
        do {
            token = UUID.randomUUID().toString().replace("-", "");
        } while (publicInvitationLinkRepository.findByLinkToken(token).isPresent());
        
        return token;
    }
}
