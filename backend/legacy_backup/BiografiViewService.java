package com.shadcn.backend.service;

import com.shadcn.backend.model.BiografiView;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.BiografiViewRepository;
import com.shadcn.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service untuk tracking view biografi alumni
 */
@Service
@Transactional
public class BiografiViewService {
    
    @Autowired
    private BiografiViewRepository biografiViewRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Track view dari user yang sudah login
     */
    public BiografiView trackAuthenticatedView(Long biografiId, Long userId, HttpServletRequest request) {
        try {
            // Get user details
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return trackAnonymousView(biografiId, request);
            }
            
            User user = userOpt.get();
            String sessionId = request.getSession().getId();
            
            // Check if this user already viewed this biografi in current session
            Optional<BiografiView> existingView = biografiViewRepository.findByBiografiIdAndSessionId(biografiId, sessionId);
            if (existingView.isPresent()) {
                return existingView.get(); // Don't create duplicate for same session
            }
            
            BiografiView view = new BiografiView(biografiId, userId, user.getFullName(), user.getEmail());
            view.setViewerIpAddress(getClientIpAddress(request));
            view.setUserAgent(request.getHeader("User-Agent"));
            view.setSessionId(sessionId);
            view.setReferrer(request.getHeader("Referer"));
            view.setIsAuthenticated(true);
            
            return biografiViewRepository.save(view);
        } catch (Exception e) {
            // Fallback to anonymous tracking if error occurs
            return trackAnonymousView(biografiId, request);
        }
    }
    
    /**
     * Track view dari user yang sudah login dengan user info dari frontend
     */
    public BiografiView trackAuthenticatedView(Long biografiId, Long userId, HttpServletRequest request, Map<String, Object> userInfo) {
        try {
            // Get user details
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return trackAnonymousView(biografiId, request);
            }
            
            User user = userOpt.get();
            String sessionId = request.getSession().getId();
            
            // Check if this user already viewed this biografi in current session
            Optional<BiografiView> existingView = biografiViewRepository.findByBiografiIdAndSessionId(biografiId, sessionId);
            if (existingView.isPresent()) {
                return existingView.get(); // Don't create duplicate for same session
            }
            
            // Use userInfo from frontend if available, otherwise fallback to database
            String userName = userInfo != null && userInfo.get("userName") != null ? 
                            userInfo.get("userName").toString() : user.getFullName();
            String userEmail = userInfo != null && userInfo.get("userEmail") != null ? 
                             userInfo.get("userEmail").toString() : user.getEmail();
            
            BiografiView view = new BiografiView(biografiId, userId, userName, userEmail);
            view.setViewerIpAddress(getClientIpAddress(request));
            view.setUserAgent(request.getHeader("User-Agent"));
            view.setSessionId(sessionId);
            view.setReferrer(request.getHeader("Referer"));
            view.setIsAuthenticated(true);
            
            return biografiViewRepository.save(view);
        } catch (Exception e) {
            // Fallback to anonymous tracking if error occurs
            return trackAnonymousView(biografiId, request);
        }
    }
    
    /**
     * Track view dari anonymous user
     */
    public BiografiView trackAnonymousView(Long biografiId, HttpServletRequest request) {
        String sessionId = request.getSession().getId();
        
        // Check if this session already viewed this biografi
        Optional<BiografiView> existingView = biografiViewRepository.findByBiografiIdAndSessionId(biografiId, sessionId);
        if (existingView.isPresent()) {
            return existingView.get(); // Don't create duplicate for same session
        }
        
        BiografiView view = new BiografiView(biografiId);
        view.setViewerIpAddress(getClientIpAddress(request));
        view.setUserAgent(request.getHeader("User-Agent"));
        view.setSessionId(sessionId);
        view.setReferrer(request.getHeader("Referer"));
        view.setIsAuthenticated(false);
        
        return biografiViewRepository.save(view);
    }
    
    /**
     * Get view history for specific biografi
     */
    public Page<BiografiView> getBiografiViewHistory(Long biografiId, Pageable pageable) {
        return biografiViewRepository.findByBiografiIdOrderByViewedAtDesc(biografiId, pageable);
    }
    
    /**
     * Get view statistics for biografi
     */
    public Map<String, Object> getBiografiViewStats(Long biografiId) {
        Map<String, Object> stats = new HashMap<>();
        
        // Total views
        long totalViews = biografiViewRepository.countByBiografiId(biografiId);
        stats.put("totalViews", totalViews);
        
        // Unique viewers
        long uniqueViewers = biografiViewRepository.countUniqueViewersByBiografiId(biografiId);
        stats.put("uniqueViewers", uniqueViewers);
        
        // Recent views (last 24 hours)
        LocalDateTime since24Hours = LocalDateTime.now().minusHours(24);
        List<BiografiView> recentViews = biografiViewRepository.findRecentViewsByBiografiId(biografiId, since24Hours);
        stats.put("recentViews24h", recentViews.size());
        
        // Authenticated vs Anonymous views
        List<Object[]> authStats = biografiViewRepository.getViewStatsByAuthentication(biografiId);
        long authenticatedViews = 0;
        long anonymousViews = 0;
        
        for (Object[] stat : authStats) {
            Boolean isAuth = (Boolean) stat[0];
            Long count = (Long) stat[1];
            if (Boolean.TRUE.equals(isAuth)) {
                authenticatedViews = count;
            } else {
                anonymousViews = count;
            }
        }
        
        stats.put("authenticatedViews", authenticatedViews);
        stats.put("anonymousViews", anonymousViews);
        
        return stats;
    }
    
    /**
     * Get top viewed biografi
     */
    public List<Object[]> getTopViewedBiografi(Pageable pageable) {
        return biografiViewRepository.getTopViewedBiografi(pageable);
    }
    
    /**
     * Get recent view activity for admin dashboard
     */
    public Page<BiografiView> getRecentViewActivity(LocalDateTime since, Pageable pageable) {
        return biografiViewRepository.findRecentViews(since, pageable);
    }
    
    /**
     * Get user's view history
     */
    public List<BiografiView> getUserViewHistory(Long userId) {
        return biografiViewRepository.findByViewerUserIdOrderByViewedAtDesc(userId);
    }
    
    /**
     * Extract client IP address from request
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedForHeader = request.getHeader("X-Forwarded-For");
        if (xForwardedForHeader == null) {
            return request.getRemoteAddr();
        } else {
            // X-Forwarded-For can contain multiple IPs, get the first one
            return xForwardedForHeader.split(",")[0].trim();
        }
    }
}
