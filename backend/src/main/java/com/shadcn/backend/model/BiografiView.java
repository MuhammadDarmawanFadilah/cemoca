package com.shadcn.backend.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Model untuk tracking view/akses ke biografi alumni
 */
@Entity
@Table(name = "biografi_views")
public class BiografiView {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "biografi_id", nullable = false)
    private Long biografiId;
    
    @Column(name = "viewer_user_id")
    private Long viewerUserId;
    
    @Column(name = "viewer_ip_address", length = 45)
    private String viewerIpAddress;
    
    @Column(name = "user_agent", length = 500)
    private String userAgent;
    
    @Column(name = "viewer_name", length = 100)
    private String viewerName;
    
    @Column(name = "viewer_email", length = 100)
    private String viewerEmail;
    
    @CreationTimestamp
    @Column(name = "viewed_at", nullable = false)
    private LocalDateTime viewedAt;
    
    @Column(name = "session_id", length = 100)
    private String sessionId;
    
    @Column(name = "referrer", length = 500)
    private String referrer;
    
    @Column(name = "is_authenticated", nullable = false)
    private Boolean isAuthenticated = false;
    
    // Constructors
    public BiografiView() {}
    
    public BiografiView(Long biografiId) {
        this.biografiId = biografiId;
        this.isAuthenticated = false;
    }
    
    public BiografiView(Long biografiId, Long viewerUserId, String viewerName, String viewerEmail) {
        this.biografiId = biografiId;
        this.viewerUserId = viewerUserId;
        this.viewerName = viewerName;
        this.viewerEmail = viewerEmail;
        this.isAuthenticated = true;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getBiografiId() {
        return biografiId;
    }
    
    public void setBiografiId(Long biografiId) {
        this.biografiId = biografiId;
    }
    
    public Long getViewerUserId() {
        return viewerUserId;
    }
    
    public void setViewerUserId(Long viewerUserId) {
        this.viewerUserId = viewerUserId;
    }
    
    public String getViewerIpAddress() {
        return viewerIpAddress;
    }
    
    public void setViewerIpAddress(String viewerIpAddress) {
        this.viewerIpAddress = viewerIpAddress;
    }
    
    public String getUserAgent() {
        return userAgent;
    }
    
    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }
    
    public String getViewerName() {
        return viewerName;
    }
    
    public void setViewerName(String viewerName) {
        this.viewerName = viewerName;
    }
    
    public String getViewerEmail() {
        return viewerEmail;
    }
    
    public void setViewerEmail(String viewerEmail) {
        this.viewerEmail = viewerEmail;
    }
    
    public LocalDateTime getViewedAt() {
        return viewedAt;
    }
    
    public void setViewedAt(LocalDateTime viewedAt) {
        this.viewedAt = viewedAt;
    }
    
    public String getSessionId() {
        return sessionId;
    }
    
    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
    
    public String getReferrer() {
        return referrer;
    }
    
    public void setReferrer(String referrer) {
        this.referrer = referrer;
    }
    
    public Boolean getIsAuthenticated() {
        return isAuthenticated;
    }
    
    public void setIsAuthenticated(Boolean isAuthenticated) {
        this.isAuthenticated = isAuthenticated;
    }
}
