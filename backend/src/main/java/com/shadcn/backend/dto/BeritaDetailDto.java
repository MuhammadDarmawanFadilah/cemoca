package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BeritaDetailDto {
    private Long id;
    private String judul;
    private String ringkasan;
    private String konten;
    private String penulis;
    private Long penulisBiografiId;
    private Integer ringkasanWordCount;
    private String gambarUrl;
    private String mediaLampiran;
    private String status;
    private String kategori;
    private String tags;
    private Long jumlahView;
    private Long jumlahLike;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<KomentarSummaryDto> komentar;
      @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KomentarSummaryDto {
        private Long id;
        private String konten;
        private String namaPengguna;
        private Long biografiId;
        private String fotoPengguna;
        private LocalDateTime tanggalKomentar;
        private LocalDateTime updatedAt;
        private Integer likes;
        private Integer dislikes;
        private List<KomentarSummaryDto> replies;
    }
}
