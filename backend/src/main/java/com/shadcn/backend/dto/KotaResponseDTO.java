package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KotaResponseDTO {
    private Long id;
    private String kode;
    private String nama;
    private String tipe;
    private String provinsiNama;
}
