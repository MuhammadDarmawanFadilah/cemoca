package com.shadcn.backend.dto;

import com.shadcn.backend.model.Pelaksanaan;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PelaksanaanFullDto {
    private Long id;
    private String status;
    private String catatan;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Usulan data - flattened to avoid circular references
    private UsulanBasicDto usulan;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsulanBasicDto {
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
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
    
    // Constructor from entity
    public PelaksanaanFullDto(Pelaksanaan pelaksanaan) {
        this.id = pelaksanaan.getId();
        this.status = pelaksanaan.getStatus().toString();
        this.catatan = pelaksanaan.getCatatan();
        this.createdAt = pelaksanaan.getCreatedAt();
        this.updatedAt = pelaksanaan.getUpdatedAt();
        
        if (pelaksanaan.getUsulan() != null) {
            this.usulan = new UsulanBasicDto(
                pelaksanaan.getUsulan().getId(),
                pelaksanaan.getUsulan().getJudul(),
                pelaksanaan.getUsulan().getRencanaKegiatan(),
                pelaksanaan.getUsulan().getTanggalMulai(),
                pelaksanaan.getUsulan().getTanggalSelesai(),
                pelaksanaan.getUsulan().getDurasiUsulan(),
                pelaksanaan.getUsulan().getGambarUrl(),
                pelaksanaan.getUsulan().getNamaPengusul(),
                pelaksanaan.getUsulan().getEmailPengusul(),
                pelaksanaan.getUsulan().getJumlahUpvote(),
                pelaksanaan.getUsulan().getJumlahDownvote(),
                pelaksanaan.getUsulan().getStatus().toString(),
                pelaksanaan.getUsulan().getCreatedAt(),
                pelaksanaan.getUsulan().getUpdatedAt()
            );
        }
    }
}
