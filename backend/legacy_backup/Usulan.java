package com.shadcn.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "usulan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usulan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
      @NotBlank(message = "Judul tidak boleh kosong")
    @Size(max = 200, message = "Judul maksimal 200 karakter")
    @Column(nullable = false, length = 200)
    private String judul;
      @NotBlank(message = "Rencana kegiatan tidak boleh kosong")
    @Lob
    @Column(name = "rencana_kegiatan", nullable = false, columnDefinition = "LONGTEXT")
    private String rencanaKegiatan;
    
    @NotNull(message = "Tanggal mulai tidak boleh kosong")
    @Column(name = "tanggal_mulai", nullable = false)
    private LocalDate tanggalMulai;
    
    @NotNull(message = "Tanggal selesai tidak boleh kosong")
    @Column(name = "tanggal_selesai", nullable = false)
    private LocalDate tanggalSelesai;
      @NotNull(message = "Durasi usulan tidak boleh kosong")
    @Column(name = "durasi_usulan", nullable = false)
    private LocalDate durasiUsulan;
    
    @Column(name = "gambar_url")
    private String gambarUrl;
    
    @Column(name = "nama_pengusul", nullable = false, length = 100)
    private String namaPengusul;
    
    @Column(name = "email_pengusul", length = 100)
    private String emailPengusul;
    
    @Column(name = "jumlah_upvote", nullable = false)
    private Long jumlahUpvote = 0L;
    
    @Column(name = "jumlah_downvote", nullable = false)
    private Long jumlahDownvote = 0L;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusUsulan status = StatusUsulan.AKTIF;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
      @OneToMany(mappedBy = "usulan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<KomentarUsulan> komentar;
    
    @OneToMany(mappedBy = "usulan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<VoteUsulan> votes;
      @OneToOne(mappedBy = "usulan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Pelaksanaan pelaksanaan;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Helper method untuk mengecek apakah usulan sudah lebih dari 5 hari
    public boolean isExpired() {
        return LocalDate.now().isAfter(durasiUsulan);
    }
    
    // Helper method untuk menghitung sisa hari
    public long getSisaHari() {
        LocalDate now = LocalDate.now();
        if (now.isAfter(durasiUsulan)) {
            return 0;
        }
        return java.time.temporal.ChronoUnit.DAYS.between(now, durasiUsulan);
    }
    
    // Helper method untuk menghitung total score (upvote - downvote)
    public long getScore() {
        return jumlahUpvote - jumlahDownvote;
    }
    
    public enum StatusUsulan {
        AKTIF, EXPIRED, DALAM_PELAKSANAAN, SELESAI
    }
}
