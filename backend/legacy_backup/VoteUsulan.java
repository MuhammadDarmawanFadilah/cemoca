package com.shadcn.backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "vote_usulan", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"usulan_id", "email_voter"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoteUsulan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usulan_id", nullable = false)
    @JsonBackReference
    private Usulan usulan;
    
    @Column(name = "email_voter", nullable = false, length = 100)
    private String emailVoter;
    
    @Column(name = "nama_voter", nullable = false, length = 100)
    private String namaVoter;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipeVote tipeVote;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public enum TipeVote {
        UPVOTE, DOWNVOTE
    }
}
