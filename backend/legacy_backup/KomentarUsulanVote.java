package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "komentar_usulan_vote")
@Data
@NoArgsConstructor
@AllArgsConstructor 
public class KomentarUsulanVote {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
      @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "komentar_id", nullable = false)
    private KomentarUsulan komentar;    @Column(name = "biografi_id")
    private Long biografiId;
    
    @Column(name = "user_name", length = 100)
    private String userName;
    
    @Column(name = "user_email", length = 100)
    private String userEmail = ""; // Legacy field with default empty value
    
    @Enumerated(EnumType.STRING)
    @Column(name = "vote_type", nullable = false)
    private VoteType voteType;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum VoteType {
        LIKE,
        DISLIKE
    }
    
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
