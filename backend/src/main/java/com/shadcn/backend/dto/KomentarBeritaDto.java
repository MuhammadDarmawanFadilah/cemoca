package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KomentarBeritaDto {
    private Long id;
    private String konten;
    private String namaPengguna;
    private Long biografiId;
    private LocalDateTime tanggalKomentar;
    private LocalDateTime updatedAt;
    private Integer likes = 0;
    private Integer dislikes = 0;
    private List<KomentarBeritaDto> replies;
    
    // Constructor without replies (for parent comments)
    public KomentarBeritaDto(Long id, String konten, String namaPengguna, Long biografiId, 
                            LocalDateTime tanggalKomentar, LocalDateTime updatedAt) {
        this.id = id;
        this.konten = konten;
        this.namaPengguna = namaPengguna;
        this.biografiId = biografiId;
        this.tanggalKomentar = tanggalKomentar;
        this.updatedAt = updatedAt;
        this.likes = 0;
        this.dislikes = 0;
    }
    
    // Constructor with likes and dislikes
    public KomentarBeritaDto(Long id, String konten, String namaPengguna, Long biografiId, 
                            LocalDateTime tanggalKomentar, LocalDateTime updatedAt, Integer likes, Integer dislikes) {
        this.id = id;
        this.konten = konten;
        this.namaPengguna = namaPengguna;
        this.biografiId = biografiId;
        this.tanggalKomentar = tanggalKomentar;
        this.updatedAt = updatedAt;
        this.likes = likes;
        this.dislikes = dislikes;
    }
}
