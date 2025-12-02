package com.shadcn.backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "komentar_usulan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KomentarUsulan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Komentar tidak boleh kosong")
    @Size(max = 1000, message = "Komentar maksimal 1000 karakter")
    @Column(nullable = false, length = 1000)
    private String konten;
      @Column(name = "nama_pengguna", length = 100)
    private String namaPengguna;
    
    @Column(name = "biografi_id")
    private Long biografiId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usulan_id", nullable = false)
    @JsonBackReference
    private Usulan usulan;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @JsonBackReference("parent-child")
    private KomentarUsulan parentKomentar;
      @OneToMany(mappedBy = "parentKomentar", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<KomentarUsulan> replies;
    
    @Column(name = "tanggal_komentar", nullable = false, updatable = false)
    private LocalDateTime tanggalKomentar;
      @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "likes", nullable = false)
    private Integer likes = 0;
    
    @Column(name = "dislikes", nullable = false)
    private Integer dislikes = 0;
    
    @PrePersist
    protected void onCreate() {
        tanggalKomentar = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (likes == null) likes = 0;
        if (dislikes == null) dislikes = 0;
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
