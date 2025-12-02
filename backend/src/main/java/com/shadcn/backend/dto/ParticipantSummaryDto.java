package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class ParticipantSummaryDto {
    private Long id;
    private String nama;
    private Boolean hadir;
    
    // Constructor for JPQL query
    public ParticipantSummaryDto(Long id, String nama, Boolean hadir) {
        this.id = id;
        this.nama = nama;
        this.hadir = hadir;
    }
}
