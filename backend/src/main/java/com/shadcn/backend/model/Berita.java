package com.shadcn.backend.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "berita")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Berita {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Judul tidak boleh kosong")
    @Size(max = 200, message = "Judul maksimal 200 karakter")
    @Column(nullable = false, length = 200)
    private String judul;
    
    @NotBlank(message = "Ringkasan tidak boleh kosong")
    @Size(max = 500, message = "Ringkasan maksimal 500 karakter")
    @Column(nullable = false, length = 500)
    private String ringkasan;
    
    @NotBlank(message = "Konten tidak boleh kosong")
    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String konten;
      @Column(length = 100)
    private String penulis;
    
    @Column(name = "penulis_biografi_id")
    private Long penulisBiografiId;
    
    @Column(name = "ringkasan_word_count")
    private Integer ringkasanWordCount = 30;
    
    @Column(name = "gambar_url")
    private String gambarUrl;
    
    @Column(name = "media_lampiran", columnDefinition = "JSON")
    private String mediaLampiran; // JSON array untuk foto dan video
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusBerita status = StatusBerita.DRAFT;
      @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KategoriBerita kategori = KategoriBerita.UMUM;
    
    @Column(columnDefinition = "TEXT")
    private String tags;
    
    @Column(name = "jumlah_view", nullable = false)
    private Long jumlahView = 0L;
    
    @Column(name = "jumlah_like", nullable = false)
    private Long jumlahLike = 0L;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "berita", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<KomentarBerita> komentar;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum StatusBerita {
        DRAFT, PUBLISHED, ARCHIVED
    }
    
    public enum KategoriBerita {
        UMUM, AKADEMIK, KARIR, ALUMNI, TEKNOLOGI, OLAHRAGA, KEGIATAN
    }
}
