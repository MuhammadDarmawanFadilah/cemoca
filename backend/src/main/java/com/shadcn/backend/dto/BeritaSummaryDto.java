package com.shadcn.backend.dto;

import com.shadcn.backend.model.Berita;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class BeritaSummaryDto {
    private Long id;
    private String judul;
    private String ringkasan;
    private String penulis;
    private Long penulisBiografiId;
    private Integer ringkasanWordCount;
    private String gambarUrl;
    private String mediaLampiran;
    private Berita.StatusBerita status;
    private Berita.KategoriBerita kategori;
    private String tags;
    private Long jumlahView;
    private Long jumlahLike;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructor for easy mapping
    public BeritaSummaryDto(Long id, String judul, String ringkasan, String penulis, 
                           Long penulisBiografiId, Integer ringkasanWordCount, String gambarUrl, 
                           String mediaLampiran, Berita.StatusBerita status, Berita.KategoriBerita kategori, 
                           String tags, Long jumlahView, Long jumlahLike, 
                           LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.judul = judul;
        this.ringkasan = ringkasan;
        this.penulis = penulis;
        this.penulisBiografiId = penulisBiografiId;
        this.ringkasanWordCount = ringkasanWordCount;
        this.gambarUrl = gambarUrl;
        this.mediaLampiran = mediaLampiran;
        this.status = status;
        this.kategori = kategori;
        this.tags = tags;
        this.jumlahView = jumlahView;
        this.jumlahLike = jumlahLike;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
