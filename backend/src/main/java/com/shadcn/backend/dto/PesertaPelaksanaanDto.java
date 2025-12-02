package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PesertaPelaksanaanDto {
    private Long id;
    private Boolean hadir;
    private String catatan;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private BiografiNestedDto biografi;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BiografiNestedDto {
        private Long biografiId;
        private String namaLengkap;
        private String nim;
        private String alumniTahun;
        private String email;
        private String nomorTelepon;
        private String foto;
        private String jenisKelamin;
        private String alamat;
        private String pekerjaanSaatIni;
    }
}
