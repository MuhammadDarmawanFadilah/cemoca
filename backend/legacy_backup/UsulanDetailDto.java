package com.shadcn.backend.dto;

import com.shadcn.backend.model.Usulan;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
public class UsulanDetailDto {
    private Long id;
    private String judul;
    private String rencanaKegiatan;
    private LocalDate tanggalMulai;
    private LocalDate tanggalSelesai;
    private LocalDate durasiUsulan;
    private String gambarUrl;
    private String namaPengusul;
    private String emailPengusul;
    private Long jumlahUpvote;
    private Long jumlahDownvote;
    private Usulan.StatusUsulan status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Related data
    private List<KomentarSummaryDto> komentar;
    private List<VoteSummaryDto> votes;
    
    // Calculated fields
    private Long score;
    private Long sisaHari;
    private Boolean expired;
      @Data
    @NoArgsConstructor
    public static class KomentarSummaryDto {
        private Long id;
        private String konten;
        private String namaPengguna;
        private Long biografiId;
        private String replies;
        private LocalDateTime tanggalKomentar;
        private LocalDateTime updatedAt;
        private Integer likes;
        private Integer dislikes;
    }
    
    @Data
    @NoArgsConstructor
    public static class VoteSummaryDto {
        private Long id;
        private String emailVoter;
        private String namaVoter;
        private String tipeVote;
        private LocalDateTime createdAt;
    }
}
