package com.shadcn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProvinsiResponseDTO {
    private Long id;
    private String kode;
    private String nama;
    private List<KotaResponseDTO> kotaList;
    private Integer kotaCount;
}
