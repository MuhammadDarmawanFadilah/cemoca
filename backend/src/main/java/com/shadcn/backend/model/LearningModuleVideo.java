package com.shadcn.backend.model;

import com.shadcn.backend.util.StringListJsonConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "learning_module_videos")
public class LearningModuleVideo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 160)
    private String code;

    @Column(name = "video_category", length = 16)
    private String videoCategory;

    @Column(length = 255)
    private String title;

    @Column(nullable = false, length = 8)
    private String duration;

    @Column(name = "share_scope", length = 32)
    private String shareScope;

    @Column(name = "created_by_company_name", length = 200)
    private String createdByCompanyName;

    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "intended_audience", columnDefinition = "LONGTEXT")
    private List<String> intendedAudience;

    @Convert(converter = StringListJsonConverter.class)
    @Column(name = "content_types", columnDefinition = "LONGTEXT")
    private List<String> contentTypes;

    @Column(name = "content_text", columnDefinition = "LONGTEXT")
    private String text;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public LearningModuleVideo() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getVideoCategory() {
        return videoCategory;
    }

    public void setVideoCategory(String videoCategory) {
        this.videoCategory = videoCategory;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public String getShareScope() {
        return shareScope;
    }

    public void setShareScope(String shareScope) {
        this.shareScope = shareScope;
    }

    public String getCreatedByCompanyName() {
        return createdByCompanyName;
    }

    public void setCreatedByCompanyName(String createdByCompanyName) {
        this.createdByCompanyName = createdByCompanyName;
    }

    public List<String> getIntendedAudience() {
        return intendedAudience;
    }

    public void setIntendedAudience(List<String> intendedAudience) {
        this.intendedAudience = intendedAudience;
    }

    public List<String> getContentTypes() {
        return contentTypes;
    }

    public void setContentTypes(List<String> contentTypes) {
        this.contentTypes = contentTypes;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
