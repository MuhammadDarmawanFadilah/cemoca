package com.shadcn.backend.controller;

import com.shadcn.backend.model.BiografiView;
import com.shadcn.backend.service.AuthService;
import com.shadcn.backend.service.BiografiViewService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Controller untuk tracking dan mengelola view biografi
 */
@RestController
@RequestMapping("/api/biografi-views")
@CrossOrigin(origins = "${frontend.url}")
public class BiografiViewController {
    
    @Autowired
    private BiografiViewService biografiViewService;
    
    @Autowired
    private AuthService authService;
      /**
     * Track view biografi (dapat dipanggil otomatis saat akses detail biografi)
     */
    @PostMapping("/track/{biografiId}")
    public ResponseEntity<BiografiView> trackBiografiView(
            @PathVariable Long biografiId,
            @RequestBody(required = false) Map<String, Object> userInfo,
            HttpServletRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        
        BiografiView view;
        
        // Check if user is authenticated
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                Long userId = authService.getUserIdFromToken(token);
                if (userId != null) {
                    // Pass user info from request body if available
                    view = biografiViewService.trackAuthenticatedView(biografiId, userId, request, userInfo);
                } else {
                    view = biografiViewService.trackAnonymousView(biografiId, request);
                }
            } catch (Exception e) {
                view = biografiViewService.trackAnonymousView(biografiId, request);
            }
        } else {
            view = biografiViewService.trackAnonymousView(biografiId, request);
        }
        
        return ResponseEntity.ok(view);
    }
    
    /**
     * Get view history for specific biografi (admin only)
     */
    @GetMapping("/{biografiId}/history")
    public ResponseEntity<Page<BiografiView>> getBiografiViewHistory(
            @PathVariable Long biografiId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<BiografiView> history = biografiViewService.getBiografiViewHistory(biografiId, pageable);
        
        return ResponseEntity.ok(history);
    }
    
    /**
     * Get view statistics for biografi
     */
    @GetMapping("/{biografiId}/stats")
    public ResponseEntity<Map<String, Object>> getBiografiViewStats(@PathVariable Long biografiId) {
        Map<String, Object> stats = biografiViewService.getBiografiViewStats(biografiId);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get top viewed biografi
     */
    @GetMapping("/top-viewed")
    public ResponseEntity<List<Object[]>> getTopViewedBiografi(
            @RequestParam(defaultValue = "10") int limit) {
        
        Pageable pageable = PageRequest.of(0, limit);
        List<Object[]> topViewed = biografiViewService.getTopViewedBiografi(pageable);
        
        return ResponseEntity.ok(topViewed);
    }
    
    /**
     * Get recent view activity (admin dashboard)
     */
    @GetMapping("/recent-activity")
    public ResponseEntity<Page<BiografiView>> getRecentViewActivity(
            @RequestParam(defaultValue = "24") int hoursBack,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        LocalDateTime since = LocalDateTime.now().minusHours(hoursBack);
        Pageable pageable = PageRequest.of(page, size);
        Page<BiografiView> activity = biografiViewService.getRecentViewActivity(since, pageable);
        
        return ResponseEntity.ok(activity);
    }
    
    /**
     * Get user's view history (for authenticated users)
     */
    @GetMapping("/my-history")
    public ResponseEntity<List<BiografiView>> getMyViewHistory(
            @RequestHeader("Authorization") String authHeader) {
        
        try {
            String token = authHeader.substring(7);
            Long userId = authService.getUserIdFromToken(token);
              if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            List<BiografiView> history = biografiViewService.getUserViewHistory(userId);
            return ResponseEntity.ok(history);
              } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
}
